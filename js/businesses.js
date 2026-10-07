const URL="https://ycxshwgeebskdozmornh.supabase.co",KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljeHNod2dlZWJza2Rvem1vcm5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzMDY0NjUsImV4cCI6MjEwMzg4MjQ2NX0.tMl7wILdVDhu0RWFaG_84ngJEryLt2c5cB8MEKW3kfU";
async function load(){
 const g=document.getElementById("businessGrid"); if(!g) return;
 g.innerHTML="<div style='grid-column:1/-1;padding:30px;text-align:center'>Loading...</div>";
 try{
 const r=await fetch(`${URL}/rest/v1/businesses?select=*`,{headers:{apikey:KEY,Authorization:`Bearer ${KEY}`}});
 let data=await r.json();
 // REMOVE DUPLICATES BY PHONE
 const seen=new Set();
 data=data.filter(b=>{
   const phone=(b.phone||"").replace(/[^0-9]/g,"");
   if(!phone) return true;
   if(seen.has(phone)) return false;
   seen.add(phone);
   return true;
 });
 g.innerHTML=data.map(b=>{
  const img=b.image_url||b.image||b.photo_url||"";
  const imgH=img?`<img src="${img}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x200?text=LosOja'">`:`<div style="height:150px;background:linear-gradient(135deg,#087a3e 0%,#0fb66a 100%);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:14px">LosOja</div>`;
  return `<div class="business-card">
    ${imgH}
    <div class="business-card-body">
      <span style="font-size:8px;background:#eef8f2;color:#087a3e;padding:2px 6px;border-radius:10px;font-weight:800;text-transform:uppercase">${b.category||"Business"}</span>
      <h3>${(b.name||"Business").substring(0,20)}</h3>
      <p style="font-size:10px;color:#6b7280">📍 ${(b.location||"Nigeria").substring(0,18)}</p>
      <div class="card-btns" onclick="event.stopPropagation()">
        <a class="wa" href="https://wa.me/${(b.phone||"").replace(/[^0-9]/g,"")}?text=Hi%20I%20found%20you%20on%20LosOja">WhatsApp</a>
        <a class="shop" href="shop.html?id=${b.id}">Shop</a>
      </div>
    </div>
  </div>`;
 }).join("");
 }catch(e){g.innerHTML="Error loading";}
}
load();
