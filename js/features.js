/*
=========================================================
LosOja - Extended Features
js/features.js

Handles:
- Property listings
- Ride providers
- Ride requests
- My Ride Requests
- Feedback
- Supabase integration
- Feature modals
=========================================================
*/

(function () {

    "use strict";


    /* =====================================================
       SUPABASE CONFIGURATION
    ===================================================== */

    const LOSOJA_FEATURES_URL =
        "https://ycxshwgeebskdozmornh.supabase.co";

    const LOSOJA_FEATURES_KEY =
        "sb_publishable_jFSLacwNupO6T8EnSqb2bw_bZmy7rVe";

    const SESSION_KEY =
        "losoja_supabase_session";


    /* =====================================================
       STATE
    ===================================================== */

    let properties = [];

    let rideProviders = [];

    let rideRequests = [];

    let propertyLoading = false;

    let rideProviderLoading = false;

    let rideRequestLoading = false;


    /* =====================================================
       SESSION HELPERS
    ===================================================== */

    function getSession() {

        try {

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
            session.token ||
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


        return (
            session.user_id ||
            session.userId ||
            session.id ||
            null
        );
    }


    function isLoggedIn() {

        return !!getCurrentUserId();

    }


    /* =====================================================
       SUPABASE HEADERS
    ===================================================== */

    function supabaseHeaders(
        includeContentType = false
    ) {

        const token =
            getAccessToken();


        const headers = {

            "apikey":
                LOSOJA_FEATURES_KEY,

            "Authorization":
                "Bearer " +
                (
                    token ||
                    LOSOJA_FEATURES_KEY
                )

        };


        if (includeContentType) {

            headers["Content-Type"] =
                "application/json";

        }


        return headers;
    }


    /* =====================================================
       SUPABASE REQUEST
    ===================================================== */

    async function supabaseRequest(
        endpoint,
        options = {}
    ) {

        const response =
            await fetch(
                LOSOJA_FEATURES_URL +
                endpoint,
                {
                    ...options,

                    headers: {

                        ...supabaseHeaders(
                            options.body !== undefined
                        ),

                        ...(options.headers || {})

                    }

                }
            );


        const text =
            await response.text();


        let data = null;


        if (text) {

            try {

                data =
                    JSON.parse(text);

            } catch {

                data =
                    text;

            }

        }


        if (!response.ok) {

            let message =
                "Supabase request failed.";


            if (
                data &&
                typeof data === "object"
            ) {

                message =
                    data.message ||
                    data.error_description ||
                    data.hint ||
                    data.details ||
                    message;

            }


            throw new Error(
                message
            );

        }


        return data;
    }


    /* =====================================================
       MESSAGE / TOAST
    ===================================================== */

    function showMessage(
        message,
        type = "success"
    ) {

        if (
            window.LosOjaApp &&
            typeof window.LosOjaApp.showToast ===
                "function"
        ) {

            window.LosOjaApp.showToast(
                message,
                type
            );

            return;
        }


        let toast =
            document.getElementById(
                "losojaFeatureToast"
            );


        if (!toast) {

            toast =
                document.createElement(
                    "div"
                );


            toast.id =
                "losojaFeatureToast";


            toast.style.position =
                "fixed";


            toast.style.left =
                "50%";


            toast.style.bottom =
                "25px";


            toast.style.transform =
                "translateX(-50%)";


            toast.style.zIndex =
                "99999";


            toast.style.padding =
                "13px 18px";


            toast.style.borderRadius =
                "8px";


            toast.style.background =
                "#111827";


            toast.style.color =
                "#ffffff";


            toast.style.fontSize =
                "14px";


            toast.style.maxWidth =
                "90%";


            toast.style.textAlign =
                "center";


            document.body.appendChild(
                toast
            );

        }


        toast.textContent =
            message;


        toast.style.background =
            type === "error"
                ? "#c62828"
                : "#087a3e";


        clearTimeout(
            toast._timer
        );


        toast._timer =
            setTimeout(
                function () {

                    toast.remove();

                },
                3500
            );
    }


    /* =====================================================
       LOGIN REQUIREMENT
    ===================================================== */

    function requireLogin() {

        if (isLoggedIn()) {
            return true;
        }


        showMessage(
            "Please log in to continue.",
            "error"
        );


        const loginButton =
            document.querySelector(
                "#loginBtn, #mobileLoginBtn, .login-btn"
            );


        if (loginButton) {

            loginButton.click();

        } else {

            const loginModal =
                document.getElementById(
                    "loginModal"
                );


            if (loginModal) {

                loginModal.classList.remove(
                    "hidden"
                );

            }

        }


        return false;
    }


    /* =====================================================
       HTML HELPERS
    ===================================================== */

    function escapeHtml(value) {

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


    function formatDate(value) {

        if (!value) {
            return "";
        }


        try {

            return new Date(value)
                .toLocaleDateString(
                    undefined,
                    {
                        year: "numeric",
                        month: "short",
                        day: "numeric"
                    }
                );

        } catch {

            return "";

        }
    }


    function formatDateTime(value) {

        if (!value) {
            return "";
        }


        try {

            return new Date(value)
                .toLocaleString(
                    undefined,
                    {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit"
                    }
                );

        } catch {

            return "";

        }
    }


    /* =====================================================
       MODAL HELPERS
    ===================================================== */

    function createModal(
        id,
        title,
        content
    ) {

        const existing =
            document.getElementById(
                id
            );


        if (existing) {
            existing.remove();
        }


        const overlay =
            document.createElement(
                "div"
            );


        overlay.id =
            id;


        overlay.className =
            "modal-overlay";


        overlay.innerHTML = `

            <div class="modal-content feature-modal-content">

                <button
                    type="button"
                    class="modal-close"
                    data-feature-close="${escapeHtml(id)}"
                    aria-label="Close"
                >
                    ×
                </button>

                <h2>${escapeHtml(title)}</h2>

                ${content}

            </div>

        `;


        document.body.appendChild(
            overlay
        );


        const closeButton =
            overlay.querySelector(
                "[data-feature-close]"
            );


        if (closeButton) {

            closeButton.addEventListener(
                "click",
                function () {

                    closeModal(id);

                }
            );

        }


        overlay.addEventListener(
            "click",
            function (event) {

                if (
                    event.target === overlay
                ) {

                    closeModal(id);

                }

            }
        );


        return overlay;
    }


    function closeModal(id) {

        const modal =
            document.getElementById(
                id
            );


        if (modal) {

            modal.remove();

        }
    }


    /* =====================================================
       PROPERTY LISTINGS
    ===================================================== */

    async function loadProperties() {

        if (propertyLoading) {
            return;
        }


        propertyLoading = true;


        try {

            const data =
                await supabaseRequest(
                    "/rest/v1/property_listings" +
                    "?select=*" +
                    "&order=created_at.desc"
                );


            properties =
                Array.isArray(data)
                    ? data
                    : [];


            renderProperties();

        } catch (error) {

            console.error(
                "LosOja property loading error:",
                error
            );


            properties = [];


            renderProperties();


            showMessage(
                "Unable to load property listings.",
                "error"
            );

        } finally {

            propertyLoading =
                false;

        }
    }


    function renderProperties() {

        const grid =
            document.getElementById(
                "propertyGrid"
            );


        const empty =
            document.getElementById(
                "propertyEmpty"
            );


        if (!grid) {
            return;
        }


        if (!properties.length) {

            grid.innerHTML =
                "";


            if (empty) {

                empty.classList.remove(
                    "hidden"
                );

            }


            return;
        }


        if (empty) {

            empty.classList.add(
                "hidden"
            );

        }


        grid.innerHTML =
            properties
                .map(
                    propertyCardHTML
                )
                .join("");
    }


    function propertyCardHTML(
        property
    ) {

        const image =
            property.image_url

                ? `

                    <div class="property-card-image">

                        <img
                            src="${escapeHtml(
                                property.image_url
                            )}"
                            alt="${escapeHtml(
                                property.title
                            )}"
                            loading="lazy"
                        >

                    </div>

                `

                : `

                    <div class="property-card-image">
                        🏠
                    </div>

                `;


        return `

            <article class="property-card">

                ${image}

                <div class="property-card-body">

                    <span class="property-type">
                        ${escapeHtml(
                            property.property_type
                        )}
                    </span>

                    <h3>
                        ${escapeHtml(
                            property.title
                        )}
                    </h3>

                    <p class="property-location">
                        📍 ${escapeHtml(
                            property.location
                        )}
                    </p>

                    ${
                        property.listing_type
                            ? `

                                <p class="feature-meta">

                                    ${escapeHtml(
                                        property.listing_type
                                    )}

                                </p>

                            `
                            : ""
                    }

                    ${
                        property.price
                            ? `

                                <p class="property-price">

                                    ${escapeHtml(
                                        property.price
                                    )}

                                </p>

                            `
                            : ""
                    }

                    ${
                        property.description
                            ? `

                                <p class="property-description">

                                    ${escapeHtml(
                                        property.description
                                    )}

                                </p>

                            `
                            : ""
                    }

                    ${
                        property.phone
                            ? `

                                <p class="feature-meta">

                                    📞 ${escapeHtml(
                                        property.phone
                                    )}

                                </p>

                            `
                            : ""
                    }

                    <p class="feature-meta">

                        Listed
                        ${escapeHtml(
                            formatDate(
                                property.created_at
                            )
                        )}

                    </p>

                </div>

            </article>

        `;
    }


    function openPropertyModal() {

        if (!requireLogin()) {
            return;
        }


        const modal =
            createModal(
                "propertyFeatureModal",

                "List a Property",

                `

                <p>
                    Add a house, apartment, land or
                    commercial property to LosOja.
                </p>

                <form
                    id="propertyFeatureForm"
                    class="feature-form"
                >

                    <div class="form-group">

                        <label for="propertyTitle">
                            Property Title
                        </label>

                        <input
                            type="text"
                            id="propertyTitle"
                            required
                            placeholder="e.g. 3 Bedroom Apartment"
                        >

                    </div>


                    <div class="form-row">

                        <div class="form-group">

                            <label for="propertyType">
                                Property Type
                            </label>

                            <select
                                id="propertyType"
                                required
                            >

                                <option value="">
                                    Select type
                                </option>

                                <option value="House">
                                    House
                                </option>

                                <option value="Apartment">
                                    Apartment
                                </option>

                                <option value="Land">
                                    Land
                                </option>

                                <option value="Office">
                                    Office
                                </option>

                                <option value="Shop">
                                    Shop
                                </option>

                                <option value="Commercial">
                                    Commercial Property
                                </option>

                                <option value="Other">
                                    Other
                                </option>

                            </select>

                        </div>


                        <div class="form-group">

                            <label for="propertyListingType">
                                Listing Type
                            </label>

                            <select
                                id="propertyListingType"
                                required
                            >

                                <option value="">
                                    Select listing type
                                </option>

                                <option value="For Sale">
                                    For Sale
                                </option>

                                <option value="For Rent">
                                    For Rent
                                </option>

                                <option value="For Lease">
                                    For Lease
                                </option>

                                <option value="Short Stay">
                                    Short Stay
                                </option>

                            </select>

                        </div>

                    </div>


                    <div class="form-group">

                        <label for="propertyLocation">
                            Location
                        </label>

                        <input
                            type="text"
                            id="propertyLocation"
                            required
                            placeholder="City, area or address"
                        >

                    </div>


                    <div class="form-group">

                        <label for="propertyPrice">
                            Price
                        </label>

                        <input
                            type="text"
                            id="propertyPrice"
                            placeholder="e.g. ₦2,500,000"
                        >

                    </div>


                    <div class="form-group">

                        <label for="propertyPhone">
                            Contact Phone
                        </label>

                        <input
                            type="tel"
                            id="propertyPhone"
                            placeholder="Phone number"
                        >

                    </div>


                    <div class="form-group">

                        <label for="propertyDescription">
                            Description
                        </label>

                        <textarea
                            id="propertyDescription"
                            placeholder="Describe the property"
                        ></textarea>

                    </div>


                    <button
                        type="submit"
                        class="btn btn-primary btn-block"
                    >
                        Publish Property
                    </button>

                </form>

                `
            );


        const form =
            modal.querySelector(
                "#propertyFeatureForm"
            );


        if (form) {

            form.addEventListener(
                "submit",
                handlePropertySubmit
            );

        }
    }


    async function handlePropertySubmit(
        event
    ) {

        event.preventDefault();


        const userId =
            getCurrentUserId();


        if (!userId) {

            showMessage(
                "Please log in first.",
                "error"
            );

            return;
        }


        const submitButton =
            event.target.querySelector(
                'button[type="submit"]'
            );


        submitButton.disabled =
            true;


        submitButton.textContent =
            "Publishing...";


        const payload = {

            user_id:
                userId,

            title:
                document.getElementById(
                    "propertyTitle"
                ).value.trim(),

            property_type:
                document.getElementById(
                    "propertyType"
                ).value,

            listing_type:
                document.getElementById(
                    "propertyListingType"
                ).value,

            location:
                document.getElementById(
                    "propertyLocation"
                ).value.trim(),

            price:
                document.getElementById(
                    "propertyPrice"
                ).value.trim() ||
                null,

            description:
                document.getElementById(
                    "propertyDescription"
                ).value.trim() ||
                null,

            phone:
                document.getElementById(
                    "propertyPhone"
                ).value.trim() ||
                null,

            image_url:
                null
        };


        try {

            await supabaseRequest(
                "/rest/v1/property_listings",

                {
                    method: "POST",

                    headers: {
                        "Prefer":
                            "return=representation"
                    },

                    body:
                        JSON.stringify(
                            payload
                        )
                }
            );


            showMessage(
                "Property listed successfully!"
            );


            closeModal(
                "propertyFeatureModal"
            );


            await loadProperties();

        } catch (error) {

            console.error(
                "LosOja property save error:",
                error
            );


            showMessage(
                "Could not save property: " +
                error.message,
                "error"
            );


            submitButton.disabled =
                false;


            submitButton.textContent =
                "Publish Property";
        }
    }


    /* =====================================================
       RIDE PROVIDERS
    ===================================================== */

    async function loadRideProviders() {

        if (rideProviderLoading) {
            return;
        }


        rideProviderLoading =
            true;


        try {

            const data =
                await supabaseRequest(
                    "/rest/v1/ride_providers" +
                    "?select=*" +
                    "&order=created_at.desc"
                );


            rideProviders =
                Array.isArray(data)
                    ? data
                    : [];


            renderRideProviders();

        } catch (error) {

            console.error(
                "LosOja ride provider loading error:",
                error
            );


            rideProviders = [];


            renderRideProviders();


            showMessage(
                "Unable to load ride providers.",
                "error"
            );

        } finally {

            rideProviderLoading =
                false;

        }
    }


    function renderRideProviders() {

        const grid =
            document.getElementById(
                "rideProviderGrid"
            );


        const empty =
            document.getElementById(
                "rideProviderEmpty"
            );


        if (!grid) {
            return;
        }


        if (!rideProviders.length) {

            grid.innerHTML =
                "";


            if (empty) {

                empty.classList.remove(
                    "hidden"
                );

            }


            return;
        }


        if (empty) {

            empty.classList.add(
                "hidden"
            );

        }


        grid.innerHTML =
            rideProviders
                .map(
                    rideProviderCardHTML
                )
                .join("");
    }


    function rideProviderCardHTML(
        provider
    ) {

        let icon =
            "🚗";


        if (
            provider.ride_type ===
            "Bike"
        ) {

            icon =
                "🏍️";

        } else if (
            provider.ride_type ===
            "Cab"
        ) {

            icon =
                "🚕";

        } else if (
            provider.ride_type ===
            "Truck"
        ) {

            icon =
                "🚚";

        } else if (
            provider.ride_type ===
            "TryCircle"
        ) {

            icon =
                "🛺";

        }


        return `

            <article class="ride-provider-card">

                <div class="feature-icon">
                    ${icon}
                </div>

                <h3>
                    ${escapeHtml(
                        provider.provider_name
                    )}
                </h3>

                <span class="ride-provider-type">

                    ${escapeHtml(
                        provider.ride_type
                    )}

                </span>

                <p>

                    📍 ${escapeHtml(
                        provider.operating_location
                    )}

                </p>

                ${
                    provider.vehicle_info
                        ? `

                            <p>

                                🚘 ${escapeHtml(
                                    provider.vehicle_info
                                )}

                            </p>

                        `
                        : ""
                }

                ${
                    provider.description
                        ? `

                            <p>

                                ${escapeHtml(
                                    provider.description
                                )}

                            </p>

                        `
                        : ""
                }

                <p class="ride-provider-phone">

                    📞 ${escapeHtml(
                        provider.phone
                    )}

                </p>

                <p class="feature-meta">

                    Registered
                    ${escapeHtml(
                        formatDate(
                            provider.created_at
                        )
                    )}

                </p>

            </article>

        `;
    }


    function openRideProviderModal() {

        if (!requireLogin()) {
            return;
        }


        const modal =
            createModal(
                "rideProviderFeatureModal",

                "Register as a Ride Provider",

                `

                <p>
                    Offer transportation services
                    through LosOja.
                </p>

                <form
                    id="rideProviderFeatureForm"
                    class="feature-form"
                >

                    <div class="form-group">

                        <label for="providerName">
                            Provider Name
                        </label>

                        <input
                            type="text"
                            id="providerName"
                            required
                            placeholder="Your name or business name"
                        >

                    </div>


                    <div class="form-group">

                        <label for="providerRideType">
                            Ride Type
                        </label>

                        <select
                            id="providerRideType"
                            required
                        >

                            <option value="">
                                Select ride type
                            </option>

                            <option value="TryCircle">
                                TryCircle
                            </option>

                            <option value="Bike">
                                Bike
                            </option>

                            <option value="Cab">
                                Cab
                            </option>

                            <option value="Truck">
                                Truck
                            </option>

                        </select>

                    </div>


                    <div class="form-group">

                        <label for="providerPhone">
                            Phone
                        </label>

                        <input
                            type="tel"
                            id="providerPhone"
                            required
                            placeholder="Phone number"
                        >

                    </div>


                    <div class="form-group">

                        <label for="providerVehicle">
                            Vehicle Information
                        </label>

                        <input
                            type="text"
                            id="providerVehicle"
                            placeholder="e.g. Toyota Corolla, Blue"
                        >

                    </div>


                    <div class="form-group">

                        <label for="providerLocation">
                            Operating Location
                        </label>

                        <input
                            type="text"
                            id="providerLocation"
                            required
                            placeholder="City or area"
                        >

                    </div>


                    <div class="form-group">

                        <label for="providerDescription">
                            Description
                        </label>

                        <textarea
                            id="providerDescription"
                            placeholder="Describe your transportation service"
                        ></textarea>

                    </div>


                    <button
                        type="submit"
                        class="btn btn-primary btn-block"
                    >
                        Register Provider
                    </button>

                </form>

                `
            );


        const form =
            modal.querySelector(
                "#rideProviderFeatureForm"
            );


        if (form) {

            form.addEventListener(
                "submit",
                handleRideProviderSubmit
            );

        }
    }


    async function handleRideProviderSubmit(
        event
    ) {

        event.preventDefault();


        const userId =
            getCurrentUserId();


        if (!userId) {

            showMessage(
                "Please log in first.",
                "error"
            );

            return;
        }


        const submitButton =
            event.target.querySelector(
                'button[type="submit"]'
            );


        submitButton.disabled =
            true;


        submitButton.textContent =
            "Saving...";


        const payload = {

            user_id:
                userId,

            provider_name:
                document.getElementById(
                    "providerName"
                ).value.trim(),

            ride_type:
                document.getElementById(
                    "providerRideType"
                ).value,

            phone:
                document.getElementById(
                    "providerPhone"
                ).value.trim(),

            vehicle_info:
                document.getElementById(
                    "providerVehicle"
                ).value.trim() ||
                null,

            operating_location:
                document.getElementById(
                    "providerLocation"
                ).value.trim(),

            description:
                document.getElementById(
                    "providerDescription"
                ).value.trim() ||
                null,

            vehicle_image_url:
                null
        };


        try {

            await supabaseRequest(
                "/rest/v1/ride_providers",

                {
                    method: "POST",

                    headers: {
                        "Prefer":
                            "return=representation"
                    },

                    body:
                        JSON.stringify(
                            payload
                        )
                }
            );


            showMessage(
                "Ride provider registered successfully!"
            );


            closeModal(
                "rideProviderFeatureModal"
            );


            await loadRideProviders();

        } catch (error) {

            console.error(
                "LosOja ride provider save error:",
                error
            );


            showMessage(
                "Could not register provider: " +
                error.message,
                "error"
            );


            submitButton.disabled =
                false;


            submitButton.textContent =
                "Register Provider";
        }
    }


    /* =====================================================
       RIDE REQUEST HELPERS
    ===================================================== */

    function getMobilityName(type) {

        const names = {

            trycircle:
                "TryCircle",

            bike:
                "Bike",

            cab:
                "Cab",

            truck:
                "Rent a Truck"

        };


        return (
            names[type] ||
            "Transportation"
        );
    }


    function getRideStatusClass(
        status
    ) {

        const value =
            String(
                status ||
                "pending"
            ).toLowerCase();


        if (
            value === "completed"
        ) {

            return "completed";

        }


        if (
            value === "cancelled" ||
            value === "canceled"
        ) {

            return "cancelled";

        }


        if (
            value === "accepted" ||
            value === "confirmed"
        ) {

            return "accepted";

        }


        return "pending";
    }


    function getRideStatusLabel(
        status
    ) {

        const value =
            String(
                status ||
                "pending"
            ).toLowerCase();


        if (
            value === "completed"
        ) {

            return "Completed";

        }


        if (
            value === "cancelled" ||
            value === "canceled"
        ) {

            return "Cancelled";

        }


        if (
            value === "accepted"
        ) {

            return "Accepted";

        }


        if (
            value === "confirmed"
        ) {

            return "Confirmed";

        }


        return "Pending";
    }


    /* =====================================================
       LOAD MY RIDE REQUESTS
    ===================================================== */

    async function loadRideRequests() {

        const userId =
            getCurrentUserId();


        if (!userId) {

            rideRequests = [];

            renderRideRequests();

            return;

        }


        if (rideRequestLoading) {
            return;
        }


        rideRequestLoading =
            true;


        try {

            const data =
                await supabaseRequest(

                    "/rest/v1/ride_requests" +

                    "?select=*" +

                    "&user_id=eq." +
                    encodeURIComponent(
                        userId
                    ) +

                    "&order=created_at.desc"

                );


            rideRequests =
                Array.isArray(data)
                    ? data
                    : [];


            renderRideRequests();

        } catch (error) {

            console.error(
                "LosOja ride request loading error:",
                error
            );


            rideRequests = [];


            renderRideRequests();


            showMessage(
                "Unable to load your ride requests.",
                "error"
            );

        } finally {

            rideRequestLoading =
                false;

        }
    }


    /* =====================================================
       RIDE REQUEST SECTION
    ===================================================== */

    function ensureRideRequestsSection() {

        let section =
            document.getElementById(
                "myRideRequests"
            );


        if (section) {
            return section;
        }


        const mobilitySection =
            document.getElementById(
                "mobility"
            );


        if (!mobilitySection) {
            return null;
        }


        section =
            document.createElement(
                "section"
            );


        section.id =
            "myRideRequests";


        section.className =
            "feature-section";


        section.innerHTML = `

            <div class="container">

                <div class="section-header">

                    <h2>
                        My Ride Requests
                    </h2>

                    <p>
                        View the transportation requests
                        you have submitted.
                    </p>

                </div>


                <div
                    id="myRideRequestsGrid"
                    class="feature-grid"
                ></div>


                <div
                    id="myRideRequestsEmpty"
                    class="no-results hidden"
                >
                    You have not submitted any ride
                    requests yet.
                </div>

            </div>

        `;


        mobilitySection.parentNode.insertBefore(
            section,
            mobilitySection.nextSibling
        );


        return section;
    }


    function renderRideRequests() {

        const section =
            ensureRideRequestsSection();


        if (!section) {
            return;
        }


        const grid =
            document.getElementById(
                "myRideRequestsGrid"
            );


        const empty =
            document.getElementById(
                "myRideRequestsEmpty"
            );


        if (!grid) {
            return;
        }


        if (!rideRequests.length) {

            grid.innerHTML =
                "";


            if (empty) {

                empty.classList.remove(
                    "hidden"
                );

            }


            return;
        }


        if (empty) {

            empty.classList.add(
                "hidden"
            );

        }


        grid.innerHTML =
            rideRequests
                .map(
                    rideRequestCardHTML
                )
                .join("");
    }


    function rideRequestCardHTML(
        request
    ) {

        const type =
            getMobilityName(
                request.ride_type
            );


        const status =
            getRideStatusLabel(
                request.status
            );


        const statusClass =
            getRideStatusClass(
                request.status
            );


        return `

            <article
                class="feature-card ride-request-card"
            >

                <div class="feature-icon">
                    ${
                        request.ride_type ===
                        "cab"
                            ? "🚕"
                            : request.ride_type ===
                              "bike"
                                ? "🏍️"
                                : request.ride_type ===
                                  "truck"
                                    ? "🚚"
                                    : request.ride_type ===
                                      "trycircle"
                                        ? "🛺"
                                        : "🚗"
                    }
                </div>


                <h3>
                    ${escapeHtml(type)}
                </h3>


                <p>
                    <strong>Status:</strong>

                    <span
                        class="ride-request-status ride-status-${escapeHtml(
                            statusClass
                        )}"
                    >
                        ${escapeHtml(status)}
                    </span>
                </p>


                <p>
                    📍
                    <strong>Pickup:</strong>
                    ${escapeHtml(
                        request.pickup
                    )}
                </p>


                <p>
                    🎯
                    <strong>Destination:</strong>
                    ${escapeHtml(
                        request.destination
                    )}
                </p>


                <p>
                    📞
                    <strong>Phone:</strong>
                    ${escapeHtml(
                        request.phone
                    )}
                </p>


                ${
                    request.note
                        ? `

                            <p>
                                📝
                                <strong>Note:</strong>
                                ${escapeHtml(
                                    request.note
                                )}
                            </p>

                        `
                        : ""
                }


                <p class="feature-meta">

                    Submitted
                    ${escapeHtml(
                        formatDateTime(
                            request.created_at
                        )
                    )}

                </p>

            </article>

        `;
    }


    /* =====================================================
       OPEN RIDE REQUEST MODAL
    ===================================================== */

    function openRideRequestModal(
        type
    ) {

        if (!requireLogin()) {
            return;
        }


        const rideName =
            getMobilityName(
                type
            );


        const modal =
            createModal(

                "rideRequestFeatureModal",

                "Request " +
                rideName,

                `

                <p>
                    Enter your trip details and submit
                    your transportation request.
                </p>


                <form
                    id="rideRequestFeatureForm"
                    class="feature-form"
                >

                    <input
                        type="hidden"
                        id="featureRideType"
                        value="${escapeHtml(
                            type
                        )}"
                    >


                    <div class="form-group">

                        <label
                            for="featureRidePickup"
                        >
                            Pickup Location
                        </label>

                        <input
                            type="text"
                            id="featureRidePickup"
                            required
                            placeholder="Where should you be picked up?"
                        >

                    </div>


                    <div class="form-group">

                        <label
                            for="featureRideDestination"
                        >
                            Destination
                        </label>

                        <input
                            type="text"
                            id="featureRideDestination"
                            required
                            placeholder="Where are you going?"
                        >

                    </div>


                    <div class="form-group">

                        <label
                            for="featureRidePhone"
                        >
                            Phone
                        </label>

                        <input
                            type="tel"
                            id="featureRidePhone"
                            required
                            placeholder="Phone number"
                        >

                    </div>


                    <div class="form-group">

                        <label
                            for="featureRideNote"
                        >
                            Note
                        </label>

                        <textarea
                            id="featureRideNote"
                            placeholder="Optional information for the driver"
                        ></textarea>

                    </div>


                    <button
                        type="submit"
                        class="btn btn-primary btn-block"
                    >
                        Submit Ride Request
                    </button>

                </form>

                `
            );


        const form =
            modal.querySelector(
                "#rideRequestFeatureForm"
            );


        if (form) {

            form.addEventListener(
                "submit",
                handleRideRequestSubmit
            );

        }
    }


    /* =====================================================
       SUBMIT RIDE REQUEST
    ===================================================== */

    async function handleRideRequestSubmit(
        event
    ) {

        event.preventDefault();


        const userId =
            getCurrentUserId();


        if (!userId) {

            showMessage(
                "Please log in first.",
                "error"
            );

            return;
        }


        const submitButton =
            event.target.querySelector(
                'button[type="submit"]'
            );


        submitButton.disabled =
            true;


        submitButton.textContent =
            "Submitting...";


        const payload = {

            user_id:
                userId,

            ride_type:
                document.getElementById(
                    "featureRideType"
                ).value,

            pickup:
                document.getElementById(
                    "featureRidePickup"
                ).value.trim(),

            destination:
                document.getElementById(
                    "featureRideDestination"
                ).value.trim(),

            phone:
                document.getElementById(
                    "featureRidePhone"
                ).value.trim(),

            note:
                document.getElementById(
                    "featureRideNote"
                ).value.trim() ||
                null,

            status:
                "pending"
        };


        try {

            const savedRequest =
                await supabaseRequest(

                    "/rest/v1/ride_requests",

                    {
                        method:
                            "POST",

                        headers: {

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
                Array.isArray(
                    savedRequest
                ) &&
                savedRequest.length
            ) {

                rideRequests.unshift(
                    savedRequest[0]
                );

            }


            renderRideRequests();


            showMessage(
                "Ride request submitted successfully!"
            );


            closeModal(
                "rideRequestFeatureModal"
            );


            await loadRideRequests();

        } catch (error) {

            console.error(
                "LosOja ride request error:",
                error
            );


            showMessage(
                "Could not submit ride request: " +
                error.message,
                "error"
            );


            submitButton.disabled =
                false;


            submitButton.textContent =
                "Submit Ride Request";
        }
    }


    /* =====================================================
       FEEDBACK
    ===================================================== */

    function openFeedbackModal() {

        if (!requireLogin()) {
            return;
        }


        const modal =
            createModal(

                "feedbackFeatureModal",

                "Send Feedback",

                `

                <p>
                    Tell us what you think about LosOja
                    or report a problem.
                </p>


                <form
                    id="feedbackFeatureForm"
                    class="feature-form"
                >

                    <div class="form-group">

                        <label for="feedbackType">
                            Feedback Type
                        </label>

                        <select
                            id="feedbackType"
                            required
                        >

                            <option value="">
                                Select type
                            </option>

                            <option value="Suggestion">
                                Suggestion
                            </option>

                            <option value="Problem">
                                Report a Problem
                            </option>

                            <option value="Business">
                                Business Issue
                            </option>

                            <option value="Property">
                                Property Issue
                            </option>

                            <option value="Transportation">
                                Transportation Issue
                            </option>

                            <option value="Other">
                                Other
                            </option>

                        </select>

                    </div>


                    <div class="form-group">

                        <label for="feedbackSubject">
                            Subject
                        </label>

                        <input
                            type="text"
                            id="feedbackSubject"
                            placeholder="Short subject"
                        >

                    </div>


                    <div class="form-group">

                        <label for="feedbackMessage">
                            Message
                        </label>

                        <textarea
                            id="feedbackMessage"
                            required
                            placeholder="Tell us what happened or share your idea"
                        ></textarea>

                    </div>


                    <button
                        type="submit"
                        class="btn btn-primary btn-block"
                    >
                        Send Feedback
                    </button>

                </form>

                `
            );


        const form =
            modal.querySelector(
                "#feedbackFeatureForm"
            );


        if (form) {

            form.addEventListener(
                "submit",
                handleFeedbackSubmit
            );

        }
    }


    async function handleFeedbackSubmit(
        event
    ) {

        event.preventDefault();


        const userId =
            getCurrentUserId();


        if (!userId) {

            showMessage(
                "Please log in first.",
                "error"
            );

            return;
        }


        const submitButton =
            event.target.querySelector(
                'button[type="submit"]'
            );


        submitButton.disabled =
            true;


        submitButton.textContent =
            "Sending...";


        const payload = {

            user_id:
                userId,

            feedback_type:
                document.getElementById(
                    "feedbackType"
                ).value,

            subject:
                document.getElementById(
                    "feedbackSubject"
                ).value.trim() ||
                null,

            message:
                document.getElementById(
                    "feedbackMessage"
                ).value.trim(),

            status:
                "new"
        };


        try {

            await supabaseRequest(

                "/rest/v1/feedback",

                {
                    method:
                        "POST",

                    headers: {

                        "Prefer":
                            "return=representation"

                    },

                    body:
                        JSON.stringify(
                            payload
                        )

                }

            );


            showMessage(
                "Thank you! Your feedback has been submitted."
            );


            closeModal(
                "feedbackFeatureModal"
            );

        } catch (error) {

            console.error(
                "LosOja feedback error:",
                error
            );


            showMessage(
                "Could not send feedback: " +
                error.message,
                "error"
            );


            submitButton.disabled =
                false;


            submitButton.textContent =
                "Send Feedback";
        }
    }


    /* =====================================================
       BUTTON BINDING
    ===================================================== */

    function bindFeatureButtons() {

        /* ---------------------------------------------
           PROPERTY BUTTONS
        --------------------------------------------- */

        document
            .querySelectorAll(
                ".add-property-btn"
            )
            .forEach(
                function (button) {

                    if (
                        button.dataset
                            .losojaFeatureBound
                    ) {

                        return;

                    }


                    button.dataset
                        .losojaFeatureBound =
                        "true";


                    button.addEventListener(
                        "click",
                        openPropertyModal
                    );

                }
            );


        /* ---------------------------------------------
           RIDE PROVIDER BUTTONS
        --------------------------------------------- */

        document
            .querySelectorAll(
                ".add-ride-provider-btn"
            )
            .forEach(
                function (button) {

                    if (
                        button.dataset
                            .losojaFeatureBound
                    ) {

                        return;

                    }


                    button.dataset
                        .losojaFeatureBound =
                        "true";


                    button.addEventListener(
                        "click",
                        openRideProviderModal
                    );

                }
            );


        /* ---------------------------------------------
           FEEDBACK BUTTONS
        --------------------------------------------- */

        document
            .querySelectorAll(
                ".feedback-btn"
            )
            .forEach(
                function (button) {

                    if (
                        button.dataset
                            .losojaFeatureBound
                    ) {

                        return;

                    }


                    button.dataset
                        .losojaFeatureBound =
                        "true";


                    button.addEventListener(
                        "click",
                        openFeedbackModal
                    );

                }
            );


        /* ---------------------------------------------
           MOBILITY BUTTONS

           Capture phase prevents the old app.js
           localStorage ride handler from running.
        --------------------------------------------- */

        document.addEventListener(

            "click",

            function (event) {

                const button =
                    event.target.closest(
                        ".mobility-btn"
                    );


                if (!button) {
                    return;
                }


                const type =
                    button.dataset.mobility;


                if (
                    ![
                        "trycircle",
                        "bike",
                        "cab",
                        "truck"
                    ].includes(type)
                ) {

                    return;

                }


                event.preventDefault();


                event.stopImmediatePropagation();


                openRideRequestModal(
                    type
                );

            },

            true

        );

    }


    /* =====================================================
       INITIALIZATION
    ===================================================== */

    function init() {

        bindFeatureButtons();

        loadProperties();

        loadRideProviders();

        ensureRideRequestsSection();

        loadRideRequests();

    }


    /* =====================================================
       PUBLIC API
    ===================================================== */

    window.LosOjaFeatures = {

        init,

        loadProperties,

        renderProperties,

        openPropertyModal,

        loadRideProviders,

        renderRideProviders,

        openRideProviderModal,

        loadRideRequests,

        renderRideRequests,

        openRideRequestModal,

        openFeedbackModal,

        getProperties:
            function () {

                return properties.slice();

            },

        getRideProviders:
            function () {

                return rideProviders.slice();

            },

        getRideRequests:
            function () {

                return rideRequests.slice();

            }

    };


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
