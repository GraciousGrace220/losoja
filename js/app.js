/**
 * =========================================================
 * LosOja - Main App
 * Professional UI / Navigation / Modals / Back Button
 * =========================================================
 */

(function () {

    "use strict";


    const App = {

        /* =================================================
           INITIALIZE
        ================================================= */

        init() {

            this.setCurrentYear();
            this.bindModalClosers();
            this.bindMobileMenu();
            this.bindSmoothScroll();
            this.bindLogo();
            this.createBackButton();

            console.log("LosOja: App initialized.");

        },


        /* =================================================
           CURRENT YEAR
        ================================================= */

        setCurrentYear() {

            const year =
                document.getElementById("currentYear");

            if (year) {
                year.textContent =
                    new Date().getFullYear();
            }

        },


        /* =================================================
           LOGO
        ================================================= */

        bindLogo() {

            const logo =
                document.querySelector(".logo");

            if (!logo) {
                return;
            }

            logo.addEventListener("click", function (event) {

                event.preventDefault();

                if (
                    typeof window.Dashboard !== "undefined" &&
                    typeof window.Dashboard.hide === "function"
                ) {
                    window.Dashboard.hide();
                }

                const home =
                    document.getElementById("home");

                if (home) {

                    home.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });

                } else {

                    window.scrollTo({
                        top: 0,
                        behavior: "smooth"
                    });

                }

            });

        },


        /* =================================================
           MODALS
        ================================================= */

        openModal(id) {

            if (!id) {
                return;
            }

            this.closeAllModals();

            const modal =
                document.getElementById(id);

            if (!modal) {

                console.error(
                    "LosOja: Modal not found:",
                    id
                );

                return;
            }

            modal.classList.add("active");
            modal.classList.add("open");

            document.body.style.overflow = "hidden";

        },


        closeModal(id) {

            const modal =
                document.getElementById(id);

            if (!modal) {
                return;
            }

            modal.classList.remove("active");
            modal.classList.remove("open");

            document.body.style.overflow = "";

        },


        closeAllModals() {

            document
                .querySelectorAll(".modal")
                .forEach(function (modal) {

                    modal.classList.remove("active");
                    modal.classList.remove("open");

                });

            document.body.style.overflow = "";

        },


        /* =================================================
           MODAL CLOSE BUTTONS
        ================================================= */

        bindModalClosers() {

            document
                .querySelectorAll(".modal-close")
                .forEach(function (button) {

                    button.addEventListener(
                        "click",
                        function () {

                            const modal =
                                button.closest(".modal");

                            if (modal) {

                                modal.classList.remove("active");
                                modal.classList.remove("open");

                            }

                            document.body.style.overflow = "";

                        }
                    );

                });


            document
                .querySelectorAll(".modal")
                .forEach(function (modal) {

                    modal.addEventListener(
                        "click",
                        function (event) {

                            if (event.target === modal) {

                                modal.classList.remove("active");
                                modal.classList.remove("open");

                                document.body.style.overflow = "";

                            }

                        }
                    );

                });


            document.addEventListener(
                "keydown",
                function (event) {

                    if (event.key === "Escape") {

                        App.closeAllModals();

                    }

                }
            );

        },


        /* =================================================
           MOBILE MENU
        ================================================= */

        bindMobileMenu() {

            const button =
                document.getElementById("mobileMenuBtn");

            const nav =
                document.getElementById("mobileNav");

            if (!button || !nav) {
                return;
            }

            button.setAttribute(
                "aria-expanded",
                "false"
            );


            button.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    const isOpen =
                        nav.classList.toggle("open");

                    button.setAttribute(
                        "aria-expanded",
                        isOpen ? "true" : "false"
                    );

                }
            );


            nav.querySelectorAll("a")
                .forEach(function (link) {

                    link.addEventListener(
                        "click",
                        function () {

                            nav.classList.remove("open");

                            button.setAttribute(
                                "aria-expanded",
                                "false"
                            );

                        }
                    );

                });

        },


        /* =================================================
           SMOOTH NAVIGATION
        ================================================= */

        bindSmoothScroll() {

            document
                .querySelectorAll('a[href^="#"]')
                .forEach(function (anchor) {

                    anchor.addEventListener(
                        "click",
                        function (event) {

                            const targetId =
                                anchor.getAttribute("href");

                            if (
                                !targetId ||
                                targetId === "#"
                            ) {
                                return;
                            }

                            /*
                             * Dashboard is handled by dashboard.js.
                             */
                            if (targetId === "#dashboard") {
                                return;
                            }

                            const target =
                                document.querySelector(targetId);

                            if (!target) {
                                return;
                            }

                            event.preventDefault();

                            if (
                                typeof window.Dashboard !== "undefined" &&
                                typeof window.Dashboard.hide === "function"
                            ) {
                                window.Dashboard.hide();
                            }

                            target.scrollIntoView({
                                behavior: "smooth",
                                block: "start"
                            });

                        }
                    );

                });

        },


        /* =================================================
           PROFESSIONAL BACK BUTTON
        ================================================= */

        createBackButton() {

            /*
             * Do not create duplicates.
             */
            if (
                document.getElementById("losojaBackButton")
            ) {
                return;
            }


            const button =
                document.createElement("button");

            button.type = "button";
            button.id = "losojaBackButton";
            button.className = "losoja-back-btn";
            button.innerHTML =
                '<span aria-hidden="true">←</span> Back';
            button.setAttribute(
                "aria-label",
                "Go back"
            );


            /*
             * Put the button at the top of the page.
             */
            const header =
                document.querySelector(".site-header");

            if (header && header.parentNode) {

                header.parentNode.insertBefore(
                    button,
                    header.nextSibling
                );

            } else {

                document.body.prepend(button);

            }


            button.addEventListener(
                "click",
                function () {

                    /*
                     * Close an open modal first.
                     */
                    const openModal =
                        document.querySelector(
                            ".modal.active, .modal.open"
                        );

                    if (openModal) {

                        App.closeModal(openModal.id);

                        return;

                    }


                    /*
                     * If dashboard is visible,
                     * return to the main site.
                     */
                    const dashboard =
                        document.getElementById("dashboard");

                    if (
                        dashboard &&
                        !dashboard.classList.contains("hidden")
                    ) {

                        if (
                            typeof window.Dashboard !== "undefined" &&
                            typeof window.Dashboard.hide === "function"
                        ) {

                            window.Dashboard.hide();

                        }

                        const home =
                            document.getElementById("home");

                        if (home) {

                            home.scrollIntoView({
                                behavior: "smooth",
                                block: "start"
                            });

                        }

                        return;

                    }


                    /*
                     * Normal browser history.
                     */
                    if (window.history.length > 1) {

                        window.history.back();

                    } else {

                        const home =
                            document.getElementById("home");

                        if (home) {

                            home.scrollIntoView({
                                behavior: "smooth",
                                block: "start"
                            });

                        } else {

                            window.scrollTo({
                                top: 0,
                                behavior: "smooth"
                            });

                        }

                    }

                }
            );

        },


        /* =================================================
           TOAST
        ================================================= */

        showToast(message, duration) {

            const toast =
                document.getElementById("toast");

            if (!toast) {
                return;
            }

            if (
                typeof duration !== "number"
            ) {
                duration = 3000;
            }

            toast.textContent =
                message || "";

            toast.classList.remove("hidden");
            toast.classList.add("show");


            clearTimeout(this._toastTimer);


            this._toastTimer =
                setTimeout(
                    function () {

                        toast.classList.add("hidden");
                        toast.classList.remove("show");

                    },
                    duration
                );

        },


        /* =================================================
           GENERATE ID
        ================================================= */

        generateId() {

            return (
                "id_" +
                Date.now().toString(36) +
                "_" +
                Math.random()
                    .toString(36)
                    .substring(2, 9)
            );

        },


        /* =================================================
           ESCAPE HTML
        ================================================= */

        escapeHtml(value) {

            if (
                value === null ||
                value === undefined
            ) {
                return "";
            }

            const div =
                document.createElement("div");

            div.textContent =
                String(value);

            return div.innerHTML;

        },


        /* =================================================
           FORMAT DATE
        ================================================= */

        formatDate(iso) {

            if (!iso) {
                return "";
            }

            try {

                return new Date(iso)
                    .toLocaleDateString(
                        "en-NG",
                        {
                            year: "numeric",
                            month: "short",
                            day: "numeric"
                        }
                    );

            } catch (error) {

                return "";

            }

        }

    };


    /* =====================================================
       GLOBAL COMPATIBILITY
    ===================================================== */

    window.App = App;


    window.openModal = function (id) {

        App.openModal(id);

    };


    window.closeModal = function (id) {

        App.closeModal(id);

    };


    window.showNotification = function (message) {

        App.showToast(message);

    };


    /* =====================================================
       START APPLICATION
    ===================================================== */

    if (
        document.readyState === "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            function () {

                App.init();

            },
            {
                once: true
            }
        );

    } else {

        App.init();

    }

})();
