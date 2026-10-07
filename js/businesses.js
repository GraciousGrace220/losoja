(function(){
"use strict";
const SUPABASE_URL="https://ycxshwgeebskdozmornh.supabase.co";
const SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljeHNod2dlZWJza2Rvem1vcm5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzMDY0NjUsImV4cCI6MjEwMzg4MjQ2NX0.tMl7wILdVDhu0RWFaG_84ngJEryLt2c5cB8MEKW3kfU";
const grid=document.getElementById("businessGrid");
let businesses=[],loaded=false,loading=false,promise=null;
function esc(v){if(v==null)return"";return String(v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");}
function showLoading(){if(grid)grid.innerHTML=`<div class="loading-card"><p>Loading businesses...</p></div>`;}
function showError(m){if(grid)grid.innerHTML=`<div class="loading-card"><p>${esc(m)}</p><button id="retryBtn" style="margin-top:10px;padding:8px 16px;background:#087a3e;color:#fff;border:0;border-radius:8px">Try Again</button></div>`;document.getElementById("retryBtn")?.addEventListener("click",()=>loadBusinesses(true));}
async function getBusinesses(){
  try{
    const r=await fetch(`${SUPABASE_URL}/rest/v1/businesses?select=*`,{headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`}});
    if(!r.ok){showError("Error "+r.status);return[];}
    const d=await r.json(); return Array.isArray(d)?d:[];
  }catch(e){showError("No connection");return[];}
}
function loadBusinesses(force){
  if(loaded&&!force){render(businesses);return Promise.resolve(businesses);}
  if(loading&&promise)return promise;
  if(!grid)return Promise.resolve([]);
  loading=true;showLoading();
  promise=getBusinesses().then(d=>{businesses=Array.isArray(d)?d:[];loaded=true;window.losojaBusinesses=businesses;render(businesses);return businesses;}).finally(()=>{loading=false;promise=null;});
  return promise;
}
function render(list){
  if(!grid)return;
  if(!list||!list.length){grid.innerHTML=`<div class="loading-card"><p>No businesses found.</p></div>`;return;}
  grid.innerHTML=list.map(b=>{
    const id=esc(b.id),name=esc(b.name||"Business"),cat=esc(b.category||"Business"),loc=esc(b.location||b.address||"Nigeria"),phone=esc(b.phone||""),img=String(b.image_url||b.image||b.photo_url||"").trim();
    let saved=false;try{const s=JSON.parse(localStorage.getItem("losoja_saved_items")||"[]");saved=s.some(x=>x.type==="business"&&String(x.id)===String(b.id));}catch{}
    const imgHTML=img?`<div style="position:relative"><img src="${esc(img)}" alt="${name}"><button onclick="event.stopPropagation();window.toggleSavedBusiness('${id}')" style="position:absolute;top:6px;right:6px;width:28px;height:28px;border-radius:50%;border:0;background:#fff">${saved?"❤️":"♡"}</button></div>`:`<div style="height:130px;background:#eef8f2;display:flex;align-items:center;justify-content:center;font-size:28px">🏪<button onclick="event.stopPropagation();window.toggleSavedBusiness('${id}')" style="position:absolute;top:6px;right:6px;width:28px;height:28px;border-radius:50%;border:0;background:#fff">${saved?"❤️":"♡"}</button></div>`;
    return `<article class="business-card" onclick="window.openBusiness('${id}')"><div style="position:relative">${imgHTML}</div><div class="business-card-body"><span class="badge">${cat}</span><h3>${name}</h3><p>📍 ${loc}</p>${phone?`<p style="color:#087a3e;font-weight:700">📞 ${phone}</p>`:""}<div style="display:flex;gap:5px;margin-top:6px"><a href="https://wa.me/${phone.replace(/[^0-9]/g,'')}" onclick="event.stopPropagation()" style="flex:1;background:#087a3e;color:#fff;padding:5px;border-radius:6px;text-align:center;font-size:10px;font-weight:800;text-decoration:none">WhatsApp</a><a href="shop.html?id=${id}" onclick="event.stopPropagation()" style="flex:1;background:#fff;color:#087a3e;border:1px solid #087a3e;padding:5px;border-radius:6px;text-align:center;font-size:10px;font-weight:800;text-decoration:none">Shop</a></div></div></article>`;
  }).join("");
}
window.toggleSavedBusiness=function(id){
  let saved=[];try{saved=JSON.parse(localStorage.getItem("losoja_saved_items")||"[]");}catch{saved=[];}
  const idx=saved.findIndex(x=>x.type==="business"&&String(x.id)===String(id));
  if(idx!==-1)saved.splice(idx,1);else{const b=businesses.find(x=>String(x.id)===String(id));if(!b)return;saved.push({type:"business",id:String(b.id),name:b.name,category:b.category,location:b.location||b.address,phone:b.phone,image:b.image_url||b.image});}
  localStorage.setItem("losoja_saved_items",JSON.stringify(saved));render(businesses);
};
window.searchBusinesses=function(q){
  q=String(q||"").toLowerCase().trim();if(!q){render(businesses);return;}
  const r=businesses.filter(b=>[b.name,b.category,b.location,b.address,b.phone,b.description].join(" ").toLowerCase().includes(q));
  render(r);
};
window.filterByCategory=window.filterBusinessesByCategory=function(cat){
  cat=String(cat||"").toLowerCase().trim();if(!cat){render(businesses);return;}
  const r=businesses.filter(b=>String(b.category||"").toLowerCase()===cat);
  render(r);
};
window.openBusiness=function(id){const b=businesses.find(x=>String(x.id)===String(id));if(!b)return;window.losojaSelectedBusiness=b;if(typeof window.showBusinessDetails==="function"){window.showBusinessDetails(b);return;}window.location.href=`shop.html?id=${id}`;};
window.loadBusinesses=loadBusinesses;window.renderBusinesses=render;
document.addEventListener("DOMContentLoaded",()=>loadBusinesses());
document.getElementById("searchInput")?.addEventListener("input",e=>window.searchBusinesses(e.target.value));
document.querySelectorAll(".category-card").forEach(el=>el.addEventListener("click",()=>window.filterByCategory(el.dataset.category)));
})();
