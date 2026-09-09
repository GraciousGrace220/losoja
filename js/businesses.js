```javascript
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
                    "losoja_supabase_session"
                );

            if (!raw) {
                return null;
            }

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

        const session =
            getSession();

        return (
            session?.access_token ||
            session?.accessToken ||
            null
        );
    }


    function getCurrentUserId() {

        const session =
            getSession();

        return (
            session?.user?.id ||
            null
        );
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

        if (!modal) {

            console.error(
                "LosOja: Modal not found:",
                id
            );

            return;
        }

        modal.classList.remove("hidden");
        modal.classList.add("active");

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

        const modal =
            document.getElementById(id);

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

        if (
            !input ||
            !input.files
        ) {

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
            "
```
