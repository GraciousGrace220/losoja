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
       TOKEN EXPIRATION
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


        /*
         * Some Supabase responses provide expires_in
         * instead of expires_at.
         */

        if (session.expires_in && session.created_at) {

            const expiresAt =
                Number(session.created_at) +
                Number(session.expires_in);

            const now =
                Math.floor(
                    Date.now() / 1000
                );

            return expiresAt <= now + 60;
        }


        return false;

    }


    /* =====================================================
       REFRESH SESSION
    ===================================================== */

    let refreshPromise = null;


    async function refreshSupabaseSession() {

        if (refreshPromise) {
            return refreshPromise;
        }


        refreshPromise =
            (async function () {

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

                    clearSession();

                    updateUI();

                    return {
                        success: false,
                        message:
                            "Your session has expired. Please log in again."
                    };

                }


                try {

                    const response =
                        await fetch(

                            SUPABASE_URL +
                            "/auth/v1/token?grant_type=refresh_token",

                            {
                                method:
                                    "POST",

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
                                getErrorMessage(
                                    data
                                )
                        };

                    }


                    if (
                        !data.access_token ||
                        !data.user
                    ) {

                        return {
                            success: false,
                            message:
                                "Could not refresh your session."
                        };

                    }


                    saveSession(data);

                    updateUI();


                    return {
                        success: true,
                        user:
                            data.user,
                        session:
                            data
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


        if (!isTokenExpired(session)) {
            return session;
        }


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
                        method:
                            "POST",

                        headers:
                            headers(),

                        body:
                            JSON.stringify({
                                email:
                                    email,

                                password:
                                    password
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
                        getErrorMessage(
                            data
                        )
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
                user:
                    data.user,
                session:
                    data
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
                        method:
                            "POST",

                        headers:
                            headers(),

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
                        getErrorMessage(
                            data
                        )
                };

            }


            /*
             * Email confirmation may be required.
             */

            if (
                data.access_token &&
                data.user
            ) {

                saveSession(data);

                updateUI();

                return {
                    success: true,
                    user:
                        data.user,
                    session:
                        data
                };

            }


            return {

                success:
                    true,

                needsConfirmation:
                    true,

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
                        method:
                            "POST",

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
                typeof Dashboard !==
                    "undefined" &&
                typeof Dashboard.hide ===
                    "function"
            ) {

                Dashboard.hide();

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
       UPDATE AUTH UI
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


        if (user) {

            /*
             * Logged in:
             * hide Login and Sign Up.
             */

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


            /*
             * Show user area if it exists.
             */

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

                    logoutBtn.onclick =
                        logout;

                }

            }


        } else {

            /*
             * Logged out:
             * show Login and Sign Up.
             */

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
       OPEN LOGIN
    ===================================================== */

    function openLogin() {

        const signupModal =
            document.getElementById(
                "signupModal"
            );

        if (signupModal) {

            signupModal.classList.remove(
                "active"
            );

            signupModal.classList.add(
                "hidden"
            );

            signupModal.style.display =
                "none";

        }


        const modal =
            document.getElementById(
                "loginModal"
            );


        if (!modal) {

            console.error(
                "LosOja: loginModal not found."
            );

            return;

        }


        modal.classList.remove(
            "hidden"
        );

        modal.classList.add(
            "active"
        );

        modal.style.display =
            "flex";

        document.body.classList.add(
            "modal-open"
        );


        const emailInput =
            document.getElementById(
                "loginEmail"
            );


        if (emailInput) {

            setTimeout(
                () => {
                    emailInput.focus();
                },
                50
            );

        }

    }


    /* =====================================================
       OPEN SIGNUP
    ===================================================== */

    function openSignup() {

        const loginModal =
            document.getElementById(
                "loginModal"
            );

        if (loginModal) {

            loginModal.classList.remove(
                "active"
            );

            loginModal.classList.add(
                "hidden"
            );

            loginModal.style.display =
                "none";

        }


        const modal =
            document.getElementById(
                "signupModal"
            );


        if (!modal) {

            console.error(
                "LosOja: signupModal not found."
            );

            return;

        }


        modal.classList.remove(
            "hidden"
        );

        modal.classList.add(
            "active"
        );

        modal.style.display =
            "flex";

        document.body.classList.add(
            "modal-open"
        );


        const nameInput =
            document.getElementById(
                "signupName"
            );


        if (nameInput) {

            setTimeout(
                () => {
                    nameInput.focus();
                },
                50
            );

        }

    }


    /* =====================================================
       FORM ERROR
    ===================================================== */

    function showError(
        id,
        message
    ) {

        const element =
            document.getElementById(id);


        /*
         * If the HTML does not contain a dedicated
         * error element, use the main Los
