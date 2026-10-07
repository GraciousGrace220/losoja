const URL="https://ycxshwgeebskdozmornh.supabase.co",KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljeHNod2dlZWJza2Rvem1vcm5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzMDY0NjUsImV4cCI6MjEwMzg4MjQ2NX0.tMl7wILdVDhu0RWFaG_84ngJEryLt2c5cB8MEKW3kfU";
async function load(){
 const g=document.getElementById("businessGrid"); if(!g) return;
 const r=await fetch(`${URL}/rest/v1/businesses?select=*`,{headers:{apikey:KEY,Authorization:`Bearer ${KEY}`}});
 let data=await r.json();
 const seen=new Set(); data=data.filter(b=>{const k=(b.phone||b.name); if(seen.has(k)) return false; seen.add(k); return true;});
 g.innerHTML=data.map(b=>{
  const im=b.image_url||b.image||"";
  const img=im?`<img src="${im}" onerror="this.style.display='none'">`:`<div style="height:130px;background:linear-gradient(135deg,#087a3e,#22c55e);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:900">LosOja</div>`;
  return `<div class="biz" onclick="location.href='shop.html?id=${b.id}'">
   ${img}
   <div class="in">
     <span class="tag">${b.category||"Business"}</span>
     <h3>${b.name}</h3>
     <p>📍 ${b.location||"Nigeria"}</p>
     <p>📞 ${b.phone||""}</p>
     <div class="btns" onclick="event.stopPropagation()">
       <a class="w" href="https://wa.me/${(b.phone||"").replace(/[^0-9]/g,"")}">WhatsApp</a>
       <a class="s" href="shop.html?id=${b.id}">Shop</a>
     </div>
   </div>
  </div>`;
 }).join("");
}
load();
document.getElementById("searchInput")?.addEventListener("input",e=>{
 const q=e.target.value.toLowerCase();
 document.querySelectorAll(".biz").forEach(card=>{card.style.display=card.innerText.toLowerCase().includes(q)?"":"none"})
});
