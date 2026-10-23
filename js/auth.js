
/* =========================================================
   LOSOJA AUTHENTICATION
   Supabase login, signup, session and logout
========================================================= */

if (!window.__losoja_auth_loaded) {
  window.__losoja_auth_loaded = true;

  const SUPABASE_URL =
    "https://ycxshwgeebskdozmornh.supabase.co";

 const SUPABASE_KEY =
    "sb_publishable_jFSLacwNupO6T8EnSqb2bw_bZmy7rVe";

 
  /* =========================================================
     SESSION
  ========================================================= */

  function getSession() {
    try {
      return JSON.parse(
        localStorage.getItem("losoja_supabase_session") || "null"
      );
    } catch (error) {
      return null;
    }
  }
function saveSession(session) {
  localStorage.setItem(
    "losoja_supabase_session",
    JSON.stringify(session)
  );
}
  /* =========================================================
     SESSION REFRESH — KEEP EXISTING LOGIN SYSTEM
  ========================================================= */

  let losojaRefreshPromise = null;

  function getTokenExpiry(token) {
    try {
      const payload = token.split(".")[1];
      if (!payload) return 0;

      const base64 = payload
        .replace(/-/g, "+")
        .replace(/_/g, "/");

      const decoded = atob(
        base64 + "=".repeat((4 - base64.length % 4) % 4)
      );

      return Number(JSON.parse(decoded).exp) * 1000 || 0;
    } catch (error) {
      return 0;
    }
  }

  async function refreshSupabaseSession() {
    if (losojaRefreshPromise) {
      return losojaRefreshPromise;
    }

    losojaRefreshPromise = (async () => {
      const session = getSession();

      if (!session?.refresh_token) {
        throw new Error("Please log in again to refresh your session.");
      }

      const response = await fetch(
        `${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`,
        {
          method: "POST",
          headers: {
            apikey: SUPABASE_KEY,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            refresh_token: session.refresh_token
          })
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.access_token) {
        throw new Error(
          data.msg ||
          data.message ||
          data.error_description ||
          data.error ||
          "Session refresh failed. Please log in again."
        );
      }

      const updatedSession = {
        ...session,
        ...data,
        user: data.user || session.user,
        expires_at:
          data.expires_at ||
          Math.floor(Date.now() / 1000) +
            Number(data.expires_in || 3600)
      };

      saveSession(updatedSession);
      return updatedSession;
    })();

    try {
      return await losojaRefreshPromise;
    } finally {
      losojaRefreshPromise = null;
    }
  }

  async function ensureValidSupabaseSession() {
    const session = getSession();

    if (!session?.access_token) {
      throw new Error("Please log in to continue.");
    }

    const tokenExpiry = getTokenExpiry(session.access_token);
    const savedExpiry = Number(session.expires_at || 0) * 1000;
    const expiry = tokenExpiry || savedExpiry;

    if (expiry && expiry > Date.now() + 60000) {
      return session;
    }

    return await refreshSupabaseSession();
  }

  async function getSupabaseAccessToken() {
    const session = await ensureValidSupabaseSession();
    return session.access_token;
  }

  async function getSupabaseSession() {
    return await ensureValidSupabaseSession();
  }

  window.refreshSupabaseSession = refreshSupabaseSession;
  window.ensureValidSupabaseSession = ensureValidSupabaseSession;
  window.getSupabaseAccessToken = getSupabaseAccessToken;
  window.getSupabaseSession = getSupabaseSession;


  async function getCurrentUser() {
    const session = getSession();

    if (!session) return null;

    return session.user || null;
  }


  window.getCurrentUser = getCurrentUser;


  /* =========================================================
     AUTHENTICATION REQUEST
  ========================================================= */

  async function authRequest(path, body) {
    const response = await fetch(
      `${SUPABASE_URL}/auth/v1/${path}`,
      {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      }
    );

    let data;

    try {
      data = await response.json();
    } catch (error) {
      throw new Error("Unable to read the server response.");
    }

    if (!response.ok) {
      throw new Error(
        data.error_description ||
        data.msg ||
        data.message ||
        data.error ||
        "Authentication failed. Please try again."
      );
    }

    return data;
  }


  /* =========================================================
     LOGIN
  ========================================================= */

  async function signIn(email, password) {
    const data = await authRequest(
      "token?grant_type=password",
      {
        email: email.trim(),
        password: password
      }
    );

    if (!data.access_token || !data.user) {
      throw new Error(
        "Login response did not contain a valid user session."
      );
    }

    saveSession(data);

    return data;
  }


  window.signIn = signIn;

/* =========================================================
   FORGOT PASSWORD — SEND RESET EMAIL
========================================================= */

async function forgotPassword(email) {
  email = String(email || "").trim();

  if (!email) {
    throw new Error("Please enter your email address.");
  }

  const response = await fetch(
    `${SUPABASE_URL}/auth/v1/recover?redirect_to=${encodeURIComponent(
      "https://losoja.com.ng/reset-password.html"
    )}`,
    {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email })
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message ||
      data.msg ||
      data.error_description ||
      data.error ||
      "Unable to send the password reset email. Please try again."
    );
  }

  return data;
}

