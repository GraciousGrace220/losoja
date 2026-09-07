/*
=========================================================
LosOja - Business Management
js/businesses.js

Handles:
- Loading businesses from Supabase
- Displaying businesses
- Searching/filtering businesses
- Category buttons
- Viewing business details
- Adding businesses
- Editing businesses
- Deleting businesses
- Business image upload
- Business image preview
- Add Business buttons
- Modal handling

IMPORTANT:
- Uses the existing Supabase project
- Uses the existing business-images bucket
- Does NOT create a second Supabase client
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

    const SESSION_KEY =
        "losoja_supabase_session";

    const STORAGE_BUCKET =
        "business-images";

    const MAX_IMAGE_SIZE =
        5 * 1024 * 1024;

    const ALLOWED_IMAGE_TYPES = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/gif"
    ];


    /* =====================================================
       INTERNAL STATE
    ===================================================== */

    let allBusinesses = [];

    let businessesLoaded = false;

    let loadingBusinesses = false;


    /* =====================================================
       SESSION HELPERS
    ===================================================== */

    function getSession() {

        try {

            const raw =
                localStorage.getItem(SESSION_KEY);

            if (!raw) {
                return null;
            }

            const session =
                JSON.parse(raw);

            if (!session) {
                return null;
            }

            return session;

        } catch (error) {

            console.error(
                "LosOja: Could not read session.",
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


    function getCurrentUserId() {

        const session =
            getSession();

        if (!session) {
            return null;
        }

        if (
            session.user &&
            session.user.id
        ) {

            return session.user.id;
        }

        if (session.user_id) {
            return session.user_id;
        }

        return null;
    }


    function isLoggedIn() {

        return !!getAccessToken();
    }


    /* =====================================================
       SUPABASE HEADERS
    ===================================================== */

    function getHeaders(includeContentType) {

        const headers = {

            "apikey":
                LOSOJA_BUSINESSES_KEY,

            "Authorization":
                "Bearer " +
                (
                    getAccessToken() ||
                    LOSOJA_BUSINESSES_KEY
                )
        };

        if (includeContentType) {

            headers["Content-Type"] =
                "application/json";
        }

        return headers;
    }


    /* =====================================================
       NOTIFICATION
    ===================================================== */

    function showNotification(
        message,
        type
    ) {

        type =
            type || "success";

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
            typeof window.showLosOjaNotification ===
            "function"
        ) {

            window.showLosOjaNotification(
                message,
                type
            );

            return;
        }

        console.log(
            "[LosOja]",
            type,
            message
        );
    }


    /* =====================================================
       ERROR DISPLAY
    ===================================================== */

    function setError(
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
            message || "";

        if (message) {

            element.classList.remove(
                "hidden"
            );

        } else {

            element.classList.add(
                "hidden"
            );
        }
    }


    /* =====================================================
       MODALS
    ===================================================== */

    function openModal(id) {

        const modal =
            document.getElementById(id);

        if (!modal) {

            console.warn(
                "LosOja: Modal not found:",
                id
            );

            return;
        }

        modal.classList.add("active");

        modal.classList.remove("hidden");

        modal.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.classList.add(
            "modal-open"
        );
    }


    function closeModal(id) {

        const modal =
            document.getElementById(id);

        if (!modal) {
            return;
        }

        modal.classList.remove("active");

        modal.setAttribute(
            "aria-hidden",
            "true"
        );

        document.body.classList.remove(
            "modal-open"
        );
    }


    function closeAllBusinessModals() {

        closeModal(
            "addBusinessModal"
        );

        closeModal(
            "businessDetailsModal"
        );

        closeModal(
            "editBusinessModal"
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

        buttons.forEach(function (button) {

            if (
                button.dataset
                    .losojaAddBusinessReady ===
                "true"
            ) {

                return;
            }

            button.dataset
                .losojaAddBusinessReady =
                "true";

            button.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    if (!isLoggedIn()) {

                        showNotification(
                            "Please log in before adding a business.",
                            "error"
                        );

                        if (
                            typeof window.openLoginModal ===
                            "function"
                        ) {

                            window.openLoginModal();

                        } else {

                            openModal(
                                "loginModal"
                            );
                        }

                        return;
                    }

                    resetAddBusinessForm();

                    openModal(
                        "addBusinessModal"
                    );

                    const nameInput =
                        document.getElementById(
                            "businessName"
                        );

                    if (nameInput) {

                        setTimeout(
                            function () {

                                nameInput.focus();

                            },
                            100
                        );
                    }
                }
            );

        });
    }


    /* =====================================================
       FORM RESET
    ===================================================== */

    function resetAddBusinessForm() {

        const form =
            document.getElementById(
                "addBusinessForm"
            );

        if (form) {
            form.reset();
        }

        setError(
            "addBusinessError",
            ""
        );

        const preview =
            document.getElementById(
                "imagePreview"
            );

        if (preview) {

            preview.innerHTML =
                "No image selected.";

            preview.classList.add(
                "hidden"
            );
        }
    }


    function resetEditBusinessForm() {

        const form =
            document.getElementById(
                "editBusinessForm"
            );

        if (form) {
            form.reset();
        }

        setError(
            "editBusinessError",
            ""
        );

        const preview =
            document.getElementById(
                "editImagePreview"
            );

        if (preview) {

            preview.innerHTML =
                "No image selected.";

            preview.classList.add(
                "hidden"
            );
        }
    }


    /* =====================================================
       IMAGE PREVIEW
    ===================================================== */

    function previewBusinessImage(
        inputId,
        previewId
    ) {

        const input =
            document.getElementById(
                inputId
            );

        const preview =
            document.getElementById(
                previewId
            );

        if (!input || !preview) {
            return;
        }

        if (
            input.dataset
                .losojaImagePreviewReady ===
            "true"
        ) {

            return;
        }

        input.dataset
            .losojaImagePreviewReady =
            "true";

        input.addEventListener(
            "change",
            function () {

                preview.innerHTML = "";

                const file =
                    input.files &&
                    input.files[0];

                if (!file) {

                    preview.classList.add(
                        "hidden"
                    );

                    return;
                }

                if (
                    !ALLOWED_IMAGE_TYPES.includes(
                        file.type
                    )
                ) {

                    preview.innerHTML =
                        "Please select a JPG, PNG, WEBP, or GIF image.";

                    preview.classList.remove(
                        "hidden"
                    );

                    input.value = "";

                    return;
                }

                if (
                    file.size >
                    MAX_IMAGE_SIZE
                ) {

                    preview.innerHTML =
                        "Image is too large. Maximum size is 5MB.";

                    preview.classList.remove(
                        "hidden"
                    );

                    input.value = "";

                    return;
                }

                const image =
                    document.createElement(
                        "img"
                    );

                image.alt =
                    "Selected business image";

                image.src =
                    URL.createObjectURL(
                        file
                    );

                image.onload =
                    function () {

                        URL.revokeObjectURL(
                            image.src
                        );
                    };

                preview.appendChild(
                    image
                );

                preview.classList.remove(
                    "hidden"
                );
            }
        );
    }


    /* =====================================================
       IMAGE UPLOAD
    ===================================================== */

    async function uploadBusinessImage(
        file
    ) {

        if (!file) {
            return null;
        }

        if (
            !ALLOWED_IMAGE_TYPES.includes(
                file.type
            )
        ) {

            throw new Error(
                "Please select a valid image file."
            );
        }

        if (
            file.size >
            MAX_IMAGE_SIZE
        ) {

            throw new Error(
                "Image is too large. Maximum size is 5MB."
            );
        }

        const userId =
            getCurrentUserId();

        if (!userId) {

            throw new Error(
                "You must be logged in to upload a business image."
            );
        }

        const extensionMap = {

            "image/jpeg": "jpg",

            "image/jpg": "jpg",

            "image/png": "png",

            "image/webp": "webp",

            "image/gif": "gif"
        };

        const extension =
            extensionMap[file.type] ||
            "jpg";

        const randomPart =
            Math.random()
                .toString(36)
                .substring(2, 10);

        const fileName =
            Date.now() +
            "-" +
            randomPart +
            "." +
            extension;

        const filePath =
            userId +
            "/" +
            fileName;

        const uploadUrl =
            LOSOJA_BUSINESSES_URL +
            "/storage/v1/object/" +
            STORAGE_BUCKET +
            "/" +
            filePath;

        const response =
            await fetch(
                uploadUrl,
                {
                    method: "POST",

                    headers: {

                        "apikey":
                            LOSOJA_BUSINESSES_KEY,

                        "Authorization":
                            "Bearer " +
                            getAccessToken(),

                        "Content-Type":
                            file.type,

                        "x-upsert":
                            "false"
                    },

                    body: file
                }
            );

        if (!response.ok) {

            let errorMessage =
                "Image upload failed.";

            try {

                const errorData =
                    await response.json();

                if (
                    errorData &&
                    errorData.message
                ) {

                    errorMessage =
                        errorData.message;

                } else if (
                    errorData &&
                    errorData.error
                ) {

                    errorMessage =
                        errorData.error;
                }

            } catch (error) {
                // Keep default message.
            }

            throw new Error(
                errorMessage
            );
        }

        return (
            LOSOJA_BUSINESSES_URL +
            "/storage/v1/object/public/" +
            STORAGE_BUCKET +
            "/" +
            filePath
        );
    }


    /* =====================================================
       LOAD BUSINESSES
    ===================================================== */

    async function loadBusinesses() {

        if (loadingBusinesses) {
            return;
        }

        loadingBusinesses = true;

        renderLoadingState();

        try {

            const url =
                LOSOJA_BUSINESSES_URL +
                "/rest/v1/businesses" +
                "?select=*" +
                "&order=created_at.desc";

            const response =
                await fetch(
                    url,
                    {
                        method: "GET",

                        headers:
                            getHeaders(false)
                    }
                );

            if (!response.ok) {

                const errorText =
                    await response.text();

                throw new Error(
                    errorText ||
                    "Could not load businesses."
                );
            }

            const data =
                await response.json();

            allBusinesses =
                Array.isArray(data)
                    ? data
                    : [];

            businessesLoaded =
                true;

            renderBusinesses(
                allBusinesses
            );

        } catch (error) {

            console.error(
                "LosOja: Error loading businesses:",
                error
            );

            allBusinesses = [];

            renderBusinesses([]);

            showNotification(
                "Businesses could not be loaded. Please refresh and try again.",
                "error"
            );

        } finally {

            loadingBusinesses = false;
        }
    }


    /* =====================================================
       LOADING STATE
    ===================================================== */

    function renderLoadingState() {

        const grid =
            getBusinessGrid();

        if (!grid) {
            return;
        }

        grid.innerHTML = `
            <div class="business-loading">
                <p>Loading businesses...</p>
            </div>
        `;
    }


    /* =====================================================
       GET BUSINESS GRID
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
       BUSINESS IMAGE HTML
    ===================================================== */

    function businessImageHTML(
        business
    ) {

        if (
            business &&
            business.image_url
        ) {

            return `
                <div class="business-image">

                    <img
                        src="${escapeAttribute(
                            business.image_url
                        )}"
                        alt="${escapeAttribute(
                            business.name ||
                            "Business image"
                        )}"
                        loading="lazy"
                        onerror="this.style.display='none'; this.parentElement.innerHTML='🏪';"
                    >

                </div>
            `;
        }

        return `
            <div class="business-image">
                🏪
            </div>
        `;
    }


    /* =====================================================
       BUSINESS CARD
    ===================================================== */

    function businessCard(
        business
    ) {

        const name =
            business.name ||
            "Unnamed Business";

        const category =
            business.category ||
            "Business";

        const location =
            business.location ||
            "Location not provided";

        const phone =
            business.phone ||
            "";

        return `
            <article
                class="business-card"
                data-business-id="${escapeAttribute(
                    business.id
                )}"
            >

                ${businessImageHTML(
                    business
                )}

                <div class="business-card-content">

                    <h3>
                        ${escapeHTML(
                            name
                        )}
                    </h3>

                    <p class="business-category">
                        ${escapeHTML(
                            category
                        )}
                    </p>

                    <p class="business-location">
                        📍
                        ${escapeHTML(
                            location
                        )}
                    </p>

                    ${
                        phone
                            ? `
                                <p class="business-phone">
                                    📞
                                    ${escapeHTML(
                                        phone
                                    )}
                                </p>
                            `
                            : ""
                    }

                    <button
                        type="button"
                        class="btn btn-primary view-business-btn"
                        data-business-id="${escapeAttribute(
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

        if (!grid) {

            console.warn(
                "LosOja: Business grid not found. Expected #businessGrid or #businessesGrid."
            );

            return;
        }

        if (
            !Array.isArray(
                businesses
            ) ||
            businesses.length === 0
        ) {

            grid.innerHTML = `
                <div class="business-empty">
                    <p>No businesses found.</p>
                </div>
            `;

            return;
        }

        grid.innerHTML =
            businesses
                .map(
                    businessCard
                )
                .join("");

        setupBusinessCardButtons();
    }


    /* =====================================================
       BUSINESS CARD BUTTONS
    ===================================================== */

    function setupBusinessCardButtons() {

        const buttons =
            document.querySelectorAll(
                ".view-business-btn"
            );

        buttons.forEach(function (button) {

            if (
                button.dataset
                    .losojaViewBusinessReady ===
                "true"
            ) {

                return;
            }

            button.dataset
                .losojaViewBusinessReady =
                "true";

            button.addEventListener(
                "click",
                function () {

                    const businessId =
                        button.dataset
                            .businessId;

                    openBusiness(
                        businessId
                    );
                }
            );

        });
    }


    /* =====================================================
       OPEN BUSINESS
    ===================================================== */

    function openBusiness(
        businessId
    ) {

        if (!businessId) {
            return;
        }

        const business =
            allBusinesses.find(
                function (item) {

                    return (
                        String(
                            item.id
                        ) ===
                        String(
                            businessId
                        )
                    );
                }
            );

        if (!business) {

            showNotification(
                "Business could not be found.",
                "error"
            );

            return;
        }

        const container =
            document.getElementById(
                "businessDetails"
            );

        if (!container) {
            return;
        }

        const phone =
            business.phone ||
            "";

        const description =
            business.description ||
            "No description provided.";

        const ownerId =
            business.user_id ||
            "";

        const currentUserId =
            getCurrentUserId();

        const isOwner =
            !!currentUserId &&
            !!ownerId &&
            String(
                currentUserId
            ) ===
            String(
                ownerId
            );

        container.innerHTML = `

            <div class="business-detail-image">

                ${
                    business.image_url
                        ? `
                            <img
                                src="${escapeAttribute(
                                    business.image_url
                                )}"
                                alt="${escapeAttribute(
                                    business.name ||
                                    "Business image"
                                )}"
                                onerror="this.style.display='none';"
                            >
                        `
                        : `
                            <div class="business-detail-placeholder">
                                🏪
                            </div>
                        `
                }

            </div>

            <div class="business-detail-content">

                <h2>
                    ${escapeHTML(
                        business.name ||
                        "Unnamed Business"
                    )}
                </h2>

                <p>
                    <strong>Category:</strong>
                    ${escapeHTML(
                        business.category ||
                        "Business"
                    )}
                </p>

                <p>
                    <strong>Location:</strong>
                    ${escapeHTML(
                        business.location ||
                        "Not provided"
                    )}
                </p>

                ${
                    phone
                        ? `
                            <p>
                                <strong>Phone:</strong>
                                ${escapeHTML(
                                    phone
                                )}
                            </p>
                        `
                        : ""
                }

                <div class="business-description">

                    <h3>
                        About this business
                    </h3>

                    <p>
                        ${escapeHTML(
                            description
                        )}
                    </p>

                </div>

                ${
                    phone
                        ? `
                            <a
                                class="btn btn-primary"
                                href="tel:${escapeAttribute(
                                    phone
                                )}"
                            >
                                📞 Call Business
                            </a>
                        `
                        : ""
                }

                ${
                    isOwner
                        ? `
                            <div class="business-owner-actions">

                                <button
                                    type="button"
                                    class="btn btn-secondary"
                                    id="editBusinessFromDetails"
                                >
                                    Edit Business
                                </button>

                                <button
                                    type="button"
                                    class="btn btn-danger"
                                    id="deleteBusinessFromDetails"
                                >
                                    Delete Business
                                </button>

                            </div>
                        `
                        : ""
                }

                <div
                    id="businessReviewsContainer"
                    class="business-reviews-container"
                    data-business-id="${escapeAttribute(
                        business.id
                    )}"
                >
                </div>

            </div>
        `;

        openModal(
            "businessDetailsModal"
        );

        const editButton =
            document.getElementById(
                "editBusinessFromDetails"
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
                "deleteBusinessFromDetails"
            );

        if (deleteButton) {

            deleteButton.addEventListener(
                "click",
                async function () {

                    await deleteBusiness(
                        business.id
                    );
                }
            );
        }

        renderBusinessReviews(
            business.id
        );
    }


    /* =====================================================
       REVIEWS
    ===================================================== */

    function renderBusinessReviews(
        businessId
    ) {

        const container =
            document.getElementById(
                "businessReviewsContainer"
            );

        if (!container) {
            return;
        }

        if (
            window.Reviews &&
            typeof window.Reviews.render ===
            "function"
        ) {

            try {

                window.Reviews.render(
                    businessId,
                    container
                );

                return;

            } catch (error) {

                console.error(
                    "LosOja: Reviews render error:",
                    error
                );
            }
        }

        if (
            window.Reviews &&
            typeof window.Reviews.renderReviews ===
            "function"
        ) {

            try {

                window.Reviews.renderReviews(
                    businessId,
                    container
                );

                return;

            } catch (error) {

                console.error(
                    "LosOja: Reviews renderReviews error:",
                    error
                );
            }
        }

        container.innerHTML = "";
    }


    /* =====================================================
       ADD BUSINESS
    ===================================================== */

    async function addBusiness(
        event
    ) {

        if (event) {
            event.preventDefault();
        }

        setError(
            "addBusinessError",
            ""
        );

        if (!isLoggedIn()) {

            setError(
                "addBusinessError",
                "Please log in before adding a business."
            );

            return false;
        }

        const nameInput =
            document.getElementById(
                "businessName"
            );

        const categoryInput =
            document.getElementById(
                "businessCategory"
            );

        const locationInput =
            document.getElementById(
                "businessLocation"
            );

        const descriptionInput =
            document.getElementById(
                "businessDescription"
            );

        const phoneInput =
            document.getElementById(
                "businessPhone"
            );

        const imageInput =
            document.getElementById(
                "businessImage"
            );

        if (
            !nameInput ||
            !categoryInput ||
            !locationInput ||
            !descriptionInput ||
            !phoneInput
        ) {

            setError(
                "addBusinessError",
                "The business form is missing required fields."
            );

            console.error(
                "LosOja: Add Business form fields are missing."
            );

            return false;
        }

        const name =
            nameInput.value.trim();

        const category =
            categoryInput.value.trim();

        const location =
            locationInput.value.trim();

        const description =
            descriptionInput.value.trim();

        const phone =
            phoneInput.value.trim();

        if (!name) {

            setError(
                "addBusinessError",
                "Please enter the business name."
            );

            nameInput.focus();

            return false;
        }

        if (!category) {

            setError(
                "addBusinessError",
                "Please select or enter a business category."
            );

            categoryInput.focus();

            return false;
        }

        if (!location) {

            setError(
                "addBusinessError",
                "Please enter the business location."
            );

            locationInput.focus();

            return false;
        }

        if (!description) {

            setError(
                "addBusinessError",
                "Please enter a business description."
            );

            descriptionInput.focus();

            return false;
        }

        const submitButton =
            document.querySelector(
                "#addBusinessForm button[type='submit']"
            );

        const originalText =
            submitButton
                ? submitButton.textContent
                : "";

        try {

            if (submitButton) {

                submitButton.disabled =
                    true;

                submitButton.textContent =
                    "Saving...";
            }

            let imageUrl =
                null;

            const imageFile =
                imageInput &&
                imageInput.files &&
                imageInput.files[0]
                    ? imageInput.files[0]
                    : null;

            if (imageFile) {

                if (submitButton) {

                    submitButton.textContent =
                        "Uploading image...";
                }

                imageUrl =
                    await uploadBusinessImage(
                        imageFile
                    );
            }

            if (submitButton) {

                submitButton.textContent =
                    "Saving business...";
            }

            const userId =
                getCurrentUserId();

            if (!userId) {

                throw new Error(
                    "Your login session could not be found. Please log in again."
                );
            }

            const businessData = {

                name:
                    name,

                category:
                    category,

                location:
                    location,

                phone:
                    phone,

                description:
                    description,

                user_id:
                    userId
            };

            if (imageUrl) {

                businessData.image_url =
                    imageUrl;
            }

            const response =
                await fetch(
                    LOSOJA_BUSINESSES_URL +
                    "/rest/v1/businesses",
                    {
                        method: "POST",

                        headers: {

                            ...getHeaders(true),

                            "Prefer":
                                "return=representation"
                        },

                        body:
                            JSON.stringify(
                                businessData
                            )
                    }
                );

            if (!response.ok) {

                const errorText =
                    await response.text();

                console.error(
                    "LosOja: Supabase business save error:",
                    errorText
                );

                throw new Error(
                    extractSupabaseError(
                        errorText
                    )
                );
            }

            const savedBusiness =
                await response.json();

            const newBusiness =
                Array.isArray(
                    savedBusiness
                )
                    ? savedBusiness[0]
                    : savedBusiness;

            if (newBusiness) {

                allBusinesses.unshift(
                    newBusiness
                );
            }

            businessesLoaded =
                true;

            renderBusinesses(
                allBusinesses
            );

            closeModal(
                "addBusinessModal"
            );

            resetAddBusinessForm();

            showNotification(
                "Business added successfully!",
                "success"
            );

            return true;

        } catch (error) {

            console.error(
                "LosOja: Add business error:",
                error
            );

            setError(
                "addBusinessError",
                error.message ||
                "Could not save your business. Please try again."
            );

            return false;

        } finally {

            if (submitButton) {

                submitButton.disabled =
                    false;

                submitButton.textContent =
                    originalText ||
                    "Add Business";
            }
        }
    }


    /* =====================================================
       OPEN EDIT BUSINESS
    ===================================================== */

    function openEditBusiness(
        business
    ) {

        if (!business) {
            return;
        }

        const currentUserId =
            getCurrentUserId();

        if (
            !currentUserId ||
            String(
                currentUserId
            ) !==
            String(
                business.user_id
            )
        ) {

            showNotification(
                "You can only edit your own business.",
                "error"
            );

            return;
        }

        resetEditBusinessForm();

        const idInput =
            document.getElementById(
                "editBusinessId"
            );

        const nameInput =
            document.getElementById(
                "editBusinessName"
            );

        const categoryInput =
            document.getElementById(
                "editBusinessCategory"
            );

        const locationInput =
            document.getElementById(
                "editBusinessLocation"
            );

        const descriptionInput =
            document.getElementById(
                "editBusinessDescription"
            );

        const phoneInput =
            document.getElementById(
                "editBusinessPhone"
            );

        if (idInput) {

            idInput.value =
                business.id || "";
        }

        if (nameInput) {

            nameInput.value =
                business.name || "";
        }

        if (categoryInput) {

            categoryInput.value =
                business.category || "";
        }

        if (locationInput) {

            locationInput.value =
                business.location || "";
        }

        if (descriptionInput) {

            descriptionInput.value =
                business.description || "";
        }

        if (phoneInput) {

            phoneInput.value =
                business.phone || "";
        }

        const imagePreview =
            document.getElementById(
                "editImagePreview"
            );

        if (
            imagePreview &&
            business.image_url
        ) {

            imagePreview.innerHTML = `
                <img
                    src="${escapeAttribute(
                        business.image_url
                    )}"
                    alt="Current business image"
                >
            `;

            imagePreview.classList.remove(
                "hidden"
            );
        }

        openModal(
            "editBusinessModal"
        );
    }


    /* =====================================================
       SAVE EDITED BUSINESS
    ===================================================== */

    async function saveEditedBusiness(
        event
    ) {

        if (event) {
            event.preventDefault();
        }

        setError(
            "editBusinessError",
            ""
        );

        if (!isLoggedIn()) {

            setError(
                "editBusinessError",
                "Please log in again."
            );

            return false;
        }

        const idInput =
            document.getElementById(
                "editBusinessId"
            );

        const nameInput =
            document.getElementById(
                "editBusinessName"
            );

        const categoryInput =
            document.getElementById(
                "editBusinessCategory"
            );

        const locationInput =
            document.getElementById(
                "editBusinessLocation"
            );

        const descriptionInput =
            document.getElementById(
                "editBusinessDescription"
            );

        const phoneInput =
            document.getElementById(
                "editBusinessPhone"
            );

        const imageInput =
            document.getElementById(
                "editBusinessImage"
            );

        if (
            !idInput ||
            !nameInput ||
            !categoryInput ||
            !locationInput ||
            !descriptionInput ||
            !phoneInput
        ) {

            setError(
                "editBusinessError",
                "The edit form is missing required fields."
            );

            return false;
        }

        const businessId =
            idInput.value.trim();

        const name =
            nameInput.value.trim();

        const category =
            categoryInput.value.trim();

        const location =
            locationInput.value.trim();

        const description =
            descriptionInput.value.trim();

        const phone =
            phoneInput.value.trim();

        if (!businessId) {

            setError(
                "editBusinessError",
                "Business ID is missing."
            );

            return false;
        }

        if (!name) {

            setError(
                "editBusinessError",
                "Please enter the business name."
            );

            return false;
        }

        if (!category) {

            setError(
                "editBusinessError",
                "Please select or enter a business category."
            );

            return false;
        }

        if (!location) {

            setError(
                "editBusinessError",
                "Please enter the business location."
            );

            return false;
        }

        if (!description) {

            setError(
                "editBusinessError",
                "Please enter a business description."
            );

            return false;
        }

        const business =
            allBusinesses.find(
                function (item) {

                    return (
                        String(
                            item.id
                        ) ===
                        String(
                            businessId
                        )
                    );
                }
            );

        if (!business) {

            setError(
                "editBusinessError",
                "Business could not be found."
            );

            return false;
        }

        const currentUserId =
            getCurrentUserId();

        if (
            !currentUserId ||
            String(
                business.user_id
            ) !==
            String(
                currentUserId
            )
        ) {

            setError(
                "editBusinessError",
                "You can only edit your own business."
            );

            return false;
        }

        const submitButton =
            document.querySelector(
                "#editBusinessForm button[type='submit']"
            );

        const originalText =
            submitButton
                ? submitButton.textContent
                : "";

        try {

            if (submitButton) {

                submitButton.disabled =
                    true;

                submitButton.textContent =
                    "Saving...";
            }

            const businessData = {

                name:
                    name,

                category:
                    category,

                location:
                    location,

                phone:
                    phone,

                description:
                    description
            };

            const imageFile =
                imageInput &&
                imageInput.files &&
                imageInput.files[0]
                    ? imageInput.files[0]
                    : null;

            if (imageFile) {

                if (submitButton) {

                    submitButton.textContent =
                        "Uploading image...";
                }

                const imageUrl =
                    await uploadBusinessImage(
                        imageFile
                    );

                businessData.image_url =
                    imageUrl;
            }

            if (submitButton) {

                submitButton.textContent =
                    "Updating business...";
            }

            const url =
                LOSOJA_BUSINESSES_URL +
                "/rest/v1/businesses" +
                "?id=eq." +
                encodeURIComponent(
                    businessId
                );

            const response =
                await fetch(
                    url,
                    {
                        method: "PATCH",

                        headers: {

                            ...getHeaders(true),

                            "Prefer":
                                "return=representation"
                        },

                        body:
                            JSON.stringify(
                                businessData
                            )
                    }
                );

            if (!response.ok) {

                const errorText =
                    await response.text();

                console.error(
                    "LosOja: Supabase edit error:",
                    errorText
                );

                throw new Error(
                    extractSupabaseError(
                        errorText
                    )
                );
            }

            const updatedData =
                await response.json();

            const updatedBusiness =
                Array.isArray(
                    updatedData
                )
                    ? updatedData[0]
                    : updatedData;

            const index =
                allBusinesses.findIndex(
                    function (item) {

                        return (
                            String(
                                item.id
                            ) ===
                            String(
                                businessId
                            )
                        );
                    }
                );

            if (
                index !== -1 &&
                updatedBusiness
            ) {

                allBusinesses[index] = {
                    ...allBusinesses[index],
                    ...updatedBusiness
                };
            }

            renderBusinesses(
                allBusinesses
            );

            closeModal(
                "editBusinessModal"
            );

            resetEditBusinessForm();

            showNotification(
                "Business updated successfully!",
                "success"
            );

            return true;

        } catch (error) {

            console.error(
                "LosOja: Edit business error:",
                error
            );

            setError(
                "editBusinessError",
                error.message ||
                "Could not update the business."
            );

            return false;

        } finally {

            if (submitButton) {

                submitButton.disabled =
                    false;

                submitButton.textContent =
                    originalText ||
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
            return false;
        }

        if (!isLoggedIn()) {

            showNotification(
                "Please log in again.",
                "error"
            );

            return false;
        }

        const business =
            allBusinesses.find(
                function (item) {

                    return (
                        String(
                            item.id
                        ) ===
                        String(
                            businessId
                        )
                    );
                }
            );

        if (!business) {

            showNotification(
                "Business could not be found.",
                "error"
            );

            return false;
        }

        const currentUserId =
            getCurrentUserId();

        if (
            !currentUserId ||
            String(
                business.user_id
            ) !==
            String(
                currentUserId
            )
        ) {

            showNotification(
                "You can only delete your own business.",
                "error"
            );

            return false;
        }

        const confirmed =
            window.confirm(
                "Are you sure you want to delete this business?"
            );

        if (!confirmed) {
            return false;
        }

        try {

            const url =
                LOSOJA_BUSINESSES_URL +
                "/rest/v1/businesses" +
                "?id=eq." +
                encodeURIComponent(
                    businessId
                );

            const response =
                await fetch(
                    url,
                    {
                        method: "DELETE",

                        headers:
                            getHeaders(false)
                    }
                );

            if (!response.ok) {

                const errorText =
                    await response.text();

                console.error(
                    "LosOja: Supabase delete error:",
                    errorText
                );

                throw new Error(
                    extractSupabaseError(
                        errorText
                    )
                );
            }

            allBusinesses =
                allBusinesses.filter(
                    function (item) {

                        return (
                            String(
                                item.id
                            ) !==
                            String(
                                businessId
                            )
                        );
                    }
                );

            renderBusinesses(
                allBusinesses
            );

            closeModal(
                "businessDetailsModal"
            );

            showNotification(
                "Business deleted successfully.",
                "success"
            );

            return true;

        } catch (error) {

            console.error(
                "LosOja: Delete business error:",
                error
            );

            showNotification(
                error.message ||
                "Could not delete the business.",
                "error"
            );

            return false;
        }
    }


    /* =====================================================
       SEARCH BUSINESSES
    ===================================================== */

    function searchBusinesses(
        searchTerm
    ) {

        const term =
            String(
                searchTerm || ""
            )
                .trim()
                .toLowerCase();

        if (!term) {

            renderBusinesses(
                allBusinesses
            );

            return allBusinesses;
        }

        const filtered =
            allBusinesses.filter(
                function (business) {

                    const searchableText =
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

                    return searchableText.includes(
                        term
                    );
                }
            );

        renderBusinesses(
            filtered
        );

        return filtered;
    }


    /* =====================================================
       FILTER BY CATEGORY
    ===================================================== */

    function filterByCategory(
        category
    ) {

        const term =
            String(
                category || ""
            )
                .trim()
                .toLowerCase();

        if (!term) {

            renderBusinesses(
                allBusinesses
            );

            return allBusinesses;
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
                        term
                    );
                }
            );

        renderBusinesses(
            filtered
        );

        return filtered;
    }


    /* =====================================================
       CATEGORY BUTTONS
    ===================================================== */

    function setupCategoryButtons() {

        const buttons =
            document.querySelectorAll(
                ".category-card[data-category]"
            );

        if (!buttons.length) {
            return;
        }

        buttons.forEach(function (button) {

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
                function (event) {

                    event.preventDefault();

                    const category =
                        button
                            .getAttribute(
                                "data-category"
                            );

                    if (!category) {
                        return;
                    }

                    /*
                     * Make sure businesses have loaded.
                     */
                    if (!businessesLoaded) {

                        showNotification(
                            "Businesses are still loading. Please try again in a moment.",
                            "error"
                        );

                        return;
                    }

                    /*
                     * Filter businesses directly.
                     */
                    filterByCategory(
                        category
                    );

                    /*
                     * Move to the businesses section.
                     */
                    const businessesSection =
                        document.getElementById(
                            "businesses"
                        );

                    if (businessesSection) {

                        setTimeout(
                            function () {

                                businessesSection.scrollIntoView({
                                    behavior: "smooth",
                                    block: "start"
                                });

                            },
                            50
                        );
                    }

                }
            );

        });
    }


    /* =====================================================
       POPULAR BUSINESSES
    ===================================================== */

    function getPopularBusinesses(
        limit
    ) {

        limit =
            Number(
                limit
            ) || 6;

        return allBusinesses.slice(
            0,
            limit
        );
    }


    /* =====================================================
       FORM SUBMISSION SETUP
    ===================================================== */

    function setupBusinessForms() {

        const addForm =
            document.getElementById(
                "addBusinessForm"
            );

        if (
            addForm &&
            addForm.dataset
                .losojaSubmitReady !==
            "true"
        ) {

            addForm.dataset
                .losojaSubmitReady =
                "true";

            addForm.addEventListener(
                "submit",
                addBusiness
            );
        }


        const editForm =
            document.getElementById(
                "editBusinessForm"
            );

        if (
            editForm &&
            editForm.dataset
                .losojaSubmitReady !==
            "true"
        ) {

            editForm.dataset
                .losojaSubmitReady =
                "true";

            editForm.addEventListener(
                "submit",
                saveEditedBusiness
            );
        }
    }


    /* =====================================================
       CLOSE BUTTON SETUP
    ===================================================== */

    function setupModalButtons() {

        const closeButtons =
            document.querySelectorAll(
                "[data-close-modal]"
            );

        closeButtons.forEach(
            function (button) {

                if (
                    button.dataset
                        .losojaCloseReady ===
                    "true"
                ) {

                    return;
                }

                button.dataset
                    .losojaCloseReady =
                    "true";

                button.addEventListener(
                    "click",
                    function () {

                        const modalId =
                            button.dataset
                                .closeModal;

                        if (modalId) {

                            closeModal(
                                modalId
                            );
                        }
                    }
                );
            }
        );


        const genericCloseButtons =
            document.querySelectorAll(
                ".modal-close"
            );

        genericCloseButtons.forEach(
            function (button) {

                if (
                    button.dataset
                        .losojaGenericCloseReady ===
                    "true"
                ) {

                    return;
                }

                button.dataset
                    .losojaGenericCloseReady =
                    "true";

                button.addEventListener(
                    "click",
                    function () {

                        const modal =
                            button.closest(
                                ".modal"
                            );

                        if (modal) {

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
       MODAL BACKDROP CLICK
    ===================================================== */

    function setupModalBackdropClicks() {

        const modals =
            document.querySelectorAll(
                ".modal"
            );

        modals.forEach(
            function (modal) {

                if (
                    modal.dataset
                        .losojaBackdropReady ===
                    "true"
                ) {

                    return;
                }

                modal.dataset
                    .losojaBackdropReady =
                    "true";

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
       ESC KEY
    ===================================================== */

    function setupEscapeKey() {

        if (
            document.body.dataset
                .losojaEscapeReady ===
            "true"
        ) {

            return;
        }

        document.body.dataset
            .losojaEscapeReady =
            "true";

        document.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key !==
                    "Escape"
                ) {

                    return;
                }

                closeAllBusinessModals();
            }
        );
    }


    /* =====================================================
       HTML ESCAPING
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

        return String(
            value
        )
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


    function escapeAttribute(
        value
    ) {

        return escapeHTML(
            value
        );
    }


    /* =====================================================
       SUPABASE ERROR PARSER
    ===================================================== */

    function extractSupabaseError(
        text
    ) {

        if (!text) {

            return (
                "Supabase returned an unknown error."
            );
        }

        try {

            const data =
                JSON.parse(
                    text
                );

            if (
                data.message
            ) {

                return data.message;
            }

            if (
                data.error_description
            ) {

                return data.error_description;
            }

            if (
                data.error
            ) {

                return data.error;
            }

            if (
                data.hint
            ) {

                return data.hint;
            }

        } catch (error) {
            // Not JSON. Use raw text below.
        }

        return text;
    }


    /* =====================================================
       INIT
    ===================================================== */

    function init() {

        setupAddBusinessButtons();

        setupBusinessForms();

        setupModalButtons();

        setupModalBackdropClicks();

        setupEscapeKey();

        /*
         * THIS WAS THE MISSING CONNECTION.
         */
        setupCategoryButtons();

        previewBusinessImage(
            "businessImage",
            "imagePreview"
        );

        previewBusinessImage(
            "editBusinessImage",
            "editImagePreview"
        );

        loadBusinesses();
    }


    /* =====================================================
       PUBLIC API
    ===================================================== */

    window.LosOjaBusinesses = {

        init:
            init,

        loadBusinesses:
            loadBusinesses,

        renderBusinesses:
            renderBusinesses,

        searchBusinesses:
            searchBusinesses,

        filterByCategory:
            filterByCategory,

        openBusiness:
            openBusiness,

        openEditBusiness:
            openEditBusiness,

        addBusiness:
            addBusiness,

        saveEditedBusiness:
            saveEditedBusiness,

        deleteBusiness:
            deleteBusiness,

        getAll:
            function () {
                return allBusinesses;
            },

        getPopular:
            getPopularBusinesses,

        openModal:
            openModal,

        closeModal:
            closeModal
    };


    /* =====================================================
       COMPATIBILITY GLOBALS
    ===================================================== */

    window.loadBusinesses =
        loadBusinesses;

    window.renderBusinesses =
        renderBusinesses;

    window.searchBusinesses =
        searchBusinesses;

    window.filterBusinesses =
        searchBusinesses;

    window.filterBusinessesByCategory =
        filterByCategory;

    window.openBusiness =
        openBusiness;

    window.addBusiness =
        addBusiness;

    window.saveEditedBusiness =
        saveEditedBusiness;

    window.deleteBusiness =
        deleteBusiness;

    window.openEditBusiness =
        openEditBusiness;

    window.openModal =
        window.openModal ||
        openModal;

    window.closeModal =
        window.closeModal ||
        closeModal;


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
