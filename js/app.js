/* =========================================================
   LosOja - Main Application JavaScript
   js/app.js

   Handles:
   - Main UI
   - Modals
   - Mobile navigation
   - Smooth scrolling
   - Category buttons
   - Mobility buttons
   - Mobility request form
   - Back-to-top button
   - Toast notifications
========================================================= */

(function () {

    "use strict";


    /* =====================================================
       APP OBJECT
    ===================================================== */

    const App = {


        /* =================================================
           INITIALIZATION
        ================================================= */

        init() {

            this.setCurrentYear();

            this.bindModalClosers();

            this.bindMobileMenu();

            this.bindSmoothScroll();

            this.bindLogo();

            this.createBackButton();

            this.bindCategoryButtons();

            this.bindMobilityButtons();

        },


        /* =================================================
           CURRENT YEAR
        ================================================= */

        setCurrentYear() {

            const yearElements =
                document.querySelectorAll("[data-current-year]");

            const currentYear =
                new Date().getFullYear();

            yearElements.forEach(element => {
                element.textContent = currentYear;
            });

            const footerYear =
                document.getElementById("currentYear");

            if (footerYear) {
                footerYear.textContent = currentYear;
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

            logo.addEventListener("click", event => {

                const href =
                    logo.getAttribute("href");

                if (!href || href !== "#home") {
                    return;
                }

                event.preventDefault();

                const home =
                    document.getElementById("home");

                if (home) {

                    home.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });

                }

            });

        },


        /* =================================================
           MODAL HELPERS
        ================================================= */

        openModal(modalId) {

            const modal =
                document.getElementById(modalId);

            if (!modal) {
                return;
            }

            modal.classList.add("active");

            document.body.classList.add("modal-open");

        },


        closeModal(modal) {

            if (!modal) {
                return;
            }

            modal.classList.remove("active");

            if (
                !document.querySelector(".modal.active")
            ) {
                document.body.classList.remove("modal-open");
            }

        },


        closeAllModals() {

            const modals =
                document.querySelectorAll(".modal");

            modals.forEach(modal => {
                modal.classList.remove("active");
            });

            document.body.classList.remove("modal-open");

        },


        /* =================================================
           MODAL CLOSE BUTTONS
        ================================================= */

        bindModalClosers() {

            document.addEventListener("click", event => {

                const closeButton =
                    event.target.closest(".modal-close");

                if (closeButton) {

                    const modal =
                        closeButton.closest(".modal");

                    this.closeModal(modal);

                    return;
                }


                /*
                 * Close when clicking the dark backdrop.
                 */

                if (
                    event.target.classList &&
                    event.target.classList.contains("modal")
                ) {

                    this.closeModal(event.target);

                }

            });

        },


        /* =================================================
           MOBILE MENU
        ================================================= */

        bindMobileMenu() {

            const menuButton =
                document.getElementById("mobileMenuBtn");

            const mobileNav =
                document.getElementById("mobileNav");

            if (!menuButton || !mobileNav) {
                return;
            }


            menuButton.addEventListener("click", () => {

                const isOpen =
                    mobileNav.classList.toggle("active");

                menuButton.setAttribute(
                    "aria-expanded",
                    isOpen ? "true" : "false"
                );

            });


            /*
             * Close mobile menu after clicking a link.
             */

            const links =
                mobileNav.querySelectorAll("a");

            links.forEach(link => {

                link.addEventListener("click", () => {

                    mobileNav.classList.remove("active");

                    menuButton.setAttribute(
                        "aria-expanded",
                        "false"
                    );

                });

            });

        },


        /* =================================================
           SMOOTH SCROLL
        ================================================= */

        bindSmoothScroll() {

            document.addEventListener("click", event => {

                const link =
                    event.target.closest('a[href^="#"]');

                if (!link) {
                    return;
                }


                const href =
                    link.getAttribute("href");

                if (
                    !href ||
                    href === "#" ||
                    href === "#loginModal" ||
                    href === "#signupModal"
                ) {
                    return;
                }


                const target =
                    document.querySelector(href);

                if (!target) {
                    return;
                }


                event.preventDefault();

                target.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            });

        },


        /* =================================================
           CATEGORY BUTTONS
        ================================================= */

        bindCategoryButtons() {

            const categoryButtons =
                document.querySelectorAll(".category-card");

            if (!categoryButtons.length) {
                return;
            }


            categoryButtons.forEach(button => {

                button.addEventListener("click", () => {

                    const category =
                        button.getAttribute("data-category");

                    if (!category) {
                        return;
                    }


                    /*
                     * Put the selected category into
                     * the existing search box.
                     */

                    const searchInput =
                        document.getElementById("searchInput");

                    if (searchInput) {
                        searchInput.value = category;
                    }


                    /*
                     * Clear location so category search
                     * is not accidentally restricted.
                     */

                    const locationInput =
                        document.getElementById("locationInput");

                    if (locationInput) {
                        locationInput.value = "";
                    }


                    /*
                     * Use the existing search form.
                     * This allows businesses.js to handle
                     * the actual business filtering.
                     */

                    const searchForm =
                        document.getElementById("searchForm");

                    if (searchForm) {

                        if (
                            typeof searchForm.requestSubmit ===
                            "function"
                        ) {

                            searchForm.requestSubmit();

                        } else {

                            searchForm.dispatchEvent(
                                new Event("submit", {
                                    bubbles: true,
                                    cancelable: true
                                })
                            );

                        }

                    }


                    /*
                     * Scroll to businesses after
                     * selecting a category.
                     */

                    const businessesSection =
                        document.getElementById("businesses");

                    if (businessesSection) {

                        setTimeout(() => {

                            businessesSection.scrollIntoView({
                                behavior: "smooth",
                                block: "start"
                            });

                        }, 100);

                    }

                });

            });

        },


        /* =================================================
           MOBILITY BUTTONS
        ================================================= */

        bindMobilityButtons() {

            const mobilityButtons =
                document.querySelectorAll(".mobility-btn");

            if (!mobilityButtons.length) {
                return;
            }


            mobilityButtons.forEach(button => {

                button.addEventListener("click", () => {

                    const type =
                        button.getAttribute("data-mobility");

                    if (!type) {
                        return;
                    }

                    this.openMobilityRequest(type);

                });

            });

        },


        /* =================================================
           CREATE MOBILITY MODAL
        ================================================= */

        createMobilityModal() {

            let modal =
                document.getElementById(
                    "mobilityRequestModal"
                );

            if (modal) {
                return modal;
            }


            modal =
                document.createElement("div");

            modal.className = "modal";

            modal.id = "mobilityRequestModal";


            modal.innerHTML = `
                <div class="modal-content large">

                    <button
                        type="button"
                        class="modal-close"
                        aria-label="Close"
                    >
                        ×
                    </button>

                    <h2 id="mobilityRequestTitle">
                        Request Mobility
                    </h2>

                    <p
                        id="mobilityRequestDescription"
                        style="margin-bottom:1.5rem;color:#6b7280;"
                    ></p>

                    <form id="mobilityRequestForm">

                        <input
                            type="hidden"
                            id="mobilityType"
                        >

                        <div class="form-group">

                            <label for="mobilityPickup">
                                Pickup Location *
                            </label>

                            <input
                                type="text"
                                id="mobilityPickup"
                                placeholder="Where should we pick you up?"
                                required
                            >

                        </div>


                        <div class="form-group">

                            <label for="mobilityDestination">
                                Destination *
                            </label>

                            <input
                                type="text"
                                id="mobilityDestination"
                                placeholder="Where are you going?"
                                required
                            >

                        </div>


                        <div class="form-group">

                            <label for="mobilityPhone">
                                Phone Number *
                            </label>

                            <input
                                type="tel"
                                id="mobilityPhone"
                                placeholder="Your phone number"
                                required
                            >

                        </div>


                        <div class="form-group">

                            <label for="mobilityNote">
                                Additional Note
                            </label>

                            <textarea
                                id="mobilityNote"
                                rows="3"
                                placeholder="Any additional information..."
                            ></textarea>

                        </div>


                        <p
                            id="mobilityRequestError"
                            class="form-error hidden"
                        ></p>


                        <button
                            type="submit"
                            class="btn btn-primary form-submit"
                        >
                            Submit Request
                        </button>

                    </form>

                </div>
            `;


            document.body.appendChild(modal);


            /*
             * Close button.
             */

            const closeButton =
                modal.querySelector(".modal-close");

            if (closeButton) {

                closeButton.addEventListener(
                    "click",
                    () => {
                        this.closeModal(modal);
                    }
                );

            }


            /*
             * Close when clicking backdrop.
             */

            modal.addEventListener("click", event => {

                if (event.target === modal) {
                    this.closeModal(modal);
                }

            });


            /*
             * Mobility form.
             */

            const form =
                modal.querySelector(
                    "#mobilityRequestForm"
                );

            if (form) {

                form.addEventListener(
                    "submit",
                    event => {

                        event.preventDefault();

                        this.handleMobilityRequest();

                    }
                );

            }


            return modal;

        },


        /* =================================================
           OPEN MOBILITY REQUEST
        ================================================= */

        openMobilityRequest(type) {

            /*
             * Truck is not connected to a request
             * system yet. Keep the button working
             * without pretending a booking exists.
             */

            if (type === "truck") {

                this.showToast(
                    "Rent a Truck is coming soon.",
                    "info"
                );

                return;

            }


            const modal =
                this.createMobilityModal();

            if (!modal) {
                return;
            }


            const title =
                modal.querySelector(
                    "#mobilityRequestTitle"
                );

            const description =
                modal.querySelector(
                    "#mobilityRequestDescription"
                );

            const typeInput =
                modal.querySelector(
                    "#mobilityType"
                );


            const name =
                this.getMobilityName(type);


            if (title) {
                title.textContent =
                    `${name} Request`;
            }


            if (description) {

                if (type === "trycircle") {

                    description.textContent =
                        "Request a TryCircle ride by entering your pickup and destination.";

                } else if (type === "bike") {

                    description.textContent =
                        "Request a bike ride by entering your pickup and destination.";

                } else if (type === "cab") {

                    description.textContent =
                        "Request a cab by entering your pickup and destination.";

                } else {

                    description.textContent =
                        "Enter your trip details below.";

                }

            }


            if (typeInput) {
                typeInput.value = type;
            }


            /*
             * Clear old error.
             */

            const error =
                modal.querySelector(
                    "#mobilityRequestError"
                );

            if (error) {

                error.textContent = "";

                error.classList.add("hidden");

            }


            this.openModal(
                "mobilityRequestModal"
            );


            /*
             * Focus pickup field.
             */

            setTimeout(() => {

                const pickup =
                    modal.querySelector(
                        "#mobilityPickup"
                    );

                if (pickup) {
                    pickup.focus();
                }

            }, 100);

        },


        /* =================================================
           HANDLE MOBILITY REQUEST
        ================================================= */

        handleMobilityRequest() {

            const modal =
                document.getElementById(
                    "mobilityRequestModal"
                );

            if (!modal) {
                return;
            }


            const type =
                document.getElementById(
                    "mobilityType"
                )?.value || "";


            const pickup =
                document.getElementById(
                    "mobilityPickup"
                )?.value.trim() || "";


            const destination =
                document.getElementById(
                    "mobilityDestination"
                )?.value.trim() || "";


            const phone =
                document.getElementById(
                    "mobilityPhone"
                )?.value.trim() || "";


            const note =
                document.getElementById(
                    "mobilityNote"
                )?.value.trim() || "";


            const error =
                document.getElementById(
                    "mobilityRequestError"
                );


            /*
             * Validation.
             */

            if (
                !type ||
                !pickup ||
                !destination ||
                !phone
            ) {

                this.showMobilityError(
                    "Please fill in all required fields."
                );

                return;

            }


            /*
             * Store the request locally for now.
             *
             * This does NOT claim to be a real booking.
             * It allows the interface to work until
             * a mobility database table is connected.
             */

            try {

                const storageKey =
                    "losoja_mobility_test_requests";

                const existing =
                    JSON.parse(
                        localStorage.getItem(storageKey)
                    ) || [];


                existing.push({

                    id:
                        this.generateId(),

                    type:
                        type,

                    pickup:
                        pickup,

                    destination:
                        destination,

                    phone:
                        phone,

                    note:
                        note,

                    created_at:
                        new Date().toISOString()

                });


                localStorage.setItem(
                    storageKey,
                    JSON.stringify(existing)
                );


            } catch (storageError) {

                console.error(
                    "LosOja mobility storage error:",
                    storageError
                );

            }


            /*
             * Success.
             */

            const form =
                document.getElementById(
                    "mobilityRequestForm"
                );

            if (form) {
                form.reset();
            }


            if (error) {

                error.textContent = "";

                error.classList.add("hidden");

            }


            this.closeModal(modal);


            this.showToast(
                `${this.getMobilityName(type)} request submitted successfully.`,
                "success"
            );

        },


        /* =================================================
           MOBILITY ERROR
        ================================================= */

        showMobilityError(message) {

            const error =
                document.getElementById(
                    "mobilityRequestError"
                );

            if (!error) {
                return;
            }

            error.textContent = message;

            error.classList.remove("hidden");

        },


        /* =================================================
           MOBILITY NAME
        ================================================= */

        getMobilityName(type) {

            const names = {

                trycircle:
                    "TryCircle",

                bike:
                    "Bike",

                cab:
                    "Cab",

                truck:
                    "Rent a Truck"

            };


            return (
                names[type] ||
                "Mobility"
            );

        },


        /* =================================================
           BACK-TO-TOP BUTTON
        ================================================= */

        createBackButton() {

            /*
             * Do not create duplicates.
             */

            if (
                document.getElementById(
                    "losojaBackButton"
                )
            ) {
                return;
            }


            const button =
                document.createElement("button");

            button.type = "button";

            button.id =
                "losojaBackButton";

            button.className =
                "back-to-top";

            button.setAttribute(
                "aria-label",
                "Back to top"
            );

            button.innerHTML =
                "↑";


            /*
             * Basic inline positioning.
             * Existing CSS can override this.
             */

            button.style.position = "fixed";

            button.style.right = "20px";

            button.style.bottom = "20px";

            button.style.zIndex = "999";


            document.body.appendChild(button);


            button.addEventListener(
                "click",
                () => {

                    window.scrollTo({

                        top: 0,

                        behavior: "smooth"

                    });

                }
            );


            const updateVisibility =
                () => {

                    if (window.scrollY > 400) {

                        button.classList.add("show");

                        button.style.display =
                            "flex";

                    } else {

                        button.classList.remove("show");

                        button.style.display =
                            "none";

                    }

                };


            window.addEventListener(
                "scroll",
                updateVisibility,
                { passive: true }
            );


            updateVisibility();

        },


        /* =================================================
           TOAST NOTIFICATION
        ================================================= */

        showToast(message, type = "info") {

            /*
             * Use existing LosOja notification system
             * when available.
             */

            if (
                typeof window.showNotification ===
                "function"
            ) {

                window.showNotification(
                    message,
                    type
                );

                return;

            }


            /*
             * Remove an existing app toast.
             */

            const oldToast =
                document.getElementById(
                    "losojaAppToast"
                );

            if (oldToast) {
                oldToast.remove();
            }


            const toast =
                document.createElement("div");

            toast.id =
                "losojaAppToast";

            toast.textContent =
                message;


            toast.style.position =
                "fixed";

            toast.style.left =
                "50%";

            toast.style.bottom =
                "30px";

            toast.style.transform =
                "translateX(-50%)";

            toast.style.zIndex =
                "10000";

            toast.style.padding =
                "14px 20px";

            toast.style.borderRadius =
                "8px";

            toast.style.background =
                type === "success"
                    ? "#087a3e"
                    : "#374151";

            toast.style.color =
                "#ffffff";

            toast.style.fontWeight =
                "600";

            toast.style.boxShadow =
                "0 8px 25px rgba(0,0,0,0.15)";


            document.body.appendChild(toast);


            setTimeout(() => {

                if (toast) {
                    toast.remove();
                }

            }, 3500);

        },


        /* =================================================
           GENERATE ID
        ================================================= */

        generateId() {

            return (
                Date.now().toString(36) +
                Math.random()
                    .toString(36)
                    .substring(2, 10)
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


            return String(value)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");

        },


        /* =================================================
           FORMAT DATE
        ================================================= */

        formatDate(dateValue) {

            if (!dateValue) {
                return "";
            }


            const date =
                new Date(dateValue);


            if (Number.isNaN(date.getTime())) {
                return "";
            }


            return date.toLocaleDateString(
                "en-NG",
                {
                    year: "numeric",
                    month: "short",
                    day: "numeric"
                }
            );

        }

    };


    /* =====================================================
       START APPLICATION
    ===================================================== */

    document.addEventListener(
        "DOMContentLoaded",
        () => {

            App.init();

        }
    );


    /* =====================================================
       GLOBAL APP ACCESS
    ===================================================== */

    window.App = App;


})();
