const SUPABASE_URL = "https://ycxshwgeebskdozmornh.supabase.co";
const SUPABASE_KEY = "sb_publishable_jFSLacwNupO6T8EnSqb2bw_bZmy7rVe";

const CURRENT_SESSION_KEY = "losoja_supabase_session";

/* ================================
   SUPABASE HEADERS
================================ */

function supabaseAuthHeaders(accessToken) {
    const headers = {
        "apikey": SUPABASE_KEY,
        "Content-Type": "application/json"
    };

    if (accessToken) {
        headers["Authorization"] = "Bearer " + accessToken;
    }

    return headers;
}

/* ================================
   SESSION
================================ */

function getSupabaseSession() {
    try {
        const saved = localStorage.getItem(
            CURRENT_SESSION_KEY
        );

        if (!saved) {
            return null;
        }

        return JSON.parse(saved);

    } catch (error) {
        console.error(
            "Could not read Supabase session:",
            error
        );

        return null;
    }
}

function saveSupabaseSession(session) {

    if (session) {
        localStorage.setItem(
            CURRENT_SESSION_KEY,
            JSON.stringify(session)
        );
    } else {
        localStorage.removeItem(
            CURRENT_SESSION_KEY
        );
    }
}

window.getSupabaseSession = getSupabaseSession;

/* ================================
   CURRENT USER
================================ */

window.getCurrentUser = function () {

    const session = getSupabaseSession();

    if (!session || !session.user) {
        return null;
    }

    return session.user;
};

/* ================================
   SIGN UP
================================ */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const signupForm =
            document.getElementById("signupForm");

        if (signupForm) {

            signupForm.addEventListener(
                "submit",
                async function (event) {

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

                        showNotification(
                            "Please fill in all fields."
                        );

                        return;
                    }

                    if (password.length < 6) {

                        showNotification(
                            "Password must be at least 6 characters."
                        );

                        return;
                    }

                    const submitButton =
                        signupForm.querySelector(
                            'button[type="submit"]'
                        );

                    if (submitButton) {
                        submitButton.disabled = true;
                        submitButton.textContent =
                            "Creating account...";
                    }

                    try {

                        const response =
                            await fetch(
                                SUPABASE_URL +
                                "/auth/v1/signup",
                                {
                                    method: "POST",

                                    headers:
                                        supabaseAuthHeaders(),

                                    body: JSON.stringify({
                                        email: email,
                                        password: password,
                                        data: {
                                            name: name
                                        }
                                    })
                                }
                            );

                        const data =
                            await response.json();

                        if (!response.ok) {

                            throw new Error(
                                data.message ||
                                data.msg ||
                                data.error_description ||
                                data.error ||
                                "Could not create account."
                            );
                        }

                        /*
                         * Supabase may require email
                         * confirmation before creating
                         * an active session.
                         */

                        if (data.access_token) {

                            saveSupabaseSession({
                                access_token:
                                    data.access_token,

                                refresh_token:
                                    data.refresh_token,

                                user:
                                    data.user
                            });

                            signupForm.reset();

                            closeModal(
                                "signupModal"
                            );

                            updateAuthUI();

                            showNotification(
                                "Account created successfully!"
                            );

                        } else {

                            signupForm.reset();

                            closeModal(
                                "signupModal"
                            );

                            showNotification(
                                "Account created. Please check your email to confirm your account, then log in."
                            );
                        }

                    } catch (error) {

                        console.error(
                            "Signup error:",
                            error
                        );

                        showNotification(
                            error.message ||
                            "Could not create account."
                        );

                    } finally {

                        if (submitButton) {

                            submitButton.disabled =
                                false;

                            submitButton.textContent =
                                "Sign Up";
                        }
                    }
                }
            );
        }

        /* ================================
           LOGIN
        ================================ */

        const loginForm =
            document.getElementById("loginForm");

        if (loginForm) {

            loginForm.addEventListener(
                "submit",
                async function (event) {

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

                        showNotification(
                            "Please enter your email and password."
                        );

                        return;
                    }

                    const submitButton =
                        loginForm.querySelector(
                            'button[type="submit"]'
                        );

                    if (submitButton) {
                        submitButton.disabled = true;
                        submitButton.textContent =
                            "Logging in...";
                    }

                    try {

                        const response =
                            await fetch(
                                SUPABASE_URL +
                                "/auth/v1/token?grant_type=password",
                                {
                                    method: "POST",

                                    headers:
                                        supabaseAuthHeaders(),

                                    body: JSON.stringify({
                                        email: email,
                                        password: password
                                    })
                                }
                            );

                        const data =
                            await response.json();

                        if (!response.ok) {

                            throw new Error(
                                data.msg ||
                                data.message ||
                                data.error_description ||
                                data.error ||
                                "Incorrect email or password."
                            );
                        }

                        saveSupabaseSession({
                            access_token:
                                data.access_token,

                            refresh_token:
                                data.refresh_token,

                            user:
                                data.user
                        });

                        loginForm.reset();

                        closeModal("loginModal");

                        updateAuthUI();

                        const userName =
                            data.user?.user_metadata?.name ||
                            data.user?.email ||
                            "there";

                        showNotification(
                            "Welcome back, " +
                            userName +
                            "!"
                        );

                    } catch (error) {

                        console.error(
                            "Login error:",
                            error
                        );

                        showNotification(
                            error.message ||
                            "Could not log in."
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
            );
        }

        /* ================================
           INITIAL AUTH UI
        ================================ */

        updateAuthUI();
    }
);

/* ================================
   LOGOUT
================================ */

window.logoutUser = function () {

    saveSupabaseSession(null);

    updateAuthUI();

    showNotification(
        "You have been logged out."
    );
};

/* ================================
   AUTH UI
================================ */

window.updateAuthUI = function () {

    const currentUser =
        window.getCurrentUser();

    const loginButtons =
        document.querySelectorAll(
            "#loginBtn, .login-btn"
        );

    const signupButtons =
        document.querySelectorAll(
            "#signupBtn, .signup-btn"
        );

    const userArea =
        document.getElementById(
            "userArea"
        );

    const headerActions =
        document.querySelector(
            ".header-actions"
        );

    if (currentUser) {

        if (headerActions) {
            headerActions.classList.add(
                "logged-in"
            );
        }

        loginButtons.forEach(
            function (button) {
                button.style.display = "none";
            }
        );

        signupButtons.forEach(
            function (button) {
                button.style.display = "none";
            }
        );

        if (userArea) {

            const userName =
                currentUser
                    .user_metadata
                    ?.name ||
                currentUser.email ||
                "User";

            userArea.innerHTML = `
                <span class="user-name">
                    Hi, ${escapeAuthHTML(userName)}
                </span>

                <button
                    class="btn btn-outline"
                    type="button"
                    onclick="logoutUser()">
                    Logout
                </button>
            `;
        }

    } else {

        if (headerActions) {
            headerActions.classList.remove(
                "logged-in"
            );
        }

        loginButtons.forEach(
            function (button) {
                button.style.display = "";
            }
        );

        signupButtons.forEach(
            function (button) {
                button.style.display = "";
            }
        );

        if (userArea) {
            userArea.innerHTML = "";
        }
    }
};

/* ================================
   LOGIN / SIGNUP SWITCH
================================ */

window.showSignup = function () {

    closeModal("loginModal");

    openModal("signupModal");
};

window.showLogin = function () {

    closeModal("signupModal");

    openModal("loginModal");
};

/* ================================
   HTML SAFETY
================================ */

function escapeAuthHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
