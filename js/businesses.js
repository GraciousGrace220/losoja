/*
=========================================================
LosOja - Simple Business Management
js/businesses.js

Core functions:
- Load businesses from Supabase
- Display businesses
- Search businesses
- Filter by category
- View business details
- Add a business
- Edit your business
- Delete your business

Image gallery and advanced features can be added later.
=========================================================
*/

(function () {

    "use strict";


    /* =====================================================
       SUPABASE
    ===================================================== */

    const SUPABASE_URL =
        "https://ycxshwgeebskdozmornh.supabase.co";

    const SUPABASE_KEY =
        "sb_publishable_jFSLacwNupO6T8EnSqb2bw_bZmy7rVe";

    const SESSION_KEY =
        "losoja_supabase_session";


    /* =====================================================
       BASIC HELPERS
    ===================================================== */

    function getSession() {

        try {

            if (
                typeof window.getSupabaseSession ===
                "function"
            ) {

                const session =
                    window.getSupabaseSession();

                if (session) {
                    return session;
                }
            }

            const saved =
                localStorage.getItem(
                    SESSION_KEY
                );

            if (!saved) {
                return null;
            }

            return JSON.parse(saved);

        } catch (error) {

            console.error(
                "LosOja session error:",
                error
            );

            return null;
        }
    }


    function getAccessToken() {

        const session =
            getSession();

        if (!session) {
            return null;
        }

        return (
            session.access_token ||
            session.accessToken ||
            null
        );
    }


    function getCurrentUser() {

        const session =
            getSession();

        return (
            session &&
            session.user
        ) || null;
    }


    function getCurrentUserId() {

        const user =
            getCurrentUser();

        return (
            user &&
            user.id
        ) || null;
    }


    /* =====================================================
       SUPABASE HEADERS
    ===================================================== */

    function getHeaders(
        json = false
    ) {

        const headers = {

            "apikey":
                SUPABASE_KEY,

            "Accept":
                "application/json"

        };


        const token =
            getAccessToken();


        /*
         * Only use Authorization when we
         * actually have a user JWT.
         */

        if (token) {

            headers["Authorization"] =
                "Bearer " + token;
        }


        if (json) {

            headers["Content-Type"] =
                "application/json";
        }


        return headers;
    }


    /* =====================================================
       SUPABASE REQUEST
    ===================================================== */

    async function supabaseRequest(
        url,
        options = {}
    ) {

        const response =
            await fetch(
                url,
                {
                    ...options,

                    headers: {
                        ...getHeaders(
                            Boolean(
                                options.body
                            )
                        ),

                        ...(options.headers || {})
                    }
                }
            );


        return response;
    }


    /* =====================================================
       HTML ESCAPE
    ===================================================== */

    function escapeHTML(
        value
    ) {

        if (
            value === null ||
            value === undefined
        ) {

            return "";
        }


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
       BUSINESS GRID
    ===================================================== */

    function getBusinessGrid() {

        return (
            document.getElementById(
                "businessGrid"
            ) ||
            document.getElementById(
                "businessesGrid"
            )
        );
    }


    /* =====================================================
       NOTIFICATION
    ===================================================== */

    function notify(
        message,
        type = "success"
    ) {

        if (
            window.App &&
            typeof window.App.showToast ===
            "function"
        ) {

            window.App.showToast(
                message,
                type
            );

            return;
        }


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
       MODALS
    ===================================================== */

    function openModal(
        id
    ) {

        if (
            window.App &&
            typeof window.App.openModal ===
            "function"
        ) {

            window.App.openModal(
                id
            );

            return;
        }


        const modal =
            document.getElementById(
                id
            );


        if (!modal) {
            return;
        }


        modal.classList.remove(
            "hidden"
        );

        modal.classList.add(
            "active"
        );

        modal.style.display =
            "flex";
    }


    function closeModal(
        id
    ) {

        if (
            window.App &&
            typeof window.App.closeModal ===
            "function"
        ) {

            window.App.closeModal(
                id
            );

            return;
        }


        const modal =
            document.getElementById(
                id
            );


        if (!modal) {
            return;
        }


        modal.classList.remove(
            "active"
        );

        modal.classList.add(
            "hidden"
        );

        modal.style.display =
            "none";
    }


    /* =====================================================
       LOAD BUSINESSES
    ===================================================== */

    async function loadBusinesses() {

        const grid =
            getBusinessGrid();


        if (!grid) {

            console.error(
                "LosOja: Business grid not found."
            );

            return;
        }


        grid.innerHTML = `
            <div class="loading-message">
                Businesses are loading...
            </div>
        `;


        try {

            /*
             * IMPORTANT:
             * No created_at ordering here.
             * This keeps the request compatible
             * with a simple businesses table.
             */

            const url =
                `${SUPABASE_URL}/rest/v1/businesses?select=*`;


            const response =
                await supabaseRequest(
                    url,
                    {
                        method: "GET"
                    }
                );


            const text =
                await response.text();


            if (!response.ok) {

                console.error(
                    "LosOja Supabase error:",
                    response.status,
                    text
                );

                throw new Error(
                    "Businesses could not be loaded."
                );
            }


            let businesses = [];


            try {

                businesses =
                    JSON.parse(
                        text
                    );

            } catch (error) {

                console.error(
                    "LosOja invalid Supabase response:",
                    text
                );

                throw new Error(
                    "Invalid response from Supabase."
                );
            }


            if (
                !Array.isArray(
                    businesses
                )
            ) {

                businesses = [];
            }


            window.losojaBusinesses =
                businesses;


            console.log(
                "LosOja businesses loaded:",
                businesses
            );


            renderBusinesses(
                businesses
            );


        } catch (error) {

            console.error(
                "LosOja businesses loading error:",
                error
            );


            grid.innerHTML = `
                <div class="error-message">
                    Unable to load businesses right now.
                </div>
            `;
        }
    }


    /* =====================================================
       BUSINESS CARD
    ===================================================== */

    function createBusinessCard(
        business
    ) {

        const image =
            business.image_url
                ? `
                    <div class="business-image">
                        <img
                            src="${escapeHTML(
                                business.image_url
                            )}"
                            alt="${escapeHTML(
                                business.name ||
                                "Business"
                            )}"
                            loading="lazy"
                        >
                    </div>
                `
                : `
                    <div class="business-image">
                        <span aria-hidden="true">
                            🏪
                        </span>
                    </div>
                `;


        return `
            <article
                class="business-card"
                data-business-id="${escapeHTML(
                    business.id
                )}"
            >

                ${image}

                <div class="business-card-content">

                    <span class="business-category">
                        ${escapeHTML(
                            business.category ||
                            "Business"
                        )}
                    </span>

                    <h3>
                        ${escapeHTML(
                            business.name ||
                            "Unnamed Business"
                        )}
                    </h3>

                    <p class="business-location">
                        📍
                        ${escapeHTML(
                            business.location ||
                            "Nigeria"
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

                    <button
                        type="button"
                        class="btn btn-primary business-view-btn"
                        data-business-id="${escapeHTML(
                            business.id
                        )}"
                    >
                        View Business
                    </button>

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
            getBusinessGrid();


        const noResults =
            document.getElementById(
                "noResults"
            );


        if (!grid) {
            return;
        }


        if (
            !businesses ||
            businesses.length === 0
        ) {

            grid.innerHTML =
                "";


            if (noResults) {

                noResults.style.display =
                    "block";
            }


            return;
        }


        if (noResults) {

            noResults.style.display =
                "none";
        }


        grid.innerHTML =
            businesses
                .map(
                    createBusinessCard
                )
                .join("");


        grid
            .querySelectorAll(
                ".business-view-btn"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        function () {

                            openBusiness(
                                this.dataset.businessId
                            );

                        }
                    );

                }
            );
    }


    /* =====================================================
       VIEW BUSINESS
    ===================================================== */

    function openBusiness(
        businessId
    ) {

        const businesses =
            window.losojaBusinesses ||
            [];


        const business =
            businesses.find(
                item =>
                    String(
                        item.id
                    ) ===
                    String(
                        businessId
                    )
            );


        if (!business) {

            notify(
                "Business could not be found.",
                "error"
            );

            return;
        }


        const container =
            document.getElementById(
                "businessDetailsContent"
            );


        if (!container) {

            console.error(
                "LosOja: businessDetailsContent not found."
            );

            return;
        }


        const currentUserId =
            getCurrentUserId();


        const isOwner =
            currentUserId &&
            business.user_id &&
            String(
                currentUserId
            ) ===
            String(
                business.user_id
            );


        container.innerHTML = `

            <div class="business-details">

                ${
                    business.image_url
                        ? `
                            <div class="business-details-main-image">

                                <img
                                    src="${escapeHTML(
                                        business.image_url
                                    )}"
                                    alt="${escapeHTML(
                                        business.name ||
                                        "Business"
                                    )}"
                                >

                            </div>
                        `
                        : ""
                }

                <span class="business-category">
                    ${escapeHTML(
                        business.category ||
                        "Business"
                    )}
                </span>

                <h2>
                    ${escapeHTML(
                        business.name ||
                        "Unnamed Business"
                    )}
                </h2>

                <p>
                    <strong>Location:</strong>
                    ${escapeHTML(
                        business.location ||
                        "Not provided"
                    )}
                </p>

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

                ${
                    business.description
                        ? `
                            <div class="business-details-description">

                                <h3>
                                    About this business
                                </h3>

                                <p>
                                    ${escapeHTML(
                                        business.description
                                    )}
                                </p>

                            </div>
                        `
                        : ""
                }

                <div class="business-details-actions">

                    ${
                        business.phone
                            ? `
                                <a
                                    href="tel:${escapeHTML(
                                        business.phone
                                    )}"
                                    class="btn btn-primary"
                                >
                                    📞 Call
                                </a>
                            `
                            : ""
                    }

                    ${
                        business.phone
                            ? `
                                <a
                                    href="https://wa.me/${formatWhatsAppNumber(
                                        business.phone
                                    )}"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="btn btn-secondary"
                                >
                                    💬 WhatsApp
                                </a>
                            `
                            : ""
                    }

                    ${
                        isOwner
                            ? `
                                <button
                                    type="button"
                                    class="btn btn-secondary"
                                    id="businessEditBtn"
                                >
                                    Edit Business
                                </button>

                                <button
                                    type="button"
                                    class="btn btn-danger"
                                    id="businessDeleteBtn"
                                >
                                    Delete Business
                                </button>
                            `
                            : ""
                    }

                </div>

            </div>
        `;


        if (isOwner) {

            const editButton =
                document.getElementById(
                    "businessEditBtn"
                );


            if (editButton) {

                editButton.addEventListener(
                    "click",
                    function () {

                        closeModal(
                            "businessDetailsModal"
                        );

                        openEditBusiness(
                            business
                        );
                    }
                );
            }


            const deleteButton =
                document.getElementById(
                    "businessDeleteBtn"
                );


            if (deleteButton) {

                deleteButton.addEventListener(
                    "click",
                    function () {

                        deleteBusiness(
                            business.id
                        );
                    }
                );
            }
        }


        openModal(
            "businessDetailsModal"
        );
    }


    /* =====================================================
       WHATSAPP NUMBER FORMAT
    ===================================================== */

    function formatWhatsAppNumber(
        phone
    ) {

        if (!phone) {
            return "";
        }


        let number =
            String(
                phone
            )
                .replace(
                    /[^0-9+]/g,
                    ""
                );


        if (
            number.startsWith(
                "+234"
            )
        ) {

            return number
                .replace(
                    /[^0-9]/g,
                    ""
                );
        }


        if (
            number.startsWith(
                "234"
            )
        ) {

            return number;
        }


        if (
            number.startsWith(
                "0"
            )
        ) {

            return (
                "234" +
                number.substring(1)
            );
        }


        return number.replace(
            /[^0-9]/g,
            ""
        );
    }


    /* =====================================================
       ADD BUSINESS
    ===================================================== */

    async function openAddBusiness() {

        const user =
            getCurrentUser();


        if (!user) {

            if (
                typeof window.openLogin ===
                "function"
            ) {

                window.openLogin();

            } else {

                openModal(
                    "loginModal"
                );
            }


            return;
        }


        const form =
            document.getElementById(
                "addBusinessForm"
            );


        if (form) {
            form.reset();
        }


        const error =
            document.getElementById(
                "addBusinessError"
            );


        if (error) {

            error.textContent =
                "";

            error.style.display =
                "none";
        }


        openModal(
            "addBusinessModal"
        );
    }


    async function addBusiness(
        event
    ) {

        if (event) {
            event.preventDefault();
        }


        const userId =
            getCurrentUserId();


        const errorElement =
            document.getElementById(
                "addBusinessError"
            );


        if (!userId) {

            if (errorElement) {

                errorElement.textContent =
                    "Please log in before adding a business.";

                errorElement.style.display =
                    "block";
            }

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


        const phone =
            document.getElementById(
                "businessPhone"
            )?.value.trim();


        const description =
            document.getElementById(
                "businessDescription"
            )?.value.trim();


        if (!name) {

            showFormError(
                "addBusinessError",
                "Please enter a business name."
            );

            return;
        }


        if (!category) {

            showFormError(
                "addBusinessError",
                "Please select a category."
            );

            return;
        }


        if (!location) {

            showFormError(
                "addBusinessError",
                "Please enter a location."
            );

            return;
        }


        const button =
            document.querySelector(
                "#addBusinessForm button[type='submit']"
            );


        if (button) {

            button.disabled =
                true;

            button.dataset.oldText =
                button.textContent;

            button.textContent =
                "Saving...";
        }


        try {

            const payload = {

                name,

                category,

                location,

                phone:
                    phone || null,

                description:
                    description || null,

                user_id:
                    userId
            };


            const response =
                await supabaseRequest(
                    `${SUPABASE_URL}/rest/v1/businesses`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",

                            "Prefer":
                                "return=representation"
                        },

                        body:
                            JSON.stringify(
                                payload
                            )
                    }
                );


            const text =
                await response.text();


            if (!response.ok) {

                console.error(
                    "LosOja add business error:",
                    response.status,
                    text
                );

                throw new Error(
                    "Business could not be saved."
                );
            }


            closeModal(
                "addBusinessModal"
            );


            notify(
                "Business added successfully.",
                "success"
            );


            await loadBusinesses();


        } catch (error) {

            console.error(
                "LosOja add business error:",
                error
            );


            showFormError(
                "addBusinessError",
                error.message ||
                "Business could not be saved."
            );


        } finally {

            if (button) {

                button.disabled =
                    false;

                button.textContent =
                    button.dataset.oldText ||
                    "Save Business";
            }
        }
    }


    /* =====================================================
       EDIT BUSINESS
    ===================================================== */

    function openEditBusiness(
        business
    ) {

        if (!business) {
            return;
        }


        const userId =
            getCurrentUserId();


        if (
            !userId ||
            String(
                userId
            ) !==
            String(
                business.user_id
            )
        ) {

            notify(
                "You can only edit your own business.",
                "error"
            );

            return;
        }


        const id =
            document.getElementById(
                "editBusinessId"
            );


        const name =
            document.getElementById(
                "editBusinessName"
            );


        const category =
            document.getElementById(
                "editBusinessCategory"
            );


        const location =
            document.getElementById(
                "editBusinessLocation"
            );


        const phone =
            document.getElementById(
                "editBusinessPhone"
            );


        const description =
            document.getElementById(
                "editBusinessDescription"
            );


        if (
            !id ||
            !name ||
            !category ||
            !location ||
            !phone ||
            !description
        ) {

            notify(
                "The edit form is missing required fields.",
                "error"
            );

            return;
        }


        id.value =
            business.id || "";


        name.value =
            business.name || "";


        category.value =
            business.category || "";


        location.value =
            business.location || "";


        phone.value =
            business.phone || "";


        description.value =
            business.description || "";


        showFormError(
            "editBusinessError",
            ""
        );


        openModal(
            "editBusinessModal"
        );
    }


    async function saveEditedBusiness(
        event
    ) {

        if (event) {
            event.preventDefault();
        }


        const userId =
            getCurrentUserId();


        if (!userId) {

            showFormError(
                "editBusinessError",
                "Please log in first."
            );

            return;
        }


        const businessId =
            document.getElementById(
                "editBusinessId"
            )?.value.trim();


        const name =
            document.getElementById(
                "editBusinessName"
            )?.value.trim();


        const category =
            document.getElementById(
                "editBusinessCategory"
            )?.value.trim();


        const location =
            document.getElementById(
                "editBusinessLocation"
            )?.value.trim();


        const phone =
            document.getElementById(
                "editBusinessPhone"
            )?.value.trim();


        const description =
            document.getElementById(
                "editBusinessDescription"
            )?.value.trim();


        if (!businessId) {

            showFormError(
                "editBusinessError",
                "Business ID is missing."
            );

            return;
        }


        if (!name) {

            showFormError(
                "editBusinessError",
                "Please enter a business name."
            );

            return;
        }


        if (!category) {

            showFormError(
                "editBusinessError",
                "Please select a category."
            );

            return;
        }


        if (!location) {

            showFormError(
                "editBusinessError",
                "Please enter a location."
            );

            return;
        }


        const button =
            document.querySelector(
                "#editBusinessForm button[type='submit']"
            );


        if (button) {

            button.disabled =
                true;

            button.dataset.oldText =
                button.textContent;

            button.textContent =
                "Saving...";
        }


        try {

            const payload = {

                name,

                category,

                location,

                phone:
                    phone || null,

                description:
                    description || null
            };


            const response =
                await supabaseRequest(
                    `${SUPABASE_URL}/rest/v1/businesses?id=eq.${encodeURIComponent(
                        businessId
                    )}&user_id=eq.${encodeURIComponent(
                        userId
                    )}`,
                    {
                        method: "PATCH",

                        headers: {
                            "Content-Type":
                                "application/json",

                            "Prefer":
                                "return=representation"
                        },

                        body:
                            JSON.stringify(
                                payload
                            )
                    }
                );


            const text =
                await response.text();


            if (!response.ok) {

                console.error(
                    "LosOja edit error:",
                    response.status,
                    text
                );

                throw new Error(
                    "Business could not be updated."
                );
            }


            closeModal(
                "editBusinessModal"
            );


            notify(
                "Business updated successfully.",
                "success"
            );


            await loadBusinesses();


        } catch (error) {

            console.error(
                "LosOja edit business error:",
                error
            );


            showFormError(
                "editBusinessError",
                error.message ||
                "Business could not be updated."
            );


        } finally {

            if (button) {

                button.disabled =
                    false;

                button.textContent =
                    button.dataset.oldText ||
                    "Save Changes";
            }
        }
    }


    /* =====================================================
       DELETE BUSINESS
    ===================================================== */

    async function deleteBusiness(
        businessId
    ) {

        if (!businessId) {
            return;
        }


        const confirmed =
            confirm(
                "Are you sure you want to delete this business?"
            );


        if (!confirmed) {
            return;
        }


        const userId =
            getCurrentUserId();


        if (!userId) {

            notify(
                "Please log in first.",
                "error"
            );

            return;
        }


        try {

            const response =
                await supabaseRequest(
                    `${SUPABASE_URL}/rest/v1/businesses?id=eq.${encodeURIComponent(
                        businessId
                    )}&user_id=eq.${encodeURIComponent(
                        userId
                    )}`,
                    {
                        method: "DELETE"
                    }
                );


            const text =
                await response.text();


            if (!response.ok) {

                console.error(
                    "LosOja delete error:",
                    response.status,
                    text
                );

                throw new Error(
                    "Business could not be deleted."
                );
            }


            closeModal(
                "businessDetailsModal"
            );


            notify(
                "Business deleted successfully.",
                "success"
            );


            await loadBusinesses();


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
       FORM ERROR
    ===================================================== */

    function showFormError(
        id,
        message
    ) {

        const element =
            document.getElementById(
                id
            );


        if (!element) {
            return;
        }


        element.textContent =
            message || "";


        element.style.display =
            message
                ? "block"
                : "none";
    }


    /* =====================================================
       SEARCH
    ===================================================== */

    function searchBusinesses(
        searchTerm,
        locationTerm
    ) {

        const businesses =
            window.losojaBusinesses ||
            [];


        const search =
            String(
                searchTerm || ""
            )
                .trim()
                .toLowerCase();


        const location =
            String(
                locationTerm || ""
            )
                .trim()
                .toLowerCase();


        const filtered =
            businesses.filter(
                business => {

                    const text =
                        [
                            business.name,
                            business.category,
                            business.location,
                            business.description,
                            business.phone
                        ]
                            .filter(Boolean)
                            .join(" ")
                            .toLowerCase();


                    const matchesSearch =
                        !search ||
                        text.includes(
                            search
                        );


                    const matchesLocation =
                        !location ||
                        String(
                            business.location ||
                            ""
                        )
                            .toLowerCase()
                            .includes(
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
    }


    /* =====================================================
       CATEGORY FILTER
    ===================================================== */

    function filterBusinessesByCategory(
        category
    ) {

        const businesses =
            window.losojaBusinesses ||
            [];


        if (!category) {

            renderBusinesses(
                businesses
            );

            return;
        }


        const selected =
            String(
                category
            )
                .trim()
                .toLowerCase();


        const filtered =
            businesses.filter(
                business =>
                    String(
                        business.category ||
                        ""
                    )
                        .trim()
                        .toLowerCase() ===
                    selected
            );


        renderBusinesses(
            filtered
        );
    }


    /* =====================================================
       EVENTS
    ===================================================== */

    function setupEvents() {

        /*
         * Add Business button
         */

        document.addEventListener(
            "click",
            function (event) {

                const button =
                    event.target.closest(
                        "#addBusinessBtn, .add-business-btn"
                    );


                if (!button) {
                    return;
                }


                event.preventDefault();


                openAddBusiness();
            }
        );


        /*
         * View Business buttons
         */

        document.addEventListener(
            "click",
            function (event) {

                const button =
                    event.target.closest(
                        ".business-view-btn"
                    );


                if (!button) {
                    return;
                }


                openBusiness(
                    button.dataset.businessId
                );
            }
        );


        /*
         * Add form
         */

        const addForm =
            document.getElementById(
                "addBusinessForm"
            );


        if (addForm) {

            addForm.addEventListener(
                "submit",
                addBusiness
            );
        }


        /*
         * Edit form
         */

        const editForm =
            document.getElementById(
                "editBusinessForm"
            );


        if (editForm) {

            editForm.addEventListener(
                "submit",
                saveEditedBusiness
            );
        }


        /*
         * Close modal buttons
         */

        document
            .querySelectorAll(
                "[data-close-modal]"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        function () {

                            closeModal(
                                this.dataset.closeModal
                            );
                        }
                    );
                }
            );


        /*
         * Search
         */

        const searchForm =
            document.getElementById(
                "searchForm"
            );


        if (searchForm) {

            searchForm.addEventListener(
                "submit",
                function (event) {

                    event.preventDefault();


                    const searchInput =
                        document.getElementById(
                            "searchInput"
                        );


                    const locationInput =
                        document.getElementById(
                            "locationInput"
                        );


                    searchBusinesses(

                        searchInput
                            ? searchInput.value
                            : "",

                        locationInput
                            ? locationInput.value
                            : ""
                    );
                }
            );
        }


        /*
         * Category cards
         */

        document
            .querySelectorAll(
                ".category-card[data-category]"
            )
            .forEach(
                card => {

                    card.addEventListener(
                        "click",
                        function () {

                            filterBusinessesByCategory(
                                this.dataset.category
                            );
                        }
                    );
                }
            );


        /*
         * Close modal when clicking outside.
         */

        document
            .querySelectorAll(
                ".modal-overlay"
            )
            .forEach(
                modal => {

                    modal.addEventListener(
                        "click",
                        function (event) {

                            if (
                                event.target ===
                                modal
                            ) {

                                closeModal(
                                    modal.id
                                );
                            }
                        }
                    );
                }
            );
    }


    /* =====================================================
       INITIALIZE
    ===================================================== */

    function init() {

        setupEvents();

        loadBusinesses();
    }


    /* =====================================================
       PUBLIC API
    ===================================================== */

    window.LosOjaBusinesses = {

        init,

        loadBusinesses,

        renderBusinesses,

        searchBusinesses,

        filterBusinessesByCategory,

        openBusiness,

        openAddBusiness,

        openEditBusiness,

        addBusiness,

        saveEditedBusiness,

        deleteBusiness

    };


    /*
     * Compatibility globals
     */

    window.loadBusinesses =
        loadBusinesses;

    window.openBusiness =
        openBusiness;

    window.openAddBusiness =
        openAddBusiness;

    window.openEditBusiness =
        openEditBusiness;

    window.deleteBusiness =
        deleteBusiness;

    window.searchBusinesses =
        searchBusinesses;

    window.filterBusinessesByCategory =
        filterBusinessesByCategory;


    /* =====================================================
       START
    ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            init
        );

    } else {

        init();
    }


})();
