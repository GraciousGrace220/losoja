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

        const saved =
            localStorage.getItem(SESSION_KEY);

        if (!saved) {
            return null;
        }

        return JSON.parse(saved);

    } catch (error) {

        console.warn(
            "LosOja: invalid saved session."
        );

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

    const session =
        getSession();

    return session &&
        session.access_token
        ? session.access_token
        : null;

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
            "application/json"

    };


    if (options.headers) {

        Object.assign(
            headers,
            options.headers
        );

    }


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

    /*
     * If the HTML already contains the login/signup
     * modals, DO NOT create another copy.
     */

    let loginModal =
        document.getElementById("loginModal");

    let signupModal =
        document.getElementById("signupModal");


    /* -----------------------------------------------------
       LOGIN MODAL
    ----------------------------------------------------- */

    if (!loginModal) {

        const wrapper =
            document.createElement("div");

        wrapper.innerHTML = `

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


                        <p
                            style="
                                margin-top:15px;
                                text-align:center;
                            "
                        >

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
            wrapper.firstElementChild
        );

    }


    /* -----------------------------------------------------
       SIGNUP MODAL
    ----------------------------------------------------- */

    signupModal =
        document.getElementById(
            "signupModal"
        );


    if (!signupModal) {

        const wrapper =
            document.createElement("div");

        wrapper.innerHTML = `

            <div
                id="signupModal"
                class="modal-overlay"
                style="display:none;"
            >

                <div class="modal">

                    <div class="modal-header">

                        <h2>
                            Create LosOja Account
                        </h2>

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


                        <p
                            style="
                                margin-top:15px;
                                text-align:center;
                            "
                        >

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
            wrapper.firstElementChild
        );

    }

}


/* =========================================================
   OPEN LOGIN
========================================================= */

