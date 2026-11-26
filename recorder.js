const KEY="MOODROT_CUSTOM_SOUNDS_V1", LIMIT=12, MAX_BYTES=256*1024, MAX_MS=10000;
const $=id=>document.getElementById(id);
let recorder,stream,chunks=[],timer,ticker,started,draft,previewUrl,playing,busy=false;
const status=msg=>$("status").textContent=msg;
function controls(){
 const recording=recorder?.state==="recording";
 $("record").disabled=busy||!!recorder;
 $("stop").disabled=!recording;
 $("save").disabled=busy||!!recorder||!draft;
 $("discard").disabled=busy||!!recorder||!draft;
}
function release(){clearTimeout(timer);clearInterval(ticker);stream?.getTracks().forEach(t=>t.stop());stream=null}
function clearDraft(){draft=null;$("preview").pause();$("preview").removeAttribute("src");$("preview").load();$("preview").hidden=true;if(previewUrl)URL.revokeObjectURL(previewUrl);previewUrl=null;controls()}
function stop(){if(recorder?.state==="recording"){recorder.stop();release();controls()}}
async function sounds(){const d=await chrome.storage.local.get(KEY);return Array.isArray(d[KEY])?d[KEY]:[]}
function dataUrl(blob){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(reader.error);reader.readAsDataURL(blob)})}
async function refresh(){
 const items=await sounds(),list=$("list");list.replaceChildren();
 if(!items.length){const li=document.createElement("li");li.textContent="No sounds yet.";list.append(li)}
 for(const item of items){
  const li=document.createElement("li"),label=document.createElement("span"),play=document.createElement("button"),del=document.createElement("button");
  label.textContent=item.name;play.textContent="▶ Play";del.textContent="Delete";
  play.onclick=()=>{playing?.pause();$("preview").pause();playing=new Audio(item.data);playing.play().catch(()=>status("Playback failed."))};
  del.onclick=async()=>{if(!confirm("Delete this sound permanently?"))return;del.disabled=true;try{await chrome.storage.local.set({[KEY]:(await sounds()).filter(s=>s.id!==item.id)});playing?.pause();await refresh();status("Deleted.")}catch{del.disabled=false;status("Could not delete sound.")}};
  li.append(label,play,del);list.append(li);
 }
}
$("record").onclick=async()=>{
 if(busy||recorder)return;
 if(draft&&!confirm("Discard your unsaved recording?"))return;
 clearDraft();playing?.pause();busy=true;controls();status("Waiting for microphone permission…");
 try{
  if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==="undefined")throw Error("Recording is not supported in this browser.");
  if((await sounds()).length>=LIMIT)throw Error("Delete a saved sound first. Maximum: 12.");
  stream=await navigator.mediaDevices.getUserMedia({audio:true,video:false});
  const type=["audio/webm;codecs=opus","audio/webm","audio/ogg;codecs=opus","audio/mp4"].find(t=>MediaRecorder.isTypeSupported(t));
  const current=new MediaRecorder(stream,{...(type?{mimeType:type}:{}),audioBitsPerSecond:64000});
  recorder=current;chunks=[];
  current.ondataavailable=e=>{if(recorder===current&&e.data.size)chunks.push(e.data)};
  current.onerror=()=>{if(recorder!==current)return;release();recorder=null;chunks=[];busy=false;controls();status("Recording failed. Try again.")};
  current.onstop=()=>{if(recorder!==current)return;release();const blob=new Blob(chunks,{type:current.mimeType||chunks[0]?.type||"audio/webm"});chunks=[];recorder=null;busy=false;if(!blob.size||blob.size>MAX_BYTES){status("Recording empty or too large.");controls();return}draft=blob;previewUrl=URL.createObjectURL(blob);$("preview").src=previewUrl;$("preview").hidden=false;status("Listen, name your sound, then save.");controls()};
  current.start();started=performance.now();$("clock").textContent="0.0 / 10 s";timer=setTimeout(stop,MAX_MS);
  ticker=setInterval(()=>{$("clock").textContent=Math.min(10,(performance.now()-started)/1000).toFixed(1)+" / 10 s"},100);
  status("Recording…");
 }catch(e){release();recorder=null;status(e.name==="NotAllowedError"?"Microphone access was denied. You can try again.":e.message||"Could not record.")}
 finally{busy=false;controls()}
};
$("stop").onclick=stop;
$("discard").onclick=()=>{clearDraft();status("Recording discarded.")};
$("save").onclick=async()=>{
 if(!draft||busy||recorder)return;busy=true;controls();
 try{const items=await sounds();if(items.length>=LIMIT)throw Error("Maximum of 12 sounds reached.");const name=$("name").value.trim().slice(0,32)||"Sound "+(items.length+1);const data=await dataUrl(draft);await chrome.storage.local.set({[KEY]:[...items,{id:crypto.randomUUID(),name,data}]});clearDraft();$("name").value="";status("Saved! Reopen the Moodrot menu to play your sound.");await refresh()}catch(e){status(e.message||"Saving failed.")}finally{busy=false;controls()}
};
$("close").onclick=()=>{if((draft||recorder||busy)&&!confirm("Leave without saving?"))return;release();window.close()};
window.addEventListener("pagehide",()=>{release();if(previewUrl)URL.revokeObjectURL(previewUrl)});
refresh().catch(()=>status("Could not load saved sounds."));controls();