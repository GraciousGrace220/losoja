/*
=========================================================
LosOja - Business Management
js/businesses.js

Handles:
- Loading businesses from Supabase
- Displaying businesses
- Viewing business details
- Adding businesses
- Editing businesses
- Deleting businesses
- Searching businesses
- JWT refresh + automatic retry
=========================================================
*/

(function () {

    "use strict";


    /* =====================================================
       SUPABASE CONFIGURATION
    ===================================================== */

    const LOSOJA_BUSINESSES_URL =
        "https://ycxshwgeebskdozmornh.supabase.co";

    const LOSOJA_BUSINESSES_KEY =
        "sb_publishable_jFSLacwNupO6T8EnSqb2bw_bZmy7rVe";

    const BUSINESS_CACHE_KEY =
        "losoja_businesses_cache";


    console.log(
        "Losoja businesses.js initialized."
    );


    /* =====================================================
       SESSION HELPERS
    ===================================================== */

    function getSessionSafe() {

        try {

            if (
                typeof window.getSupabaseSession ===
                "function"
            ) {

                return window.getSupabaseSession();
            }


            const raw =
                localStorage.getItem(
                    "losoja_supabase_session"
                );


            if (!raw) {
                return null;
            }


            return JSON.parse(raw);

        } catch (error) {

            console.error(
                "LosOja: Could not read session:",
                error
            );

            return null;
        }
    }


    function getCurrentUserSafe() {

        if (
            typeof window.getCurrentUser ===
            "function"
        ) {

            return window.getCurrentUser();
        }


        const session =
            getSessionSafe();


        return session?.user || null;
    }


    function getAccessTokenSafe() {

        if (
            typeof window.getSupabaseAccessToken ===
            "function"
        ) {

            return window.getSupabaseAccessToken();
        }


        const session =
            getSessionSafe();


        return (
            session?.access_token ||
            session?.accessToken ||
            null
        );
    }


    /* =====================================================
       SUPABASE HEADERS
    ===================================================== */

    function supabaseHeaders(
        accessToken,
        extraHeaders
    ) {

        const headers = {

            "apikey":
                LOSOJA_BUSINESSES_KEY,

            "Content-Type":
                "application/json",

            "Accept":
                "application/json"
        };


        if (accessToken) {

            headers["Authorization"] =
                "Bearer " + accessToken;
        }


        if (extraHeaders) {

            Object.assign(
                headers,
                extraHeaders
            );
        }


        return headers;
    }


    /* =====================================================
       RESPONSE ERROR
    ===================================================== */

    async function getResponseError(response) {

        let data = null;


        try {

            data =
                await response.json();

        } catch (error) {

            return (
                response.statusText ||
                "Request failed."
            );
        }


        return (
            data?.message ||
            data?.msg ||
            data?.error_description ||
            data?.error ||
            "Request failed."
        );
    }


    /* =====================================================
       HTML ESCAPE
    ===================================================== */

    function escapeHTML(value) {

        const div =
            document.createElement(
                "div"
            );


        div.textContent =
            String(value ?? "");


        return div.innerHTML;
    }


    /* =====================================================
       NOTIFICATION
    ===================================================== */

    function notify(
        message,
        type
    ) {

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


        if (
            window.App &&
            typeof App.showToast ===
            "function"
        ) {

            App.showToast(
                message
            );

            return;
        }


        console.log(
            message
        );
    }


    /* =====================================================
       ERROR HELPERS
    ===================================================== */

    function clearError(
        elementId
    ) {

        const element =
            document.getElementById(
                elementId
            );


        if (!element) {
            return;
        }


        element.textContent =
            "";


        element.classList.add(
            "hidden"
        );
    }


    function showError(
        elementId,
        message
    ) {

        const element =
            document.getElementById(
                elementId
            );


        if (!element) {
            return;
        }


        element.textContent =
            message ||
            "Something went wrong.";


        element.classList.remove(
            "hidden"
        );
    }


    /* =====================================================
       MODAL HELPERS
    ===================================================== */

    function openModalSafe(
        modalId
    ) {

        if (
            window.App &&
            typeof App.openModal ===
            "function"
        ) {

            App.openModal(
                modalId
            );

            return;
        }


        const modal =
            document.getElementById(
                modalId
            );


        if (!modal) {
            return;
        }


        modal.classList.add(
            "active"
        );

        modal.classList.add(
            "open"
        );
    }


    function closeModalSafe(
        modalId
    ) {

        if (
            window.App &&
            typeof App.closeModal ===
            "function"
        ) {

            App.closeModal(
                modalId
            );

            return;
        }


        const modal =
            document.getElementById(
                modalId
            );


        if (!modal) {
            return;
        }


        modal.classList.remove(
            "active"
        );

        modal.classList.remove(
            "open"
        );
    }


    /* =====================================================
       CACHE
    ===================================================== */

    function saveBusinessesCache(
        businesses
    ) {

        try {

            localStorage.setItem(
                BUSINESS_CACHE_KEY,
                JSON.stringify(
                    businesses || []
                )
            );

        } catch (error) {

            console.warn(
                "LosOja: Could not save business cache.",
                error
            );
        }
    }


    function getBusinessesCache() {

        try {

            const raw =
                localStorage.getItem(
                    BUSINESS_CACHE_KEY
                );


            if (!raw) {
                return [];
            }


            const data =
                JSON.parse(raw);


            return Array.isArray(data)
                ? data
                : [];

        } catch (error) {

            return [];
        }
    }


    /* =====================================================
       BUSINESS DATA
    ===================================================== */

    let allBusinesses = [];


    /* =====================================================
       LOAD BUSINESSES
    ===================================================== */

    async function loadBusinesses() {

        const grid =
            document.getElementById(
                "businessesGrid"
            );


        try {

            const response =
                await fetch(
                    LOSOJA_BUSINESSES_URL +
                    "/rest/v1/businesses?select=*&order=created_at.desc",
                    {
                        method: "GET",

                        headers:
                            supabaseHeaders()
                    }
                );


            if (!response.ok) {

                throw new Error(
                    await getResponseError(
                        response
                    )
                );
            }


            const businesses =
                await response.json();


            allBusinesses =
                Array.isArray(businesses)
                    ? businesses
                    : [];


            saveBusinessesCache(
                allBusinesses
            );


            console.log(
                "Businesses loaded:",
                allBusinesses.length
            );


            renderBusinesses(
                allBusinesses
            );


            return allBusinesses;


        } catch (error) {

            console.error(
                "LosOja: Could not load businesses:",
                error
            );


            const cached =
                getBusinessesCache();


            if (cached.length) {

                allBusinesses =
                    cached;


                renderBusinesses(
                    allBusinesses
                );

            } else if (grid) {

                grid.innerHTML = `
                    <div class="empty-state">
                        <p>Businesses are still loading.</p>
                    </div>
                `;
            }


            return [];
        }
    }


    /* =====================================================
       GET BUSINESSES
    ===================================================== */

    function getBusinesses() {

        return allBusinesses;
    }


    /* =====================================================
       BUSINESS CARD
    ===================================================== */

    function businessCard(
        business
    ) {

        const user =
            getCurrentUserSafe();


        const currentUserId =
            user?.id || null;


        const isOwner =
            Boolean(
                currentUserId &&
                business.user_id &&
                currentUserId ===
                    business.user_id
            );


        const name =
            escapeHTML(
                business.name ||
                "Unnamed Business"
            );


        const category =
            escapeHTML(
                business.category ||
                "Business"
            );


        const location =
            escapeHTML(
                business.location ||
                "Nigeria"
            );


        const description =
            escapeHTML(
                business.description ||
                "No description provided."
            );


        const phone =
            escapeHTML(
                business.phone ||
                ""
            );


        const id =
            escapeHTML(
                business.id
            );


        return `
            <article
                class="business-card"
                data-business-id="${id}"
            >

                <div class="business-card-content">

                    <div class="business-card-category">
                        ${category}
                    </div>

                    <h3>
                        ${name}
                    </h3>

                    <p class="business-location">
                        📍 ${location}
                    </p>

                    <p class="business-description">
                        ${description}
                    </p>

                    ${
                        phone
                            ? `
                                <p class="business-phone">
                                    📞 ${phone}
                                </p>
                            `
                            : ""
                    }

                    <div class="business-card-actions">

                        <button
                            type="button"
                            class="btn btn-primary"
                            onclick="openBusiness('${id}')"
                        >
                            View Details
                        </button>

                        ${
                            isOwner
                                ? `
                                    <button
                                        type="button"
                                        class="btn btn-outline"
                                        onclick="openEditBusiness('${id}')"
                                    >
                                        Edit
                                    </button>

                                    <button
                                        type="button"
                                        class="btn btn-danger"
                                        onclick="deleteBusiness('${id}')"
                                    >
                                        Delete
                                    </button>
                                `
                                : ""
                        }

                    </div>

                </div>

            </article>
        `;
    }


    /* =====================================================
       RENDER BUSINESSES
    ===================================================== */

    function renderBusinesses(
        businesses
    ) {

        const grid =
            document.getElementById(
                "businessesGrid"
            );


        if (!grid) {

            console.error(
                "LosOja: businessesGrid element was not found."
            );

            return;
        }


        if (
            !Array.isArray(businesses) ||
            businesses.length === 0
        ) {

            grid.innerHTML = `
                <div class="empty-state">
                    <p>
                        No businesses found.
                        Try a different search or add a business!
                    </p>
                </div>
            `;

            return;
        }


        grid.innerHTML =
            businesses
                .map(businessCard)
                .join("");
    }


    /* =====================================================
       VIEW BUSINESS DETAILS
    ===================================================== */

    window.openBusiness =
        function (businessId) {

            console.log(
                "Opening business:",
                businessId
            );


            const business =
                allBusinesses.find(
                    function (item) {

                        return (
                            String(item.id) ===
                            String(businessId)
                        );
                    }
                );


            if (!business) {

                console.error(
                    "LosOja: Business not found:",
                    businessId
                );

                return;
            }


            const modal =
                document.getElementById(
                    "businessDetailsModal"
                );


            const details =
                document.getElementById(
                    "businessDetails"
                );


            if (!modal || !details) {

                console.error(
                    "LosOja: Business details modal elements not found."
                );

                return;
            }


            const name =
                escapeHTML(
                    business.name ||
                    "Unnamed Business"
                );


            const category =
                escapeHTML(
                    business.category ||
                    "Business"
                );


            const location =
                escapeHTML(
                    business.location ||
                    "Nigeria"
                );


            const description =
                escapeHTML(
                    business.description ||
                    "No description provided."
                );


            const phone =
                escapeHTML(
                    business.phone ||
                    ""
                );


            details.innerHTML = `

                <div class="business-details-content">

                    <span class="business-card-category">
                        ${category}
                    </span>

                    <h2>
                        ${name}
                    </h2>

                    <p>
                        <strong>Location:</strong>
                        ${location}
                    </p>

                    ${
                        phone
                            ? `
                                <p>
                                    <strong>Phone:</strong>
                                    ${phone}
                                </p>
                            `
                            : ""
                    }

                    <div class="business-details-description">

                        <h3>
                            About this business
                        </h3>

                        <p>
                            ${description}
                        </p>

                    </div>

                </div>

            `;


            modal.classList.add(
                "active"
            );

            modal.classList.add(
                "open"
            );


            console.log(
                "Business details opened successfully."
            );
        };


    /* =====================================================
       CLEAR ADD BUSINESS FORM
    ===================================================== */

    window.clearAddBusinessForm =
        function () {

            const form =
                document.getElementById(
                    "addBusinessForm"
                );


            if (form) {
                form.reset();
            }


            clearError(
                "addBusinessError"
            );
        };


    /* =====================================================
       ADD BUSINESS BUTTONS
    ===================================================== */

    function setupAddBusinessButtons() {

        /*
        IMPORTANT:
        The actual LosOja HTML uses the
        .add-business-btn class.

        We also keep the older selectors so
        existing buttons continue to work.
        */
const buttons =
    document.querySelectorAll(
        '.add-business-btn, [data-open-add-business], #addBusinessBtn, #addBusinessNavBtn'
    );


        console.log(
            "LosOja: Add Business buttons found:",
            buttons.length
        );


        buttons.forEach(
            function (button) {

                /*
                Prevent attaching the same handler twice.
                */

                if (
                    button.dataset.losojaAddBusinessBound ===
                    "true"
                ) {
                    return;
                }


                button.dataset.losojaAddBusinessBound =
                    "true";


                button.addEventListener(
                    "click",
                    function (event) {

                        event.preventDefault();


                        console.log(
                            "LosOja: Add Business button clicked."
                        );


                        clearError(
                            "addBusinessError"
                        );


                        openModalSafe(
                            "addBusinessModal"
                        );

                    }
                );
            }
        );
    }


    /* =====================================================
       SAVE BUSINESS REQUEST
    ===================================================== */

    async function sendBusinessInsert(
        business,
        accessToken
    ) {

        return fetch(
            LOSOJA_BUSINESSES_URL +
            "/rest/v1/businesses",
            {
                method: "POST",

                headers:
                    supabaseHeaders(
                        accessToken,
                        {
                            "Prefer":
                                "return=representation"
                        }
                    ),

                body:
                    JSON.stringify(
                        business
                    )
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

            console.warn(
                "LosOja: addBusinessForm was not found."
            );

            return;
        }


        /*
        Prevent duplicate submit handlers.
        */

        if (
            form.dataset.losojaSubmitBound ===
            "true"
        ) {

            return;
        }


        form.dataset.losojaSubmitBound =
            "true";


        console.log(
            "LosOja: Add Business form handler attached."
        );


        form.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                clearError(
                    "addBusinessError"
                );


                const user =
                    getCurrentUserSafe();


                if (!user || !user.id) {

                    showError(
                        "addBusinessError",
                        "Please log in before adding a business."
                    );

                    return;
                }


                let accessToken =
                    getAccessTokenSafe();


                if (!accessToken) {

                    showError(
                        "addBusinessError",
                        "Your login session has expired. Please log in again."
                    );

                    return;
                }


                const name =
                    document.getElementById(
                        "businessName"
                    )?.value.trim();


                const category =
                    document.getElementById(
                        "businessCategory"
                    )?.value.trim();


                const location =
                    document.getElementById(
                        "businessLocation"
                    )?.value.trim();


                const description =
                    document.getElementById(
                        "businessDescription"
                    )?.value.trim() ||
                    null;


                const phone =
                    document.getElementById(
                        "businessPhone"
                    )?.value.trim() ||
                    null;


                if (!name) {

                    showError(
                        "addBusinessError",
                        "Please enter the business name."
                    );

                    return;
                }


                if (!category) {

                    showError(
                        "addBusinessError",
                        "Please enter the business category."
                    );

                    return;
                }


                if (!location) {

                    showError(
                        "addBusinessError",
                        "Please enter the business location."
                    );

                    return;
                }


                const business = {

                    user_id:
                        user.id,

                    name:
                        name,

                    category:
                        category,

                    location:
                        location,

                    description:
                        description,

                    phone:
                        phone
                };


                const submitButton =
                    form.querySelector(
                        'button[type="submit"]'
                    );


                if (submitButton) {

                    submitButton.disabled =
                        true;

                    submitButton.textContent =
                        "Saving...";
                }


                try {

                    /*
                    -------------------------------------------------
                    FIRST ATTEMPT
                    -------------------------------------------------
                    */

                    let response =
                        await sendBusinessInsert(
                            business,
                            accessToken
                        );


                    /*
                    -------------------------------------------------
                    JWT EXPIRED
                    -------------------------------------------------
                    */

                    if (
                        response.status ===
                        401
                    ) {

                        console.warn(
                            "LosOja: Business save received 401. Refreshing session..."
                        );


                        let refreshResult =
                            null;


                        if (
                            typeof window.refreshSupabaseSession ===
                            "function"
                        ) {

                            refreshResult =
                                await window.refreshSupabaseSession();
                        }


                        if (
                            !refreshResult ||
                            !refreshResult.success
                        ) {

                            throw new Error(
                                "Your login session has expired. Please log in again."
                            );
                        }


                        accessToken =
                            getAccessTokenSafe();


                        if (!accessToken) {

                            throw new Error(
                                "Could not refresh your login session."
                            );
                        }


                        console.log(
                            "LosOja: Retrying business save with refreshed token..."
                        );


                        response =
                            await sendBusinessInsert(
                                business,
                                accessToken
                            );
                    }


                    /*
                    -------------------------------------------------
                    CHECK FINAL RESPONSE
                    -------------------------------------------------
                    */

                    if (!response.ok) {

                        const errorMessage =
                            await getResponseError(
                                response
                            );


                        throw new Error(
                            errorMessage
                        );
                    }


                    const savedBusiness =
                        await response.json();


                    console.log(
                        "LosOja: Business saved successfully:",
                        savedBusiness
                    );


                    /*
                    -------------------------------------------------
                    UPDATE LOCAL BUSINESS LIST
                    -------------------------------------------------
                    */

                    const newBusinesses =
                        Array.isArray(
                            savedBusiness
                        )
                            ? savedBusiness
                            : [savedBusiness];


                    allBusinesses =
                        [
                            ...newBusinesses,
                            ...allBusinesses
                        ];


                    saveBusinessesCache(
                        allBusinesses
                    );


                    renderBusinesses(
                        allBusinesses
                    );


                    /*
                    -------------------------------------------------
                    CLEAR FORM
                    -------------------------------------------------
                    */

                    form.reset();


                    clearError(
                        "addBusinessError"
                    );


                    closeModalSafe(
                        "addBusinessModal"
                    );


                    notify(
                        "Business added successfully!",
                        "success"
                    );


                    /*
                    -------------------------------------------------
                    Reload from Supabase.
                    -------------------------------------------------
                    */

                    await loadBusinesses();


                } catch (error) {

                    console.error(
                        "Business save error:",
                        error
                    );


                    showError(
                        "addBusinessError",
                        error.message ||
                        "Business could not be saved."
                    );


                    notify(
                        "Business could not be saved: " +
                        (
                            error.message ||
                            "Unknown error"
                        ),
                        "error"
                    );


                } finally {

                    if (submitButton) {

                        submitButton.disabled =
                            false;

                        submitButton.textContent =
                            "Add Business";
                    }
                }

            }
        );
    }


    /* =====================================================
       OPEN EDIT BUSINESS
    ===================================================== */

    window.openEditBusiness =
        function (businessId) {

            const business =
                allBusinesses.find(
                    function (item) {

                        return (
                            String(item.id) ===
                            String(businessId)
                        );
                    }
                );


            if (!business) {

                notify(
                    "Business could not be found.",
                    "error"
                );

                return;
            }


            const idField =
                document.getElementById(
                    "editBusinessId"
                );


            const nameField =
                document.getElementById(
                    "editBusinessName"
                );


            const categoryField =
                document.getElementById(
                    "editBusinessCategory"
                );


            const locationField =
                document.getElementById(
                    "editBusinessLocation"
                );


            const descriptionField =
                document.getElementById(
                    "editBusinessDescription"
                );


            const phoneField =
                document.getElementById(
                    "editBusinessPhone"
                );


            if (idField) {
                idField.value =
                    business.id || "";
            }


            if (nameField) {
                nameField.value =
                    business.name || "";
            }


            if (categoryField) {
                categoryField.value =
                    business.category || "";
            }


            if (locationField) {
                locationField.value =
                    business.location || "";
            }


            if (descriptionField) {
                descriptionField.value =
                    business.description || "";
            }


            if (phoneField) {
                phoneField.value =
                    business.phone || "";
            }


            clearError(
                "editBusinessError"
            );


            openModalSafe(
                "editBusinessModal"
            );
        };


    /* =====================================================
       EDIT BUSINESS REQUEST
    ===================================================== */

    async function sendBusinessUpdate(
        businessId,
        business,
        accessToken
    ) {

        return fetch(
            LOSOJA_BUSINESSES_URL +
            "/rest/v1/businesses?id=eq." +
            encodeURIComponent(
                businessId
            ),
            {
                method: "PATCH",

                headers:
                    supabaseHeaders(
                        accessToken,
                        {
                            "Prefer":
                                "return=representation"
                        }
                    ),

                body:
                    JSON.stringify(
                        business
                    )
            }
        );
    }


    /* =====================================================
       EDIT BUSINESS FORM
    ===================================================== */

    function setupEditBusinessForm() {

        const form =
            document.getElementById(
                "editBusinessForm"
            );


        if (!form) {
            return;
        }


        if (
            form.dataset.losojaSubmitBound ===
            "true"
        ) {

            return;
        }


        form.dataset.losojaSubmitBound =
            "true";


        form.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                clearError(
                    "editBusinessError"
                );


                const user =
                    getCurrentUserSafe();


                if (!user || !user.id) {

                    showError(
                        "editBusinessError",
                        "Please log in first."
                    );

                    return;
                }


                let accessToken =
                    getAccessTokenSafe();


                if (!accessToken) {

                    showError(
                        "editBusinessError",
                        "Your login session has expired. Please log in again."
                    );

                    return;
                }


                const id =
                    document.getElementById(
                        "editBusinessId"
                    )?.value;


                const business = {

                    name:
                        document.getElementById(
                            "editBusinessName"
                        )?.value.trim(),

                    category:
                        document.getElementById(
                            "editBusinessCategory"
                        )?.value.trim(),

                    location:
                        document.getElementById(
                            "editBusinessLocation"
                        )?.value.trim(),

                    description:
                        document.getElementById(
                            "editBusinessDescription"
                        )?.value.trim() ||
                        null,

                    phone:
                        document.getElementById(
                            "editBusinessPhone"
                        )?.value.trim() ||
                        null
                };


                if (!id) {

                    showError(
                        "editBusinessError",
                        "Business ID is missing."
                    );

                    return;
                }


                if (!business.name) {

                    showError(
                        "editBusinessError",
                        "Please enter the business name."
                    );

                    return;
                }


                if (!business.category) {

                    showError(
                        "editBusinessError",
                        "Please enter the business category."
                    );

                    return;
                }


                if (!business.location) {

                    showError(
                        "editBusinessError",
                        "Please enter the business location."
                    );

                    return;
                }


                const submitButton =
                    form.querySelector(
                        'button[type="submit"]'
                    );


                if (submitButton) {

                    submitButton.disabled =
                        true;

                    submitButton.textContent =
                        "Saving...";
                }


                try {

                    let response =
                        await sendBusinessUpdate(
                            id,
                            business,
                            accessToken
                        );


                    /*
                    -------------------------------------------------
                    REFRESH + RETRY IF JWT EXPIRED
                    -------------------------------------------------
                    */

                    if (
                        response.status ===
                        401
                    ) {

                        console.warn(
                            "LosOja: Edit received 401. Refreshing session..."
                        );


                        const refreshResult =
                            typeof window.refreshSupabaseSession ===
                            "function"
                                ? await window.refreshSupabaseSession()
                                : null;


                        if (
                            !refreshResult ||
                            !refreshResult.success
                        ) {

                            throw new Error(
                                "Your login session has expired. Please log in again."
                            );
                        }


                        accessToken =
                            getAccessTokenSafe();


                        response =
                            await sendBusinessUpdate(
                                id,
                                business,
                                accessToken
                            );
                    }


                    if (!response.ok) {

                        throw new Error(
                            await getResponseError(
                                response
                            )
                        );
                    }


                    const updated =
                        await response.json();


                    const updatedBusiness =
                        Array.isArray(updated)
                            ? updated[0]
                            : updated;


                    const index =
                        allBusinesses.findIndex(
                            function (item) {

                                return (
                                    String(item.id) ===
                                    String(id)
                                );
                            }
                        );


                    if (index !== -1) {

                        allBusinesses[index] =
                            updatedBusiness;
                    }


                    saveBusinessesCache(
                        allBusinesses
                    );


                    renderBusinesses(
                        allBusinesses
                    );


                    closeModalSafe(
                        "editBusinessModal"
                    );


                    notify(
                        "Business updated successfully!",
                        "success"
                    );


                    await loadBusinesses();


                } catch (error) {

                    console.error(
                        "Business update error:",
                        error
                    );


                    showError(
                        "editBusinessError",
                        error.message ||
                        "Business could not be updated."
                    );


                } finally {

                    if (submitButton) {

                        submitButton.disabled =
                            false;

                        submitButton.textContent =
                            "Save Changes";
                    }
                }

            }
        );
    }


    /* =====================================================
       DELETE BUSINESS
    ===================================================== */

    window.deleteBusiness =
        async function (businessId) {

            const user =
                getCurrentUserSafe();


            if (!user || !user.id) {

                notify(
                    "Please log in first.",
                    "error"
                );

                return;
            }


            let accessToken =
                getAccessTokenSafe();


            if (!accessToken) {

                notify(
                    "Your login session has expired. Please log in again.",
                    "error"
                );

                return;
            }


            const confirmed =
                window.confirm(
                    "Are you sure you want to delete this business?"
                );


            if (!confirmed) {
                return;
            }


            try {

                let response =
                    await fetch(
                        LOSOJA_BUSINESSES_URL +
                        "/rest/v1/businesses?id=eq." +
                        encodeURIComponent(
                            businessId
                        ),
                        {
                            method: "DELETE",

                            headers:
                                supabaseHeaders(
                                    accessToken
                                )
                        }
                    );


                if (
                    response.status ===
                    401
                ) {

                    const refreshResult =
                        typeof window.refreshSupabaseSession ===
                        "function"
                            ? await window.refreshSupabaseSession()
                            : null;


                    if (
                        !refreshResult ||
                        !refreshResult.success
                    ) {

                        throw new Error(
                            "Your login session has expired. Please log in again."
                        );
                    }


                    accessToken =
                        getAccessTokenSafe();


                    response =
                        await fetch(
                            LOSOJA_BUSINESSES_URL +
                            "/rest/v1/businesses?id=eq." +
                            encodeURIComponent(
                                businessId
                            ),
                            {
                                method: "DELETE",

                                headers:
                                    supabaseHeaders(
                                        accessToken
                                    )
                            }
                        );
                }


                if (!response.ok) {

                    throw new Error(
                        await getResponseError(
                            response
                        )
                    );
                }


                allBusinesses =
                    allBusinesses.filter(
                        function (business) {

                            return (
                                String(
                                    business.id
                                ) !==
                                String(
                                    businessId
                                )
                            );
                        }
                    );


                saveBusinessesCache(
                    allBusinesses
                );


                renderBusinesses(
                    allBusinesses
                );


                notify(
                    "Business deleted successfully.",
                    "success"
                );


            } catch (error) {

                console.error(
                    "Business delete error:",
                    error
                );


                notify(
                    "Business could not be deleted: " +
                    (
                        error.message ||
                        "Unknown error"
                    ),
                    "error"
                );
            }
        };


    /* =====================================================
       SEARCH
    ===================================================== */

    function setupSearch() {

        const searchForm =
            document.getElementById(
                "searchForm"
            );


        const searchInput =
            document.getElementById(
                "searchInput"
            );


        if (!searchInput) {
            return;
        }


        function performSearch() {

            const term =
                searchInput.value
                    .trim()
                    .toLowerCase();


            if (!term) {

                renderBusinesses(
                    allBusinesses
                );

                return;
            }


            const filtered =
                allBusinesses.filter(
                    function (business) {

                        return (

                            String(
                                business.name ||
                                ""
                            )
                                .toLowerCase()
                                .includes(term)

                            ||

                            String(
                                business.category ||
                                ""
                            )
                                .toLowerCase()
                                .includes(term)

                            ||

                            String(
                                business.location ||
                                ""
                            )
                                .toLowerCase()
                                .includes(term)

                            ||

                            String(
                                business.description ||
                                ""
                            )
                                .toLowerCase()
                                .includes(term)
                        );
                    }
                );


            renderBusinesses(
                filtered
            );
        }


        if (searchForm) {

            searchForm.addEventListener(
                "submit",
                function (event) {

                    event.preventDefault();

                    performSearch();

                }
            );

        }


        searchInput.addEventListener(
            "input",
            performSearch
        );
    }


  /* =====================================================
   CATEGORY FILTER
===================================================== */

