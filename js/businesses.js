/*
=========================================================
LosOja - Business Management
js/businesses.js

Handles:
- Loading businesses from Supabase
- Displaying businesses
- Viewing business details
- Adding/saving businesses
- Editing businesses
- Deleting businesses
- Searching businesses
- Notifications
=========================================================
*/

(function () {

    "use strict";


    /* =====================================================
       SUPABASE CONFIGURATION
    ===================================================== */

    const LOSOJA_SUPABASE_URL =
        "https://ycxshwgeebskdozmornh.supabase.co";

    const LOSOJA_SUPABASE_KEY =
        "sb_publishable_jFSLacwNupO6T8EnSqb2bw_bZmy7rVe";


    /* =====================================================
       SUPABASE HEADERS
    ===================================================== */

    function getAccessToken() {

        if (typeof window.getSupabaseAccessToken === "function") {
            return window.getSupabaseAccessToken();
        }

        const session =
            typeof window.getSupabaseSession === "function"
                ? window.getSupabaseSession()
                : null;

        return session?.access_token || null;
    }


    function getCurrentUserSafe() {

        if (typeof window.getCurrentUser === "function") {
            return window.getCurrentUser();
        }

        const session =
            typeof window.getSupabaseSession === "function"
                ? window.getSupabaseSession()
                : null;

        return session?.user || null;
    }


    function supabaseHeaders(includeAuth = false) {

        const headers = {
            "apikey": LOSOJA_SUPABASE_KEY,
            "Content-Type": "application/json"
        };

        if (includeAuth) {

            const token = getAccessToken();

            if (token) {
                headers["Authorization"] =
                    "Bearer " + token;
            }
        }

        return headers;
    }


    /* =====================================================
       ERROR HELPERS
    ===================================================== */

    function clearError(elementId) {

        const element =
            document.getElementById(elementId);

        if (!element) {
            return;
        }

        element.textContent = "";
        element.classList.add("hidden");
    }


    function showError(elementId, message) {

        const element =
            document.getElementById(elementId);

        if (!element) {
            return;
        }

        element.textContent =
            message || "Something went wrong.";

        element.classList.remove("hidden");
    }


    /* =====================================================
       NOTIFICATION
    ===================================================== */

    function notify(message, type = "success") {

        if (typeof window.showNotification === "function") {

            window.showNotification(
                message,
                type
            );

            return;
        }

        alert(message);
    }


    /* =====================================================
       HTML ESCAPE
    ===================================================== */

    function escapeHTML(value) {

        if (value === null || value === undefined) {
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
       MODAL HELPERS
    ===================================================== */

    function openModal(modalId) {

        if (typeof window.openModal === "function") {

            window.openModal(modalId);

            return;
        }

        const modal =
            document.getElementById(modalId);

        if (!modal) {
            return;
        }

        modal.classList.add("active");
        modal.classList.add("open");
    }


    function closeModal(modalId) {

        if (typeof window.closeModal === "function") {

            window.closeModal(modalId);

            return;
        }

        const modal =
            document.getElementById(modalId);

        if (!modal) {
            return;
        }

        modal.classList.remove("active");
        modal.classList.remove("open");
    }


    /* =====================================================
       LOAD BUSINESSES
    ===================================================== */

    async function loadBusinesses() {

        const container =
            document.getElementById("businessesGrid") ||
            document.getElementById("businessGrid") ||
            document.querySelector(".businesses-grid");

        if (!container) {
            return;
        }

        try {

            container.innerHTML = `
                <div class="loading-message">
                    Loading businesses...
                </div>
            `;


            const response = await fetch(
                LOSOJA_SUPABASE_URL +
                "/rest/v1/businesses?select=*&order=created_at.desc",
                {
                    method: "GET",
                    headers: supabaseHeaders(false)
                }
            );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data?.message ||
                    data?.error_description ||
                    data?.hint ||
                    "Could not load businesses."
                );
            }


            renderBusinesses(
                Array.isArray(data)
                    ? data
                    : []
            );


        } catch (error) {

            console.error(
                "LosOja load businesses error:",
                error
            );


            container.innerHTML = `
                <div class="empty-state">
                    <h3>Businesses could not be loaded</h3>
                    <p>
                        ${escapeHTML(
                            error.message ||
                            "Please try again."
                        )}
                    </p>
                </div>
            `;
        }
    }


    /* =====================================================
       RENDER BUSINESSES
    ===================================================== */

    function renderBusinesses(businesses) {

        const container =
            document.getElementById("businessesGrid") ||
            document.getElementById("businessGrid") ||
            document.querySelector(".businesses-grid");

        if (!container) {
            return;
        }


        if (!businesses.length) {

            container.innerHTML = `
                <div class="empty-state">
                    <h3>No businesses found</h3>
                    <p>
                        Be the first person to add a business.
                    </p>
                </div>
            `;

            return;
        }


        container.innerHTML =
            businesses
                .map(businessCard)
                .join("");


        container
            .querySelectorAll(".business-view-btn")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    function () {

                        const id =
                            this.dataset.id;

                        openBusiness(id);
                    }
                );
            });


        container
            .querySelectorAll(".business-edit-btn")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    function () {

                        const id =
                            this.dataset.id;

                        openEditBusiness(id);
                    }
                );
            });


        container
            .querySelectorAll(".business-delete-btn")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    function () {

                        const id =
                            this.dataset.id;

                        deleteBusiness(id);
                    }
                );
            });
    }


    /* =====================================================
       BUSINESS CARD
    ===================================================== */

    function businessCard(business) {

        const currentUser =
            getCurrentUserSafe();


        const isOwner =
            currentUser &&
            business.user_id === currentUser.id;


        return `
            <article
                class="business-card"
                data-business-id="${escapeHTML(
                    business.id
                )}"
            >

                <div class="business-card-content">

                    <h3>
                        ${escapeHTML(
                            business.name
                        )}
                    </h3>


                    <p class="business-category">
                        ${escapeHTML(
                            business.category
                        )}
                    </p>


                    <p class="business-location">
                        📍
                        ${escapeHTML(
                            business.location
                        )}
                    </p>


                    ${
                        business.description
                            ? `
                                <p class="business-description">
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
                                <p class="business-phone">
                                    📞
                                    ${escapeHTML(
                                        business.phone
                                    )}
                                </p>
                              `
                            : ""
                    }


                    <div class="business-card-actions">

                        <button
                            type="button"
                            class="btn btn-primary business-view-btn"
                            data-id="${escapeHTML(
                                business.id
                            )}"
                        >
                            View Details
                        </button>


                        ${
                            isOwner
                                ? `
                                    <button
                                        type="button"
                                        class="btn btn-secondary business-edit-btn"
                                        data-id="${escapeHTML(
                                            business.id
                                        )}"
                                    >
                                        Edit
                                    </button>

                                    <button
                                        type="button"
                                        class="btn btn-danger business-delete-btn"
                                        data-id="${escapeHTML(
                                            business.id
                                        )}"
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
       OPEN BUSINESS DETAILS
    ===================================================== */

    async function openBusiness(id) {

        if (!id) {
            return;
        }


        try {

            const response = await fetch(
                LOSOJA_SUPABASE_URL +
                "/rest/v1/businesses?id=eq." +
                encodeURIComponent(id) +
                "&select=*",
                {
                    method: "GET",
                    headers: supabaseHeaders(false)
                }
            );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data?.message ||
                    data?.hint ||
                    "Could not load business."
                );
            }


            const business =
                Array.isArray(data)
                    ? data[0]
                    : null;


            if (!business) {

                notify(
                    "Business not found.",
                    "error"
                );

                return;
            }


            const modal =
                document.getElementById(
                    "businessDetailsModal"
                );


            if (!modal) {

                notify(
                    "Business details window was not found.",
                    "error"
                );

                return;
            }


            const content =
                modal.querySelector(
                    ".business-details-content"
                ) ||
                modal.querySelector(
                    ".modal-body"
                ) ||
                modal;


            content.innerHTML = `

                <div class="business-details">

                    <h2>
                        ${escapeHTML(
                            business.name
                        )}
                    </h2>


                    <p>
                        <strong>Category:</strong>
                        ${escapeHTML(
                            business.category
                        )}
                    </p>


                    <p>
                        <strong>Location:</strong>
                        ${escapeHTML(
                            business.location
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
                                    <a href="tel:${escapeHTML(
                                        business.phone
                                    )}">
                                        ${escapeHTML(
                                            business.phone
                                        )}
                                    </a>
                                </p>
                              `
                            : ""
                    }

                </div>

            `;


            openModal(
                "businessDetailsModal"
            );


        } catch (error) {

            console.error(
                "LosOja business details error:",
                error
            );


            notify(
                error.message ||
                "Could not load business.",
                "error"
            );
        }
    }


    /* =====================================================
       CLEAR ADD BUSINESS FORM
    ===================================================== */

    function clearAddBusinessForm() {

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
    }


    /* =====================================================
       ADD BUSINESS BUTTONS
    ===================================================== */

    function setupAddBusinessButtons() {

        const buttons =
            document.querySelectorAll(
                ".add-business-btn"
            );


        buttons.forEach(button => {

            button.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();


                    const user =
                        getCurrentUserSafe();

                    const token =
                        getAccessToken();


                    if (!user || !token) {

                        notify(
                            "Please log in before adding a business.",
                            "error"
                        );


                        if (
                            typeof window.openModal ===
                            "function"
                        ) {

                            window.openModal(
                                "loginModal"
                            );
                        }

                        return;
                    }


                    clearAddBusinessForm();


                    openModal(
                        "addBusinessModal"
                    );
                }
            );

        });
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
            form.dataset.losojaBound ===
            "true"
        ) {
            return;
        }


        form.dataset.losojaBound =
            "true";


        form.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                clearError(
                    "addBusinessError"
                );


                const user =
                    getCurrentUserSafe();

                const token =
                    getAccessToken();


                if (!user || !token) {

                    showError(
                        "addBusinessError",
                        "Please log in before adding a business."
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
                    )?.value.trim();


                const phone =
                    document.getElementById(
                        "businessPhone"
                    )?.value.trim();


                /* =========================================
                   VALIDATION
                ========================================= */

                if (!name) {

                    showError(
                        "addBusinessError",
                        "Please enter your business name."
                    );

                    return;
                }


                if (!category) {

                    showError(
                        "addBusinessError",
                        "Please select a category."
                    );

                    return;
                }


                if (!location) {

                    showError(
                        "addBusinessError",
                        "Please enter your business location."
                    );

                    return;
                }


                /* =========================================
                   DATABASE OBJECT

                   IMPORTANT:
                   These are the actual columns in
                   public.businesses.
                ========================================= */

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
                        description || null,

                    phone:
                        phone || null
                };


                try {

                    const submitButton =
                        form.querySelector(
                            'button[type="submit"]'
                        );


                    if (submitButton) {

                        submitButton.disabled =
                            true;

                        submitButton.dataset.originalText =
                            submitButton.textContent;

                        submitButton.textContent =
                            "Saving...";
                    }


                    const response =
                        await fetch(
                            LOSOJA_SUPABASE_URL +
                            "/rest/v1/businesses",
                            {
                                method: "POST",

                                headers: {
                                    ...supabaseHeaders(true),
                                    "Prefer":
                                        "return=representation"
                                },

                                body:
                                    JSON.stringify(
                                        business
                                    )
                            }
                        );


                    const data =
                        await response.json()
                            .catch(
                                () => null
                            );


                    if (!response.ok) {

                        const message =
                            data?.message ||
                            data?.error_description ||
                            data?.hint ||
                            "Business could not be saved.";


                        throw new Error(
                            message
                        );
                    }


                    console.log(
                        "Business saved:",
                        data
                    );


                    closeModal(
                        "addBusinessModal"
                    );


                    clearAddBusinessForm();


                    notify(
                        "Business added successfully!",
                        "success"
                    );


                    await loadBusinesses();


                    if (
                        typeof window.loadDashboardBusinesses ===
                        "function"
                    ) {

                        window.loadDashboardBusinesses();
                    }


                } catch (error) {

                    console.error(
                        "LosOja add business error:",
                        error
                    );


                    showError(
                        "addBusinessError",
                        "Business could not be saved: " +
                        (
                            error.message ||
                            "Please try again."
                        )
                    );


                } finally {

                    const submitButton =
                        form.querySelector(
                            'button[type="submit"]'
                        );


                    if (submitButton) {

                        submitButton.disabled =
                            false;

                        submitButton.textContent =
                            submitButton.dataset.originalText ||
                            "Add Business";
                    }
                }

            }
        );
    }


    /* =====================================================
       OPEN EDIT BUSINESS
    ===================================================== */

    async function openEditBusiness(id) {

        if (!id) {
            return;
        }


        const user =
            getCurrentUserSafe();

        const token =
            getAccessToken();


        if (!user || !token) {

            notify(
                "Please log in first.",
                "error"
            );

            return;
        }


        try {

            const response =
                await fetch(
                    LOSOJA_SUPABASE_URL +
                    "/rest/v1/businesses?id=eq." +
                    encodeURIComponent(id) +
                    "&select=*",
                    {
                        method: "GET",
                        headers: supabaseHeaders(true)
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data?.message ||
                    data?.hint ||
                    "Could not load business."
                );
            }


            const business =
                Array.isArray(data)
                    ? data[0]
                    : null;


            if (!business) {

                notify(
                    "Business not found.",
                    "error"
                );

                return;
            }


            if (
                business.user_id !==
                user.id
            ) {

                notify(
                    "You can only edit your own business.",
                    "error"
                );

                return;
            }


            document.getElementById(
                "editBusinessId"
            ).value =
                business.id || "";


            const nameField =
                document.getElementById(
                    "editBusinessName"
                );

            if (nameField) {
                nameField.value =
                    business.name || "";
            }


            const categoryField =
                document.getElementById(
                    "editBusinessCategory"
                );

            if (categoryField) {
                categoryField.value =
                    business.category || "";
            }


            const locationField =
                document.getElementById(
                    "editBusinessLocation"
                );

            if (locationField) {
                locationField.value =
                    business.location || "";
            }


            const descriptionField =
                document.getElementById(
                    "editBusinessDescription"
                );

            if (descriptionField) {
                descriptionField.value =
                    business.description || "";
            }


            const phoneField =
                document.getElementById(
                    "editBusinessPhone"
                );

            if (phoneField) {
                phoneField.value =
                    business.phone || "";
            }


            clearError(
                "editBusinessError"
            );


            openModal(
                "editBusinessModal"
            );


        } catch (error) {

            console.error(
                "LosOja open edit business error:",
                error
            );


            notify(
                error.message ||
                "Could not open business for editing.",
                "error"
            );
        }
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
            form.dataset.losojaBound ===
            "true"
        ) {
            return;
        }


        form.dataset.losojaBound =
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


                if (!user || !token) {

                    showError(
                        "editBusinessError",
                        "Please log in first."
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
                        "Please select a category."
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


                try {

                    const submitButton =
                        form.querySelector(
                            'button[type="submit"]'
                        );


                    if (submitButton) {

                        submitButton.disabled =
                            true;

                        submitButton.dataset.originalText =
                            submitButton.textContent;

                        submitButton.textContent =
                            "Saving...";
                    }


                    const response =
                        await fetch(
                            LOSOJA_SUPABASE_URL +
                            "/rest/v1/businesses?id=eq." +
                            encodeURIComponent(id),
                            {
                                method: "PATCH",

                                headers: {
                                    ...supabaseHeaders(true),
                                    "Prefer":
                                        "return=representation"
                                },

                                body:
                                    JSON.stringify(
                                        business
                                    )
                            }
                        );


                    const data =
                        await response.json()
                            .catch(
                                () => null
                            );


                    if (!response.ok) {

                        throw new Error(
                            data?.message ||
                            data?.error_description ||
                            data?.hint ||
                            "Business could not be updated."
                        );
                    }


                    closeModal(
                        "editBusinessModal"
                    );


                    notify(
                        "Business updated successfully!",
                        "success"
                    );


                    await loadBusinesses();


                    if (
                        typeof window.loadDashboardBusinesses ===
                        "function"
                    ) {

                        window.loadDashboardBusinesses();
                    }


                } catch (error) {

                    console.error(
                        "LosOja edit business error:",
                        error
                    );


                    showError(
                        "editBusinessError",
                        "Business could not be updated: " +
                        (
                            error.message ||
                            "Please try again."
                        )
                    );


                } finally {

                    const submitButton =
                        form.querySelector(
                            'button[type="submit"]'
                        );


                    if (submitButton) {

                        submitButton.disabled =
                            false;

                        submitButton.textContent =
                            submitButton.dataset.originalText ||
                            "Save Changes";
                    }
                }

            }
        );
    }


    /* =====================================================
       DELETE BUSINESS
    ===================================================== */

    async function deleteBusiness(id) {

        if (!id) {
            return;
        }


        const user =
            getCurrentUserSafe();

        const token =
            getAccessToken();


        if (!user || !token) {

            notify(
                "Please log in first.",
                "error"
            );

            return;
        }


        const confirmed =
            confirm(
                "Are you sure you want to delete this business?"
            );


        if (!confirmed) {
            return;
        }


        try {

            const response =
                await fetch(
                    LOSOJA_SUPABASE_URL +
                    "/rest/v1/businesses?id=eq." +
                    encodeURIComponent(id) +
                    "&user_id=eq." +
                    encodeURIComponent(user.id),
                    {
                        method: "DELETE",

                        headers:
                            supabaseHeaders(true)
                    }
                );


            const data =
                await response.text();


            if (!response.ok) {

                let message =
                    "Business could not be deleted.";

                try {

                    const parsed =
                        JSON.parse(data);

                    message =
                        parsed?.message ||
                        parsed?.hint ||
                        message;

                } catch (e) {
                    // Ignore JSON parsing error
                }


                throw new Error(
                    message
                );
            }


            notify(
                "Business deleted successfully.",
                "success"
            );


            await loadBusinesses();


            if (
                typeof window.loadDashboardBusinesses ===
                "function"
            ) {

                window.loadDashboardBusinesses();
            }


        } catch (error) {

            console.error(
                "LosOja delete business error:",
                error
            );


            notify(
                error.message ||
                "Business could not be deleted.",
                "error"
            );
        }
    }


    /* =====================================================
       POPULAR SEARCHES
    ===================================================== */

    function setupPopularSearches() {

        const buttons =
            document.querySelectorAll(
                "[data-search]"
            );


        buttons.forEach(button => {

            button.addEventListener(
                "click",
                function () {

                    const value =
                        this.dataset.search ||
                        this.textContent.trim();


                    const searchInput =
                        document.getElementById(
                            "businessSearch"
                        ) ||
                        document.getElementById(
                            "searchInput"
                        );


                    if (!searchInput) {
                        return;
                    }


                    searchInput.value =
                        value;


                    searchBusinesses(
                        value
                    );
                }
            );
        });
    }


    /* =====================================================
       CATEGORY BUTTONS
    ===================================================== */

    function setupCategoryButtons() {

        const buttons =
            document.querySelectorAll(
                ".category-card"
            );


        buttons.forEach(button => {

            button.addEventListener(
                "click",
                function () {

                    const category =
                        this.dataset.category ||
                        this.getAttribute(
                            "data-category"
                        );


                    if (!category) {
                        return;
                    }


                    const searchInput =
                        document.getElementById(
                            "businessSearch"
                        ) ||
                        document.getElementById(
                            "searchInput"
                        );


                    if (searchInput) {

                        searchInput.value =
                            category;
                    }


                    searchBusinesses(
                        category
                    );
                }
            );
        });
    }


    /* =====================================================
       SEARCH FORM
    ===================================================== */

    function setupSearchForm() {

        const form =
            document.getElementById(
                "searchForm"
            );


        if (!form) {
            return;
        }


        if (
            form.dataset.losojaBound ===
            "true"
        ) {
            return;
        }


        form.dataset.losojaBound =
            "true";


        form.addEventListener(
            "submit",
            function (event) {

                event.preventDefault();


                const input =
                    document.getElementById(
                        "businessSearch"
                    ) ||
                    document.getElementById(
                        "searchInput"
                    );


                const value =
                    input?.value.trim() ||
                    "";


                searchBusinesses(
                    value
                );
            }
        );
    }


    /* =====================================================
       SEARCH BUSINESSES
    ===================================================== */

    async function searchBusinesses(searchTerm = "") {

        const container =
            document.getElementById("businessesGrid") ||
            document.getElementById("businessGrid") ||
            document.querySelector(".businesses-grid");


        if (!container) {
            return;
        }


        try {

            container.innerHTML = `
                <div class="loading-message">
                    Searching businesses...
                </div>
            `;


            let url =
                LOSOJA_SUPABASE_URL +
                "/rest/v1/businesses?select=*&order=created_at.desc";


            if (searchTerm) {

                const encoded =
                    encodeURIComponent(
                        "%" +
                        searchTerm +
                        "%"
                    );


                url =
                    LOSOJA_SUPABASE_URL +
                    "/rest/v1/businesses" +
                    "?or=(" +
                    "name.ilike." +
                    encoded +
                    ",category.ilike." +
                    encoded +
                    ",location.ilike." +
                    encoded +
                    ",description.ilike." +
                    encoded +
                    ")" +
                    "&select=*" +
                    "&order=created_at.desc";
            }


            const response =
                await fetch(
                    url,
                    {
                        method: "GET",
                        headers: supabaseHeaders(false)
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data?.message ||
                    data?.hint ||
                    "Search failed."
                );
            }


            renderBusinesses(
                Array.isArray(data)
                    ? data
                    : []
            );


        } catch (error) {

            console.error(
                "LosOja search error:",
                error
            );


            container.innerHTML = `
                <div class="empty-state">
                    <h3>Search failed</h3>
                    <p>
                        ${escapeHTML(
                            error.message ||
                            "Please try again."
                        )}
                    </p>
                </div>
            `;
        }
    }


    /* =====================================================
       PUBLIC API
    ===================================================== */

    window.loadBusinesses =
        loadBusinesses;

    window.searchBusinesses =
        searchBusinesses;

    window.openBusiness =
        openBusiness;

    window.openEditBusiness =
        openEditBusiness;

    window.deleteBusiness =
        deleteBusiness;


    window.addBusiness =
        function () {

            const user =
                getCurrentUserSafe();

            const token =
                getAccessToken();


            if (!user || !token) {

                notify(
                    "Please log in before adding a business.",
                    "error"
                );

                if (
                    typeof window.openModal ===
                    "function"
                ) {

                    window.openModal(
                        "loginModal"
                    );
                }

                return;
            }


            clearAddBusinessForm();


            openModal(
                "addBusinessModal"
            );
        };


    /* =====================================================
       INITIALIZE
    ===================================================== */

    document.addEventListener(
        "DOMContentLoaded",
        function () {

            setupAddBusinessButtons();

            setupAddBusinessForm();

            setupEditBusinessForm();

            setupPopularSearches();

            setupCategoryButtons();

            setupSearchForm();

            loadBusinesses();

        }
    );


})();
