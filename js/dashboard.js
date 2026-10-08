
/*
=========================================================
LosOja - Dashboard
js/dashboard.js

Handles:
- My Dashboard
- User's businesses
- Edit business
- Delete business
- Business price
- Business pictures
=========================================================
*/

(function () {

    "use strict";


    const SUPABASE_URL =
        "https://ycxshwgeebskdozmornh.supabase.co";

    const SUPABASE_KEY =
        "sb_publishable_jFSLacwNupO6T8EnSqb2bw_bZmy7rVe";


    const BUSINESS_IMAGE_BUCKET =
        "business-images";

    const MAX_BUSINESS_IMAGES =
        5;

    const MAX_IMAGE_SIZE =
        5 * 1024 * 1024;


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

        return getSession()?.user || null;
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

    function headers() {

        const token =
            getToken();


        return {

            "apikey":
                SUPABASE_KEY,

            "Content-Type":
                "application/json",

            "Accept":
                "application/json",

            ...(token
                ? {
                    "Authorization":
                        "Bearer " + token
                }
                : {})
        };
    }


    /* =====================================================
       ESCAPE
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
       DASHBOARD
    ===================================================== */

    function show() {

        const user =
            getUser();

        if (!user) {

            if (
                window.App &&
                typeof App.openModal ===
                "function"
            ) {

                App.openModal(
                    "loginModal"
                );
            }

            return;
        }


        const dashboard =
            document.getElementById(
                "dashboard"
            );

        if (!dashboard) return;


        document.querySelectorAll(
            "main > section"
        ).forEach(
            function (section) {

                if (
                    section.id !==
                    "dashboard"
                ) {

                    section.classList.add(
                        "hidden"
                    );
                }
            }
        );


        dashboard.classList.remove(
            "hidden"
        );


        dashboard.scrollIntoView({
            behavior:
                "smooth",
            block:
                "start"
        });


        load();
    }


    function hide() {

        const dashboard =
            document.getElementById(
                "dashboard"
            );


        if (dashboard) {

            dashboard.classList.add(
                "hidden"
            );
        }


        document.querySelectorAll(
            "main > section"
        ).forEach(
            function (section) {

                if (
                    section.id !==
                    "dashboard"
                ) {

                    section.classList.remove(
                        "hidden"
                    );
                }
            }
        );
    }


    /* =====================================================
       LOAD
    ===================================================== */

    async function load() {

        const user =
            getUser();

        const token =
            getToken();


        const list =
            document.getElementById(
                "dashboardBusinesses"
            );

        const empty =
            document.getElementById(
                "dashboardEmpty"
            );


        if (!list || !empty) {
            return;
        }


        if (
            !user ||
            !token
        ) {

            list.innerHTML = "";

            empty.classList.remove(
                "hidden"
            );

            return;
        }


        list.innerHTML = `
            <p>
                Loading your businesses...
            </p>
        `;

        empty.classList.add(
            "hidden"
        );


        try {

            const response =
                await fetch(
                    SUPABASE_URL +
                    "/rest/v1/businesses?user_id=eq." +
                    encodeURIComponent(
                        user.id
                    ) +
                    "&select=*&order=created_at.desc",
                    {
                        method:
                            "GET",
                        headers:
                            headers()
                    }
                );


            if (!response.ok) {

                let message =
                    "Could not load your businesses.";

                try {

                    const data =
                        await response.json();

                    message =
                        data.message ||
                        data.details ||
                        data.hint ||
                        message;

                } catch {}


                throw new Error(
                    message
                );
            }


            const businesses =
                await response.json();


            if (
                !businesses ||
                businesses.length === 0
            ) {

                list.innerHTML = "";

                empty.classList.remove(
                    "hidden"
                );

                return;
            }


            empty.classList.add(
                "hidden"
            );


            list.innerHTML =
                businesses
                    .map(
                        dashboardCard
                    )
                    .join("");


        } catch (error) {

            console.error(
                "LosOja dashboard error:",
                error
            );


            list.innerHTML = `
                <div class="no-results">

                    <p>
                        Could not load your businesses.
                    </p>

                    <p style="font-size:0.85rem;color:#64748b;">
                        ${escapeHTML(
                            error.message
                        )}
                    </p>

                </div>
            `;
        }
    }


    /* =====================================================
       CARD
    ===================================================== */

    function dashboardCard(
        business
    ) {

        const id =
            escapeHTML(
                business.id
            );


        const price =
            business.price !== null &&
            business.price !== undefined &&
            String(business.price).trim() !== ""
                ? `
                    <p>
                        💰 ₦${escapeHTML(
                            Number(
                                business.price
                            ).toLocaleString(
                                "en-NG"
                            )
                        )}
                    </p>
                `
                : "";


        return `
            <div class="dashboard-business">

                <div>

                    <span class="business-category">
                        ${escapeHTML(
                            business.category
                        )}
                    </span>

                    <h3>
                        ${escapeHTML(
                            business.name
                        )}
                    </h3>

                    <p>
                        📍 ${escapeHTML(
                            business.location
                        )}
                    </p>

                    ${price}

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

                </div>


                <div class="dashboard-business-actions">

                    <button
                        type="button"
                        class="btn btn-outline"
                        onclick="openEditBusiness('${id}')"
                    >
                        Edit
                    </button>


                    <button
                        type="button"
                        class="btn btn-outline"
                        onclick="deleteDashboardBusiness('${id}')"
                    >
                        Delete
                    </button>

                </div>

            </div>
        `;
    }


    /* =====================================================
       DELETE
    ===================================================== */

    async function deleteDashboardBusiness(
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

            if (
                window.App
            ) {

                App.showToast(
                    "Please log in first."
                );
            }

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

            const response =
                await fetch(
                    SUPABASE_URL +
                    "/rest/v1/businesses?id=eq." +
                    encodeURIComponent(
                        id
                    ) +
                    "&user_id=eq." +
                    encodeURIComponent(
                        user.id
                    ),
                    {
                        method:
                            "DELETE",

                        headers:
                            headers()
                    }
                );


            if (!response.ok) {

                let message =
                    "Business could not be deleted.";

                try {

                    const data =
                        await response.json();

                    message =
                        data.message ||
                        data.details ||
                        data.hint ||
                        message;

                } catch {}


                throw new Error(
                    message
                );
            }


            if (
                window.App
            ) {

                App.showToast(
                    "Business deleted successfully."
                );
            }


            await load();


            if (
                typeof window.loadBusinesses ===
                "function"
            ) {

                await window.loadBusinesses();
            }


        } catch (error) {

            console.error(
                "LosOja delete error:",
                error
            );


            if (
                window.App
            ) {

                App.showToast(
                    error.message
                );
            }
        }
    }


    /* =====================================================
       IMAGE HELPERS
    ===================================================== */

    function getImageExtension(
        file
    ) {

        const name =
            String(
                file?.name || ""
            ).toLowerCase();


        const extension =
            name.split(".").pop();


        if (
            extension === "jpg" ||
            extension === "jpeg" ||
            extension === "png" ||
            extension === "webp" ||
            extension === "gif"
        ) {

            return extension;
        }


        if (
            file?.type ===
            "image/jpeg"
        ) {

            return "jpg";
        }


        if (
            file?.type ===
            "image/png"
        ) {

            return "png";
        }


        if (
            file?.type ===
            "image/webp"
        ) {

            return "webp";
        }


        if (
            file?.type ===
            "image/gif"
        ) {

            return "gif";
        }


        return "jpg";
    }


    function validImageType(
        file
    ) {

        const allowed =
            [
                "image/jpeg",
                "image/png",
                "image/webp",
                "image/gif"
            ];


        return allowed.includes(
            file?.type
        );
    }


    function getPublicImageUrl(
        path
    ) {

        return (
            SUPABASE_URL +
            "/storage/v1/object/public/" +
            BUSINESS_IMAGE_BUCKET +
            "/" +
            path
        );
    }


    async function uploadBusinessImage(
        file,
        businessId
    ) {

        if (!file) {
            throw new Error(
                "No image selected."
            );
        }


        if (
            !validImageType(file)
        ) {

            throw new Error(
                "Only JPG, PNG, WEBP and GIF images are allowed."
            );
        }


        if (
            file.size >
            MAX_IMAGE_SIZE
        ) {

            throw new Error(
                "Each business picture must be 5MB or smaller."
            );
        }


        const extension =
            getImageExtension(
                file
            );


        const randomPart =
            Math.random()
                .toString(36)
                .substring(
                    2,
                    10
                );


        const uploadPath =
            "businesses/" +
            "business_" +
            businessId +
            "_" +
            Date.now() +
            "_" +
            randomPart +
            "." +
            extension;


        const token =
            getToken();


        const response =
            await fetch(
                SUPABASE_URL +
                "/storage/v1/object/" +
                BUSINESS_IMAGE_BUCKET +
                "/" +
                uploadPath,
                {
                    method:
                        "POST",

                    headers: {

                        "apikey":
                            SUPABASE_KEY,

                        "Authorization":
                            "Bearer " +
                            token,

                        "Content-Type":
                            file.type,

                        "x-upsert":
                            "false"
                    },

                    body:
                        file
                }
            );


        if (!response.ok) {

            let message =
                "Could not upload the picture.";

            try {

                const data =
                    await response.json();

                message =
                    data.message ||
                    data.error ||
                    data.statusCode ||
                    message;

            } catch {}


            throw new Error(
                message
            );
        }


        return getPublicImageUrl(
            uploadPath
        );
    }


    /* =====================================================
       LOAD BUSINESS IMAGES
    ===================================================== */

    async function loadBusinessImages(
        businessId,
        userId
    ) {

        const response =
            await fetch(
                SUPABASE_URL +
                "/rest/v1/business_images" +
                "?business_id=eq." +
                encodeURIComponent(
                    businessId
                ) +
                "&user_id=eq." +
                encodeURIComponent(
                    userId
                ) +
                "&select=*" +
                "&order=sort_order.asc,created_at.asc",
                {
                    method:
                        "GET",
                    headers:
                        headers()
                }
            );


        if (!response.ok) {

            let message =
                "Could not load business pictures.";

            try {

                const data =
                    await response.json();

                message =
                    data.message ||
                    data.details ||
                    data.hint ||
                    message;

            } catch {}


            throw new Error(
                message
            );
        }


        const images =
            await response.json();


        return Array.isArray(images)
            ? images
            : [];
    }


    /* =====================================================
       EDIT BUSINESS
    ===================================================== */

    async function openEditBusiness(id) {

        /* Accept either a business ID or a business object */

        if (
            id &&
            typeof id === "object"
        ) {

            id = id.id;
        }


        id =
            String(
                id || ""
            ).trim();


        const user =
            getUser();

        const token =
            getToken();


        if (
            !user ||
            !token
        ) {

            if (
                window.App &&
                typeof window.App.showToast ===
                "function"
            ) {

                window.App.showToast(
                    "Please log in first.",
                    "error"
                );
            }

            return;
        }


        if (!id) {
            return;
        }


        try {

            /* -----------------------------------------
               LOAD BUSINESS
            ----------------------------------------- */

            const response =
                await fetch(
                    SUPABASE_URL +
                    "/rest/v1/businesses?id=eq." +
                    encodeURIComponent(id) +
                    "&user_id=eq." +
                    encodeURIComponent(user.id) +
                    "&select=*",
                    {
                        method:
                            "GET",
                        headers:
                            headers()
                    }
                );


            if (!response.ok) {

                let message =
                    "Could not load this business.";

                try {

                    const data =
                        await response.json();

                    message =
                        data.message ||
                        data.details ||
                        data.hint ||
                        message;

                } catch {}


                throw new Error(
                    message
                );
            }


            const businesses =
                await response.json();


            if (
                !Array.isArray(
                    businesses
                ) ||
                businesses.length === 0
            ) {

                throw new Error(
                    "Business not found or you do not have permission to edit it."
                );
            }


            const business =
                businesses[0];


            /* -----------------------------------------
               LOAD BUSINESS PICTURES
            ----------------------------------------- */

            let businessImages = [];


            try {

                businessImages =
                    await loadBusinessImages(
                        id,
                        user.id
                    );

            } catch (imageError) {

                console.warn(
                    "LosOja business images could not be loaded:",
                    imageError
                );

                businessImages = [];
            }


            /* -----------------------------------------
               CREATE EDIT MODAL
            ----------------------------------------- */

            let modal =
                document.getElementById(
                    "editBusinessModal"
                );


            if (!modal) {

                modal =
                    document.createElement(
                        "div"
                    );

                modal.id =
                    "editBusinessModal";

                modal.className =
                    "modal-overlay hidden";


                modal.innerHTML = `
                    <div class="modal-content large">

                        <button
                            type="button"
                            class="modal-close"
                            aria-label="Close"
                        >
                            ×
                        </button>


                        <h2>
                            Edit Your Business
                        </h2>


                        <form
                            id="editBusinessForm"
                        >

                            <div class="form-group">

                                <label
                                    for="editBusinessName"
                                >
                                    Business Name *
                                </label>

                                <input
                                    type="text"
                                    id="editBusinessName"
                                    required
                                >

                            </div>


                            <div class="form-group">

                                <label
                                    for="editBusinessCategory"
                                >
                                    Category *
                                </label>

                                <input
                                    type="text"
                                    id="editBusinessCategory"
                                    required
                                >

                            </div>


                            <div class="form-group">

                                <label
                                    for="editBusinessLocation"
                                >
                                    Location *
                                </label>

                                <input
                                    type="text"
                                    id="editBusinessLocation"
                                    required
                                >

                            </div>


                            <div class="form-group">

                                <label
                                    for="editBusinessPhone"
                                >
                                    Phone Number
                                </label>

                                <input
                                    type="tel"
                                    id="editBusinessPhone"
                                >

                            </div>


                            <div class="form-group">

                                <label
                                    for="editBusinessPrice"
                                >
                                    Price (₦)
                                </label>

                                <input
                                    type="number"
                                    id="editBusinessPrice"
                                    min="0"
                                    step="1"
                                    inputmode="numeric"
                                    placeholder="Optional"
                                >

                                <small
                                    style="
                                        display:block;
                                        margin-top:5px;
                                        color:#64748b;
                                    "
                                >
                                    Leave empty if you want buyers to contact you for the price.
                                </small>

                            </div>


                            <div class="form-group">

                                <label
                                    for="editBusinessDescription"
                                >
                                    Description
                                </label>

                                <textarea
                                    id="editBusinessDescription"
                                    rows="5"
                                ></textarea>

                            </div>


                            <div
                                class="form-group"
                                id="editBusinessImagesSection"
                            >

                                <label>
                                    Business Pictures
                                </label>


                                <div
                                    id="editBusinessCurrentImages"
                                    style="
                                        display:grid;
                                        grid-template-columns:repeat(auto-fill,minmax(110px,1fr));
                                        gap:10px;
                                        margin:10px 0;
                                    "
                                ></div>


                                <input
                                    type="file"
                                    id="editBusinessImage"
                                    accept="image/jpeg,image/png,image/webp,image/gif"
                                    multiple
                                >


                                <small
                                    style="
                                        display:block;
                                        margin-top:6px;
                                        color:#64748b;
                                    "
                                >
                                    Add up to 5 pictures. Each picture must be 5MB or smaller.
                                </small>


                                <div
                                    id="editBusinessImagePreview"
                                    style="
                                        display:grid;
                                        grid-template-columns:repeat(auto-fill,minmax(110px,1fr));
                                        gap:10px;
                                        margin-top:10px;
                                    "
                                ></div>

                            </div>


                            <p
                                id="editBusinessError"
                                class="form-error hidden"
                            ></p>


                            <button
                                type="submit"
                                class="btn btn-primary form-submit"
                            >
                                Save Changes
                            </button>

                        </form>

                    </div>
                `;


                document.body.appendChild(
                    modal
                );


                const closeButton =
                    modal.querySelector(
                        ".modal-close"
                    );


                if (closeButton) {

                    closeButton.addEventListener(
                        "click",
                        function () {

                            if (
                                window.App &&
                                typeof window.App.closeModal ===
                                "function"
                            ) {

                                window.App.closeModal(
                                    modal
                                );

                            } else {

                                modal.classList.add(
                                    "hidden"
                                );

                                modal.style.display =
                                    "none";
                            }

                        }
                    );
                }


                const form =
                    modal.querySelector(
                        "#editBusinessForm"
                    );


                if (form) {

                    form.addEventListener(
                        "submit",
                        async function (event) {

                            event.preventDefault();

                            await saveEditedBusiness(
                                id
                            );

                        }
                    );
                }


                const imageInput =
                    modal.querySelector(
                        "#editBusinessImage"
                    );


                if (imageInput) {

                    imageInput.addEventListener(
                        "change",
                        function () {

                            renderNewImagePreview(
                                imageInput
                            );

                        }
                    );
                }

            }


            /* -----------------------------------------
               STORE EDIT STATE
            ----------------------------------------- */

            modal.dataset.businessId =
                id;


            modal._businessImages =
                businessImages;


            modal._removedImageIds =
                [];


            /* -----------------------------------------
               FILL FORM
            ----------------------------------------- */

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


            const phoneInput =
                document.getElementById(
                    "editBusinessPhone"
                );


            const priceInput =
                document.getElementById(
                    "editBusinessPrice"
                );


            const descriptionInput =
                document.getElementById(
                    "editBusinessDescription"
                );


            const imageInput =
                document.getElementById(
                    "editBusinessImage"
                );


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


            if (phoneInput) {

                phoneInput.value =
                    business.phone || "";
            }


            if (priceInput) {

                priceInput.value =
                    business.price !== null &&
                    business.price !== undefined
                        ? business.price
                        : "";
            }


            if (descriptionInput) {

                descriptionInput.value =
                    business.description || "";
            }


            if (imageInput) {

                imageInput.value =
                    "";
            }


            /* -----------------------------------------
               CURRENT IMAGES
            ----------------------------------------- */

            renderCurrentBusinessImages(
                modal,
                businessImages,
                business.image_url ||
                business.image ||
                ""
            );


            renderNewImagePreview(
                imageInput
            );


            const error =
                document.getElementById(
                    "editBusinessError"
                );


            if (error) {

                error.textContent =
                    "";

                error.classList.add(
                    "hidden"
                );
            }


            /* -----------------------------------------
               OPEN MODAL
            ----------------------------------------- */

            if (
                window.App &&
                typeof window.App.openModal ===
                "function"
            ) {

                window.App.openModal(
                    modal
                );

            } else {

                modal.classList.remove(
                    "hidden"
                );

                modal.classList.add(
                    "active"
                );

                modal.style.display =
                    "flex";
            }


        } catch (error) {

            console.error(
                "LosOja edit load error:",
                error
            );


            if (
                window.App &&
                typeof window.App.showToast ===
                "function"
            ) {

                window.App.showToast(
                    error.message ||
                    "Could not open the business for editing.",
                    "error"
                );
            }
        }
    }


    /* =====================================================
       CURRENT IMAGE DISPLAY
    ===================================================== */

    function renderCurrentBusinessImages(
        modal,
        images,
        legacyImageUrl
    ) {

        const container =
            modal.querySelector(
                "#editBusinessCurrentImages"
            );


        if (!container) {
            return;
        }


        container.innerHTML =
            "";


        const activeImages =
            Array.isArray(images)
                ? images.filter(
                    function (image) {

                        return !(
                            modal._removedImageIds ||
                            []
                        ).includes(
                            String(
                                image.id
                            )
                        );
                    }
                )
                : [];


        /* -----------------------------------------
           BUSINESS_IMAGES RECORDS
        ----------------------------------------- */

        activeImages.forEach(
            function (image) {

                const wrapper =
                    document.createElement(
                        "div"
                    );


                wrapper.dataset.imageId =
                    String(
                        image.id
                    );


                wrapper.style.position =
                    "relative";


                wrapper.style.border =
                    "1px solid #e2e8f0";


                wrapper.style.borderRadius =
                    "10px";


                wrapper.style.overflow =
                    "hidden";


                wrapper.style.background =
                    "#f8fafc";


                const imageElement =
                    document.createElement(
                        "img"
                    );


                imageElement.src =
                    image.image_url ||
                    image.url ||
                    "";


                imageElement.alt =
                    "Business picture";


                imageElement.style.width =
                    "100%";


                imageElement.style.height =
                    "100px";


                imageElement.style.objectFit =
                    "cover";


                wrapper.appendChild(
                    imageElement
                );


                const removeButton =
                    document.createElement(
                        "button"
                    );


                removeButton.type =
                    "button";


                removeButton.textContent =
                    "Remove";


                removeButton.style.position =
                    "absolute";


                removeButton.style.left =
                    "5px";


                removeButton.style.right =
                    "5px";


                removeButton.style.bottom =
                    "5px";


                removeButton.style.border =
                    "0";


                removeButton.style.borderRadius =
                    "6px";


                removeButton.style.padding =
                    "5px";


                removeButton.style.cursor =
                    "pointer";


                removeButton.style.background =
                    "rgba(220,38,38,.92)";


                removeButton.style.color =
                    "#fff";


                removeButton.addEventListener(
                    "click",
                    function () {

                        if (
                            !modal._removedImageIds
                        ) {

                            modal._removedImageIds =
                                [];
                        }


                        const imageId =
                            String(
                                image.id
                            );


                        if (
                            !modal._removedImageIds.includes(
                                imageId
                            )
                        ) {

                            modal._removedImageIds.push(
                                imageId
                            );
                        }


                        renderCurrentBusinessImages(
                            modal,
                            images,
                            legacyImageUrl
                        );

                    }
                );


                wrapper.appendChild(
                    removeButton
                );


                container.appendChild(
                    wrapper
                );
            }
        );


        /* -----------------------------------------
           LEGACY MAIN IMAGE
           Used when image_url exists but there is
           no corresponding business_images row.
        ----------------------------------------- */

        if (
            legacyImageUrl &&
            activeImages.length === 0
        ) {

            const wrapper =
                document.createElement(
                    "div"
                );


            wrapper.dataset.legacy =
                "true";


            wrapper.style.position =
                "relative";


            wrapper.style.border =
                "1px solid #e2e8f0";


            wrapper.style.borderRadius =
                "10px";


            wrapper.style.overflow =
                "hidden";


            const imageElement =
                document.createElement(
                    "img"
                );


            imageElement.src =
                legacyImageUrl;


            imageElement.alt =
                "Business picture";


            imageElement.style.width =
                "100%";


            imageElement.style.height =
                "100px";


            imageElement.style.objectFit =
                "cover";


            wrapper.appendChild(
                imageElement
            );


            const removeButton =
                document.createElement(
                    "button"
                );


            removeButton.type =
                "button";


            removeButton.textContent =
                "Remove";


            removeButton.style.position =
                "absolute";


            removeButton.style.left =
                "5px";


            removeButton.style.right =
                "5px";


            removeButton.style.bottom =
                "5px";


            removeButton.style.border =
                "0";


            removeButton.style.borderRadius =
                "6px";


            removeButton.style.padding =
                "5px";


            removeButton.style.cursor =
                "pointer";


            removeButton.style.background =
                "rgba(220,38,38,.92)";


            removeButton.style.color =
                "#fff";


            removeButton.addEventListener(
                "click",
                function () {

                    modal._legacyImageRemoved =
                        true;


                    wrapper.remove();
                }
            );


            wrapper.appendChild(
                removeButton
            );


            container.appendChild(
                wrapper
            );


            modal._legacyImageUrl =
                legacyImageUrl;

        } else {

            modal._legacyImageUrl =
                legacyImageUrl || "";

            modal._legacyImageRemoved =
                false;
        }


        if (
            container.children.length === 0
        ) {

            container.innerHTML = `
                <p
                    style="
                        margin:0;
                        color:#64748b;
                        font-size:.9rem;
                    "
                >
                    No current pictures.
                </p>
            `;
        }
    }


    /* =====================================================
       NEW IMAGE PREVIEW
    ===================================================== */

    function renderNewImagePreview(
        imageInput
    ) {

        const preview =
            document.getElementById(
                "editBusinessImagePreview"
            );


        if (!preview) {
            return;
        }


        preview.innerHTML =
            "";


        if (
            !imageInput ||
            !imageInput.files ||
            imageInput.files.length === 0
        ) {

            return;
        }


        Array.from(
            imageInput.files
        ).slice(
            0,
            MAX_BUSINESS_IMAGES
        ).forEach(
            function (file) {

                const wrapper =
                    document.createElement(
                        "div"
                    );


                wrapper.style.border =
                    "1px solid #e2e8f0";


                wrapper.style.borderRadius =
                    "10px";


                wrapper.style.overflow =
                    "hidden";


                wrapper.style.background =
                    "#f8fafc";


                const image =
                    document.createElement(
                        "img"
                    );


                image.alt =
                    file.name;


                image.style.width =
                    "100%";


                image.style.height =
                    "100px";


                image.style.objectFit =
                    "cover";


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


                wrapper.appendChild(
                    image
                );


                preview.appendChild(
                    wrapper
                );
            }
        );
    }


    /* =====================================================
       SAVE EDITED BUSINESS
    ===================================================== */

    async function saveEditedBusiness(
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

            return;
        }


        const name =
            document.getElementById(
                "editBusinessName"
            )?.value.trim() || "";


        const category =
            document.getElementById(
                "editBusinessCategory"
            )?.value.trim() || "";


        const location =
            document.getElementById(
                "editBusinessLocation"
            )?.value.trim() || "";


        const phone =
            document.getElementById(
                "editBusinessPhone"
            )?.value.trim() || "";


        const priceRaw =
            document.getElementById(
                "editBusinessPrice"
            )?.value.trim() || "";


        const description =
            document.getElementById(
                "editBusinessDescription"
            )?.value.trim() || "";


        const imageInput =
            document.getElementById(
                "editBusinessImage"
            );


        const modal =
            document.getElementById(
                "editBusinessModal"
            );


        const error =
            document.getElementById(
                "editBusinessError"
            );


        if (
            !name ||
            !category ||
            !location
        ) {

            if (error) {

                error.textContent =
                    "Please complete the required fields.";

                error.classList.remove(
                    "hidden"
                );
            }

            return;
        }


        let price =
            null;


        if (
            priceRaw !== ""
        ) {

            price =
                Number(
                    priceRaw
                );


            if (
                !Number.isFinite(
                    price
                ) ||
                price < 0
            ) {

                if (error) {

                    error.textContent =
                        "Please enter a valid price.";

                    error.classList.remove(
                        "hidden"
                    );
                }

                return;
            }
        }


        /* -----------------------------------------
           IMAGE LIMIT
        ----------------------------------------- */

        const existingImages =
            modal?._businessImages || [];


        const removedImageIds =
            modal?._removedImageIds || [];


        const remainingExistingImages =
            existingImages.filter(
                function (image) {

                    return !removedImageIds.includes(
                        String(
                            image.id
                        )
                    );
                }
            );


        const newFiles =
            imageInput &&
            imageInput.files
                ? Array.from(
                    imageInput.files
                )
                : [];


        if (
            newFiles.length >
            MAX_BUSINESS_IMAGES
        ) {

            if (error) {

                error.textContent =
                    "You can add a maximum of 5 pictures at a time.";

                error.classList.remove(
                    "hidden"
                );
            }

            return;
        }


        const legacyImageStillExists =
            modal &&
            modal._legacyImageUrl &&
            modal._legacyImageRemoved !== true &&
            existingImages.length === 0;


        const currentImageCount =
            remainingExistingImages.length +
            (
                legacyImageStillExists
                    ? 1
                    : 0
            );


        if (
            currentImageCount +
            newFiles.length >
            MAX_BUSINESS_IMAGES
        ) {

            if (error) {

                error.textContent =
                    "A business can have a maximum of 5 pictures. Remove a current picture before adding another.";

                error.classList.remove(
                    "hidden"
                );
            }

            return;
        }


        /* -----------------------------------------
           VALIDATE NEW FILES
        ----------------------------------------- */

        for (
            let index = 0;
            index < newFiles.length;
            index++
        ) {

            const file =
                newFiles[index];


            if (
                !validImageType(
                    file
                )
            ) {

                if (error) {

                    error.textContent =
                        "Only JPG, PNG, WEBP and GIF pictures are allowed.";

                    error.classList.remove(
                        "hidden"
                    );
                }

                return;
            }


            if (
                file.size >
                MAX_IMAGE_SIZE
            ) {

                if (error) {

                    error.textContent =
                        `"${file.name}" is larger than 5MB.`;

                    error.classList.remove(
                        "hidden"
                    );
                }

                return;
            }
        }


        const form =
            document.getElementById(
                "editBusinessForm"
            );


        const submitButton =
            form?.querySelector(
                'button[type="submit"]'
            );


        const originalText =
            submitButton
                ? submitButton.textContent
                : "Save Changes";


        if (submitButton) {

            submitButton.disabled =
                true;

            submitButton.textContent =
                "Saving...";
        }


        try {

            /* -----------------------------------------
               UPDATE BUSINESS
            ----------------------------------------- */

            const response =
                await fetch(
                    SUPABASE_URL +
                    "/rest/v1/businesses?id=eq." +
                    encodeURIComponent(id) +
                    "&user_id=eq." +
                    encodeURIComponent(user.id),
                    {
                        method:
                            "PATCH",

                        headers: {
                            ...headers(),

                            "Prefer":
                                "return=representation"
                        },

                        body:
                            JSON.stringify({

                                name,
                                category,
                                location,
                                phone,
                                description,
                                price

                            })
                    }
                );


            const responseText =
                await response.text();


            let result =
                null;


            try {

                result =
                    responseText
                        ? JSON.parse(
                            responseText
                        )
                        : null;

            } catch {

                result =
                    responseText;
            }


            if (!response.ok) {

                console.error(
                    "LosOja edit save error:",
                    result
                );


                const message =
                    result &&
                    typeof result ===
                    "object" &&
                    (
                        result.message ||
                        result.details ||
                        result.hint
                    )
                        ? (
                            result.message ||
                            result.details ||
                            result.hint
                        )
                        : "Could not save your changes.";


                throw new Error(
                    message
                );
            }


            /* -----------------------------------------
               REMOVE SELECTED BUSINESS IMAGE ROWS
            ----------------------------------------- */

            if (
                removedImageIds.length
            ) {

                for (
                    const imageId of
                    removedImageIds
                ) {

                    const deleteImageResponse =
                        await fetch(
                            SUPABASE_URL +
                            "/rest/v1/business_images?id=eq." +
                            encodeURIComponent(
                                imageId
                            ) +
                            "&business_id=eq." +
                            encodeURIComponent(
                                id
                            ) +
                            "&user_id=eq." +
                            encodeURIComponent(
                                user.id
                            ),
                            {
                                method:
                                    "DELETE",

                                headers:
                                    headers()
                            }
                        );


                    if (
                        !deleteImageResponse.ok
                    ) {

                        console.warn(
                            "Could not remove business image record:",
                            imageId
                        );
                    }
                }
            }


            /* -----------------------------------------
               UPLOAD NEW IMAGES
            ----------------------------------------- */

            const uploadedImages =
                [];


            if (
                newFiles.length
            ) {

                if (submitButton) {

                    submitButton.textContent =
                        "Uploading pictures...";
                }


                for (
                    let index = 0;
                    index < newFiles.length;
                    index++
                ) {

                    const imageUrl =
                        await uploadBusinessImage(
                            newFiles[index],
                            id
                        );


                    uploadedImages.push(
                        imageUrl
                    );
                }
            }


            /* -----------------------------------------
               INSERT NEW IMAGE RECORDS
            ----------------------------------------- */

            if (
                uploadedImages.length
            ) {

                const startSortOrder =
                    remainingExistingImages.length +
                    (
                        legacyImageStillExists
                            ? 1
                            : 0
                    );


                const imageRows =
                    uploadedImages.map(
                        function (
                            imageUrl,
                            index
                        ) {

                            return {

                                business_id:
                                    id,

                                user_id:
                                    user.id,

                                image_url:
                                    imageUrl,

                                sort_order:
                                    startSortOrder +
                                    index

                            };
                        }
                    );


                const imageResponse =
                    await fetch(
                        SUPABASE_URL +
                        "/rest/v1/business_images",
                        {
                            method:
                                "POST",

                            headers: {

                                ...headers(),

                                "Prefer":
                                    "return=representation"
                            },

                            body:
                                JSON.stringify(
                                    imageRows
                                )
                        }
                    );


                if (
                    !imageResponse.ok
                ) {

                    let message =
                        "Pictures uploaded, but their records could not be saved.";

                    try {

                        const data =
                            await imageResponse.json();

                        message =
                            data.message ||
                            data.details ||
                            data.hint ||
                            message;

                    } catch {}


                    throw new Error(
                        message
                    );
                }
            }


            /* -----------------------------------------
               UPDATE MAIN IMAGE URL
            ----------------------------------------- */

            let mainImageUrl =
                "";


            if (
                uploadedImages.length
            ) {

                mainImageUrl =
                    uploadedImages[0];

            } else if (
                remainingExistingImages.length
            ) {

                mainImageUrl =
                    remainingExistingImages[0]
                        .image_url ||
                    remainingExistingImages[0]
                        .url ||
                    "";

            } else if (
                legacyImageStillExists
            ) {

                mainImageUrl =
                    modal._legacyImageUrl ||
                    "";

            }


            /*
             * Keep businesses.image_url synchronized
             * with the first available picture.
             */

            const imageUpdateResponse =
                await fetch(
                    SUPABASE_URL +
                    "/rest/v1/businesses?id=eq." +
                    encodeURIComponent(id) +
                    "&user_id=eq." +
                    encodeURIComponent(user.id),
                    {
                        method:
                            "PATCH",

                        headers:
                            headers(),

                        body:
                            JSON.stringify({
                                image_url:
                                    mainImageUrl ||
                                    null
                            })
                    }
                );


            /*
             * Some older databases may not have
             * image_url. The main business update above
             * has already succeeded, so do not fail the
             * entire edit because of this secondary sync.
             */

            if (
                !imageUpdateResponse.ok
            ) {

                console.warn(
                    "LosOja could not synchronize businesses.image_url."
                );
            }


            /* -----------------------------------------
               CLOSE MODAL
            ----------------------------------------- */

            if (
                window.App &&
                typeof window.App.closeModal ===
                "function"
            ) {

                window.App.closeModal(
                    "editBusinessModal"
                );

            } else if (modal) {

                modal.classList.add(
                    "hidden"
                );

                modal.style.display =
                    "none";
            }


            /* -----------------------------------------
               SUCCESS MESSAGE
            ----------------------------------------- */

            if (
                window.App &&
                typeof window.App.showToast ===
                "function"
            ) {

                window.App.showToast(
                    "Business updated successfully!",
                    "success"
                );
            }


            /* -----------------------------------------
               REFRESH DASHBOARD
            ----------------------------------------- */

            await load();


            /* -----------------------------------------
               REFRESH MAIN BUSINESS LIST
            ----------------------------------------- */

            if (
                typeof window.loadBusinesses ===
                "function"
            ) {

                await window.loadBusinesses(
                    true
                );
            }


        } catch (error) {

            console.error(
                "LosOja edit business error:",
                error
            );


            if (
                error &&
                typeof error.message ===
                "string"
            ) {

                if (error) {

                    error.textContent =
                        error.message;
                }


                const editError =
                    document.getElementById(
                        "editBusinessError"
                    );


                if (editError) {

                    editError.textContent =
                        error.message;

                    editError.classList.remove(
                        "hidden"
                    );
                }
            }


        } finally {

            if (submitButton) {

                submitButton.disabled =
                    false;

                submitButton.textContent =
                    originalText;
            }
        }
    }


    /* =====================================================
       NAVIGATION
    ===================================================== */

    function bindDashboardNavigation() {

        const link =
            document.getElementById(
                "dashboardNavLink"
            );


        if (!link) return;


        link.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                show();
            }
        );
    }


    /* =====================================================
       PUBLIC API
    ===================================================== */

    window.Dashboard = {

        show:
            show,

        hide:
            hide,

        load:
            load
    };


    window.deleteDashboardBusiness =
        deleteDashboardBusiness;


    window.openEditBusiness =
        openEditBusiness;


    /* =====================================================
       START
    ===================================================== */

    document.addEventListener(
        "DOMContentLoaded",
        function () {

            bindDashboardNavigation();

        }
    );

})();
