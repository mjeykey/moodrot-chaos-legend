
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

let soundContext;
let activeUtterance;

function playEffect(kind, button) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    button.title = "Audio playback unavailable";
    return;
  }
  try {
    if (!soundContext || soundContext.state === "closed") soundContext = new AudioContextClass();
    const ctx = soundContext;
    const ready = ctx.state === "running" ? Promise.resolve() : ctx.resume();
    ready.then(() => {
      const t = ctx.currentTime;
      const output = ctx.createGain();
      output.gain.value = 0.28;
      output.connect(ctx.destination);
      const note = (offset, duration, from, to, volume, wave = "sine") => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const at = t + offset;
        osc.type = wave;
        osc.frequency.setValueAtTime(from, at);
        osc.frequency.exponentialRampToValueAtTime(to, at + duration);
        gain.gain.setValueAtTime(0.001, at);
        gain.gain.exponentialRampToValueAtTime(volume, at + Math.min(0.025, duration / 3));
        gain.gain.exponentialRampToValueAtTime(0.001, at + duration);
        osc.connect(gain).connect(output);
        osc.start(at);
        osc.stop(at + duration);
      };
      if (kind === "kiss") {
        // Short filtered lip-smack with a descending voiced "mwah".
        const length = Math.ceil(ctx.sampleRate * 0.16);
        const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
        const samples = buffer.getChannelData(0);
        for (let i = 0; i < length; i++) {
          const x = i / length;
          samples[i] = (Math.random() * 2 - 1) * Math.pow(1 - x, 3) * Math.min(1, x * 35);
        }
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.value = 1350;
        filter.Q.value = 0.9;
        const gain = ctx.createGain();
        gain.gain.value = 0.9;
        src.connect(filter).connect(gain).connect(output);
        src.start(t + 0.10);
        note(0, 0.23, 220, 125, 0.32, "triangle");
        note(0.08, 0.14, 620, 280, 0.12);
      } else if (kind === "hug") {
        note(0, 0.46, 180, 148, 0.35, "triangle");
        note(0.10, 0.36, 270, 222, 0.16);
        note(0.25, 0.32, 360, 296, 0.10);
      } else {
        note(0, 0.10, 440, 550, 0.2);
        note(0.12, 0.18, 660, 440, 0.2);
      }
      // Release the master node after all scheduled sound sources end.
      setTimeout(() => output.disconnect(), 800);
    }).catch(() => { button.title = "Sound playback failed"; });
  } catch (error) {
    button.title = "Sound playback failed";
  }
}

function playSoundBomb(text, lang, button) {
  const synth = window.speechSynthesis;
  if (!synth || typeof SpeechSynthesisUtterance === "undefined") {
    button.title = "Speech unavailable; playing a short tone instead";
    playEffect("fallback", button);
    return;
  }
  try {
    const voices = synth.getVoices();
    const matches = v => v.lang.toLowerCase().split("-")[0] === lang.toLowerCase().split("-")[0];
    const voice = voices.find(v => v.localService && v.lang.toLowerCase() === lang.toLowerCase())
      || voices.find(v => v.localService && matches(v))
      || voices.find(v => v.lang.toLowerCase() === lang.toLowerCase())
      || voices.find(matches);
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    activeUtterance = utterance;
    if (voice) utterance.voice = voice;
    utterance.lang = lang;
    utterance.rate = 1.08;
    utterance.volume = 0.65;
    utterance.onend = () => { if (activeUtterance === utterance) activeUtterance = null; };
    utterance.onerror = event => {
      if (activeUtterance === utterance) activeUtterance = null;
      if (event.error === "canceled" || event.error === "interrupted") return;
      button.title = "Speech failed; click again to play a short tone instead";
      button.dataset.soundFallback = "true";
    };
    if (button.dataset.soundFallback === "true") {
      playEffect("fallback", button);
      delete button.dataset.soundFallback;
      activeUtterance = null;
      return;
    }
    synth.speak(utterance);
    button.title = "Play " + text;
  } catch (error) {
    button.title = "Speech unavailable; playing a short tone instead";
    playEffect("fallback", button);
  }
}

let activePersonalSource, personalPlayId=0;
async function playPersonalSound(data,button){
 const id=++personalPlayId;
 try{
  const AudioContextClass=window.AudioContext||window.webkitAudioContext;
  if(!AudioContextClass)throw Error("Audio unavailable");
  if(!soundContext||soundContext.state==="closed")soundContext=new AudioContextClass();
  const ctx=soundContext;
  if(activePersonalSource){try{activePersonalSource.stop()}catch{}activePersonalSource=null}
  if(ctx.state!=="running")await ctx.resume();
  if(typeof data!=="string"||!data.startsWith("data:audio/")||!data.includes(";base64,")||data.length>360000)throw Error("Invalid recording");
  const raw=atob(data.slice(data.indexOf(",")+1)),bytes=Uint8Array.from(raw,ch=>ch.charCodeAt(0));
  const buffer=await ctx.decodeAudioData(bytes.buffer);
  if(id!==personalPlayId)return;
  const source=ctx.createBufferSource(),gain=ctx.createGain();source.buffer=buffer;gain.gain.value=.8;source.connect(gain).connect(ctx.destination);activePersonalSource=source;
  source.onended=()=>{source.disconnect();gain.disconnect();if(activePersonalSource===source)activePersonalSource=null};source.start();
 }catch{button.title="Recording could not be played"}
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
  [["💋", "MUAH – Kiss", "kiss"], ["🧸", "HUGGZZZ – Hug", "hug"]].forEach(([icon, text, kind]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "eco-sound-btn";
    button.textContent = icon + " " + text;
    button.title = "Play " + text;
    button.onclick = e => {
      e.preventDefault();
      e.stopPropagation();
      playEffect(kind, button);
    };
    sounds.appendChild(button);
  });
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
  const recordButton=document.createElement("button");
  recordButton.type="button";recordButton.className="eco-sound-btn";
  recordButton.textContent="🎙️ Record your own";
  recordButton.onclick=async e=>{
    e.preventDefault();e.stopPropagation();
    try{const result=await chrome.runtime.sendMessage({type:"MOODROT_OPEN_RECORDER"});if(!result?.ok)throw Error("Recorder unavailable")}
    catch{recordButton.textContent="🎙️ Reload and try again"}
  };
  sounds.appendChild(recordButton);
  const personal=document.createElement("div");personal.style.display="contents";sounds.appendChild(personal);
  const renderPersonal=async()=>{
    try{
      const data=await chrome.storage.local.get("MOODROT_CUSTOM_SOUNDS_V1");
      if(!menu.isConnected)return;
      personal.replaceChildren();
      for(const sound of (Array.isArray(data.MOODROT_CUSTOM_SOUNDS_V1)?data.MOODROT_CUSTOM_SOUNDS_V1:[])){
        const button=document.createElement("button");button.type="button";button.className="eco-sound-btn";button.textContent="▶ "+sound.name;
        button.onclick=e=>{e.preventDefault();e.stopPropagation();playPersonalSound(sound.data,button)};
        personal.appendChild(button);
      }
    }catch{recordButton.title="Could not load personal sounds"}
  };
  menu.appendChild(sounds);
  queueMicrotask(renderPersonal);
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
