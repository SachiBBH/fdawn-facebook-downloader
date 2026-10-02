const form=document.getElementById("form");
const url=document.getElementById("url");
const status=document.getElementById("status");
let quality="hd";

document.querySelectorAll(".download-btn").forEach(btn=>{
  btn.addEventListener("click",()=>{quality=btn.dataset.quality;
    document.querySelectorAll(".download-btn").forEach(x=>x.classList.remove("clicked"));
    btn.classList.add("clicked");
  });
});

document.getElementById("paste").onclick=async()=>{
  try{url.value=await navigator.clipboard.readText();status.textContent="Link pasted. Choose a download option."}
  catch{status.textContent="Paste manually because clipboard permission was denied."}
};

form.onsubmit=async e=>{
  e.preventDefault();
  if(!url.value.trim()){status.textContent="Enter a Facebook video URL.";return}
  status.textContent=`Preparing ${quality==="hd"?"HD":"Default"} video...`;
  try{
    const r=await fetch("/api/download",{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({url:url.value.trim(),quality})});
    if(!r.ok){const j=await r.json().catch(()=>({}));throw new Error(j.error||"Download failed.")}
    const blob=await r.blob();
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);
    a.download=`fdawn-${quality}.mp4`;document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(a.href),1000);
    status.textContent="Download started.";
  }catch(err){status.textContent=err.message}
};