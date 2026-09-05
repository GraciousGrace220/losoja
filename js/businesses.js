```javascript
/*
=========================================================
LosOja - Business Management
js/businesses.js

RESPONSIBILITIES:
- Loading businesses from Supabase
- Displaying businesses
- Viewing business details
- Opening/closing business modals
- Connecting the Add Business form to app.js

IMPORTANT:
The actual business SAVE operation is handled by
window.addBusiness() in app.js.

This prevents two different scripts from submitting
the same form at the same time.
=========================================================
*/

(function () {

    "use strict";


    /* =====================================================
       SUPABASE CONFIGURATION
    ===================================================== */

    let losojaBusinessesClient = null;

    const LOSOJA_BUSINESS_SUPABASE_URL =
        "https://ycxshwgeebskdozmornh.supabase.co";

    const LOSOJA_BUSINESS_SUPABASE_KEY =
        "sb_publishable_jFSLacwNupO6T8EnSqb2bw_bZmy7rVe";


    /* =====================================================
       CREATE SUPABASE CLIENT
    ===================================================== */

    function initializeBusinessSupabase() {

        try {

            if (
                window.supabase &&
                typeof window.supabase.createClient === "function"
            ) {

                losojaBusinessesClient =
                    window.supabase.createClient(
                        LOSOJA_BUSINESS_SUPABASE_URL,
                        LOSOJA_BUSINESS_SUPABASE_KEY
                    );

                console.log(
                    "LosOja businesses.js: Supabase client ready."
                );

                return true;
            }

        } catch (error) {

            console.error(
                "LosOja businesses.js: Could not create Supabase client:",
                error
            );

        }

        console.error(
            "LosOja businesses.js: Supabase library is unavailable."
        );

        return false;
    }


    /* =====================================================
       DOM READY
    ===================================================== */

    document.addEventListener(
        "DOMContentLoaded",
        function () {

            initializeBusinessSystem();

        }
    );


    /* =====================================================
       INITIALIZE BUSINESS SYSTEM
    ===================================================== */

    function initializeBusinessSystem() {

        console.log(
            "LosOja businesses.js initialized."
        );

        initializeBusinessSupabase();

        setupAddBusinessButtons();

        setupAddBusinessForm();

        setupModalClosing();

        setupBusinessCards();

        setupViewAllBusinesses();

        loadBusinessesFromSupabase();

    }


    /* =====================================================
       ADD BUSINESS BUTTONS
    ===================================================== */

    function setupAddBusinessButtons() {

        const buttons =
            document.querySelectorAll(
                "#addBusinessBtn, .add-business-btn"
            );


        console.log(
            "LosOja: Add Business buttons found:",
            buttons.length
        );


        buttons.forEach(
            function (button) {

                if (!button) {
                    return;
                }


                if (
                    button.dataset.businessListenerAttached ===
                    "true"
                ) {

                    return;
                }


                button.dataset.businessListenerAttached =
                    "true";


                button.addEventListener(
                    "click",
                    function (event) {

                        event.preventDefault();

                        console.log(
                            "LosOja: Add Business button clicked."
                        );

                        openAddBusinessModal();

                    }
                );

            }
        );

    }


    /* =====================================================
       OPEN ADD BUSINESS MODAL
    ===================================================== */

    function openAddBusinessModal() {

        const modal =
            document.getElementById(
                "addBusinessModal"
            );


        if (!modal) {

            console.error(
                "LosOja: addBusinessModal was not found."
            );

            showNotification(
                "The business form could not be opened.",
                "error"
            );

            return;
        }


        modal.classList.add(
            "active"
        );


        modal.setAttribute(
            "aria-hidden",
            "false"
        );


        document.body.classList.add(
            "modal-open"
        );


        setTimeout(
            function () {

                const nameInput =
                    document.getElementById(
                        "businessName"
                    );


                if (nameInput) {

                    nameInput.focus();

                }

            },
            100
        );

    }


    /* =====================================================
       CLOSE ADD BUSINESS MODAL
    ===================================================== */

    function closeAddBusinessModal() {

        const modal =
            document.getElementById(
                "addBusinessModal"
            );


        if (!modal) {
            return;
        }


        modal.classList.remove(
            "active"
        );


        modal.setAttribute(
            "aria-hidden",
            "true"
        );


        document.body.classList.remove(
            "modal-open"
        );

    }


    /* =====================================================
       MAKE MODAL CLOSE AVAILABLE TO OTHER SCRIPTS
    ===================================================== */

    window.closeAddBusinessModal =
        closeAddBusinessModal;


    /* =====================================================
       MODAL CLOSING
    ===================================================== */

    function setupModalClosing() {

        document
            .querySelectorAll(
                ".modal-close, [data-close-modal]"
            )
            .forEach(
                function (button) {

                    if (
                        button.dataset.closeListenerAttached ===
                        "true"
                    ) {

                        return;
                    }


                    button.dataset.closeListenerAttached =
                        "true";


                    button.addEventListener(
                        "click",
                        function () {

                            const modal =
                                button.closest(
                                    ".modal"
                                );


                            if (modal) {

                                modal.classList.remove(
                                    "active"
                                );


                                modal.setAttribute(
                                    "aria-hidden",
                                    "true"
                                );

                            }


                            document.body.classList.remove(
                                "modal-open"
                            );

                        }
                    );

                }
            );


        document
            .querySelectorAll(
                ".modal-overlay"
            )
            .forEach(
                function (overlay) {

                    if (
                        overlay.dataset.overlayListenerAttached ===
                        "true"
                    ) {

                        return;
                    }


                    overlay.dataset.overlayListenerAttached =
                        "true";


                    overlay.addEventListener(
                        "click",
                        function () {

                            const modal =
                                overlay.closest(
                                    ".modal"
                                );


                            if (modal) {

                                modal.classList.remove(
                                    "active"
                                );


                                modal.setAttribute(
                                    "aria-hidden",
                                    "true"
                                );

                            }


                            document.body.classList.remove(
                                "modal-open"
                            );

                        }
                    );

                }
            );

    }


    /* =====================================================
       ADD BUSINESS FORM
       
       IMPORTANT:
       app.js owns the actual submit operation.

       businesses.js ONLY connects the form to
       window.addBusiness().
    ===================================================== */

    function setupAddBusinessForm() {

        const form =
            document.getElementById(
                "addBusinessForm"
            );


        if (!form) {

            console.error(
                "LosOja: addBusinessForm was not found."
            );

            return;
        }


        /*
         * DO NOT attach another submit handler here.
         *
         * app.js already owns the form submission.
         */

        console.log(
            "LosOja: Add Business form detected."
        );

    }


    /* =====================================================
       LOAD BUSINESSES
    ===================================================== */

    async function loadBusinessesFromSupabase() {

        if (!losojaBusinessesClient) {

            initializeBusinessSupabase();

        }


        if (!losojaBusinessesClient) {

            console.warn(
                "LosOja: Supabase client unavailable."
            );

            return;

        }


        try {

            console.log(
                "LosOja: Loading businesses..."
            );


            const result =
                await losojaBusinessesClient
                    .from("businesses")
                    .select("*");


            if (result.error) {

                console.error(
                    "LosOja: Could not load businesses:",
                    result.error
                );

                return;
            }


            const businesses =
                result.data || [];


            console.log(
                "LosOja: Businesses loaded:",
                businesses.length
            );


            renderBusinesses(
                businesses
            );


        } catch (error) {

            console.error(
                "LosOja: Business loading error:",
                error
            );

        }

    }


    /*
     * IMPORTANT:
     * Make this function available to app.js.
     *
     * app.js tries to call:
     * window.loadBusinessesFromSupabase()
     */

    window.loadBusinessesFromSupabase =
        loadBusinessesFromSupabase;


    /* =====================================================
       RENDER BUSINESSES
    ===================================================== */

    function renderBusinesses(
        businesses
    ) {

        const grid =
            document.getElementById(
                "businessGrid"
            );


        if (!grid) {

            console.warn(
                "LosOja: #businessGrid was not found."
            );

            return;
        }


        grid.innerHTML = "";


        if (!Array.isArray(businesses)) {

            businesses = [];

        }


        if (businesses.length === 0) {

            grid.innerHTML = `
                <div class="no-businesses">
                    <p>No businesses have been added yet.</p>
                </div>
            `;

            return;
        }


        businesses.forEach(
            function (business) {

                const card =
                    createBusinessCard(
                        business
                    );


                grid.appendChild(
                    card
                );

            }
        );


        setupBusinessCards();

    }


    /* =====================================================
       CREATE BUSINESS CARD
    ===================================================== */

    function createBusinessCard(
        business
    ) {

        const article =
            document.createElement(
                "article"
            );


        article.className =
            "business-card";


        article.dataset.category =
            business.category || "";


        article.dataset.location =
            business.location || "";


        article.dataset.name =
            business.name || "";


        const category =
            escapeHtml(
                business.category ||
                "Business"
            );


        const name =
            escapeHtml(
                business.name ||
                "Unnamed Business"
            );


        const location =
            escapeHtml(
                business.location ||
                "Nigeria"
            );


        const description =
            escapeHtml(
                business.description ||
                "Discover this business on LosOja."
            );


        const rating =
            Number(
                business.rating || 0
            );


        const reviews =
            Number(
                business.reviews ||
                business.review_count ||
                0
            );


        article.innerHTML = `

            <div class="business-image">
                🏪
            </div>

            <div class="business-content">

                <div class="business-category">
                    ${category}
                </div>

                <h3>
                    ${name}
                </h3>

                <div class="business-rating">

                    <span class="stars">
                        ★★★★★
                    </span>

                    <span>
                        ${rating.toFixed(1)}
                    </span>

                    <span class="review-count">
                        (${reviews})
                    </span>

                </div>

                <p class="business-location">
                    📍 ${location}
                </p>

                <p class="business-description">
                    ${description}
                </p>

                <button
                    type="button"
                    class="business-link"
                    data-business-id="${escapeAttribute(
                        business.id || ""
                    )}">
                    View Business →
                </button>

            </div>

        `;


        article.businessData =
            business;


        return article;

    }


    /* =====================================================
       BUSINESS CARD BUTTONS
    ===================================================== */

    function setupBusinessCards() {

        const buttons =
            document.querySelectorAll(
                ".business-link"
            );


        buttons.forEach(
            function (button) {

                if (
                    button.dataset.businessListenerAttached ===
                    "true"
                ) {

                    return;
                }


                button.dataset.businessListenerAttached =
                    "true";


                button.addEventListener(
                    "click",
                    function () {

                        const card =
                            button.closest(
                                ".business-card"
                            );


                        if (!card) {
                            return;
                        }


                        if (card.businessData) {

                            showBusinessDetails(
                                card.businessData
                            );

                            return;
                        }


                        const businessName =
                            card.dataset.name ||
                            "Business";


                        showExistingBusinessDetails(
                            card,
                            businessName
                        );

                    }
                );

            }
        );

    }


    /* =====================================================
       EXISTING BUSINESS DETAILS
    ===================================================== */

    function showExistingBusinessDetails(
        card,
        businessName
    ) {

        const category =
            card.dataset.category ||
            "Business";


        const location =
            card.dataset.location ||
            "Nigeria";


        const descriptionElement =
            card.querySelector(
                ".business-description"
            );


        const description =
            descriptionElement
                ? descriptionElement.textContent
                : "Business information available on LosOja.";


        showBusinessDetails({

            name:
                businessName,

            category:
                category,

            location:
                location,

            description:
                description

        });

    }


    /* =====================================================
       BUSINESS DETAILS MODAL
    ===================================================== */

    function showBusinessDetails(
        business
    ) {

        const modal =
            document.getElementById(
                "businessModal"
            );


        if (!modal) {

            console.warn(
                "LosOja: businessModal was not found."
            );

            return;
        }


        const title =
            document.getElementById(
                "businessModalTitle"
            );


        const category =
            document.getElementById(
                "businessModalCategory"
            );


        const location =
            document.getElementById(
                "businessModalLocation"
            );


        const description =
            document.getElementById(
                "businessModalDescription"
            );


        if (title) {

            title.textContent =
                business.name ||
                "Business";

        }


        if (category) {

            category.textContent =
                business.category ||
                "Business";

        }


        if (location) {

            location.textContent =
                "📍 " +
                (
                    business.location ||
                    "Nigeria"
                );

        }


        if (description) {

            description.textContent =
                business.description ||
                "Business information available on LosOja.";

        }


        modal.classList.add(
            "active"
        );


        modal.setAttribute(
            "aria-hidden",
            "false"
        );


        document.body.classList.add(
            "modal-open"
        );

    }


    /* =====================================================
       VIEW ALL BUSINESSES
    ===================================================== */

    function setupViewAllBusinesses() {

        const button =
            document.getElementById(
                "viewAllBusinessesBtn"
            );


        if (!button) {
            return;
        }


        if (
            button.dataset.listenerAttached ===
            "true"
        ) {

            return;
        }


        button.dataset.listenerAttached =
            "true";


        button.addEventListener(
            "click",
            function () {

                const section =
                    document.getElementById(
                        "businesses"
                    );


                if (section) {

                    section.scrollIntoView({
                        behavior: "smooth"
                    });

                }

            }
        );

    }


    /* =====================================================
       NOTIFICATIONS
    ===================================================== */

    function showNotification(
        message,
        type
    ) {

        const notification =
            document.getElementById(
                "notification"
            );


        const messageElement =
            document.getElementById(
                "notificationMessage"
            );


        if (!notification) {

            alert(message);

            return;
        }


        if (messageElement) {

            messageElement.textContent =
                message;

        }


        notification.classList.remove(
            "success",
            "error",
            "active"
        );


        if (type) {

            notification.classList.add(
                type
            );

        }


        notification.classList.add(
            "active"
        );


        clearTimeout(
            notification._hideTimer
        );


        notification._hideTimer =
            setTimeout(
                function () {

                    notification.classList.remove(
                        "active"
                    );

                },
                5000
            );

    }


    /*
     * Make notification available globally.
     * This allows app.js to use the same notification.
     */

    window.showNotification =
        showNotification;


    /* =====================================================
       ESCAPE HTML
    ===================================================== */

    function escapeHtml(
        value
    ) {

        return String(value)
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );

    }


    /* =====================================================
       ESCAPE ATTRIBUTE
    ===================================================== */

    function escapeAttribute(
        value
    ) {

        return String(value)
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            );

    }


    /* =====================================================
       NOTIFICATION CLOSE BUTTON
    ===================================================== */

    document.addEventListener(
        "DOMContentLoaded",
        function () {

            const closeButton =
                document.getElementById(
                    "notificationClose"
                );


            if (!closeButton) {
                return;
            }


            if (
                closeButton.dataset.listenerAttached ===
                "true"
            ) {

                return;
            }


            closeButton.dataset.listenerAttached =
                "true";


            closeButton.addEventListener(
                "click",
                function () {

                    const notification =
                        document.getElementById(
                            "notification"
                        );


                    if (notification) {

                        notification.classList.remove(
                            "active"
                        );

                    }

                }
            );

        }
    );


    /* =====================================================
       ESC KEY
    ===================================================== */

    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key !==
                "Escape"
            ) {

                return;
            }


            document
                .querySelectorAll(
                    ".modal.active"
                )
                .forEach(
                    function (modal) {

                        modal.classList.remove(
                            "active"
                        );


                        modal.setAttribute(
                            "aria-hidden",
                            "true"
                        );

                    }
                );


            document.body.classList.remove(
                "modal-open"
            );

        }
    );

})();
```
