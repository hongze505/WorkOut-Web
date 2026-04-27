// 1. 綁定模式切換按鈕
const btnSimple = document.querySelector('[data-mode="basic"]')
const btnDetailed = document.querySelector('[data-mode="detail"]')
const bodyView = document.querySelector('.body-view')

function switchMode(activate, deactivate) {
  bodyView.classList.add('switching')
  setTimeout(() => {
    activate.classList.add('active')
    deactivate.classList.remove('active')
    resetAll()
    bodyView.classList.remove('switching')
  }, 300)
}

// 1-1. 簡易按鈕
btnSimple.addEventListener('click', () => {
  if (btnSimple.classList.contains('active')) return
  switchMode(btnSimple, btnDetailed)
})

// 1-2. 詳細按鈕
btnDetailed.addEventListener('click', () => {
  if (btnDetailed.classList.contains('active')) return
  switchMode(btnDetailed, btnSimple)
})


// 2. 綁定點擊肌肉按鈕
const musclePairs = document.querySelectorAll('[data-muscle]')

musclePairs.forEach(muscle => {
  // 2-1. hover 進入 → 正反面連動亮起
  muscle.addEventListener('mouseenter', () => {
    const muscleName = muscle.dataset.muscle
    const hoverLinked = MUSCLE_LINK[muscleName] || []
    hoverLinked.forEach(linkedName => {
      const linkedEl = document.querySelector(`[data-muscle="${linkedName}"]`)
      if (linkedEl) linkedEl.classList.add('is-hover-linked')
    })
  })

  // 2-2. hover 離開 → 移除正反面連動，但保留點擊連動
  muscle.addEventListener('mouseleave', () => {
    const muscleName = muscle.dataset.muscle
    const hoverLinked = MUSCLE_LINK[muscleName] || []
    hoverLinked.forEach(linkedName => {
      const linkedEl = document.querySelector(`[data-muscle="${linkedName}"]`)
      if (linkedEl) linkedEl.classList.remove('is-hover-linked')
    })
    // 2-2-1. 恢復點擊連動（如果目前有選中的肌肉）
    const clickLinked = MUSCLE_HOVER_LINK[selectedMuscle] || []
    clickLinked.forEach(linkedName => {
      const linkedEl = document.querySelector(`[data-muscle="${linkedName}"]`)
      if (linkedEl) linkedEl.classList.add('is-hover-linked')
    })
  })

  // 2-3. 點擊事件
  muscle.addEventListener('click', () => {
    const muscleName = muscle.dataset.muscle
    selectedMuscle = muscleName

    // 2-3-1. 先清除所有肌肉的 is-selected，再幫點擊的肌肉加上
    musclePairs.forEach(m => m.classList.remove('is-selected'))
    muscle.classList.add('is-selected')

    // 2-3-2. 清除舊的連動高亮
    musclePairs.forEach(m => m.classList.remove('is-hover-linked'))

    // 2-3-3. 同側成對肌肉一起顯示 is-selected（橘色）
    const linked = MUSCLE_HOVER_LINK[muscleName] || []
    linked.forEach(linkedName => {
      const linkedEl = document.querySelector(`[data-muscle="${linkedName}"]`)
      if (linkedEl) linkedEl.classList.add('is-selected')
    })

    // 2-3-4. 顯示肌肉名稱並渲染動作列表
    document.querySelector('#muscle-name').textContent = MUSCLE_LABELS[muscleName]
 
    renderExercises()

    // 2-3-5. 詳細模式 → 開啟彈窗
    if (btnDetailed.classList.contains('active')) {
      detailTitle.textContent = MUSCLE_LABELS[muscleName]
      detailBackdrop.style.display = 'flex'

      // 2-3-7. 清空彈窗內容
      const detailBody = document.querySelector('#detail-body')
      detailBody.innerHTML = ''

      // 2-3-8. 有細分圖就顯示
      if (DETAIL_SVG_CONFIGS && DETAIL_SVG_CONFIGS[muscleName]) {
        const detailLayout = createDetailLayout('請點選左側細分肌群')
        detailBody.appendChild(detailLayout.layout)

        // 2-3-8a. 互動細分 SVG（有子區域可點擊）
        const interactiveSvg = buildInteractiveSVG(muscleName, (regionKey, regionLabel) => {
          renderDetailSubExercises(detailLayout.actions, muscleName, regionKey, regionLabel)
        })
        if (interactiveSvg) detailLayout.figure.appendChild(interactiveSvg)
        detailBackdrop.style.display = 'flex'
      } else if (DETAIL_SVGS[muscleName]) {
        const detailLayout = createDetailLayout('此部位目前沒有可點選的細分肌群')
        detailBody.appendChild(detailLayout.layout)

        // 2-3-8b. 靜態細分圖（無互動）
        const svg = DETAIL_SVGS[muscleName]
        if (svg.viewBox) {
          fetch(svg.src)
            .then(res => res.text())
            .then(svgText => {
              const parser = new DOMParser()
              const doc = parser.parseFromString(svgText, 'image/svg+xml')
              const svgEl = doc.querySelector('svg')
              svgEl.setAttribute('viewBox', svg.viewBox)
              svgEl.setAttribute('style', `height:${svg.height}; width:${svg.width || 'auto'}; display:block; margin:0 auto`)
              detailLayout.figure.appendChild(svgEl)
            })
        } else {
          const img = document.createElement('img')
          img.src = svg.src
          img.alt = MUSCLE_LABELS[muscleName] || ''
          img.style.cssText = `height:${svg.height}; width:${svg.width || 'auto'}; display:block; margin:0 auto`
          detailLayout.figure.appendChild(img)
        }
        detailBackdrop.style.display = 'flex'
      }
    }
  })
})


