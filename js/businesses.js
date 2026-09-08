/*
=========================================================
LosOja - Business Management
js/businesses.js

Handles:
- Loading businesses from Supabase
- Displaying businesses
- Searching businesses
- Filtering by category
- Viewing business details
- Business reviews
- Adding businesses
- Editing businesses
- Deleting businesses
- Business image uploads
- Multiple business photos
- Business photo gallery
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
       SESSION
    ===================================================== */

    function getSession() {

        try {

            return JSON.parse(
                localStorage.getItem("losoja_supabase_session")
            );

        } catch (error) {

            console.error(
                "LosOja session read error:",
                error
            );

            return null;
        }
    }


    function getAccessToken() {

        const session =
            getSession();

        return session &&
            session.access_token
            ? session.access_token
            : null;
    }


    function getCurrentUserId() {

        const session =
            getSession();

        return session &&
            session.user &&
            session.user.id
            ? session.user.id
            : null;
    }


    /* =====================================================
       AUTH REFRESH
    ===================================================== */

    async function ensureSession() {

        try {

            if (
                typeof window.ensureValidSupabaseSession ===
                "function"
            ) {

                await window.ensureValidSupabaseSession();
            }

        } catch (error) {

            console.warn(
                "LosOja session refresh warning:",
                error
            );
        }

        return getAccessToken();
    }


    /* =====================================================
       HEADERS
    ===================================================== */

   function getHeaders(
    includeContentType = false
) {

    const token =
        getAccessToken();

    const headers = {
        "apikey":
            LOSOJA_BUSINESSES_KEY
    };

    /*
    ---------------------------------------------------------
    Only send Authorization when we actually have a
    Supabase user access token.

    The sb_publishable_ key is an API key, NOT a JWT.
    ---------------------------------------------------------
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


        alert(message);
    }


    /* =====================================================
       MODAL HELPERS
    ===================================================== */

    function openModal(id) {

        const modal =
            document.getElementById(id);

        if (!modal) return;

        modal.classList.add("active");

        modal.style.display =
            "flex";

        document.body.classList.add(
            "modal-open"
        );
    }


    function closeModal(id) {

        const modal =
            document.getElementById(id);

        if (!modal) return;

        modal.classList.remove("active");

        modal.style.display =
            "none";

        const anyOpenModal =
            document.querySelector(
                ".modal-overlay.active"
            );

        if (!anyOpenModal) {

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
        ].forEach(closeModal);
    }


    /* =====================================================
       ESCAPE HTML
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

        if (!element) return;

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

    function validateImageFile(file) {

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


    function getSelectedFiles(inputId) {

        const input =
            document.getElementById(
                inputId
            );

        if (!input || !input.files) {

            return [];
        }

        return Array.from(
            input.files
        );
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


        for (const file of files) {

            const result =
                validateImageFile(file);

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

        if (!input || !preview) return;


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
            (file, index) => {

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


    function previewBusinessImage(
        inputId,
        previewId
    ) {

        previewBusinessImages(
            inputId,
            previewId,
            "No photos selected."
        );
    }


    /* =====================================================
       STORAGE UPLOAD
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


        const response =
            await fetch(
                `${LOSOJA_BUSINESSES_URL}/storage/v1/object/${STORAGE_BUCKET}/${filePath}`,
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

                    body: file
                }
            );


        if (!response.ok) {

            let errorText =
                "Image upload failed.";

            try {

                const errorData =
                    await response.json();

                errorText =
                    errorData.message ||
                    errorData.error ||
                    errorText;

            } catch (_) {}


            throw new Error(
                errorText
            );
        }


        return (
            `${LOSOJA_BUSINESSES_URL}` +
            `/storage/v1/object/public/` +
            `${STORAGE_BUCKET}/` +
            `${filePath}`
        );
    }


    /* =====================================================
       BUSINESS GALLERY DATABASE
    ===================================================== */

    async function getBusinessGallery(
        businessId
    ) {

        if (!businessId) {

            return [];
        }


        const url =
            `${LOSOJA_BUSINESSES_URL}` +
            `/rest/v1/${BUSINESS_IMAGES_TABLE}` +
            `?business_id=eq.${encodeURIComponent(
                businessId
            )}` +
            `&select=*` +
            `&order=sort_order.asc,created_at.asc`;


        const response =
            await fetch(
                url,
                {
                    method: "GET",

                    headers:
                        getHeaders()
                }
            );


        if (!response.ok) {

            let message =
                "Could not load business photos.";

            try {

                const error =
                    await response.json();

                message =
                    error.message ||
                    error.error ||
                    message;

            } catch (_) {}


            console.error(
                "Business gallery error:",
                message
            );

            return [];
        }


        return await response.json();
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
                (url, index) => ({
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
            await fetch(
                `${LOSOJA_BUSINESSES_URL}/rest/v1/${BUSINESS_IMAGES_TABLE}`,
                {
                    method: "POST",

                    headers: {
                        ...getHeaders(true),

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

        const grid =
            document.getElementById(
                "businessGrid"
            );

        const noResults =
            document.getElementById(
                "noResults"
            );


        if (!grid) return;


        grid.innerHTML = `
            <div class="loading-message">
                Businesses are loading...
            </div>
        `;


        try {

            const response =
                await fetch(
                    `${LOSOJA_BUSINESSES_URL}/rest/v1/businesses?select=*&order=created_at.desc`,
                    {
                        method: "GET",

                        headers:
                            getHeaders()
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
                businesses;


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
       BUSINESS IMAGE
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
                <div class="business-image ${extraClass}">
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
            <div class="business-image ${extraClass}">
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
                .map(businessCard)
                .join("");


        grid
            .querySelectorAll(
                ".business-view-btn"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    function () {

                        const id =
                            this.dataset.businessId;

                        openBusiness(id);
                    }
                );
            });
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
                "businessDetailsContent was not found."
            );

            return;
        }


        const currentUserId =
            getCurrentUserId();


        const isOwner =
            currentUserId &&
            business.user_id &&
            String(currentUserId) ===
            String(business.user_id);


        container.innerHTML = `

            <div class="business-details">

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

                <div class="business-details-content">

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
                                    <h3>About this business</h3>
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
                    >
                        <div class="loading-message">
                            Loading reviews...
                        </div>
                    </div>

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


        if (
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
        }
    }


    /* =====================================================
       DETAILS GALLERY
    ===================================================== */

    async function loadBusinessGalleryIntoDetails(
        business
    ) {

        const container =
            document.getElementById(
                "businessDetailsGallery"
            );


        if (!container) return;


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

                    images.push(item);
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

                            if (
                                !mainImage
                            ) return;


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

        if (!phone) return "";


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

    function openAddBusiness() {

        const userId =
            getCurrentUserId();


        if (!userId) {

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


        const modal =
            document.getElementById(
                "addBusinessModal"
            );


        if (!modal) {

            console.error(
                "LosOja: addBusinessModal was not found."
            );

            return;
        }


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

            let uploadedUrls =
                [];


            /* =============================================
               UPLOAD PHOTOS
            ============================================= */

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


            /* =============================================
               CREATE BUSINESS
            ============================================= */

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


            const response =
                await fetch(
                    `${LOSOJA_BUSINESSES_URL}/rest/v1/businesses`,
                    {
                        method: "POST",

                        headers: {
                            ...getHeaders(true),

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


            /* =============================================
               SAVE ADDITIONAL PHOTOS
            ============================================= */

            let galleryWarning =
                false;


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
                        "Additional business photos error:",
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
                    behavior: "smooth"
                });
            }


        } catch (error) {

            console.error(
                "Add business error:",
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

        if (!business) return;


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
            "editBusinessPhone"
        ).value =
            business.phone || "";


        document.getElementById(
            "editBusinessDescription"
        ).value =
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


        if (!container) return;


        const gallery =
            await getBusinessGallery(
                business.id
            );


        const images = [];


        if (business.image_url) {

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

            /* =============================================
               FIND EXISTING BUSINESS
            ============================================= */

            const businesses =
                window.losojaBusinesses ||
                [];


            const existingBusiness =
                businesses.find(
                    business =>
                        String(business.id) ===
                        String(businessId)
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


            /* =============================================
               GET EXISTING GALLERY
            ============================================= */

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


            /* =============================================
               UPDATE BUSINESS INFORMATION
            ============================================= */

            const businessPayload = {

                name,

                category,

                location,

                phone:
                    phone || null,

                description:
                    description || null
            };


            /*
             * If an old business has no main image,
             * the first new image becomes its main image.
             */

            let filesToUpload =
                files.slice();


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
                await fetch(
                    `${LOSOJA_BUSINESSES_URL}/rest/v1/businesses?id=eq.${encodeURIComponent(
                        businessId
                    )}`,
                    {
                        method: "PATCH",

                        headers: {
                            ...getHeaders(true),

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
                        message;

                } catch (_) {}


                throw new Error(
                    message
                );
            }


            /* =============================================
               UPLOAD NEW ADDITIONAL PHOTOS
            ============================================= */

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


            /* =============================================
               SAVE NEW GALLERY PHOTOS
            ============================================= */

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
                        "Edit gallery save error:",
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
                "Edit business error:",
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

        if (!businessId) return;


        const confirmed =
            confirm(
                "Are you sure you want to delete this business?"
            );


        if (!confirmed) return;


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

            const response =
                await fetch(
                    `${LOSOJA_BUSINESSES_URL}/rest/v1/businesses?id=eq.${encodeURIComponent(
                        businessId
                    )}&user_id=eq.${encodeURIComponent(
                        userId
                    )}`,
                    {
                        method: "DELETE",

                        headers:
                            getHeaders()
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
                        message;

                } catch (_) {}


                throw new Error(
                    message
                );
            }


            /*
             * business_images rows are automatically
             * removed by the database because the
             * business_images.business_id foreign key
             * uses ON DELETE CASCADE.
             */

            closeAllBusinessModals();


            showBusinessNotification(
                "Business deleted successfully.",
                "success"
            );


            await loadBusinesses();


        } catch (error) {

            console.error(
                "Delete business error:",
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
                behavior: "smooth"
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
                behavior: "smooth"
            });
        }
    }


    /* =====================================================
       EVENT BINDINGS
    ===================================================== */

    function setupBusinessEvents() {

        /* -----------------------------------------------
           ADD BUSINESS BUTTONS
        ------------------------------------------------ */

        document.addEventListener(
            "click",
            function (event) {

                const button =
                    event.target.closest(
                        "#addBusinessBtn, .add-business-btn"
                    );


                if (!button) return;


                event.preventDefault();

                event.stopPropagation();


                openAddBusiness();
            }
        );


        /* -----------------------------------------------
           ADD BUSINESS FORM
        ------------------------------------------------ */

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


        /* -----------------------------------------------
           EDIT BUSINESS FORM
        ------------------------------------------------ */

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


        /* -----------------------------------------------
           ADD PHOTO PREVIEW
        ------------------------------------------------ */

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


                    if (
                        !validation.valid
                    ) {

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


        /* -----------------------------------------------
           EDIT PHOTO PREVIEW
        ------------------------------------------------ */

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


                    if (
                        !validation.valid
                    ) {

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


                    /*
                     * Check how many photos the
                     * business already has.
                     */

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


        /* -----------------------------------------------
           CLOSE BUTTONS
        ------------------------------------------------ */

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


        /* -----------------------------------------------
           MODAL BACKDROP
        ------------------------------------------------ */

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

                                modal.classList.remove(
                                    "active"
                                );

                                modal.style.display =
                                    "none";
                            }
                        }
                    );
                }
            );


        /* -----------------------------------------------
           CATEGORY CARDS
        ------------------------------------------------ */

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


        /* -----------------------------------------------
           SEARCH FORM
        ------------------------------------------------ */

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


        /*
         * Initial previews.
         */

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
     * Keep these global names available because other
     * LosOja files may already use them.
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
