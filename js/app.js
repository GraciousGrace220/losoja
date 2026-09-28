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
    modal.style.visibility = "visible";
    modal.style.opacity = "1";
    modal.style.pointerEvents = "auto";

    modal.setAttribute(
        "aria-hidden",
        "false"
    );

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
/* Remove focus before hiding the modal */
if (modal.contains(document.activeElement)) {
    document.activeElement.blur();
}
    /* Completely hide the modal */

    modal.classList.remove("active");

    modal.classList.add("hidden");

    modal.style.display = "none";
    modal.style.visibility = "hidden";
    modal.style.opacity = "0";
    modal.style.pointerEvents = "none";

    modal.setAttribute(
        "aria-hidden",
        "true"
    );


    /* Restore page scrolling when no modal remains */

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
            modal.style.visibility = "hidden";
            modal.style.opacity = "0";
            modal.style.pointerEvents = "none";

            modal.setAttribute(
                "aria-hidden",
                "true"
            );

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


            /*
             * The mobile menu OPEN action is handled
             * by the inline script in index.html.
             *
             * Do not add another click listener here,
             * otherwise the menu can toggle twice.
             */


            /* Close menu after selecting an item */

            mobileNav
                .querySelectorAll("a, button")
                .forEach(element => {

                    element.addEventListener(
                        "click",
                        () => {

                            mobileNav.classList.remove(
                                "open"
                            );

                            menuButton.setAttribute(
                                "aria-expanded",
                                "false"
                            );

                            mobileNav.setAttribute(
                                "aria-hidden",
                                "true"
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

            function openLosOjaAddBusiness(event) {

                if (event) {
                    event.preventDefault();
                    event.stopPropagation();
                }

                console.log(
                    "LosOja: Add Business button clicked."
                );

                const modal =
                    document.getElementById(
                        "addBusinessModal"
                    );

                if (!modal) {

                    console.error(
                        "LosOja: addBusinessModal not found."
                    );

                    return;
                }

                /* Use the existing modal system */
                if (
                    typeof this.openModal ===
                    "function"
                ) {

                    this.openModal(
                        "addBusinessModal"
                    );

                    return;
                }

                /* Backup opening method */
                modal.classList.add("active");

                modal.style.display = "flex";
modal.style.visibility = "visible";
modal.style.opacity = "1";
modal.style.pointerEvents = "auto";

modal.setAttribute(
    "aria-hidden",
    "false"
);
                modal.setAttribute(
                    "aria-hidden",
                    "false"
                );

                document.body.classList.add(
                    "modal-open"
                );

            }


            /* Connect Add Business buttons */
            document
                .querySelectorAll(
                    "#addBusinessBtn, .add-business-btn, .nav-add-button, #plusBtn, .plus-btn, .floating-add-btn, [data-action='add-business']"
                )
                .forEach(button => {

                    button.addEventListener(
                        "click",
                        openLosOjaAddBusiness.bind(this)
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
                       BUSINESS IMAGE UPLOAD
                    ------------------------------------- */

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
        (
            typeof window.getSupabaseAccessToken === "function"
                ? (
                    window.getSupabaseAccessToken() ||
                    SUPABASE_KEY
                )
                : SUPABASE_KEY
        ),

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


                    /* ---------------------------------------------
                       GET CURRENT LOGGED-IN USER
                    --------------------------------------------- */

                    let userId = null;

                    try {

                        if (
                            typeof window.getCurrentUser ===
                            "function"
                        ) {

                            const currentUser =
                                await window.getCurrentUser();

                            if (currentUser && currentUser.id) {

                                userId =
                                    currentUser.id;

                            }

                        }

                    } catch (userError) {

                        console.warn(
                            "LosOja: Could not get current user.",
                            userError
                        );

                    }


                    /* ---------------------------------------------
                       BUSINESS DATA
                    --------------------------------------------- */

                    const businessData = {

                        name: name,

                        category: category,

                        location: location,

                        phone: phone,

                        description: description,

                        image_url: imageUrl,

                        latitude: latitude,

                        longitude: longitude,

                        user_id: userId

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
        (
            typeof window.getSupabaseAccessToken === "function"
                ? (
                    window.getSupabaseAccessToken() ||
                    SUPABASE_KEY
                )
                : SUPABASE_KEY
        ),

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

                            if (
                                typeof window.loadBusinesses ===
                                "function"
                            ) {

                                await window.loadBusinesses(true);

                                /* Give the business grid a moment to render */
                                setTimeout(function () {

                                    if (
                                        typeof window.renderBusinesses ===
                                        "function" &&
                                        Array.isArray(window.losojaBusinesses)
                                    ) {

                                        window.renderBusinesses(
                                            window.losojaBusinesses
                                        );

                                    }

                                }, 100);

                            }

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
           NOTIFICATIONS
        ================================================= */

        async openNotifications() {

            let modal =
                document.getElementById(
                    "notificationsModal"
                );

            if (!modal) {

                modal =
                    document.createElement(
                        "div"
                    );

                modal.id =
                    "notificationsModal";

                modal.className =
                    "modal-overlay hidden";

                modal.setAttribute(
                    "aria-hidden",
                    "true"
                );

                modal.innerHTML = `
                    <div class="modal-content">

                        <button
                            type="button"
                            class="modal-close"
                            aria-label="Close"
                        >
                            ×
                        </button>

                        <h2>
                            Notifications
                        </h2>

                        <div
                            id="notificationsList"
                            style="margin-top:1rem;"
                        >
                            <p>
                                Loading notifications...
                            </p>
                        </div>

                    </div>
                `;

                document.body.appendChild(
                    modal
                );

            }

            /*
             * Open the modal first so the user
             * immediately sees something happening.
             */

            this.openModal(
                modal
            );


            const list =
                document.getElementById(
                    "notificationsList"
                );

            if (!list) {
                return;
            }

            list.innerHTML = `
                <p>
                    Loading notifications...
                </p>
            `;


            /* ---------------------------------------------
               CHECK LOGIN
            --------------------------------------------- */

            if (
                typeof window.getCurrentUser !==
                "function"
            ) {

                list.innerHTML = `
                    <p>
                        Please log in to view your notifications.
                    </p>
                `;

                return;
            }


            let currentUser = null;

            try {

                currentUser =
                    await window.getCurrentUser();

            } catch (error) {

                console.error(
                    "LosOja notification user error:",
                    error
                );

                list.innerHTML = `
                    <p>
                        Unable to load your notifications.
                    </p>
                `;

                return;
            }


            if (
                !currentUser ||
                !currentUser.id
            ) {

                list.innerHTML = `
                    <p>
                        Please log in to view your notifications.
                    </p>
                `;

                return;
            }


            /* ---------------------------------------------
               GET ACCESS TOKEN
            --------------------------------------------- */

            let accessToken = null;

            try {

                if (
                    typeof window.getSupabaseAccessToken ===
                    "function"
                ) {

                    accessToken =
                        window.getSupabaseAccessToken();

                }

            } catch (tokenError) {

                console.warn(
                    "LosOja: Could not get notification access token.",
                    tokenError
                );

            }


            if (!accessToken) {

                list.innerHTML = `
                    <p>
                        Your login session has expired. Please log in again.
                    </p>
                `;

                return;
            }


            /* ---------------------------------------------
               SUPABASE SETTINGS
            --------------------------------------------- */

            const SUPABASE_URL =
                "https://ycxshwgeebskdozmornh.supabase.co";

            const SUPABASE_KEY =
                "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXAiLCJ...";


            /*
             * IMPORTANT:
             * Use the SAME anon key already used
             * elsewhere in your current app.js.
             *
             * Replace the value above with your
             * existing working SUPABASE_KEY.
             */


            /* ---------------------------------------------
               LOAD USER NOTIFICATIONS
            --------------------------------------------- */

            try {

                const response =
                    await fetch(
                        SUPABASE_URL +
                        "/rest/v1/notifications" +
                        "?select=*" +
                        "&user_id=eq." +
                        encodeURIComponent(
                            currentUser.id
                        ) +
                        "&order=created_at.desc",

                        {
                            method: "GET",

                            headers: {
                                "apikey":
                                    SUPABASE_KEY,

                                "Authorization":
                                    "Bearer " +
                                    accessToken,

                                "Content-Type":
                                    "application/json"
                            }
                        }
                    );


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


                if (!response.ok) {

                    console.error(
                        "LosOja notifications load error:",
                        result
                    );

                    throw new Error(
                        result &&
                        typeof result === "object" &&
                        (
                            result.message ||
                            result.error ||
                            result.error_description
                        )
                            ? (
                                result.message ||
                                result.error ||
                                result.error_description
                            )
                            : "Unable to load notifications."
                    );

                }


                const notifications =
                    Array.isArray(result)
                        ? result
                        : [];


                /* -----------------------------------------
                   NO NOTIFICATIONS
                ----------------------------------------- */

                if (
                    notifications.length ===
                    0
                ) {

                    list.innerHTML = `
                        <p
                            style="
                                color:#6b7280;
                                text-align:center;
                                padding:1rem;
                            "
                        >
                            You don't have any notifications yet.
                        </p>
                    `;

                    return;
                }


                /* -----------------------------------------
                   RENDER NOTIFICATIONS
                ----------------------------------------- */

                list.innerHTML =
                    notifications
                        .map(
                            notification => {

                                const title =
                                    String(
                                        notification.title ||
                                        "Notification"
                                    );

                                const message =
                                    String(
                                        notification.message ||
                                        ""
                                    );

                                const createdAt =
                                    notification.created_at
                                        ? new Date(
                                            notification.created_at
                                        ).toLocaleString(
                                            "en-NG"
                                        )
                                        : "";

                                const unread =
                                    notification.is_read !==
                                    true;

                                return `
                                    <div
                                        class="losoja-notification-item"
                                        data-notification-id="${notification.id}"
                                        style="
                                            padding:1rem;
                                            margin-bottom:.75rem;
                                            border:1px solid #e5e7eb;
                                            border-radius:12px;
                                            background:${unread ? "#eef8f2" : "#ffffff"};
                                        "
                                    >

                                        <div
                                            style="
                                                display:flex;
                                                justify-content:space-between;
                                                gap:.75rem;
                                                align-items:flex-start;
                                            "
                                        >

                                            <strong>
                                                ${this.escapeNotificationText(title)}
                                            </strong>

                                            ${
                                                unread
                                                    ? `
                                                        <span
                                                            style="
                                                                font-size:.75rem;
                                                                color:#087a3e;
                                                                font-weight:600;
                                                            "
                                                        >
                                                            NEW
                                                        </span>
                                                      `
                                                    : ""
                                            }

                                        </div>

                                        <p
                                            style="
                                                margin:.5rem 0;
                                                color:#374151;
                                            "
                                        >
                                            ${this.escapeNotificationText(message)}
                                        </p>

                                        <small
                                            style="
                                                color:#6b7280;
                                            "
                                        >
                                            ${this.escapeNotificationText(createdAt)}
                                        </small>

                                        ${
                                            unread
                                                ? `
                                                    <button
                                                        type="button"
                                                        class="notification-read-btn"
                                                        data-notification-id="${notification.id}"
                                                        style="
                                                            margin-top:.75rem;
                                                            border:0;
                                                            background:none;
                                                            color:#087a3e;
                                                            cursor:pointer;
                                                            font-weight:600;
                                                            padding:0;
                                                        "
                                                    >
                                                        Mark as read
                                                    </button>
                                                  `
                                                : ""
                                        }

                                    </div>
                                `;

                            }
                        )
                        .join("");


                /* -----------------------------------------
                   MARK AS READ
                ----------------------------------------- */

                list
                    .querySelectorAll(
                        ".notification-read-btn"
                    )
                    .forEach(button => {

                        button.addEventListener(
                            "click",
                            async () => {

                                const notificationId =
                                    button.getAttribute(
                                        "data-notification-id"
                                    );

                                if (!notificationId) {
                                    return;
                                }


                                button.disabled =
                                    true;

                                button.textContent =
                                    "Updating...";


                                try {

                                    const updateResponse =
                                        await fetch(
                                            SUPABASE_URL +
                                            "/rest/v1/notifications" +
                                            "?id=eq." +
                                            encodeURIComponent(
                                                notificationId
                                            ),

                                            {
                                                method:
                                                    "PATCH",

                                                headers: {
                                                    "apikey":
                                                        SUPABASE_KEY,

                                                    "Authorization":
                                                        "Bearer " +
                                                        accessToken,

                                                    "Content-Type":
                                                        "application/json"
                                                },

                                                body:
                                                    JSON.stringify({
                                                        is_read:
                                                            true
                                                    })
                                            }
                                        );


                                    if (
                                        !updateResponse.ok
                                    ) {

                                        const updateText =
                                            await updateResponse.text();

                                        console.error(
                                            "LosOja notification update error:",
                                            updateText
                                        );

                                        throw new Error(
                                            "Unable to mark notification as read."
                                        );

                                    }


                                    /*
                                     * Reload the notification
                                     * list after updating.
                                     */

                                    await this.openNotifications();

                                } catch (error) {

                                    console.error(
                                        "LosOja notification read error:",
                                        error
                                    );

                                    button.disabled =
                                        false;

                                    button.textContent =
                                        "Mark as read";

                                    this.showToast(
                                        error.message,
                                        "error"
                                    );

                                }

                            }
                        );

                    });


            } catch (error) {

                console.error(
                    "LosOja notifications error:",
                    error
                );

                list.innerHTML = `
                    <p
                        style="
                            color:#b91c1c;
                            padding:1rem;
                        "
                    >
                        Could not load notifications:
                        ${this.escapeNotificationText(error.message)}
                    </p>
                `;

            }

        },


        /* =================================================
           ESCAPE NOTIFICATION TEXT
        ================================================= */

        escapeNotificationText(value) {

            return String(
                value || ""
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

        },


        /* =================================================
           ACCOUNT
        ================================================= */

        openAccount() {

            if (
                typeof window.getCurrentUser !==
                "function"
            ) {

                this.showToast(
                    "Account is still loading. Please try again.",
                    "info"
                );

                return;
            }


            window.getCurrentUser()
                .then(user => {

                    if (!user) {

                        this.openModal(
                            "loginModal"
                        );

                        return;
                    }


                    window.location.href =
                        "account.html";

                })
                .catch(error => {

                    console.error(
                        "LosOja account error:",
                        error
                    );

                    this.showToast(
                        "Unable to open your account right now.",
                        "error"
                    );

                });

        }

    };


    /* =====================================================
       PUBLIC API
    ===================================================== */

    window.App = App;


    window.openModal =
        function (modalId) {

            App.openModal(
                modalId
            );

        };


    window.closeModal =
        function (modalId) {

            App.closeModal(
                modalId
            );

        };


    window.showNotification =
        function (message, type) {

            App.showToast(
                message,
                type
            );

        };


    window.openNotifications =
        function () {

            App.openNotifications();

        };


    window.openAccount =
        function () {

            App.openAccount();

        };


    window.showToast =
        function (message, type) {

            App.showToast(
                message,
                type
            );

        };
   
    /* =====================================================
       BUSINESS DETAILS
    ===================================================== */

    window.showBusinessDetails =
        function (business) {

            console.log(
                "LosOja: Opening business details:",
                business
            );

            if (!business) {
                console.warn(
                    "LosOja: No business supplied."
                );
                return;
            }

            const modal =
                document.getElementById(
                    "businessDetailsModal"
                );

            if (!modal) {
                console.error(
                    "LosOja: businessDetailsModal not found."
                );
                return;
            }

            const image =
                document.getElementById(
                    "businessDetailsImage"
                );

            const name =
                document.getElementById(
                    "businessDetailsName"
                );

            const category =
                document.getElementById(
                    "businessDetailsCategory"
                );

            const location =
                document.getElementById(
                    "businessDetailsLocation"
                );

            const phone =
                document.getElementById(
                    "businessDetailsPhone"
                );

            const description =
                document.getElementById(
                    "businessDetailsDescription"
                );

            const rating =
                document.getElementById(
                    "businessDetailsRating"
                );


            if (image) {

                if (business.image_url) {

                    image.src =
                        business.image_url;

                    image.style.display =
                        "block";

                } else {

                    image.removeAttribute(
                        "src"
                    );

                    image.style.display =
                        "none";

                }

            }


            if (name) {

                name.textContent =
                    business.name ||
                    "Business";

            }


            if (category) {

                category.textContent =
                    "Category: " +
                    (
                        business.category ||
                        "Not specified"
                    );

            }


            if (location) {

                location.textContent =
                    "Location: " +
                    (
                        business.location ||
                        "Nigeria"
                    );

            }


            if (phone) {

                phone.textContent =
                    business.phone
                        ? "Phone: " +
                          business.phone
                        : "Phone: Not provided";

            }


            if (description) {

                description.textContent =
                    business.description ||
                    "No description provided.";

            }


            if (rating) {

                rating.textContent =
                    business.rating
                        ? "Rating: " +
                          business.rating
                        : "No rating yet";

            }


            App.openModal(
    "businessDetailsModal"
);

};


/* =====================================================
   CREATE ESCROW FROM BUSINESS DETAILS
===================================================== */

window.createBusinessEscrow = async function (business) {

    if (!business) {
        window.showToast(
            "Business information is missing.",
            "error"
        );
        return;
    }

    /* CHECK LOGIN */

    if (
        typeof window.getCurrentUser !==
        "function"
    ) {
        window.showToast(
            "Please log in before creating an escrow.",
            "error"
        );
        return;
    }

    let currentUser = null;

    try {

        currentUser =
            await window.getCurrentUser();

    } catch (error) {

        console.error(
            "LosOja: Could not get current user:",
            error
        );

        window.showToast(
            "Please log in before creating an escrow.",
            "error"
        );

        return;
    }

    if (!currentUser || !currentUser.id) {

        window.showToast(
            "Please log in before creating an escrow.",
            "info"
        );

        if (typeof window.openModal === "function") {
            window.openModal("loginModal");
        }

        return;
    }


    /* GET BUSINESS OWNER */

    const sellerId =
        business.user_id || "";

    if (!sellerId) {

        window.showToast(
            "This business does not have an owner account linked yet.",
            "error"
        );

        return;
    }


    /* PREVENT SELF-ESCROW */

    if (sellerId === currentUser.id) {

        window.showToast(
            "You cannot create an escrow with your own business.",
            "error"
        );

        return;
    }


    /* GET AMOUNT */

    const amountInput =
        window.prompt(
            "Enter the escrow amount in Nigerian Naira:"
        );

    if (amountInput === null) {
        return;
    }

    const amount =
        Number(
            String(amountInput)
                .replace(/,/g, "")
                .trim()
        );

    if (
        !Number.isFinite(amount) ||
        amount <= 0
    ) {

        window.showToast(
            "Please enter a valid escrow amount.",
            "error"
        );

        return;
    }


    /* GET DESCRIPTION */

    const descriptionInput =
        window.prompt(
            "What is this escrow payment for?"
        );

    if (descriptionInput === null) {
        return;
    }

    const description =
        String(descriptionInput)
            .trim();

    if (!description) {

        window.showToast(
            "Please enter a description.",
            "error"
        );

        return;
    }

    if (description.length > 500) {

        window.showToast(
            "The escrow description is too long.",
            "error"
        );

        return;
    }


    /* CONFIRM */

    const confirmed =
        window.confirm(
            "Create a ₦" +
            amount.toLocaleString("en-NG", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }) +
            " escrow for " +
            (business.name || "this business") +
            "?"
        );

    if (!confirmed) {
        return;
    }


    /* GET ACCESS TOKEN */

    let accessToken = null;

    try {

        if (
            typeof window.getSupabaseAccessToken ===
            "function"
        ) {

            accessToken =
                window.getSupabaseAccessToken();

        }

    } catch (tokenError) {

        console.warn(
            "LosOja: Could not get access token.",
            tokenError
        );

    }


    if (!accessToken) {

        window.showToast(
            "Your login session has expired. Please log in again.",
            "error"
        );

        return;
    }


    /* CREATE ESCROW */

    try {

        window.showToast(
            "Creating escrow...",
            "info"
        );


        const response =
            await fetch(
                "https://ycxshwgeebskdozmornh.supabase.co/functions/v1/create-escrow",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Authorization":
                            "Bearer " +
                            accessToken
                    },

                    body:
                        JSON.stringify({
                            seller_id:
                                sellerId,

                            amount:
                                amount,

                            description:
                                description
                        })
                }
            );


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


        if (!response.ok) {

            console.error(
                "LosOja create escrow error:",
                result
            );

            const errorMessage =
                result &&
                typeof result === "object" &&
                (
                    result.message ||
                    result.error ||
                    result.error_description
                )
                    ? (
                        result.message ||
                        result.error ||
                        result.error_description
                    )
                    : "Unable to create escrow.";

            throw new Error(
                errorMessage
            );
        }


        console.log(
            "LosOja escrow created:",
            result
        );


        /* CLOSE BUSINESS DETAILS */

        if (
            typeof window.closeModal ===
            "function"
        ) {

            window.closeModal(
                "businessDetailsModal"
            );

        }


        /* SUCCESS */

        window.showToast(
            "Escrow created successfully.",
            "success"
        );


    } catch (error) {

        console.error(
            "LosOja escrow error:",
            error
        );

        window.showToast(
            "Could not create escrow: " +
            error.message,
            "error"
        );

    }

};


/* =====================================================
   BUSINESS DETAILS ACTION BUTTONS
===================================================== */

document.addEventListener(
    "click",
    async event => {

        const escrowButton =
            event.target.closest(
                "#businessEscrowBtn"
            );

        if (!escrowButton) {
            return;
        }


        const business =
            window.losojaSelectedBusiness;


        if (!business) {

            window.showToast(
                "Business information is unavailable.",
                "error"
            );

            return;
        }


        await window.createBusinessEscrow(
            business
        );

    }
);


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