window.openLogin = function () {

    createAuthModals();


    const loginModal =
        document.getElementById(
            "loginModal"
        );

    const signupModal =
        document.getElementById(
            "signupModal"
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


/* =========================================================
   OPEN SIGNUP
========================================================= */

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


/* =========================================================
   CLOSE MODAL
========================================================= */

window.closeModal = function (
    modalId
) {

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

window.getCurrentUser =
    async function () {

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

            console.warn(
                "LosOja: unable to get current user.",
                error
            );

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


    const form =
        event.currentTarget;


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
        form.querySelector(
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

                        email:
                            email,

                        password:
                            password

                    })

                }
            );


        if (!session?.access_token) {

            throw new Error(
                "Login did not return a valid session."
            );

        }


        saveSession(session);


        form.reset();


        window.closeModal(
            "loginModal"
        );


        await window.updateAuthUI();


        /*
         * If the user originally came from
         * Trade by Barter, send them back there.
         */

        const returnToBarter =
            sessionStorage.getItem(
                "losoja_return_to_barter"
            );


        if (
            returnToBarter ===
            "true"
        ) {

            sessionStorage.removeItem(
                "losoja_return_to_barter"
            );


            window.location.href =
                "barter.html";


            return;

        }


        const userName =
            session?.user
                ?.user_metadata
                ?.full_name ||
            session?.user
                ?.email ||
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


    const form =
        event.currentTarget;


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


    if (password.length < 6) {

        notify(
            "Password must be at least 6 characters."
        );

        return;

    }


    const submitButton =
        form.querySelector(
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

                        email:
                            email,

                        password:
                            password,

                        data: {

                            full_name:
                                name

                        }

                    })

                }
            );


        /*
         * Supabase can return an access token
         * immediately, or require email confirmation.
         */

        if (
            result &&
            result.access_token
        ) {

            saveSession(
                result
            );


            form.reset();


            window.closeModal(
                "signupModal"
            );


            await window.updateAuthUI();


            notify(
                "Account created successfully!"
            );


        } else {

            form.reset();


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

window.logoutUser =
    async function () {

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
   UPDATE AUTH UI
========================================================= */

window.updateAuthUI =
    async function () {

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


        if (
            session &&
            session.access_token
        ) {

            accountButtons.forEach(
                function (button) {

                    button.onclick =
                        window.logoutUser;

                    button.title =
                        "Logout";

                }
            );


            if (
                bottomAccountButton
            ) {

                bottomAccountButton.onclick =
                    window.logoutUser;


                const label =
                    bottomAccountButton
                        .querySelector(
                            "span:last-child"
                        );


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


            if (
                bottomAccountButton
            ) {

                bottomAccountButton.onclick =
                    window.openLogin;


                const label =
                    bottomAccountButton
                        .querySelector(
                            "span:last-child"
                        );


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


        if (
            !session ||
            !session.refresh_token
        ) {

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


            saveSession(
                refreshed
            );


            return refreshed;


        } catch (error) {

            console.warn(
                "LosOja: session refresh failed.",
                error
            );


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
   INITIALIZE EVENT LISTENERS
========================================================= */

function initializeAuth() {

    createAuthModals();


    /*
     * LOGIN FORM
     *
     * Remove our previous listener first so this
     * function can never submit twice.
     */

    const loginForm =
        document.getElementById(
            "loginForm"
        );


    if (
        loginForm &&
        !loginForm.dataset.losojaAuthReady
    ) {

        loginForm.addEventListener(
            "submit",
            handleLogin
        );


        loginForm.dataset.losojaAuthReady =
            "true";

    }


    /*
     * SIGNUP FORM
     */

    const signupForm =
        document.getElementById(
            "signupForm"
        );


    if (
        signupForm &&
        !signupForm.dataset.losojaAuthReady
    ) {

        signupForm.addEventListener(
            "submit",
            handleSignup
        );


        signupForm.dataset.losojaAuthReady =
            "true";

    }


    /*
     * CLOSE LOGIN
     */

    const closeLogin =
        document.getElementById(
            "closeLoginModal"
        );


    if (
        closeLogin &&
        !closeLogin.dataset.losojaAuthReady
    ) {

        closeLogin.addEventListener(
            "click",
            function () {

                window.closeModal(
                    "loginModal"
                );

            }
        );


        closeLogin.dataset.losojaAuthReady =
            "true";

    }


    /*
     * CLOSE SIGNUP
     */

    const closeSignup =
        document.getElementById(
            "closeSignupModal"
        );


    if (
        closeSignup &&
        !closeSignup.dataset.losojaAuthReady
    ) {

        closeSignup.addEventListener(
            "click",
            function () {

                window.closeModal(
                    "signupModal"
                );

            }
        );


        closeSignup.dataset.losojaAuthReady =
            "true";

    }


    /*
     * LOGIN -> SIGNUP
     */

    const switchToSignup =
        document.getElementById(
            "switchToSignup"
        );


    if (
        switchToSignup &&
        !switchToSignup.dataset.losojaAuthReady
    ) {

        switchToSignup.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                window.openSignup();

            }
        );


        switchToSignup.dataset.losojaAuthReady =
            "true";

    }


    /*
     * SIGNUP -> LOGIN
     */

    const switchToLogin =
        document.getElementById(
            "switchToLogin"
        );


    if (
        switchToLogin &&
        !switchToLogin.dataset.losojaAuthReady
    ) {

        switchToLogin.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                window.openLogin();

            }
        );


        switchToLogin.dataset.losojaAuthReady =
            "true";

    }


    /*
     * CLOSE MODAL WHEN CLICKING OUTSIDE
     *
     * One global listener only.
     */

    if (
        !document.body.dataset.losojaModalReady
    ) {

        document.addEventListener(
            "click",
            function (event) {

                if (
                    event.target &&
                    event.target.classList &&
                    event.target.classList.contains(
                        "modal-overlay"
                    )
                ) {

                    event.target.style.display =
                        "none";

                }

            }
        );


        document.body.dataset.losojaModalReady =
            "true";

    }


    window.updateAuthUI();

}


/* =========================================================
   START
========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeAuth,
        {
            once: true
        }
    );

} else {

    initializeAuth();

}


console.log(
    "LosOja auth.js loaded"
);
```

})();
