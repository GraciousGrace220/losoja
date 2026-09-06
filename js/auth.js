/**
 * LosOja - Authentication
 * Supabase REST API Authentication
 *
 * Works with:
 * - GitHub index.html
 * - Supabase Auth
 * - Supabase businesses table
 * - businesses.js
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
       SESSION
    ===================================================== */

    function getSession() {

        try {

            const saved =
                localStorage.getItem(SESSION_KEY);

            if (!saved) {
                return null;
            }

            return JSON.parse(saved);

        } catch (error) {

            console.error(
                "LosOja: Could not read saved session.",
                error
            );

            return null;
        }
    }


    function saveSession(session) {

        localStorage.setItem(
            SESSION_KEY,
            JSON.stringify(session)
        );
    }


    function clearSession() {

        localStorage.removeItem(
            SESSION_KEY
        );
    }


    /* =====================================================
       CURRENT USER
    ===================================================== */

    function getCurrentUser() {

        const session =
            getSession();

        if (!session) {
            return null;
        }

        return session.user || null;
    }


    /* =====================================================
       USER DISPLAY NAME
    ===================================================== */

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
       AUTH HEADERS
    ===================================================== */

    function authHeaders(accessToken) {

        const headers = {

            "apikey":
                SUPABASE_KEY,

            "Content-Type":
                "application/json",

            "Accept":
                "application/json"

        };


        if (accessToken) {

            headers["Authorization"] =
                "Bearer " + accessToken;

        }


        return headers;
    }


    /* =====================================================
       SUPABASE SESSION FOR OTHER FILES
    ===================================================== */

    window.getSupabaseSession =
        function () {

            return getSession();

        };


    window.getCurrentUser =
        function () {

            return getCurrentUser();

        };


    /* =====================================================
       UI UPDATE
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


        const logoutBtn =
            document.getElementById(
                "logoutBtn"
            );


        const userArea =
            document.getElementById(
                "userArea"
            );


        const dashLink =
            document.getElementById(
                "dashboardNavLink"
            );


        const mobileAuth =
            document.getElementById(
                "mobileAuthLinks"
            );


        if (user) {

            const name =
                getUserName(user);


            /* Hide Login / Signup */

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


            if (mobileAuth) {
                mobileAuth.classList.add(
                    "hidden"
                );
            }


            /* Show dashboard */

            if (dashLink) {
                dashLink.classList.remove(
                    "hidden"
                );
            }


            /* Show logged-in user */

            if (userArea) {

                userArea.classList.remove(
                    "hidden"
                );


                const initials =
                    name
                        .split(/\s+/)
                        .filter(Boolean)
                        .map(
                            word =>
                                word.charAt(0)
                        )
                        .join("")
                        .slice(0, 2)
                        .toUpperCase();


                userArea.innerHTML = `

                    <div class="user-avatar">
                        ${escapeHTML(initials)}
                    </div>

                    <span class="user-name">
                        Hi, ${escapeHTML(name)}
                    </span>

                    <button
                        type="button"
                        class="btn btn-outline"
                        id="logoutBtn"
                    >
                        Logout
                    </button>

                `;


                const newLogoutBtn =
                    document.getElementById(
                        "logoutBtn"
                    );


                if (newLogoutBtn) {

                    newLogoutBtn.addEventListener(
                        "click",
                        logout
                    );

                }

            }

        } else {

            /* Show Login / Signup */

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


            if (mobileAuth) {
                mobileAuth.classList.remove(
                    "hidden"
                );
            }


            /* Hide dashboard */

            if (dashLink) {
                dashLink.classList.add(
                    "hidden"
                );
            }


            /* Hide user area */

            if (userArea) {

                userArea.classList.add(
                    "hidden"
                );

                userArea.innerHTML = "";

            }


            if (
                typeof Dashboard !==
                "undefined" &&
                Dashboard.hide
            ) {

                Dashboard.hide();

            }

        }

    }


    /* =====================================================
       HTML ESCAPE
    ===================================================== */

    function escapeHTML(value) {

        if (
            value === null ||
            value === undefined
        ) {

            return "";

        }


        const div =
            document.createElement(
                "div"
            );


        div.textContent =
            String(value);


        return div.innerHTML;

    }


    /* =====================================================
       OPEN LOGIN
    ===================================================== */

    function openLogin() {

        if (
            typeof App !==
            "undefined"
        ) {

            App.closeAllModals();
            App.openModal(
                "loginModal"
            );

        }

        document
            .getElementById(
                "navLinks"
            )
            ?.classList.remove(
                "open"
            );

    }


    /* =====================================================
       OPEN SIGNUP
    ===================================================== */

    function openSignup() {

        if (
            typeof App !==
            "undefined"
        ) {

            App.closeAllModals();
            App.openModal(
                "signupModal"
            );

        }

        document
            .getElementById(
                "navLinks"
            )
            ?.classList.remove(
                "open"
            );

    }


    /* =====================================================
       LOGIN
    ===================================================== */

    async function login(
        email,
        password
    ) {

        const response =
            await fetch(
                SUPABASE_URL +
                "/auth/v1/token?grant_type=password",
                {
                    method: "POST",

                    headers:
                        authHeaders(),

                    body:
                        JSON.stringify({
                            email:
                                email
                                    .trim()
                                    .toLowerCase(),

                            password:
                                password
                        })
                }
            );


        const responseText =
            await response.text();


        let data = null;


        try {

            data =
                JSON.parse(
                    responseText
                );

        } catch {

            data = null;

        }


        if (!response.ok) {

            console.error(
                "LosOja login error:",
                response.status,
                responseText
            );


            let message =
                "Invalid email or password.";


            if (data) {

                message =
                    data.error_description ||
                    data.msg ||
                    data.message ||
                    message;

            }


            throw new Error(
                message
            );

        }


        saveSession(data);


        updateUI();


        return data;

    }


    /* =====================================================
       SIGNUP
    ===================================================== */

    async function signup(
        name,
        email,
        password
    ) {

        const response =
            await fetch(
                SUPABASE_URL +
                "/auth/v1/signup",
                {
                    method: "POST",

                    headers:
                        authHeaders(),

                    body:
                        JSON.stringify({

                            email:
                                email
                                    .trim()
                                    .toLowerCase(),

                            password:
                                password,

                            data: {

                                full_name:
                                    name.trim(),

                                name:
                                    name.trim()

                            }

                        })
                }
            );


        const responseText =
            await response.text();


        let data = null;


        try {

            data =
                JSON.parse(
                    responseText
                );

        } catch {

            data = null;

        }


        if (!response.ok) {

            console.error(
                "LosOja signup error:",
                response.status,
                responseText
            );


            let message =
                "Could not create your account.";


            if (data) {

                message =
                    data.error_description ||
                    data.msg ||
                    data.message ||
                    message;

            }


            throw new Error(
                message
            );

        }


        /*
         * Supabase may require email confirmation.
         *
         * If an access token exists, the user
         * can be logged in immediately.
         */

        if (
            data &&
            data.access_token
        ) {

            saveSession(data);

            updateUI();

            return {
                session: data,
                requiresConfirmation: false
            };

        }


        return {
            session: null,
            requiresConfirmation: true
        };

    }


    /* =====================================================
       LOGOUT
    ===================================================== */

    async function logout() {

        const session =
            getSession();


        try {

            if (
                session &&
                session.access_token
            ) {

                await fetch(
                    SUPABASE_URL +
                    "/auth/v1/logout",
                    {
                        method: "POST",

                        headers:
                            authHeaders(
                                session.access_token
                            )
                    }
                );

            }

        } catch (error) {

            console.warn(
                "LosOja: Logout request failed.",
                error
            );

        }


        clearSession();


        updateUI();


        if (
            typeof App !==
            "undefined" &&
            App.closeAllModals
        ) {

            App.closeAllModals();

        }


        if (
            typeof App !==
            "undefined" &&
            App.showToast
        ) {

            App.showToast(
                "You have been logged out."
            );

        }

    }


    /* =====================================================
       EXPOSE FUNCTIONS
    ===================================================== */

    window.doLogin =
        async function () {

            const emailInput =
                document.getElementById(
                    "loginEmail"
                );


            const passwordInput =
                document.getElementById(
                    "loginPassword"
                );


            const errorElement =
                document.getElementById(
                    "loginError"
                );


            const email =
                emailInput?.value || "";


            const password =
                passwordInput?.value || "";


            if (!email || !password) {

                if (errorElement) {

                    errorElement.textContent =
                        "Please enter your email and password.";

                    errorElement.classList.remove(
                        "hidden"
                    );

                }

                return;

            }


            try {

                if (errorElement) {

                    errorElement.textContent =
                        "";

                    errorElement.classList.add(
                        "hidden"
                    );

                }


                const session =
                    await login(
                        email,
                        password
                    );


                if (
                    typeof App !==
                    "undefined"
                ) {

                    App.closeModal(
                        "loginModal"
                    );


                    App.showToast(
                        "Welcome back, " +
                        getUserName(
                            session.user
                        ) +
                        "!"
                    );

                }


                const form =
                    document.getElementById(
                        "loginForm"
                    );


                if (form) {
                    form.reset();
                }


            } catch (error) {

                console.error(
                    "LosOja: Login failed:",
                    error
                );


                if (errorElement) {

                    errorElement.textContent =
                        error.message ||
                        "Login failed.";

                    errorElement.classList.remove(
                        "hidden"
                    );

                }

            }

        };


    window.doSignup =
        async function () {

            const nameInput =
                document.getElementById(
                    "signupName"
                );


            const emailInput =
                document.getElementById(
                    "signupEmail"
                );


            const passwordInput =
                document.getElementById(
                    "signupPassword"
                );


            const errorElement =
                document.getElementById(
                    "signupError"
                );


            const name =
                nameInput?.value || "";


            const email =
                emailInput?.value || "";


            const password =
                passwordInput?.value || "";


            if (!name.trim()) {

                if (errorElement) {

                    errorElement.textContent =
                        "Please enter your name.";

                    errorElement.classList.remove(
                        "hidden"
                    );

                }

                return;

            }


            if (!email.trim()) {

                if (errorElement) {

                    errorElement.textContent =
                        "Please enter your email.";

                    errorElement.classList.remove(
                        "hidden"
                    );

                }

                return;

            }


            if (password.length < 6) {

                if (errorElement) {

                    errorElement.textContent =
                        "Password must be at least 6 characters.";

                    errorElement.classList.remove(
                        "hidden"
                    );

                }

                return;

            }


            try {

                if (errorElement) {

                    errorElement.textContent =
                        "";

                    errorElement.classList.add(
                        "hidden"
                    );

                }


                const result =
                    await signup(
                        name,
                        email,
                        password
                    );


                if (
                    result.requiresConfirmation
                ) {

                    if (typeof App !== "undefined") {

                        App.closeModal(
                            "signupModal"
                        );

                        App.showToast(
                            "Account created. Please check your email to confirm your account, then log in."
                        );

                    }

                } else {

                    if (
                        typeof App !==
                        "undefined"
                    ) {

                        App.closeModal(
                            "signupModal"
                        );


                        App.showToast(
                            "Account created! Welcome, " +
                            getUserName(
                                result.session.user
                            ) +
                            "!"
                        );

                    }

                }


                const form =
                    document.getElementById(
                        "signupForm"
                    );


                if (form) {
                    form.reset();
                }


            } catch (error) {

                console.error(
                    "LosOja: Signup failed:",
                    error
                );


                if (errorElement) {

                    errorElement.textContent =
                        error.message ||
                        "Could not create account.";

                    errorElement.classList.remove(
                        "hidden"
                    );

                }

            }

        };


    window.logout =
        logout;


    /* =====================================================
       INITIALIZATION
    ===================================================== */

    document.addEventListener(
        "DOMContentLoaded",
        function () {

            /*
             * Login/signup buttons
             */

            document
                .getElementById(
                    "loginBtn"
                )
                ?.addEventListener(
                    "click",
                    function (event) {

                        event.preventDefault();

                        openLogin();

                    }
                );


            document
                .getElementById(
                    "signupBtn"
                )
                ?.addEventListener(
                    "click",
                    function (event) {

                        event.preventDefault();

                        openSignup();

                    }
                );


            document
                .getElementById(
                    "mobileLoginBtn"
                )
                ?.addEventListener(
                    "click",
                    function (event) {

                        event.preventDefault();

                        openLogin();

                    }
                );


            document
                .getElementById(
                    "mobileSignupBtn"
                )
                ?.addEventListener(
                    "click",
                    function (event) {

                        event.preventDefault();

                        openSignup();

                    }
                );


            /*
             * Login form
             */

            document
                .getElementById(
                    "loginForm"
                )
                ?.addEventListener(
                    "submit",
                    function (event) {

                        event.preventDefault();

                        window.doLogin();

                    }
                );


            /*
             * Signup form
             */

            document
                .getElementById(
                    "signupForm"
                )
                ?.addEventListener(
                    "submit",
                    function (event) {

                        event.preventDefault();

                        window.doSignup();

                    }
                );


            /*
             * Switch Login / Signup
             */

            document
                .getElementById(
                    "switchToSignup"
                )
                ?.addEventListener(
                    "click",
                    function () {

                        App.closeModal(
                            "loginModal"
                        );

                        App.openModal(
                            "signupModal"
                        );

                    }
                );


            document
                .getElementById(
                    "switchToLogin"
                )
                ?.addEventListener(
                    "click",
                    function () {

                        App.closeModal(
                            "signupModal"
                        );

                        App.openModal(
                            "loginModal"
                        );

                    }
                );


            /*
             * Update header immediately.
             */

            updateUI();

        }

    );


})();
