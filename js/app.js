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
   - Add Business
   - Mobility / TryCircle / Bike / Cab
   - Mobility request form
   - Notifications
   - Notification button
   - Notification sound
   - Account button
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
           NOTIFICATION STATE
        ================================================= */

        notificationKnownIds: new Set(),

        notificationBaselineLoaded: false,


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

            this.bindNotificationButton();

            this.bindAccountButton();

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


                  closeModal(modalId) {

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

            /* ---------------------------------------------
               REMOVE FOCUS BEFORE HIDING MODAL
            --------------------------------------------- */

            if (
                modal.contains(
                    document.activeElement
                )
            ) {

                document.activeElement.blur();

            }

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

                    if (
                        modal.contains(
                            document.activeElement
                        )
                    ) {

                        document.activeElement.blur();

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
                        "hidden";

                    modal.style.opacity =
                        "0";

                    modal.style.pointerEvents =
                        "none";

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
                            ".modal-close, .close-modal"
                        );

                    if (closeButton) {

                        const modal =
                            closeButton.closest(
                                ".modal-overlay, .modal"
                            );

                        if (modal) {
                            this.closeModal(modal);
                        }

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

            const searchInput =
                document.getElementById(
                    "businessSearch"
                ) ||
                document.getElementById(
                    "searchInput"
                );

            const searchButton =
                document.getElementById(
                    "searchButton"
                );

            if (!searchInput) {

                console.warn(
                    "LosOja: Search input not found."
                );

                return;

            }


            const performSearch = () => {

                const search =
                    searchInput.value.trim();

                const locationInput =
                    document.getElementById(
                        "locationInput"
                    );

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


                    const businesses =
                        document.getElementById(
                            "businesses"
                        );

                    if (businesses) {

                        setTimeout(
                            () => {

                                businesses.scrollIntoView({
                                    behavior: "smooth",
                                    block: "start"
                                });

                            },
                            50
                        );

                    }

                } else {

                    this.showToast(
                        "Search is still loading. Please try again.",
                        "info"
                    );

                }

            };


            if (searchButton) {

                searchButton.addEventListener(
                    "click",
                    event => {

                        event.preventDefault();

                        performSearch();

                    }
                );

            }


            searchInput.addEventListener(
                "keydown",
                event => {

                    if (
                        event.key === "Enter"
                    ) {

                        event.preventDefault();

                        performSearch();

                    }

                }
            );

        },


        /* =================================================
           LOCATION BUTTON
        ================================================= */

        bindLocationButton() {

            const locationBtn =
                document.getElementById(
                    "locationButton"
                );

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

                            if (
                                category ===
                                "Trade by Barter"
                            ) {

                                window.location.href =
                                    "barter.html";

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

            /*
             * Business cards are already handled by
             * businesses.js using:
             *
             * onclick="openBusiness('${id}')"
             *
             * Do not add another document click handler here.
             * This keeps the existing business-card functionality
             * untouched.
             */

            return;

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

                if (
                    typeof this.openModal ===
                    "function"
                ) {

                    this.openModal(
                        "addBusinessModal"
                    );

                    return;
                }

                modal.classList.add("active");

                modal.style.display = "flex";

                modal.setAttribute(
                    "aria-hidden",
                    "false"
                );

                document.body.classList.add(
                    "modal-open"
                );

            }


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


                    const SUPABASE_URL =
                        "https://ycxshwgeebskdozmornh.supabase.co";


                    const SUPABASE_KEY =
                        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljeHNod2dlZWJza2Rvem1vcm5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzMDY0NjUsImV4cCI6MjEwMzg4MjQ2NX0.tMl7wILdVDhu0RWFaG_84ngJEryLt2c5cB8MEKW3kfU";


                    /* -------------------------------------
                       BUSINESS IMAGE UPLOAD
                    ------------------------------------- */

                    const imageInput =
                        document.getElementById(
                            "businessImage"
                        );

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


                        if (
                            !allowedTypes.includes(
                                imageFile.type
                            )
                        ) {

                            this.showToast(
                                "Please upload a JPG, PNG, WEBP or GIF image.",
                                "error"
                            );

                            if (submitButton) {

                                submitButton.disabled =
                                    false;

                                submitButton.textContent =
                                    originalText ||
                                    "Save Business";

                            }

                            return;

                        }


                        const maxFileSize =
                            5 * 1024 * 1024;


                        if (
                            imageFile.size >
                            maxFileSize
                        ) {

                            this.showToast(
                                "Image must be 5MB or smaller.",
                                "error"
                            );

                            if (submitButton) {

                                submitButton.disabled =
                                    false;

                                submitButton.textContent =
                                    originalText ||
                                    "Save Business";

                            }

                            return;

                        }


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
                                                    typeof window.getSupabaseAccessToken ===
                                                    "function"
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

                                        body:
                                            imageFile

                                    }
                                );


                            const uploadText =
                                await uploadResponse.text();


                            let uploadResult = null;


                            try {

                                uploadResult =
                                    uploadText
                                        ? JSON.parse(
                                            uploadText
                                        )
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
                                    typeof uploadResult ===
                                    "object" &&
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

                                submitButton.disabled =
                                    false;

                                submitButton.textContent =
                                    originalText ||
                                    "Save Business";

                            }

                            return;

                        }

                    }


                    /* -------------------------------------
                       GET SAVED USER LOCATION
                    ------------------------------------- */

                    let latitude = null;
                    let longitude = null;


                    try {

                        const savedLocation =
                            localStorage.getItem(
                                "losoja_user_location"
                            );

                        if (savedLocation) {

                            const parsedLocation =
                                JSON.parse(
                                    savedLocation
                                );

                            if (
                                typeof parsedLocation.latitude ===
                                "number" &&
                                typeof parsedLocation.longitude ===
                                "number"
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


                    /* -------------------------------------
                       GET CURRENT USER
                    ------------------------------------- */

                    let userId = null;


                    try {

                        if (
                            typeof window.getCurrentUser ===
                            "function"
                        ) {

                            const currentUser =
                                await window.getCurrentUser();

                            if (
                                currentUser &&
                                currentUser.id
                            ) {

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


                    /* -------------------------------------
                       BUSINESS DATA
                    ------------------------------------- */

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
                                                typeof window.getSupabaseAccessToken ===
                                                "function"
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
                                "LosOja Supabase insert error:",
                                result
                            );

                            const errorMessage =
                                result &&
                                typeof result ===
                                "object" &&
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


                        console.log(
                            "LosOja business saved:",
                            result
                        );


                        form.reset();


                        this.closeModal(
                            "addBusinessModal"
                        );


                        this.showToast(
                            "Business added successfully!",
                            "success"
                        );


                        if (
                            typeof window.loadBusinesses ===
                            "function"
                        ) {

                            await window.loadBusinesses(
                                true
                            );


                            setTimeout(
                                function () {

                                    if (
                                        typeof window.renderBusinesses ===
                                        "function" &&
                                        Array.isArray(
                                            window.losojaBusinesses
                                        )
                                    ) {

                                        window.renderBusinesses(
                                            window.losojaBusinesses
                                        );

                                    }

                                },
                                100
                            );

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

                    title:
                        "Request Tricycle (Keke)",

                    description:
                        "Request a tricycle (keke) for convenient local transportation."

                },

                bike: {

                    title:
                        "Request Bike Ride",

                    description:
                        "Find or request bike transportation around your area."

                },

                cab: {

                    title:
                        "Request Cab",

                    description:
                        "Request a cab for convenient local transportation."

                }

            };


            const selected =
                labels[type] ||
                {

                    title:
                        "Request Mobility",

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

                error.textContent =
                    "";

                error.classList.add(
                    "hidden"
                );

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


            if (
                !pickup ||
                !destination ||
                !phone
            ) {

                if (error) {

                    error.textContent =
                        "Please complete all required fields.";

                    error.classList.remove(
                        "hidden"
                    );

                }

                return;

            }


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
           NOTIFICATION BUTTON
        ================================================= */

        bindNotificationButton() {

            const notificationButtons =
                document.querySelectorAll(
                    '#notificationBtn, .notification-btn, button[aria-label="Notifications"], button[aria-label="Notification"], [data-action="notifications"]'
                );


            if (!notificationButtons.length) {

                console.warn(
                    "LosOja: Notification button not found."
                );

                return;

            }


            notificationButtons.forEach(button => {

                if (
                    button.dataset
                        .losojaNotificationReady ===
                    "true"
                ) {

                    return;

                }


                button.dataset
                    .losojaNotificationReady =
                    "true";


                button.addEventListener(
                    "click",
                    event => {

                        event.preventDefault();

                        this.prepareNotificationSound();

                        this.openNotifications();

                    }
                );

            });

        },


        /* =================================================
           ACCOUNT BUTTON
        ================================================= */

        bindAccountButton() {

            const accountButtons =
                document.querySelectorAll(
                    '#accountBtn, .account-btn, .nav-account, [data-action="account"], [data-nav="account"]'
                );


            if (!accountButtons.length) {

                console.warn(
                    "LosOja: Account button not found."
                );

                return;

            }


            accountButtons.forEach(button => {

                if (
                    button.dataset
                        .losojaAccountReady ===
                    "true"
                ) {

                    return;

                }


                button.dataset
                    .losojaAccountReady =
                    "true";


                button.addEventListener(
                    "click",
                    event => {

                        event.preventDefault();

                        console.log(
                            "LosOja: Account button clicked."
                        );


                        if (
                            typeof window.openAccount ===
                            "function"
                        ) {

                            window.openAccount();

                        } else {

                            console.error(
                                "LosOja: openAccount function is not available."
                            );

                        }

                    }
                );

            });

        },


        /* =================================================
           NOTIFICATION SOUND
        ================================================= */

        prepareNotificationSound() {

            try {

                const AudioContext =
                    window.AudioContext ||
                    window.webkitAudioContext;


                if (!AudioContext) {
                    return;
                }


                if (!this.notificationAudioContext) {

                    this.notificationAudioContext =
                        new AudioContext();

                }


                if (
                    this.notificationAudioContext.state ===
                    "suspended"
                ) {

                    this.notificationAudioContext
                        .resume()
                        .catch(() => {});

                }

            } catch (error) {

                console.warn(
                    "LosOja: Could not prepare notification sound.",
                    error
                );

            }

        },


        playNotificationSound() {

            try {

                const AudioContext =
                    window.AudioContext ||
                    window.webkitAudioContext;


                if (!AudioContext) {
                    return;
                }


                if (!this.notificationAudioContext) {

                    this.notificationAudioContext =
                        new AudioContext();

                }


                const audioContext =
                    this.notificationAudioContext;


                if (
                    audioContext.state ===
                    "suspended"
                ) {

                    audioContext
                        .resume()
                        .catch(() => {});

                }


                const oscillator =
                    audioContext.createOscillator();


                const gainNode =
                    audioContext.createGain();


                oscillator.type =
                    "sine";


                /*
                 * Original LosOja coin-style chime.
                 */

                oscillator.frequency.setValueAtTime(
                    880,
                    audioContext.currentTime
                );


                oscillator.frequency.exponentialRampToValueAtTime(
                    520,
                    audioContext.currentTime + 0.18
                );


                gainNode.gain.setValueAtTime(
                    0.0001,
                    audioContext.currentTime
                );


                gainNode.gain.exponentialRampToValueAtTime(
                    0.22,
                    audioContext.currentTime + 0.015
                );


                gainNode.gain.exponentialRampToValueAtTime(
                    0.0001,
                    audioContext.currentTime + 0.32
                );


                oscillator.connect(
                    gainNode
                );


                gainNode.connect(
                    audioContext.destination
                );


                oscillator.start();


                oscillator.stop(
                    audioContext.currentTime + 0.32
                );


            } catch (error) {

                console.warn(
                    "LosOja: Could not play notification sound.",
                    error
                );

            }

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

                        <div class="modal-header">

                            <h2>
                                Notifications
                            </h2>

                        </div>

                        <div
                            id="notificationsList"
                            class="notifications-list"
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


            /* ---------------------------------------------
               OPEN MODAL
            --------------------------------------------- */

            this.openModal(
                "notificationsModal"
            );


            const list =
                document.getElementById(
                    "notificationsList"
                );


            if (!list) {
                return;
            }


            /* ---------------------------------------------
               CHECK LOGIN
            --------------------------------------------- */

            let currentUser = null;


            try {

                if (
                    typeof window.getCurrentUser ===
                    "function"
                ) {

                    currentUser =
                        await window.getCurrentUser();

                }

            } catch (error) {

                console.error(
                    "LosOja: Could not get current user:",
                    error
                );

            }


            if (!currentUser) {

                list.innerHTML = `
                    <p>
                        Please login to view your notifications.
                    </p>
                `;

                return;

            }


            /* ---------------------------------------------
               GET SUPABASE ACCESS TOKEN
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

            } catch (error) {

                console.error(
                    "LosOja: Could not get access token:",
                    error
                );

            }


            if (!accessToken) {

                list.innerHTML = `
                    <p>
                        Please login again to view notifications.
                    </p>
                `;

                return;

            }


            /* ---------------------------------------------
               SUPABASE
            --------------------------------------------- */

            const SUPABASE_URL =
                "https://ycxshwgeebskdozmornh.supabase.co";


            const SUPABASE_KEY =
                "sb_publishable_jFSLacwNupO6T8EnSqb2bw_bZmy7rVe";


            /* ---------------------------------------------
               LOAD NOTIFICATIONS
            --------------------------------------------- */

            try {

                const response =
                    await fetch(
                        SUPABASE_URL +
                        "/rest/v1/notifications?select=*" +
                        "&user_id=eq." +
                        encodeURIComponent(
                            currentUser.id
                        ) +
                        "&order=created_at.desc",
                        {

                            method:
                                "GET",

                            headers: {

                                apikey:
                                    SUPABASE_KEY,

                                Authorization:
                                    "Bearer " +
                                    accessToken,

                                "Content-Type":
                                    "application/json"

                            }

                        }
                    );


                if (!response.ok) {

                    let errorData = null;


                    try {

                        errorData =
                            await response.json();

                    } catch (error) {

                        errorData =
                            null;

                    }


                    console.error(
                        "LosOja notifications load error:",
                        errorData
                    );


                    throw new Error(
                        errorData?.message ||
                        "Could not load notifications"
                    );

                }


                const notifications =
                    await response.json();


                /* -----------------------------------------
                   DETECT NEW UNREAD NOTIFICATIONS
                ----------------------------------------- */

                const unreadNotifications =
                    Array.isArray(notifications)
                        ? notifications.filter(
                            notification =>
                                notification &&
                                notification.is_read !== true
                        )
                        : [];


                const newUnreadNotifications =
                    unreadNotifications.filter(
                        notification => {

                            const id =
                                String(
                                    notification.id
                                );

                            return !this.notificationKnownIds.has(
                                id
                            );

                        }
                    );


                /*
                 * First successful load establishes the
                 * current notification list.
                 *
                 * If unread notifications appear after
                 * that, the LosOja sound plays.
                 */

                if (
                    this.notificationBaselineLoaded &&
                    newUnreadNotifications.length > 0
                ) {

                    this.prepareNotificationSound();

                    this.playNotificationSound();

                }


                unreadNotifications.forEach(
                    notification => {

                        this.notificationKnownIds.add(
                            String(
                                notification.id
                            )
                        );

                    }
                );


                this.notificationBaselineLoaded =
                    true;


                if (
                    !Array.isArray(
                        notifications
                    ) ||
                    notifications.length === 0
                ) {

                    list.innerHTML = `
                        <div class="notification-empty">

                            <p>
                                No notifications yet.
                            </p>

                        </div>
                    `;

                    return;

                }


                const escapeNotificationText =
                    function (value) {

                        const div =
                            document.createElement(
                                "div"
                            );

                        div.textContent =
                            value == null
                                ? ""
                                : String(value);

                        return div.innerHTML;

                    };


                list.innerHTML =
                    notifications
                        .map(
                            notification => {

                                const title =
                                    escapeNotificationText(
                                        notification.title ||
                                        "Notification"
                                    );


                                const message =
                                    escapeNotificationText(
                                        notification.message ||
                                        ""
                                    );


                                const date =
                                    notification.created_at
                                        ? new Date(
                                            notification.created_at
                                        ).toLocaleString()
                                        : "";


                                const unread =
                                    notification.is_read !==
                                    true;


                                return `
                                    <div
                                        class="notification-item ${
                                            unread
                                                ? "unread"
                                                : ""
                                        }"
                                        data-notification-id="${
                                            escapeNotificationText(
                                                notification.id
                                            )
                                        }"
                                    >

                                        <div class="notification-content">

                                            <h3>

                                                ${title}

                                                ${
                                                    unread
                                                        ? `
                                                            <span
                                                                class="notification-new"
                                                            >
                                                                NEW
                                                            </span>
                                                        `
                                                        : ""
                                                }

                                            </h3>

                                            <p>
                                                ${message}
                                            </p>

                                            <small>
                                                ${escapeNotificationText(
                                                    date
                                                )}
                                            </small>

                                        </div>

                                        ${
                                            unread
                                                ? `
                                                    <button
                                                        type="button"
                                                        class="notification-read-btn"
                                                        data-notification-id="${
                                                            escapeNotificationText(
                                                                notification.id
                                                            )
                                                        }"
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


                /* =================================================
                   NOTIFICATION CLICK ACTIONS
                ================================================= */

                list
                    .querySelectorAll(
                        ".notification-item"
                    )
                    .forEach(
                        item => {

                            item.style.cursor = "pointer";

                            item.addEventListener(
                                "click",
                                async event => {

                                    /* Do not open the notification
                                       when Mark as read is clicked */
                                    if (
                                        event.target.closest(
                                            ".notification-read-btn"
                                        )
                                    ) {
                                        return;
                                    }

                                    const notificationId =
                                        item.getAttribute(
                                            "data-notification-id"
                                        );

                                    const notification =
                                        notifications.find(
                                            itemNotification =>
                                                String(
                                                    itemNotification.id
                                                ) ===
                                                String(
                                                    notificationId
                                                )
                                        );

                                    if (!notification) {
                                        return;
                                    }

                                    try {

                                        /* Mark as read before opening */
                                        if (
                                            !notification.is_read &&
                                            notificationId
                                        ) {

                                            const updateResponse =
                                                await fetch(
                                                    SUPABASE_URL +
                                                    "/rest/v1/notifications?id=eq." +
                                                    encodeURIComponent(
                                                        notificationId
                                                    ),
                                                    {
                                                        method: "PATCH",

                                                        headers: {
                                                            apikey:
                                                                SUPABASE_KEY,

                                                            Authorization:
                                                                "Bearer " +
                                                                accessToken,

                                                            "Content-Type":
                                                                "application/json",

                                                            Prefer:
                                                                "return=minimal"
                                                        },

                                                        body:
                                                            JSON.stringify({
                                                                is_read: true
                                                            })
                                                    }
                                                );

                                            if (
                                                !updateResponse.ok
                                            ) {

                                                console.warn(
                                                    "LosOja: Could not mark notification as read before opening."
                                                );

                                            }

                                        }


                                        /* =================================================
                                           OPEN NOTIFICATION DESTINATION
                                        ================================================= */

                                        const notificationType =
                                            String(
                                                notification.type ||
                                                ""
                                            ).toLowerCase();


                                        /* Escrow notification */
                                        if (
                                            notification.escrow_id ||
                                            notificationType.includes(
                                                "escrow"
                                            )
                                        ) {

                                            window.location.href =
                                                "balance.html";

                                            return;

                                        }


                                        /* Business notification */
                                        if (
                                            notification.business_id
                                        ) {

                                            window.location.href =
                                                "index.html#businesses";

                                            return;

                                        }


                                        /* Chat/message notification */
                                        if (
                                            notificationType.includes(
                                                "message"
                                            ) ||
                                            notificationType.includes(
                                                "chat"
                                            )
                                        ) {

                                            window.location.href =
                                                "chat.html";

                                            return;

                                        }


                                        /* No specific destination */
                                        console.log(
                                            "LosOja: No specific destination for notification:",
                                            notification
                                        );

                                    } catch (error) {

                                        console.error(
                                            "LosOja notification click error:",
                                            error
                                        );

                                        if (
                                            typeof window.showToast ===
                                            "function"
                                        ) {

                                            window.showToast(
                                                "Could not open this notification.",
                                                "error"
                                            );

                                        }

                                    }

                                }
                            );

                        }
                    );


                /* =================================================
                   MARK NOTIFICATION AS READ
                ================================================= */

                list
                    .querySelectorAll(
                        ".notification-read-btn"
                    )
                    .forEach(
                        button => {

                            button.addEventListener(
                                "click",
                                async event => {

                                    event.preventDefault();

                                    event.stopPropagation();

                                    const notificationId =
                                        button.getAttribute(
                                            "data-notification-id"
                                        );

                                    if (
                                        !notificationId
                                    ) {
                                        return;
                                    }

                                    try {

                                        const updateResponse =
                                            await fetch(
                                                SUPABASE_URL +
                                                "/rest/v1/notifications?id=eq." +
                                                encodeURIComponent(
                                                    notificationId
                                                ),
                                                {
                                                    method: "PATCH",

                                                    headers: {
                                                        apikey:
                                                            SUPABASE_KEY,

                                                        Authorization:
                                                            "Bearer " +
                                                            accessToken,

                                                        "Content-Type":
                                                            "application/json",

                                                        Prefer:
                                                            "return=minimal"
                                                    },

                                                    body:
                                                        JSON.stringify({
                                                            is_read: true
                                                        })
                                                }
                                            );


                                        if (
                                            !updateResponse.ok
                                        ) {

                                            let updateError =
                                                null;

                                            try {

                                                updateError =
                                                    await updateResponse.json();

                                            } catch (
                                                parseError
                                            ) {

                                                updateError =
                                                    null;

                                            }


                                            console.error(
                                                "LosOja: Could not mark notification as read:",
                                                updateError
                                            );


                                            throw new Error(
                                                updateError?.message ||
                                                "Could not mark notification as read"
                                            );

                                        }


                                        await this.openNotifications();

                                    } catch (
                                        error
                                    ) {

                                        console.error(
                                            "LosOja notifications read error:",
                                            error
                                        );

                                        if (
                                            typeof window.showToast ===
                                            "function"
                                        ) {

                                            window.showToast(
                                                "Could not mark notification as read.",
                                                "error"
                                            );

                                        }

                                    }

                                }
                            );

                        }
                    );


            } catch (error) {

                console.error(
                    "LosOja notifications error:",
                    error
                );


                list.innerHTML = `
                    <div class="notification-error">

                        <p>
                            Could not load notifications.
                        </p>

                    </div>
                `;


                if (
                    typeof window.showToast ===
                    "function"
                ) {

                    window.showToast(
                        "Could not load notifications: " +
                        (
                            error.message ||
                            "Unknown error"
                        ),
                        "error"
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


            button.type =
                "button";


            button.id =
                "losojaBackToTop";


            button.setAttribute(
                "aria-label",
                "Back to top"
            );


            button.textContent =
                "↑";


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

                        behavior:
                            "smooth"

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

        showToast(
            message,
            type = "info"
        ) {

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

    window.App =
        App;


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
        function (
            message,
            type
        ) {

            App.showToast(
                message,
                type
            );

        };


    window.showToast =
        function (
            message,
            type
        ) {

            App.showToast(
                message,
                type
            );

        };


    /* =====================================================
       NOTIFICATIONS GLOBAL BRIDGE
    ===================================================== */

    window.openNotifications =
        function () {

            App.prepareNotificationSound();

            return App.openNotifications();

        };


    /* =====================================================
       ACCOUNT GLOBAL BRIDGE
    ===================================================== */

    window.openAccount = async function () {

        try {

            /* Check if user is logged in */
            if (
                typeof window.getCurrentUser === "function"
            ) {

                const user =
                    await window.getCurrentUser();

                /* Logged in */
                if (user) {

                    window.location.href =
                        "balance.html";

                    return;

                }

            }

            /* Logged out */
            if (
                typeof window.openLogin === "function"
            ) {

                window.openLogin();

                return;

            }

            const loginModal =
                document.getElementById(
                    "loginModal"
                );

            if (loginModal) {

                App.openModal(
                    "loginModal"
                );

                return;

            }

            console.warn(
                "LosOja: loginModal is not available."
            );

        } catch (error) {

            console.error(
                "LosOja: Account button error:",
                error
            );

        }

    };

/* =====================================================
   BUSINESS DETAILS
===================================================== */

window.showBusinessDetails = async function (business) {

    if (!business) {
        console.warn("LosOja: No business supplied.");
        return;
    }

    const modal =
        document.getElementById("businessDetailsModal");

    const content =
        document.getElementById("businessDetailsContent");

    if (!modal || !content) {
        console.error(
            "LosOja: Business details modal/content not found."
        );
        return;
    }

    /* ---------------------------------------------------
       SUPABASE CONFIG
    --------------------------------------------------- */

    const BUSINESS_SUPABASE_URL =
        "https://ycxshwgeebskdozmornh.supabase.co";

    const BUSINESS_SUPABASE_KEY =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzg4MzA2NDY1LCJleHAiOjIxMDM4ODI0NjV9.tMl7wILdVDhu0RWFaG_84ngJEryLt2c5B8MEKW3kfU";

    /* ---------------------------------------------------
       SAFE HTML ESCAPE
    --------------------------------------------------- */

    const escapeHTML = function (value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    };

    /* ---------------------------------------------------
       ACCESS TOKEN
    --------------------------------------------------- */

    const getAccessToken = function () {

        try {

            if (
                typeof window.getSupabaseAccessToken ===
                "function"
            ) {

                const token =
                    window.getSupabaseAccessToken();

                return token || null;
            }

        } catch (error) {

            console.warn(
                "LosOja: Could not get access token.",
                error
            );
        }

        return null;
    };

    /* ---------------------------------------------------
       LOAD COMPLETE BUSINESS RECORD
    --------------------------------------------------- */

    if (business.id) {

        try {

            /*
             * Always make sure we have user_id.
             * This is important because Chat and Escrow
             * both need the business owner's ID.
             */

            if (!business.user_id) {

                const accessToken =
                    getAccessToken();

                const headers = {

                    apikey:
                        BUSINESS_SUPABASE_KEY,

                    Authorization:
                        "Bearer " +
                        (
                            accessToken ||
                            BUSINESS_SUPABASE_KEY
                        ),

                    "Content-Type":
                        "application/json"
                };

                const response =
                    await fetch(
                        BUSINESS_SUPABASE_URL +
                        "/rest/v1/businesses?id=eq." +
                        encodeURIComponent(
                            String(business.id)
                        ) +
                        "&select=*",
                        {
                            method: "GET",
                            headers: headers
                        }
                    );

                if (response.ok) {

                    const rows =
                        await response.json();

                    if (
                        Array.isArray(rows) &&
                        rows.length > 0
                    ) {

                        Object.assign(
                            business,
                            rows[0]
                        );
                    }
                }
            }

        } catch (error) {

            console.warn(
                "LosOja: Could not load complete business record.",
                error
            );
        }
    }

    /* ---------------------------------------------------
       SAVE SELECTED BUSINESS
    --------------------------------------------------- */

    window.losojaSelectedBusiness =
        business;

    /* ---------------------------------------------------
       BUSINESS VALUES
    --------------------------------------------------- */

    const businessName =
        escapeHTML(
            business.name ||
            "Business"
        );

    const businessCategory =
        escapeHTML(
            business.category ||
            "Not specified"
        );

    const businessLocation =
        escapeHTML(
            business.location ||
            "Not provided"
        );

    const businessPhone =
        escapeHTML(
            business.phone ||
            "Not provided"
        );

    const businessDescription =
        escapeHTML(
            business.description ||
            "No description provided."
        );

    const businessRating =
        business.rating !== undefined &&
        business.rating !== null &&
        business.rating !== ""
            ? escapeHTML(
                business.rating
            )
            : "No rating yet";

    const businessImage =
        business.image_url ||
        business.image ||
        "";

    /* ---------------------------------------------------
       BUSINESS DETAILS CONTENT
    --------------------------------------------------- */

       content.innerHTML = `

        ${
            businessImage
        ? `
            <div style="
                width:100%;
                margin-bottom:1rem;
            ">

                <img
                    src="${escapeHTML(businessImage)}"
                    alt="${businessName}"
                    style="
                        width:100%;
                        max-height:280px;
                        object-fit:cover;
                        border-radius:12px;
                        display:block;
                        cursor:pointer;
                    "
                    id="businessMainImage"
                >

                <button
                    type="button"
                    id="viewBusinessImageBtn"
                    class="btn btn-secondary"
                    style="
                        width:100%;
                        margin-top:.6rem;
                    "
                >
                    View Image Details
                </button>

            </div>
        `
        : `
            <div style="
                padding:1rem;
                background:#f3f4f6;
                border-radius:12px;
                text-align:center;
                margin-bottom:1rem;
            ">
                No business image available.
            </div>
        `
}

        <h2 style="
            margin:0 0 .75rem;
            font-size:1.5rem;
        ">
            ${businessName}
        </h2>

        <p style="margin:.4rem 0;">
            <strong>Category:</strong>
            ${businessCategory}
        </p>

        <p style="margin:.4rem 0;">
            <strong>Location:</strong>
            ${businessLocation}
        </p>

        <p style="margin:.4rem 0;">
            <strong>Phone:</strong>
            ${businessPhone}
        </p>

        <p style="margin:.4rem 0;">
            <strong>Rating:</strong>
            ${businessRating}
        </p>

        <div style="
            margin-top:1rem;
            padding-top:1rem;
            border-top:1px solid #e5e7eb;
        ">

            <strong>
                About this business
            </strong>

            <p style="
                margin:.5rem 0 0;
                line-height:1.6;
                color:#4b5563;
            ">
                ${businessDescription}
            </p>

        </div>

        <div style="
            display:flex;
            flex-wrap:wrap;
            gap:.75rem;
            margin-top:1.25rem;
        ">

            <button
                type="button"
                id="businessChatBtn"
                class="btn btn-primary">
                Chat with Business
            </button>

            <button
                type="button"
                id="businessEscrowBtn"
                class="btn btn-secondary">
                Create Escrow
            </button>

        </div>

        <div
            id="businessOwnerControls"
            style="
                display:none;
                margin-top:1.5rem;
                padding-top:1rem;
                border-top:1px solid #e5e7eb;
            "
        >

            <strong style="
                display:block;
                margin-bottom:.75rem;
            ">
                Business Owner Controls
            </strong>

            <div style="
                display:flex;
                flex-wrap:wrap;
                gap:.75rem;
            ">

                <button
                    type="button"
                    id="businessEditBtn"
                    class="btn btn-secondary">
                    Edit Business
                </button>

                <button
                    type="button"
                    id="businessDeleteBtn"
                    class="btn btn-secondary"
                    style="
                        border-color:#dc2626;
                        color:#dc2626;
                    ">
                    Delete Business
                </button>

            </div>

        </div>
    `;

    /* ---------------------------------------------------
       OPEN MODAL
    --------------------------------------------------- */

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

    /* ===================================================
       CHAT WITH BUSINESS
    =================================================== */

    const chatButton =
        document.getElementById(
            "businessChatBtn"
        );

    if (chatButton) {

        chatButton.onclick =
            async function (event) {

                event.preventDefault();
                event.stopPropagation();

                console.log(
                    "LosOja: Chat with Business clicked.",
                    business
                );

                try {

                    /* -------------------------------------
                       MAKE SURE OWNER ID EXISTS
                    ------------------------------------- */

                    if (!business.user_id) {

                        console.error(
                            "LosOja: Business owner ID missing.",
                            business
                        );

                        App.showToast(
                            "This business is not connected to an owner yet.",
                            "error"
                        );

                        return;
                    }

                    /* -------------------------------------
                       CHECK LOGIN
                    ------------------------------------- */

                    let currentUser = null;

                    if (
                        typeof window.getCurrentUser ===
                        "function"
                    ) {

                        try {

                            currentUser =
                                await window.getCurrentUser();

                        } catch (authError) {

                            console.warn(
                                "LosOja: Login check failed.",
                                authError
                            );
                        }
                    }

                    /* -------------------------------------
                       LOGIN REQUIRED
                    ------------------------------------- */

                    if (!currentUser) {

                        console.log(
                            "LosOja: User is not logged in."
                        );

                        if (
                            typeof window.openLogin ===
                            "function"
                        ) {

                            window.openLogin();

                        } else {

                            const loginModal =
                                document.getElementById(
                                    "loginModal"
                                );

                            if (loginModal) {

                                App.openModal(
                                    loginModal
                                );

                            } else {

                                App.showToast(
                                    "Please login before starting a chat.",
                                    "error"
                                );
                            }
                        }

                        return;
                    }

                    /* -------------------------------------
                       PREVENT OWNER SELF CHAT
                    ------------------------------------- */

                    if (
                        currentUser.id &&
                        String(currentUser.id) ===
                        String(business.user_id)
                    ) {

                        App.showToast(
                            "This is your business.",
                            "info"
                        );

                        return;
                    }

                    /* -------------------------------------
                       SAVE BUSINESS CHAT INFORMATION
                    ------------------------------------- */

                    const chatBusiness = {

                        business_id:
                            business.id || "",

                        business_name:
                            business.name || "",

                        business_owner_id:
                            business.user_id || "",

                        business_location:
                            business.location || "",

                        business_category:
                            business.category || ""

                    };

                    try {

                        sessionStorage.setItem(
                            "losoja_chat_business",
                            JSON.stringify(
                                chatBusiness
                            )
                        );

                    } catch (storageError) {

                        console.warn(
                            "LosOja: Could not save chat information.",
                            storageError
                        );
                    }

                    /* -------------------------------------
                       BUILD CHAT URL
                    ------------------------------------- */

                    const ownerId =
                        encodeURIComponent(
                            String(
                                business.user_id
                            )
                        );

                    let chatUrl =
                        "chat.html?user=" +
                        ownerId;

                    if (business.id) {

                        chatUrl +=
                            "&business=" +
                            encodeURIComponent(
                                String(
                                    business.id
                                )
                            );
                    }

                    console.log(
                        "LosOja: Navigating to business chat:",
                        chatUrl
                    );

                    /* -------------------------------------
                       CLOSE BUSINESS DETAILS
                    ------------------------------------- */

                    try {

                        App.closeModal(
                            modal
                        );

                    } catch (closeError) {

                        console.warn(
                            "LosOja: Could not close details modal.",
                            closeError
                        );
                    }

                    /* -------------------------------------
                       OPEN CHAT
                    ------------------------------------- */

                    window.location.href =
                        chatUrl;

                } catch (error) {

                    console.error(
                        "LosOja business chat error:",
                        error
                    );

                    App.showToast(
                        error?.message ||
                        "Could not open chat right now.",
                        "error"
                    );
                }
            };
    }

    /* ===================================================
       CREATE ESCROW
    =================================================== */

    const escrowButton =
        document.getElementById(
            "businessEscrowBtn"
        );

    if (escrowButton) {

        escrowButton.onclick =
            async function (event) {

                event.preventDefault();
                event.stopPropagation();

                try {

                    if (!business.user_id) {

                        App.showToast(
                            "This business does not have a registered owner yet.",
                            "error"
                        );

                        return;
                    }

                    if (
                        typeof window.getCurrentUser !==
                        "function"
                    ) {

                        App.showToast(
                            "Please login before creating escrow.",
                            "error"
                        );

                        return;
                    }

                    const currentUser =
                        await window.getCurrentUser();

                    if (!currentUser) {

                        if (
                            typeof window.openLogin ===
                            "function"
                        ) {

                            window.openLogin();

                        } else {

                            App.showToast(
                                "Please login before creating escrow.",
                                "error"
                            );
                        }

                        return;
                    }

                    if (
                        String(currentUser.id) ===
                        String(business.user_id)
                    ) {

                        App.showToast(
                            "You cannot create escrow with yourself.",
                            "error"
                        );

                        return;
                    }

                    sessionStorage.setItem(
                        "losoja_escrow_business",
                        JSON.stringify({

                            business_id:
                                business.id || "",

                            business_name:
                                business.name || "",

                            seller_id:
                                business.user_id || ""

                        })
                    );

                    App.closeModal(
                        modal
                    );

                    window.location.href =
                        "balance.html";

                } catch (error) {

                    console.error(
                        "LosOja business escrow error:",
                        error
                    );

                    App.showToast(
                        error?.message ||
                        "Could not open escrow right now.",
                        "error"
                    );
                }
            };
    }

    /* ===================================================
       OWNER CHECK
    =================================================== */

    const ownerControls =
        document.getElementById(
            "businessOwnerControls"
        );

    const editButton =
        document.getElementById(
            "businessEditBtn"
        );

    const deleteButton =
        document.getElementById(
            "businessDeleteBtn"
        );

    let currentBusinessOwner =
        false;

    try {

        if (
            business.user_id &&
            typeof window.getCurrentUser ===
            "function"
        ) {

            const currentUser =
                await window.getCurrentUser();

            if (
                currentUser &&
                String(currentUser.id) ===
                String(business.user_id)
            ) {

                currentBusinessOwner =
                    true;

                if (ownerControls) {

                    ownerControls.style.display =
                        "block";
                }
            }
        }

    } catch (ownerError) {

        console.warn(
            "LosOja: Owner check failed.",
            ownerError
        );
    }

    /* ===================================================
       EDIT BUSINESS
    =================================================== */

    if (editButton) {

        editButton.onclick =
            async function (event) {

                event.preventDefault();
                event.stopPropagation();

                try {

                    if (!currentBusinessOwner) {

                        App.showToast(
                            "Only the business owner can edit this business.",
                            "error"
                        );

                        return;
                    }

                    if (
                        typeof window.getCurrentUser !==
                        "function"
                    ) {

                        App.showToast(
                            "Please login again.",
                            "error"
                        );

                        return;
                    }

                    const currentUser =
                        await window.getCurrentUser();

                    if (
                        !currentUser ||
                        String(currentUser.id) !==
                        String(business.user_id)
                    ) {

                        App.showToast(
                            "Only the business owner can edit this business.",
                            "error"
                        );

                        return;
                    }

                    let editModal =
                        document.getElementById(
                            "editBusinessModal"
                        );

                    if (!editModal) {

                        editModal =
                            document.createElement(
                                "div"
                            );

                        editModal.id =
                            "editBusinessModal";

                        editModal.className =
                            "modal";

                        editModal.setAttribute(
                            "aria-hidden",
                            "true"
                        );

                        editModal.innerHTML = `

                            <div
                                class="modal-content"
                                style="
                                    max-width:600px;
                                    width:100%;
                                "
                            >

                                <div class="modal-header">

                                    <h2>
                                        Edit Business
                                    </h2>

                                    <button
                                        type="button"
                                        class="close-modal"
                                        aria-label="Close">
                                        ×
                                    </button>

                                </div>

                                <form
                                    id="editBusinessForm"
                                >

                                    <div class="form-group">

                                        <label>
                                            Business Name
                                        </label>

                                        <input
                                            type="text"
                                            id="editBusinessName"
                                            required
                                        >

                                    </div>

                                    <div class="form-group">

                                        <label>
                                            Category
                                        </label>

                                        <input
                                            type="text"
                                            id="editBusinessCategory"
                                            required
                                        >

                                    </div>

                                    <div class="form-group">

                                        <label>
                                            Location
                                        </label>

                                        <input
                                            type="text"
                                            id="editBusinessLocation"
                                            required
                                        >

                                    </div>

                                    <div class="form-group">

                                        <label>
                                            Phone
                                        </label>

                                        <input
                                            type="tel"
                                            id="editBusinessPhone"
                                        >

                                    </div>

                                    <div class="form-group">

                                        <label>
                                            Description
                                        </label>

                                        <textarea
                                            id="editBusinessDescription"
                                            rows="5"
                                        ></textarea>

                                    </div>

                                    <button
                                        type="submit"
                                        class="btn btn-primary"
                                        id="saveBusinessEditBtn">
                                        Save Changes
                                    </button>

                                </form>

                            </div>
                        `;

                        document.body.appendChild(
                            editModal
                        );

                        const editForm =
                            editModal.querySelector(
                                "#editBusinessForm"
                            );

                        if (editForm) {

                            editForm.addEventListener(
                                "submit",
                                async function (event) {

                                    event.preventDefault();

                                    const saveButton =
                                        document.getElementById(
                                            "saveBusinessEditBtn"
                                        );

                                    if (saveButton) {

                                        saveButton.disabled =
                                            true;

                                        saveButton.textContent =
                                            "Saving...";
                                    }

                                    try {

                                        const accessToken =
                                            getAccessToken();

                                        if (!accessToken) {

                                            throw new Error(
                                                "Your login session has expired. Please login again."
                                            );
                                        }

                                        const updatedBusiness = {

                                            name:
                                                document
                                                    .getElementById(
                                                        "editBusinessName"
                                                    )
                                                    .value
                                                    .trim(),

                                            category:
                                                document
                                                    .getElementById(
                                                        "editBusinessCategory"
                                                    )
                                                    .value
                                                    .trim(),

                                            location:
                                                document
                                                    .getElementById(
                                                        "editBusinessLocation"
                                                    )
                                                    .value
                                                    .trim(),

                                            phone:
                                                document
                                                    .getElementById(
                                                        "editBusinessPhone"
                                                    )
                                                    .value
                                                    .trim(),

                                            description:
                                                document
                                                    .getElementById(
                                                        "editBusinessDescription"
                                                    )
                                                    .value
                                                    .trim()
                                        };

                                        if (
                                            !updatedBusiness.name ||
                                            !updatedBusiness.category ||
                                            !updatedBusiness.location
                                        ) {

                                            throw new Error(
                                                "Business name, category and location are required."
                                            );
                                        }

                                        const response =
                                            await fetch(
                                                BUSINESS_SUPABASE_URL +
                                                "/rest/v1/businesses?id=eq." +
                                                encodeURIComponent(
                                                    String(
                                                        business.id
                                                    )
                                                ) +
                                                "&user_id=eq." +
                                                encodeURIComponent(
                                                    String(
                                                        currentUser.id
                                                    )
                                                ),
                                                {
                                                    method:
                                                        "PATCH",

                                                    headers: {

                                                        apikey:
                                                            BUSINESS_SUPABASE_KEY,

                                                        Authorization:
                                                            "Bearer " +
                                                            accessToken,

                                                        "Content-Type":
                                                            "application/json",

                                                        Prefer:
                                                            "return=representation"
                                                    },

                                                    body:
                                                        JSON.stringify(
                                                            updatedBusiness
                                                        )
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

                                            throw new Error(
                                                result?.message ||
                                                result?.hint ||
                                                result?.details ||
                                                "Could not update this business."
                                            );
                                        }

                                        if (
                                            !Array.isArray(result) ||
                                            result.length === 0
                                        ) {

                                            throw new Error(
                                                "The business was not updated. Please check your account permissions."
                                            );
                                        }

                                        Object.assign(
                                            business,
                                            result[0]
                                        );

                                        App.closeModal(
                                            editModal
                                        );

                                        App.showToast(
                                            "Business updated successfully.",
                                            "success"
                                        );

                                        if (
                                            typeof window.loadBusinesses ===
                                            "function"
                                        ) {

                                            await window.loadBusinesses(
                                                true
                                            );
                                        }

                                        await window.showBusinessDetails(
                                            business
                                        );

                                    } catch (error) {

                                        console.error(
                                            "LosOja edit business error:",
                                            error
                                        );

                                        App.showToast(
                                            error?.message ||
                                            "Could not update the business.",
                                            "error"
                                        );

                                    } finally {

                                        if (saveButton) {

                                            saveButton.disabled =
                                                false;

                                            saveButton.textContent =
                                                "Save Changes";
                                        }
                                    }
                                }
                            );
                        }
                    }

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

                    const descriptionInput =
                        document.getElementById(
                            "editBusinessDescription"
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

                    if (descriptionInput) {
                        descriptionInput.value =
                            business.description || "";
                    }

                    App.openModal(
                        editModal
                    );

                } catch (error) {

                    console.error(
                        "LosOja edit business error:",
                        error
                    );

                    App.showToast(
                        error?.message ||
                        "Could not open business editor.",
                        "error"
                    );
                }
            };
    }

    /* ===================================================
       DELETE BUSINESS
    =================================================== */

    if (deleteButton) {

        deleteButton.onclick =
            async function (event) {

                event.preventDefault();
                event.stopPropagation();

                try {

                    if (!currentBusinessOwner) {

                        App.showToast(
                            "Only the business owner can delete this business.",
                            "error"
                        );

                        return;
                    }

                    if (!business.id) {

                        App.showToast(
                            "This business ID is missing.",
                            "error"
                        );

                        return;
                    }

                    if (
                        typeof window.getCurrentUser !==
                        "function"
                    ) {

                        App.showToast(
                            "Please login again.",
                            "error"
                        );

                        return;
                    }

                    const currentUser =
                        await window.getCurrentUser();

                    if (
                        !currentUser ||
                        String(currentUser.id) !==
                        String(business.user_id)
                    ) {

                        App.showToast(
                            "Only the business owner can delete this business.",
                            "error"
                        );

                        return;
                    }

                    const confirmed =
                        window.confirm(
                            "Delete " +
                            (
                                business.name ||
                                "this business"
                            ) +
                            " permanently?"
                        );

                    if (!confirmed) {
                        return;
                    }

                    const accessToken =
                        getAccessToken();

                    if (!accessToken) {

                        throw new Error(
                            "Your login session has expired. Please login again."
                        );
                    }

                    deleteButton.disabled =
                        true;

                    deleteButton.textContent =
                        "Deleting...";

                    const response =
                        await fetch(
                            BUSINESS_SUPABASE_URL +
                            "/rest/v1/businesses?id=eq." +
                            encodeURIComponent(
                                String(
                                    business.id
                                )
                            ) +
                            "&user_id=eq." +
                            encodeURIComponent(
                                String(
                                    currentUser.id
                                )
                            ),
                            {
                                method:
                                    "DELETE",

                                headers: {

                                    apikey:
                                        BUSINESS_SUPABASE_KEY,

                                    Authorization:
                                        "Bearer " +
                                        accessToken,

                                    "Content-Type":
                                        "application/json",

                                    Prefer:
                                        "return=representation"
                                }
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

                        throw new Error(
                            result?.message ||
                            result?.hint ||
                            result?.details ||
                            "Could not delete this business."
                        );
                    }

                    if (
                        Array.isArray(result) &&
                        result.length === 0
                    ) {

                        throw new Error(
                            "The business was not deleted. Please check your account permissions."
                        );
                    }

                    App.closeModal(
                        modal
                    );

                    window.losojaSelectedBusiness =
                        null;

                    if (
                        Array.isArray(
                            window.losojaBusinesses
                        )
                    ) {

                        window.losojaBusinesses =
                            window.losojaBusinesses.filter(
                                item =>
                                    String(
                                        item.id
                                    ) !==
                                    String(
                                        business.id
                                    )
                            );
                    }

                    if (
                        typeof window.loadBusinesses ===
                        "function"
                    ) {

                        await window.loadBusinesses(
                            true
                        );

                    } else if (
                        typeof window.renderBusinesses ===
                        "function"
                    ) {

                        window.renderBusinesses(
                            window.losojaBusinesses
                        );
                    }

                    App.showToast(
                        "Business deleted successfully.",
                        "success"
                    );

                } catch (error) {

                    console.error(
                        "LosOja delete business error:",
                        error
                    );

                    App.showToast(
                        error?.message ||
                        "Could not delete this business.",
                        "error"
                    );

                } finally {

                    if (deleteButton) {

                        deleteButton.disabled =
                            false;

                        deleteButton.textContent =
                            "Delete Business";
                    }
                }
            };
    }

};
