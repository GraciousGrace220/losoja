/* =========================================================
   LosOja - Main Application JavaScript
   js/app.js

   Handles:
   - Main UI
   - Modals
   - Mobile navigation
   - Smooth scrolling
   - Search helpers
   - Category buttons
   - Business buttons
   - Mobility / TryCircle / Bike / Cab
   - Mobility request form
   - Back-to-top button
   - Toast notifications
========================================================= */

(function () {

    "use strict";


    /* =====================================================
       APP OBJECT
    ===================================================== */

    const App = {

        /* =================================================
           INITIALIZATION
        ================================================= */

        init() {

           this.setCurrentYear();

this.bindModalClosers();

this.bindMobileMenu();

this.bindSmoothScroll();

this.bindLogo();

this.bindSearch();

this.bindLocationButton();

this.bindPopularSearches();

this.bindCategoryButtons();

this.bindBusinessButtons();

this.bindAddBusinessButtons();

this.bindMobilityButtons();

this.createBackButton();

        },


        /* =================================================
           CURRENT YEAR
        ================================================= */

        setCurrentYear() {

            const currentYear =
                new Date().getFullYear();

            document
                .querySelectorAll("[data-current-year]")
                .forEach(element => {
                    element.textContent = currentYear;
                });

            const footerYear =
                document.getElementById("currentYear");

            if (footerYear) {
                footerYear.textContent = currentYear;
            }

        },


        /* =================================================
           MODALS
        ================================================= */

        openModal(modalId) {

            const modal =
                typeof modalId === "string"
                    ? document.getElementById(modalId)
                    : modalId;

            if (!modal) {

                console.error(
                    "LosOja: Modal not found:",
                    modalId
                );

                return;
            }

            modal.classList.remove("hidden");

            modal.classList.add("active");

            modal.style.display = "flex";

            document.body.classList.add(
                "modal-open"
            );

        },


        closeModal(modal) {

            if (typeof modal === "string") {
                modal =
                    document.getElementById(modal);
            }

            if (!modal || !modal.classList) {
                return;
            }

            modal.classList.remove("active");

            modal.classList.add("hidden");

            modal.style.display = "none";

            const anotherOpenModal =
                document.querySelector(
                    ".modal-overlay.active, .modal.active"
                );

            if (!anotherOpenModal) {

                document.body.classList.remove(
                    "modal-open"
                );

            }

        },


        closeAllModals() {

            document
                .querySelectorAll(
                    ".modal-overlay, .modal"
                )
                .forEach(modal => {

                    modal.classList.remove(
                        "active"
                    );

                    modal.classList.add(
                        "hidden"
                    );

                    modal.style.display = "none";

                });

            document.body.classList.remove(
                "modal-open"
            );

        },


        /* =================================================
           MODAL CLOSE BUTTONS
        ================================================= */

        bindModalClosers() {

            document.addEventListener(
                "click",
                event => {

                    const closeButton =
                        event.target.closest(
                            ".modal-close"
                        );

                    if (closeButton) {

                        const modal =
                            closeButton.closest(
                                ".modal-overlay, .modal"
                            );

                        this.closeModal(modal);

                        return;
                    }


                    const clickedModal =
                        event.target.closest(
                            ".modal-overlay, .modal"
                        );

                    if (
                        clickedModal &&
                        event.target === clickedModal
                    ) {

                        this.closeModal(
                            clickedModal
                        );

                    }

                }
            );


            document.addEventListener(
                "keydown",
                event => {

                    if (event.key === "Escape") {
                        this.closeAllModals();
                    }

                }
            );

        },


        /* =================================================
           MOBILE MENU
        ================================================= */

        bindMobileMenu() {

            const menuButton =
                document.getElementById(
                    "mobileMenuBtn"
                );

            const mobileNav =
                document.getElementById(
                    "mobileNav"
                );

            if (!menuButton || !mobileNav) {
                return;
            }

            menuButton.addEventListener(
                "click",
                () => {

                    const isOpen =
                        mobileNav.classList.toggle(
                            "active"
                        );

                    menuButton.setAttribute(
                        "aria-expanded",
                        isOpen
                            ? "true"
                            : "false"
                    );

                }
            );


            mobileNav
                .querySelectorAll("a, button")
                .forEach(element => {

                    element.addEventListener(
                        "click",
                        () => {

                            mobileNav.classList.remove(
                                "active"
                            );

                            menuButton.setAttribute(
                                "aria-expanded",
                                "false"
                            );

                        }
                    );

                });

        },


        /* =================================================
           SMOOTH SCROLL
        ================================================= */

        bindSmoothScroll() {

            document.addEventListener(
                "click",
                event => {

                    const link =
                        event.target.closest(
                            'a[href^="#"]'
                        );

                    if (!link) {
                        return;
                    }

                    const href =
                        link.getAttribute("href");

                    if (
                        !href ||
                        href === "#"
                    ) {
                        return;
                    }

                    let target = null;

                    try {

                        target =
                            document.querySelector(
                                href
                            );

                    } catch (error) {

                        return;

                    }

                    if (!target) {
                        return;
                    }

                    event.preventDefault();

                    target.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });

                }
            );

        },


        /* =================================================
           LOGO
        ================================================= */

        bindLogo() {

            const logo =
                document.querySelector(".logo");

            if (!logo) {
                return;
            }

            logo.addEventListener(
                "click",
                event => {

                    const href =
                        logo.getAttribute("href");

                    if (href !== "#home") {
                        return;
                    }

                    const home =
                        document.getElementById(
                            "home"
                        );

                    if (!home) {
                        return;
                    }

                    event.preventDefault();

                    home.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });

                }
            );

        },


        /* =================================================
           SEARCH
        ================================================= */

        bindSearch() {

            const searchForm =
                document.getElementById(
                    "searchForm"
                );

            if (!searchForm) {
                return;
            }

            searchForm.addEventListener(
                "submit",
                event => {

                    event.preventDefault();

                    const searchInput =
                        document.getElementById(
                            "searchInput"
                        );

                    const locationInput =
                        document.getElementById(
                            "locationInput"
                        );

                    const search =
                        searchInput
                            ? searchInput.value.trim()
                            : "";

                    const location =
                        locationInput
                            ? locationInput.value.trim()
                            : "";


                    if (
                        typeof window.searchBusinesses ===
                        "function"
                    ) {

                        window.searchBusinesses(
                            search,
                            location
                        );

                    } else {

                        this.showToast(
                            "Search is still loading. Please try again.",
                            "info"
                        );

                    }

                }
            );

        },

                /* =================================================
           LOCATION BUTTON
        ================================================= */

        /* =================================================
   LOCATION BUTTON
================================================= */

