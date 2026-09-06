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


    /* =====================================================
       LOGO
    ===================================================== */

    bindLogo() {

        document.querySelector('.logo')?.addEventListener(
            'click',
            (e) => {

                e.preventDefault();

                if (
                    typeof Dashboard !== 'undefined' &&
                    Dashboard.hide
                ) {
                    Dashboard.hide();
                }

                const home =
                    document.getElementById('home');

                if (home) {

                    home.scrollIntoView({
                        behavior: 'smooth'
                    });

                } else {

                    window.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                    });

                }

            }
        );

    },


    /* =====================================================
       CURRENT YEAR
    ===================================================== */

    setCurrentYear() {

        const el =
            document.getElementById('currentYear');

        if (el) {

            el.textContent =
                new Date().getFullYear();

        }

    },


    /* =====================================================
       OPEN MODAL
    ===================================================== */

    openModal(id) {

        document
            .querySelectorAll('.modal.active')
            .forEach(modal => {

                modal.classList.remove('active');

            });


        document
            .querySelectorAll('.modal.open')
            .forEach(modal => {

                modal.classList.remove('open');

            });


        const modal =
            document.getElementById(id);


        if (!modal) {

            console.error(
                'LosOja: Modal not found:',
                id
            );

            return;

        }


        /*
         * Your current GitHub HTML uses
         * the "active" class.
         */

        modal.classList.add('active');


        /*
         * Some older LosOja code uses "open".
         * Adding it here keeps both versions
         * compatible.
         */

        modal.classList.add('open');


        document.body.style.overflow =
            'hidden';

    },


    /* =====================================================
       CLOSE MODAL
    ===================================================== */

    closeModal(id) {

        const modal =
            document.getElementById(id);


        if (!modal) {
            return;
        }


        modal.classList.remove('active');
        modal.classList.remove('open');


        document.body.style.overflow =
            '';

    },


    /* =====================================================
       CLOSE ALL MODALS
    ===================================================== */

    closeAllModals() {

        document
            .querySelectorAll('.modal')
            .forEach(modal => {

                modal.classList.remove('active');
                modal.classList.remove('open');

            });


        document.body.style.overflow =
            '';

    },


    /* =====================================================
       MODAL CLOSE BUTTONS
    ===================================================== */

    bindModalClosers() {

        document
            .querySelectorAll('.modal-close')
            .forEach(btn => {

                btn.addEventListener(
                    'click',
                    () => {

                        const modal =
                            btn.closest('.modal');


                        if (modal) {

                            modal.classList.remove(
                                'active'
                            );

                            modal.classList.remove(
                                'open'
                            );

                            document.body.style.overflow =
                                '';

                        }

                    }
                );

            });


        /*
         * Close when clicking the dark
         * area outside the modal box.
         */

        document
            .querySelectorAll('.modal')
            .forEach(modal => {

                modal.addEventListener(
                    'click',
                    (e) => {

                        if (
                            e.target === modal
                        ) {

                            modal.classList.remove(
                                'active'
                            );

                            modal.classList.remove(
                                'open'
                            );

                            document.body.style.overflow =
                                '';

                        }

                    }
                );

            });


        /*
         * ESC key closes any open modal.
         */

        document.addEventListener(
            'keydown',
            (e) => {

                if (e.key === 'Escape') {

                    this.closeAllModals();

                }

            }
        );

    },


    /* =====================================================
       MOBILE MENU
    ===================================================== */

    bindMobileMenu() {

        const btn =
            document.getElementById(
                'mobileMenuBtn'
            );

        const nav =
            document.getElementById(
                'navLinks'
            );


        if (!btn || !nav) {
            return;
        }


        btn.addEventListener(
            'click',
            () => {

                nav.classList.toggle(
                    'open'
                );

            }
        );


        nav.querySelectorAll('a')
            .forEach(link => {

                link.addEventListener(
                    'click',
                    () => {

                        nav.classList.remove(
                            'open'
                        );

                    }
                );

            });

    },


    /* =====================================================
       SMOOTH SCROLL
    ===================================================== */

    bindSmoothScroll() {

        document
            .querySelectorAll(
                'a[href^="#"]'
            )
            .forEach(anchor => {

                anchor.addEventListener(
                    'click',
                    (e) => {

                        const targetId =
                            anchor.getAttribute(
                                'href'
                            );


                        if (
                            targetId === '#' ||
                            targetId === '#dashboard'
                        ) {
                            return;
                        }


                        const target =
                            document.querySelector(
                                targetId
                            );


                        if (target) {

                            e.preventDefault();


                            if (
                                typeof Dashboard !==
                                'undefined' &&
                                Dashboard.hide
                            ) {

                                Dashboard.hide();

                            }


                            target.scrollIntoView({
                                behavior: 'smooth',
                                block: 'start'
                            });

                        }

                    }
                );

            });

    },


    /* =====================================================
       TOAST
    ===================================================== */

    showToast(
        message,
        duration = 3000
    ) {

        const toast =
            document.getElementById(
                'toast'
            );


        if (!toast) {
            return;
        }


        toast.textContent =
            message;


        toast.classList.remove(
            'hidden'
        );


        toast.classList.add(
            'show'
        );


        clearTimeout(
            this._toastTimer
        );


        this._toastTimer =
            setTimeout(
                () => {

                    toast.classList.add(
                        'hidden'
                    );

                    toast.classList.remove(
                        'show'
                    );

                },
                duration
            );

    },


    /* =====================================================
       GENERATE ID
    ===================================================== */

    generateId() {

        return (
            'id_' +
            Date.now().toString(36) +
            Math.random()
                .toString(36)
                .slice(2, 8)
        );

    },


    /* =====================================================
       ESCAPE HTML
    ===================================================== */

    escapeHtml(str) {

        if (!str) {
            return '';
        }


        const div =
            document.createElement(
                'div'
            );


        div.textContent =
            str;


        return div.innerHTML;

    },


    /* =====================================================
       FORMAT DATE
    ===================================================== */

    formatDate(iso) {

        try {

            return new Date(
                iso
            ).toLocaleDateString(
                'en-NG',
                {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                }
            );

        } catch {

            return '';

        }

    }

};


/* =========================================================
   BACKWARD COMPATIBILITY
   =========================================================

   Your index.html uses:

       openModal('loginModal')
       closeModal('loginModal')

   while the newer app.js uses:

       App.openModal()
       App.closeModal()

   These aliases allow BOTH styles to work.
========================================================= */

window.App =
    App;


window.openModal =
    function (id) {

        App.openModal(id);

    };


window.closeModal =
    function (id) {

        App.closeModal(id);

    };


window.showNotification =
    function (message) {

        App.showToast(message);

    };


/* =====================================================
   START APP
===================================================== */

document.addEventListener(
    'DOMContentLoaded',
    () => {

        App.init();

    }
);
