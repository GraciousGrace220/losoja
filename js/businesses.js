```javascript
/*
=========================================================
LosOja - Business Management
js/businesses.js

Handles:
- Loading businesses from Supabase
- Displaying businesses
- Viewing business details
- Adding/saving businesses
- Notifications
=========================================================
*/

(function () {

    "use strict";


    /* =====================================================
       SUPABASE CONFIGURATION
       
       IMPORTANT:
       We use UNIQUE variable names here so this file does
       not conflict with app.js.
    ===================================================== */

    let losojaBusinessesClient = null;

    const LOSOJA_BUSINESS_SUPABASE_URL =
        "https://ycxshwgeebskdozmornh.supabase.co";

    const LOSOJA_BUSINESS_SUPABASE_KEY =
        "sb_publishable_jFSLacwNupO6T8EnSqb2bw_bZmy7rVe";


    /* =====================================================
       CREATE BUSINESS SUPABASE CLIENT
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
       INITIALIZE
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
       
       Works with:
       #addBusinessBtn
       .add-business-btn
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


        if (
            form.dataset.submitListenerAttached ===
            "true"
        ) {

            return;

        }


        form.dataset.submitListenerAttached =
            "true";


        form.addEventListener(
            "submit",
            handleAddBusinessSubmit
        );


        console.log(
            "LosOja: Add Business form listener attached."
        );

    }


    /* =====================================================
       SAVE BUSINESS
    ===================================================== */

    async function handleAddBusinessSubmit(event) {

        event.preventDefault();


        const form =
            event.currentTarget;


        if (!form.checkValidity()) {

            form.reportValidity();

            return;

        }


        const submitButton =
            form.querySelector(
                'button[type="submit"]'
            );


        const originalButtonText =
            submitButton
                ? submitButton.textContent
                : "Add Business";


        try {

            if (submitButton) {

                submitButton.disabled =
                    true;

                submitButton.textContent =
                    "Saving...";

            }


            /* ---------------------------------------------
               GET FORM VALUES
            --------------------------------------------- */

            const businessName =
                getValue(
                    "businessName"
                );


            const category =
                getValue(
                    "businessCategory"
                );


            const location =
                getValue(
                    "businessLocation"
                );


            /* ---------------------------------------------
               VALIDATION
            --------------------------------------------- */

            if (!businessName) {

                throw new Error(
                    "Please enter your business name."
                );

            }


            if (!category) {

                throw new Error(
                    "Please select a business category."
                );

            }


            if (!location) {

                throw new Error(
                    "Please enter your business location."
                );

            }


            /* ---------------------------------------------
               CHECK SUPABASE
            --------------------------------------------- */

            if (!losojaBusinessesClient) {

                initializeBusinessSupabase();

            }


            if (!losojaBusinessesClient) {

                throw new Error(
                    "Supabase is not connected."
                );

            }


            /* ---------------------------------------------
               BUSINESS DATA
               
               Only use the columns currently confirmed
               in the businesses table.
            --------------------------------------------- */

            const businessData = {

                name:
                    businessName,

                category:
                    category,

                location:
                    location

            };


            console.log(
                "LosOja: Saving business:",
                businessData
            );


            /* ---------------------------------------------
               INSERT
            --------------------------------------------- */

            const result =
                await losojaBusinessesClient
                    .from("businesses")
                    .insert(
                        businessData
                    );


            /* ---------------------------------------------
               CHECK ERROR
            --------------------------------------------- */

            if (result.error) {

                console.error(
                    "LosOja Supabase INSERT ERROR:",
                    result.error
                );

                throw result.error;

            }


            /* ---------------------------------------------
               SUCCESS
            --------------------------------------------- */

            console.log(
                "LosOja: BUSINESS SAVED SUCCESSFULLY!"
            );


            showNotification(
                "Your business has been submitted successfully!",
                "success"
            );


            form.reset();


            setTimeout(
                function () {

                    closeAddBusinessModal();

                },
                700
            );


            setTimeout(
                function () {

                    loadBusinessesFromSupabase();

                },
                900
            );


        } catch (error) {

            console.error(
                "LosOja: FAILED TO SAVE BUSINESS:",
                error
            );


            let errorMessage =
                "We could not save your business.";


            if (
                error &&
                error.message
            ) {

                errorMessage =
                    error.message;

            }


            const lowerMessage =
                errorMessage.toLowerCase();


            if (
                lowerMessage.includes(
                    "row-level security"
                ) ||
                lowerMessage.includes(
                    "violates row-level security policy"
                )
            ) {

                errorMessage =
                    "Supabase is blocking new business submissions. The database security policy needs to allow business submissions.";

            }


            else if (
                lowerMessage.includes(
                    "permission denied"
                )
            ) {

                errorMessage =
                    "Supabase denied permission to add this business.";

            }


            else if (
                lowerMessage.includes(
                    "column"
                ) &&
                lowerMessage.includes(
                    "does not exist"
                )
            ) {

                errorMessage =
                    "The business information does not match the businesses table.";

            }


            showNotification(
                errorMessage,
                "error"
            );

        }


        finally {

            if (submitButton) {

                submitButton.disabled =
                    false;

                submitButton.textContent =
                    originalButtonText;

            }

        }

    }


    /* =====================================================
       GET FORM VALUE
    ===================================================== */

    function getValue(id) {

        const element =
            document.getElementById(
                id
            );


        if (!element) {

            console.warn(
                "LosOja: form field not found:",
                id
            );

            return "";

        }


        return String(
            element.value || ""
        ).trim();

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

            const result =
                await losojaBusinessesClient
                    .from("businesses")
                    .select("*");


            if (result.error) {

                console.error(
                    "LosOja: could not load businesses:",
                    result.error
                );

                return;

            }


            const businesses =
                result.data || [];


            console.log(
                "LosOja: businesses loaded:",
                businesses.length
            );


            renderBusinesses(
                businesses
            );


        } catch (error) {

            console.error(
                "LosOja: business loading error:",
                error
            );

        }

    }


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
            return;
        }


        grid.innerHTML = "";


        if (!Array.isArray(businesses)) {
            businesses = [];
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
                        0.0
                    </span>

                    <span class="review-count">
                        (0)
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
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
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
