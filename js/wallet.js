const SUPABASE_URL="https://ycxshwgeebskdozmornh.supabase.co";
const SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljeHNod2dlZWJza2Rvem1vcm5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzMDY0NjUsImV4cCI6MjEwMzg4MjQ2NX0.tMl7wILdVDhu0RWFaG_84ngJEryLt2c5cB8MEKW3kfU";

function getSess(){
  try{ return JSON.parse(localStorage.getItem("losoja_supabase_session")||"null"); }catch{ return null; }
}

async function requestWithdrawal(){
  const amountEl = document.getElementById("withdrawAmount");
  const bankNameEl = document.getElementById("bankName");
  const acctNoEl = document.getElementById("accountNo");
  const acctNameEl = document.getElementById("accountName");
  
  const amount = parseInt(amountEl?.value || "0");
  if(!amount || amount < 1000){ alert("Minimum withdrawal is ₦1000"); return; }
  
  const sess = getSess();
  if(!sess?.access_token){ alert("Please login first"); return; }

  const payload = {
    user_id: sess.user.id,
    amount: amount,
    bank_name: bankNameEl?.value || "",
    account_number: acctNoEl?.value || "",
    account_name: acctNameEl?.value || "",
    status: "pending"
  };

  if(!payload.account_number){ alert("Enter account number"); return; }

  const btn = document.getElementById("withdrawBtn");
  if(btn){ btn.disabled=true; btn.innerText="Processing..."; }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/withdrawal_requests`,{
    method:"POST",
    headers:{
      apikey:SUPABASE_KEY,
      Authorization:`Bearer ${sess.access_token}`,
      "Content-Type":"application/json"
    },
    body: JSON.stringify(payload)
  });

  if(btn){ btn.disabled=false; btn.innerText="Withdraw Now"; }

  if(res.ok){
    alert("✅ Request sent! You go receive am in 24hrs. Manual payout till Paystack enable auto.");
    if(amountEl) amountEl.value="";
  }else{
    const txt = await res.text();
    alert("Failed: "+txt);
  }
}

// Auto attach
document.addEventListener("DOMContentLoaded",()=>{
  const btn = document.getElementById("withdrawBtn");
  if(btn) btn.onclick = requestWithdrawal;
  window.requestWithdrawal = requestWithdrawal;
});
