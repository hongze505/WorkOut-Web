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
   const s = document.getElementById("food-Search").value.tirm().ToLowerCase();
   renderFoodlist(
    s 
    ? FOOD_DB.filter(
      (f)=>f.name.includes(s)||f.en.toLowerCase().includes(s)
    )
      :FOOD_DB  
   );
}
//menu 練習
const byobu = document.getElementById("byobu");
const menuContent = document.querySelector("#menu-content");

function openMenu(){
  byobu.classList.remove("closing");
  byobu.classList.add("open");
  setTimeout(()=>menuContent.classList.add("open"),400);

  document.body.style.overflow = "hidden";
}

function closeMenu(){
 const closeBtn = document.getElementById(".mc-close")
 if(closeBtn)
  {
    byobu.classList.add("spinning");
    setTimeout(()=>closeBtn.classList.remove("spinning"),400)
  }
}