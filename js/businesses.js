const SUPA_URL="https://ycxshwgeebskdozmornh.supabase.co",SUPA_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljeHNod2dlZWJza2Rvem1vcm5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzMDY0NjUsImV4cCI6MjEwMzg4MjQ2NX0.tMl7wILdVDhu0RWFaG_84ngJEryLt2c5cB8MEKW3kfU";
async function loadBusinesses(){
 const grid=document.getElementById("businessGrid"); if(!grid) return;
 const res=await fetch(`${SUPA_URL}/rest/v1/businesses?select=*`,{headers:{apikey:SUPA_KEY,Authorization:`Bearer ${SUPA_KEY}`}});
 let businesses=await res.json();
 // remove duplicate by name
 businesses=[...new Map(businesses.map(b=>[b.name,b])).values()];
 grid.innerHTML=businesses.map(b=>`
  <div class="business-card" onclick="location.href='shop.html?id=${b.id}'">
    <img src="${b.image_url||b.image||'https://via.placeholder.com/300?text=LosOja'}" onerror="this.src='https://via.placeholder.com/300?text=LosOja'">
    <div class="info">
      <h3>${b.name}</h3>
      <p>📍 ${b.location||'Onitsha'}</p>
      <p>📞 ${b.phone||''}</p>
    </div>
  </div>`).join("");
}
loadBusinesses();
