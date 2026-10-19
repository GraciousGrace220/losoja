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
  if(sess?.user) return {user:sess.user, session:sess};
  return {user:null};
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
function signOut(){
  localStorage.removeItem("losoja_supabase_session");
  location.reload();
}
window.getCurrentUser=getCurrentUser;
window.signUp=signUp;
window.signIn=signIn;
window.signOut=signOut;

// Auto bind buttons if they exist
document.addEventListener("DOMContentLoaded",()=>{
  const loginBtn=document.getElementById("loginBtn");
  const signupBtn=document.getElementById("signupBtn");
  if(loginBtn){
    loginBtn.onclick=async()=>{
      const e=document.getElementById("email")?.value||prompt("Email");
      const p=document.getElementById("password")?.value||prompt("Password");
      try{ await signIn(e,p); alert("Welcome back!"); location.reload(); }catch(err){ alert(err.message); }
    }
  }
  if(signupBtn){
    signupBtn.onclick=async()=>{
      const e=document.getElementById("email")?.value||prompt("Email");
      const p=document.getElementById("password")?.value||prompt("Password");
      try{ await signUp(e,p); alert("Check email to confirm, then login"); }catch(err){ alert(err.message); }
    }
  }
});
// Make logout global for account.html
window.logout = async function() {
  if(window.supabaseClient) await window.supabaseClient.auth.signOut();
  if(window.supabase) await window.supabase.auth.signOut();
  localStorage.clear();
}
