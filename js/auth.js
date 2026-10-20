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

// FIXED MODAL CENTERING
function tryOpenModal(type){
  const modal = document.getElementById("authModal") || document.getElementById("loginModal") || document.querySelector(".modal");
  if(modal){
    modal.style.display = "flex";
    modal.style.justifyContent = "center";
    modal.style.alignItems = "center";
    modal.classList.add("active","open","show");
  }
  // Switch tab if your modal get tabs
  const loginForm = document.getElementById("loginForm") || document.getElementById("loginTab");
  const signupForm = document.getElementById("signupForm") || document.getElementById("signupTab");
  
  if(type==="signup"){
    if(loginForm) loginForm.style.display = "none";
    if(signupForm) signupForm.style.display = "block";
    document.querySelectorAll('[data-tab="signup"]').forEach(b=>b.click());
  } else {
    if(signupForm) signupForm.style.display = "none";
    if(loginForm) loginForm.style.display = "block";
    document.querySelectorAll('[data-tab="login"]').forEach(b=>b.click());
  }
  console.log("LosOja: Opened "+type);
}

window.getCurrentUser = getCurrentUser;
window.signUp = signUp;
window.signIn = signIn;
window.logout = doLogout;
window.signOut = doLogout;
window.openLogin = () => tryOpenModal("login");
window.openSignup = () => tryOpenModal("signup");

// Auto
document.addEventListener("DOMContentLoaded",()=>{
  const params = new URLSearchParams(window.location.search);
  if(params.get("openLogin")==="1") setTimeout(()=> window.openLogin(), 300);
  if(params.get("openSignup")==="1") setTimeout(()=> window.openSignup(), 300);

  // Close modal on overlay click
  const modal = document.getElementById("authModal");
  if(modal){
    modal.addEventListener("click", (e)=>{
      if(e.target===modal){
        modal.style.display="none";
        modal.classList.remove("active","show");
      }
    });
  }

  // Smart Account Button
  const accountBtn = document.getElementById("accountBtn");
  if(accountBtn){
    accountBtn.addEventListener("click", async (e)=>{
      e.preventDefault();
      e.stopPropagation();
      const user = await getCurrentUser();
      if(user){
        window.location.href = "account.html";
      } else {
        window.openLogin();
      }
    });
  }
});

window.checkAuthAndRedirect = async function(){
  return await getCurrentUser();
}
