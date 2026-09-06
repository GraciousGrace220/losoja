/*
=========================================================
LosOja - Businesses
js/businesses.js

Handles:
- Loading businesses
- Searching
- Filtering
- Viewing business details
- Adding businesses
- Editing businesses
=========================================================
*/

(function () {

    "use strict";


    const SUPABASE_URL =
        "https://ycxshwgeebskdozmornh.supabase.co";

    const SUPABASE_KEY =
        "sb_publishable_jFSLacwNupO6T8EnSqb2bw_bZmy7rVe";


    /* =====================================================
       SESSION
    ===================================================== */

    function getSession() {

        if (
            typeof window.getSupabaseSession ===
            "function"
        ) {

            return window.getSupabaseSession();
        }


        try {

            const raw =
                localStorage.getItem(
                    "losoja_supabase_session"
                );

            return raw
                ? JSON.parse(raw)
                : null;

        } catch {

            return null;
        }
    }


    function getUser() {

        const session =
            getSession();

        return session?.user || null;
    }


    function getToken() {

        const session =
            getSession();

        return (
            session?.access_token ||
            session?.accessToken ||
            null
        );
    }


    /* =====================================================
       HEADERS
    ===================================================== */

    function headers(requireAuth) {

        const result = {

            "apikey": SUPABASE_KEY,

            "Content-Type":
                "application/json",

            "Accept":
                "application/json"
        };


        if (requireAuth) {

            const token =
                getToken();

            if (token) {

                result["Authorization"] =
                    "Bearer " + token;
            }
        }


        return result;
    }


    /* =====================================================
       ERROR
    ===================================================== */

    async function getResponseError(response) {

        let data = null;

        try {
            data = await response.json();
        } catch {
            data = null;
        }


        console.error(
            "LosOja Supabase error:",
            response.status,
            data
        );


        if (data) {

            return (
                data.message ||
                data.msg ||
                data.error_description ||
                data.details ||
                data.hint ||
                data.error ||
                "Supabase returned an error."
            );
        }


        return (
            "Supabase request failed with status " +
            response.status +
            "."
        );
    }


    /* =====================================================
       NOTIFICATION
    ===================================================== */

    function notify(message) {

        if (
            window.App &&
            typeof App.showToast ===
            "function"
        ) {

            App.showToast(message);

        } else if (
            typeof window.showNotification ===
            "function"
        ) {

            window.showNotification(
                message
            );

        } else {

            alert(message);
        }
    }


    /* =====================================================
       HTML ESCAPE
    ===================================================== */

    function escapeHTML(value) {

        const div =
            document.createElement("div");

        div.textContent =
            String(value ?? "");

        return div.innerHTML;
    }


    /* =====================================================
       MODAL
    ===================================================== */

    function openModal(id) {

        if (
            window.App &&
            typeof App.openModal ===
            "function"
        ) {

            App.openModal(id);

            return;
        }


        const modal =
            document.getElementById(id);

        if (!modal) return;

        modal.classList.add("active");
        modal.classList.add("open");

        document.body.style.overflow =
            "hidden";
    }


    function closeModal(id) {

        if (
            window.App &&
            typeof App.closeModal ===
            "function"
        ) {

            App.closeModal(id);

            return;
        }


        const modal =
            document.getElementById(id);

        if (!modal) return;

        modal.classList.remove("active");
        modal.classList.remove("open");

        document.body.style.overflow =
            "";
    }


    /* =====================================================
       LOAD BUSINESSES
    ===================================================== */

    async function loadBusinesses() {

        const grid =
            document.getElementById(
                "businessGrid"
            );

        const noResults =
            document.getElementById(
                "noResults"
            );


        if (grid) {

            grid.innerHTML = `
                <div class="loading">
                    Loading businesses...
                </div>
            `;
        }


        try {

            const response =
                await fetch(
                    SUPABASE_URL +
                    "/rest/v1/businesses?select=*&order=created_at.desc",
                    {
                        method: "GET",
                        headers: headers(false)
                    }
                );


            if (!response.ok) {

                const error =
                    await getResponseError(
                        response
                    );

                throw new Error(error);
            }


            const businesses =
                await response.json();


            window.LosOjaBusinesses =
                businesses;


            renderBusinesses(
                businesses
            );


            updateResultsText(
                businesses.length
            );


            return businesses;


        } catch (error) {

            console.error(
                "LosOja: Could not load businesses:",
                error
            );


            if (grid) {

                grid.innerHTML = `
                    <div class="no-results">
                        <p>
                            Businesses could not be loaded.
                        </p>
                        <p style="font-size:0.85rem;color:#64748b;">
                            ${escapeHTML(error.message)}
                        </p>
                    </div>
                `;
            }


            if (noResults) {
                noResults.classList.add(
                    "hidden"
                );
            }


            return [];
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

        const noResults =
            document.getElementById(
                "noResults"
            );


        if (!grid) return;


        if (
            !businesses ||
            businesses.length === 0
        ) {

            grid.innerHTML = "";

            if (noResults) {
                noResults.classList.remove(
                    "hidden"
                );
            }

            return;
        }


        if (noResults) {
            noResults.classList.add(
                "hidden"
            );
        }


        grid.innerHTML =
            businesses.map(
                businessCard
            ).join("");
    }


    function businessCard(
        business
    ) {

        const id =
            escapeHTML(
                business.id
            );

        const name =
            escapeHTML(
                business.name
            );

        const category =
            escapeHTML(
                business.category
            );

        const location =
            escapeHTML(
                business.location
            );

        const description =
            escapeHTML(
                business.description ||
                "No description provided."
            );


        return `
            <article class="business-card">

                <div class="business-card-content">

                    <span class="business-category">
                        ${category}
                    </span>

                    <h3>
                        ${name}
                    </h3>

                    <p class="business-location">
                        📍 ${location}
                    </p>

                    <p class="business-description">
                        ${description}
                    </p>

                    <button
                        type="button"
                        class="btn btn-primary"
                        onclick="openBusiness('${id}')"
                    >
                        View Details
                    </button>

                </div>

            </article>
        `;
    }


    /* =====================================================
       BUSINESS DETAILS
    ===================================================== */

    async function openBusiness(
        id
    ) {

        const details =
            document.getElementById(
                "businessDetails"
            );

        if (!details) return;


        details.innerHTML = `
            <p>Loading business...</p>
        `;


        openModal(
            "businessModal"
        );


        try {

            const response =
                await fetch(
                    SUPABASE_URL +
                    "/rest/v1/businesses?id=eq." +
                    encodeURIComponent(id) +
                    "&select=*",
                    {
                        method: "GET",
                        headers: headers(false)
                    }
                );


            if (!response.ok) {

                const error =
                    await getResponseError(
                        response
                    );

                throw new Error(error);
            }


            const rows =
                await response.json();


            if (
                !rows ||
                !rows.length
            ) {

                details.innerHTML = `
                    <p>
                        Business not found.
                    </p>
                `;

                return;
            }


            const business =
                rows[0];


            details.innerHTML = `
                <div class="business-detail-content">

                    <span class="business-category">
                        ${escapeHTML(
                            business.category
                        )}
                    </span>

                    <h2>
                        ${escapeHTML(
                            business.name
                        )}
                    </h2>

                    <p>
                        📍 ${escapeHTML(
                            business.location
                        )}
                    </p>

                    ${
                        business.description
                        ? `
                            <p>
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
                                📞
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

                    ${
                        business.email
                        ? `
                            <p>
                                ✉️
                                <a href="mailto:${escapeHTML(
                                    business.email
                                )}">
                                    ${escapeHTML(
                                        business.email
                                    )}
                                </a>
                            </p>
                        `
                        : ""
                    }

                </div>
            `;


        } catch (error) {

            console.error(
                "LosOja: Business details error:",
                error
            );


            details.innerHTML = `
                <p>
                    Could not load business details.
                </p>
                <p style="font-size:0.85rem;color:#64748b;">
                    ${escapeHTML(
                        error.message
                    )}
                </p>
            `;
        }
    }


    /* =====================================================
       SEARCH
    ===================================================== */

    function filterBusinesses() {

        const searchInput =
            document.getElementById(
                "searchInput"
            );

        const locationInput =
            document.getElementById(
                "locationInput"
            );


        const search =
            String(
                searchInput?.value || ""
            )
            .trim()
            .toLowerCase();


        const location =
            String(
                locationInput?.value || ""
            )
            .trim()
            .toLowerCase();


        const businesses =
            window.LosOjaBusinesses ||
            [];


        const filtered =
            businesses.filter(
                function (business) {

                    const name =
                        String(
                            business.name || ""
                        ).toLowerCase();

                    const category =
                        String(
                            business.category || ""
                        ).toLowerCase();

                    const businessLocation =
                        String(
                            business.location || ""
                        ).toLowerCase();

                    const description =
                        String(
                            business.description || ""
                        ).toLowerCase();


                    const matchesSearch =
                        !search ||
                        name.includes(search) ||
                        category.includes(search) ||
                        businessLocation.includes(search) ||
                        description.includes(search);


                    const matchesLocation =
                        !location ||
                        businessLocation.includes(
                            location
                        );


                    return (
                        matchesSearch &&
                        matchesLocation
                    );
                }
            );


        renderBusinesses(
            filtered
        );


        updateResultsText(
            filtered.length
        );
    }


    function updateResultsText(
        count
    ) {

        const element =
            document.getElementById(
                "businessResultsText"
            );

        if (!element) return;


        element.textContent =
            count === 1
            ? "1 business found."
            : `${count} businesses found.`;
    }


    /* =====================================================
       ADD BUSINESS
    ===================================================== */

    function setupAddBusinessButtons() {

        const buttons =
            document.querySelectorAll(
                ".add-business-btn, #addBusinessBtn"
            );


        buttons.forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function (event) {

                        event.preventDefault();


                        const user =
                            getUser();

                        const token =
                            getToken();


                        /*
                        -------------------------------------------------
                        IMPORTANT:
                        A localStorage-only user is NOT enough.
                        We need a real Supabase Auth session.
                        -------------------------------------------------
                        */

                        if (
                            !user ||
                            !user.id ||
                            !token
                        ) {

                            notify(
                                "Please log in with your LosOja account first."
                            );

                            openModal(
                                "loginModal"
                            );

                            return;
                        }


                        clearAddBusinessForm();

                        openModal(
                            "addBusinessModal"
                        );
                    }
                );
            }
        );
    }


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
       ADD BUSINESS FORM
    ===================================================== */

    function setupAddBusinessForm() {

        const form =
            document.getElementById(
                "addBusinessForm"
            );


        if (!form) {

            console.error(
                "LosOja: #addBusinessForm was not found."
            );

            return;
        }


        form.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                clearError(
                    "addBusinessError"
                );


                const user =
                    getUser();

                const token =
                    getToken();


                if (
                    !user ||
                    !user.id ||
                    !token
                ) {

                    showError(
                        "addBusinessError",
                        "Your session has expired. Please log in again."
                    );

                    openModal(
                        "loginModal"
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


                const email =
                    document.getElementById(
                        "businessEmail"
                    )?.value.trim();


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


                /*
                -----------------------------------------------------
                EXACT DATABASE COLUMNS
                -----------------------------------------------------

                id
                user_id
                name
                category
                location
                description
                phone
                email
                created_at
                -----------------------------------------------------
                */

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
                        phone || null,

                    email:
                        email || null
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
                            SUPABASE_URL +
                            "/rest/v1/businesses",
                            {
                                method: "POST",

                                headers: {
                                    ...headers(true),

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


                    const savedBusiness =
                        await response.json();


                    console.log(
                        "LosOja: Business saved:",
                        savedBusiness
                    );


                    closeModal(
                        "addBusinessModal"
                    );


                    clearAddBusinessForm();


                    notify(
                        "Business added successfully!"
                    );


                    await loadBusinesses();


                    if (
                        window.Dashboard &&
                        typeof Dashboard.load ===
                        "function"
                    ) {

                        await Dashboard.load();
                    }


                } catch (error) {

                    console.error(
                        "LosOja: Add business failed:",
                        error
                    );


                    showError(
                        "addBusinessError",
                        "Business could not be saved: " +
                        error.message
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
       EDIT BUSINESS
    ===================================================== */

    async function openEditBusiness(
        id
    ) {

        const user =
            getUser();

        const token =
            getToken();


        if (
            !user ||
            !token
        ) {

            notify(
                "Please log in first."
            );

            openModal(
                "loginModal"
            );

            return;
        }


        try {

            const response =
                await fetch(
                    SUPABASE_URL +
                    "/rest/v1/businesses?id=eq." +
                    encodeURIComponent(id) +
                    "&select=*",
                    {
                        method: "GET",
                        headers: headers(true)
                    }
                );


            if (!response.ok) {

                const error =
                    await getResponseError(
                        response
                    );

                throw new Error(error);
            }


            const rows =
                await response.json();


            if (
                !rows ||
                !rows.length
            ) {

                notify(
                    "Business not found."
                );

                return;
            }


            const business =
                rows[0];


            if (
                business.user_id !==
                user.id
            ) {

                notify(
                    "You can only edit your own business."
                );

                return;
            }


            document.getElementById(
                "editBusinessId"
            ).value =
                business.id || "";


            document.getElementById(
                "editBusinessName"
            ).value =
                business.name || "";


            document.getElementById(
                "editBusinessCategory"
            ).value =
                business.category || "";


            document.getElementById(
                "editBusinessLocation"
            ).value =
                business.location || "";


            document.getElementById(
                "editBusinessDescription"
            ).value =
                business.description || "";


            document.getElementById(
                "editBusinessPhone"
            ).value =
                business.phone || "";


            document.getElementById(
                "editBusinessEmail"
            ).value =
                business.email || "";


            clearError(
                "editBusinessError"
            );


            openModal(
                "editBusinessModal"
            );


        } catch (error) {

            console.error(
                "LosOja: Edit loading failed:",
                error
            );

            notify(
                error.message
            );
        }
    }

function clearError(elementId) {
    const element = document.getElementById(elementId);

    if (!element) return;

    element.textContent = "";
    element.classList.add("hidden");
}

function showError(elementId, message) {
    const element = document.getElementById(elementId);

    if (!element) return;

    element.textContent = message || "Something went wrong.";
    element.classList.remove("hidden");
}
    function setupEditBusinessForm() {

        const form =
            document.getElementById(
                "editBusinessForm"
            );


        if (!form) return;


        form.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                clearError(
                    "editBusinessError"
                );


                const user =
                    getUser();

                const token =
                    getToken();


                if (
                    !user ||
                    !token
                ) {

                    showError(
                        "editBusinessError",
                        "Please log in again."
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
                        )?.value.trim() || null,

                    phone:
                        document.getElementById(
                            "editBusinessPhone"
                        )?.value.trim() || null,

                    email:
                        document.getElementById(
                            "editBusinessEmail"
                        )?.value.trim() || null
                };


                if (!id) {

                    showError(
                        "editBusinessError",
                        "Business ID is missing."
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
                            SUPABASE_URL +
                            "/rest/v1/businesses?id=eq." +
                            encodeURIComponent(id),
                            {
                                method: "PATCH",

                                headers: {
                                    ...headers(true),

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

                        throw new Error(error);
                    }


                    closeModal(
                        "editBusinessModal"
                    );


                    notify(
                        "Business updated successfully!"
                    );


                    await loadBusinesses();


                    if (
                        window.Dashboard &&
                        typeof Dashboard.load ===
                        "function"
                    ) {

                        await Dashboard.load();
                    }


                } catch (error) {

                    console.error(
                        "LosOja: Update failed:",
                        error
                    );


                    showError(
                        "editBusinessError",
                        "Business could not be updated: " +
                        error.message
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

    async function deleteBusiness(
        id
    ) {

        const user =
            getUser();

        const token =
            getToken();


        if (
            !user ||
            !token
        ) {

            notify(
                "Please log in first."
            );

            return;
        }


        try {

            const response =
                await fetch(
                    SUPABASE_URL +
                    "/rest/v1/businesses?id=eq." +
                    encodeURIComponent(id),
                    {
                        method: "DELETE",
                        headers: headers(true)
                    }
                );


            if (!response.ok) {

                const error =
                    await getResponseError(
                        response
                    );

                throw new Error(error);
            }


            notify(
                "Business deleted successfully."
            );


            await loadBusinesses();


            if (
                window.Dashboard &&
                typeof Dashboard.load ===
                "function"
            ) {

                await Dashboard.load();
            }


        } catch (error) {

            console.error(
                "LosOja: Delete failed:",
                error
            );


            notify(
                "Business could not be deleted: " +
                error.message
            );
        }
    }


    /* =====================================================
       POPULAR SEARCHES
    ===================================================== */

    function setupPopularSearches() {

        document
            .querySelectorAll(
                "[data-search]"
            )
            .forEach(
                function (button) {

                    button.addEventListener(
                        "click",
                        function () {

                            const search =
                                button.getAttribute(
                                    "data-search"
                                );


                            const input =
                                document.getElementById(
                                    "searchInput"
                                );


                            if (input) {

                                input.value =
                                    search;
                            }


                            filterBusinesses();


                            const section =
                                document.getElementById(
                                    "businesses"
                                );


                            if (section) {

                                section.scrollIntoView({
                                    behavior:
                                        "smooth"
                                });
                            }
                        }
                    );
                }
            );
    }


    /* =====================================================
       CATEGORY BUTTONS
    ===================================================== */

    function setupCategoryButtons() {

        document
            .querySelectorAll(
                ".category-card[data-category]"
            )
            .forEach(
                function (button) {

                    button.addEventListener(
                        "click",
                        function () {

                            const category =
                                button.getAttribute(
                                    "data-category"
                                );


                            const input =
                                document.getElementById(
                                    "searchInput"
                                );


                            if (input) {

                                input.value =
                                    category;
                            }


                            filterBusinesses();


                            const section =
                                document.getElementById(
                                    "businesses"
                                );


                            if (section) {

                                section.scrollIntoView({
                                    behavior:
                                        "smooth"
                                });
                            }
                        }
                    );
                }
            );
    }


    /* =====================================================
       SEARCH FORM
    ===================================================== */

    function setupSearchForm() {

        const form =
            document.getElementById(
                "searchForm"
            );


        if (!form) return;


        form.addEventListener(
            "submit",
            function (event) {

                event.preventDefault();

                filterBusinesses();


                const section =
                    document.getElementById(
                        "businesses"
                    );


                if (section) {

                    section.scrollIntoView({
                        behavior:
                            "smooth"
                    });
                }
            }
        );
    }


    /* =====================================================
       PUBLIC API
    ===================================================== */

    window.loadBusinesses =
        loadBusinesses;

    window.openBusiness =
        openBusiness;

    window.openEditBusiness =
        openEditBusiness;

    window.deleteBusiness =
        deleteBusiness;

    window.addBusiness =
        function () {

            const user =
                getUser();

            const token =
                getToken();


            if (
                !user ||
                !token
            ) {

                notify(
                    "Please log in first."
                );

                openModal(
                    "loginModal"
                );

                return;
            }


            openModal(
                "addBusinessModal"
            );
        };


    /* =====================================================
       START
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
