// 1. 讀取 URL 參數
const params = new URLSearchParams(window.location.search)
const muscleName = params.get('muscle')
const equipmentName = params.get('equipment')
const exerciseName = params.get('name')

const muscleNameEl = document.querySelector('#ex-muscle-name')
const titleEl = document.querySelector('#ex-title')
const badgeEl = document.querySelector('#ex-badge')
const imgEl = document.querySelector('#ex-img')
const descEl = document.querySelector('#ex-desc')

// 2. 從資料表找到對應動作
const exercises = EXERCISES[muscleName] || []
const exercise = exercises.find(ex => ex.name === exerciseName)

if (muscleNameEl && titleEl && badgeEl && imgEl && descEl) {
  // 4. 填入頁面內容
  // 4-1. 頂部肌肉名稱
  muscleNameEl.textContent = MUSCLE_LABELS[muscleName] || ''

  // 4-2. 動作名稱
  titleEl.textContent = exerciseName || ''

  // 4-3. 器材標籤
  badgeEl.textContent = EQUIPMENT_LABELS[equipmentName] || ''

  // 4-4. 如果找到動作資料就填入影片與說明
  if (exercise.img) {
    // 判斷是否為影片檔
    if (exercise.img.toLowerCase().endsWith('.mp4')) {
      imgEl.outerHTML = `
      <video class="ex-img" controls autoplay muted loop playsinline style="width:100%;height:100%;object-fit:contain">
        <source src="${exercise.img}" type="video/mp4">
      </video>
    `
    } else {
      imgEl.src = exercise.img
      imgEl.alt = exercise.name
    }
  } else {
    imgEl.removeAttribute('src')
    imgEl.alt = ''
    imgEl.parentElement.style.display = 'none'
  }



  // 4-4-2. 說明文字
  descEl.innerHTML = exercise.desc || '暫無說明'

  // 4-4-3. 難度星數
  const hasDifficulty = exercise && exercise.difficulty
  if (hasDifficulty) {
    const starsEl = document.querySelector('#ex-stars')
    for (let i = 1; i <= 5; i++) {
      const star = document.createElement('span')
      star.className = 'ex-star' + (i <= exercise.difficulty ? ' ex-star--filled' : '')
      star.textContent = '★'
      starsEl.appendChild(star)
    }
    document.querySelector('#ex-difficulty-wrap').style.display = ''
  }

  // 4-4-4. 肌群占比長條圖
  const hasMuscles = exercise && exercise.muscles && exercise.muscles.length > 0
  if (hasMuscles) {
    const barsEl = document.querySelector('#ex-muscle-bars')
    exercise.muscles.forEach(m => {
      // 依占比決定顏色（對應圖片裡的高亮強度）
      let barColor
      if (m.pct >= 50) {
        barColor = 'linear-gradient(90deg, #c21f14, #ff3d00)'   // 主要：亮橘紅
      } else if (m.pct >= 20) {
        barColor = 'linear-gradient(90deg, #d94a1f, #ff6a2a)'   // 次要：中橘
      } else {
        barColor = 'linear-gradient(90deg, #c98a4a, #f2a65a)'   // 輔助：金黃
      }

      const row = document.createElement('div')
      row.className = 'ex-muscle-row'
      row.innerHTML = `
        <span class="ex-muscle-label">${m.name}</span>
        <div class="ex-muscle-bar-bg">
          <div class="ex-muscle-bar-fill" style="width:${m.pct}%; background:${barColor}"></div>
        </div>
        <span class="ex-muscle-pct" style="color:${m.pct >= 50 ? '#ff6d4a' : m.pct >= 20 ? '#ff8f4a' : '#f4cd64'}">${m.pct}%</span>
      `
      barsEl.appendChild(row)
    })
    document.querySelector('#ex-muscles-wrap').style.display = ''
  }

  // 4-4-5. 統計卡：有任何資料就顯示；兩區都有才顯示分隔線
  if (hasDifficulty || hasMuscles) {
    document.querySelector('#ex-stats-card').style.display = ''
  }
  if (hasDifficulty && hasMuscles) {
    document.querySelector('#ex-stats-divider').style.display = ''
  }
} else {
  imgEl.parentElement.style.display = 'none'
  descEl.textContent = '找不到動作資料'
}
