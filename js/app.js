/* =========================================================
   LosOja - Main Application JavaScript
   js/app.js

   Handles:
   - Main UI
   - Modals
   - Mobile navigation
   - Smooth scrolling
   - Search helpers
   - Category buttons
   - Business buttons
   - Mobility / TryCircle / Bike / Cab
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

            this.bindSearch();

            this.bindPopularSearches();

            this.bindCategoryButtons();

            this.bindBusinessButtons();

            this.bindAddBusinessButtons();

            this.bindMobilityButtons();

            this.createBackButton();

        },


        /* =================================================
           CURRENT YEAR
        ================================================= */

        setCurrentYear() {

            const currentYear =
                new Date().getFullYear();

            document
                .querySelectorAll("[data-current-year]")
                .forEach(element => {
                    element.textContent = currentYear;
                });

            const footerYear =
                document.getElementById("currentYear");

            if (footerYear) {
                footerYear.textContent = currentYear;
            }

        },


        /* =================================================
           MODALS
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

            document.body.classList.add(
                "modal-open"
            );

        },


        closeModal(modal) {

            if (typeof modal === "string") {
                modal =
                    document.getElementById(modal);
            }

            if (!modal || !modal.classList) {
                return;
            }

            modal.classList.remove("active");

            modal.classList.add("hidden");

            modal.style.display = "none";

            const anotherOpenModal =
                document.querySelector(
                    ".modal-overlay.active, .modal.active"
                );

            if (!anotherOpenModal) {

                document.body.classList.remove(
                    "modal-open"
                );

            }

        },


        closeAllModals() {

            document
                .querySelectorAll(
                    ".modal-overlay, .modal"
                )
                .forEach(modal => {

                    modal.classList.remove(
                        "active"
                    );

                    modal.classList.add(
                        "hidden"
                    );

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


            document.addEventListener(
                "keydown",
                event => {

                    if (event.key === "Escape") {
                        this.closeAllModals();
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


            mobileNav
                .querySelectorAll("a, button")
                .forEach(element => {

                    element.addEventListener(
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
           LOGO
        ================================================= */

        bindLogo() {

            const logo =
                document.querySelector(".logo");

            if (!logo) {
                return;
            }

            logo.addEventListener(
                "click",
                event => {

                    const href =
                        logo.getAttribute("href");

                    if (href !== "#home") {
                        return;
                    }

                    const home =
                        document.getElementById(
                            "home"
                        );

                    if (!home) {
                        return;
                    }

                    event.preventDefault();

                    home.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });

                }
            );

        },


        /* =================================================
           SEARCH
        ================================================= */

        bindSearch() {

            const searchForm =
                document.getElementById(
                    "searchForm"
                );

            if (!searchForm) {
                return;
            }

            searchForm.addEventListener(
                "submit",
                event => {

                    event.preventDefault();

                    const searchInput =
                        document.getElementById(
                            "searchInput"
                        );

                    const locationInput =
                        document.getElementById(
                            "locationInput"
                        );

                    const search =
                        searchInput
                            ? searchInput.value.trim()
                            : "";

                    const location =
                        locationInput
                            ? locationInput.value.trim()
                            : "";


                    if (
                        typeof window.searchBusinesses ===
                        "function"
                    ) {

                        window.searchBusinesses(
                            search,
                            location
                        );

                    } else {

                        this.showToast(
                            "Search is still loading. Please try again.",
                            "info"
                        );

                    }

                }
            );

        },


        /* =================================================
           POPULAR SEARCHES
        ================================================= */

        bindPopularSearches() {

            document
                .querySelectorAll("[data-search]")
                .forEach(button => {

                    button.addEventListener(
                        "click",
                        event => {

                            event.preventDefault();

                            const term =
                                button.getAttribute(
                                    "data-search"
                                );

                            if (!term) {
                                return;
                            }

                            const searchInput =
                                document.getElementById(
                                    "searchInput"
                                );

                            if (searchInput) {
                                searchInput.value =
                                    term;
                            }

                            if (
                                typeof window.searchBusinesses ===
                                "function"
                            ) {

                                window.searchBusinesses(
                                    term,
                                    ""
                                );

                            }

                        }
                    );

                });

        },


        /* =================================================
           CATEGORY BUTTONS
        ================================================= */

        bindCategoryButtons() {

            document
                .querySelectorAll(
                    ".category-card[data-category]"
                )
                .forEach(button => {

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


                            document
                                .querySelectorAll(
                                    ".category-card[data-category]"
                                )
                                .forEach(card => {

                                    card.classList.remove(
                                        "active"
                                    );

                                });


                            button.classList.add(
                                "active"
                            );


                            if (
                                window.LosOjaBusinesses &&
                                typeof window
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
                                typeof window
                                    .filterBusinessesByCategory ===
                                "function"
                            ) {

                                window
                                    .filterBusinessesByCategory(
                                        category
                                    );

                            } else if (
                                typeof window
                                    .filterBusinesses ===
                                "function"
                            ) {

                                window
                                    .filterBusinesses(
                                        category
                                    );

                            } else {

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


                            const businesses =
                                document.getElementById(
                                    "businesses"
                                );

                            if (businesses) {

                                setTimeout(
                                    () => {

                                        businesses.scrollIntoView({
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
           BUSINESS BUTTONS
        ================================================= */

        bindBusinessButtons() {

            document.addEventListener(
                "click",
                event => {

                    const button =
                        event.target.closest(
                            "[data-business-id]"
                        );

                    if (!button) {
                        return;
                    }

                    const businessId =
                        button.getAttribute(
                            "data-business-id"
                        );

                    if (
                        businessId &&
                        typeof window.openBusiness ===
                        "function"
                    ) {

                        window.openBusiness(
                            businessId
                        );

                    }

                }
            );

        },


        /* =================================================
           ADD BUSINESS
        ================================================= */

        bindAddBusinessButtons() {

            document
                .querySelectorAll(
                    "#addBusinessBtn, .add-business-btn"
                )
                .forEach(button => {

                    button.addEventListener(
                        "click",
                        event => {

                            event.preventDefault();

                            this.openModal(
                                "addBusinessModal"
                            );

                        }
                    );

                });

        },


        /* =================================================
           MOBILITY BUTTONS
        ================================================= */

        bindMobilityButtons() {

            document
                .querySelectorAll(
                    ".mobility-btn"
                )
                .forEach(button => {

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
                        event => {

                            event.preventDefault();

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
                    >×</button>

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
                        this.closeModal(modal);
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
                    description:
                        "Request a cab for convenient local transportation."
                }

            };


            const selected =
                labels[type] ||
                {
                    title: "Request Mobility",
                    description:
                        "Submit a mobility request."
                };


            if (title) {
                title.textContent =
                    selected.title;
            }

            if (description) {
                description.textContent =
                    selected.description;
            }

            if (mobilityType) {
                mobilityType.value =
                    type;
            }

            if (error) {
                error.textContent = "";
                error.classList.add("hidden");
            }

            if (pickup) {
                pickup.value = "";
            }

            if (destination) {
                destination.value = "";
            }

            if (phone) {
                phone.value = "";
            }

            if (note) {
                note.value = "";
            }


            this.openModal(modal);

        },


        /* =================================================
           HANDLE MOBILITY REQUEST
        ================================================= */

        async handleMobilityRequest() {

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

            if (!pickup || !destination || !phone) {

                if (error) {

                    error.textContent =
                        "Please complete all required fields.";

                    error.classList.remove(
                        "hidden"
                    );

                }

                return;
            }


            /*
             * If a future mobility backend exists,
             * use it here.
             */

            if (
                typeof window.submitMobilityRequest ===
                "function"
            ) {

                try {

                    await window.submitMobilityRequest({
                        type,
                        pickup,
                        destination,
                        phone,
                        note
                    });

                    this.closeModal(
                        "mobilityRequestModal"
                    );

                    this.showToast(
                        "Your mobility request has been submitted.",
                        "success"
                    );

                    return;

                } catch (requestError) {

                    console.error(
                        "LosOja mobility request error:",
                        requestError
                    );

                    if (error) {

                        error.textContent =
                            "Unable to submit the request right now. Please try again.";

                        error.classList.remove(
                            "hidden"
                        );

                    }

                    return;

                }

            }


            /*
             * Temporary front-end fallback.
             * This keeps the form working until the
             * mobility backend is connected.
             */

            try {

                const requests =
                    JSON.parse(
                        localStorage.getItem(
                            "losoja_mobility_requests"
                        ) || "[]"
                    );

                requests.push({
                    id:
                        Date.now().toString(),
                    type,
                    pickup,
                    destination,
                    phone,
                    note,
                    createdAt:
                        new Date().toISOString()
                });

                localStorage.setItem(
                    "losoja_mobility_requests",
                    JSON.stringify(requests)
                );


                this.closeModal(
                    "mobilityRequestModal"
                );

                this.showToast(
                    "Your mobility request has been received.",
                    "success"
                );

            } catch (storageError) {

                console.error(
                    "LosOja mobility storage error:",
                    storageError
                );

                if (error) {

                    error.textContent =
                        "Unable to save your request. Please try again.";

                    error.classList.remove(
                        "hidden"
                    );

                }

            }

        },


        /* =================================================
           BACK TO TOP
        ================================================= */

        createBackButton() {

            if (
                document.getElementById(
                    "losojaBackToTop"
                )
            ) {
                return;
            }


            const button =
                document.createElement(
                    "button"
                );

            button.type = "button";

            button.id =
                "losojaBackToTop";

            button.setAttribute(
                "aria-label",
                "Back to top"
            );

            button.textContent = "↑";

            button.style.position =
                "fixed";

            button.style.right =
                "20px";

            button.style.bottom =
                "20px";

            button.style.zIndex =
                "999";

            button.style.display =
                "none";

            button.style.cursor =
                "pointer";


            document.body.appendChild(
                button
            );


            button.addEventListener(
                "click",
                () => {

                    window.scrollTo({
                        top: 0,
                        behavior: "smooth"
                    });

                }
            );


            window.addEventListener(
                "scroll",
                () => {

                    button.style.display =
                        window.scrollY > 400
                            ? "block"
                            : "none";

                }
            );

        },


        /* =================================================
           TOAST / NOTIFICATION
        ================================================= */

        showToast(message, type = "info") {

            let notification =
                document.getElementById(
                    "notification"
                );

            if (!notification) {

                notification =
                    document.createElement(
                        "div"
                    );

                notification.id =
                    "notification";

                notification.className =
                    "notification";

                document.body.appendChild(
                    notification
                );

            }

            notification.textContent =
                String(message || "");

            notification.dataset.type =
                type;

            notification.classList.add(
                "show"
            );

            clearTimeout(
                notification._losojaTimer
            );

            notification._losojaTimer =
                setTimeout(
                    () => {

                        notification.classList.remove(
                            "show"
                        );

                    },
                    3000
                );

        }

    };


    /* =====================================================
       PUBLIC API
    ===================================================== */

    window.App = App;


    window.openModal =
        function (modalId) {
            App.openModal(modalId);
        };


    window.closeModal =
        function (modalId) {
            App.closeModal(modalId);
        };


    window.showNotification =
        function (message, type) {
            App.showToast(
                message,
                type
            );
        };


    /* =====================================================
       START APPLICATION
    ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            () => App.init()
        );

    } else {

        App.init();

    }

})();