bindLocationButton() {

    const locationBtn =
        document.getElementById("locationBtn");

    if (!locationBtn) {
        return;
    }

    locationBtn.addEventListener(
        "click",
        event => {

            event.preventDefault();

            if (!navigator.geolocation) {

                this.showToast(
                    "Location is not supported by this browser.",
                    "error"
                );

                return;
            }

            this.showToast(
                "Getting your location...",
                "info"
            );

            navigator.geolocation.getCurrentPosition(

                position => {

                    const latitude =
                        position.coords.latitude;

                    const longitude =
                        position.coords.longitude;

                    console.log(
                        "LosOja location:",
                        latitude,
                        longitude
                    );

                    console.log(
                        "LosOja: checking nearby businesses..."
                    );

                    localStorage.setItem(
                        "losoja_user_location",
                        JSON.stringify({
                            latitude: latitude,
                            longitude: longitude
                        })
                    );

                    this.showToast(
                        "Your location was found successfully.",
                        "success"
                    );

                    if (
                        typeof window.findNearbyBusinesses ===
                        "function"
                    ) {

                        const nearbyBusinesses =
                            window.findNearbyBusinesses(10);

                        console.log(
                            "LosOja nearby businesses:",
                            nearbyBusinesses
                        );

                        if (
                            nearbyBusinesses.length > 0
                        ) {

                            console.log(
                                "LosOja: Nearby businesses found:",
                                nearbyBusinesses.length
                            );

                            if (
                                typeof window.renderBusinesses ===
                                "function"
                            ) {

                                window.renderBusinesses(
                                    nearbyBusinesses
                                );

                                console.log(
                                    "LosOja: Nearby businesses rendered."
                                );

                                const section =
                                    document.getElementById(
                                        "businesses"
                                    );

                                if (section) {

                                    section.scrollIntoView({
                                        behavior: "smooth",
                                        block: "start"
                                    });

                                }

                            } else {

                                console.error(
                                    "LosOja: renderBusinesses is not available."
                                );

                            }

                        } else {

                            this.showToast(
                                "No businesses found within 10 km yet.",
                                "info"
                            );

                        }

                    }

                },

                error => {

                    console.error(
                        "LosOja location error:",
                        error
                    );

                    let message =
                        "Unable to get your location.";

                    if (
                        error.code ===
                        error.PERMISSION_DENIED
                    ) {

                        message =
                            "Location permission was denied.";

                    } else if (
                        error.code ===
                        error.POSITION_UNAVAILABLE
                    ) {

                        message =
                            "Your location is currently unavailable.";

                    } else if (
                        error.code ===
                        error.TIMEOUT
                    ) {

                        message =
                            "Location request timed out. Please try again.";

                    }

                    this.showToast(
                        message,
                        "error"
                    );

                },

                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000
                }

            );

        }
    );

},

        /* =================================================
           POPULAR SEARCHES
        ================================================= */

        bindPopularSearches() {

            document
                .querySelectorAll("[data-search]")
                .forEach(button => {

                    button.addEventListener(
                        "click",
                        event => {

                            event.preventDefault();

                            const term =
                                button.getAttribute("data-search");

                            if (!term) {
                                return;
                            }

                            const searchInput =
                                document.getElementById("searchInput");

                            if (searchInput) {
                                searchInput.value = term;
                            }

                            if (
                                typeof window.searchBusinesses ===
                                "function"
                            ) {

                                window.searchBusinesses(
                                    term,
                                    ""
                                );

                            }

                        }
                    );

                });

        },

        bindPopularSearches() {

            document
                .querySelectorAll("[data-search]")
                .forEach(button => {

                    button.addEventListener(
                        "click",
                        event => {

                            event.preventDefault();

                            const term =
                                button.getAttribute(
                                    "data-search"
                                );

                            if (!term) {
                                return;
                            }

                            const searchInput =
                                document.getElementById(
                                    "searchInput"
                                );

                            if (searchInput) {
                                searchInput.value =
                                    term;
                            }

                            if (
                                typeof window.searchBusinesses ===
                                "function"
                            ) {

                                window.searchBusinesses(
                                    term,
                                    ""
                                );

                            }

                        }
                    );

                });

        },


        /* =================================================
           CATEGORY BUTTONS
        ================================================= */

        bindCategoryButtons() {

            document
                .querySelectorAll(
                    ".category-card[data-category]"
                )
                .forEach(button => {

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
                        event => {

                            event.preventDefault();

                            const category =
                                (
                                    button.getAttribute(
                                        "data-category"
                                    ) || ""
                                ).trim();

                            if (!category) {
                                return;
                            }


                            document
                                .querySelectorAll(
                                    ".category-card[data-category]"
                                )
                                .forEach(card => {

                                    card.classList.remove(
                                        "active"
                                    );

                                });


                            button.classList.add(
                                "active"
                            );


                            if (
                                window.LosOjaBusinesses &&
                                typeof window
                                    .LosOjaBusinesses
                                    .filterByCategory ===
                                    "function"
                            ) {

                                window
                                    .LosOjaBusinesses
                                    .filterByCategory(
                                        category
                                    );

                            } else if (
                                typeof window
                                    .filterBusinessesByCategory ===
                                "function"
                            ) {

                                window
                                    .filterBusinessesByCategory(
                                        category
                                    );

                            } else if (
                                typeof window
                                    .filterBusinesses ===
                                "function"
                            ) {

                                window
                                    .filterBusinesses(
                                        category
                                    );

                            } else {

                                this.showToast(
                                    "Businesses are still loading. Please try again.",
                                    "info"
                                );

                                return;

                            }


                            const searchInput =
                                document.getElementById(
                                    "searchInput"
                                );

                            if (searchInput) {
                                searchInput.value =
                                    category;
                            }


                            const locationInput =
                                document.getElementById(
                                    "locationInput"
                                );

                            if (locationInput) {
                                locationInput.value =
                                    "";
                            }


                            const businesses =
                                document.getElementById(
                                    "businesses"
                                );

                            if (businesses) {

                                setTimeout(
                                    () => {

                                        businesses.scrollIntoView({
                                            behavior:
                                                "smooth",
                                            block:
                                                "start"
                                        });

                                    },
                                    50
                                );

                            }

                        }
                    );

                });

        },


        /* =================================================
           BUSINESS BUTTONS
        ================================================= */

        bindBusinessButtons() {

            document.addEventListener(
                "click",
                event => {

                    const button =
                        event.target.closest(
                            "[data-business-id]"
                        );

                    if (!button) {
                        return;
                    }

                    const businessId =
                        button.getAttribute(
                            "data-business-id"
                        );

                    if (
                        businessId &&
                        typeof window.openBusiness ===
                        "function"
                    ) {

                        window.openBusiness(
                            businessId
                        );

                    }

                }
            );

        },


      /* =================================================
   ADD BUSINESS
================================================= */

