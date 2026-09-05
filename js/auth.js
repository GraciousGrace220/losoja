/**
 * LosOja - Authentication (localStorage)
 */

const Auth = {
    STORAGE_KEY: 'losoja_users',
    SESSION_KEY: 'losoja_session',

    init() {
        this.bindEvents();
        this.updateUI();
    },

    getUsers() {
        try {
            return JSON.parse(localStorage.getItem(this.STORAGE_KEY)) || [];
        } catch {
            return [];
        }
    },

    saveUsers(users) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(users));
    },

    getSession() {
        try {
            return JSON.parse(localStorage.getItem(this.SESSION_KEY));
        } catch {
            return null;
        }
    },

    setSession(user) {
        localStorage.setItem(this.SESSION_KEY, JSON.stringify({
            id: user.id,
            name: user.name,
            email: user.email
        }));
    },

    clearSession() {
        localStorage.removeItem(this.SESSION_KEY);
    },

    getCurrentUser() {
        return this.getSession();
    },

    isLoggedIn() {
        return !!this.getSession();
    },

    signup(name, email, password) {
        const users = this.getUsers();
        const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (existing) {
            return { success: false, message: 'An account with this email already exists.' };
        }
        if (password.length < 6) {
            return { success: false, message: 'Password must be at least 6 characters.' };
        }

        const user = {
            id: App.generateId(),
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password,
            createdAt: new Date().toISOString()
        };
        users.push(user);
        this.saveUsers(users);
        this.setSession(user);
        return { success: true, user };
    },

    login(email, password) {
        const users = this.getUsers();
        const user = users.find(
            u => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password
        );
        if (!user) {
            return { success: false, message: 'Invalid email or password.' };
        }
        this.setSession(user);
        return { success: true, user };
    },

    logout() {
        this.clearSession();
        this.updateUI();
        App.showToast('You have been logged out.');
    },

    updateUI() {
        const user = this.getCurrentUser();
        const loginBtn = document.getElementById('loginBtn');
        const signupBtn = document.getElementById('signupBtn');
        const userArea = document.getElementById('userArea');
        const dashLink = document.getElementById('dashboardNavLink');
        const mobileAuth = document.getElementById('mobileAuthLinks');

        if (user) {
            if (loginBtn) loginBtn.classList.add('hidden');
            if (signupBtn) signupBtn.classList.add('hidden');
            if (mobileAuth) mobileAuth.classList.add('hidden');
            if (dashLink) dashLink.classList.remove('hidden');
            if (userArea) {
                userArea.classList.remove('hidden');
                const initials = user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                userArea.innerHTML = `
                    <div class="user-avatar">${App.escapeHtml(initials)}</div>
                    <span class="user-name">${App.escapeHtml(user.name)}</span>
                    <button type="button" class="btn btn-outline" id="logoutBtn">Logout</button>
                `;
                document.getElementById('logoutBtn')?.addEventListener('click', () => this.logout());
            }
        } else {
            if (loginBtn) loginBtn.classList.remove('hidden');
            if (signupBtn) signupBtn.classList.remove('hidden');
            if (mobileAuth) mobileAuth.classList.remove('hidden');
            if (dashLink) dashLink.classList.add('hidden');
            if (userArea) {
                userArea.classList.add('hidden');
                userArea.innerHTML = '';
            }
            if (typeof Dashboard !== 'undefined') Dashboard.hide();
        }
    },

    bindEvents() {
        const openLogin = () => {
            App.closeAllModals();
            App.openModal('loginModal');
            document.getElementById('navLinks')?.classList.remove('open');
        };
        const openSignup = () => {
            App.closeAllModals();
            App.openModal('signupModal');
            document.getElementById('navLinks')?.classList.remove('open');
        };

        document.getElementById('loginBtn')?.addEventListener('click', openLogin);
        document.getElementById('signupBtn')?.addEventListener('click', openSignup);
        document.getElementById('mobileLoginBtn')?.addEventListener('click', openLogin);
        document.getElementById('mobileSignupBtn')?.addEventListener('click', openSignup);

        document.getElementById('switchToSignup')?.addEventListener('click', () => {
            App.closeModal('loginModal');
            App.openModal('signupModal');
        });
        document.getElementById('switchToLogin')?.addEventListener('click', () => {
            App.closeModal('signupModal');
            App.openModal('loginModal');
        });

        document.getElementById('loginForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            const errorEl = document.getElementById('loginError');

            const result = this.login(email, password);
            if (!result.success) {
                errorEl.textContent = result.message;
                errorEl.classList.remove('hidden');
                return;
            }
            errorEl.classList.add('hidden');
            App.closeModal('loginModal');
            this.updateUI();
            App.showToast(`Welcome back, ${result.user.name}!`);
            e.target.reset();
        });

        document.getElementById('signupForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('signupName').value;
            const email = document.getElementById('signupEmail').value;
            const password = document.getElementById('signupPassword').value;
            const errorEl = document.getElementById('signupError');

            const result = this.signup(name, email, password);
            if (!result.success) {
                errorEl.textContent = result.message;
                errorEl.classList.remove('hidden');
                return;
            }
            errorEl.classList.add('hidden');
            App.closeModal('signupModal');
            this.updateUI();
            App.showToast(`Account created! Welcome, ${result.user.name}!`);
            e.target.reset();
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Auth.init();
});