function setupCategoryFilter() {

    const categorySelect =
        document.getElementById(
            "categoryFilter"
        );


    /*
    -----------------------------------------------------
    EXISTING CATEGORY SELECT
    -----------------------------------------------------
    */

    if (categorySelect) {

        categorySelect.addEventListener(
            "change",
            function () {

                const category =
                    this.value
                        .trim()
                        .toLowerCase();


                if (!category) {

                    renderBusinesses(
                        allBusinesses
                    );

                    return;
                }


                const filtered =
                    allBusinesses.filter(
                        function (business) {

                            return (
                                String(
                                    business.category ||
                                    ""
                                )
                                    .trim()
                                    .toLowerCase() ===
                                category
                            );
                        }
                    );


                renderBusinesses(
                    filtered
                );
            }
        );
    }


    /*
    -----------------------------------------------------
    LOSOJA EXPLORE CATEGORY CARDS
    -----------------------------------------------------
    */

    const categoryCards =
        document.querySelectorAll(
            ".category-card[data-category]"
        );


    console.log(
        "LosOja: Category buttons found:",
        categoryCards.length
    );


    categoryCards.forEach(
        function (button) {

            if (
                button.dataset.losojaCategoryBound ===
                "true"
            ) {
                return;
            }


            button.dataset.losojaCategoryBound =
                "true";


            button.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();


                    const category =
                        this.dataset.category
                            ?.trim()
                            .toLowerCase();


                    if (!category) {
                        return;
                    }


                    console.log(
                        "LosOja: Category selected:",
                        category
                    );


                    const filtered =
                        allBusinesses.filter(
                            function (business) {

                                return (
                                    String(
                                        business.category ||
                                        ""
                                    )
                                        .trim()
                                        .toLowerCase() ===
                                    category
                                );
                            }
                        );


                    /*
                    Scroll to businesses
                    so the user can immediately
                    see the results.
                    */

                    const businessesSection =
                        document.getElementById(
                            "businesses"
                        );


                    if (businessesSection) {

                        businessesSection.scrollIntoView({
                            behavior: "smooth",
                            block: "start"
                        });
                    }


                    renderBusinesses(
                        filtered
                    );
                }
            );
        }
    );
}

        const categorySelect =
            document.getElementById(
                "categoryFilter"
            );


        if (!categorySelect) {
            return;
        }


        categorySelect.addEventListener(
            "change",
            function () {

                const category =
                    this.value
                        .trim()
                        .toLowerCase();


                if (!category) {

                    renderBusinesses(
                        allBusinesses
                    );

                    return;
                }


                const filtered =
                    allBusinesses.filter(
                        function (business) {

                            return (
                                String(
                                    business.category ||
                                    ""
                                )
                                    .trim()
                                    .toLowerCase() ===
                                category
                            );
                        }
                    );


                renderBusinesses(
                    filtered
                );
            }
        );
    }


    /* =====================================================
       POPULAR SEARCH
    ===================================================== */

    function setupPopularSearch() {

        document.addEventListener(
            "click",
            function (event) {

                const button =
                    event.target.closest(
                        "[data-search]"
                    );


                if (!button) {
                    return;
                }


                const searchValue =
                    button.getAttribute(
                        "data-search"
                    );


                const searchInput =
                    document.getElementById(
                        "searchInput"
                    );


                if (!searchInput) {
                    return;
                }


                searchInput.value =
                    searchValue || "";


                searchInput.dispatchEvent(
                    new Event(
                        "input",
                        {
                            bubbles: true
                        }
                    )
                );
            }
        );
    }


    /* =====================================================
       PUBLIC API
    ===================================================== */

    window.loadLosOjaBusinesses =
        loadBusinesses;


    window.getLosOjaBusinesses =
        getBusinesses;


    window.renderLosOjaBusinesses =
        renderBusinesses;


    /* =====================================================
       INITIALIZATION
    ===================================================== */

    function initializeBusinessesJS() {

        console.log(
            "LosOja: Initializing business handlers..."
        );


        setupAddBusinessButtons();

        setupAddBusinessForm();

        setupEditBusinessForm();

        setupSearch();

        setupCategoryFilter();

        setupPopularSearch();

        loadBusinesses();
    }


    /*
    ---------------------------------------------------------
    IMPORTANT:
    If businesses.js loads before DOM is ready, wait.
    If it loads after DOMContentLoaded has already fired,
    initialize immediately.
    ---------------------------------------------------------
    */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initializeBusinessesJS,
            {
                once: true
            }
        );

    } else {

        initializeBusinessesJS();
    }

})();


   
