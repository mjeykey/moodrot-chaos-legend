
const STORAGE_KEY = "COMMENT_ECOSYSTEM_EXTENSION_V1";

const ICONS = {
  poop:"💩",
  flower:"🌸",
  fire:"🔥",
  clown:"🤡",
  crown:"👑",
  legend:"🏆",
  bro:"🗿",
  girl:"💅",
  wth:"😵‍💫",
  hell:"👹"
};

const EFFECTS = {
  poop:"🪰",
  flower:"🦋",
  fire:"✨",
  clown:"🎉",
  crown:"⭐",
  legend:"⚡",
  bro:"💪",
  girl:"💖",
  wth:"⁉️",
  hell:"🔥"
};

let ecosystem = {};

function loadData(cb){
  chrome.storage.local.get([STORAGE_KEY], result => {
    ecosystem = result[STORAGE_KEY] || {};
    cb();
  });
}

function saveData(){
  chrome.storage.local.set({[STORAGE_KEY]: ecosystem});
}

function cleanText(el){
  const clone = el.cloneNode(true);
  clone.querySelectorAll(".eco-picker,.eco-menu,.eco-stage").forEach(x => x.remove());
  return (clone.innerText || "").replace(/\s+/g," ").trim().slice(0,500);
}

function hash(str){
  let h = 0;
  for(let i=0;i<str.length;i++){
    h = ((h<<5)-h) + str.charCodeAt(i);
    h |= 0;
  }
  return "eco_" + Math.abs(h);
}

function keyFor(comment){
  const t = cleanText(comment);
  if(!t) return null;
  return hash(t);
}

function topReaction(data){
  let type = null;
  let count = 0;

  Object.keys(data).forEach(k => {
    if(data[k] > count){
      type = k;
      count = data[k];
    }
  });

  return {type, count};
}

function effectCount(type,count){
  if(type === "poop"){
    if(count >= 500) return 5;
    if(count >= 300) return 4;
    if(count >= 180) return 3;
    if(count >= 90) return 2;
    if(count >= 35) return 1;
  }

  if(type === "flower"){
    if(count >= 200) return 6;
    if(count >= 100) return 4;
    if(count >= 50) return 3;
    if(count >= 20) return 1;
  }

  if(type === "fire" || type === "clown" || type === "crown"){
    if(count >= 150) return 5;
    if(count >= 80) return 4;
    if(count >= 40) return 3;
    if(count >= 15) return 1;
  }

  if(type === "legend" || type === "bro" || type === "girl" || type === "wth" || type === "hell"){
    if(count >= 250) return 6;
    if(count >= 120) return 5;
    if(count >= 60) return 3;
    if(count >= 20) return 1;
  }

  return 0;
}

function sizeClass(count){
  if(count >= 200) return "huge";
  if(count >= 80) return "big";
  if(count >= 20) return "mid";
  return "";
}

function showMenu(comment,key){
  comment.querySelectorAll(".eco-menu").forEach(x => x.remove());

  const menu = document.createElement("div");
  menu.className = "eco-menu";

  Object.entries(ICONS).forEach(([id,icon]) => {
    const btn = document.createElement("button");
    btn.className = "eco-btn";
    btn.textContent = icon;

    btn.onclick = e => {
      e.stopPropagation();

      if(!ecosystem[key]){
        ecosystem[key] = {};
      }

      ecosystem[key][id] = (ecosystem[key][id] || 0) + 1;

      render(comment,key);
      saveData();
    };

    menu.appendChild(btn);
  });

  comment.appendChild(menu);
}

function addPicker(comment,key){
  if(comment.querySelector(".eco-picker,.eco-stage")) return;

  const picker = document.createElement("button");
  picker.className = "eco-picker";
  picker.textContent = "✨";

  picker.onclick = e => {
    e.stopPropagation();
    showMenu(comment,key);
  };

  comment.appendChild(picker);
}

