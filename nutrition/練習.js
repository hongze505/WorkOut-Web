function renderFoodlist(list) {
  document.getElementById("food-list").innerHTML = list
    .map(
      (f) => `<div class="food-item">
        <div class="food-item-info">
        <span class="food-item-name">${f.name}</span>
        <span class="food-item-en">${f.en}</span>
        </div>
        <div class="food-item-meta">
        <span class="food-item-cal">${f.cal}</span>
        <span class="food-item-unit">kcal /${f.unit}</span>
        </div>
        <button class="food-add-btn" onclick="addToLog(${f.id})">+</button>
        </div>`,
    )
    .join(""); 
}
 function filterFoods() {
    const s = document.getElementById("food-search").value.trim().toLowerCase();
    renderFoodlist(
      s
        ? FOOD_DB.filter(
            (f) => f.name.includes(s) || f.en.toLowerCase().includes(s),
          )
        : FOOD_DB,
    );
}
