(function () {

```
"use strict";

/* =========================================================
   LOSOJA AUTHENTICATION
   Supabase Auth
   ========================================================= */

const SUPABASE_URL =
    "https://ycxshwgeebskdozmornh.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_jFSLacwNupO6T8EnSqb2bw_bZmy7rVe";

const SESSION_KEY =
    "losoja_supabase_session";


/* =========================================================
   HELPERS
========================================================= */

function notify(message) {

    if (typeof window.showToast === "function") {
        window.showToast(message);
    } else {
        alert(message);
    }

}


function getSession() {

    try {

        const session =
            localStorage.getItem(SESSION_KEY);

        return session
            ? JSON.parse(session)
            : null;

    } catch (error) {

        return null;

    }

}


function saveSession(session) {

    if (session) {

        localStorage.setItem(
            SESSION_KEY,
            JSON.stringify(session)
        );

    } else {

        localStorage.removeItem(
            SESSION_KEY
        );

    }

}


function getAccessToken() {

    const session = getSession();

    return session?.access_token || null;

}


/* =========================================================
   SUPABASE REQUEST
========================================================= */

async function supabaseRequest(
    endpoint,
    options = {}
) {

    const headers = {

        "apikey":
            SUPABASE_KEY,

        "Content-Type":
            "application/json",

        "Accept":
            "application/json",

        ...(options.headers || {})

    };


    const token =
        getAccessToken();


    if (token) {

        headers.Authorization =
            "Bearer " + token;

    }


    const response =
        await fetch(
            SUPABASE_URL + endpoint,
            {
                ...options,
                headers: headers
            }
        );


    let data = null;


    try {

        data =
            await response.json();

    } catch (error) {

        data = null;

    }


    if (!response.ok) {

        const message =
            data?.msg ||
            data?.message ||
            data?.error_description ||
            data?.error ||
            "Something went wrong.";

        throw new Error(message);

    }


    return data;

}


/* =========================================================
   CREATE AUTH MODALS
========================================================= */

function createAuthModals() {

    if (
        document.getElementById("loginModal") &&
        document.getElementById("signupModal")
    ) {

        return;

    }


    /* -------------------------
       LOGIN MODAL
    ------------------------- */

    if (!document.getElementById("loginModal")) {

        const loginWrapper =
            document.createElement("div");

        loginWrapper.innerHTML = `

            <div
                id="loginModal"
                class="modal-overlay"
                style="display:none;"
            >

                <div class="modal">

                    <div class="modal-header">

                        <h2>Login to LosOja</h2>

                        <button
                            type="button"
                            class="modal-close"
                            id="closeLoginModal"
                            aria-label="Close"
                        >
                            ×
                        </button>

                    </div>

                    <form id="loginForm">

                        <div class="form-group">

                            <label for="loginEmail">
                                Email
                            </label>

                            <input
                                type="email"
                                id="loginEmail"
                                autocomplete="email"
                                required
                            >

                        </div>


                        <div class="form-group">

                            <label for="loginPassword">
                                Password
                            </label>

                            <input
                                type="password"
                                id="loginPassword"
                                autocomplete="current-password"
                                required
                            >

                        </div>


                        <button
                            type="submit"
                            class="primary-button"
                        >
                            Login
                        </button>


                        <p style="margin-top:15px;text-align:center;">

                            Don't have an account?

                            <button
                                type="button"
                                id="switchToSignup"
                                style="
                                    border:none;
                                    background:none;
                                    color:#087a3e;
                                    cursor:pointer;
                                    font-weight:700;
                                "
                            >
                                Sign Up
                            </button>

                        </p>

                    </form>

                </div>

            </div>

        `;

        document.body.appendChild(
            loginWrapper.firstElementChild
        );

    }


    /* -------------------------
       SIGNUP MODAL
    ------------------------- */

    if (!document.getElementById("signupModal")) {

        const signupWrapper =
            document.createElement("div");

        signupWrapper.innerHTML = `

            <div
                id="signupModal"
                class="modal-overlay"
                style="display:none;"
            >

                <div class="modal">

                    <div class="modal-header">

                        <h2>Create LosOja Account</h2>

                        <button
                            type="button"
                            class="modal-close"
                            id="closeSignupModal"
                            aria-label="Close"
                        >
                            ×
                        </button>

                    </div>


                    <form id="signupForm">

                        <div class="form-group">

                            <label for="signupName">
                                Full Name
                            </label>

                            <input
                                type="text"
                                id="signupName"
                                autocomplete="name"
                                required
                            >

                        </div>


                        <div class="form-group">

                            <label for="signupEmail">
                                Email
                            </label>

                            <input
                                type="email"
                                id="signupEmail"
                                autocomplete="email"
                                required
                            >

                        </div>


                        <div class="form-group">

                            <label for="signupPassword">
                                Password
                            </label>

                            <input
                                type="password"
                                id="signupPassword"
                                autocomplete="new-password"
                                minlength="6"
                                required
                            >

                        </div>


                        <button
                            type="submit"
                            class="primary-button"
                        >
                            Create Account
                        </button>


                        <p style="margin-top:15px;text-align:center;">

                            Already have an account?

                            <button
                                type="button"
                                id="switchToLogin"
                                style="
                                    border:none;
                                    background:none;
                                    color:#087a3e;
                                    cursor:pointer;
                                    font-weight:700;
                                "
                            >
                                Login
                            </button>

                        </p>

                    </form>

                </div>

            </div>

        `;

        document.body.appendChild(
            signupWrapper.firstElementChild
        );

    }

}


/* =========================================================
   OPEN / CLOSE MODALS
========================================================= */

window.openLogin = function () {

    createAuthModals();

    const signupModal =
        document.getElementById(
            "signupModal"
        );

    const loginModal =
        document.getElementById(
            "loginModal"
        );


    if (signupModal) {

        signupModal.style.display =
            "none";

    }


    if (loginModal) {

        loginModal.style.display =
            "flex";

    }

};


window.openSignup = function () {

    createAuthModals();

    const loginModal =
        document.getElementById(
            "loginModal"
        );

    const signupModal =
        document.getElementById(
            "signupModal"
        );


    if (loginModal) {

        loginModal.style.display =
            "none";

    }


    if (signupModal) {

        signupModal.style.display =
            "flex";

    }

};


window.closeModal = function (modalId) {

    const modal =
        document.getElementById(
            modalId
        );


    if (modal) {

        modal.style.display =
            "none";

    }

};


window.showLogin =
    window.openLogin;


window.showSignup =
    window.openSignup;


/* =========================================================
   GET CURRENT USER
========================================================= */

window.getCurrentUser = async function () {

    const token =
        getAccessToken();


    if (!token) {

        return null;

    }


    try {

        return await supabaseRequest(
            "/auth/v1/user"
        );

    } catch (error) {

        return null;

    }

};


window.getSupabaseSession =
    function () {

        return getSession();

    };


window.getSupabaseAccessToken =
    function () {

        return getAccessToken();

    };


/* =========================================================
   LOGIN
========================================================= */

async function handleLogin(event) {

    event.preventDefault();


    const email =
        document
            .getElementById("loginEmail")
            ?.value
            .trim()
            .toLowerCase();


    const password =
        document
            .getElementById("loginPassword")
            ?.value;


    if (!email || !password) {

        notify(
            "Please enter your email and password."
        );

        return;

    }


    const submitButton =
        event.target.querySelector(
            'button[type="submit"]'
        );


    if (submitButton) {

        submitButton.disabled =
            true;

        submitButton.textContent =
            "Logging in...";

    }


    try {

        const session =
            await supabaseRequest(
                "/auth/v1/token?grant_type=password",
                {
                    method: "POST",

                    body: JSON.stringify({
                        email: email,
                        password: password
                    })
                }
            );


        saveSession(session);


        event.target.reset();


        window.closeModal(
            "loginModal"
        );


        await window.updateAuthUI();


        const returnToBarter =
            sessionStorage.getItem(
                "losoja_return_to_barter"
            );


        if (returnToBarter === "true") {

            sessionStorage.removeItem(
                "losoja_return_to_barter"
            );

            window.location.href =
                "barter.html";

            return;

        }


        const userName =
            session?.user?.user_metadata
                ?.full_name ||
            session?.user?.email ||
            "there";


        notify(
            "Welcome back, " +
            userName +
            "!"
        );


    } catch (error) {

        console.error(
            "LosOja login error:",
            error
        );


        notify(
            error.message ||
            "Login failed."
        );


    } finally {

        if (submitButton) {

            submitButton.disabled =
                false;

            submitButton.textContent =
                "Login";

        }

    }

}


/* =========================================================
   SIGN UP
========================================================= */

async function handleSignup(event) {

    event.preventDefault();


    const name =
        document
            .getElementById("signupName")
            ?.value
            .trim();


    const email =
        document
            .getElementById("signupEmail")
            ?.value
            .trim()
            .toLowerCase();


    const password =
        document
            .getElementById("signupPassword")
            ?.value;


    if (!name || !email || !password) {

        notify(
            "Please fill in all fields."
        );

        return;

    }


    const submitButton =
        event.target.querySelector(
            'button[type="submit"]'
        );


    if (submitButton) {

        submitButton.disabled =
            true;

        submitButton.textContent =
            "Creating account...";

    }


    try {

        const result =
            await supabaseRequest(
                "/auth/v1/signup",
                {
                    method: "POST",

                    body: JSON.stringify({

                        email: email,

                        password: password,

                        data: {
                            full_name: name
                        }

                    })
                }
            );


        if (result?.access_token) {

            saveSession(result);

            window.closeModal(
                "signupModal"
            );

            await window.updateAuthUI();

            notify(
                "Account created successfully!"
            );

        } else {

            event.target.reset();

            window.closeModal(
                "signupModal"
            );

            notify(
                "Account created. Check your email if confirmation is required, then log in."
            );

            window.openLogin();

        }


    } catch (error) {

        console.error(
            "LosOja signup error:",
            error
        );


        notify(
            error.message ||
            "Account creation failed."
        );


    } finally {

        if (submitButton) {

            submitButton.disabled =
                false;

            submitButton.textContent =
                "Create Account";

        }

    }

}


/* =========================================================
   LOGOUT
========================================================= */

window.logoutUser = async function () {

    const token =
        getAccessToken();


    try {

        if (token) {

            await supabaseRequest(
                "/auth/v1/logout",
                {
                    method: "POST"
                }
            );

        }

    } catch (error) {

        console.warn(
            "LosOja logout request:",
            error
        );

    }


    saveSession(null);


    await window.updateAuthUI();


    notify(
        "You have been logged out."
    );

};


/* =========================================================
   AUTH UI
========================================================= */

window.updateAuthUI = async function () {

    const session =
        getSession();


    const accountButtons =
        document.querySelectorAll(
            'button[aria-label="Account"]'
        );


    const bottomAccountButton =
        document.querySelector(
            ".bottom-nav .nav-item:last-child"
        );


    if (session?.access_token) {

        accountButtons.forEach(
            function (button) {

                button.onclick =
                    window.logoutUser;

                button.title =
                    "Logout";

            }
        );


        if (bottomAccountButton) {

            bottomAccountButton.onclick =
                window.logoutUser;

            const label =
                bottomAccountButton
                    .querySelector("span:last-child");

            if (label) {

                label.textContent =
                    "Logout";

            }

        }


    } else {

        accountButtons.forEach(
            function (button) {

                button.onclick =
                    window.openLogin;

                button.title =
                    "Login";

            }
        );


        if (bottomAccountButton) {

            bottomAccountButton.onclick =
                window.openLogin;

            const label =
                bottomAccountButton
                    .querySelector("span:last-child");

            if (label) {

                label.textContent =
                    "Account";

            }

        }

    }

};


/* =========================================================
   SESSION REFRESH
========================================================= */

window.refreshSupabaseSession =
    async function () {

        const session =
            getSession();


        if (!session?.refresh_token) {

            return session;

        }


        try {

            const refreshed =
                await supabaseRequest(
                    "/auth/v1/token?grant_type=refresh_token",
                    {
                        method: "POST",

                        body: JSON.stringify({
                            refresh_token:
                                session.refresh_token
                        })
                    }
                );


            saveSession(refreshed);

            return refreshed;


        } catch (error) {

            saveSession(null);

            return null;

        }

    };


window.ensureValidSupabaseSession =
    async function () {

        const session =
            getSession();


        if (!session) {

            return null;

        }


        if (
            session.expires_at &&
            Date.now() / 1000 <
            session.expires_at - 60
        ) {

            return session;

        }


        return await window.refreshSupabaseSession();

    };


/* =========================================================
   INITIALIZE
========================================================= */

function initializeAuth() {

    createAuthModals();


    const loginForm =
        document.getElementById(
            "loginForm"
        );


    const signupForm =
        document.getElementById(
            "signupForm"
        );


    if (loginForm) {

        loginForm.addEventListener(
            "submit",
            handleLogin
        );

    }


    if (signupForm) {

        signupForm.addEventListener(
            "submit",
            handleSignup
        );

    }


    const closeLogin =
        document.getElementById(
            "closeLoginModal"
        );


    const closeSignup =
        document.getElementById(
            "closeSignupModal"
        );


    if (closeLogin) {

        closeLogin.addEventListener(
            "click",
            function () {

                window.closeModal(
                    "loginModal"
                );

            }
        );

    }


    if (closeSignup) {

        closeSignup.addEventListener(
            "click",
            function () {

                window.closeModal(
                    "signupModal"
                );

            }
        );

    }


    const switchToSignup =
        document.getElementById(
            "switchToSignup"
        );


    const switchToLogin =
        document.getElementById(
            "switchToLogin"
        );


    if (switchToSignup) {

        switchToSignup.addEventListener(
            "click",
            window.openSignup
        );

    }


    if (switchToLogin) {

        switchToLogin.addEventListener(
            "click",
            window.openLogin
        );

    }


    document.addEventListener(
        "click",
        function (event) {

            if (
                event.target.classList.contains(
                    "modal-overlay"
                )
            ) {

                event.target.style.display =
                    "none";

            }

        }
    );


    window.updateAuthUI();

}


if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeAuth
    );

} else {

    initializeAuth();

}


console.log(
    "LosOja auth.js loaded"
);
```

})();
