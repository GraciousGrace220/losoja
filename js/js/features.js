/*
=========================================================
LosOja - Stage 1 Features

Handles:
- Property listings
- Ride providers
- Ride requests
- Feedback
- Stage 1 modals

Existing businesses/reviews systems remain separate.
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
       SESSION
    ===================================================== */

    function getSession() {

        try {

            return JSON.parse(
                localStorage.getItem(SESSION_KEY)
            );

        } catch (error) {

            return null;
        }
    }


    function getAccessToken() {

        const session = getSession();

        return (
            session &&
            (
                session.access_token ||
                session.accessToken
            )
        ) || null;
    }


    function getCurrentUserId() {

        const session = getSession();

        return (
            session &&
            session.user &&
            session.user.id
        ) || null;
    }


    function isLoggedIn() {

        return !!getCurrentUserId();
    }


    /* =====================================================
       HEADERS
    ===================================================== */

    function supabaseHeaders(includeJson = false) {

        const token = getAccessToken();

        const headers = {

            "apikey": LOSOJA_FEATURES_KEY,

            "Authorization":
                "Bearer " +
                (token || LOSOJA_FEATURES_KEY)

        };

        if (includeJson) {

            headers["Content-Type"] =
                "application/json";

            headers["Prefer"] =
                "return=representation";
        }

        return headers;
    }


    /* =====================================================
       HELPERS
    ===================================================== */

    function escapeHtml(value) {

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


    function showMessage(message, type = "success") {

        if (
            window.LosOjaApp &&
            typeof window.LosOjaApp.showToast === "function"
        ) {

            window.LosOjaApp.showToast(
                message,
                type
            );

            return;
        }

        let toast =
            document.getElementById("losojaFeatureToast");

        if (!toast) {

            toast =
                document.createElement("div");

            toast.id =
                "losojaFeatureToast";

            toast.style.position =
                "fixed";

            toast.style.bottom =
                "25px";

            toast.style.right =
                "25px";

            toast.style.zIndex =
                "99999";

            toast.style.padding =
                "14px 18px";

            toast.style.borderRadius =
                "8px";

            toast.style.background =
                "var(--green)";

            toast.style.color =
                "#fff";

            toast.style.boxShadow =
                "0 8px 25px rgba(0,0,0,.18)";

            document.body.appendChild(toast);
        }

        toast.textContent =
            message;

        toast.style.background =
            type === "error"
                ? "var(--red)"
                : "var(--green)";

        toast.style.display =
            "block";

        clearTimeout(
            toast._timer
        );

        toast._timer =
            setTimeout(function () {

                toast.style.display =
                    "none";

            }, 3500);
    }


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
                '[data-modal="loginModal"], .login-btn'
            );

        if (loginButton) {
            loginButton.click();
        }

        return false;
    }


    function createModal(id, title, body) {

        let modal =
            document.getElementById(id);

        if (modal) {

            const bodyElement =
                modal.querySelector(
                    ".feature-modal-body"
                );

            if (bodyElement) {
                bodyElement.innerHTML = body;
            }

            return modal;
        }


        modal =
            document.createElement("div");

        modal.id = id;

        modal.className =
            "modal";

        modal.innerHTML = `

            <div class="modal-overlay"></div>

            <div class="modal-content">

                <div class="modal-header">

                    <h2>
                        ${escapeHtml(title)}
                    </h2>

                    <button
                        type="button"
                        class="modal-close"
                        aria-label="Close"
                    >
                        &times;
                    </button>

                </div>

                <div class="feature-modal-body">
                    ${body}
                </div>

            </div>
        `;

        document.body.appendChild(modal);


        const close =
            function () {

                modal.classList.remove("active");

                modal.style.display =
                    "none";
            };


        modal
            .querySelector(".modal-close")
            .addEventListener(
                "click",
                close
            );


        modal
            .querySelector(".modal-overlay")
            .addEventListener(
                "click",
                close
            );


        return modal;
    }


    function openModal(modal) {

        modal.classList.add("active");

        modal.style.display =
            "flex";
    }


    function closeModalById(id) {

        const modal =
            document.getElementById(id);

        if (!modal) {
            return;
        }

        modal.classList.remove("active");

        modal.style.display =
            "none";
    }


    /* =====================================================
       PROPERTY
    ===================================================== */

    async function loadProperties() {

        const grid =
            document.getElementById(
                "propertyGrid"
            );

        if (!grid) {
            return;
        }

        grid.innerHTML =
            '<div class="property-empty">Loading properties...</div>';


        try {

            const response =
                await fetch(
                    LOSOJA_FEATURES_URL +
                    "/rest/v1/property_listings" +
                    "?select=*" +
                    "&order=created_at.desc",
                    {
                        method: "GET",
                        headers:
                            supabaseHeaders()
                    }
                );


            if (!response.ok) {

                const errorText =
                    await response.text();

                throw new Error(
                    errorText ||
                    "Could not load properties."
                );
            }


            const properties =
                await response.json();


            renderProperties(properties);


        } catch (error) {

            console.error(
                "LosOja property loading error:",
                error
            );

            grid.innerHTML =
                '<div class="property-empty">Properties could not be loaded right now.</div>';
        }
    }


    function renderProperties(properties) {

        const grid =
            document.getElementById(
                "propertyGrid"
            );

        if (!grid) {
            return;
        }


        if (
            !Array.isArray(properties) ||
            properties.length === 0
        ) {

            grid.innerHTML = `

                <div class="property-empty">

                    🏠 No property listings yet.

                    <br>

                    Be the first person to add one.

                </div>
            `;

            return;
        }


        grid.innerHTML =
            properties
                .map(
                    renderPropertyCard
                )
                .join("");
    }


    function renderPropertyCard(property) {

        const title =
            escapeHtml(
                property.title
            );

        const propertyType =
            escapeHtml(
                property.property_type
            );

        const listingType =
            escapeHtml(
                property.listing_type
            );

        const location =
            escapeHtml(
                property.location
            );

        const price =
            escapeHtml(
                property.price ||
                "Price on request"
            );

        const description =
            escapeHtml(
                property.description ||
                ""
            );

        const phone =
            escapeHtml(
                property.phone ||
                ""
            );


        return `

            <article
                class="property-card"
            >

                <div class="property-card-top">

                    <span
                        class="property-type-badge"
                    >
                        ${propertyType}
                        ·
                        ${listingType}
                    </span>

                    <h3>
                        ${title}
                    </h3>

                    <div class="property-location">
                        📍 ${location}
                    </div>

                    <div class="property-price">
                        ${price}
                    </div>

                    ${
                        description
                            ? `
                                <div
                                    class="property-description"
                                >
                                    ${description}
                                </div>
                              `
                            : ""
                    }

                </div>

                <div
                    class="property-card-actions"
                >

                    ${
                        phone
                            ? `
                                <a
                                    class="btn btn-primary"
                                    href="tel:${phone}"
                                >
                                    📞 Contact
                                </a>
                              `
                            : ""
                    }

                    <button
                        type="button"
                        class="btn btn-secondary property-details-btn"
                        data-property-id="${escapeHtml(property.id)}"
                    >
                        View
                    </button>

                </div>

            </article>
        `;
    }


    function openPropertyModal() {

        if (!requireLogin()) {
            return;
        }


        const body = `

            <form
                id="propertyForm"
                class="feature-form"
            >

                <div
                    id="propertyFormError"
                    class="feature-error"
                ></div>


                <div class="form-group">

                    <label>
                        Property title
                    </label>

                    <input
                        id="propertyTitle"
                        type="text"
                        placeholder="e.g. 3 Bedroom House"
                        required
                    >

                </div>


                <div class="form-group">

                    <label>
                        Property type
                    </label>

                    <select
                        id="propertyType"
                        required
                    >

                        <option value="">
                            Select property type
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

                        <option value="Commercial Property">
                            Commercial Property
                        </option>

                        <option value="Office / Shop">
                            Office / Shop
                        </option>

                        <option value="Other">
                            Other
                        </option>

                    </select>

                </div>


                <div class="form-group">

                    <label>
                        Listing type
                    </label>

                    <select
                        id="propertyListingType"
                        required
                    >

                        <option value="">
                            Select listing type
                        </option>

                        <option value="Sale">
                            For Sale
                        </option>

                        <option value="Rent">
                            For Rent
                        </option>

                        <option value="Lease">
                            For Lease
                        </option>

                    </select>

                </div>


                <div class="form-group">

                    <label>
                        Location
                    </label>

                    <input
                        id="propertyLocation"
                        type="text"
                        placeholder="City, area"
                        required
                    >

                </div>


                <div class="form-group">

                    <label>
                        Price
                    </label>

                    <input
                        id="propertyPrice"
                        type="text"
                        placeholder="e.g. ₦5,000,000"
                    >

                </div>


                <div class="form-group">

                    <label>
                        Phone number
                    </label>

                    <input
                        id="propertyPhone"
                        type="tel"
                        placeholder="Phone number"
                    >

                </div>


                <div class="form-group">

                    <label>
                        Description
                    </label>

                    <textarea
                        id="propertyDescription"
                        placeholder="Describe the property..."
                    ></textarea>

                </div>


                <div class="feature-form-actions">

                    <button
                        type="button"
                        class="btn btn-secondary"
                        id="cancelPropertyButton"
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        class="btn btn-primary"
                    >
                        Publish Property
                    </button>

                </div>

            </form>
        `;


        const modal =
            createModal(
                "propertyModal",
                "🏠 Add Property",
                body
            );


        const form =
            modal.querySelector(
                "#propertyForm"
            );


        form.onsubmit =
            submitProperty;


        const cancel =
            modal.querySelector(
                "#cancelPropertyButton"
            );

        cancel.onclick =
            function () {

                closeModalById(
                    "propertyModal"
                );
            };


        openModal(modal);
    }


    async function submitProperty(event) {

        event.preventDefault();


        const errorBox =
            document.getElementById(
                "propertyFormError"
            );

        const userId =
            getCurrentUserId();


        if (!userId) {

            errorBox.textContent =
                "Please log in first.";

            errorBox.classList.add(
                "show"
            );

            return;
        }


        const title =
            document.getElementById(
                "propertyTitle"
            ).value.trim();

        const propertyType =
            document.getElementById(
                "propertyType"
            ).value;

        const listingType =
            document.getElementById(
                "propertyListingType"
            ).value;

        const location =
            document.getElementById(
                "propertyLocation"
            ).value.trim();

        const price =
            document.getElementById(
                "propertyPrice"
            ).value.trim();

        const phone =
            document.getElementById(
                "propertyPhone"
            ).value.trim();

        const description =
            document.getElementById(
                "propertyDescription"
            ).value.trim();


        errorBox.classList.remove(
            "show"
        );


        try {

            const response =
                await fetch(
                    LOSOJA_FEATURES_URL +
                    "/rest/v1/property_listings",
                    {
                        method: "POST",
                        headers:
                            supabaseHeaders(true),
                        body:
                            JSON.stringify({

                                user_id:
                                    userId,

                                title:
                                    title,

                                property_type:
                                    propertyType,

                                listing_type:
                                    listingType,

                                location:
                                    location,

                                price:
                                    price || null,

                                description:
                                    description || null,

                                phone:
                                    phone || null
                            })
                    }
                );


            if (!response.ok) {

                const text =
                    await response.text();

                throw new Error(
                    text ||
                    "Property could not be published."
                );
            }


            closeModalById(
                "propertyModal"
            );


            showMessage(
                "🏠 Property listed successfully!"
            );


            await loadProperties();


        } catch (error) {

            console.error(
                "LosOja property insert error:",
                error
            );

            errorBox.textContent =
                "Property could not be published. Please try again.";

            errorBox.classList.add(
                "show"
            );
        }
    }


    /* =====================================================
       RIDE REQUEST
    ===================================================== */

    const RIDE_NAMES = {

        trycircle:
            "TryCircle",

        bike:
            "Bike",

        cab:
            "Cab",

        truck:
            "Rent a Truck"
    };


    function openRideRequest(type) {

        if (!requireLogin()) {
            return;
        }


        const rideName =
            RIDE_NAMES[type] ||
            "Ride";


        const body = `

            <form
                id="rideRequestForm"
                class="feature-form"
            >

                <input
                    type="hidden"
                    id="rideRequestType"
                    value="${escapeHtml(type)}"
                >


                <div
                    id="rideRequestError"
                    class="feature-error"
                ></div>


                <div class="form-group">

                    <label>
                        Ride
                    </label>

                    <input
                        type="text"
                        value="${escapeHtml(rideName)}"
                        readonly
                    >

                </div>


                <div class="form-group">

                    <label>
                        Pickup location
                    </label>

                    <input
                        id="ridePickup"
                        type="text"
                        placeholder="Where should we pick you up?"
                        required
                    >

                </div>


                <div class="form-group">

                    <label>
                        Destination
                    </label>

                    <input
                        id="rideDestination"
                        type="text"
                        placeholder="Where are you going?"
                        required
                    >

                </div>


                <div class="form-group">

                    <label>
                        Phone number
                    </label>

                    <input
                        id="ridePhone"
                        type="tel"
                        placeholder="Your phone number"
                        required
                    >

                </div>


                <div class="form-group">

                    <label>
                        Note
                    </label>

                    <textarea
                        id="rideNote"
                        placeholder="Anything the driver should know?"
                    ></textarea>

                </div>


                <div class="feature-form-actions">

                    <button
                        type="button"
                        class="btn btn-secondary"
                        id="cancelRideRequest"
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        class="btn btn-primary"
                    >
                        Request Ride
                    </button>

                </div>

            </form>
        `;


        const modal =
            createModal(
                "rideRequestModal",
                "🚕 Request " + rideName,
                body
            );


        const form =
            modal.querySelector(
                "#rideRequestForm"
            );


        form.onsubmit =
            submitRideRequest;


        modal
            .querySelector(
                "#cancelRideRequest"
            )
            .onclick =
            function () {

                closeModalById(
                    "rideRequestModal"
                );
            };


        openModal(modal);
    }


    async function submitRideRequest(event) {

        event.preventDefault();


        const errorBox =
            document.getElementById(
                "rideRequestError"
            );


        const userId =
            getCurrentUserId();


        if (!userId) {

            errorBox.textContent =
                "Please log in first.";

            errorBox.classList.add(
                "show"
            );

            return;
        }


        const rideType =
            document.getElementById(
                "rideRequestType"
            ).value;

        const pickup =
            document.getElementById(
                "ridePickup"
            ).value.trim();

        const destination =
            document.getElementById(
                "rideDestination"
            ).value.trim();

        const phone =
            document.getElementById(
                "ridePhone"
            ).value.trim();

        const note =
            document.getElementById(
                "rideNote"
            ).value.trim();


        try {

            const response =
                await fetch(
                    LOSOJA_FEATURES_URL +
                    "/rest/v1/ride_requests",
                    {
                        method: "POST",
                        headers:
                            supabaseHeaders(true),
                        body:
                            JSON.stringify({

                                user_id:
                                    userId,

                                ride_type:
                                    rideType,

                                pickup:
                                    pickup,

                                destination:
                                    destination,

                                phone:
                                    phone,

                                note:
                                    note || null,

                                status:
                                    "pending"
                            })
                    }
                );


            if (!response.ok) {

                const text =
                    await response.text();

                throw new Error(
                    text ||
                    "Ride request failed."
                );
            }


            closeModalById(
                "rideRequestModal"
            );


            showMessage(
                "🚕 Ride request submitted successfully!"
            );


        } catch (error) {

            console.error(
                "LosOja ride request error:",
                error
            );

            errorBox.textContent =
                "Ride request could not be submitted. Please try again.";

            errorBox.classList.add(
                "show"
            );
        }
    }


    /* =====================================================
       RIDE PROVIDERS
    ===================================================== */

    async function loadRideProviders() {

        const grid =
            document.getElementById(
                "rideProviderGrid"
            );

        if (!grid) {
            return;
        }


        grid.innerHTML =
            '<div class="property-empty">Loading ride providers...</div>';


        try {

            const response =
                await fetch(
                    LOSOJA_FEATURES_URL +
                    "/rest/v1/ride_providers" +
                    "?select=*" +
                    "&order=created_at.desc",
                    {
                        method: "GET",
                        headers:
                            supabaseHeaders()
                    }
                );


            if (!response.ok) {
                throw new Error(
                    "Could not load ride providers."
                );
            }


            const providers =
                await response.json();


            renderRideProviders(
                providers
            );


        } catch (error) {

            console.error(
                "LosOja ride providers error:",
                error
            );

            grid.innerHTML =
                '<div class="property-empty">Ride providers could not be loaded right now.</div>';
        }
    }


    function renderRideProviders(providers) {

        const grid =
            document.getElementById(
                "rideProviderGrid"
            );

        if (!grid) {
            return;
        }


        if (
            !Array.isArray(providers) ||
            providers.length === 0
        ) {

            grid.innerHTML = `

                <div class="property-empty">

                    🛵 No ride providers listed yet.

                    <br>

                    Add your ride service to LosOja.

                </div>
            `;

            return;
        }


        grid.innerHTML =
            providers
                .map(function (provider) {

                    return `

                        <article
                            class="ride-provider-card"
                        >

                            <span
                                class="ride-provider-type"
                            >
                                ${escapeHtml(
                                    provider.ride_type
                                )}
                            </span>

                            <h3>
                                ${escapeHtml(
                                    provider.provider_name
                                )}
                            </h3>

                            <p>
                                📍
                                ${escapeHtml(
                                    provider.operating_location
                                )}
                            </p>

                            <p>
                                🚗
                                ${escapeHtml(
                                    provider.vehicle_info ||
                                    "Vehicle information not provided"
                                )}
                            </p>

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

                            <p>
                                📞
                                ${escapeHtml(
                                    provider.phone
                                )}
                            </p>

                        </article>
                    `;

                })
                .join("");
    }


    function openRideProviderModal() {

        if (!requireLogin()) {
            return;
        }


        const body = `

            <form
                id="rideProviderForm"
                class="feature-form"
            >

                <div
                    id="rideProviderError"
                    class="feature-error"
                ></div>


                <div class="form-group">

                    <label>
                        Provider / business name
                    </label>

                    <input
                        id="rideProviderName"
                        type="text"
                        placeholder="Your ride service name"
                        required
                    >

                </div>


                <div class="form-group">

                    <label>
                        Ride type
                    </label>

                    <select
                        id="rideProviderType"
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

                        <option value="Rent a Truck">
                            Rent a Truck
                        </option>

                    </select>

                </div>


                <div class="form-group">

                    <label>
                        Phone number
                    </label>

                    <input
                        id="rideProviderPhone"
                        type="tel"
                        required
                    >

                </div>


                <div class="form-group">

                    <label>
                        Vehicle information
                    </label>

                    <input
                        id="rideProviderVehicle"
                        type="text"
                        placeholder="e.g. Toyota Corolla 2020"
                    >

                </div>


                <div class="form-group">

                    <label>
                        Operating location
                    </label>

                    <input
                        id="rideProviderLocation"
                        type="text"
                        placeholder="Area / city"
                        required
                    >

                </div>


                <div class="form-group">

                    <label>
                        Description
                    </label>

                    <textarea
                        id="rideProviderDescription"
                        placeholder="Tell customers about your service..."
                    ></textarea>

                </div>


                <div class="feature-form-actions">

                    <button
                        type="button"
                        class="btn btn-secondary"
                        id="cancelRideProvider"
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        class="btn btn-primary"
                    >
                        Add Ride Service
                    </button>

                </div>

            </form>
        `;


        const modal =
            createModal(
                "rideProviderModal",
                "🛵 Add Your Ride Service",
                body
            );


        modal
            .querySelector(
                "#rideProviderForm"
            )
            .onsubmit =
            submitRideProvider;


        modal
            .querySelector(
                "#cancelRideProvider"
            )
            .onclick =
            function () {

                closeModalById(
                    "rideProviderModal"
                );
            };


        openModal(modal);
    }


    async function submitRideProvider(event) {

        event.preventDefault();


        const errorBox =
            document.getElementById(
                "rideProviderError"
            );


        const userId =
            getCurrentUserId();


        if (!userId) {

            errorBox.textContent =
                "Please log in first.";

            errorBox.classList.add(
                "show"
            );

            return;
        }


        const providerName =
            document.getElementById(
                "rideProviderName"
            ).value.trim();

        const rideType =
            document.getElementById(
                "rideProviderType"
            ).value;

        const phone =
            document.getElementById(
                "rideProviderPhone"
            ).value.trim();

        const vehicleInfo =
            document.getElementById(
                "rideProviderVehicle"
            ).value.trim();

        const location =
            document.getElementById(
                "rideProviderLocation"
            ).value.trim();

        const description =
            document.getElementById(
                "rideProviderDescription"
            ).value.trim();


        try {

            const response =
                await fetch(
                    LOSOJA_FEATURES_URL +
                    "/rest/v1/ride_providers",
                    {
                        method: "POST",
                        headers:
                            supabaseHeaders(true),
                        body:
                            JSON.stringify({

                                user_id:
                                    userId,

                                provider_name:
                                    providerName,

                                ride_type:
                                    rideType,

                                phone:
                                    phone,

                                vehicle_info:
                                    vehicleInfo || null,

                                operating_location:
                                    location,

                                description:
                                    description || null
                            })
                    }
                );


            if (!response.ok) {

                const text =
                    await response.text();

                throw new Error(
                    text ||
                    "Ride provider could not be added."
                );
            }


            closeModalById(
                "rideProviderModal"
            );


            showMessage(
                "🛵 Your ride service has been added!"
            );


            await loadRideProviders();


        } catch (error) {

            console.error(
                "LosOja ride provider error:",
                error
            );

            errorBox.textContent =
                "Ride service could not be added. Please try again.";

            errorBox.classList.add(
                "show"
            );
        }
    }


    /* =====================================================
       FEEDBACK
    ===================================================== */

    function openFeedbackModal() {

        if (!requireLogin()) {
            return;
        }


        const body = `

            <form
                id="feedbackForm"
                class="feature-form"
            >

                <div
                    id="feedbackError"
                    class="feature-error"
                ></div>


                <div class="form-group">

                    <label>
                        Feedback type
                    </label>

                    <select
                        id="feedbackType"
                        required
                    >

                        <option value="">
                            Select one
                        </option>

                        <option value="feature">
                            Suggest a Feature
                        </option>

                        <option value="problem">
                            Report a Problem
                        </option>

                        <option value="general">
                            General Feedback
                        </option>

                        <option value="category">
                            Request a Category
                        </option>

                    </select>

                </div>


                <div class="form-group">

                    <label>
                        Subject
                    </label>

                    <input
                        id="feedbackSubject"
                        type="text"
                        placeholder="Short subject"
                    >

                </div>


                <div class="form-group">

                    <label>
                        Message
                    </label>

                    <textarea
                        id="feedbackMessage"
                        placeholder="Tell us what you think..."
                        required
                    ></textarea>

                </div>


                <div class="feature-form-actions">

                    <button
                        type="button"
                        class="btn btn-secondary"
                        id="cancelFeedback"
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        class="btn btn-primary"
                    >
                        Send Feedback
                    </button>

                </div>

            </form>
        `;


        const modal =
            createModal(
                "feedbackModal",
                "💬 Help Improve LosOja",
                body
            );


        modal
            .querySelector(
                "#feedbackForm"
            )
            .onsubmit =
            submitFeedback;


        modal
            .querySelector(
                "#cancelFeedback"
            )
            .onclick =
            function () {

                closeModalById(
                    "feedbackModal"
                );
            };


        openModal(modal);
    }


    async function submitFeedback(event) {

        event.preventDefault();


        const errorBox =
            document.getElementById(
                "feedbackError"
            );


        const userId =
            getCurrentUserId();


        if (!userId) {

            errorBox.textContent =
                "Please log in first.";

            errorBox.classList.add(
                "show"
            );

            return;
        }


        const feedbackType =
            document.getElementById(
                "feedbackType"
            ).value;

        const subject =
            document.getElementById(
                "feedbackSubject"
            ).value.trim();

        const message =
            document.getElementById(
                "feedbackMessage"
            ).value.trim();


        try {

            const response =
                await fetch(
                    LOSOJA_FEATURES_URL +
                    "/rest/v1/feedback",
                    {
                        method: "POST",
                        headers:
                            supabaseHeaders(true),
                        body:
                            JSON.stringify({

                                user_id:
                                    userId,

                                feedback_type:
                                    feedbackType,

                                subject:
                                    subject || null,

                                message:
                                    message,

                                status:
                                    "new"
                            })
                    }
                );


            if (!response.ok) {

                const text =
                    await response.text();

                throw new Error(
                    text ||
                    "Feedback could not be submitted."
                );
            }


            closeModalById(
                "feedbackModal"
            );


            showMessage(
                "💚 Thank you! Your feedback was sent."
            );


        } catch (error) {

            console.error(
                "LosOja feedback error:",
                error
            );

            errorBox.textContent =
                "Feedback could not be submitted. Please try again.";

            errorBox.classList.add(
                "show"
            );
        }
    }


    /* =====================================================
       BUTTONS
    ===================================================== */

    function bindFeatureButtons() {

        document.addEventListener(
            "click",
            function (event) {

                const propertyButton =
                    event.target.closest(
                        ".add-property-btn"
                    );

                if (propertyButton) {

                    event.preventDefault();

                    openPropertyModal();

                    return;
                }


                const providerButton =
                    event.target.closest(
                        ".add-ride-provider-btn"
                    );

                if (providerButton) {

                    event.preventDefault();

                    openRideProviderModal();

                    return;
                }


                const feedbackButton =
                    event.target.closest(
                        ".feedback-btn"
                    );

                if (feedbackButton) {

                    event.preventDefault();

                    openFeedbackModal();

                    return;
                }


                const rideButton =
                    event.target.closest(
                        ".mobility-btn"
                    );

                if (rideButton) {

                    const type =
                        rideButton.dataset.mobility;

                    if (
                        type &&
                        RIDE_NAMES[type]
                    ) {

                        /*
                        Capture the click before the
                        old localStorage mobility
                        handler in app.js.
                        */

                        event.preventDefault();

                        event.stopImmediatePropagation();

                        openRideRequest(type);
                    }
                }

            },
            true
        );
    }


    /* =====================================================
       INITIALIZE
    ===================================================== */

    function init() {

        bindFeatureButtons();

        loadProperties();

        loadRideProviders();
    }


    /* =====================================================
       PUBLIC API
    ===================================================== */

    window.LosOjaFeatures = {

        init:

            init,

        loadProperties:

            loadProperties,

        loadRideProviders:

            loadRideProviders,

        openPropertyModal:

            openPropertyModal,

        openRideRequest:

            openRideRequest,

        openRideProviderModal:

            openRideProviderModal,

        openFeedbackModal:

            openFeedbackModal

    };


    document.addEventListener(
        "DOMContentLoaded",
        init
    );


})();