// 3. 綁定器材按鈕
const equipmentBtns = document.querySelectorAll('.equipment-btn')
// 3-1. 改為陣列，支援多選
let selectedEquipment = []

equipmentBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const eq = btn.dataset.eq

    // 3-1-1. 已選 → 取消選取，從陣列移除
    if (selectedEquipment.includes(eq)) {
      selectedEquipment = selectedEquipment.filter(e => e !== eq)
      btn.classList.remove('active')
    } else {
      // 3-1-2. 未選 → 加入陣列
      selectedEquipment.push(eq)
      btn.classList.add('active')
    }

    // 3-1-3. 重新渲染動作列表
    renderExercises()
  })
})


// 4. 點擊肌肉後顯示動作列表
let selectedMuscle = ''

function createDetailLayout(emptyText) {
  const layout = document.createElement('div')
  layout.className = 'detail-layout'

  const figure = document.createElement('div')
  figure.className = 'detail-figure'

  const actions = document.createElement('aside')
  actions.className = 'detail-actions'
  actions.appendChild(createDetailEmpty(emptyText))

  layout.appendChild(figure)
  layout.appendChild(actions)

  return { layout, figure, actions }
}

function createDetailEmpty(text) {
  const empty = document.createElement('p')
  empty.className = 'detail-actions-empty'
  empty.textContent = text
  return empty
}

