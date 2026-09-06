/*
=========================================================
LosOja - Business Management
js/businesses.js

Supabase version

Handles:
- Loading businesses from Supabase
- Displaying businesses
- Searching/filtering
- Viewing business details
- Adding/saving businesses
- Notifications

Database columns:
- id
- user_id
- name
- category
- location
- description
- phone
- email
- created_at
=========================================================
*/

(function () {

    "use strict";


    /* =====================================================
       SUPABASE CONFIGURATION
    ===================================================== */

    const SUPABASE_URL =
        "https://ycxshwgeebskdozmornh.supabase.co";

    const SUPABASE_KEY =
        "sb_publishable_jFSLacwNupO6T8EnSqb2bw_bZmy7rVe";


    /* =====================================================
       START
    ===================================================== */

    document.addEventListener(
        "DOMContentLoaded",
        function () {

            console.log(
                "LosOja businesses.js initialized."
            );

            setupAddBusinessButton();

            setupAddBusinessForm();

            setupModalClosing();

            setupViewAllBusinesses();

            setupNotificationClose();

            loadBusinessesFromSupabase();

        }
    );


    /* =====================================================
       SUPABASE HEADERS
    ===================================================== */

    function getSupabaseHeaders() {

        const headers = {

            "apikey":
                SUPABASE_KEY,

            "Content-Type":
                "application/json"

        };


        /*
           Get the login session created by auth.js.
        */

        let session = null;

        if (
            typeof window.getSupabaseSession ===
            "function"
        ) {

            session =
                window.getSupabaseSession();

        }


        if (
            session &&
            session.access_token
        ) {

            headers.Authorization =
                "Bearer " +
                session.access_token;

        }


        return headers;

    }


    /* =====================================================
       GET CURRENT SESSION
    ===================================================== */

    function getCurrentSession() {

        if (
            typeof window.getSupabaseSession ===
            "function"
        ) {

            return window.getSupabaseSession();

        }

        return null;

    }


    /* =====================================================
       ADD BUSINESS BUTTON
    ===================================================== */

    function setupAddBusinessButton() {

        const buttons =
            document.querySelectorAll(
                "#addBusinessBtn, .add-business-btn"
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
                    function (event) {

                        event.preventDefault();

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

                const input =
                    document.getElementById(
                        "businessName"
                    );


                if (input) {

                    input.focus();

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
                        button.dataset.modalCloseAttached ===
                        "true"
                    ) {

                        return;

                    }


                    button.dataset.modalCloseAttached =
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
                ".modal"
            )
            .forEach(
                function (modal) {

                    if (
                        modal.dataset.backgroundCloseAttached ===
                        "true"
                    ) {

                        return;

                    }


                    modal.dataset.backgroundCloseAttached =
                        "true";


                    modal.addEventListener(
                        "click",
                        function (event) {

                            if (
                                event.target ===
                                modal
                            ) {

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
            form.dataset.businessSubmitAttached ===
            "true"
        ) {

            return;

        }


        form.dataset.businessSubmitAttached =
            "true";


        form.addEventListener(
            "submit",
            handleAddBusinessSubmit
        );


        console.log(
            "LosOja: Add Business form connected."
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
               GET CURRENT LOGIN SESSION
            --------------------------------------------- */

            const session =
                getCurrentSession();


            console.log(
                "LosOja session:",
                session
                    ? "Session found"
                    : "No session found"
            );


            if (
                !session ||
                !session.access_token ||
                !session.user ||
                !session.user.id
            ) {

                throw new Error(
                    "You must be logged in before adding a business."
                );

            }


            const userId =
                session.user.id;


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


            const description =
                getValue(
                    "businessDescription"
                );


            const phone =
                getValue(
                    "businessPhone"
                );


            const email =
                getValue(
                    "businessEmail"
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
               BUSINESS DATA
            --------------------------------------------- */

            const businessData = {

                user_id:
                    userId,

                name:
                    businessName,

                category:
                    category,

                location:
                    location,

                description:
                    description || null,

                phone:
                    phone || null,

                email:
                    email || null

            };


            console.log(
                "LosOja: submitting business:",
                businessData
            );


            /* ---------------------------------------------
               INSERT INTO SUPABASE
            --------------------------------------------- */

            const response =
                await fetch(
                    SUPABASE_URL +
                    "/rest/v1/businesses",
                    {

                        method:
                            "POST",

                        headers:
                            Object.assign(
                                {},
                                getSupabaseHeaders(),
                                {
                                    "Prefer":
                                        "return=representation"
                                }
                            ),

                        body:
                            JSON.stringify(
                                businessData
                            )

                    }
                );


            /* ---------------------------------------------
               READ RESPONSE
            --------------------------------------------- */

            const responseText =
                await response.text();


            let responseData =
                null;


            try {

                responseData =
                    responseText
                        ? JSON.parse(
                            responseText
                        )
                        : null;

            } catch (parseError) {

                console.warn(
                    "LosOja: Supabase response was not JSON.",
                    responseText
                );

            }


            /* ---------------------------------------------
               CHECK ERROR
            --------------------------------------------- */

            if (!response.ok) {

                console.error(
                    "LosOja Supabase HTTP error:",
                    response.status
                );


                console.error(
                    "LosOja Supabase response:",
                    responseData ||
                    responseText
                );


                let message =
                    "We could not save your business.";


                if (
                    responseData &&
                    responseData.message
                ) {

                    message =
                        responseData.message;

                }
                else if (
                    responseData &&
                    responseData.error_description
                ) {

                    message =
                        responseData.error_description;

                }
                else if (
                    responseData &&
                    responseData.hint
                ) {

                    message =
                        responseData.hint;

                }


                const lowerMessage =
                    String(
                        message
                    ).toLowerCase();


                if (
                    lowerMessage.includes(
                        "row-level security"
                    ) ||
                    lowerMessage.includes(
                        "violates row-level security policy"
                    )
                ) {

                    message =
                        "Supabase is blocking this business submission because of the database security policy.";

                }


                else if (
                    lowerMessage.includes(
                        "jwt"
                    ) ||
                    lowerMessage.includes(
                        "token"
                    ) ||
                    response.status === 401
                ) {

                    message =
                        "Your login session has expired. Please log in again.";

                }


                else if (
                    response.status === 403
                ) {

                    message =
                        "Supabase denied permission to add this business.";

                }


                else if (
                    lowerMessage.includes(
                        "column"
                    )
                ) {

                    message =
                        "The business information does not match the Supabase database columns.";

                }


                throw new Error(
                    message
                );

            }


            /* ---------------------------------------------
               SUCCESS
            --------------------------------------------- */

            console.log(
                "LosOja: BUSINESS SAVED SUCCESSFULLY!",
                responseData
            );


            showNotification(
                "Your business has been added successfully!",
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


        }
        catch (error) {

            console.error(
                "LosOja: FAILED TO SAVE BUSINESS:",
                error
            );


            showNotification(
                error.message ||
                "We could not save your business.",
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

        console.log(
            "LosOja: loading businesses from Supabase..."
        );


        try {

            const response =
                await fetch(
                    SUPABASE_URL +
                    "/rest/v1/businesses?select=*",
                    {

                        method:
                            "GET",

                        headers:
                            getSupabaseHeaders()

                    }
                );


            const responseText =
                await response.text();


            let responseData =
                null;


            try {

                responseData =
                    responseText
                        ? JSON.parse(
                            responseText
                        )
                        : [];

            }
            catch (error) {

                console.error(
                    "LosOja: Could not parse businesses response.",
                    responseText
                );

                return;

            }


            if (!response.ok) {

                console.error(
                    "LosOja: could not load businesses:",
                    response.status,
                    responseData
                );

                return;

            }


            const businesses =
                Array.isArray(
                    responseData
                )
                    ? responseData
                    : [];


            console.log(
                "LosOja: businesses loaded:",
                businesses.length
            );


            renderBusinesses(
                businesses
            );


        }
        catch (error) {

            console.error(
                "LosOja: business loading error:",
                error
            );

        }

    }


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
                "LosOja: businessGrid was not found."
            );

            return;

        }


        grid.innerHTML = "";


        if (
            !businesses ||
            businesses.length === 0
        ) {

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


                        if (
                            card.businessData
                        ) {

                            showBusinessDetails(
                                card.businessData
                            );

                        }

                    }
                );

            }
        );

    }


    /* =====================================================
       BUSINESS DETAILS
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
            button.dataset.viewAllAttached ===
            "true"
        ) {

            return;

        }


        button.dataset.viewAllAttached =
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
       NOTIFICATION
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

            alert(
                message
            );

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


    window.showBusinessNotification =
        showNotification;


    /* =====================================================
       NOTIFICATION CLOSE
    ===================================================== */

    function setupNotificationClose() {

        const closeButton =
            document.getElementById(
                "notificationClose"
            );


        if (!closeButton) {
            return;
        }


        if (
            closeButton.dataset.notificationCloseAttached ===
            "true"
        ) {

            return;

        }


        closeButton.dataset.notificationCloseAttached =
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
