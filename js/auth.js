document.addEventListener("DOMContentLoaded", function () {

    const USERS_KEY = "losoja_users";
    const CURRENT_USER_KEY = "losoja_current_user";

    function getUsers() {
        try {
            return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
        } catch (error) {
            return [];
        }
    }

    function saveUsers(users) {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

    function getCurrentUser() {
        try {
            return JSON.parse(localStorage.getItem(CURRENT_USER_KEY));
        } catch (error) {
            return null;
        }
    }

    function setCurrentUser(user) {
        if (user) {
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
        } else {
const headerActions = document.querySelector(".header-actions");

if (headerActions) {
    headerActions.classList.remove("logged-in");
}
            localStorage.removeItem(CURRENT_USER_KEY);
        }
    }

    // ================================
    // SIGN UP
    // ================================

    const signupForm = document.getElementById("signupForm");

    if (signupForm) {
        signupForm.addEventListener("submit", function (event) {
            event.preventDefault();

            const name = document.getElementById("signupName")?.value.trim();
            const email = document.getElementById("signupEmail")?.value.trim().toLowerCase();
            const password = document.getElementById("signupPassword")?.value;

            if (!name || !email || !password) {
                showNotification("Please fill in all fields.");
                return;
            }

            const users = getUsers();

            const existingUser = users.find(function (user) {
                return user.email === email;
            });

            if (existingUser) {
                showNotification("An account with this email already exists.");
                return;
            }

            const newUser = {
                id: Date.now().toString(),
                name: name,
                email: email,
                password: password,
                createdAt: new Date().toISOString()
            };

            users.push(newUser);
            saveUsers(users);

            setCurrentUser({
                id: newUser.id,
                name: newUser.name,
                email: newUser.email
            });

            signupForm.reset();

            closeModal("signupModal");

            updateAuthUI();

            showNotification("Account created successfully!");

        });
    }

    // ================================
    // LOGIN
    // ================================

    const loginForm = document.getElementById("loginForm");

    if (loginForm) {
        loginForm.addEventListener("submit", function (event) {
            event.preventDefault();

            const email = document.getElementById("loginEmail")?.value.trim().toLowerCase();
            const password = document.getElementById("loginPassword")?.value;

            if (!email || !password) {
                showNotification("Please enter your email and password.");
                return;
            }

            const users = getUsers();

            const user = users.find(function (account) {
                return account.email === email &&
                       account.password === password;
            });

            if (!user) {
                showNotification("Incorrect email or password.");
                return;
            }

            setCurrentUser({
                id: user.id,
                name: user.name,
                email: user.email
            });

            loginForm.reset();

            closeModal("loginModal");

            updateAuthUI();

            showNotification("Welcome back, " + user.name + "!");

        });
    }

    // ================================
    // LOGOUT
    // ================================

    window.logoutUser = function () {

        setCurrentUser(null);

        updateAuthUI();

        showNotification("You have been logged out.");

    };

    // ================================
    // AUTH UI
    // ================================

    window.updateAuthUI = function () {

        const currentUser = getCurrentUser();

        const loginButtons = document.querySelectorAll(
            "#loginBtn, .login-btn"
        );

        const signupButtons = document.querySelectorAll(
            "#signupBtn, .signup-btn"
        );

        const userArea = document.getElementById("userArea");

        if (currentUser) {
const headerActions = document.querySelector(".header-actions");

if (headerActions) {
    headerActions.classList.add("logged-in");
}
            loginButtons.forEach(function (button) {
                button.style.display = "none";
            });

            signupButtons.forEach(function (button) {
                button.style.display = "none";
            });

            if (userArea) {
                userArea.innerHTML = `
                    <span class="user-name">
                        Hi, ${escapeAuthHTML(currentUser.name)}
                    </span>
                    <button class="btn btn-outline" onclick="logoutUser()">
                        Logout
                    </button>
                `;
            }

        } else {

            loginButtons.forEach(function (button) {
                button.style.display = "";
            });

            signupButtons.forEach(function (button) {
                button.style.display = "";
            });

            if (userArea) {
                userArea.innerHTML = "";
            }
        }
    };

    // ================================
    // SWITCH LOGIN / SIGNUP
    // ================================

    window.showSignup = function () {
        closeModal("loginModal");
        openModal("signupModal");
    };

    window.showLogin = function () {
        closeModal("signupModal");
        openModal("loginModal");
    };

    // ================================
    // HTML SAFETY
    // ================================

    function escapeAuthHTML(value) {

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }

    // Update interface when page loads
    updateAuthUI();

});
