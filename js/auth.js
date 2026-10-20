const SUPABASE_URL="https://ycxshwgeebskdozmornh.supabase.co";
const SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljeHNod2dlZWJza2Rvem1vcm5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzMDY0NjUsImV4cCI6MjEwMzg4MjQ2NX0.tMl7wILdVDhu0RWFaG_84ngJEryLt2c5cB8MEKW3kfU";

// STOP DOUBLE LOAD
if(window.__losoja_auth_loaded){ console.warn("auth.js already loaded - skipping"); } else {
window.__losoja_auth_loaded = true;

function saveSession(s){ try{ localStorage.setItem("losoja_supabase_session", JSON.stringify(s)); }catch{} }
function getSession(){ try{ return JSON.parse(localStorage.getItem("losoja_supabase_session")||"null"); }catch{ return null; } }
async function getCurrentUser(){ const sess=getSession(); if(!sess) return null; return sess.user || null; }

async function signUp(email,password,name){
  const res=await fetch(`${SUPABASE_URL}/auth/v1/signup`,{method:"POST",headers:{apikey:SUPABASE_KEY,"Content-Type":"application/json"},body:JSON.stringify({email,password,data:{full_name:name}})});
  const data=await res.json(); if(!res.ok) throw new Error(data.msg||data.error_description||"Signup failed");
  // auto signin after signup
  await signIn(email,password);
  return data;
}
async function signIn(email,password){
  const res=await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`,{method:"POST",headers:{apikey:SUPABASE_KEY,"Content-Type":"application/json"},body:JSON.stringify({email,password})});
  const data=await res.json(); if(!res.ok) throw new Error(data.error_description||"Login failed");
  saveSession(data); return data;
}
function doLogout(){ localStorage.removeItem("losoja_supabase_session"); localStorage.removeItem("supabase.auth.token"); sessionStorage.clear(); window.location.href="index.html"; }

function tryOpenModal(type){
  const modal = document.getElementById("authModal");
  if(!modal){ console.error("authModal not found"); return; }
  const loginBox = document.getElementById("loginBox");
  const signupBox = document.getElementById("signupBox");
  modal.style.display="flex"; modal.classList.remove("hidden"); modal.classList.add("active");
  if(type==="signup"){ loginBox.style.display="none"; signupBox.style.display="block"; }
  else { signupBox.style.display="none"; loginBox.style.display="block"; }
  console.log("LosOja: Opened "+type);
}

window.getCurrentUser=getCurrentUser; window.signUp=signUp; window.signIn=signIn; window.logout=doLogout; window.signOut=doLogout;
window.openLogin=()=>tryOpenModal("login"); window.openSignup=()=>tryOpenModal("signup");

document.addEventListener("DOMContentLoaded",()=>{
  // forms
  document.getElementById("loginForm")?.addEventListener("submit", async (e)=>{
    e.preventDefault(); const email=document.getElementById("loginEmail").value; const pass=document.getElementById("loginPassword").value;
    try{ await signIn(email,pass); location.reload(); }catch(err){ alert(err.message); }
  });
  document.getElementById("signupForm")?.addEventListener("submit", async (e)=>{
    e.preventDefault(); const email=document.getElementById("signupEmail").value; const pass=document.getElementById("signupPassword").value; const name=document.getElementById("signupName").value;
    try{ await signUp(email,pass,name); alert("Account created!"); location.reload(); }catch(err){ alert(err.message); }
  });
  // close on overlay
  const modal=document.getElementById("authModal");
  modal?.addEventListener("click",(e)=>{ if(e.target===modal){ modal.style.display="none"; modal.classList.add("hidden"); }});
  // switch buttons
  document.getElementById("openSignupFromLogin")?.addEventListener("click",(e)=>{e.preventDefault(); window.openSignup();});
  document.getElementById("openLoginFromSignup")?.addEventListener("click",(e)=>{e.preventDefault(); window.openLogin();});
});

} // end guard
