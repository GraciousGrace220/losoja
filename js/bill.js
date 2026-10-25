(() => {
  "use strict";
  if (window.__losojaBillJsLoaded) return;
  window.__losojaBillJsLoaded = true;
  const SUPABASE_URL = "https://ycxshwgeebskdozmornh.supabase.co";
  const SUPABASE_KEY = "sb_publishable_jFSLacwNupO6T8EnSqb2bw_bZmy7rVe";
  const API = `${SUPABASE_URL}/functions/v1/pay-bill`;
  const HISTORY_API = `${SUPABASE_URL}/rest/v1/bill_transactions`;
  const WALLET_API = `${SUPABASE_URL}/rest/v1/wallet_transactions`;
  const $ = (id) => document.getElementById(id);
  let airtimeBusy = false; let dataBusy = false; let dataPlansLoading = false; let pendingAirtime = false; let pendingData = false;
  function getSession(){ try{ return JSON.parse(localStorage.getItem("losoja_supabase_session")||"null"); }catch{ return null; } }
  function getAccessToken(){ return getSession()?.access_token||null; }
  function getUserId(){ return getSession()?.user?.id||null; }
  function escapeHTML(v){ return String(v??"").replace(/[&<>"']/g,c=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" })[c]); }
  function money(v){ const a=Number(v); return "₦"+(Number.isFinite(a)?a:0).toLocaleString("en-NG"); }
  function formatDate(v){ if(!v) return "Date unavailable"; const d=new Date(v); return Number.isNaN(d.getTime())?"Date unavailable":d.toLocaleString("en-NG"); }
  function showNotice(m,t="info",id=null){ const target=$(id)||$("authNotice")||($("dataTab")?.classList.contains("active")?$("dataProcessing"):$("airtimeProcessing")); if(!target){ console.log(m); return; } target.textContent=m; target.style.background=t==="error"?"#fdecec":t==="success"?"#e8f7ed":t==="warning"?"#fff7df":"#eef4ff"; target.style.color=t==="error"?"#a11":t==="success"?"#176b35":t==="warning"?"#805900":"#173d75"; target.style.display="block"; target.classList.add("show"); }
  function hideNotice(id){ const t=$(id); if(t){ t.textContent=""; t.classList.remove("show"); t.style.display="none"; } }
  function hideStaleAttemptNotice(s){ const t=$(s==="airtime"?"airtimeProcessing":"dataProcessing"); if(!t) return; const msg=String(t.textContent||"").toLowerCase(); const isStale=msg.includes("previous attempt")||msg.includes("previous airtime attempt is saved")||msg.includes("previous data attempt is saved")||msg.includes("previous airtime attempt is unresolved")||msg.includes("previous data attempt is unresolved"); if(isStale) hideNotice(s==="airtime"?"airtimeProcessing":"dataProcessing"); }
  async function requestHeaders(json=false){ let token; if(typeof window.ensureValidSupabaseSession==="function"){ const s=await window.ensureValidSupabaseSession(); token=s?.access_token; } else token=getAccessToken(); if(!token) throw new Error("Your session is unavailable. Please sign in again."); return { apikey:SUPABASE_KEY, Authorization:`Bearer ${token}`, ...(json?{"Content-Type":"application/json"}:{}) }; }
  async function readResponse(r){ const t=await r.text(); if(!t) return {}; try{ return JSON.parse(t); }catch{ return { message:t }; } }
  function getErrorMessage(d,f){ return d?.error||d?.message||d?.msg||d?.details||f; }
  async function apiRequest(p){ const h=await requestHeaders(true); const r=await fetch(API,{ method:"POST", headers:h, body:JSON.stringify(p) }); const data=await readResponse(r); if(!r.ok){ const e=new Error(getErrorMessage(data,`Request failed (${r.status}).`)); e.paymentNotStarted=data?.payment_not_started===true; throw e; } return data; }
  function attemptStorageKey(s){ const u=getUserId(); if(!u) throw new Error("Please sign in again."); return `losoja_bill_attempt_v1_${u}_${s}`; }
  function readAttempt(s){ try{ const v=localStorage.getItem(attemptStorageKey(s)); return v?JSON.parse(v):null; }catch{ return null; } }
  function saveAttempt(s,a){ localStorage.setItem(attemptStorageKey(s),JSON.stringify(a)); }
  function clearAttempt(s){ try{ localStorage.removeItem(attemptStorageKey(s)); }catch(e){ console.error(e); } }
  function makeFingerprint(s,d){ return JSON.stringify({ serviceType:s, network:d.network, phone:d.phone, amount:d.amount??null, planId:d.planId??null }); }
  function getOrCreateAttempt(s,d){ const fp=makeFingerprint(s,d); const ex=readAttempt(s); if(ex){ if(ex.fingerprint!==fp) throw new Error("A previous purchase attempt is still saved. Check bill history first. Do not start a different purchase until the earlier result is resolved."); return ex; } if(!crypto.randomUUID) throw new Error("Your browser cannot create a secure purchase reference. Please update your browser before continuing."); const att={ key:crypto.randomUUID(), fingerprint:fp, createdAt:new Date().toISOString() }; saveAttempt(s,att); return att; }
  async function findAttemptTransaction(att){ const u=getUserId(); if(!u||!att?.key) return null; const h=await requestHeaders(); const q=new URLSearchParams({ select:"id,user_id,status,amount,wallet_reference,idempotency_key", user_id:`eq.${u}`, idempotency_key:`eq.${att.key}`, limit:"1" }); const r=await fetch(`${HISTORY_API}?${q.toString()}`,{ headers:h }); const data=await readResponse(r); if(!r.ok||!Array.isArray(data)) return null; return data.find(row=>row.user_id===u&&row.idempotency_key===att.key)||null; }
  async function hasConfirmedRefund(tr){ const ref=tr?.wallet_reference; const amt=Number(tr?.amount); if(!ref||!Number.isFinite(amt)||amt<=0) return false; try{ const h=await requestHeaders(); const q=new URLSearchParams({ select:"id,type,amount,status,reference", reference:`eq.${ref}-REFUND`, type:"eq.deposit", status:"eq.completed", limit:"5" }); const r=await fetch(`${WALLET_API}?${q.toString()}`,{ headers:h }); if(!r.ok) return false; const rows=await readResponse(r); if(!Array.isArray(rows)) return false; return rows.some(row=>row.reference===`${ref}-REFUND`&&row.type==="deposit"&&row.status==="completed"&&Number.isFinite(Number(row.amount))&&Math.abs(Number(row.amount)-amt)<0.01); }catch(e){ console.warn(e); return false; } }
  async function reconcileAttempt(s){ const att=readAttempt(s); if(!att?.key) return false; let tr; try{ tr=await findAttemptTransaction(att); }catch(e){ console.warn(e); return false; } if(!tr) return false; const st=String(tr.status||"").toLowerCase(); if(["successful","success","completed"].includes(st)){ clearAttempt(s); return true; } if(st==="failed"||st==="reversed"){ const ref=await hasConfirmedRefund(tr); if(ref){ clearAttempt(s); return true; } } return false; }
  function syncAttemptStates(){ pendingAirtime=Boolean(readAttempt("airtime")); pendingData=Boolean(readAttempt("data")); const ab=$("airtimeButton"); const db=$("dataButton"); if(airtimeBusy) setButton(ab,true,"Processing..."); else if(pendingAirtime){ setButton(ab,true,"Previous Attempt — Check History"); showNotice("A previous airtime attempt is still unresolved. Check bill history before proceeding. Do not create another purchase while its outcome is uncertain.","warning","airtimeProcessing"); } else{ setButton(ab,false,"Buy Airtime"); hideStaleAttemptNotice("airtime"); } if(dataBusy) setButton(db,true,"Processing..."); else if(pendingData){ setButton(db,true,"Previous Attempt — Check History"); showNotice("A previous data attempt is still unresolved. Check bill history before proceeding. Do not create another purchase while its outcome is uncertain.","warning","dataProcessing"); } else{ setButton(db,false,"Buy Data"); hideStaleAttemptNotice("data"); } }
  async function loadHistory(){
    const container=$("billHistory"); if(!container) return;
    const userId=getUserId(); if(!userId||!getAccessToken()){ container.innerHTML="<p>Please sign in to view your bill history.</p>"; return; }
    container.textContent="Loading bill history...";
    try{
      const headers=await requestHeaders();
      const query=new URLSearchParams({ select:"*", user_id:`eq.${userId}`, order:"created_at.desc", limit:"20" });
      const response=await fetch(`${HISTORY_API}?${query.toString()}`,{ headers });
      const data=await readResponse(response); if(!response.ok||!Array.isArray(data)) throw new Error(getErrorMessage(data,"Could not load bill history."));
      await Promise.all([reconcileAttempt("airtime"),reconcileAttempt("data")]); syncAttemptStates();
      try{
        await apiRequest({ service_type:"check_pending_bills" });
        const headers2=await requestHeaders();
        const response2=await fetch(`${HISTORY_API}?${query.toString()}`,{ headers:headers2 });
        const data2=await readResponse(response2);
        if(response2.ok&&Array.isArray(data2)){ data.length=0; data2.forEach(i=>data.push(i)); }
      }catch(e){ console.warn("Auto-check failed",e); }
      if(data.length===0){ container.innerHTML="<p>No bill transactions yet.</p>"; return; }
      container.innerHTML=data.map(item=>{
        const status=String(item.status||"pending").toLowerCase();
        const statusColor=["success","successful","completed"].includes(status)?"#087a3e":["failed","refunded","reversed"].includes(status)?"#b42318":"#946200";
        const phone=item.phone||item.customer_identifier||"";
        return `<article class="history-row"><div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap"><strong>${escapeHTML(item.service_type||"Bill payment")}</strong><strong>${money(item.amount)}</strong></div><div class="history-details">${escapeHTML(item.provider||"")}${item.network?" · "+escapeHTML(item.network):""}${phone?" · "+escapeHTML(phone):""}${item.variation_code?" · Plan "+escapeHTML(item.variation_code):""}</div><p style="color:${statusColor};margin:8px 0">Status: ${escapeHTML(status)}</p><small class="muted">${escapeHTML(formatDate(item.created_at))}</small></article>`;
      }).join("");
    }catch(error){ container.textContent=error.message||"Could not load bill history."; console.error(error); } finally{ syncAttemptStates(); }
  }
  function setButton(b,d,t){ if(!b) return; b.disabled=d; b.textContent=t; }
  function validatePhone(p){ return /^\d{11}$/.test(p); }
  async function loadDataPlans(){
    const select=$("dataPlan"); if(!select||dataPlansLoading) return;
    dataPlansLoading=true; select.disabled=true; select.innerHTML='<option value="">Loading Toppa plans...</option>'; hideNotice("dataProcessing");
    try{
      const networkRaw=$("dataNetwork")?.value?.trim().toLowerCase()||"mtn";
      const result=await apiRequest({ service_type:"get_data_plans", network:networkRaw });
      if(result.success!==true) throw new Error(getErrorMessage(result,"Could not load data plans."));
      const networkLower=String(result.network||networkRaw||"mtn").toLowerCase();
      const networkUpper=networkLower.toUpperCase();
      let networkPlans=null;
      if(result.plans&&typeof result.plans==="object"){
        if(Array.isArray(result.plans)) networkPlans=result.plans;
        else networkPlans=result.plans[networkUpper]||result.plans[networkLower]||result.plans[networkRaw]||null;
      }
      if(!networkPlans&&Array.isArray(result.data)) networkPlans=result.data;
      if(!networkPlans&&Array.isArray(result.mtn_plans)) networkPlans=result.mtn_plans;
      if(!networkPlans&&result.plans) networkPlans=result.plans;
      const plans=[];
      function collectPlans(v){ if(Array.isArray(v)){ v.forEach(p=>{ if(p&&p.id!=null&&(p.price_raw!=null||p.price!=null)) plans.push(p); }); return; } if(v&&typeof v==="object") Object.values(v).forEach(collectPlans); }
      collectPlans(networkPlans);
      const uniquePlans=[...new Map(plans.map(p=>[String(p.id),p])).values()].sort((a,b)=>{ const pa=Number(a.price_raw??a.price??0); const pb=Number(b.price_raw??b.price??0); return pa-pb||String(a.name||"").localeCompare(String(b.name||"")); });
      if(!uniquePlans.length){ select.innerHTML='<option value="">No plans available</option>'; showNotice("No plans were returned for this network. Try refreshing later.","warning","dataProcessing"); return; }
      select.innerHTML='<option value="">Select a data plan</option>';
      uniquePlans.forEach(plan=>{
        const opt=document.createElement("option"); opt.value=String(plan.id);
        const name=plan.name||plan.size||`Plan ${plan.id}`; const size=plan.size&&plan.name?` — ${plan.size}`:""; const validity=plan.validity?` · ${plan.validity}`:"";
        const price=Number(plan.price_raw??plan.price); const displayPrice=Number.isFinite(price)&&price>0?money(price):String(plan.price||"");
        opt.textContent=`${name}${size}${validity} — ${displayPrice}`; select.appendChild(opt);
      });
    }catch(error){ select.innerHTML='<option value="">Unable to load plans — retry</option>'; showNotice(`${error.message} You can retry by changing the network or reopening Bills.`,"error","dataProcessing"); } finally{ dataPlansLoading=false; select.disabled=false; }
  }
  function restoreAttemptStates(){ syncAttemptStates(); }
  async function submitAirtime(e){
    e.preventDefault(); if(airtimeBusy||pendingAirtime){ showNotice("A previous airtime attempt is unresolved. Check bill history before starting another purchase.","warning","airtimeProcessing"); return; }
    const network=$("airtimeNetwork")?.value?.trim().toLowerCase(); const phone=$("airtimePhone")?.value?.trim(); const amount=Number($("airtimeAmount")?.value);
    if(!["mtn","airtel","glo","9mobile"].includes(network)){ showNotice("Please select a valid network.","error","airtimeProcessing"); return; }
    if(!validatePhone(phone)){ showNotice("Enter a valid 11-digit phone number.","error","airtimeProcessing"); return; }
    if(!Number.isFinite(amount)||amount<50||amount>50000){ showNotice("Airtime amount must be between ₦50 and ₦50,000.","error","airtimeProcessing"); return; }
    let attempt=null;
    try{
      if(!getUserId()||!getAccessToken()) throw new Error("Please sign in before buying airtime.");
      attempt=getOrCreateAttempt("airtime",{ network, phone, amount });
      airtimeBusy=true; window.paymentInProgress=true; syncAttemptStates();
      showNotice("Submitting airtime request. Please wait and do not refresh this page.","info","airtimeProcessing");
      const result=await apiRequest({ service_type:"airtime", network, phone, amount, idempotency_key:attempt.key });
      if(result.status==="pending"){ pendingAirtime=true; showNotice(`${result.message||"The result is still pending."} Check bill history before taking further action.`,"warning","airtimeProcessing"); }
      else if(result.status==="failed"||result.status==="reversed"){ if(result.refunded===true){ clearAttempt("airtime"); pendingAirtime=false; showNotice("The purchase failed and the wallet refund is confirmed.","success","airtimeProcessing"); $("airtimeForm")?.reset(); } else{ pendingAirtime=true; showNotice("The transaction has a final status, but its refund is not confirmed yet. Check history again before retrying.","warning","airtimeProcessing"); } }
      else if(result.success===true&&result.status==="successful"){ clearAttempt("airtime"); pendingAirtime=false; showNotice(result.message||"Airtime purchase confirmed.","success","airtimeProcessing"); $("airtimeForm")?.reset(); }
      else{ if(result.payment_not_started===true) clearAttempt("airtime"); throw new Error(getErrorMessage(result,"The airtime purchase was not confirmed.")); }
      await loadHistory();
    }catch(error){ if(error.paymentNotStarted===true) clearAttempt("airtime"); else if(attempt) pendingAirtime=true; showNotice(`${error.message||"Airtime request failed."} Check bill history before retrying.`,"error","airtimeProcessing"); await loadHistory(); } finally{ airtimeBusy=false; window.paymentInProgress=false; syncAttemptStates(); }
  }
  async function submitData(e){
    e.preventDefault(); if(dataBusy||pendingData){ showNotice("A previous data attempt is unresolved. Check bill history before starting another purchase.","warning","dataProcessing"); return; }
    const network=$("dataNetwork")?.value?.trim().toLowerCase(); const phone=$("dataPhone")?.value?.trim(); const planId=Number($("dataPlan")?.value);
    if(!["mtn","airtel","glo","9mobile"].includes(network)){ showNotice("Please select a valid network.","error","dataProcessing"); return; }
    if(!validatePhone(phone)){ showNotice("Enter a valid 11-digit phone number.","error","dataProcessing"); return; }
    if(!Number.isSafeInteger(planId)||planId<=0){ showNotice("Please select an available data plan.","error","dataProcessing"); return; }
    let attempt=null;
    try{
      if(!getUserId()||!getAccessToken()) throw new Error("Please sign in before buying data.");
      attempt=getOrCreateAttempt("data",{ network, phone, planId });
      dataBusy=true; window.paymentInProgress=true; syncAttemptStates();
      showNotice("Submitting data request. Please wait and do not refresh this page.","info","dataProcessing");
      const result=await apiRequest({ service_type:"data", network, phone, plan_id:planId, idempotency_key:attempt.key });
      if(result.status==="pending"){ pendingData=true; showNotice(`${result.message||"The result is still pending."} Check bill history before taking further action.`,"warning","dataProcessing"); }
      else if(result.status==="failed"||result.status==="reversed"){ if(result.refunded===true){ clearAttempt("data"); pendingData=false; showNotice("The purchase failed and the wallet refund is confirmed.","success","dataProcessing"); $("dataForm")?.reset(); } else{ pendingData=true; showNotice("The transaction has a final status, but its refund is not confirmed yet. Check history again before retrying.","warning","dataProcessing"); } }
      else if(result.success===true&&result.status==="successful"){ clearAttempt("data"); pendingData=false; showNotice(result.message||"Data purchase confirmed.","success","dataProcessing"); $("dataForm")?.reset(); }
      else{ if(result.payment_not_started===true) clearAttempt("data"); throw new Error(getErrorMessage(result,"The data purchase was not confirmed.")); }
      await loadHistory();
    }catch(error){ if(error.paymentNotStarted===true) clearAttempt("data"); else if(attempt) pendingData=true; showNotice(`${error.message||"Data request failed."} Check bill history before retrying.`,"error","dataProcessing"); await loadHistory(); } finally{ dataBusy=false; window.paymentInProgress=false; syncAttemptStates(); }
  }
  function init(){
    $("airtimeForm")?.addEventListener("submit",submitAirtime);
    $("dataForm")?.addEventListener("submit",submitData);
    $("refreshHistory")?.addEventListener("click",loadHistory);
    $("dataNetwork")?.addEventListener("change",loadDataPlans);
    if(!getAccessToken()||!getUserId()) showNotice("Please sign in to buy airtime, buy data, and view bill history.","error","airtimeProcessing");
    restoreAttemptStates(); loadHistory(); loadDataPlans();
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init,{ once:true }); else init();
  window.losojaLoadBillHistory=loadHistory;
})();
