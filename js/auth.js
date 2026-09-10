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
- Authentication UI
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
       SESSION STORAGE
    ===================================================== */

    function getSession() {

        try {

            const raw =
                localStorage.getItem(
                    SESSION_KEY
                );

            if (!raw) {
                return null;
            }

            return JSON.parse(raw);

        } catch (error) {

            console.error(
                "LosOja: Could not read session:",
                error
            );

            localStorage.removeItem(
                SESSION_KEY
            );

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
       USER HELPERS
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

    function getHeaders(accessToken) {

        const result = {

            "apikey":
                SUPABASE_KEY,

            "Content-Type":
                "application/json",

            "Accept":
                "application/json"

        };


        if (accessToken) {

            result.Authorization =
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
                            getHeaders(),
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
                        "Login succeeded but no session was returned."
                };

            }


            saveSession(data);

            updateAuthUI();


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
                            getHeaders(),
                        body:
                            JSON.stringify({

                                email:
                                    email,

                                password:
                                    password,

                                data: {
                                    full_name:
                                        name,

                                    name:
                                        name
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
             * If email confirmation is disabled,
             * Supabase may return a session.
             */

            if (
                data.access_token &&
                data.user
            ) {

                saveSession(data);

                updateAuthUI();

                return {
                    success: true,
                    user: data.user,
                    session: data
                };

            }


            /*
             * If email confirmation is enabled,
             * the user must confirm their email.
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
                            getHeaders(token)
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

            updateAuthUI();

            if (
                window.App &&
                typeof window.App.closeAllModals ===
                "function"
            ) {

                window.App.closeAllModals();

            }

            if (
                window.App &&
                typeof window.App.showToast ===
                "function"
            ) {

                window.App.showToast(
                    "You have been logged out.",
                    "info"
                );

            }

        }

    }


    /* =====================================================
       AUTH UI
    ===================================================== */

    function updateAuthUI() {

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

        const mobileLoginBtn =
            document.getElementById(
                "mobileLoginBtn"
            );

        const mobileSignupBtn =
            document.getElementById(
                "mobileSignupBtn"
            );

        const userArea =
            document.getElementById(
                "userArea"
            );

        const dashboardNavLink =
            document.getElementById(
                "dashboardNavLink"
            );

        const mobileDashboardNavLink =
            document.getElementById(
                "mobileDashboardNavLink"
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

            if (dashboardNavLink) {
                dashboardNavLink.classList.remove(
                    "hidden"
                );
            }

            if (mobileDashboardNavLink) {
                mobileDashboardNavLink.classList.remove(
                    "hidden"
                );
            }


            if (userArea) {

                userArea.classList.remove(
                    "hidden"
                );

                userArea.innerHTML = `

                    <span class="user-name">
                        Hi, ${escapeHTML(
                            getUserName(user)
                        )}
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

            if (dashboardNavLink) {
                dashboardNavLink.classList.add(
                    "hidden"
                );
            }

            if (mobileDashboardNavLink) {
                mobileDashboardNavLink.classList.add(
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
       OPEN LOGIN
    ===================================================== */

    function openLogin() {

        if (
            window.App &&
            typeof window.App.openModal ===
            "function"
        ) {

            window.App.openModal(
                "loginModal"
            );

        }

    }


    /* =====================================================
       OPEN SIGN UP
    ===================================================== */

    function openSignup() {

        if (
            window.App &&
            typeof window.App.openModal ===
            "function"
        ) {

            window.App.openModal(
                "signupModal"
            );

        }

    }


    /* =====================================================
       FORM ERRORS
    ===================================================== */

    function showError(
        elementId,
        message
    ) {

        const element =
            document.getElementById(
                elementId
            );

        if (!element) {
            return;
        }

        element.textContent =
            String(message || "");

        element.classList.remove(
            "hidden"
        );

    }


    function clearError(
        elementId
    ) {

        const element =
            document.getElementById(
                elementId
            );

        if (!element) {
            return;
        }

        element.textContent =
            "";

        element.classList.add(
            "hidden"
        );

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
       BIND EVENTS
    ===================================================== */

    function bindEvents() {

        const loginButtons =
            document.querySelectorAll(
                "#loginBtn, #mobileLoginBtn"
            );

        loginButtons.forEach(button => {

            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    openLogin();

                }
            );

        });


        const signupButtons =
            document.querySelectorAll(
                "#signupBtn, #mobileSignupBtn"
            );

        signupButtons.forEach(button => {

            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    openSignup();

                }
            );

        });


        const showSignupBtn =
            document.getElementById(
                "showSignupBtn"
            );

        if (showSignupBtn) {

            showSignupBtn.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    if (window.App) {
                        window.App.closeModal(
                            "loginModal"
                        );
                    }

                    openSignup();

                }
            );

        }


        const showLoginBtn =
            document.getElementById(
                "showLoginBtn"
            );

        if (showLoginBtn) {

            showLoginBtn.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    if (window.App) {
                        window.App.closeModal(
                            "signupModal"
                        );
                    }

                    openLogin();

                }
            );

        }


        /* =================================================
           LOGIN FORM
        ================================================= */

        const loginForm =
            document.getElementById(
                "loginForm"
            );

        if (loginForm) {

            loginForm.addEventListener(
                "submit",
                async event => {

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
                    }


                    const result =
                        await login(
                            email,
                            password
                        );


                    if (submitButton) {
                        submitButton.disabled =
                            false;
                    }


                    if (!result.success) {

                        showError(
                            "loginError",
                            result.message
                        );

                        return;
                    }


                    loginForm.reset();

                    if (window.App) {
                        window.App.closeModal(
                            "loginModal"
                        );
                    }


                    if (
                        window.App &&
                        typeof window.App.showToast ===
                        "function"
                    ) {

                        window.App.showToast(
                            "Welcome back!",
                            "success"
                        );

                    }

                }
            );

        }


        /* =================================================
           SIGNUP FORM
        ================================================= */

        const signupForm =
            document.getElementById(
                "signupForm"
            );

        if (signupForm) {

            signupForm.addEventListener(
                "submit",
                async event => {

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
                    }


                    if (!result.success) {

                        showError(
                            "signupError",
                            result.message
                        );

                        return;
                    }


                    signupForm.reset();


                    if (window.App) {
                        window.App.closeModal(
                            "signupModal"
                        );
                    }


                    if (result.needsConfirmation) {

                        if (
                            window.App &&
                            typeof window.App.showToast ===
                            "function"
                        ) {

                            window.App.showToast(
                                result.message,
                                "info"
                            );

                        }

                    } else {

                        if (
                            window.App &&
                            typeof window.App.showToast ===
                            "function"
                        ) {

                            window.App.showToast(
                                "Account created successfully!",
                                "success"
                            );

                        }

                    }

                }
            );

        }

    }
    /* =====================================================
       SESSION REFRESH
    ===================================================== */

    let refreshPromise = null;


    async function refreshSupabaseSession() {

        const session =
            getSession();

        if (!session) {
            return null;
        }

        const refreshToken =
            session.refresh_token ||
            session.refreshToken ||
            null;

        if (!refreshToken) {
            console.warn(
                "LosOja: No refresh token available."
            );

            return session;
        }


        /*
         * Prevent multiple parts of the website
         * from refreshing the session at the same time.
         */

        if (refreshPromise) {
            return refreshPromise;
        }


        refreshPromise =
            (async function () {

                try {

                    const response =
                        await fetch(
                            SUPABASE_URL +
                            "/auth/v1/token?grant_type=refresh_token",
                            {
                                method: "POST",

                                headers:
                                    getHeaders(),

                                body:
                                    JSON.stringify({
                                        refresh_token:
                                            refreshToken
                                    })
                            }
                        );


                    let data = null;

                    try {
                        data =
                            await response.json();
                    } catch (_) {
                        data = null;
                    }


                    if (!response.ok) {

                        console.warn(
                            "LosOja: Session refresh failed:",
                            data
                        );

                        /*
                         * Do not immediately destroy the session
                         * because a temporary network problem should
                         * not log the user out.
                         */

                        return null;
                    }


                    if (
                        !data ||
                        !data.access_token ||
                        !data.user
                    ) {

                        console.warn(
                            "LosOja: Refresh response did not contain a valid session."
                        );

                        return null;
                    }


                    saveSession(data);

                    updateAuthUI();


                    console.log(
                        "LosOja: Supabase session refreshed successfully."
                    );


                    return data;


                } catch (error) {

                    console.warn(
                        "LosOja: Session refresh network error:",
                        error
                    );

                    return null;


                } finally {

                    refreshPromise =
                        null;

                }

            })();


        return refreshPromise;
    }


    async function ensureValidSupabaseSession() {

        const session =
            getSession();

        if (!session) {
            return null;
        }


        /*
         * Supabase normally provides expires_at
         * as a Unix timestamp in seconds.
         */

        const expiresAt =
            Number(
                session.expires_at || 0
            );


        /*
         * Refresh when the token has expired
         * or will expire within the next 60 seconds.
         */

        if (
            expiresAt &&
            expiresAt >
            Math.floor(Date.now() / 1000) + 60
        ) {

            return session;

        }


        const refreshedSession =
            await refreshSupabaseSession();


        if (refreshedSession) {
            return refreshedSession;
        }


        /*
         * If refreshing failed, return the existing
         * session rather than immediately deleting it.
         *
         * The requesting operation can then report
         * the actual Supabase error.
         */

        return getSession();

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

    window.logout =
        logout;

    window.doLogin =
        login;

    window.doSignup =
        signup;

    window.updateAuthUI =
        updateAuthUI;

    window.openLogin =
        openLogin;

    window.openSignup =
        openSignup;
    window.refreshSupabaseSession =
        refreshSupabaseSession;

    window.ensureValidSupabaseSession =
        ensureValidSupabaseSession;

    /* =====================================================
       START AUTH
    ===================================================== */

    function initAuth() {

        bindEvents();

        updateAuthUI();

    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initAuth
        );

    } else {

        initAuth();

    }

})();