bindAddBusinessButtons() {

    /* ---------------------------------------------
       OPEN ADD BUSINESS MODAL
    --------------------------------------------- */

    document
        .querySelectorAll(
            "#addBusinessBtn, .add-business-btn, .nav-add-button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    this.openModal(
                        "addBusinessModal"
                    );

                }
            );

        });


    /* ---------------------------------------------
       HANDLE ADD BUSINESS FORM
    --------------------------------------------- */

    const form =
        document.getElementById(
            "addBusinessForm"
        );

    if (!form) {

        console.warn(
            "LosOja: addBusinessForm not found."
        );

        return;
    }

    /* ---------------------------------------------
       OPEN ADD BUSINESS MODAL
    --------------------------------------------- */

   document
    .querySelectorAll(
        "#addBusinessBtn, .add-business-btn, .nav-add-button"
    )
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    this.openModal(
                        "addBusinessModal"
                    );

                }
            );

        });


    /* ---------------------------------------------
       HANDLE ADD BUSINESS FORM
    --------------------------------------------- */

    const form =
        document.getElementById(
            "addBusinessForm"
        );

    if (!form) {

        console.warn(
            "LosOja: addBusinessForm not found."
        );

        return;
    }


    /* Prevent duplicate listeners */

    if (
        form.dataset
            .losojaSubmitReady === "true"
    ) {
        return;
    }

    form.dataset
        .losojaSubmitReady = "true";


    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            /* -------------------------------------
               GET FORM FIELDS
            ------------------------------------- */

            const name =
                document
                    .getElementById("businessName")
                    ?.value
                    .trim() || "";

            const category =
                document
                    .getElementById("businessCategory")
                    ?.value
                    .trim() || "";

            const location =
                document
                    .getElementById("businessLocation")
                    ?.value
                    .trim() || "";

            const phone =
                document
                    .getElementById("businessPhone")
                    ?.value
                    .trim() || "";

            const description =
                document
                    .getElementById("businessDescription")
                    ?.value
                    .trim() || "";


            /* -------------------------------------
               VALIDATION
            ------------------------------------- */

            if (
                !name ||
                !category ||
                !location
            ) {

                this.showToast(
                    "Please complete the required business fields.",
                    "error"
                );

                return;
            }


            /* -------------------------------------
               FIND SUBMIT BUTTON
            ------------------------------------- */

            const submitButton =
                form.querySelector(
                    'button[type="submit"], input[type="submit"]'
                );


            const originalText =
                submitButton
                    ? submitButton.textContent
                    : "";


            if (submitButton) {

                submitButton.disabled =
                    true;

                submitButton.textContent =
                    "Saving...";
            }


            /* -------------------------------------
               SUPABASE SETTINGS
            ------------------------------------- */

            const SUPABASE_URL =
                "https://ycxshwgeebskdozmornh.supabase.co";


            /*
             * IMPORTANT:
             * Use the SAME anon key that is
             * already working in your current
             * businesses.js.
             */

             const SUPABASE_KEY =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljeHNod2dlZWJza2Rvem1vcm5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzMDY0NjUsImV4cCI6MjEwMzg4MjQ2NX0.tMl7wILdVDhu0RWFaG_84ngJEryLt2c5cB8MEKW3kfU";


            /* -------------------------------------
               BUSINESS DATA
            ------------------------------------- */

         /* ---------------------------------------------
   BUSINESS IMAGE UPLOAD
--------------------------------------------- */

