# JavaScript 核心觀念整理
> 有 C# 基礎，對照來看會快很多

---

## 01 — DOM 操作

DOM（Document Object Model）就是瀏覽器把 HTML 解析成一棵樹，
JS 可以用程式碼去讀取或修改這棵樹上的任何節點。

### 取得元素

```js
// 用 id 取得（最快，唯一）
const el = document.getElementById('bmi-display');

// 用 CSS 選擇器取得第一個符合的
const el = document.querySelector('.panel-label');
const el = document.querySelector('#food-list');

// 用 CSS 選擇器取得所有符合的（回傳 NodeList，類似陣列）
const allBtns = document.querySelectorAll('.tab-btn');
```

> **C# 對比**：`getElementById` 類似 `FindControl()`，
> `querySelector` 類似 LINQ 的 `.FirstOrDefault()`，
> `querySelectorAll` 類似 `.Where()`

### 修改內容

```js
el.textContent = '新文字';        // 純文字，安全
el.innerHTML   = '<b>粗體</b>';   // 可以放 HTML，小心 XSS

el.style.color   = 'red';         // 改單一樣式
el.style.display = 'none';        // 隱藏元素
el.style.width   = '50%';

el.classList.add('active');       // 加 class
el.classList.remove('active');    // 移除 class
el.classList.toggle('active');    // 有就移除，沒有就加
el.classList.contains('active');  // 檢查有沒有，回傳 boolean
```

### 修改屬性

```js
el.setAttribute('stroke-dasharray', '100 200');
el.getAttribute('data-mode');     // 讀取自訂屬性
```

### KATACHI 裡的實際用法

```js
// nutrition1.html 裡的例子
document.getElementById('bmi-display').textContent = bmi.toFixed(1);
document.getElementById('bmi-card-thin').classList.toggle('active', bmi < 18.5);
document.getElementById('cal-progress-bar').style.width = pct + '%';
```

---

## 02 — 事件處理

使用者做任何動作（點擊、輸入、滾動）都會觸發「事件」，
JS 可以監聽這些事件並執行對應的函式。

### 三種寫法

```html
<!-- 寫法 1：直接寫在 HTML（你目前用的方式） -->
<button onclick="calcBMI()">計算 BMI</button>
<input oninput="filterFoods()">

<!-- 寫法 2：在 JS 裡指定（推薦，關注點分離） -->
document.getElementById('calc-btn').onclick = calcBMI;

<!-- 寫法 3：addEventListener（最彈性，可綁多個） -->
document.getElementById('calc-btn').addEventListener('click', calcBMI);
```

### 常用事件

```js
// 點擊
btn.addEventListener('click', () => { ... });

// 輸入框內容改變（每打一個字觸發）
input.addEventListener('input', () => { ... });

// 輸入框失焦（離開輸入框才觸發）
input.addEventListener('blur', () => { ... });

// 鍵盤按下
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeMenu();  // KATACHI 裡的用法
});

// 滾動
window.addEventListener('scroll', () => {
  if (window.scrollY > 50) navbar.classList.add('shrink');
});
```

### event 物件

```js
btn.addEventListener('click', (e) => {
  e.preventDefault();       // 阻止預設行為（例如表單送出）
  e.stopPropagation();      // 阻止事件往上冒泡
  console.log(e.target);    // 觸發事件的元素本身
});
```

> **C# 對比**：跟 C# 的 `EventHandler` 很像，
> `addEventListener` 類似 `button.Click += handler`，
> `e` 就是 `EventArgs`

---

## 03 — 陣列操作（最重要）

JS 的陣列方法是函數式風格，每個方法都回傳新陣列，不修改原陣列。

### filter — 篩選

```js
// 保留符合條件的元素
const result = array.filter(item => 條件);

// KATACHI 裡的例子：搜尋食物
const filtered = FOOD_DB.filter(f =>
  f.name.includes(q) || f.en.toLowerCase().includes(q)
);

// 移除記錄
foodLog = foodLog.filter(e => e.logId !== logId);
```

> **C# 對比**：完全等同於 LINQ 的 `.Where()`
> ```csharp
> var filtered = foodList.Where(f => f.Name.Contains(q)).ToList();
> ```

### map — 轉換

```js
// 把每個元素轉換成另一個形式
const result = array.map(item => 新的值);

// KATACHI 裡的例子：把資料陣列轉成 HTML 字串
const html = FOOD_DB.map(f => `
  <div class="food-item">
    <span>${f.name}</span>
  </div>
`).join('');  // join 把陣列合併成一個字串
```

> **C# 對比**：等同於 LINQ 的 `.Select()`
> ```csharp
> var htmlList = foodList.Select(f => $"<div>{f.Name}</div>").ToList();
> ```

### reduce — 累積計算

```js
// 把陣列累積成一個值（加總、合併等）
const result = array.reduce((累積值, 當前元素) => 新累積值, 初始值);

// KATACHI 裡的例子：計算總熱量
const totals = foodLog.reduce((acc, e) => ({
  cal:     acc.cal     + e.cal,
  protein: acc.protein + e.protein,
  carbs:   acc.carbs   + e.carbs,
  fat:     acc.fat     + e.fat,
}), { cal: 0, protein: 0, carbs: 0, fat: 0 });
// 初始值是 { cal:0, protein:0, carbs:0, fat:0 }
// 每次把當前食物的數值加進去
```

