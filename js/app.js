/**
 * =========================================================
 * LosOja - Main App
 * Professional UI / Navigation / Modals / Back Button
 * Mobility Request Interface
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

            /*
             * Mobility
             */
            this.bindMobilityButtons();

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

        },


        /* =================================================
           MOBILITY
        ================================================= */

        bindMobilityButtons() {

            const buttons =
                document.querySelectorAll(".mobility-btn");

            if (!buttons.length) {
                return;
            }

            buttons.forEach(function (button) {

                button.addEventListener(
                    "click",
                    function (event) {

                        event.preventDefault();

                        const type =
                            button.getAttribute(
                                "data-mobility"
                            );

                        App.openMobilityRequest(type);

                    }
                );

            });

        },


        /* =================================================
           MOBILITY REQUEST MODAL
        ================================================= */

        createMobilityModal() {

            /*
             * Do not create the modal more than once.
             */
            if (
                document.getElementById(
                    "mobilityRequestModal"
                )
            ) {
                return;
            }


            const modal =
                document.createElement("div");

            modal.id =
                "mobilityRequestModal";

            modal.className =
                "modal";


            modal.innerHTML = `
                <div
                    class="modal-content"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="mobilityRequestTitle"
                >

                    <button
                        type="button"
                        class="modal-close"
                        aria-label="Close"
                    >
                        ×
                    </button>

                    <div class="modal-header">

                        <h2 id="mobilityRequestTitle">
                            Request a Ride
                        </h2>

                        <p id="mobilityRequestSubtitle">
                            Tell us where you want to go.
                        </p>

                    </div>


                    <form
                        id="mobilityRequestForm"
                        novalidate
                    >

                        <input
                            type="hidden"
                            id="mobilityType"
                            name="mobilityType"
                        >


                        <div class="form-group">

                            <label for="mobilityPickup">
                                Pickup Location
                            </label>

                            <input
                                type="text"
                                id="mobilityPickup"
                                name="pickup"
                                placeholder="Where should we pick you up?"
                                autocomplete="street-address"
                                required
                            >

                        </div>


                        <div class="form-group">

                            <label for="mobilityDestination">
                                Destination
                            </label>

                            <input
                                type="text"
                                id="mobilityDestination"
                                name="destination"
                                placeholder="Where are you going?"
                                autocomplete="street-address"
                                required
                            >

                        </div>


                        <div class="form-group">

                            <label for="mobilityPhone">
                                Phone Number
                            </label>

                            <input
                                type="tel"
                                id="mobilityPhone"
                                name="phone"
                                placeholder="Your phone number"
                                autocomplete="tel"
                                required
                            >

                        </div>


                        <div class="form-group">

                            <label for="mobilityNote">
                                Additional Note
                                <span>(optional)</span>
                            </label>

                            <textarea
                                id="mobilityNote"
                                name="note"
                                rows="3"
                                placeholder="Anything the driver should know?"
                            ></textarea>

                        </div>


                        <div
                            id="mobilityRequestError"
                            class="form-error hidden"
                            role="alert"
                        ></div>


                        <button
                            type="submit"
                            class="btn btn-primary"
                        >
                            Continue Request
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
                    function () {

                        App.closeModal(
                            "mobilityRequestModal"
                        );

                    }
                );

            }


            /*
             * Close when clicking outside modal content.
             */
            modal.addEventListener(
                "click",
                function (event) {

                    if (event.target === modal) {

                        App.closeModal(
                            "mobilityRequestModal"
                        );

                    }

                }
            );


            /*
             * Form submission.
             */
            const form =
                document.getElementById(
                    "mobilityRequestForm"
                );

            if (form) {

                form.addEventListener(
                    "submit",
                    function (event) {

                        event.preventDefault();

                        App.handleMobilityRequest();

                    }
                );

            }

        },


        /* =================================================
           OPEN MOBILITY REQUEST
        ================================================= */

        openMobilityRequest(type) {

            const validTypes = [
                "trycircle",
                "bike",
                "cab"
            ];

            /*
             * Rent a Truck is intentionally not activated
             * yet. We will build it separately.
             */
            if (
                !validTypes.includes(type)
            ) {

                if (type === "truck") {

                    this.showToast(
                        "Rent a Truck is coming soon."
                    );

                }

                return;

            }


            this.createMobilityModal();


            const title =
                document.getElementById(
                    "mobilityRequestTitle"
                );

            const subtitle =
                document.getElementById(
                    "mobilityRequestSubtitle"
                );

            const typeInput =
                document.getElementById(
                    "mobilityType"
                );


            const config = {

                trycircle: {
                    title: "TryCircle",
                    subtitle:
                        "Request a TryCircle ride."
                },

                bike: {
                    title: "Request a Bike",
                    subtitle:
                        "Request a bike ride from your pickup location."
                },

                cab: {
                    title: "Request a Cab",
                    subtitle:
                        "Request a cab from your pickup location."
                }

            };


            const selected =
                config[type] || config.trycircle;


            if (title) {
                title.textContent =
                    selected.title;
            }

            if (subtitle) {
                subtitle.textContent =
                    selected.subtitle;
            }

            if (typeInput) {
                typeInput.value =
                    type;
            }


            /*
             * Clear previous form state.
             */
            const form =
                document.getElementById(
                    "mobilityRequestForm"
                );

            if (form) {

                form.reset();

                /*
                 * reset() clears the hidden field,
                 * so restore it.
                 */
                if (typeInput) {
                    typeInput.value =
                        type;
                }

            }


            const error =
                document.getElementById(
                    "mobilityRequestError"
                );

            if (error) {

                error.textContent = "";

                error.classList.add("hidden");

            }


            this.openModal(
                "mobilityRequestModal"
            );

        },


        /* =================================================
           HANDLE MOBILITY REQUEST
        ================================================= */

        handleMobilityRequest() {

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
            if (!type) {

                this.showMobilityError(
                    "Please select a mobility service.",
                    error
                );

                return;

            }


            if (!pickup) {

                this.showMobilityError(
                    "Please enter your pickup location.",
                    error
                );

                return;

            }


            if (!destination) {

                this.showMobilityError(
                    "Please enter your destination.",
                    error
                );

                return;

            }


            if (!phone) {

                this.showMobilityError(
                    "Please enter your phone number.",
                    error
                );

                return;

            }


            /*
             * At this stage we deliberately do not send
             * anything to Supabase.
             *
             * We will connect this to the proper
             * mobility_requests table after confirming
             * the database structure.
             */
            const request = {

                id: this.generateId(),

                type: type,

                pickup: pickup,

                destination: destination,

                phone: phone,

                note: note,

                created_at:
                    new Date().toISOString()

            };


            /*
             * Keep the request in browser memory/storage
             * temporarily so the interface can be tested
             * without creating an incorrect database record.
             */
            try {

                const existing =
                    JSON.parse(
                        localStorage.getItem(
                            "losoja_mobility_test_requests"
                        )
                    ) || [];


                existing.push(request);


                localStorage.setItem(
                    "losoja_mobility_test_requests",
                    JSON.stringify(existing)
                );

            } catch (storageError) {

                console.warn(
                    "LosOja: Could not save temporary mobility request.",
                    storageError
                );

            }


            this.closeModal(
                "mobilityRequestModal"
            );


            this.showToast(
                "Your " +
                this.getMobilityName(type) +
                " request has been received.",
                4000
            );


            console.log(
                "LosOja Mobility Request:",
                request
            );

        },


        /* =================================================
           MOBILITY ERROR
        ================================================= */

        showMobilityError(message, element) {

            if (!element) {
                return;
            }

            element.textContent =
                message;

            element.classList.remove(
                "hidden"
            );

        },


        /* =================================================
           MOBILITY NAME
        ================================================= */

        getMobilityName(type) {

            switch (type) {

                case "trycircle":
                    return "TryCircle";

                case "bike":
                    return "Bike";

                case "cab":
                    return "Cab";

                case "truck":
                    return "Truck";

                default:
                    return "Mobility";

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
