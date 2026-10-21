
/* =========================================================
   LOSOJA AUTHENTICATION
   Supabase login, signup, session and logout
========================================================= */

if (!window.__losoja_auth_loaded) {
  window.__losoja_auth_loaded = true;

  const SUPABASE_URL =
    "https://ycxshwgeebskdozmornh.supabase.co";

  const SUPABASE_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXAiLCJyZWYiOiJ5Y3hzd2hnZWVic2tkb3ptb3JuaCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzg4MzA2NDY1LCJleHAiOjIxMDM4ODI0NjV9.tMl7wILdVDhu0RWFaG_84ngJEryLt2c5cB8MEKW3kfU";


  /* =========================================================
     SESSION
  ========================================================= */

  function saveSession(session) {
    try {
      localStorage.setItem(
        "losoja_supabase_session",
        JSON.stringify(session)
      );
    } catch (error) {
      console.error("LosOja: Could not save session.", error);
    }
  }


  function getSession() {
    try {
      return JSON.parse(
        localStorage.getItem("losoja_supabase_session") || "null"
      );
    } catch (error) {
      return null;
    }
  }


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
     SIGNUP
  ========================================================= */

  async function signUp(email, password, name) {
    const data = await authRequest(
      "signup",
      {
        email: email.trim(),
        password: password,
        data: {
          full_name: name.trim()
        }
      }
    );

    /*
      If Supabase requires email confirmation, a session
      might not be created immediately. Handle that case
      without falsely reporting a successful login.
    */

    if (data.access_token && data.user) {
      saveSession(data);
    } else if (data.user && !data.session) {
      return {
        ...data,
        requiresEmailConfirmation: true
      };
    } else {
      await signIn(email, password);
    }

    return data;
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
