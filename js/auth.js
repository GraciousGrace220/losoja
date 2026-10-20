const SUPABASE_URL="https://ycxshwgeebskdozmornh.supabase.co";
const SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljeHNod2dlZWJza2Rvem1vcm5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzMDY0NjUsImV4cCI6MjEwMzg4MjQ2NX0.tMl7wILdVDhu0RWFaG_84ngJEryLt2c5cB8MEKW3kfU";

function saveSession(session){
  try{ localStorage.setItem("losoja_supabase_session", JSON.stringify(session)); }catch{}
}
function getSession(){
  try{ return JSON.parse(localStorage.getItem("losoja_supabase_session")||"null"); }catch{ return null; }
}

async function getCurrentUser(){
  const sess=getSession();
  if(!sess) return null;
  return sess.user || sess.session?.user || sess;
}

async function signUp(email,password){
  const res=await fetch(`${SUPABASE_URL}/auth/v1/signup`,{
    method:"POST",
    headers:{apikey:SUPABASE_KEY,"Content-Type":"application/json"},
    body:JSON.stringify({email,password})
  });
  const data=await res.json();
  if(!res.ok) throw new Error(data.msg||data.error_description||"Signup failed");
  return data;
}

async function signIn(email,password){
  const res=await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`,{
    method:"POST",
    headers:{apikey:SUPABASE_KEY,"Content-Type":"application/json"},
    body:JSON.stringify({email,password})
  });
  const data=await res.json();
  if(!res.ok) throw new Error(data.error_description||"Login failed");
  saveSession(data);
  return data;
}

function doLogout(){
  localStorage.removeItem("losoja_supabase_session");
  localStorage.removeItem("supabase.auth.token");
  sessionStorage.clear();
  window.location.href = "index.html";
}

// --- FIX FOR INDEX.HTML ---
function tryOpenModal(type){
  // Try common modal IDs your index.html may use
  const modals = ["authModal","loginModal","signupModal","auth-modal","#authModal","#loginModal"];
  for(let id of modals){
    const el = document.getElementById(id.replace("#","")) || document.querySelector(id);
    if(el){
      el.style.display = "flex";
      el.style.display = "block";
      el.classList.add("active","open","show");
    }
  }
  // Try buttons
  if(type==="login"){
    document.getElementById("openLoginBtn")?.click();
    document.querySelector("[data-open-login]")?.click();
  } else {
    document.getElementById("openSignupBtn")?.click();
    document.querySelector("[data-open-signup]")?.click();
  }
  console.log("LosOja: Opened "+type+" modal");
}

window.getCurrentUser = getCurrentUser;
window.signUp = signUp;
window.signIn = signIn;
window.logout = doLogout;
window.signOut = doLogout;
window.openLogin = () => tryOpenModal("login");
window.openSignup = () => tryOpenModal("signup");

// Auto handle ?openLogin=1
document.addEventListener("DOMContentLoaded",()=>{
  const params = new URLSearchParams(window.location.search);
  if(params.get("openLogin")==="1"){
    setTimeout(()=> window.openLogin(), 500);
  }
  if(params.get("openSignup")==="1"){
    setTimeout(()=> window.openSignup(), 500);
  }
  
  // Bind if buttons exist in index.html
  const loginBtn=document.getElementById("loginBtn");
  const signupBtn=document.getElementById("signupBtn");
  if(loginBtn){
    loginBtn.onclick=async()=>{
      const e=document.getElementById("email")?.value;
      const p=document.getElementById("password")?.value;
      if(!e||!p) return window.openLogin();
      try{ await signIn(e,p); location.href="account.html"; }catch(err){ alert(err.message); }
    }
  }
  if(signupBtn){
    signupBtn.onclick=async()=>{
      const e=document.getElementById("email")?.value;
      const p=document.getElementById("password")?.value;
      if(!e||!p) return window.openSignup();
      try{ await signUp(e,p); alert("Check email, then login"); window.openLogin(); }catch(err){ alert(err.message); }
    }
  }
});

window.checkAuthAndRedirect = async function(){
  const user = await window.getCurrentUser();
  return user;
}