function renderExercises() {
  // 先宣告，再使用
  const list = document.querySelector('#exercise-list')
  const countEl = document.querySelector('#exercise-count')
  
  list.innerHTML = ''
  if (countEl) countEl.textContent = '—'

  if (!selectedMuscle) return

  const exercises = (EXERCISES[selectedMuscle] || []).filter(ex => ex.name && ex.name.trim())
  if (exercises.length === 0) {
    list.innerHTML = '<li class="exercise-empty">尚未建立動作資料</li>'
    return
  }

  if (btnSimple.classList.contains('active') && selectedEquipment.length === 0) {
    list.innerHTML = '<li class="exercise-empty">請選擇器材</li>'
    return
  }

  let filtered = selectedEquipment.length > 0
    ? exercises.filter(ex => selectedEquipment.includes(ex.equipment))
    : exercises

  if (filtered.length === 0) {
    list.innerHTML = '<li class="exercise-empty">此器材無對應動作</li>'
    return
  }

  // 通過所有判斷才更新數字
  if (countEl) countEl.textContent = filtered.length.toString().padStart(2, '0')

  const isSimple = btnSimple.classList.contains('active')
  const groups = selectedEquipment.length > 0
    ? selectedEquipment
    : [...new Set(filtered.map(ex => ex.equipment))]

  groups.forEach(eq => {
    const groupExercises = filtered.filter(ex => ex.equipment === eq)
    if (groupExercises.length === 0) return

    if (selectedEquipment.length > 1) {
      const header = document.createElement('li')
      header.className = 'exercise-group-header'
      header.textContent = EQUIPMENT_LABELS[eq] || eq
      list.appendChild(header)
    }

    groupExercises.forEach(ex => {
      const li = document.createElement('li')
      li.className = 'exercise-item'

      const starsHtml = Array.from({ length: 5 }, (_, i) =>
        `<span class="${i < (ex.difficulty || 0) ? 'ex-list-star--filled' : 'ex-list-star--empty'}">★</span>`
      ).join('')

      if (isSimple) {
        const url = `exercise.html?muscle=${selectedMuscle}&equipment=${ex.equipment}&name=${encodeURIComponent(ex.name)}`
        li.innerHTML = `
          <a class="exercise-name exercise-link" href="${url}">${ex.name}</a>
          <div class="ex-list-stars">${starsHtml}</div>
        `
      } else {
        li.innerHTML = `
          <span class="exercise-name">${ex.name}</span>
          <div class="ex-list-stars">${starsHtml}</div>
        `
      }
      list.appendChild(li)
    })
  })
}


// 5. 詳細按鈕彈窗


const detailBackdrop = document.querySelector('#detail-backdrop')
const detailClose = document.querySelector('#detail-close')
const detailTitle = document.querySelector('#detail-title')

// 5-1. 關閉按鈕
detailClose.addEventListener('click', () => {
  detailBackdrop.style.display = 'none'
})

// 5-2. 按 ESC 關閉彈窗
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    detailBackdrop.style.display = 'none'
  }
})

// 5-3. 點擊遮罩背景關閉彈窗
detailBackdrop.addEventListener('click', (e) => {
  if (e.target === detailBackdrop) {
    detailBackdrop.style.display = 'none'
  }
})


// 6. 切換模式時重置所有狀態
function resetAll() {
  // 6-1. 清除肌肉高亮
  musclePairs.forEach(m => {
    m.classList.remove('is-selected')
    m.classList.remove('is-hover-linked')
  })
  // 6-2. 清除選中的肌肉與器材
  selectedMuscle = ''
  selectedEquipment = []
  // 6-3. 清除右側面板
  document.querySelector('#muscle-name').textContent = ''
  document.querySelector('#exercise-list').innerHTML = ''
  // 6-4. 清除器材按鈕 active
  equipmentBtns.forEach(b => b.classList.remove('active'))
  // 6-5. 關閉彈窗
  detailBackdrop.style.display = 'none'
}


/* ── 屏風選單 ── */
const byobu = document.getElementById("byobu");
const menuContent = document.getElementById("menu-content");

function openMenu() {
  byobu.classList.remove("closing");
  byobu.classList.add("open");
  setTimeout(() => menuContent.classList.add("open"), 400);
  document.body.style.overflow = "hidden";
}

function closeMenu() {
  const closeBtn = document.querySelector(".mc-close");
  if (closeBtn) {
    closeBtn.classList.add("spinning");
    setTimeout(() => closeBtn.classList.remove("spinning"), 400);
  }
  menuContent.classList.remove("open");
  byobu.classList.remove("open");
  byobu.classList.add("closing");
  setTimeout(() => {
    byobu.style.pointerEvents = "none";
    byobu.classList.remove("closing");
    document.body.style.overflow = "";
  }, 800);
}
/*-----navbar------*/
   const navbar = document.getElementById("nav");

      window.addEventListener("scroll", () => {
        if (window.scrollY > 50) {
          navbar.classList.add("shrink");
        } else {
          navbar.classList.remove("shrink");
        }
      });  