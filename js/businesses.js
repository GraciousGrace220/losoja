```javascript
/*
=========================================================
LosOja - Business Management
js/businesses.js

Handles:
- Loading businesses from Supabase
- Adding businesses
- Editing businesses
- Deleting businesses
- Business details
- Business images
- Business image gallery
- Search
- Category filtering
- Reviews integration
- Supabase session refresh
- Authentication retry
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

    const SESSION_KEY =
        "losoja_supabase_session";

    const STORAGE_BUCKET =
        "business-images";

    const BUSINESS_IMAGES_TABLE =
        "business_images";

    const MAX_IMAGE_SIZE =
        5 * 1024 * 1024;

    const MAX_BUSINESS_IMAGES =
        5;

    const ALLOWED_IMAGE_TYPES = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/gif"
    ];


    /* =====================================================
       SESSION HELPERS
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

            const raw =
                localStorage.getItem(
                    SESSION_KEY
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


    /*
     * Always ask auth.js to validate/refresh
     * the session before authenticated operations.
     */
    async function ensureSession() {

        try {

            if (
                typeof window.ensureValidSupabaseSession ===
                "function"
            ) {

                const session =
                    await window.ensureValidSupabaseSession();

                if (session) {

                    try {

                        localStorage.setItem(
                            SESSION_KEY,
                            JSON.stringify(
                                session
                            )
                        );

                    } catch (storageError) {

                        console.warn(
                            "LosOja: Could not update stored session:",
                            storageError
                        );

                    }

                    return session;
                }
            }

        } catch (error) {

            console.warn(
                "LosOja: Session validation warning:",
                error
            );

        }

        return getSession();
    }


    /* =====================================================
       HEADERS
    ===================================================== */

  function getHeaders(includeContentType = false) {

    const token = getAccessToken();

    const headers = {
        "apikey": LOSOJA_BUSINESSES_KEY,
        "Accept": "application/json"
    };

    // Only send Authorization when there is
    // a real Supabase user access token.
    if (token) {
        headers["Authorization"] =
            "Bearer " + token;
    }

    if (includeContentType) {
        headers["Content-Type"] =
            "application/json";
    }

    return headers;
}
        const token =
            getAccessToken();


        /*
         * IMPORTANT:
         *
         * Never use the Supabase publishable key
         * as the Bearer token.
         *
         * Only send Authorization when we have
         * an actual user access token.
         */

        if (token) {

            headers["Authorization"] =
                "Bearer " + token;

        }


        if (includeContentType) {

            headers["Content-Type"] =
                "application/json";

        }


        return headers;
    }


    /* =====================================================
       AUTHENTICATED REQUEST RETRY
    ===================================================== */

    async function supabaseFetch(
        url,
        options = {},
        retry = true
    ) {

        const requestOptions = {
            ...options,

            headers: {
                ...getHeaders(
                    Boolean(
                        options.body &&
                        typeof options.body === "string"
                    )
                ),

                ...(options.headers || {})
            }
        };


        let response =
            await fetch(
                url,
                requestOptions
            );


        /*
         * If Supabase says the JWT has expired,
         * refresh the session and retry once.
         */

        if (
            response.status === 401 &&
            retry &&
            typeof window.refreshSupabaseSession ===
            "function"
        ) {

            console.warn(
                "LosOja: Access token rejected. Attempting session refresh..."
            );


            const refreshedSession =
                await window.refreshSupabaseSession();


            if (refreshedSession) {

                const retryOptions = {
                    ...options,

                    headers: {
                        ...getHeaders(
                            Boolean(
                                options.body &&
                                typeof options.body === "string"
                            )
                        ),

                        ...(options.headers || {})
                    }
                };


                response =
                    await fetch(
                        url,
                        retryOptions
                    );

            }

        }


        return response;
    }


    /* =====================================================
       NOTIFICATION
    ===================================================== */

    function showBusinessNotification(
        message,
        type = "success"
    ) {

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
            typeof window.App.showToast ===
            "function"
        ) {

            window.App.showToast(
                message,
                type
            );

            return;
        }


        alert(message);
    }


    /* =====================================================
       MODAL HELPERS
    ===================================================== */

    function openModal(id) {

        /*
         * Prefer the site's central App modal system.
         */

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

            console.error(
                "LosOja: Modal not found:",
                id
            );

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

        modal.style.visibility =
            "visible";

        modal.style.opacity =
            "1";

        document.body.classList.add(
            "modal-open"
        );
    }


    function closeModal(id) {

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

        modal.style.visibility =
            "";

        modal.style.opacity =
            "";


        if (
            !document.querySelector(
                ".modal-overlay.active"
            )
        ) {

            document.body.classList.remove(
                "modal-open"
            );

        }
    }


    function closeAllBusinessModals() {

        [
            "addBusinessModal",
            "businessDetailsModal",
            "editBusinessModal"
        ].forEach(
            closeModal
        );

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

        /*
         * New/current ID:
         * businessesGrid
         *
         * Older ID:
         * businessGrid
         *
         * Supporting both prevents the page from
         * breaking if an older HTML version is cached.
         */

        return (
            document.getElementById(
                "businessesGrid"
            ) ||
            document.getElementById(
                "businessGrid"
            )
        );
    }


    /* =====================================================
       ERROR HELPERS
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

        element.style.display =
            message
                ? "block"
                : "none";

    }


    /* =====================================================
       IMAGE VALIDATION
    ===================================================== */

    function validateImageFile(
        file
    ) {

        if (!file) {

            return {
                valid: false,
                message: "Invalid image."
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
                    `${file.name} is not a supported image type.`
            };

        }


        if (
            file.size >
            MAX_IMAGE_SIZE
        ) {

            return {
                valid: false,

                message:
                    `${file.name} is larger than 5MB.`
            };

        }


        return {
            valid: true,
            message: ""
        };
    }


    function validateSelectedFiles(
        files,
        maxCount = MAX_BUSINESS_IMAGES
    ) {

        if (
            files.length >
            maxCount
        ) {

            return {
                valid: false,

                message:
                    `You can add a maximum of ${maxCount} photos.`
            };

        }


        for (
            const file of files
        ) {

            const result =
                validateImageFile(
                    file
                );

            if (!result.valid) {
                return result;
            }

        }


        return {
            valid: true,
            message: ""
        };
    }


    /* =====================================================
       IMAGE PREVIEW
    ===================================================== */

    function previewBusinessImages(
        inputId,
        previewId,
        emptyText
    ) {

        const input =
            document.getElementById(
                inputId
            );

        const preview =
            document.getElementById(
                previewId
            );


        if (
            !input ||
            !preview
        ) {

            return;
        }


        const files =
            Array.from(
                input.files || []
            );


        preview.innerHTML =
            "";


        if (!files.length) {

            preview.innerHTML =
                `<span>${escapeHTML(
                    emptyText
                )}</span>`;

            preview.classList.add(
                "hidden"
            );

            return;
        }


        preview.classList.remove(
            "hidden"
        );


        const wrapper =
            document.createElement(
                "div"
            );

        wrapper.className =
            "business-upload-preview-grid";


        files.forEach(
            (
                file,
                index
            ) => {

                const item =
                    document.createElement(
                        "div"
                    );

                item.className =
                    "business-upload-preview-item";


                const image =
                    document.createElement(
                        "img"
                    );

                image.alt =
                    `Business photo ${index + 1}`;


                const badge =
                    document.createElement(
                        "span"
                    );

                badge.className =
                    "business-upload-preview-badge";

                badge.textContent =
                    index === 0
                        ? "Main"
                        : `${index + 1}`;


                const reader =
                    new FileReader();


                reader.onload =
                    function (event) {

                        image.src =
                            event.target.result;

                    };


                reader.readAsDataURL(
                    file
                );


                item.appendChild(
                    image
                );

                item.appendChild(
                    badge
                );

                wrapper.appendChild(
                    item
                );

            }
        );


        preview.appendChild(
            wrapper
        );
    }


    /* =====================================================
       UPLOAD BUSINESS IMAGE
    ===================================================== */

    async function uploadBusinessImage(
        file
    ) {

        const userId =
            getCurrentUserId();


        if (!userId) {

            throw new Error(
                "You must be logged in to upload photos."
            );

        }


        const validation =
            validateImageFile(
                file
            );


        if (!validation.valid) {

            throw new Error(
                validation.message
            );

        }


        /*
         * Make sure the session is valid before
         * attempting the Storage upload.
         */

        await ensureSession();


        const extension =
            (
                file.name
                    .split(".")
                    .pop() ||
                "jpg"
            )
                .toLowerCase()
                .replace(
                    /[^a-z0-9]/g,
                    ""
                );


        const uniqueName =
            `${Date.now()}-${Math.random()
                .toString(36)
                .substring(2, 10)}.${extension}`;


        const filePath =
            `${userId}/${uniqueName}`;


        const url =
            `${SUPABASE_URL}` +
            `/storage/v1/object/` +
            `${STORAGE_BUCKET}/` +
            `${filePath}`;


        const response =
            await fetch(
                url,
                {
                    method: "POST",

                    headers: {
                        ...getHeaders(),

                        "Content-Type":
                            file.type ||
                            "application/octet-stream",

                        "x-upsert":
                            "false"
                    },

                    body:
                        file
                }
            );


        if (!response.ok) {

            let errorMessage =
                "Image upload failed.";


            try {

                const errorData =
                    await response.json();

                errorMessage =
                    errorData.message ||
                    errorData.error ||
                    errorData.error_description ||
                    errorMessage;

            } catch (_) {}


            /*
             * If the token expired during upload,
             * refresh and retry once.
             */

            if (
                response.status === 401 &&
                typeof window.refreshSupabaseSession ===
                "function"
            ) {

                const refreshed =
                    await window.refreshSupabaseSession();


                if (refreshed) {

                    const retryResponse =
                        await fetch(
                            url,
                            {
                                method: "POST",

                                headers: {
                                    ...getHeaders(),

                                    "Content-Type":
                                        file.type ||
                                        "application/octet-stream",

                                    "x-upsert":
                                        "false"
                                },

                                body:
                                    file
                            }
                        );


                    if (
                        retryResponse.ok
                    ) {

                        return (
                            `${SUPABASE_URL}` +
                            `/storage/v1/object/public/` +
                            `${STORAGE_BUCKET}/` +
                            `${filePath}`
                        );

                    }

                }

            }


            throw new Error(
                errorMessage
            );
        }


        return (
            `${SUPABASE_URL}` +
            `/storage/v1/object/public/` +
            `${STORAGE_BUCKET}/` +
            `${filePath}`
        );
    }


    /* =====================================================
       BUSINESS GALLERY
    ===================================================== */

    async function getBusinessGallery(
        businessId
    ) {

        if (!businessId) {
            return [];
        }


        const url =
            `${SUPABASE_URL}` +
            `/rest/v1/${BUSINESS_IMAGES_TABLE}` +
            `?business_id=eq.${encodeURIComponent(
                businessId
            )}` +
            `&select=*` +
            `&order=sort_order.asc,created_at.asc`;


        try {

            const response =
                await supabaseFetch(
                    url,
                    {
                        method: "GET"
                    }
                );


            if (!response.ok) {

                const text =
                    await response.text();

                console.error(
                    "LosOja business gallery error:",
                    text
                );

                return [];
            }


            const data =
                await response.json();


            return Array.isArray(
                data
            )
                ? data
                : [];


        } catch (error) {

            console.error(
                "LosOja business gallery request error:",
                error
            );

            return [];
        }
    }


    async function insertBusinessGallery(
        businessId,
        userId,
        imageUrls,
        startingSortOrder = 1
    ) {

        if (
            !businessId ||
            !userId ||
            !imageUrls ||
            !imageUrls.length
        ) {

            return;

        }


        const rows =
            imageUrls.map(
                (
                    url,
                    index
                ) => ({

                    business_id:
                        businessId,

                    user_id:
                        userId,

                    image_url:
                        url,

                    sort_order:
                        startingSortOrder +
                        index

                })
            );


        const response =
            await supabaseFetch(
                `${SUPABASE_URL}/rest/v1/${BUSINESS_IMAGES_TABLE}`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Prefer":
                            "return=minimal"
                    },

                    body:
                        JSON.stringify(
                            rows
                        )
                }
            );


        if (!response.ok) {

            let message =
                "Additional photos could not be saved.";


            try {

                const error =
                    await response.json();

                message =
                    error.message ||
                    error.error ||
                    error.details ||
                    message;

            } catch (_) {}


            throw new Error(
                message
            );
        }
    }


    /* =====================================================
       LOAD BUSINESSES
    ===================================================== */

    async function loadBusinesses() {

        /*
         * Validate session if one exists.
         *
         * Public business viewing should still work
         * even when nobody is logged in.
         */

        await ensureSession();


        const grid =
            getBusinessGrid();


        const noResults =
            document.getElementById(
                "noResults"
            );


        if (!grid) {

            console.warn(
                "LosOja: businessesGrid/businessGrid was not found."
            );

            return;
        }


        grid.innerHTML = `
            <div class="loading-message">
                Businesses are loading...
            </div>
        `;


        try {

            const response =
                await supabaseFetch(
                    `${SUPABASE_URL}/rest/v1/businesses?select=*&order=created_at.desc`,
                    {
                        method: "GET"
                    }
                );


            if (!response.ok) {

                const text =
                    await response.text();

                throw new Error(
                    text ||
                    "Could not load businesses."
                );
            }


            const businesses =
                await response.json();


            window.losojaBusinesses =
                Array.isArray(
                    businesses
                )
                    ? businesses
                    : [];


            renderBusinesses(
                window.losojaBusinesses
            );


        } catch (error) {

            console.error(
                "LosOja businesses loading error:",
                error
            );


            grid.innerHTML = `
                <div class="error-message">
                    Unable to load businesses right now.
                    Please refresh the page.
                </div>
            `;


            if (noResults) {

                noResults.style.display =
                    "none";

            }
        }
    }


    /* =====================================================
       BUSINESS IMAGE HTML
    ===================================================== */

    function businessImageHTML(
        business,
        extraClass = ""
    ) {

        if (
            business &&
            business.image_url
        ) {

            return `
                <div class="business-image ${escapeHTML(extraClass)}">

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
            `;
        }


        return `
            <div class="business-image ${escapeHTML(extraClass)}">

                <span aria-hidden="true">
                    🏪
                </span>

            </div>
        `;
    }


    /* =====================================================
       BUSINESS CARD
    ===================================================== */

    function businessCard(
        business
    ) {

        const category =
            business.category ||
            "Business";


        const location =
            business.location ||
            "Nigeria";


        return `
            <article
                class="business-card"
                data-business-id="${escapeHTML(
                    business.id
                )}"
            >

                ${businessImageHTML(
                    business
                )}

                <div class="business-card-content">

                    <span class="business-category">
                        ${escapeHTML(
                            category
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
                            location
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
            !businesses.length
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
                    businessCard
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
       BUSINESS DETAILS
    ===================================================== */

    async function openBusiness(
        businessId
    ) {

        const businesses =
            window.losojaBusinesses ||
            [];


        const business =
            businesses.find(
                item =>
                    String(item.id) ===
                    String(businessId)
            );


        if (!business) {

            showBusinessNotification(
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
                "LosOja: businessDetailsContent was not found."
            );

            return;
        }


        const currentUserId =
            getCurrentUserId();


        const isOwner =
            Boolean(
                currentUserId &&
                business.user_id &&
                String(currentUserId) ===
                String(business.user_id)
            );


        container.innerHTML = `

            <div
                id="businessDetails"
                class="business-details"
            >

                ${businessImageHTML(
                    business,
                    "business-details-main-image"
                )}


                <div
                    id="businessDetailsGallery"
                    class="business-details-gallery"
                >
                    <div class="loading-message">
                        Loading photos...
                    </div>
                </div>


                <div class="business-details-info">

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


                    <div
                        id="businessReviewsContainer"
                        class="business-reviews-section"
                    ></div>

                </div>

            </div>
        `;


        if (isOwner) {

            const editButton =
                document.getElementById(
                    "businessEditBtn"
                );


            const deleteButton =
                document.getElementById(
                    "businessDeleteBtn"
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


        loadBusinessGalleryIntoDetails(
            business
        );


        /*
         * Reviews compatibility:
         * Supports all current LosOja review APIs.
         */

        if (
            window.Reviews &&
            typeof window.Reviews.renderForBusiness ===
            "function"
        ) {

            window.Reviews.renderForBusiness(
                business.id
            );

        } else if (
            typeof window.renderBusinessReviews ===
            "function"
        ) {

            window.renderBusinessReviews(
                business.id,
                "businessReviewsContainer"
            );

        } else if (
            typeof window.renderReviews ===
            "function"
        ) {

            window.renderReviews(
                business.id,
                "businessReviewsContainer"
            );

        } else {

            console.warn(
                "LosOja: Reviews system is not available yet."
            );

        }
    }


    /* =====================================================
       BUSINESS DETAILS GALLERY
    ===================================================== */

    async function loadBusinessGalleryIntoDetails(
        business
    ) {

        const container =
            document.getElementById(
                "businessDetailsGallery"
            );


        if (!container) {
            return;
        }


        const gallery =
            await getBusinessGallery(
                business.id
            );


        const images = [];


        if (
            business.image_url
        ) {

            images.push({

                image_url:
                    business.image_url,

                sort_order:
                    0

            });

        }


        gallery.forEach(
            item => {

                if (
                    item.image_url &&
                    !images.some(
                        image =>
                            image.image_url ===
                            item.image_url
                    )
                ) {

                    images.push(
                        item
                    );

                }

            }
        );


        if (!images.length) {

            container.innerHTML =
                "";

            return;
        }


        const galleryId =
            `losoja-gallery-${String(
                business.id
            ).replace(
                /[^a-zA-Z0-9_-]/g,
                ""
            )}`;


        container.innerHTML = `

            <div
                class="losoja-business-gallery"
                id="${galleryId}"
            >

                <div
                    class="losoja-gallery-main"
                >

                    <img
                        src="${escapeHTML(
                            images[0].image_url
                        )}"
                        alt="${escapeHTML(
                            business.name ||
                            "Business photo"
                        )}"
                        id="${galleryId}-main"
                    >

                </div>


                ${
                    images.length > 1
                        ? `
                            <div
                                class="losoja-gallery-thumbnails"
                            >

                                ${images
                                    .map(
                                        (
                                            image,
                                            index
                                        ) => `

                                            <button
                                                type="button"
                                                class="losoja-gallery-thumbnail ${
                                                    index === 0
                                                        ? "active"
                                                        : ""
                                                }"
                                                data-gallery-image="${escapeHTML(
                                                    image.image_url
                                                )}"
                                                aria-label="View business photo ${
                                                    index + 1
                                                }"
                                            >

                                                <img
                                                    src="${escapeHTML(
                                                        image.image_url
                                                    )}"
                                                    alt="Business photo ${
                                                        index + 1
                                                    }"
                                                    loading="lazy"
                                                >

                                            </button>

                                        `
                                    )
                                    .join("")}

                            </div>
                        `
                        : ""
                }

            </div>
        `;


        const mainImage =
            document.getElementById(
                `${galleryId}-main`
            );


        container
            .querySelectorAll(
                ".losoja-gallery-thumbnail"
            )
            .forEach(
                thumbnail => {

                    thumbnail.addEventListener(
                        "click",
                        function () {

                            if (!mainImage) {
                                return;
                            }


                            mainImage.src =
                                this.dataset.galleryImage;


                            container
                                .querySelectorAll(
                                    ".losoja-gallery-thumbnail"
                                )
                                .forEach(
                                    item =>
                                        item.classList.remove(
                                            "active"
                                        )
                                );


                            this.classList.add(
                                "active"
                            );

                        }
                    );

                }
            );
    }


    /* =====================================================
       WHATSAPP NUMBER
    ===================================================== */

    function formatWhatsAppNumber(
        phone
    ) {

        if (!phone) {
            return "";
        }


        let number =
            String(phone)
                .replace(
                    /[^0-9+]/g,
                    ""
                );


        if (
            number.startsWith(
                "+234"
            )
        ) {

            return number.replace(
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
       ADD BUSINESS MODAL
    ===================================================== */

    async function openAddBusiness() {

        /*
         * Give the auth system a chance to refresh
         * before deciding that the user is logged out.
         */

        await ensureSession();


        const userId =
            getCurrentUserId();


        if (!userId) {

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


        resetAddBusinessForm();


        openModal(
            "addBusinessModal"
        );
    }


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
                "<span>No photos selected.</span>";

            preview.classList.add(
                "hidden"
            );

        }
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


        await ensureSession();


        const userId =
            getCurrentUserId();


        if (!userId) {

            setError(
                "addBusinessError",
                "Please log in before adding a business."
            );

            return;
        }


        const name =
            document
                .getElementById(
                    "businessName"
                )
                ?.value
                .trim();


        const category =
            document
                .getElementById(
                    "businessCategory"
                )
                ?.value
                .trim();


        const location =
            document
                .getElementById(
                    "businessLocation"
                )
                ?.value
                .trim();


        const phone =
            document
                .getElementById(
                    "businessPhone"
                )
                ?.value
                .trim();


        const description =
            document
                .getElementById(
                    "businessDescription"
                )
                ?.value
                .trim();


        const imageInput =
            document.getElementById(
                "businessImage"
            );


        const files =
            imageInput &&
            imageInput.files
                ? Array.from(
                    imageInput.files
                )
                : [];


        if (!name) {

            setError(
                "addBusinessError",
                "Please enter a business name."
            );

            return;
        }


        if (!category) {

            setError(
                "addBusinessError",
                "Please select a business category."
            );

            return;
        }


        if (!location) {

            setError(
                "addBusinessError",
                "Please enter the business location."
            );

            return;
        }


        const imageValidation =
            validateSelectedFiles(
                files,
                MAX_BUSINESS_IMAGES
            );


        if (!imageValidation.valid) {

            setError(
                "addBusinessError",
                imageValidation.message
            );

            return;
        }


        const submitButton =
            document.querySelector(
                "#addBusinessForm button[type='submit']"
            );


        if (submitButton) {

            submitButton.disabled =
                true;

            submitButton.dataset.originalText =
                submitButton.textContent;

            submitButton.textContent =
                "Saving...";

        }


        try {

            /*
             * Upload selected images first.
             */

            const uploadedUrls =
                [];


            for (
                const file of files
            ) {

                const url =
                    await uploadBusinessImage(
                        file
                    );


                uploadedUrls.push(
                    url
                );

            }


            const mainImage =
                uploadedUrls.length
                    ? uploadedUrls[0]
                    : null;


            const businessPayload = {

                name,

                category,

                location,

                phone:
                    phone || null,

                description:
                    description || null,

                user_id:
                    userId,

                image_url:
                    mainImage

            };


            /*
             * Save the actual business.
             */

            const response =
                await supabaseFetch(
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
                                businessPayload
                            )
                    }
                );


            if (!response.ok) {

                let message =
                    "Business could not be saved.";


                try {

                    const error =
                        await response.json();

                    message =
                        error.message ||
                        error.error ||
                        error.details ||
                        error.hint ||
                        message;

                } catch (_) {}


                throw new Error(
                    message
                );
            }


            const createdBusinesses =
                await response.json();


            const createdBusiness =
                Array.isArray(
                    createdBusinesses
                )
                    ? createdBusinesses[0]
                    : createdBusinesses;


            let galleryWarning =
                false;


            /*
             * Save additional images.
             */

            if (
                createdBusiness &&
                createdBusiness.id &&
                uploadedUrls.length > 1
            ) {

                try {

                    await insertBusinessGallery(
                        createdBusiness.id,
                        userId,
                        uploadedUrls.slice(1),
                        1
                    );

                } catch (galleryError) {

                    console.error(
                        "LosOja additional business photos error:",
                        galleryError
                    );

                    galleryWarning =
                        true;

                }

            }


            closeModal(
                "addBusinessModal"
            );


            resetAddBusinessForm();


            if (galleryWarning) {

                showBusinessNotification(
                    "Business saved, but some additional photos could not be saved.",
                    "error"
                );

            } else {

                showBusinessNotification(
                    "Business added successfully.",
                    "success"
                );

            }


            await loadBusinesses();


            const businessSection =
                document.getElementById(
                    "businesses"
                );


            if (businessSection) {

                businessSection.scrollIntoView({
                    behavior:
                        "smooth"
                });

            }


        } catch (error) {

            console.error(
                "LosOja add business error:",
                error
            );


            setError(
                "addBusinessError",

                error.message ||
                "Business could not be saved. Please try again."
            );


        } finally {

            if (submitButton) {

                submitButton.disabled =
                    false;

                submitButton.textContent =
                    submitButton.dataset.originalText ||
                    "Save Business";

            }

        }
    }


    /* =====================================================
       EDIT BUSINESS
    ===================================================== */

    async function openEditBusiness(
        business
    ) {

        if (!business) {
            return;
        }


        await ensureSession();


        const currentUserId =
            getCurrentUserId();


        if (
            !currentUserId ||
            String(currentUserId) !==
            String(business.user_id)
        ) {

            showBusinessNotification(
                "You can only edit your own business.",
                "error"
            );

            return;
        }


        const editId =
            document.getElementById(
                "editBusinessId"
            );


        const editName =
            document.getElementById(
                "editBusinessName"
            );


        const editCategory =
            document.getElementById(
                "editBusinessCategory"
            );


        const editLocation =
            document.getElementById(
                "editBusinessLocation"
            );


        const editPhone =
            document.getElementById(
                "editBusinessPhone"
            );


        const editDescription =
            document.getElementById(
                "editBusinessDescription"
            );


        if (
            !editId ||
            !editName ||
            !editCategory ||
            !editLocation ||
            !editPhone ||
            !editDescription
        ) {

            console.error(
                "LosOja: One or more edit business fields are missing."
            );


            showBusinessNotification(
                "The edit business form could not be opened.",
                "error"
            );


            return;
        }


        editId.value =
            business.id || "";


        editName.value =
            business.name || "";


        editCategory.value =
            business.category || "";


        editLocation.value =
            business.location || "";


        editPhone.value =
            business.phone || "";


        editDescription.value =
            business.description || "";


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
                "<span>No new photos selected.</span>";

            preview.classList.add(
                "hidden"
            );

        }


        const galleryContainer =
            document.getElementById(
                "editBusinessGallery"
            );


        if (galleryContainer) {

            galleryContainer.innerHTML =
                `
                    <div class="loading-message">
                        Loading existing photos...
                    </div>
                `;

        }


        openModal(
            "editBusinessModal"
        );


        loadExistingEditGallery(
            business
        );
    }


    async function loadExistingEditGallery(
        business
    ) {

        const container =
            document.getElementById(
                "editBusinessGallery"
            );


        if (!container) {
            return;
        }


        const gallery =
            await getBusinessGallery(
                business.id
            );


        const images = [];


        if (
            business.image_url
        ) {

            images.push({

                image_url:
                    business.image_url,

                is_main:
                    true

            });

        }


        gallery.forEach(
            image => {

                if (
                    image.image_url &&
                    !images.some(
                        existing =>
                            existing.image_url ===
                            image.image_url
                    )
                ) {

                    images.push({

                        ...image,

                        is_main:
                            false

                    });

                }

            }
        );


        if (!images.length) {

            container.innerHTML =
                `
                    <p class="form-help">
                        No existing photos.
                    </p>
                `;

            return;
        }


        container.innerHTML = `

            <div class="business-edit-gallery-list">

                <p class="form-help">
                    Existing photos:
                </p>


                <div
                    class="business-edit-gallery-grid"
                >

                    ${images
                        .map(
                            (
                                image,
                                index
                            ) => `

                                <div
                                    class="business-edit-gallery-item"
                                >

                                    <img
                                        src="${escapeHTML(
                                            image.image_url
                                        )}"
                                        alt="Business photo ${
                                            index + 1
                                        }"
                                        loading="lazy"
                                    >

                                    <span>
                                        ${
                                            index === 0
                                                ? "Main photo"
                                                : `Photo ${
                                                    index + 1
                                                }`
                                        }
                                    </span>

                                </div>

                            `
                        )
                        .join("")}

                </div>

            </div>
        `;
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


        await ensureSession();


        const userId =
            getCurrentUserId();


        if (!userId) {

            setError(
                "editBusinessError",
                "Please log in before editing your business."
            );

            return;
        }


        const businessId =
            document
                .getElementById(
                    "editBusinessId"
                )
                ?.value
                .trim();


        if (!businessId) {

            setError(
                "editBusinessError",
                "Business ID is missing."
            );

            return;
        }


        const name =
            document
                .getElementById(
                    "editBusinessName"
                )
                ?.value
                .trim();


        const category =
            document
                .getElementById(
                    "editBusinessCategory"
                )
                ?.value
                .trim();


        const location =
            document
                .getElementById(
                    "editBusinessLocation"
                )
                ?.value
                .trim();


        const phone =
            document
                .getElementById(
                    "editBusinessPhone"
                )
                ?.value
                .trim();


        const description =
            document
                .getElementById(
                    "editBusinessDescription"
                )
                ?.value
                .trim();


        const imageInput =
            document.getElementById(
                "editBusinessImage"
            );


        const files =
            imageInput &&
            imageInput.files
                ? Array.from(
                    imageInput.files
                )
                : [];


        if (!name) {

            setError(
                "editBusinessError",
                "Please enter a business name."
            );

            return;
        }


        if (!category) {

            setError(
                "editBusinessError",
                "Please select a business category."
            );

            return;
        }


        if (!location) {

            setError(
                "editBusinessError",
                "Please enter the business location."
            );

            return;
        }


        const imageValidation =
            validateSelectedFiles(
                files,
                MAX_BUSINESS_IMAGES
            );


        if (!imageValidation.valid) {

            setError(
                "editBusinessError",
                imageValidation.message
            );

            return;
        }


        const submitButton =
            document.querySelector(
                "#editBusinessForm button[type='submit']"
            );


        if (submitButton) {

            submitButton.disabled =
                true;

            submitButton.dataset.originalText =
                submitButton.textContent;

            submitButton.textContent =
                "Saving...";

        }


        try {

            const businesses =
                window.losojaBusinesses ||
                [];


            const existingBusiness =
                businesses.find(
                    business =>
                        String(
                            business.id
                        ) ===
                        String(
                            businessId
                        )
                );


            if (!existingBusiness) {

                throw new Error(
                    "Business could not be found."
                );

            }


            if (
                String(
                    existingBusiness.user_id
                ) !==
                String(userId)
            ) {

                throw new Error(
                    "You can only edit your own business."
                );

            }


            const existingGallery =
                await getBusinessGallery(
                    businessId
                );


            const existingPhotoCount =
                (
                    existingBusiness.image_url
                        ? 1
                        : 0
                ) +
                existingGallery.length;


            const availableSlots =
                Math.max(
                    0,
                    MAX_BUSINESS_IMAGES -
                    existingPhotoCount
                );


            if (
                files.length >
                availableSlots
            ) {

                throw new Error(
                    `This business already has ${existingPhotoCount} photo(s). You can add only ${availableSlots} more.`
                );

            }


            const businessPayload = {

                name,

                category,

                location,

                phone:
                    phone || null,

                description:
                    description || null

            };


            let filesToUpload =
                files.slice();


            /*
             * If the business does not have a main image,
             * the first new photo becomes the main image.
             */

            if (
                !existingBusiness.image_url &&
                filesToUpload.length
            ) {

                const mainFile =
                    filesToUpload.shift();


                const mainUrl =
                    await uploadBusinessImage(
                        mainFile
                    );


                businessPayload.image_url =
                    mainUrl;

            }


            const response =
                await supabaseFetch(
                    `${SUPABASE_URL}/rest/v1/businesses?id=eq.${encodeURIComponent(
                        businessId
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
                                businessPayload
                            )
                    }
                );


            if (!response.ok) {

                let message =
                    "Business could not be updated.";


                try {

                    const error =
                        await response.json();

                    message =
                        error.message ||
                        error.error ||
                        error.details ||
                        error.hint ||
                        message;

                } catch (_) {}


                throw new Error(
                    message
                );
            }


            /*
             * Upload remaining new photos.
             */

            const uploadedAdditionalUrls =
                [];


            for (
                const file of filesToUpload
            ) {

                const url =
                    await uploadBusinessImage(
                        file
                    );


                uploadedAdditionalUrls.push(
                    url
                );

            }


            let galleryWarning =
                false;


            if (
                uploadedAdditionalUrls.length
            ) {

                const highestSortOrder =
                    existingGallery.reduce(
                        (
                            highest,
                            item
                        ) =>
                            Math.max(
                                highest,
                                Number(
                                    item.sort_order
                                ) || 0
                            ),

                        existingBusiness.image_url
                            ? 0
                            : -1
                    );


                try {

                    await insertBusinessGallery(
                        businessId,
                        userId,
                        uploadedAdditionalUrls,
                        highestSortOrder + 1
                    );

                } catch (galleryError) {

                    console.error(
                        "LosOja edit gallery save error:",
                        galleryError
                    );

                    galleryWarning =
                        true;

                }

            }


            closeModal(
                "editBusinessModal"
            );


            if (galleryWarning) {

                showBusinessNotification(
                    "Business updated, but some additional photos could not be saved.",
                    "error"
                );

            } else {

                showBusinessNotification(
                    "Business updated successfully.",
                    "success"
                );

            }


            await loadBusinesses();


        } catch (error) {

            console.error(
                "LosOja edit business error:",
                error
            );


            setError(
                "editBusinessError",

                error.message ||
                "Business could not be updated. Please try again."
            );


        } finally {

            if (submitButton) {

                submitButton.disabled =
                    false;

                submitButton.textContent =
                    submitButton.dataset.originalText ||
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


        await ensureSession();


        const userId =
            getCurrentUserId();


        if (!userId) {

            showBusinessNotification(
                "Please log in first.",
                "error"
            );

            return;
        }


        try {

            /*
             * user_id is included in the filter.
             * This prevents a user from deleting another
             * user's business even before RLS is considered.
             */

            const response =
                await supabaseFetch(
                    `${SUPABASE_URL}/rest/v1/businesses?id=eq.${encodeURIComponent(
                        businessId
                    )}&user_id=eq.${encodeURIComponent(
                        userId
                    )}`,
                    {
                        method: "DELETE"
                    }
                );


            if (!response.ok) {

                let message =
                    "Business could not be deleted.";


                try {

                    const error =
                        await response.json();

                    message =
                        error.message ||
                        error.error ||
                        error.details ||
                        message;

                } catch (_) {}


                throw new Error(
                    message
                );
            }


            closeAllBusinessModals();


            showBusinessNotification(
                "Business deleted successfully.",
                "success"
            );


            await loadBusinesses();


        } catch (error) {

            console.error(
                "LosOja delete business error:",
                error
            );


            showBusinessNotification(
                error.message ||
                "Business could not be deleted.",
                "error"
            );
        }
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


                    const locationText =
                        String(
                            business.location ||
                            ""
                        )
                            .toLowerCase();


                    const matchesSearch =
                        !search ||
                        searchableText.includes(
                            search
                        );


                    const matchesLocation =
                        !location ||
                        locationText.includes(
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


        const businessSection =
            document.getElementById(
                "businesses"
            );


        if (businessSection) {

            businessSection.scrollIntoView({
                behavior:
                    "smooth"
            });

        }
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


        const normalizedCategory =
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
                    normalizedCategory
            );


        renderBusinesses(
            filtered
        );


        const businessSection =
            document.getElementById(
                "businesses"
            );


        if (businessSection) {

            businessSection.scrollIntoView({
                behavior:
                    "smooth"
            });

        }
    }


    /* =====================================================
       EVENT BINDINGS
    ===================================================== */

    let eventsBound =
        false;


    function setupBusinessEvents() {

        /*
         * Prevent duplicate event listeners if init()
         * is accidentally called more than once.
         */

        if (eventsBound) {
            return;
        }


        eventsBound =
            true;


        /*
         * ADD BUSINESS BUTTON
         *
         * Supports:
         * #addBusinessBtn
         * .add-business-btn
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
                event.stopPropagation();


                openAddBusiness();

            }
        );


        /* =================================================
           ADD BUSINESS FORM
        ================================================= */

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


        /* =================================================
           EDIT BUSINESS FORM
        ================================================= */

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


        /* =================================================
           ADD IMAGE INPUT
        ================================================= */

        const addImageInput =
            document.getElementById(
                "businessImage"
            );


        if (addImageInput) {

            addImageInput.addEventListener(
                "change",
                function () {

                    const files =
                        Array.from(
                            this.files || []
                        );


                    const validation =
                        validateSelectedFiles(
                            files,
                            MAX_BUSINESS_IMAGES
                        );


                    if (!validation.valid) {

                        this.value =
                            "";


                        setError(
                            "addBusinessError",
                            validation.message
                        );


                        previewBusinessImages(
                            "businessImage",
                            "imagePreview",
                            "No photos selected."
                        );


                        return;
                    }


                    setError(
                        "addBusinessError",
                        ""
                    );


                    previewBusinessImages(
                        "businessImage",
                        "imagePreview",
                        "No photos selected."
                    );

                }
            );
        }


        /* =================================================
           EDIT IMAGE INPUT
        ================================================= */

        const editImageInput =
            document.getElementById(
                "editBusinessImage"
            );


        if (editImageInput) {

            editImageInput.addEventListener(
                "change",
                async function () {

                    const files =
                        Array.from(
                            this.files || []
                        );


                    const validation =
                        validateSelectedFiles(
                            files,
                            MAX_BUSINESS_IMAGES
                        );


                    if (!validation.valid) {

                        this.value =
                            "";


                        setError(
                            "editBusinessError",
                            validation.message
                        );


                        previewBusinessImages(
                            "editBusinessImage",
                            "editImagePreview",
                            "No new photos selected."
                        );


                        return;
                    }


                    const businessId =
                        document
                            .getElementById(
                                "editBusinessId"
                            )
                            ?.value;


                    if (
                        businessId &&
                        files.length
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


                        if (business) {

                            const gallery =
                                await getBusinessGallery(
                                    businessId
                                );


                            const currentCount =
                                (
                                    business.image_url
                                        ? 1
                                        : 0
                                ) +
                                gallery.length;


                            const available =
                                Math.max(
                                    0,
                                    MAX_BUSINESS_IMAGES -
                                    currentCount
                                );


                            if (
                                files.length >
                                available
                            ) {

                                this.value =
                                    "";


                                setError(
                                    "editBusinessError",

                                    `This business already has ${currentCount} photo(s). You can add only ${available} more.`
                                );


                                previewBusinessImages(
                                    "editBusinessImage",
                                    "editImagePreview",
                                    "No new photos selected."
                                );


                                return;
                            }
                        }
                    }


                    setError(
                        "editBusinessError",
                        ""
                    );


                    previewBusinessImages(
                        "editBusinessImage",
                        "editImagePreview",
                        "No new photos selected."
                    );

                }
            );
        }


        /* =================================================
           CLOSE MODAL BUTTONS
        ================================================= */

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


        /* =================================================
           CLICK OUTSIDE MODAL
        ================================================= */

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


        /* =================================================
           CATEGORY CARDS
        ================================================= */

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


        /* =================================================
           SEARCH FORM
        ================================================= */

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

    }


    /* =====================================================
       INITIALIZATION
    ===================================================== */

    async function init() {

        setupBusinessEvents();


        previewBusinessImages(
            "businessImage",
            "imagePreview",
            "No photos selected."
        );


        previewBusinessImages(
            "editBusinessImage",
            "editImagePreview",
            "No new photos selected."
        );


        await loadBusinesses();

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

        deleteBusiness,

        getBusinessGallery,

        uploadBusinessImage

    };


    /*
     * Global compatibility functions.
     *
     * Other LosOja files can continue using these.
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
```
