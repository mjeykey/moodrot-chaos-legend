
const STORAGE_KEY = "COMMENT_ECOSYSTEM_EXTENSION_V1";

const ICONS = {
  rose:"🌹",
  kiss:"💋",
  hug:"🧸",
  like:"👍",
  duuh:"🙄",
  why:"🤨",
  poop:"💩",
  flower:"🌸",
  fire:"🔥",
  clown:"🤡",
  crown:"👑",
  wth:"😵‍💫",
  hell:"👹",
  girl:"💅",
  legend:"🏆",
  bro:"🗿",
  thug:"😎"
};

const LABELS = {
  rose:"ROSE",
  kiss:"MUAH",
  hug:"HUGGZZZ",
  like:"MAG ICH",
  duuh:"DUUUH",
  why:"WHY?!",
  poop:"LOSER",
  flower:"ANGEL",
  fire:"HOT",
  clown:"CLOWN",
  crown:"KING",
  wth:"WTH",
  hell:"HELL",
  girl:"GIIIIRL",
  legend:"LEGEND",
  bro:"BROOOO",
  thug:"THUG"
};

const EFFECTS = {
  rose:"🌹",
  kiss:"💖",
  hug:"💞",
  like:"💙",
  duuh:"🙄",
  why:"❓",
  poop:"🪰",
  flower:"🦋",
  fire:"✨",
  clown:"🎉",
  crown:"⭐",
  wth:"⁉️",
  hell:"🔥",
  girl:"💖",
  legend:"⚡",
  bro:"💪",
  thug:"🔥"
};

let ecosystem = {};

const SOUND_BOMBS = [
  ["🙄", "Eyyy, laber ned!", "de-DE"],
  ["🤨", "Dein Ernst jetzt?", "de-DE"],
  ["😂", "Ich kann nicht mehr!", "de-DE"],
  ["💅", "Girl, please!", "en-US"],
  ["👑", "Slay!", "en-US"],
  ["🤫", "Pssst. Einfach leise.", "de-DE"],
  ["😵‍💫", "What the hell?", "en-US"],
  ["😏", "Nice try, honey.", "en-US"]
];

function toggleReaction(key, id) {
  const data = ecosystem[key] || (ecosystem[key] = {});
  if (data[id] > 0) delete data[id];
  else data[id] = 1;
  if (!Object.keys(data).length) delete ecosystem[key];
}

function playSoundBomb(text, lang, button) {
  const synth = window.speechSynthesis;
  if (!synth || typeof SpeechSynthesisUtterance === "undefined") {
    button.title = "Speech playback unavailable";
    return;
  }
  const voice = synth.getVoices().find(v => v.localService && v.lang === lang)
    || synth.getVoices().find(v => v.localService && v.lang.split("-")[0] === lang.split("-")[0]);
  if (!voice) {
    button.title = "No local voice available for " + lang;
    button.textContent = "🔇 " + text;
    return;
  }
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = voice;
  utterance.lang = lang;
  utterance.rate = 1.08;
  utterance.volume = 0.65;
  utterance.onerror = () => { button.title = "Sound playback failed"; };
  synth.speak(utterance);
}

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
    if(count >= 200) return 5;
    if(count >= 150) return 4;
    if(count >= 100) return 3;
    if(count >= 50) return 2;
    if(count >= 20) return 1;
  }

  if(type === "flower"){
    if(count >= 200) return 6;
    if(count >= 100) return 4;
    if(count >= 50) return 3;
    if(count >= 20) return 1;
  }

  if(type === "fire" || type === "clown" || type === "crown" || type === "wth" || type === "hell" || type === "girl" || type === "legend" || type === "bro" || type === "thug" || type === "rose" || type === "kiss" || type === "hug" || type === "like" || type === "duuh" || type === "why"){
    if(count >= 150) return 5;
    if(count >= 80) return 4;
    if(count >= 40) return 3;
    if(count >= 15) return 1;
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
    btn.type = "button";
    btn.textContent = icon;
    const active = (ecosystem[key]?.[id] || 0) > 0;
    btn.setAttribute("aria-pressed", String(active));
    btn.title = (active ? "Remove " : "Add ") + LABELS[id];

    btn.onclick = e => {
      e.stopPropagation();

      toggleReaction(key, id);

      saveData();
      render(comment,key);
    };

    menu.appendChild(btn);
  });

  const sounds = document.createElement("div");
  sounds.className = "eco-sounds";
  const heading = document.createElement("div");
  heading.textContent = "🔊 Sound Bombs";
  sounds.appendChild(heading);
  SOUND_BOMBS.forEach(([icon, text, lang]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "eco-sound-btn";
    button.textContent = icon + " " + text;
    button.onclick = e => {
      e.preventDefault();
      e.stopPropagation();
      playSoundBomb(text, lang, button);
    };
    sounds.appendChild(button);
  });
  menu.appendChild(sounds);
  comment.appendChild(menu);
}

function addPicker(comment,key){
  if(comment.querySelector(".eco-picker,.eco-stage")) return;

  const picker = document.createElement("button");
  picker.className = "eco-picker";
  picker.type = "button";
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

  stage.classList.add("type-" + top.type);

  stage.innerHTML = `
    <div class="fx-space"></div>
    <div class="ground"></div>
    <div class="main ${sizeClass(top.count)}">${ICONS[top.type]}</div>
    <div class="comic-label">${LABELS[top.type] || ""}</div>
    <div class="count">${top.count}</div>
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
    else if(top.type === "wth"){
      const items = ["⁉️","😵‍💫","💥","❓"];
      fx.textContent = items[i % items.length];
    }
    else if(top.type === "hell"){
      const items = ["🔥","👹","💀","🌋"];
      fx.textContent = items[i % items.length];
    }
    else if(top.type === "girl"){
      const items = ["💖","💅","✨","👑"];
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
    else if(top.type === "thug"){
      const items = ["🔥","😎","💥","⚡"];
      fx.textContent = items[i % items.length];
    }
    else if(top.type === "rose"){
      const items = ["🌹","🌹","🌺","🌸","🍃"];
      fx.textContent = items[i % items.length];
    }
    else if(top.type === "kiss"){
      const items = ["💖","💋","💕","✨"];
      fx.textContent = items[i % items.length];
    }
    else if(top.type === "hug"){
      const items = ["💞","🧸","💕","✨"];
      fx.textContent = items[i % items.length];
    }
    else if(top.type === "like"){
      const items = ["💙","👍","✨","💫"];
      fx.textContent = items[i % items.length];
    }
    else if(top.type === "duuh"){
      const items = ["🙄","💨","😑","⚡"];
      fx.textContent = items[i % items.length];
    }
    else if(top.type === "why"){
      const items = ["❓","🤨","⁉️","💭"];
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

    if(ecosystem[key]){
      render(comment,key);
    }
    else{
      addPicker(comment,key);
    }
  });
}

loadData(scan);

new MutationObserver(scan).observe(document.body,{
  childList:true,
  subtree:true
});

setInterval(scan,2000);