function render(comment,key){
  comment.querySelectorAll(".eco-picker,.eco-stage,.eco-menu").forEach(x => x.remove());

  const data = ecosystem[key] || {};
  const top = topReaction(data);

  if(!top.type){
    addPicker(comment,key);
    return;
  }

  const stage = document.createElement("div");
  stage.className = "eco-stage";

  if(top.type === "poop" && top.count >= 500){
    stage.classList.add("glow");
  }

  const labels = {
    legend: "LEGEND",
    bro: "BROOOO",
    girl: "GIIIIRL",
    wth: "WTH",
    hell: "HELL"
  };

  stage.classList.add("type-" + top.type);

  stage.innerHTML = `
    <div class="ground"></div>
    <div class="main ${sizeClass(top.count)}">${ICONS[top.type]}</div>
    <div class="count">${top.count}</div>
    <div class="special-label">${labels[top.type] || ""}</div>
    <div class="side"></div>
  `;

  const side = stage.querySelector(".side");

  Object.entries(data).forEach(([id,count]) => {
    if(id === top.type || count <= 0) return;

    const s = document.createElement("div");
    s.className = "small";
    s.textContent = ICONS[id] + " " + count;
    side.appendChild(s);
  });

  if(top.type === "poop" && top.count >= 50){
    const dog = document.createElement("div");
    dog.className = "eco-dog-event";

    const variant = top.count >= 300 ? "super" : (top.count >= 150 ? "strong" : "normal");
    dog.classList.add("dog-" + variant);

    dog.innerHTML = `
      <span class="dog-body">🐕</span>
      <span class="dog-pee">💦</span>
      <span class="dog-drop">💩</span>
      <span class="dog-fly fly-one">🪰</span>
      <span class="dog-fly fly-two">🪰</span>
    `;
    stage.appendChild(dog);
  }

  const totalEffects = effectCount(top.type, top.count);

  for(let i=0;i<totalEffects;i++){
    const fx = document.createElement("div");
    fx.className = "effect";

    if(top.type === "clown"){
      const items = ["🎉","🤡","🎪","✨"];
      fx.textContent = items[i % items.length];
    }
    else if(top.type === "crown"){
      const items = ["⭐","✨","💫","👑"];
      fx.textContent = items[i % items.length];
    }
    else if(top.type === "legend"){
      const items = ["⚡","🏆","👑","✨"];
      fx.textContent = items[i % items.length];
    }
    else if(top.type === "bro"){
      const items = ["💪","🗿","🔥","⚡"];
      fx.textContent = items[i % items.length];
    }
    else if(top.type === "girl"){
      const items = ["💖","💅","✨","👑"];
      fx.textContent = items[i % items.length];
    }
    else if(top.type === "wth"){
      const items = ["⁉️","😵‍💫","💥","❓"];
      fx.textContent = items[i % items.length];
    }
    else if(top.type === "hell"){
      const items = ["🔥","👹","💀","🌋"];
      fx.textContent = items[i % items.length];
    }
    else{
      fx.textContent = EFFECTS[top.type];
    }

    fx.style.left = (20 + (i * 24) % 110) + "px";
    fx.style.top = (8 + (i % 3) * 22) + "px";
    fx.style.animationDelay = (i * 0.45) + "s";

    if(top.type === "poop" && top.count >= 600){
      fx.classList.add("glowfx");
    }

    stage.appendChild(fx);
  }

  stage.onclick = e => {
    e.stopPropagation();
    showMenu(comment,key);
  };

  comment.appendChild(stage);
}

function scan(){
  const comments = document.querySelectorAll('[role="article"]');

  comments.forEach(comment => {
    if(comment.dataset.ecoReady === "1") return;

    const key = keyFor(comment);
    if(!key) return;

    comment.dataset.ecoReady = "1";
    comment.style.position = "relative";
    comment.style.overflow = "visible";

    render(comment,key);
  });
}

loadData(scan);

new MutationObserver(scan).observe(document.body,{
  childList:true,
  subtree:true
});

setInterval(scan,2000);
