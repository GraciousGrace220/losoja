/*
=========================================================
LosOja - Supabase Authentication
js/auth.js

Handles:
- Sign up
- Login
- Logout
- Supabase session
- Automatic JWT refresh
- User interface
=========================================================
*/

(function () {

    "use strict";


    /* =====================================================
       SUPABASE CONFIGURATION
    ===================================================== */

    const SUPABASE_URL =
        "https://ycxshwgeebskdozmornh.supabase.co";

    const SUPABASE_KEY =
        "sb_publishable_jFSLacwNupO6T8EnSqb2bw_bZmy7rVe";

    const SESSION_KEY =
        "losoja_supabase_session";


    /* =====================================================
       STORAGE
    ===================================================== */

    function getSession() {

        try {

            const raw =
                localStorage.getItem(SESSION_KEY);

            if (!raw) {
                return null;
            }

            return JSON.parse(raw);

        } catch (error) {

            console.error(
                "LosOja: Could not read session:",
                error
            );

            localStorage.removeItem(SESSION_KEY);

            return null;
        }
    }


    function saveSession(session) {

        if (!session) {
            return;
        }

        try {

            localStorage.setItem(
                SESSION_KEY,
                JSON.stringify(session)
            );

        } catch (error) {

            console.error(
                "LosOja: Could not save session:",
                error
            );
        }
    }


    function clearSession() {

        localStorage.removeItem(
            SESSION_KEY
        );
    }


    /* =====================================================
       USER
    ===================================================== */

    function getCurrentUser() {

        const session =
            getSession();

        if (!session) {
            return null;
        }

        return session.user || null;
    }


    function getAccessToken() {

        const session =
            getSession();

        if (!session) {
            return null;
        }

        return (
            session.access_token ||
            session.accessToken ||
            null
        );
    }


    function getUserName(user) {

        if (!user) {
            return "User";
        }

        const metadata =
            user.user_metadata || {};

        return (
            metadata.full_name ||
            metadata.name ||
            user.email?.split("@")[0] ||
            "User"
        );
    }


    /* =====================================================
       HEADERS
    ===================================================== */

    function headers(accessToken) {

        const result = {

            "apikey":
                SUPABASE_KEY,

            "Content-Type":
                "application/json",

            "Accept":
                "application/json"
        };


        if (accessToken) {

            result["Authorization"] =
                "Bearer " + accessToken;
        }


        return result;
    }


    /* =====================================================
       ERROR MESSAGE
    ===================================================== */

    function getErrorMessage(data) {

        if (!data) {
            return "Something went wrong.";
        }

        return (
            data.msg ||
            data.message ||
            data.error_description ||
            data.error ||
            "Something went wrong."
        );
    }


    /* =====================================================
       CHECK TOKEN EXPIRATION
    ===================================================== */

    function isTokenExpired(session) {

        if (!session) {
            return true;
        }


        if (session.expires_at) {

            const now =
                Math.floor(
                    Date.now() / 1000
                );


            return (
                Number(session.expires_at) <=
                now + 60
            );
        }


        return false;
    }


    /* =====================================================
       REFRESH SUPABASE SESSION
    ===================================================== */

    let refreshPromise = null;


    async function refreshSupabaseSession() {

        /*
        -----------------------------------------------------
        Prevent multiple simultaneous refresh requests.
        -----------------------------------------------------
        */

        if (refreshPromise) {

            return refreshPromise;
        }


        refreshPromise = (async function () {

            const session =
                getSession();


            if (!session) {

                return {
                    success: false,
                    message:
                        "No active session."
                };
            }


            const refreshToken =
                session.refresh_token;


            if (!refreshToken) {

                console.warn(
                    "LosOja: No refresh token available."
                );


                clearSession();

                updateUI();


                return {
                    success: false,
                    message:
                        "Your session has expired. Please log in again."
                };
            }


            try {

                console.log(
                    "LosOja: Refreshing Supabase session..."
                );


                const response =
                    await fetch(

                        SUPABASE_URL +
                        "/auth/v1/token?grant_type=refresh_token",

                        {
                            method: "POST",

                            headers:
                                headers(),

                            body:
                                JSON.stringify({
                                    refresh_token:
                                        refreshToken
                                })
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    console.error(
                        "LosOja session refresh error:",
                        data
                    );


                    clearSession();

                    updateUI();


                    return {
                        success: false,
                        message:
                            getErrorMessage(data)
                    };
                }


                if (
                    !data.access_token ||
                    !data.user
                ) {

                    console.error(
                        "LosOja: Refresh response did not contain a valid session.",
                        data
                    );


                    return {
                        success: false,
                        message:
                            "Could not refresh your session."
                    };
                }


                /*
                -------------------------------------------------
                Save the complete NEW session.
                -------------------------------------------------
                */

                saveSession(data);

                updateUI();


                console.log(
                    "LosOja: Supabase session refreshed successfully."
                );


                return {
                    success: true,
                    user: data.user,
                    session: data
                };


            } catch (error) {

                console.error(
                    "LosOja session refresh network error:",
                    error
                );


                return {
                    success: false,
                    message:
                        "Could not refresh your session."
                };
            }

        })();


        try {

            return await refreshPromise;

        } finally {

            refreshPromise = null;
        }
    }


    /* =====================================================
       ENSURE VALID SESSION
    ===================================================== */

    async function ensureValidSession() {

        const session =
            getSession();


        if (!session) {
            return null;
        }


        /*
        -----------------------------------------------------
        If the token is still valid, use it.
        -----------------------------------------------------
        */

        if (!isTokenExpired(session)) {

            return session;
        }


        /*
        -----------------------------------------------------
        Token expired or is about to expire.
        Refresh it.
        -----------------------------------------------------
        */

        const result =
            await refreshSupabaseSession();


        if (!result.success) {

            return null;
        }


        return result.session;
    }


    /* =====================================================
       LOGIN
    ===================================================== */

    async function login(
        email,
        password
    ) {

        email =
            String(email || "")
                .trim()
                .toLowerCase();

        password =
            String(password || "");


        if (!email || !password) {

            return {
                success: false,
                message:
                    "Please enter your email and password."
            };
        }


        try {

            const response =
                await fetch(
                    SUPABASE_URL +
                    "/auth/v1/token?grant_type=password",
                    {
                        method: "POST",

                        headers:
                            headers(),

                        body:
                            JSON.stringify({
                                email: email,
                                password: password
                            })
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                console.error(
                    "LosOja login error:",
                    data
                );


                return {
                    success: false,
                    message:
                        getErrorMessage(data)
                };
            }


            if (
                !data.access_token ||
                !data.user
            ) {

                return {
                    success: false,
                    message:
                        "Login succeeded but no Supabase session was returned."
                };
            }


            saveSession(data);

            updateUI();


            return {
                success: true,
                user: data.user,
                session: data
            };


        } catch (error) {

            console.error(
                "LosOja login network error:",
                error
            );


            return {
                success: false,
                message:
                    "Could not connect to Supabase. Please check your internet connection."
            };
        }
    }


    /* =====================================================
       SIGN UP
    ===================================================== */

    async function signup(
        name,
        email,
        password
    ) {

        name =
            String(name || "").trim();

        email =
            String(email || "")
                .trim()
                .toLowerCase();

        password =
            String(password || "");


        if (!name) {

            return {
                success: false,
                message:
                    "Please enter your full name."
            };
        }


        if (!email) {

            return {
                success: false,
                message:
                    "Please enter your email."
            };
        }


        if (password.length < 6) {

            return {
                success: false,
                message:
                    "Password must be at least 6 characters."
            };
        }


        try {

            const response =
                await fetch(
                    SUPABASE_URL +
                    "/auth/v1/signup",
                    {
                        method: "POST",

                        headers:
                            headers(),

                        body:
                            JSON.stringify({

                                email: email,

                                password: password,

                                data: {
                                    full_name: name,
                                    name: name
                                }

                            })
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                console.error(
                    "LosOja signup error:",
                    data
                );


                return {
                    success: false,
                    message:
                        getErrorMessage(data)
                };
            }


            /*
            -------------------------------------------------
            Supabase may require email confirmation.
            -------------------------------------------------
            */

            if (
                data.access_token &&
                data.user
            ) {

                saveSession(data);

                updateUI();


                return {
                    success: true,
                    user: data.user,
                    session: data
                };
            }


            /*
            -------------------------------------------------
            Account created but email confirmation required.
            -------------------------------------------------
            */

            return {

                success: true,

                needsConfirmation: true,

                user:
                    data.user || null,

                message:
                    "Your account was created. Please confirm your email, then log in."
            };


        } catch (error) {

            console.error(
                "LosOja signup network error:",
                error
            );


            return {
                success: false,
                message:
                    "Could not connect to Supabase. Please check your internet connection."
            };
        }
    }


    /* =====================================================
       LOGOUT
    ===================================================== */

    async function logout() {

        const token =
            getAccessToken();


        try {

            if (token) {

                await fetch(
                    SUPABASE_URL +
                    "/auth/v1/logout",
                    {
                        method: "POST",

                        headers:
                            headers(token)
                    }
                );
            }

        } catch (error) {

            console.warn(
                "LosOja logout request failed:",
                error
            );

        } finally {

            clearSession();

            updateUI();


            if (
                typeof Dashboard !== "undefined" &&
                typeof Dashboard.hide === "function"
            ) {

                Dashboard.hide();
            }


            if (
                window.App &&
                typeof App.showToast === "function"
            ) {

                App.showToast(
                    "You have been logged out."
                );
            }
        }
    }


    /* =====================================================
       UI
    ===================================================== */

    function updateUI() {

        const user =
            getCurrentUser();


        const loginBtn =
            document.getElementById(
                "loginBtn"
            );

        const signupBtn =
            document.getElementById(
                "signupBtn"
            );

        const userArea =
            document.getElementById(
                "userArea"
            );

        const dashboardNavLink =
            document.getElementById(
                "dashboardNavLink"
            );

        const mobileAuthLinks =
            document.getElementById(
                "mobileAuthLinks"
            );

        const mobileLoginBtn =
            document.getElementById(
                "mobileLoginBtn"
            );

        const mobileSignupBtn =
            document.getElementById(
                "mobileSignupBtn"
            );


        if (user) {

            if (loginBtn) {
                loginBtn.classList.add(
                    "hidden"
                );
            }


            if (signupBtn) {
                signupBtn.classList.add(
                    "hidden"
                );
            }


            if (mobileLoginBtn) {
                mobileLoginBtn.classList.add(
                    "hidden"
                );
            }


            if (mobileSignupBtn) {
                mobileSignupBtn.classList.add(
                    "hidden"
                );
            }


            if (mobileAuthLinks) {
                mobileAuthLinks.classList.add(
                    "hidden"
                );
            }


            if (dashboardNavLink) {
                dashboardNavLink.classList.remove(
                    "hidden"
                );
            }


            if (userArea) {

                userArea.classList.remove(
                    "hidden"
                );


                const name =
                    escapeHTML(
                        getUserName(user)
                    );


                userArea.innerHTML = `

                    <span class="user-name">
                        Hi, ${name}
                    </span>

                    <button
                        type="button"
                        class="btn btn-outline"
                        id="logoutBtn"
                    >
                        Logout
                    </button>

                `;


                const logoutBtn =
                    document.getElementById(
                        "logoutBtn"
                    );


                if (logoutBtn) {

                    logoutBtn.addEventListener(
                        "click",
                        logout
                    );
                }
            }


        } else {

            if (loginBtn) {
                loginBtn.classList.remove(
                    "hidden"
                );
            }


            if (signupBtn) {
                signupBtn.classList.remove(
                    "hidden"
                );
            }


            if (mobileLoginBtn) {
                mobileLoginBtn.classList.remove(
                    "hidden"
                );
            }


            if (mobileSignupBtn) {
                mobileSignupBtn.classList.remove(
                    "hidden"
                );
            }


            if (mobileAuthLinks) {
                mobileAuthLinks.classList.remove(
                    "hidden"
                );
            }


            if (dashboardNavLink) {
                dashboardNavLink.classList.add(
                    "hidden"
                );
            }


            if (userArea) {

                userArea.classList.add(
                    "hidden"
                );

                userArea.innerHTML = "";
            }
        }
    }


    /* =====================================================
       ESCAPE HTML
    ===================================================== */

    function escapeHTML(value) {

        const div =
            document.createElement(
                "div"
            );

        div.textContent =
            String(value || "");

        return div.innerHTML;
    }


    /* =====================================================
       MODALS
    ===================================================== */

  function openLogin() {
    const modal = document.getElementById("loginModal");

    if (!modal) {
        console.error("LosOja: loginModal not found.");
        return;
    }

    // Make sure the modal is actually visible
    modal.classList.remove("hidden");
    modal.classList.add("active");
    modal.style.display = "flex";

    document.body.classList.add("modal-open");

    const emailInput = document.getElementById("loginEmail");

    if (emailInput) {
        setTimeout(() => emailInput.focus(), 50);
    }
}


    function openSignup() {
    const modal = document.getElementById("signupModal");

    if (!modal) {
        console.error("LosOja: signupModal not found.");
        return;
    }

    // Close login first
    const loginModal = document.getElementById("loginModal");

    if (loginModal) {
        loginModal.classList.remove("active");
        loginModal.classList.add("hidden");
        loginModal.style.display = "none";
    }

    // Show signup
    modal.classList.remove("hidden");
    modal.classList.add("active");
    modal.style.display = "flex";

    document.body.classList.add("modal-open");

    const nameInput = document.getElementById("signupName");

    if (nameInput) {
        setTimeout(() => nameInput.focus(), 50);
    }
}


    /* =====================================================
       FORM HELPERS
    ===================================================== */

    function showError(
        id,
        message
    ) {

        const element =
            document.getElementById(id);


        if (!element) {
            return;
        }


        element.textContent =
            message || "";


        element.classList.remove(
            "hidden"
        );
    }


    function clearError(id) {

        const element =
            document.getElementById(id);


        if (!element) {
            return;
        }


        element.textContent = "";

        element.classList.add(
            "hidden"
        );
    }


    /* =====================================================
       EVENT BINDING
    ===================================================== */

    function bindEvents() {

        /*
        -----------------------------------------------------
        Login buttons
        -----------------------------------------------------
        */

        [
            "loginBtn",
            "mobileLoginBtn"
        ].forEach(function (id) {

            const button =
                document.getElementById(id);


            if (!button) {
                return;
            }


            button.addEventListener(
                "click",
                function () {

                    openLogin();
                }
            );
        });


        /*
        -----------------------------------------------------
        Signup buttons
        -----------------------------------------------------
        */

        [
            "signupBtn",
            "mobileSignupBtn"
        ].forEach(function (id) {

            const button =
                document.getElementById(id);


            if (!button) {
                return;
            }


            button.addEventListener(
                "click",
                function () {

                    openSignup();
                }
            );
        });


        /*
        -----------------------------------------------------
        Switch Login -> Signup
        -----------------------------------------------------
        */

      const switchToSignup =
    document.getElementById(
        "showSignupBtn"
    );
    


        if (switchToSignup) {

            switchToSignup.addEventListener(
                "click",
                function () {

                    if (window.App) {

                        App.closeAllModals();
                    }


                    openSignup();
                }
            );
        }


        /*
        -----------------------------------------------------
        Switch Signup -> Login
        -----------------------------------------------------
        */

       const switchToLogin =
    document.getElementById(
        "showLoginBtn"
    );

        if (switchToLogin) {

            switchToLogin.addEventListener(
                "click",
                function () {

                    if (window.App) {

                        App.closeAllModals();
                    }


                    openLogin();
                }
            );
        }


        /*
        -----------------------------------------------------
        LOGIN FORM
        -----------------------------------------------------
        */

        const loginForm =
            document.getElementById(
                "loginForm"
            );


        if (loginForm) {

            loginForm.addEventListener(
                "submit",
                async function (event) {

                    event.preventDefault();


                    clearError(
                        "loginError"
                    );


                    const email =
                        document.getElementById(
                            "loginEmail"
                        )?.value;


                    const password =
                        document.getElementById(
                            "loginPassword"
                        )?.value;


                    const submitButton =
                        loginForm.querySelector(
                            'button[type="submit"]'
                        );


                    if (submitButton) {

                        submitButton.disabled =
                            true;

                        submitButton.textContent =
                            "Logging in...";
                    }


                    const result =
                        await login(
                            email,
                            password
                        );


                    if (submitButton) {

                        submitButton.disabled =
                            false;

                        submitButton.textContent =
                            "Login";
                    }


                    if (!result.success) {

                        showError(
                            "loginError",
                            result.message
                        );

                        return;
                    }


                    if (window.App) {

                        App.closeModal(
                            "loginModal"
                        );


                        App.showToast(
                            "Welcome back!"
                        );
                    }
                }
            );
        }


        /*
        -----------------------------------------------------
        SIGNUP FORM
        -----------------------------------------------------
        */

        const signupForm =
            document.getElementById(
                "signupForm"
            );


        if (signupForm) {

            signupForm.addEventListener(
                "submit",
                async function (event) {

                    event.preventDefault();


                    clearError(
                        "signupError"
                    );


                    const name =
                        document.getElementById(
                            "signupName"
                        )?.value;


                    const email =
                        document.getElementById(
                            "signupEmail"
                        )?.value;


                    const password =
                        document.getElementById(
                            "signupPassword"
                        )?.value;


                    const submitButton =
                        signupForm.querySelector(
                            'button[type="submit"]'
                        );


                    if (submitButton) {

                        submitButton.disabled =
                            true;

                        submitButton.textContent =
                            "Creating account...";
                    }


                    const result =
                        await signup(
                            name,
                            email,
                            password
                        );


                    if (submitButton) {

                        submitButton.disabled =
                            false;

                        submitButton.textContent =
                            "Create Account";
                    }


                    if (!result.success) {

                        showError(
                            "signupError",
                            result.message
                        );

                        return;
                    }


                    if (
                        result.needsConfirmation
                    ) {

                        showError(
                            "signupError",
                            result.message
                        );

                        return;
                    }


                    if (window.App) {

                        App.closeModal(
                            "signupModal"
                        );


                        App.showToast(
                            "Account created successfully!"
                        );
                    }
                }
            );
        }
    }


    /* =====================================================
       PUBLIC API
    ===================================================== */

    window.getSupabaseSession =
        getSession;


    window.getCurrentUser =
        getCurrentUser;


    window.getSupabaseAccessToken =
        getAccessToken;


    window.refreshSupabaseSession =
        refreshSupabaseSession;


    window.ensureValidSupabaseSession =
        ensureValidSession;


    window.logout =
        logout;


    window.doLogin =
        login;


    window.doSignup =
        signup;


    window.updateAuthUI =
        updateUI;


    /* =====================================================
       START
    ===================================================== */

    document.addEventListener(
        "DOMContentLoaded",
        async function () {

            bindEvents();

            updateUI();


            /*
            -------------------------------------------------
            Automatically refresh an expired session when
            the website opens.
            -------------------------------------------------
            */

            const session =
                getSession();


            if (session) {

                if (
                    isTokenExpired(session)
                ) {

                    await refreshSupabaseSession();
                }
            }
        }
    );

})();
