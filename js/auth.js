if(window.__losoja_auth_loaded){}else{
window.__losoja_auth_loaded=true;
const SUPABASE_URL="https://ycxshwgeebskdozmornh.supabase.co";
const SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljeHNod2dlZWJza2Rvem1vcm5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzMDY0NjUsImV4cCI6MjEwMzg4MjQ2NX0.tMl7wILdVDhu0RWFaG_84ngJEryLt2c5cB8MEKW3kfU";
function saveSession(s){try{localStorage.setItem("losoja_supabase_session",JSON.stringify(s))}catch{}}
function getSession(){try{return JSON.parse(localStorage.getItem("losoja_supabase_session")||"null")}catch{return null}}
async function getCurrentUser(){const sess=getSession();if(!sess)return null;return sess.user||null}
async function signUp(email,password,name){const r=await fetch(`${SUPABASE_URL}/auth/v1/signup`,{method:"POST",headers:{apikey:SUPABASE_KEY,"Content-Type":"application/json"},body:JSON.stringify({email,password,data:{full_name:name}})});const d=await r.json();if(!r.ok)throw new Error(d.msg||"Signup failed");await signIn(email,password);return d}
async function signIn(email,password){const r=await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`,{method:"POST",headers:{apikey:SUPABASE_KEY,"Content-Type":"application/json"},body:JSON.stringify({email,password})});const d=await r.json();if(!r.ok)throw new Error(d.error_description||"Login failed");saveSession(d);return d}
function doLogout(){localStorage.removeItem("losoja_supabase_session");location.href="index.html"}
function tryOpenModal(type){
  const modal=document.getElementById("authModal");if(!modal)return;
  const loginBox=document.getElementById("loginBox");const signupBox=document.getElementById("signupBox");
  modal.style.display="flex";modal.classList.remove("hidden");modal.classList.add("active");
  if(type==="signup"){loginBox.style.display="none";signupBox.style.display="block"}else{signupBox.style.display="none";loginBox.style.display="block"}
  console.log("LosOja: Opened "+type)
}
window.getCurrentUser=getCurrentUser;window.signUp=signUp;window.signIn=signIn;window.logout=doLogout;window.signOut=doLogout;
window.openLogin=()=>tryOpenModal("login");window.openSignup=()=>tryOpenModal("signup");
document.addEventListener("DOMContentLoaded",()=>{
  document.getElementById("loginForm")?.addEventListener("submit",async e=>{e.preventDefault();try{await signIn(loginEmail.value,loginPassword.value);location.reload()}catch(err){alert(err.message)}});
  document.getElementById("signupForm")?.addEventListener("submit",async e=>{e.preventDefault();try{await signUp(signupEmail.value,signupPassword.value,signupName.value);alert("Account created!");location.reload()}catch(err){alert(err.message)}});
  document.getElementById("openSignupFromLogin")?.addEventListener("click",e=>{e.preventDefault();window.openSignup()});
  document.getElementById("openLoginFromSignup")?.addEventListener("click",e=>{e.preventDefault();window.openLogin()});
  document.getElementById("authModal")?.addEventListener("click",e=>{if(e.target.id==="authModal"){e.currentTarget.style.display="none";e.currentTarget.classList.add("hidden")}});
});
}
