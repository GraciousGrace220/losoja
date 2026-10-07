const URL="https://ycxshwgeebskdozmornh.supabase.co",KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljeHNod2dlZWJza2Rvem1vcm5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzMDY0NjUsImV4cCI6MjEwMzg4MjQ2NX0.tMl7wILdVDhu0RWFaG_84ngJEryLt2c5cB8MEKW3kfU";
async function load(){
 const g=document.getElementById("businessGrid"); if(!g) return;
 const r=await fetch(`${URL}/rest/v1/businesses?select=*`,{headers:{apikey:KEY,Authorization:`Bearer ${KEY}`}});
 const data=await r.json();
 g.innerHTML=data.map(b=>{
  const img=b.image_url||b.image||"";
  const imgH=img?`<img src="${img}" onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">`:`<div style="height:150px;background:#eef8f2;display:flex;align-items:center;justify-content:center;font-size:30px">🏪</div>`;
  return `<div class="business-card">
    ${imgH}
    <div class="business-card-body">
      <span style="font-size:8px;background:#eef8f2;color:#087a3e;padding:2px 6px;border-radius:10px;font-weight:800">${b.category||"Business"}</span>
      <h3>${b.name||"Business"}</h3>
      <p>📍 ${b.location||"Nigeria"}</p>
      <p>📞 ${b.phone||""}</p>
      <div class="card-btns">
        <a class="wa" href="https://wa.me/${(b.phone||"").replace(/[^0-9]/g,"")}">WhatsApp</a>
        <a class="shop" href="shop.html?id=${b.id}">Shop</a>
      </div>
    </div>
  </div>`;
 }).join("");
}
load();