const imageInput =
    document.getElementById("businessImage");

const imageFile =
    imageInput &&
    imageInput.files &&
    imageInput.files.length > 0
        ? imageInput.files[0]
        : null;

let imageUrl = "";

if (imageFile) {

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif"
    ];

    if (!allowedTypes.includes(imageFile.type)) {

        this.showToast(
            "Please upload a JPG, PNG, WEBP or GIF image.",
            "error"
        );

        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent =
                originalText || "Save Business";
        }

        return;
    }

    /* Maximum image size: 5MB */
    const maxFileSize =
        5 * 1024 * 1024;

    if (imageFile.size > maxFileSize) {

        this.showToast(
            "Image must be 5MB or smaller.",
            "error"
        );

        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent =
                originalText || "Save Business";
        }

        return;
    }

    /* Create a unique file name */
    const fileExtension =
        imageFile.name
            .split(".")
            .pop()
            .toLowerCase();

    const uniqueFileName =
        "business_" +
        Date.now() +
        "_" +
        Math.random()
            .toString(36)
            .substring(2, 10) +
        "." +
        fileExtension;

    const uploadPath =
        "businesses/" +
        uniqueFileName;

    try {

        const uploadResponse =
            await fetch(
                SUPABASE_URL +
                "/storage/v1/object/business-images/" +
                uploadPath,
                {
                    method: "POST",

                    headers: {
                        "apikey":
                            SUPABASE_KEY,

                        "Authorization":
                            "Bearer " +
                            SUPABASE_KEY,

                        "Content-Type":
                            imageFile.type,

                        "x-upsert":
                            "false"
                    },

                    body: imageFile
                }
            );

        const uploadText =
            await uploadResponse.text();

        let uploadResult = null;

        try {

            uploadResult =
                uploadText
                    ? JSON.parse(uploadText)
                    : null;

        } catch (jsonError) {

            uploadResult =
                uploadText;
        }

        if (!uploadResponse.ok) {

            console.error(
                "LosOja image upload error:",
                uploadResult
            );

            const uploadErrorMessage =
                uploadResult &&
                typeof uploadResult === "object" &&
                (
                    uploadResult.message ||
                    uploadResult.error ||
                    uploadResult.error_description
                )
                    ? (
                        uploadResult.message ||
                        uploadResult.error ||
                        uploadResult.error_description
                    )
                    : "Unable to upload the business image.";

            throw new Error(
                uploadErrorMessage
            );
        }

        /* Build the public image URL */
        imageUrl =
            SUPABASE_URL +
            "/storage/v1/object/public/business-images/" +
            uploadPath;

        console.log(
            "LosOja business image uploaded:",
            imageUrl
        );

    } catch (imageError) {

        console.error(
            "LosOja image upload error:",
            imageError
        );

        this.showToast(
            "Could not upload the business image: " +
            imageError.message,
            "error"
        );

        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent =
                originalText || "Save Business";
        }

        return;
    }
}


