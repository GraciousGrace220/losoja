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

    const BUSINESSES_CACHE_KEY =
        "losoja_businesses_cache";


    /* =====================================================
       SESSION
    ===================================================== */

    function getSession() {

        try {

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
                "Could not read session:",
                error
            );

            return null;
        }
    }


    function getAccessToken() {

        if (
            typeof window.getSupabaseAccessToken ===
            "function"
        ) {
            return window.getSupabaseAccessToken();
        }

        const session = getSession();

        return session
            ? session.access_token
            : null;
    }


    function getCurrentUserSafe() {

        if (
            typeof window.getCurrentUser ===
            "function"
        ) {
            return window.getCurrentUser();
        }

        const session = getSession();

        return session
            ? session.user
            : null;
    }


    function supabaseHeaders(includeAuth = true) {

        const headers = {
            "apikey":
                LOSOJA_BUSINESSES_KEY,
            "Content-Type":
                "application/json"
        };

        const token =
            getAccessToken();

        if (
            includeAuth &&
            token
        ) {
            headers["Authorization"] =
                "Bearer " + token;
        }

        return headers;
    }


    /* =====================================================
       ERROR MESSAGE
    ===================================================== */

    async function getResponseError(response) {

        try {

            const data =
                await response.json();

            return (
                data.message ||
                data.error_description ||
                data.error ||
                data.hint ||
                "Request failed."
            );

        } catch (error) {

            return (
                "Request failed with status " +
                response.status
            );
        }
    }


    /* =====================================================
       HTML ESCAPE
    ===================================================== */

    function escapeHTML(value) {

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
    }


    /* =====================================================
       NOTIFICATION
    ===================================================== */

    function notify(
        message,
        type = "success"
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

        alert(message);
    }


    /* =====================================================
       ERROR HELPERS
    ===================================================== */

    function clearError(elementId) {

        const element =
            document.getElementById(
                elementId
            );

        if (!element) {
            return;
        }

        element.textContent = "";

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

            console.error(
                message
            );

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

    function openModalSafe(id) {

        const modal =
            document.getElementById(id);

        if (!modal) {

            console.error(
                "Modal not found:",
                id
            );

            return;
        }

        if (
            typeof window.openModal ===
            "function"
        ) {

            window.openModal(id);

        } else {

            modal.classList.add(
                "active"
            );

            modal.classList.add(
                "open"
            );

            document.body.style.overflow =
                "hidden";
        }
    }


    function closeModalSafe(id) {

        const modal =
            document.getElementById(id);

        if (!modal) {
            return;
        }

        if (
            typeof window.closeModal ===
            "function"
        ) {

            window.closeModal(id);

        } else {

            modal.classList.remove(
                "active"
            );

            modal.classList.remove(
                "open"
            );

            document.body.style.overflow =
                "";
        }
    }


    /* =====================================================
       CACHE
    ===================================================== */

    function saveBusinessesCache(
        businesses
    ) {

        try {

            localStorage.setItem(
                BUSINESSES_CACHE_KEY,
                JSON.stringify(
                    Array.isArray(businesses)
                        ? businesses
                        : []
                )
            );

        } catch (error) {

            console.warn(
                "Could not save business cache:",
                error
            );
        }
    }


    function getBusinessesCache() {

        try {

            const raw =
                localStorage.getItem(
                    BUSINESSES_CACHE_KEY
                );

            if (!raw) {
                return [];
            }

            const businesses =
                JSON.parse(raw);

            return Array.isArray(
                businesses
            )
                ? businesses
                : [];

        } catch (error) {

            console.warn(
                "Could not read business cache:",
                error
            );

            return [];
        }
    }


    /* =====================================================
       LOAD BUSINESSES
    ===================================================== */

    async function loadBusinesses() {

        const container =
            document.getElementById(
                "businessesGrid"
            );


        /*
         * Show cached businesses immediately.
         * This prevents the page from appearing empty
         * while Supabase is loading.
         */

        const cached =
            getBusinessesCache();


        if (
            cached.length > 0
        ) {

            window.losojaBusinesses =
                cached;

            renderBusinesses(
                cached
            );

        } else if (container) {

            container.innerHTML = `
                <div class="loading">
                    Loading businesses...
                </div>
            `;
        }


        try {

            const response =
                await fetch(
                    LOSOJA_BUSINESSES_URL +
                    "/rest/v1/businesses" +
                    "?select=*" +
                    "&order=created_at.desc",
                    {
                        method: "GET",

                        headers:
                            supabaseHeaders(
                                false
                            )
                    }
                );


            if (!response.ok) {

                const error =
                    await getResponseError(
                        response
                    );

                throw new Error(
                    error
                );
            }


            const businesses =
                await response.json();


            if (
                !Array.isArray(
                    businesses
                )
            ) {

                throw new Error(
                    "Invalid business data received from Supabase."
                );
            }


            /*
             * Supabase is the source of truth.
             */

            window.losojaBusinesses =
                businesses;


            saveBusinessesCache(
                businesses
            );


            renderBusinesses(
                businesses
            );


            console.log(
                "Businesses loaded:",
                businesses.length
            );


            return businesses;


        } catch (error) {

            console.error(
                "Error loading businesses:",
                error
            );


            /*
             * If Supabase fails but cached businesses
             * exist, keep displaying them.
             */

            if (
                cached.length > 0
            ) {

                window.losojaBusinesses =
                    cached;

                renderBusinesses(
                    cached
                );

                return cached;
            }


            if (container) {

                container.innerHTML = `
                    <div class="empty-state">
                        <h3>Businesses are still loading</h3>
                        <p>
                            We could not load the businesses
                            right now. Please refresh the page.
                        </p>
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

        if (
            Array.isArray(
                window.losojaBusinesses
            )
        ) {

            return window.losojaBusinesses;
        }


        return getBusinessesCache();
    }


    /* =====================================================
       BUSINESS CARD
    ===================================================== */

    function businessCard(
        business
    ) {

        const id =
            escapeHTML(
                String(
                    business.id || ""
                )
            );


        const name =
            escapeHTML(
                business.name ||
                "Unnamed Business"
            );


        const category =
            escapeHTML(
                business.category ||
                "Other"
            );


        const location =
            escapeHTML(
                business.location ||
                "Nigeria"
            );


        const description =
            escapeHTML(
                business.description ||
                ""
            );


        return `
            <div
                class="business-card"
                data-business-id="${id}"
            >

                <div class="business-card-content">

                    <h3>
                        ${name}
                    </h3>

                    <span class="business-category">
                        ${category}
                    </span>

                    <p class="business-location">
                        📍 ${location}
                    </p>

                    ${
                        description
                            ? `
                                <p class="business-description">
                                    ${description}
                                </p>
                            `
                            : ""
                    }

                </div>


                <div class="business-card-actions">

                    <button
                        type="button"
                        class="btn btn-primary"
                        onclick="window.openBusiness('${id}')"
                    >
                        View Details
                    </button>


                    <button
                        type="button"
                        class="btn btn-secondary"
                        onclick="window.openEditBusiness('${id}')"
                    >
                        Edit
                    </button>


                    <button
                        type="button"
                        class="btn btn-danger"
                        onclick="window.deleteBusiness('${id}')"
                    >
                        Delete
                    </button>

                </div>

            </div>
        `;
    }


    /* =====================================================
       RENDER BUSINESSES
    ===================================================== */

    function renderBusinesses(
        businesses
    ) {

        const container =
            document.getElementById(
                "businessesGrid"
            );


        if (!container) {

            console.error(
                "businessesGrid was not found in index.html"
            );

            return;
        }


        if (
            !Array.isArray(
                businesses
            ) ||
            businesses.length === 0
        ) {

            container.innerHTML = `
                <div class="empty-state">

                    <h3>
                        No businesses found
                    </h3>

                    <p>
                        Try another search or add a business.
                    </p>

                </div>
            `;

            return;
        }


        container.innerHTML =
            businesses
                .map(
                    function (business) {
                        return businessCard(
                            business
                        );
                    }
                )
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


            const businesses =
                getBusinesses();


            const business =
                businesses.find(
                    function (item) {

                        return String(
                            item.id
                        ) === String(
                            businessId
                        );

                    }
                );


            if (!business) {

                console.error(
                    "Business not found:",
                    businessId
                );

                notify(
                    "Business could not be found.",
                    "error"
                );

                return;
            }


            /*
             * These IDs MUST match index.html.
             */

            const modal =
                document.getElementById(
                    "businessDetailsModal"
                );


            if (!modal) {

                console.error(
                    "businessDetailsModal was not found in index.html."
                );

                return;
            }


            const details =
                document.getElementById(
                    "businessDetails"
                );


            if (!details) {

                console.error(
                    "businessDetails was not found in index.html."
                );

                return;
            }


            /*
             * Build business details.
             *
             * Only columns that actually exist in
             * Supabase are used:
             *
             * id
             * user_id
             * name
             * category
             * location
             * description
             * phone
             * created_at
             */

            details.innerHTML = `
                <div class="business-detail-content">

                    <h2>
                        ${escapeHTML(
                            business.name ||
                            "Business"
                        )}
                    </h2>

                    <p>
                        <strong>Category:</strong>
                        ${escapeHTML(
                            business.category ||
                            "Other"
                        )}
                    </p>

                    <p>
                        <strong>Location:</strong>
                        ${escapeHTML(
                            business.location ||
                            "Nigeria"
                        )}
                    </p>

                    ${
                        business.description
                            ? `
                                <p>
                                    <strong>Description:</strong>
                                    ${escapeHTML(
                                        business.description
                                    )}
                                </p>
                            `
                            : ""
                    }

                    ${
                        business.phone
                            ? `
                                <p>
                                    <strong>Phone:</strong>
                                    ${escapeHTML(
                                        business.phone
                                    )}
                                </p>
                            `
                            : ""
                    }

                    <div class="business-detail-actions">

                        <button
                            type="button"
                            class="btn btn-primary"
                            onclick="window.closeModal('businessDetailsModal'); if (typeof window.addReview === 'function') { window.addReview('${escapeHTML(String(business.id))}'); }"
                        >
                            Leave a Review
                        </button>

                    </div>

                </div>
            `;


            /*
             * IMPORTANT:
             * Put the content into the modal FIRST,
             * then open the modal.
             */

            if (
                typeof window.openModal ===
                "function"
            ) {

                window.openModal(
                    "businessDetailsModal"
                );

            } else {

                modal.classList.add(
                    "active"
                );

                modal.classList.add(
                    "open"
                );

                document.body.style.overflow =
                    "hidden";
            }


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
                "businessFormError"
            );

            clearError(
                "addBusinessError"
            );

            clearError(
                "businessError"
            );
        };


    /* =====================================================
       ADD BUSINESS BUTTONS
    ===================================================== */

    function setupAddBusinessButtons() {

        const buttons =
            document.querySelectorAll(
                '[data-modal="addBusinessModal"],' +
                '#addBusinessBtn,' +
                '#addBusinessButton,' +
                '.add-business-btn'
            );


        buttons.forEach(
            function (button) {

                if (
                    button.dataset.businessModalBound ===
                    "true"
                ) {
                    return;
                }


                button.dataset.businessModalBound =
                    "true";


                button.addEventListener(
                    "click",
                    function (event) {

                        event.preventDefault();

                        openModalSafe(
                            "addBusinessModal"
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
            return;
        }


        if (
            form.dataset.bound ===
            "true"
        ) {
            return;
        }


        form.dataset.bound =
            "true";


        form.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                clearError(
                    "businessFormError"
                );

                clearError(
                    "addBusinessError"
                );

                clearError(
                    "businessError"
                );


                const user =
                    getCurrentUserSafe();


                const token =
                    getAccessToken();


                if (
                    !user ||
                    !token
                ) {

                    notify(
                        "Please log in before adding a business.",
                        "error"
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
                        "businessFormError",
                        "Please enter the business name."
                    );

                    return;
                }


                if (!category) {

                    showError(
                        "businessFormError",
                        "Please enter the business category."
                    );

                    return;
                }


                if (!location) {

                    showError(
                        "businessFormError",
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

                    const response =
                        await fetch(
                            LOSOJA_BUSINESSES_URL +
                            "/rest/v1/businesses",
                            {
                                method:
                                    "POST",

                                headers: {
                                    ...supabaseHeaders(
                                        true
                                    ),

                                    "Prefer":
                                        "return=representation"
                                },

                                body:
                                    JSON.stringify(
                                        business
                                    )
                            }
                        );


                    if (!response.ok) {

                        const error =
                            await getResponseError(
                                response
                            );

                        throw new Error(
                            error
                        );
                    }


                    const saved =
                        await response.json();


                    const savedBusiness =
                        Array.isArray(
                            saved
                        )
                            ? saved[0]
                            : saved;


                    if (!savedBusiness) {

                        throw new Error(
                            "Supabase did not return the saved business."
                        );
                    }


                    const current =
                        getBusinesses();


                    const updated =
                        [
                            savedBusiness,
                            ...current
                        ];


                    window.losojaBusinesses =
                        updated;


                    saveBusinessesCache(
                        updated
                    );


                    renderBusinesses(
                        updated
                    );


                    form.reset();


                    closeModalSafe(
                        "addBusinessModal"
                    );


                    notify(
                        "Business added successfully!",
                        "success"
                    );


                } catch (error) {

                    console.error(
                        "Business save error:",
                        error
                    );


                    showError(
                        "businessFormError",
                        "Business could not be saved: " +
                        error.message
                    );


                    notify(
                        "Business could not be saved: " +
                        error.message,
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

            const businesses =
                getBusinesses();


            const business =
                businesses.find(
                    function (item) {

                        return String(
                            item.id
                        ) === String(
                            businessId
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
            form.dataset.bound ===
            "true"
        ) {
            return;
        }


        form.dataset.bound =
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


                const token =
                    getAccessToken();


                if (
                    !user ||
                    !token
                ) {

                    notify(
                        "Please log in first.",
                        "error"
                    );

                    return;
                }


                const id =
                    document.getElementById(
                        "editBusinessId"
                    )?.value.trim();


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

                    const response =
                        await fetch(
                            LOSOJA_BUSINESSES_URL +
                            "/rest/v1/businesses" +
                            "?id=eq." +
                            encodeURIComponent(
                                id
                            ),
                            {
                                method:
                                    "PATCH",

                                headers: {
                                    ...supabaseHeaders(
                                        true
                                    ),

                                    "Prefer":
                                        "return=representation"
                                },

                                body:
                                    JSON.stringify(
                                        business
                                    )
                            }
                        );


                    if (!response.ok) {

                        const error =
                            await getResponseError(
                                response
                            );

                        throw new Error(
                            error
                        );
                    }


                    const updated =
                        await response.json();


                    const updatedBusiness =
                        Array.isArray(
                            updated
                        )
                            ? updated[0]
                            : updated;


                    if (
                        updatedBusiness
                    ) {

                        const businesses =
                            getBusinesses();


                        const newList =
                            businesses.map(
                                function (item) {

                                    return String(
                                        item.id
                                    ) === String(
                                        id
                                    )
                                        ? updatedBusiness
                                        : item;

                                }
                            );


                        window.losojaBusinesses =
                            newList;


                        saveBusinessesCache(
                            newList
                        );


                        renderBusinesses(
                            newList
                        );
                    }


                    closeModalSafe(
                        "editBusinessModal"
                    );


                    notify(
                        "Business updated successfully!",
                        "success"
                    );


                } catch (error) {

                    console.error(
                        "Business update error:",
                        error
                    );


                    showError(
                        "editBusinessError",
                        "Business could not be updated: " +
                        error.message
                    );


                    notify(
                        "Business could not be updated: " +
                        error.message,
                        "error"
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


            const token =
                getAccessToken();


            if (
                !user ||
                !token
            ) {

                notify(
                    "Please log in first.",
                    "error"
                );

                return;
            }


            const businesses =
                getBusinesses();


            const business =
                businesses.find(
                    function (item) {

                        return String(
                            item.id
                        ) === String(
                            businessId
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


            const confirmed =
                confirm(
                    'Are you sure you want to delete "' +
                    business.name +
                    '"?'
                );


            if (!confirmed) {
                return;
            }


            try {

                const response =
                    await fetch(
                        LOSOJA_BUSINESSES_URL +
                        "/rest/v1/businesses" +
                        "?id=eq." +
                        encodeURIComponent(
                            businessId
                        ),
                        {
                            method:
                                "DELETE",

                            headers:
                                supabaseHeaders(
                                    true
                                )
                        }
                    );


                if (!response.ok) {

                    const error =
                        await getResponseError(
                            response
                        );

                    throw new Error(
                        error
                    );
                }


                const remaining =
                    businesses.filter(
                        function (item) {

                            return String(
                                item.id
                            ) !== String(
                                businessId
                            );

                        }
                    );


                window.losojaBusinesses =
                    remaining;


                saveBusinessesCache(
                    remaining
                );


                renderBusinesses(
                    remaining
                );


                notify(
                    "Business deleted successfully.",
                    "success"
                );


            } catch (error) {

                console.error(
                    "Delete business error:",
                    error
                );


                notify(
                    "Business could not be deleted: " +
                    error.message,
                    "error"
                );
            }
        };


    /* =====================================================
       SEARCH
    ===================================================== */

    function searchBusinesses(
        searchTerm
    ) {

        const businesses =
            getBusinesses();


        const term =
            String(
                searchTerm || ""
            )
            .trim()
            .toLowerCase();


        if (!term) {

            renderBusinesses(
                businesses
            );

            return;
        }


        const filtered =
            businesses.filter(
                function (business) {

                    return (

                        String(
                            business.name || ""
                        )
                        .toLowerCase()
                        .includes(term)

                        ||

                        String(
                            business.category || ""
                        )
                        .toLowerCase()
                        .includes(term)

                        ||

                        String(
                            business.location || ""
                        )
                        .toLowerCase()
                        .includes(term)

                        ||

                        String(
                            business.description || ""
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


    window.searchBusinesses =
        searchBusinesses;


    /* =====================================================
       CATEGORY FILTER
    ===================================================== */

    window.filterBusinessesByCategory =
        function (category) {

            const businesses =
                getBusinesses();


            if (
                !category ||
                category === "all" ||
                category === "All"
            ) {

                renderBusinesses(
                    businesses
                );

                return;
            }


            const filtered =
                businesses.filter(
                    function (business) {

                        return String(
                            business.category || ""
                        )
                        .toLowerCase()
                        .includes(
                            String(
                                category
                            )
                            .toLowerCase()
                        );

                    }
                );


            renderBusinesses(
                filtered
            );
        };


    /* =====================================================
       SEARCH SETUP
    ===================================================== */

    function setupSearch() {

        const searchInput =
            document.getElementById(
                "searchInput"
            );


        const searchButton =
            document.getElementById(
                "searchButton"
            );


        if (searchButton) {

            searchButton.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    searchBusinesses(
                        searchInput
                            ? searchInput.value
                            : ""
                    );

                }
            );
        }


        if (searchInput) {

            searchInput.addEventListener(
                "keydown",
                function (event) {

                    if (
                        event.key ===
                        "Enter"
                    ) {

                        event.preventDefault();

                        searchBusinesses(
                            searchInput.value
                        );
                    }

                }
            );
        }
    }


    /* =====================================================
       POPULAR SEARCH
    ===================================================== */

    window.searchPopular =
        function (term) {

            const input =
                document.getElementById(
                    "searchInput"
                );


            if (input) {
                input.value = term;
            }


            searchBusinesses(
                term
            );
        };


    /* =====================================================
       PUBLIC API
    ===================================================== */

    window.loadBusinesses =
        loadBusinesses;

    window.renderBusinesses =
        renderBusinesses;

    window.getBusinesses =
        getBusinesses;


    /* =====================================================
       INITIALIZE
    ===================================================== */

    function initBusinesses() {

        console.log(
            "LosOja businesses.js initialized."
        );


        setupAddBusinessButtons();

        setupAddBusinessForm();

        setupEditBusinessForm();

        setupSearch();

        loadBusinesses();
    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initBusinesses
        );

    } else {

        initBusinesses();
    }


})();
