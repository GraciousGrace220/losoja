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
                typeof modalId === "string"
                    ? document.getElementById(modalId)
                    : modalId;

            if (!modal) {

                console.error(
                    "LosOja: Modal not found:",
                    modalId
                );

                return;
            }

            modal.classList.remove("hidden");

            modal.classList.add("active");

            modal.style.display = "flex";

            document.body.classList.add("modal-open");

        },


        closeModal(modal) {

            if (typeof modal === "string") {

                modal =
                    document.getElementById(modal);

            }

            if (!modal || !modal.classList) {

                console.warn(
                    "LosOja: Invalid modal passed to closeModal:",
                    modal
                );

                return;
            }

            modal.classList.remove("active");

            modal.classList.add("hidden");

            modal.style.display = "none";


            const activeModal =
                document.querySelector(
                    ".modal-overlay.active, .modal.active"
                );

            if (!activeModal) {

                document.body.classList.remove(
                    "modal-open"
                );

            }

        },


        closeAllModals() {

            const modals =
                document.querySelectorAll(
                    ".modal-overlay, .modal"
                );

            modals.forEach(modal => {

                modal.classList.remove("active");

                modal.classList.add("hidden");

                modal.style.display = "none";

            });

            document.body.classList.remove(
                "modal-open"
            );

        },


        /* =================================================
           MODAL CLOSE BUTTONS
        ================================================= */

        bindModalClosers() {

            document.addEventListener(
                "click",
                event => {

                    const closeButton =
                        event.target.closest(
                            ".modal-close"
                        );

                    if (closeButton) {

                        const modal =
                            closeButton.closest(
                                ".modal-overlay, .modal"
                            );

                        this.closeModal(modal);

                        return;

                    }


                    /*
                     * Close when clicking the dark backdrop.
                     */

                    const clickedModal =
                        event.target.closest(
                            ".modal-overlay, .modal"
                        );

                    if (
                        clickedModal &&
                        event.target === clickedModal
                    ) {

                        this.closeModal(
                            clickedModal
                        );

                    }

                }
            );

        },


        /* =================================================
           MOBILE MENU
        ================================================= */

        bindMobileMenu() {

            const menuButton =
                document.getElementById(
                    "mobileMenuBtn"
                );

            const mobileNav =
                document.getElementById(
                    "mobileNav"
                );

            if (!menuButton || !mobileNav) {
                return;
            }

            menuButton.addEventListener(
                "click",
                () => {

                    const isOpen =
                        mobileNav.classList.toggle(
                            "active"
                        );

                    menuButton.setAttribute(
                        "aria-expanded",
                        isOpen
                            ? "true"
                            : "false"
                    );

                }
            );


            const links =
                mobileNav.querySelectorAll("a");

            links.forEach(link => {

                link.addEventListener(
                    "click",
                    () => {

                        mobileNav.classList.remove(
                            "active"
                        );

                        menuButton.setAttribute(
                            "aria-expanded",
                            "false"
                        );

                    }
                );

            });

        },


        /* =================================================
           SMOOTH SCROLL
        ================================================= */

        bindSmoothScroll() {

            document.addEventListener(
                "click",
                event => {

                    const link =
                        event.target.closest(
                            'a[href^="#"]'
                        );

                    if (!link) {
                        return;
                    }

                    const href =
                        link.getAttribute("href");

                    if (
                        !href ||
                        href === "#"
                    ) {
                        return;
                    }

                    let target = null;

                    try {

                        target =
                            document.querySelector(
                                href
                            );

                    } catch (error) {

                        return;

                    }

                    if (!target) {
                        return;
                    }

                    event.preventDefault();

                    target.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });

                }
            );

        },


        /* =================================================
           CATEGORY BUTTONS
        ================================================= */

        bindCategoryButtons() {

            const categoryButtons =
                document.querySelectorAll(
                    ".category-card[data-category]"
                );

            if (!categoryButtons.length) {
                return;
            }

            categoryButtons.forEach(button => {

                if (
                    button.dataset
                        .losojaCategoryReady ===
                    "true"
                ) {
                    return;
                }

                button.dataset
                    .losojaCategoryReady =
                    "true";

                button.addEventListener(
                    "click",
                    event => {

                        event.preventDefault();

                        const category =
                            (
                                button.getAttribute(
                                    "data-category"
                                ) || ""
                            ).trim();

                        if (!category) {
                            return;
                        }

                        categoryButtons.forEach(
                            card => {

                                card.classList.remove(
                                    "active"
                                );

                            }
                        );

                        button.classList.add(
                            "active"
                        );


                        if (
                            window.LosOjaBusinesses &&
                            typeof
                                window
                                    .LosOjaBusinesses
                                    .filterByCategory ===
                                "function"
                        ) {

                            window
                                .LosOjaBusinesses
                                .filterByCategory(
                                    category
                                );

                        } else if (
                            typeof
                                window.filterBusinesses ===
                            "function"
                        ) {

                            window.filterBusinesses(
                                category
                            );

                        } else {

                            console.error(
                                "LosOja: Business filtering system is not available."
                            );

                            this.showToast(
                                "Businesses are still loading. Please try again.",
                                "info"
                            );

                            return;

                        }


                        const searchInput =
                            document.getElementById(
                                "searchInput"
                            );

                        if (searchInput) {

                            searchInput.value =
                                category;

                        }


                        const locationInput =
                            document.getElementById(
                                "locationInput"
                            );

                        if (locationInput) {

                            locationInput.value =
                                "";

                        }


                        const businessesSection =
                            document.getElementById(
                                "businesses"
                            );

                        if (businessesSection) {

                            setTimeout(
                                () => {

                                    businessesSection
                                        .scrollIntoView({
                                            behavior:
                                                "smooth",
                                            block:
                                                "start"
                                        });

                                },
                                50
                            );

                        }

                    }
                );

            });

        },


        /* =================================================
           MOBILITY BUTTONS
        ================================================= */

        bindMobilityButtons() {

            const mobilityButtons =
                document.querySelectorAll(
                    ".mobility-btn"
                );

            if (!mobilityButtons.length) {
                return;
            }

            mobilityButtons.forEach(button => {

                if (
                    button.dataset
                        .losojaMobilityReady ===
                    "true"
                ) {
                    return;
                }

                button.dataset
                    .losojaMobilityReady =
                    "true";

                button.addEventListener(
                    "click",
                    () => {

                        const type =
                            button.getAttribute(
                                "data-mobility"
                            );

                        if (!type) {
                            return;
                        }

                        this.openMobilityRequest(
                            type
                        );

                    }
                );

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
                document.createElement(
                    "div"
                );

            modal.className =
                "modal-overlay hidden";

            modal.id =
                "mobilityRequestModal";


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


            document.body.appendChild(
                modal
            );


            const closeButton =
                modal.querySelector(
                    ".modal-close"
                );


            if (closeButton) {

                closeButton.addEventListener(
                    "click",
                    () => {

                        this.closeModal(
                            modal
                        );

                    }
                );

            }


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

            const modal =
                this.createMobilityModal();

            const title =
                document.getElementById(
                    "mobilityRequestTitle"
                );

            const description =
                document.getElementById(
                    "mobilityRequestDescription"
                );

            const mobilityType =
                document.getElementById(
                    "mobilityType"
                );

            const pickup =
                document.getElementById(
                    "mobilityPickup"
                );

            const destination =
                document.getElementById(
                    "mobilityDestination"
                );

            const phone =
                document.getElementById(
                    "mobilityPhone"
                );

            const note =
                document.getElementById(
                    "mobilityNote"
                );

            const error =
                document.getElementById(
                    "mobilityRequestError"
                );


            const labels = {

                trycircle: {
                    title: "Request TryCircle Ride",
                    description:
                        "Request a TryCircle ride for convenient local transportation."
                },

                bike: {
                    title: "Request Bike Ride",
                    description:
                        "Find or request bike transportation around your area."
                },

                cab: {
                    title: "Request Cab",