> **C# 對比**：等同於 LINQ 的 `.Aggregate()`
> ```csharp
> var total = foodLog.Aggregate(0, (sum, e) => sum + e.Cal);
> ```

### 其他常用方法

```js
array.find(item => 條件)      // 找第一個符合的，回傳元素（找不到回傳 undefined）
array.findIndex(item => 條件) // 找第一個符合的索引
array.some(item => 條件)      // 有任一符合回傳 true（C# 的 Any()）
array.every(item => 條件)     // 全部符合才回傳 true（C# 的 All()）
array.includes(值)            // 包含某個值（C# 的 Contains()）

array.push(item)              // 加到尾端（會修改原陣列）
array.unshift(item)           // 加到開頭（會修改原陣列）
array.slice(start, end)       // 切片，不修改原陣列
array.splice(index, 刪幾個)   // 刪除元素，會修改原陣列
```

---

## 04 — fetch 非同步請求

`fetch` 用來打 HTTP 請求，非同步的意思是「不等回應，繼續執行其他程式碼」。

### 基本用法

```js
// async / await 寫法（比較好讀）
async function getData() {
  const response = await fetch('https://api.example.com/foods');
  const data = await response.json();  // 把回應解析成 JS 物件
  console.log(data);
}

// Promise 鏈式寫法（舊寫法）
fetch('https://api.example.com/foods')
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error(err));
```

### GET / POST

```js
// GET（預設）
const res = await fetch('/api/foods');
const data = await res.json();

// POST（送資料給後端）
const res = await fetch('/api/nutrition/history', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`  // JWT
  },
  body: JSON.stringify({                // 物件轉成 JSON 字串
    date: '2026/04/23',
    cal: 1800
  })
});
const result = await res.json();
```

### KATACHI 裡的 TODO

```js
// 現在是假資料：
const FOOD_DB = [ { id:1, name:'雞胸肉', ... } ];

// 之後換成真實 API：
async function loadFoods() {
  const res = await fetch('/api/foods');
  const data = await res.json();
  renderFoodList(data);
}
```

> **C# 對比**：等同於 `HttpClient`
> ```csharp
> var response = await _httpClient.GetAsync("/api/foods");
> var data = await response.Content.ReadFromJsonAsync<List<Food>>();
> ```
> JS 的 `await` 跟 C# 的 `await` 概念完全一樣！

### 錯誤處理

```js
async function loadFoods() {
  try {
    const res = await fetch('/api/foods');
    if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
    const data = await res.json();
    renderFoodList(data);
  } catch (err) {
    console.error('載入失敗：', err);
    showToast('資料載入失敗，請稍後再試');
  }
}
```

---

## 05 — localStorage

瀏覽器提供的本地儲存，關掉頁面資料也不會消失（除非手動清除）。

### 基本操作

```js
// 儲存（只能存字串）
localStorage.setItem('key', '值');

// 讀取
const val = localStorage.getItem('key');  // 不存在回傳 null

// 刪除
localStorage.removeItem('key');

// 清空全部
localStorage.clear();
```

### 儲存物件（要轉換）

```js
// 物件 → 字串（存進去）
const data = { cal: 1800, protein: 150 };
localStorage.setItem('today', JSON.stringify(data));

// 字串 → 物件（取出來）
const raw = localStorage.getItem('today');
const data = JSON.parse(raw);
```

### KATACHI 裡的實際用法

```js
const HISTORY_KEY = 'katachi_nutrition_history';

// 存近日記錄
function saveToLocal(entry) {
  const history = getHistory();
  const filtered = history.filter(h => h.date !== entry.date); // 同天只留一筆
  filtered.unshift(entry);                                      // 加到最前面
  localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered.slice(0, 7))); // 最多 7 筆
}

// 讀近日記錄
function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  } catch {
    return [];  // 解析失敗就回傳空陣列
  }
}
```

### 注意事項

```
容量限制：約 5MB，存太多會失敗
隱私模式：無痕視窗關閉後會清空
只存字串：物件一定要 JSON.stringify / JSON.parse
同源限制：不同網域無法互相存取
```

> **C# 對比**：類似 `Application.Properties`（WPF）或
> Session 的概念，但是存在使用者瀏覽器端，不在伺服器

---

## 快速對照表

| JavaScript | C# 對應 |
|---|---|
| `array.filter()` | `.Where()` |
| `array.map()` | `.Select()` |
| `array.reduce()` | `.Aggregate()` |
| `array.find()` | `.FirstOrDefault()` |
| `array.some()` | `.Any()` |
| `array.every()` | `.All()` |
| `array.includes()` | `.Contains()` |
| `async / await` | `async / await`（一樣！） |
| `fetch` | `HttpClient` |
| `JSON.stringify()` | `JsonSerializer.Serialize()` |
| `JSON.parse()` | `JsonSerializer.Deserialize()` |
| `localStorage` | 瀏覽器端的持久儲存 |
| `querySelector` | `FindControl()` / LINQ |
| `addEventListener` | `button.Click +=` |

---

## 下一步練習建議

從 KATACHI 的程式碼找這幾個函式，逐行讀懂：
1. `renderFoodList()` — 練 map + innerHTML
2. `totals()` — 練 reduce
3. `filterFoods()` — 練 filter
4. `saveLog()` — 練 async/await + localStorage
5. `updateChart()` — 練 DOM 操作
