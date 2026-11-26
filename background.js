chrome.runtime.onMessage.addListener((msg,sender,reply)=>{
  if(msg?.type!=="MOODROT_OPEN_RECORDER" || sender.id!==chrome.runtime.id)return;
  let url;try{url=new URL(sender.url)}catch{return}
  if(url.protocol!=="https:"||!(url.hostname==="facebook.com"||url.hostname.endsWith(".facebook.com")))return;
  chrome.tabs.create({url:chrome.runtime.getURL("recorder.html")},()=>reply({ok:!chrome.runtime.lastError}));
  return true;
});