window.forgotPassword = forgotPassword;


  
/* =========================================================
   SIGNUP
========================================================= */

async function signUp(email, password, name) {
  const data = await authRequest("signup", {
    email: email.trim(),
    password: password,
    data: {
      full_name: name.trim()
    },
    redirect_to: "https://losoja.com.ng/"
  });

  // Supabase may require email confirmation before login.
  if (data.user && !data.access_token) {
    return {
      ...data,
      requiresEmailConfirmation: true
    };
  }

  // Save a session only when Supabase returns one.
  if (data.access_token && data.user) {
    saveSession(data);
    return data;
  }

  if (data.user && data.session?.access_token) {
    saveSession(data.session);
    return data;
  }

  throw new Error(
    "Signup response was incomplete. Please try again."
  );
}

window.signUp = signUp;


  /* =========================================================
     LOGOUT
  ========================================================= */

  function doLogout() {
    localStorage.removeItem("losoja_supabase_session");

    window.location.href = "index.html";
  }


  window.logout = doLogout;
  window.signOut = doLogout;


  /* =========================================================
     OPEN AND CLOSE LOGIN / SIGNUP MODALS
  ========================================================= */

 
function closeAuthModals() {
  const loginModal = document.getElementById("loginModal");
  const signupModal = document.getElementById("signupModal");

  if (loginModal) {
    loginModal.classList.remove("active");
    loginModal.style.display = "none";
  }

  if (signupModal) {
    signupModal.classList.remove("active");
    signupModal.style.display = "none";
  }
}

