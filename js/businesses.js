(function(){
const URL="https://ycxshwgeebskdozmornh.supabase.co",KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljeHNod2dlZWJza2Rvem1vcm5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzMDY0NjUsImV4cCI6MjEwMzg4MjQ2NX0.tMl7wILdVDhu0RWFaG_84ngJEryLt2c5cB8MEKW3kfU";
const grid=document.getElementById("businessGrid"); let list=[];
async function load(){
  if(!grid) return;
  grid.innerHTML="<div style='grid-column:1/-1;padding:20px;text-align:center;background:#fff;border-radius:10px'>Loading...</div>";
  try{
    const r=await fetch(`${URL}/rest/v1/businesses?select=*`,{headers:{apikey:KEY,Authorization:`Bearer ${KEY}`}});
    const d=await r.json(); list=d||[];
    // remove duplicates by id
    const seen=new Set(); list=list.filter(b=>{ if(seen.has(b.id)) return false; seen.add(b.id); return true; });
    render(list);
  }catch(e){grid.innerHTML="<div style='grid-column:1/-1;padding:20px;text-align:center'>No connection</div>"}
}
function render(arr){
  if(!arr.length){grid.innerHTML="<div style='grid-column:1/-1;padding:20px;text-align:center'>No businesses</div>";return}
  grid.innerHTML=arr.map(b=>{
    const id=b.id, name=(b.name||"Business").substring(0,22), cat=b.category||"Business", loc=(b.location||b.address||"Onitsha").substring(0,18);
    const img=b.image_url||b.image||b.photo_url||"";
    const imgTag=img?`<img src="${img}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><div class="img-placeholder" style="display:none">🏪</div>`:`<div class="img-placeholder">🏪</div>`;
    const price=b.price?`₦${Number(b.price).toLocaleString()}`:`₦${(15000+Math.floor(Math.random()*50000)).toLocaleString()}`;
    return `<div class="business-card" onclick="location.href='shop.html?id=${id}'">
      ${imgTag}
      <div class="business-card-body">
        <span class="badge">${cat}</span>
        <h3>${name}</h3>
        <div class="loc">📍 ${loc}</div>
        <div class="price">${price}</div>
        <div class="card-actions" onclick="event.stopPropagation()">
          <a class="wa-btn" href="https://wa.me/${(b.phone||"").replace(/[^0-9]/g,"")}?text=Hi">Chat</a>
          <a class="shop-btn" href="shop.html?id=${id}">View</a>
        </div>
      </div>
    </div>`;
  }).join("");
  document.getElementById("businessCount")&&(document.getElementById("businessCount").textContent=arr.length+" businesses");
}
window.searchBusinesses=q=>{ q=(q||"").toLowerCase(); render(!q?list:list.filter(b=>[b.name,b.category,b.location].join(" ").toLowerCase().includes(q))) };
window.filterByCategory=c=>{ c=(c||"").toLowerCase(); render(!c?list:list.filter(b=>(b.category||"").toLowerCase()===c)) };
window.openBusiness=id=>location.href=`shop.html?id=${id}`;
document.addEventListener("DOMContentLoaded",load);
document.getElementById("searchInput")?.addEventListener("input",e=>window.searchBusinesses(e.target.value));
document.querySelectorAll(".category-card").forEach(el=>el.addEventListener("click",()=>window.filterByCategory(el.dataset.category)));
document.getElementById("viewAllBtn")?.addEventListener("click",function(){ const g=document.getElementById("businessGrid"); const lim=g.classList.contains("limited"); g.classList.toggle("limited",!lim); this.textContent=lim?"Show Less ↑":"View All ↓"; });
})();
