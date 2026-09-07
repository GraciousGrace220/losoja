/*
=========================================================
LosOja - Business Management
js/businesses.js

Handles:
- Loading businesses from Supabase
- Displaying businesses
- Business image upload
- Business image preview
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

    const LOSOJA_BUSINESSES_URL =
        "https://ycxshwgeebskdozmornh.supabase.co";

    const LOSOJA_BUSINESSES_KEY =
        "sb_publishable_jFSLacwNupO6T8EnSqb2bw_bZmy7rVe";


    /* =====================================================
       STORAGE CONFIGURATION
    ===================================================== */

    const BUSINESS_IMAGE_BUCKET = "business-images";

    const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

    const ALLOWED_IMAGE_TYPES = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif"
    ];


    /* =====================================================
       CACHE
    ===================================================== */

    const BUSINESS_CACHE_KEY = "losoja_businesses_cache";


    /* =====================================================
       SESSION HELPERS
    ===================================================== */

    function getSession() {

        try {

            const raw =
                localStorage.getItem("losoja_supabase_session");

            if (!raw) return null;

            return JSON.parse(raw);

        } catch (error) {

            console.error(
                "LosOja session read error:",
                error
            );

            return null;
        }
    }


    function getAccessToken() {

        const session = getSession();

        return session && session.access_token
            ? session.access_token
            : null;
    }


    /* =====================================================
       SUPABASE HEADERS
    ===================================================== */

    function supabaseHeaders(accessToken) {

        const headers = {
            "apikey": LOSOJA_BUSINESSES_KEY,
            "Content-Type": "application/json"
        };

        if (accessToken) {

            headers.Authorization =
                "Bearer " + accessToken;
        }

        return headers;
    }


    /* =====================================================
       RESPONSE ERROR HELPER
    ===================================================== */

    async function getResponseError(response) {

        try {

            const data = await response.json();

            if (data && data.message) {
                return data.message;
            }

            if (data && data.error_description) {
                return data.error_description;
            }

            if (data && data.error) {
                return data.error;
            }

            return "Request failed.";

        } catch (error) {

            return "Request failed.";
        }
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
       NOTIFICATION
    ===================================================== */

    function notify(message, type = "success") {

        if (typeof window.showLosOjaNotification === "function") {

            window.showLosOjaNotification(
                message,
                type
            );

            return;
        }

        if (
            typeof window.showNotification === "function"
        ) {

            window.showNotification(
                message,
                type
            );

            return;
        }

        console.log(
            `[LosOja ${type}] ${message}`
        );
    }


    /* =====================================================
       MODAL HELPERS
    ===================================================== */

    function openModal(id) {

        const modal =
            document.getElementById(id);

        if (!modal) return;

        modal.classList.add("active");
        modal.classList.remove("hidden");

        document.body.classList.add("modal-open");
    }


    function closeModal(id) {

        const modal =
            document.getElementById(id);

        if (!modal) return;

        modal.classList.remove("active");

        /*
         * Keep compatibility with the existing
         * modal system.
         */
        if (
            !modal.classList.contains("modal")
        ) {

            modal.classList.add("hidden");
        }

        document.body.classList.remove("modal-open");
    }


    /* =====================================================
       CACHE HELPERS
    ===================================================== */

    function saveBusinessCache(list) {

        try {

            localStorage.setItem(
                BUSINESS_CACHE_KEY,
                JSON.stringify(list)
            );

        } catch (error) {

            console.warn(
                "LosOja business cache save failed:",
                error
            );
        }
    }


    function getBusinessCache() {

        try {

            const raw =
                localStorage.getItem(
                    BUSINESS_CACHE_KEY
                );

            if (!raw) return [];

            const data = JSON.parse(raw);

            return Array.isArray(data)
                ? data
                : [];

        } catch (error) {

            console.warn(
                "LosOja business cache read failed:",
                error
            );

            return [];
        }
    }


    /* =====================================================
       IMAGE HELPERS
    ===================================================== */

    function validateImage(file) {

        if (!file) {
            return {
                valid: true
            };
        }

        if (
            !ALLOWED_IMAGE_TYPES.includes(
                file.type
            )
        ) {

            return {
                valid: false,
                message:
                    "Please select a JPG, PNG, WEBP, or GIF image."
            };
        }

        if (file.size > MAX_IMAGE_SIZE) {

            return {
                valid: false,
                message:
                    "Image must be 5 MB or smaller."
            };
        }

        return {
            valid: true
        };
    }


    function previewBusinessImage(
        inputId,
        previewId
    ) {

        const input =
            document.getElementById(inputId);

        const preview =
            document.getElementById(previewId);

        if (!input || !preview) {
            return;
        }

        input.addEventListener(
            "change",
            function () {

                const file =
                    this.files &&
                    this.files[0];

                if (!file) {

                    preview.innerHTML = "";
                    preview.classList.add("hidden");

                    return;
                }

                const validation =
                    validateImage(file);

                if (!validation.valid) {

                    this.value = "";

                    preview.innerHTML = "";
                    preview.classList.add("hidden");

                    notify(
                        validation.message,
                        "error"
                    );

                    return;
                }

                const reader =
                    new FileReader();

                reader.onload =
                    function (event) {

                        preview.innerHTML = `
                            <img
                                src="${event.target.result}"
                                alt="Business image preview"
                            >
                        `;

                        preview.classList.remove(
                            "hidden"
                        );
                    };

                reader.readAsDataURL(file);
            }
        );
    }


    /* =====================================================
       IMAGE UPLOAD
    ===================================================== */

    async function uploadBusinessImage(
        file,
        userId
    ) {

        if (!file) {
            return null;
        }

        const validation =
            validateImage(file);

        if (!validation.valid) {

            throw new Error(
                validation.message
            );
        }

        const accessToken =
            getAccessToken();

        if (!accessToken) {

            throw new Error(
                "Please log in before uploading a business image."
            );
        }


        /*
         * Create a unique file name.
         *
         * We do NOT use the original filename
         * because duplicate filenames can cause
         * replacement problems.
         */

        const extension =
            file.name.includes(".")
                ? file.name
                    .split(".")
                    .pop()
                    .toLowerCase()
                : "jpg";

        const uniqueName =
            `${userId}/${Date.now()}-${Math.random()
                .toString(36)
                .substring(2, 10)}.${extension}`;


        const uploadUrl =
            `${LOSOJA_BUSINESSES_URL}/storage/v1/object/${BUSINESS_IMAGE_BUCKET}/${uniqueName}`;


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
                            accessToken,

                        "Content-Type":
                            file.type,

                        "x-upsert":
                            "false"
                    },

                    body: file
                }
            );


        if (!response.ok) {

            const error =
                await getResponseError(
                    response
                );

            throw new Error(
                "Image upload failed: " +
                error
            );
        }


        /*
         * The bucket is PUBLIC, so this URL
         * can be displayed directly.
         */

        return (
            `${LOSOJA_BUSINESSES_URL}/storage/v1/object/public/${BUSINESS_IMAGE_BUCKET}/${uniqueName}`
        );
    }


    /* =====================================================
       LOAD BUSINESSES
    ===================================================== */

    async function loadBusinesses() {

        const container =
            document.getElementById(
                "businessGrid"
            );

        if (container) {

            container.innerHTML = `
                <div class="businesses-loading">
                    Loading businesses...
                </div>
            `;
        }


        try {

            const response =
                await fetch(
                    `${LOSOJA_BUSINESSES_URL}/rest/v1/businesses?select=*&order=created_at.desc`,
                    {
                        method: "GET",
                        headers:
                            supabaseHeaders(
                                getAccessToken()
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


            const businesses =
                await response.json();


            saveBusinessCache(
                businesses
            );

            renderBusinesses(
                businesses
            );

            return businesses;

        } catch (error) {

            console.error(
                "LosOja load businesses error:",
                error
            );


            /*
             * If the server fails, use the
             * previously cached businesses.
             */

            const cached =
                getBusinessCache();

            if (cached.length > 0) {

                renderBusinesses(
                    cached
                );

                notify(
                    "Showing saved businesses while we reconnect.",
                    "error"
                );

                return cached;
            }


            if (container) {

                container.innerHTML = `
                    <div class="businesses-empty">
                        Unable to load businesses right now.
                        Please refresh the page.
                    </div>
                `;
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

        const container =
            document.getElementById(
                "businessGrid"
            );

        if (!container) {
            return;
        }


        if (
            !Array.isArray(businesses) ||
            businesses.length === 0
        ) {

            container.innerHTML = `
                <div class="businesses-empty">
                    <h3>No businesses found</h3>
                    <p>
                        Be the first business to join LosOja.
                    </p>
                </div>
            `;

            return;
        }


        container.innerHTML =
            businesses
                .map(
                    businessCard
                )
                .join("");
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
                <img
                    src="${escapeHTML(
                        business.image_url
                    )}"
                    alt="${escapeHTML(
                        business.name
                    )}"
                    loading="lazy"
                    onerror="
                        this.style.display='none';
                        this.parentElement.innerHTML='<span>🏪</span>';
                    "
                >
            `;
        }

        return `
            <span>🏪</span>
        `;
    }


    /* =====================================================
       BUSINESS CARD
    ===================================================== */

    function businessCard(
        business
    ) {

        const session =
            getSession();

        const currentUserId =
            session &&
            session.user
                ? session.user.id
                : null;

        const isOwner =
            currentUserId &&
            business.user_id ===
                currentUserId;


        return `
            <article
                class="business-card"
                data-business-id="${escapeHTML(
                    business.id
                )}"
            >

                <div class="business-image">
                    ${businessImageHTML(
                        business
                    )}
                </div>

                <div class="business-card-content">

                    <div class="business-category">
                        ${escapeHTML(
                            business.category ||
                            "Business"
                        )}
                    </div>

                    <h3>
                        ${escapeHTML(
                            business.name
                        )}
                    </h3>

                    <p class="business-location">
                        📍 ${escapeHTML(
                            business.location ||
                            "Location not provided"
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
                                    📞 ${escapeHTML(
                                        business.phone
                                    )}
                                </p>
                            `
                            : ""
                    }

                    <div class="business-card-actions">

                        <button
                            type="button"
                            class="btn btn-primary"
                            onclick="openBusiness('${escapeHTML(
                                business.id
                            )}')"
                        >
                            View Details
                        </button>

                        ${
                            isOwner
                                ? `
                                    <button
                                        type="button"
                                        class="btn btn-secondary"
                                        onclick="editBusiness('${escapeHTML(
                                            business.id
                                        )}')"
                                    >
                                        Edit
                                    </button>

                                    <button
                                        type="button"
                                        class="btn btn-danger"
                                        onclick="deleteBusiness('${escapeHTML(
                                            business.id
                                        )}')"
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

    window.openBusiness =
        function (businessId) {

            const businesses =
                getBusinessCache();

            const business =
                businesses.find(
                    item =>
                        item.id ===
                        businessId
                );


            if (!business) {

                notify(
                    "Business information could not be found.",
                    "error"
                );

                return;
            }


            const details =
                document.getElementById(
                    "businessDetails"
                );

            if (!details) {
                return;
            }


            details.innerHTML = `

                <div class="business-details-image">

                    ${
                        business.image_url
                            ? `
                                <img
                                    src="${escapeHTML(
                                        business.image_url
                                    )}"
                                    alt="${escapeHTML(
                                        business.name
                                    )}"
                                    onerror="
                                        this.style.display='none';
                                    "
                                >
                            `
                            : `
                                <div class="business-details-placeholder">
                                    🏪
                                </div>
                            `
                    }

                </div>


                <div class="business-details-content">

                    <span class="business-category">
                        ${escapeHTML(
                            business.category ||
                            "Business"
                        )}
                    </span>

                    <h2>
                        ${escapeHTML(
                            business.name
                        )}
                    </h2>

                    <p>
                        📍
                        ${escapeHTML(
                            business.location ||
                            "Location not provided"
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
                                    ${escapeHTML(
                                        business.phone
                                    )}
                                </p>
                            `
                            : ""
                    }

                    ${
                        business.phone
                            ? `
                                <a
                                    href="tel:${escapeHTML(
                                        business.phone
                                    )}"
                                    class="btn btn-primary"
                                >
                                    Call Business
                                </a>
                            `
                            : ""
                    }

                </div>


                <div
                    class="reviews-section"
                    id="businessReviewsSection"
                    data-business-id="${escapeHTML(
                        business.id
                    )}"
                >

                    <div class="reviews-heading">

                        <h3>
                            Customer Reviews
                        </h3>

                        <span
                            class="reviews-count"
                            id="reviewsCount"
                        >
                        </span>

                    </div>

                    <div
                        id="reviewsForBusiness"
                        class="review-list"
                    >
                        Loading reviews...
                    </div>

                </div>

            `;


            openModal(
                "businessDetailsModal"
            );


            /*
             * Reviews system remains handled
             * by the existing reviews.js file.
             */

            if (
                window.Reviews &&
                typeof window.Reviews.renderForBusiness ===
                    "function"
            ) {

                window.Reviews.renderForBusiness(
                    business.id
                );
            }
        };


    /* =====================================================
       ADD BUSINESS
    ===================================================== */

    async function addBusiness() {

        const name =
            document.getElementById(
                "businessName"
            );

        const category =
            document.getElementById(
                "businessCategory"
            );

        const location =
            document.getElementById(
                "businessLocation"
            );

        const description =
            document.getElementById(
                "businessDescription"
            );

        const phone =
            document.getElementById(
                "businessPhone"
            );

        const imageInput =
            document.getElementById(
                "businessImage"
            );

        const errorBox =
            document.getElementById(
                "addBusinessError"
            );


        const session =
            getSession();


        if (
            !session ||
            !session.user
        ) {

            if (errorBox) {

                errorBox.textContent =
                    "Please log in before adding a business.";
            }

            if (
                window.openLoginModal
            ) {
                window.openLoginModal();
            }

            return;
        }


        if (
            !name ||
            !category ||
            !location
        ) {

            return;
        }


        const businessName =
            name.value.trim();

        const businessCategory =
            category.value.trim();

        const businessLocation =
            location.value.trim();

        const businessDescription =
            description
                ? description.value.trim()
                : "";

        const businessPhone =
            phone
                ? phone.value.trim()
                : "";

        const imageFile =
            imageInput &&
            imageInput.files
                ? imageInput.files[0]
                : null;


        if (!businessName) {

            showFormError(
                errorBox,
                "Please enter the business name."
            );

            return;
        }


        if (!businessCategory) {

            showFormError(
                errorBox,
                "Please select a business category."
            );

            return;
        }


        if (!businessLocation) {

            showFormError(
                errorBox,
                "Please enter the business location."
            );

            return;
        }


        const imageValidation =
            validateImage(
                imageFile
            );

        if (!imageValidation.valid) {

            showFormError(
                errorBox,
                imageValidation.message
            );

            return;
        }


        clearFormError(
            errorBox
        );


        try {

            let accessToken =
                getAccessToken();


            if (!accessToken) {

                throw new Error(
                    "Your session has expired. Please log in again."
                );
            }


            /*
             * Upload image FIRST.
             */

            let imageUrl = null;

            if (imageFile) {

                imageUrl =
                    await uploadBusinessImage(
                        imageFile,
                        session.user.id
                    );
            }


            const payload = {

                user_id:
                    session.user.id,

                name:
                    businessName,

                category:
                    businessCategory,

                location:
                    businessLocation,

                description:
                    businessDescription,

                phone:
                    businessPhone,

                image_url:
                    imageUrl

            };


            let response =
                await fetch(
                    `${LOSOJA_BUSINESSES_URL}/rest/v1/businesses`,
                    {
                        method: "POST",

                        headers: {
                            ...supabaseHeaders(
                                accessToken
                            ),
                            "Prefer":
                                "return=representation"
                        },

                        body:
                            JSON.stringify(
                                payload
                            )
                    }
                );


            /*
             * Refresh the session once if
             * Supabase reports an expired token.
             */

            if (
                response.status === 401 &&
                window.refreshSupabaseSession
            ) {

                const refreshed =
                    await window.refreshSupabaseSession();

                if (
                    refreshed &&
                    refreshed.access_token
                ) {

                    accessToken =
                        refreshed.access_token;

                    response =
                        await fetch(
                            `${LOSOJA_BUSINESSES_URL}/rest/v1/businesses`,
                            {
                                method: "POST",

                                headers: {
                                    ...supabaseHeaders(
                                        accessToken
                                    ),
                                    "Prefer":
                                        "return=representation"
                                },

                                body:
                                    JSON.stringify(
                                        payload
                                    )
                            }
                        );
                }
            }


            if (!response.ok) {

                const error =
                    await getResponseError(
                        response
                    );

                throw new Error(
                    error
                );
            }


            const inserted =
                await response.json();


            const newBusiness =
                Array.isArray(inserted)
                    ? inserted[0]
                    : inserted;


            const businesses =
                getBusinessCache();


            businesses.unshift(
                newBusiness
            );


            saveBusinessCache(
                businesses
            );


            renderBusinesses(
                businesses
            );


            resetAddBusinessForm();

            closeModal(
                "addBusinessModal"
            );


            notify(
                "Business added successfully!",
                "success"
            );


            await loadBusinesses();

        } catch (error) {

            console.error(
                "LosOja add business error:",
                error
            );


            showFormError(
                errorBox,
                error.message ||
                "Unable to save business."
            );
        }
    }


    /* =====================================================
       EDIT BUSINESS
    ===================================================== */

    window.editBusiness =
        function (businessId) {

            const businesses =
                getBusinessCache();

            const business =
                businesses.find(
                    item =>
                        item.id ===
                        businessId
                );


            if (!business) {

                notify(
                    "Business could not be found.",
                    "error"
                );

                return;
            }


            const session =
                getSession();


            if (
                !session ||
                !session.user ||
                session.user.id !==
                    business.user_id
            ) {

                notify(
                    "You can only edit your own business.",
                    "error"
                );

                return;
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

            const preview =
                document.getElementById(
                    "editImagePreview"
                );


            if (idInput) {
                idInput.value =
                    business.id;
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


            /*
             * Show existing image.
             */

            if (preview) {

                if (business.image_url) {

                    preview.innerHTML = `
                        <img
                            src="${escapeHTML(
                                business.image_url
                            )}"
                            alt="Current business image"
                        >
                    `;

                    preview.classList.remove(
                        "hidden"
                    );

                } else {

                    preview.innerHTML = "";
                    preview.classList.add(
                        "hidden"
                    );
                }
            }


            const imageInput =
                document.getElementById(
                    "editBusinessImage"
                );

            if (imageInput) {
                imageInput.value = "";
            }


            const errorBox =
                document.getElementById(
                    "editBusinessError"
                );

            clearFormError(
                errorBox
            );


            openModal(
                "editBusinessModal"
            );
        };


    /* =====================================================
       SAVE EDITED BUSINESS
    ===================================================== */

    async function saveEditedBusiness() {

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

        const errorBox =
            document.getElementById(
                "editBusinessError"
            );


        const businessId =
            idInput
                ? idInput.value
                : "";


        if (!businessId) {

            showFormError(
                errorBox,
                "Business ID is missing."
            );

            return;
        }


        const session =
            getSession();


        if (
            !session ||
            !session.user
        ) {

            showFormError(
                errorBox,
                "Please log in again."
            );

            return;
        }


        const businesses =
            getBusinessCache();

        const existing =
            businesses.find(
                item =>
                    item.id ===
                    businessId
            );


        if (!existing) {

            showFormError(
                errorBox,
                "Business could not be found."
            );

            return;
        }


        if (
            existing.user_id !==
            session.user.id
        ) {

            showFormError(
                errorBox,
                "You can only edit your own business."
            );

            return;
        }


        const businessName =
            nameInput.value.trim();

        const businessCategory =
            categoryInput.value.trim();

        const businessLocation =
            locationInput.value.trim();

        const businessDescription =
            descriptionInput
                ? descriptionInput.value.trim()
                : "";

        const businessPhone =
            phoneInput
                ? phoneInput.value.trim()
                : "";

        const imageFile =
            imageInput &&
            imageInput.files
                ? imageInput.files[0]
                : null;


        if (!businessName) {

            showFormError(
                errorBox,
                "Please enter the business name."
            );

            return;
        }


        if (!businessCategory) {

            showFormError(
                errorBox,
                "Please select a business category."
            );

            return;
        }


        if (!businessLocation) {

            showFormError(
                errorBox,
                "Please enter the business location."
            );

            return;
        }


        const imageValidation =
            validateImage(
                imageFile
            );

        if (!imageValidation.valid) {

            showFormError(
                errorBox,
                imageValidation.message
            );

            return;
        }


        clearFormError(
            errorBox
        );


        try {

            let accessToken =
                getAccessToken();


            if (!accessToken) {

                throw new Error(
                    "Your session has expired. Please log in again."
                );
            }


            /*
             * Keep the old image unless
             * the owner chooses a new one.
             */

            let imageUrl =
                existing.image_url ||
                null;


            if (imageFile) {

                imageUrl =
                    await uploadBusinessImage(
                        imageFile,
                        session.user.id
                    );
            }


            const payload = {

                name:
                    businessName,

                category:
                    businessCategory,

                location:
                    businessLocation,

                description:
                    businessDescription,

                phone:
                    businessPhone,

                image_url:
                    imageUrl
            };


            let response =
                await fetch(
                    `${LOSOJA_BUSINESSES_URL}/rest/v1/businesses?id=eq.${encodeURIComponent(
                        businessId
                    )}`,
                    {
                        method: "PATCH",

                        headers: {
                            ...supabaseHeaders(
                                accessToken
                            ),
                            "Prefer":
                                "return=representation"
                        },

                        body:
                            JSON.stringify(
                                payload
                            )
                    }
                );


            if (
                response.status === 401 &&
                window.refreshSupabaseSession
            ) {

                const refreshed =
                    await window.refreshSupabaseSession();

                if (
                    refreshed &&
                    refreshed.access_token
                ) {

                    accessToken =
                        refreshed.access_token;

                    response =
                        await fetch(
                            `${LOSOJA_BUSINESSES_URL}/rest/v1/businesses?id=eq.${encodeURIComponent(
                                businessId
                            )}`,
                            {
                                method: "PATCH",

                                headers: {
                                    ...supabaseHeaders(
                                        accessToken
                                    ),
                                    "Prefer":
                                        "return=representation"
                                },

                                body:
                                    JSON.stringify(
                                        payload
                                    )
                            }
                        );
                }
            }


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
                Array.isArray(updated)
                    ? updated[0]
                    : updated;


            const index =
                businesses.findIndex(
                    item =>
                        item.id ===
                        businessId
                );


            if (index !== -1) {

                businesses[index] =
                    updatedBusiness;
            }


            saveBusinessCache(
                businesses
            );


            renderBusinesses(
                businesses
            );


            closeModal(
                "editBusinessModal"
            );


            notify(
                "Business updated successfully!",
                "success"
            );


            await loadBusinesses();

        } catch (error) {

            console.error(
                "LosOja edit business error:",
                error
            );


            showFormError(
                errorBox,
                error.message ||
                "Unable to update business."
            );
        }
    }


    /* =====================================================
       DELETE BUSINESS
    ===================================================== */

    window.deleteBusiness =
        async function (businessId) {

            const session =
                getSession();


            if (
                !session ||
                !session.user
            ) {

                notify(
                    "Please log in first.",
                    "error"
                );

                return;
            }


            const businesses =
                getBusinessCache();

            const business =
                businesses.find(
                    item =>
                        item.id ===
                        businessId
                );


            if (!business) {

                notify(
                    "Business could not be found.",
                    "error"
                );

                return;
            }


            if (
                business.user_id !==
                session.user.id
            ) {

                notify(
                    "You can only delete your own business.",
                    "error"
                );

                return;
            }


            const confirmed =
                window.confirm(
                    `Are you sure you want to delete "${business.name}"?`
                );


            if (!confirmed) {
                return;
            }


            try {

                let accessToken =
                    getAccessToken();


                let response =
                    await fetch(
                        `${LOSOJA_BUSINESSES_URL}/rest/v1/businesses?id=eq.${encodeURIComponent(
                            businessId
                        )}`,
                        {
                            method: "DELETE",

                            headers:
                                supabaseHeaders(
                                    accessToken
                                )
                        }
                    );


                if (
                    response.status === 401 &&
                    window.refreshSupabaseSession
                ) {

                    const refreshed =
                        await window.refreshSupabaseSession();

                    if (
                        refreshed &&
                        refreshed.access_token
                    ) {

                        accessToken =
                            refreshed.access_token;

                        response =
                            await fetch(
                                `${LOSOJA_BUSINESSES_URL}/rest/v1/businesses?id=eq.${encodeURIComponent(
                                    businessId
                                )}`,
                                {
                                    method: "DELETE",

                                    headers:
                                        supabaseHeaders(
                                            accessToken
                                        )
                                }
                            );
                    }
                }


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
                        item =>
                            item.id !==
                            businessId
                    );


                saveBusinessCache(
                    remaining
                );


                renderBusinesses(
                    remaining
                );


                notify(
                    "Business deleted successfully.",
                    "success"
                );


                /*
                 * We intentionally do not delete
                 * the Storage image here.
                 *
                 * Storage deletion requires a separate
                 * Storage DELETE policy. Keeping the image
                 * is safer until that policy is configured.
                 */

                await loadBusinesses();

            } catch (error) {

                console.error(
                    "LosOja delete business error:",
                    error
                );

                notify(
                    error.message ||
                    "Unable to delete business.",
                    "error"
                );
            }
        };


    /* =====================================================
       SEARCH BUSINESSES
    ===================================================== */

    function searchBusinesses(
        searchTerm
    ) {

        const businesses =
            getBusinessCache();

        const term =
            String(searchTerm || "")
                .trim()
                .toLowerCase();


        if (!term) {

            renderBusinesses(
                businesses
            );

            return businesses;
        }


        const results =
            businesses.filter(
                business => {

                    const searchable =
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


                    return searchable.includes(
                        term
                    );
                }
            );


        renderBusinesses(
            results
        );


        return results;
    }


    /* =====================================================
       CATEGORY FILTER
    ===================================================== */

    function filterByCategory(
        category
    ) {

        const businesses =
            getBusinessCache();

        const term =
            String(category || "")
                .trim()
                .toLowerCase();


        if (!term) {

            renderBusinesses(
                businesses
            );

            return businesses;
        }


        const results =
            businesses.filter(
                business =>
                    String(
                        business.category || ""
                    )
                        .toLowerCase() ===
                    term
            );


        renderBusinesses(
            results
        );


        return results;
    }


    /* =====================================================
       POPULAR BUSINESSES
    ===================================================== */

    function showPopularBusinesses() {

        const businesses =
            getBusinessCache();

        /*
         * Until a rating/count system is added
         * to businesses, preserve the existing
         * newest-business ordering.
         */

        renderBusinesses(
            businesses.slice(0, 6)
        );

        return businesses.slice(0, 6);
    }


    /* =====================================================
       FORM ERROR HELPERS
    ===================================================== */

    function showFormError(
        element,
        message
    ) {

        if (!element) {
            return;
        }

        element.textContent =
            message;

        element.classList.remove(
            "hidden"
        );
    }


    function clearFormError(
        element
    ) {

        if (!element) {
            return;
        }

        element.textContent = "";

        element.classList.add(
            "hidden"
        );
    }


    /* =====================================================
       RESET ADD BUSINESS FORM
    ===================================================== */

    function resetAddBusinessForm() {

        const form =
            document.getElementById(
                "addBusinessForm"
            );


        if (form) {

            form.reset();
        }


        const imageInput =
            document.getElementById(
                "businessImage"
            );

        if (imageInput) {

            imageInput.value = "";
        }


        const preview =
            document.getElementById(
                "imagePreview"
            );


        if (preview) {

            preview.innerHTML = "";

            preview.classList.add(
                "hidden"
            );
        }


        const errorBox =
            document.getElementById(
                "addBusinessError"
            );


        clearFormError(
            errorBox
        );
    }


    /* =====================================================
       GLOBAL API
    ===================================================== */

    window.loadLosOjaBusinesses =
        loadBusinesses;

    window.getLosOjaBusinesses =
        getBusinessCache;

    window.renderLosOjaBusinesses =
        renderBusinesses;

    window.searchLosOjaBusinesses =
        searchBusinesses;

    window.filterLosOjaBusinessesByCategory =
        filterByCategory;

    window.showPopularLosOjaBusinesses =
        showPopularBusinesses;

    window.addBusiness =
        addBusiness;

    window.saveEditedBusiness =
        saveEditedBusiness;


    /* =====================================================
       INITIALIZATION
    ===================================================== */

    function init() {

        /*
         * Business image previews.
         */

        previewBusinessImage(
            "businessImage",
            "imagePreview"
        );


        previewBusinessImage(
            "editBusinessImage",
            "editImagePreview"
        );


        /*
         * Load businesses.
         */

        loadBusinesses();
    }


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
