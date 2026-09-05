/**
 * LosOja - Main App
 * Handles UI utilities, modals, toasts, navigation
 */

const App = {
    init() {
        this.setCurrentYear();
        this.bindModalClosers();
        this.bindMobileMenu();
        this.bindSmoothScroll();
        this.bindLogo();
    },

    bindLogo() {
        document.querySelector('.logo')?.addEventListener('click', (e) => {
            e.preventDefault();
            if (typeof Dashboard !== 'undefined') Dashboard.hide();
            document.getElementById('home')?.scrollIntoView({ behavior: 'smooth' });
        });
    },

    setCurrentYear() {
        const el = document.getElementById('currentYear');
        if (el) el.textContent = new Date().getFullYear();
    },

    openModal(id) {
        document.querySelectorAll('.modal.active').forEach(m => m.classList.remove('active'));
        const modal = document.getElementById(id);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        } else {
            console.error('Modal not found:', id);
        }
    },

    closeModal(id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    },

    closeAllModals() {
        document.querySelectorAll('.modal.active').forEach(m => m.classList.remove('active'));
        document.body.style.overflow = '';
    },

    bindModalClosers() {
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                const modal = btn.closest('.modal');
                if (modal) {
                    modal.classList.remove('active');
                    document.body.style.overflow = '';
                }
            });
        });

        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                    document.body.style.overflow = '';
                }
            });
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeAllModals();
        });
    },

    bindMobileMenu() {
        const btn = document.getElementById('mobileMenuBtn');
        const nav = document.getElementById('navLinks');
        if (!btn || !nav) return;

        btn.addEventListener('click', () => {
            nav.classList.toggle('open');
        });

        nav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => nav.classList.remove('open'));
        });
    },

    bindSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                const targetId = anchor.getAttribute('href');
                if (targetId === '#' || targetId === '#dashboard') return;
                const target = document.querySelector(targetId);
                if (target) {
                    e.preventDefault();
                    if (typeof Dashboard !== 'undefined') Dashboard.hide();
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    },

    showToast(message, duration = 3000) {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = message;
        toast.classList.remove('hidden');
        clearTimeout(this._toastTimer);
        this._toastTimer = setTimeout(() => {
            toast.classList.add('hidden');
        }, duration);
    },

    generateId() {
        return 'id_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    },

    escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    formatDate(iso) {
        try {
            return new Date(iso).toLocaleDateString('en-NG', {
                year: 'numeric', month: 'short', day: 'numeric'
            });
        } catch {
            return '';
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