function tryOpenModal(type) {
  const loginModal = document.getElementById("loginModal");
  const signupModal = document.getElementById("signupModal");

  if (!loginModal || !signupModal) {
    console.error("LosOja: Login or signup modal was not found.");
    return;
  }

  closeAuthModals();

  if (type === "signup") {
    signupModal.style.display = "flex";
    signupModal.classList.add("active");
  } else {
    loginModal.style.display = "flex";
    loginModal.classList.add("active");
  }

  console.log("LosOja: Opened " + type);
}

  window.openLogin = function () {
    tryOpenModal("login");
  };


  window.openSignup = function () {
    tryOpenModal("signup");
  };


  window.closeAuthModals = closeAuthModals;


  /* =========================================================
     AFTER LOGIN OR SIGNUP
  ========================================================= */

  function finishAuthentication() {
    /*
      Return to the account page when the visitor originally
      clicked Account while signed out.
    */

    const returnToAccount = sessionStorage.getItem(
      "losoja_return_to_account"
    );

    if (returnToAccount === "account.html") {
      sessionStorage.removeItem("losoja_return_to_account");
      window.location.href = "account.html";
      return;
    }

    /*
      Preserve any other existing return-to-page behaviour
      if the rest of the site uses this key.
    */

    window.location.reload();
  }


  /* =========================================================
     FORM HANDLERS
  ========================================================= */

  function showAuthError(message) {
    alert(message || "Something went wrong. Please try again.");
  }


  function setFormLoading(form, loading, loadingText) {
    if (!form) return;

    const button = form.querySelector(
      'button[type="submit"]'
    );

    if (!button) return;

    if (loading) {
      if (!button.dataset.originalText) {
        button.dataset.originalText = button.textContent;
      }

      button.disabled = true;
      button.textContent = loadingText;
    } else {
      button.disabled = false;

      if (button.dataset.originalText) {
        button.textContent = button.dataset.originalText;
      }
    }
  }


  function initialiseAuthForms() {
    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");

    const loginEmail = document.getElementById("loginEmail");
    const loginPassword = document.getElementById("loginPassword");
     
const forgotPasswordBtn = document.getElementById("forgotPasswordBtn");

if (forgotPasswordBtn && !forgotPasswordBtn.dataset.authBound) {
  forgotPasswordBtn.dataset.authBound = "true";

  forgotPasswordBtn.addEventListener("click", async function () {
    const email = loginEmail ? loginEmail.value.trim() : "";

    if (!email) {
      alert("Please enter your email address first.");
      if (loginEmail) loginEmail.focus();
      return;
    }

    forgotPasswordBtn.disabled = true;
    forgotPasswordBtn.textContent = "Sending...";

    try {
      await forgotPassword(email);

      alert(
        "If an account exists for this email, a password reset email will be sent. Check your inbox and spam folder."
      );
    } catch (error) {
      console.error("LosOja password recovery error:", error);
      alert(error.message || "Unable to send the reset email.");
    } finally {
      forgotPasswordBtn.disabled = false;
      forgotPasswordBtn.textContent = "Forgot Password?";
    }
  });
}


    const signupName = document.getElementById("signupName");
    const signupEmail = document.getElementById("signupEmail");
    const signupPassword = document.getElementById("signupPassword");

    const signupFromLogin = document.getElementById(
      "openSignupFromLogin"
    );

    const loginFromSignup = document.getElementById(
      "openLoginFromSignup"
    );


    /* -------------------------
       LOGIN FORM
    ------------------------- */

    if (loginForm && !loginForm.dataset.authBound) {
      loginForm.dataset.authBound = "true";

      loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        if (!loginEmail || !loginPassword) {
          showAuthError("The login form fields could not be found.");
          return;
        }

        const email = loginEmail.value.trim();
        const password = loginPassword.value;

        if (!email || !password) {
          showAuthError("Please enter your email and password.");
          return;
        }

        setFormLoading(loginForm, true, "Signing in...");

        try {
          await signIn(email, password);
          finishAuthentication();
        } catch (error) {
          console.error("LosOja login error:", error);
          showAuthError(error.message);
        } finally {
          setFormLoading(loginForm, false);
        }
      });
    }


    /* -------------------------
       SIGNUP FORM
    ------------------------- */

    if (signupForm && !signupForm.dataset.authBound) {
      signupForm.dataset.authBound = "true";

      signupForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        if (!signupName || !signupEmail || !signupPassword) {
          showAuthError("The signup form fields could not be found.");
          return;
        }

        const name = signupName.value.trim();
        const email = signupEmail.value.trim();
        const password = signupPassword.value;

        if (!name || !email || !password) {
          showAuthError("Please complete all signup fields.");
          return;
        }

        if (password.length < 6) {
          showAuthError(
            "Your password must contain at least 6 characters."
          );
          return;
        }

        setFormLoading(signupForm, true, "Creating account...");

        try {
          const result = await signUp(email, password, name);

          if (result.requiresEmailConfirmation) {
            alert(
              "Your account has been created. Please check your email " +
              "to confirm your account before signing in."
            );

            closeAuthModals();
            return;
          }

          finishAuthentication();
        } catch (error) {
          console.error("LosOja signup error:", error);
          showAuthError(error.message);
        } finally {
          setFormLoading(signupForm, false);
        }
      });
    }


    /* -------------------------
       SWITCH BETWEEN MODALS
    ------------------------- */

    if (signupFromLogin && !signupFromLogin.dataset.authBound) {
      signupFromLogin.dataset.authBound = "true";

      signupFromLogin.addEventListener("click", function (event) {
        event.preventDefault();
        window.openSignup();
      });
    }


    if (loginFromSignup && !loginFromSignup.dataset.authBound) {
      loginFromSignup.dataset.authBound = "true";

      loginFromSignup.addEventListener("click", function (event) {
        event.preventDefault();
        window.openLogin();
      });
    }


  
  
/* -------------------------
   CLOSE WHEN CLICKING OUTSIDE
------------------------- */

["loginModal", "signupModal"].forEach(function (modalId) {
  const modal = document.getElementById(modalId);

  if (!modal || modal.dataset.authCloseBound) return;

  modal.dataset.authCloseBound = "true";

  modal.addEventListener("click", function (event) {
    if (event.target === modal) {
      modal.classList.remove("active");
      modal.style.display = "none";
    }
  });
});



    /* -------------------------
       CLOSE BUTTONS
    ------------------------- */

    document.querySelectorAll("[data-close]").forEach(function (button) {
      if (button.dataset.authCloseBound) return;

      button.dataset.authCloseBound = "true";

      button.addEventListener("click", function () {
        const targetId = button.getAttribute("data-close");
        const target = document.getElementById(targetId);

       if (target) {
  target.classList.remove("active");
  target.style.display = "none";
}
      });
    });
  }


  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initialiseAuthForms,
      { once: true }
    );
  } else {
    initialiseAuthForms();
  }


  console.log("LosOja authentication loaded.");
}