/* ---------------------------------------------
   BUSINESS DATA
--------------------------------------------- */
            /* ---------------------------------------------
               GET SAVED USER LOCATION
            --------------------------------------------- */

            let latitude = null;
            let longitude = null;

            try {

                const savedLocation =
                    localStorage.getItem(
                        "losoja_user_location"
                    );

                if (savedLocation) {

                    const parsedLocation =
                        JSON.parse(savedLocation);

                    if (
                        typeof parsedLocation.latitude === "number" &&
                        typeof parsedLocation.longitude === "number"
                    ) {

                        latitude =
                            parsedLocation.latitude;

                        longitude =
                            parsedLocation.longitude;

                    }

                }

            } catch (locationError) {

                console.warn(
                    "LosOja: Could not read saved location.",
                    locationError
                );

            }
const businessData = {

    name: name,

    category: category,

    location: location,

    phone: phone,

    description: description,

    image_url: imageUrl,

    latitude: latitude,

    longitude: longitude

};
console.log(
    "LosOja business data before save:",
    businessData
);
            try {

                /* ---------------------------------
                   SEND BUSINESS TO SUPABASE
                --------------------------------- */

                const response =
                    await fetch(
                        SUPABASE_URL +
                        "/rest/v1/businesses",
                        {
                            method: "POST",

                            headers: {
                                "apikey":
                                    SUPABASE_KEY,

                                "Authorization":
                                    "Bearer " +
                                    SUPABASE_KEY,

                                "Content-Type":
                                    "application/json",

                                "Prefer":
                                    "return=representation"
                            },

                            body:
                                JSON.stringify(
                                    businessData
                                )
                        }
                    );


                /* ---------------------------------
                   READ RESPONSE
                --------------------------------- */

                const responseText =
                    await response.text();


                let result = null;

                try {

                    result =
                        responseText
                            ? JSON.parse(
                                responseText
                            )
                            : null;

                } catch (jsonError) {

                    result =
                        responseText;

                }


                /* ---------------------------------
                   HANDLE SUPABASE ERROR
                --------------------------------- */

                if (!response.ok) {

                    console.error(
                        "LosOja Supabase insert error:",
                        result
                    );

                    const errorMessage =
                        result &&
                        typeof result === "object" &&
                        (
                            result.message ||
                            result.error_description ||
                            result.hint
                        )
                            ? (
                                result.message ||
                                result.error_description ||
                                result.hint
                            )
                            : "Unable to save the business.";

                    throw new Error(
                        errorMessage
                    );
                }


                /* ---------------------------------
                   SUCCESS
                --------------------------------- */

                console.log(
                    "LosOja business saved:",
                    result
                );


                /* Clear the form */

                form.reset();


                /* Close modal */

                this.closeModal(
                    "addBusinessModal"
                );


                /* Show success message */

                this.showToast(
                    "Business added successfully!",
                    "success"
                );


                /* ---------------------------------
                   REFRESH BUSINESS LIST
                --------------------------------- */

                if (
                    typeof window.loadBusinesses ===
                    "function"
                ) {

                    await window.loadBusinesses();

                } else if (
                    window.LosOjaBusinesses &&
                    typeof window
                        .LosOjaBusinesses
                        .load ===
                    "function"
                ) {

                    await window
                        .LosOjaBusinesses
                        .load();

                }


            } catch (error) {

                console.error(
                    "LosOja add business error:",
                    error
                );


                this.showToast(
                    "Could not save the business: " +
                    error.message,
                    "error"
                );


            } finally {

                /* Restore button */

                if (submitButton) {

                    submitButton.disabled =
                        false;

                    submitButton.textContent =
                        originalText ||
                        "Add Business";

                }

            }

        }
    );

},


        /* =================================================
           MOBILITY BUTTONS
        ================================================= */

        bindMobilityButtons() {

            document
                .querySelectorAll(
                    ".mobility-btn"
                )
                .forEach(button => {

                    if (
                        button.dataset
                            .losojaMobilityReady ===
                        "true"
                    ) {
                        return;
                    }

                    button.dataset
                        .losojaMobilityReady =
                        "true";

                    button.addEventListener(
                        "click",
                        event => {

                            event.preventDefault();

                            const type =
                                button.getAttribute(
                                    "data-mobility"
                                );

                            if (!type) {
                                return;
                            }

                            this.openMobilityRequest(
                                type
                            );

                        }
                    );

                });

        },


        /* =================================================
           CREATE MOBILITY MODAL
        ================================================= */

        createMobilityModal() {

            let modal =
                document.getElementById(
                    "mobilityRequestModal"
                );

            if (modal) {
                return modal;
            }


            modal =
                document.createElement(
                    "div"
                );

            modal.className =
                "modal-overlay hidden";

            modal.id =
                "mobilityRequestModal";


            modal.innerHTML = `
                <div class="modal-content large">

                    <button
                        type="button"
                        class="modal-close"
                        aria-label="Close"
                    >×</button>

                    <h2 id="mobilityRequestTitle">
                        Request Mobility
                    </h2>

                    <p
                        id="mobilityRequestDescription"
                        style="margin-bottom:1.5rem;color:#6b7280;"
                    ></p>

                    <form id="mobilityRequestForm">

                        <input
                            type="hidden"
                            id="mobilityType"
                        >

                        <div class="form-group">

                            <label for="mobilityPickup">
                                Pickup Location *
                            </label>

                            <input
                                type="text"
                                id="mobilityPickup"
                                placeholder="Where should we pick you up?"
                                required
                            >

                        </div>

                        <div class="form-group">

                            <label for="mobilityDestination">
                                Destination *
                            </label>

                            <input
                                type="text"
                                id="mobilityDestination"
                                placeholder="Where are you going?"
                                required
                            >

                        </div>

                        <div class="form-group">

                            <label for="mobilityPhone">
                                Phone Number *
                            </label>

                            <input
                                type="tel"
                                id="mobilityPhone"
                                placeholder="Your phone number"
                                required
                            >

                        </div>

                        <div class="form-group">

                            <label for="mobilityNote">
                                Additional Note
                            </label>

                            <textarea
                                id="mobilityNote"
                                rows="3"
                                placeholder="Any additional information..."
                            ></textarea>

                        </div>

                        <p
                            id="mobilityRequestError"
                            class="form-error hidden"
                        ></p>

                        <button
                            type="submit"
                            class="btn btn-primary form-submit"
                        >
                            Submit Request
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
                    () => {
                        this.closeModal(modal);
                    }
                );

            }


            const form =
                modal.querySelector(
                    "#mobilityRequestForm"
                );

            if (form) {

                form.addEventListener(
                    "submit",
                    event => {

                        event.preventDefault();

                        this.handleMobilityRequest();

                    }
                );

            }


            return modal;

        },


        /* =================================================
           OPEN MOBILITY REQUEST
        ================================================= */

        openMobilityRequest(type) {

            const modal =
                this.createMobilityModal();

            const title =
                document.getElementById(
                    "mobilityRequestTitle"
                );

            const description =
                document.getElementById(
                    "mobilityRequestDescription"
                );

            const mobilityType =
                document.getElementById(
                    "mobilityType"
                );

            const pickup =
                document.getElementById(
                    "mobilityPickup"
                );

            const destination =
                document.getElementById(
                    "mobilityDestination"
                );

            const phone =
                document.getElementById(
                    "mobilityPhone"
                );

            const note =
                document.getElementById(
                    "mobilityNote"
                );

            const error =
                document.getElementById(
                    "mobilityRequestError"
                );


            const labels = {

                trycircle: {
    title: "Request Tricycle (Keke)",
    description:
        "Request a tricycle (keke) for convenient local transportation."
},

                bike: {
                    title: "Request Bike Ride",
                    description:
                        "Find or request bike transportation around your area."
                },

                cab: {
                    title: "Request Cab",
                    description:
                        "Request a cab for convenient local transportation."
                }

            };


            const selected =
                labels[type] ||
                {
                    title: "Request Mobility",
                    description:
                        "Submit a mobility request."
                };


            if (title) {
                title.textContent =
                    selected.title;
            }

            if (description) {
                description.textContent =
                    selected.description;
            }

            if (mobilityType) {
                mobilityType.value =
                    type;
            }

            if (error) {
                error.textContent = "";
                error.classList.add("hidden");
            }

            if (pickup) {
                pickup.value = "";
            }

            if (destination) {
                destination.value = "";
            }

            if (phone) {
                phone.value = "";
            }

            if (note) {
                note.value = "";
            }


            this.openModal(modal);

        },


        /* =================================================
           HANDLE MOBILITY REQUEST
        ================================================= */

        async handleMobilityRequest() {

            const type =
                document.getElementById(
                    "mobilityType"
                )?.value || "";

            const pickup =
                document.getElementById(
                    "mobilityPickup"
                )?.value.trim() || "";

            const destination =
                document.getElementById(
                    "mobilityDestination"
                )?.value.trim() || "";

            const phone =
                document.getElementById(
                    "mobilityPhone"
                )?.value.trim() || "";

            const note =
                document.getElementById(
                    "mobilityNote"
                )?.value.trim() || "";

            const error =
                document.getElementById(
                    "mobilityRequestError"
                );

            if (!pickup || !destination || !phone) {

                if (error) {

                    error.textContent =
                        "Please complete all required fields.";

                    error.classList.remove(
                        "hidden"
                    );

                }

                return;
            }


            /*
             * If a future mobility backend exists,
             * use it here.
             */

            if (
                typeof window.submitMobilityRequest ===
                "function"
            ) {

                try {

                    await window.submitMobilityRequest({
                        type,
                        pickup,
                        destination,
                        phone,
                        note
                    });

                    this.closeModal(
                        "mobilityRequestModal"
                    );

                    this.showToast(
                        "Your mobility request has been submitted.",
                        "success"
                    );

                    return;

                } catch (requestError) {

                    console.error(
                        "LosOja mobility request error:",
                        requestError
                    );

                    if (error) {

                        error.textContent =
                            "Unable to submit the request right now. Please try again.";

                        error.classList.remove(
                            "hidden"
                        );

                    }

                    return;

                }

            }


            /*
             * Temporary front-end fallback.
             * This keeps the form working until the
             * mobility backend is connected.
             */

            try {

                const requests =
                    JSON.parse(
                        localStorage.getItem(
                            "losoja_mobility_requests"
                        ) || "[]"
                    );

                requests.push({
                    id:
                        Date.now().toString(),
                    type,
                    pickup,
                    destination,
                    phone,
                    note,
                    createdAt:
                        new Date().toISOString()
                });

                localStorage.setItem(
                    "losoja_mobility_requests",
                    JSON.stringify(requests)
                );


                this.closeModal(
                    "mobilityRequestModal"
                );

                this.showToast(
                    "Your mobility request has been received.",
                    "success"
                );

            } catch (storageError) {

                console.error(
                    "LosOja mobility storage error:",
                    storageError
                );

                if (error) {

                    error.textContent =
                        "Unable to save your request. Please try again.";

                    error.classList.remove(
                        "hidden"
                    );

                }

            }

        },


        /* =================================================
           BACK TO TOP
        ================================================= */

        createBackButton() {

            if (
                document.getElementById(
                    "losojaBackToTop"
                )
            ) {
                return;
            }


            const button =
                document.createElement(
                    "button"
                );

            button.type = "button";

            button.id =
                "losojaBackToTop";

            button.setAttribute(
                "aria-label",
                "Back to top"
            );

            button.textContent = "↑";

            button.style.position =
                "fixed";

            button.style.right =
                "20px";

            button.style.bottom =
                "20px";

            button.style.zIndex =
                "999";

            button.style.display =
                "none";

            button.style.cursor =
                "pointer";


            document.body.appendChild(
                button
            );


            button.addEventListener(
                "click",
                () => {

                    window.scrollTo({
                        top: 0,
                        behavior: "smooth"
                    });

                }
            );


            window.addEventListener(
                "scroll",
                () => {

                    button.style.display =
                        window.scrollY > 400
                            ? "block"
                            : "none";

                }
            );

        },


        /* =================================================
           TOAST / NOTIFICATION
        ================================================= */

        showToast(message, type = "info") {

            let notification =
                document.getElementById(
                    "notification"
                );

            if (!notification) {

                notification =
                    document.createElement(
                        "div"
                    );

                notification.id =
                    "notification";

                notification.className =
                    "notification";

                document.body.appendChild(
                    notification
                );

            }

            notification.textContent =
                String(message || "");

            notification.dataset.type =
                type;

            notification.classList.add(
                "show"
            );

            clearTimeout(
                notification._losojaTimer
            );

            notification._losojaTimer =
                setTimeout(
                    () => {

                        notification.classList.remove(
                            "show"
                        );

                    },
                    3000
                );

        }

    };


    /* =====================================================
       PUBLIC API
    ===================================================== */

    window.App = App;


    window.openModal =
        function (modalId) {
            App.openModal(modalId);
        };


    window.closeModal =
        function (modalId) {
            App.closeModal(modalId);
        };


    window.showNotification =
        function (message, type) {
            App.showToast(
                message,
                type
            );
        };


    /* =====================================================
       START APPLICATION
    ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            () => App.init()
        );

    } else {

        App.init();

    }

})();
