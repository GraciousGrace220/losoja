/*
=========================================================
LosOja - Businesses
js/businesses.js

Works with:
- Current GitHub index.html
- Supabase REST API
- Existing auth.js session
- public.businesses table

Supabase businesses columns:
- id
- user_id
- name
- category
- location
- description
- phone
- email
- created_at
=========================================================
*/

(function () {

    "use strict";


    /* =====================================================
       SUPABASE CONFIGURATION
    ===================================================== */

    const BUSINESSES_SUPABASE_URL =
        "https://ycxshwgeebskdozmornh.supabase.co";

    const BUSINESSES_SUPABASE_KEY =
        "sb_publishable_jFSLacwNupO6T8EnSqb2bw_bZmy7rVe";


    /* =====================================================
       SESSION
    ===================================================== */

    function getSession() {

        try {

            if (typeof window.getSupabaseSession === "function") {
                return window.getSupabaseSession();
            }

            const saved =
                localStorage.getItem("losoja_supabase_session");

            if (!saved) {
                return null;
            }

            return JSON.parse(saved);

        } catch (error) {

            console.error(
                "LosOja: Could not read session.",
                error
            );

            return null;
        }
    }


    function getAccessToken() {

        const session = getSession();

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

        const session = getSession();

        if (!session) {
            return null;
        }

        return session.user || null;
    }


    /* =====================================================
       SUPABASE HEADERS
    ===================================================== */

    function getHeaders(requireAuth) {

        const token = getAccessToken();

        const headers = {
            "apikey": BUSINESSES_SUPABASE_KEY,
            "Content-Type": "application/json",
            "Accept": "application/json"
        };

        if (requireAuth && token) {

            headers["Authorization"] =
                "Bearer " + token;

        }

        return headers;
    }


    /* =====================================================
       NOTIFICATION
    ===================================================== */

    function notify(message) {

        if (typeof window.showNotification === "function") {

            window.showNotification(message);
            return;

        }

        const toast =
            document.getElementById("toast");

        if (!toast) {
            alert(message);
            return;
        }

        toast.textContent = message;
        toast.classList.add("show");

        setTimeout(function () {

            toast.classList.remove("show");

        }, 3000);
    }


    /* =====================================================
       ESCAPE HTML
    ===================================================== */

    function escapeHTML(value) {

        if (value === null || value === undefined) {
            return "";
        }

        const div =
            document.createElement("div");

        div.textContent = String(value);

        return div.innerHTML;
    }


    /* =====================================================
       CLOSE MODAL
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

    // Remove any currently open modal
    document
        .querySelectorAll(".modal.active, .modal.open")
        .forEach(function (otherModal) {

            if (otherModal !== modal) {
                otherModal.classList.remove("active");
                otherModal.classList.remove("open");
            }

        });

    // Your GitHub CSS uses "active"
    modal.classList.add("active");

    // Keep "open" for compatibility
    modal.classList.add("open");

    document.body.style.overflow = "hidden";
}


    /* =====================================================
       OPEN MODAL
    ===================================================== */

    function openModal(id) {

        const modal =
            document.getElementById(id);

        if (!modal) {
            return;
        }

        modal.classList.add("open");
    }


    /* =====================================================
       LOAD BUSINESSES FROM SUPABASE
    ===================================================== */

    async function loadBusinesses() {

        const grid =
            document.getElementById("businessGrid");

        if (!grid) {
            console.error(
                "LosOja: #businessGrid was not found."
            );
            return;
        }

        grid.innerHTML =
            '<p style="grid-column:1/-1;text-align:center;">Loading businesses...</p>';

        try {

            const response = await fetch(
                BUSINESSES_SUPABASE_URL +
                "/rest/v1/businesses?select=*&order=created_at.desc",
                {
                    method: "GET",
                    headers: getHeaders(false)
                }
            );


            if (!response.ok) {

                const errorText =
                    await response.text();

                console.error(
                    "LosOja: Business loading failed:",
                    response.status,
                    errorText
                );

                throw new Error(
                    "Could not load businesses."
                );
            }


            const businesses =
                await response.json();


            renderBusinesses(businesses);


        } catch (error) {

            console.error(
                "LosOja: Error loading businesses:",
                error
            );

            grid.innerHTML =
                '<p style="grid-column:1/-1;text-align:center;color:#ef4444;">Businesses could not be loaded.</p>';

            const resultsText =
                document.getElementById(
                    "businessResultsText"
                );

            if (resultsText) {

                resultsText.textContent =
                    "Unable to load businesses";

            }
        }
    }


    /* =====================================================
       RENDER BUSINESSES
    ===================================================== */

    function renderBusinesses(businesses) {

        const grid =
            document.getElementById("businessGrid");

        const resultsText =
            document.getElementById(
                "businessResultsText"
            );

        const noResults =
            document.getElementById("noResults");


        if (!grid) {
            return;
        }


        if (!Array.isArray(businesses) ||
            businesses.length === 0) {

            grid.innerHTML = "";

            if (noResults) {
                noResults.classList.remove("hidden");
            }

            if (resultsText) {
                resultsText.textContent =
                    "No businesses found";
            }

            return;
        }


        if (noResults) {
            noResults.classList.add("hidden");
        }


        if (resultsText) {

            resultsText.textContent =
                "Showing " +
                businesses.length +
                " business" +
                (businesses.length === 1 ? "" : "es");

        }


        grid.innerHTML =
            businesses.map(function (business) {

                return `
                    <div class="business-card">

                        <div class="business-content">

                            <div class="business-category">
                                ${escapeHTML(business.category || "Business")}
                            </div>

                            <h3>
                                ${escapeHTML(business.name || "Unnamed Business")}
                            </h3>

                            <p class="business-location">
                                📍 ${escapeHTML(business.location || "Nigeria")}
                            </p>

                            <p class="business-description">
                                ${escapeHTML(
                                    business.description ||
                                    "No description available."
                                )}
                            </p>

                            <button
                                type="button"
                                class="btn btn-primary"
                                data-business-id="${escapeHTML(business.id)}"
                            >
                                View Details
                            </button>

                        </div>

                    </div>
                `;

            }).join("");


        /* Add detail-button events */

        grid.querySelectorAll(
            "[data-business-id]"
        ).forEach(function (button) {

            button.addEventListener(
                "click",
                function () {

                    const businessId =
                        this.getAttribute(
                            "data-business-id"
                        );

                    openBusiness(
                        businessId,
                        businesses
                    );

                }
            );

        });
    }


    /* =====================================================
       OPEN BUSINESS DETAILS
    ===================================================== */

    function openBusiness(id, businessList) {

        const business =
            businessList.find(function (item) {

                return String(item.id) === String(id);

            });


        if (!business) {

            console.error(
                "LosOja: Business not found:",
                id
            );

            return;
        }


        const modal =
            document.getElementById(
                "businessModal"
            );

        const details =
            document.getElementById(
                "businessDetails"
            );


        if (!modal || !details) {

            console.error(
                "LosOja: Business details modal not found."
            );

            return;
        }


        details.innerHTML = `

            <h2>
                ${escapeHTML(
                    business.name ||
                    "Business"
                )}
            </h2>

            <p>
                <strong>Category:</strong>
                ${escapeHTML(
                    business.category ||
                    "Not specified"
                )}
            </p>

            <p>
                <strong>Location:</strong>
                ${escapeHTML(
                    business.location ||
                    "Not specified"
                )}
            </p>

            <p>
                <strong>Description:</strong>
                ${escapeHTML(
                    business.description ||
                    "No description available."
                )}
            </p>

            ${
                business.phone
                    ? `
                        <p>
                            <strong>Phone:</strong>
                            <a href="tel:${escapeHTML(
                                business.phone
                            )}">
                                ${escapeHTML(
                                    business.phone
                                )}
                            </a>
                        </p>
                    `
                    : ""
            }

            ${
                business.email
                    ? `
                        <p>
                            <strong>Email:</strong>
                            <a href="mailto:${escapeHTML(
                                business.email
                            )}">
                                ${escapeHTML(
                                    business.email
                                )}
                            </a>
                        </p>
                    `
                    : ""
            }

        `;


        openModal("businessModal");
    }


    /* =====================================================
       SEARCH
    ===================================================== */

    window.searchBusinesses =
        async function (searchTerm, location) {

            const grid =
                document.getElementById(
                    "businessGrid"
                );

            if (!grid) {
                return;
            }


            grid.innerHTML =
                '<p style="grid-column:1/-1;text-align:center;">Searching...</p>';


            try {

                let url =
                    BUSINESSES_SUPABASE_URL +
                    "/rest/v1/businesses?select=*";


                const filters = [];


                if (searchTerm) {

                    const search =
                        String(searchTerm)
                            .trim()
                            .replace(/,/g, "");

                    if (search) {

                        filters.push(
                            "or=(" +
                            "name.ilike.*" + encodeURIComponent(search) + "*," +
                            "category.ilike.*" + encodeURIComponent(search) + "*," +
                            "description.ilike.*" + encodeURIComponent(search) + "*" +
                            ")"
                        );

                    }
                }


                if (location) {

                    const cleanLocation =
                        String(location)
                            .trim()
                            .replace(/,/g, "");

                    if (cleanLocation) {

                        filters.push(
                            "location.ilike.*" +
                            encodeURIComponent(
                                cleanLocation
                            ) +
                            "*"
                        );

                    }
                }


                if (filters.length > 0) {

                    url +=
                        "&" +
                        filters.join("&");

                }


                url +=
                    "&order=created_at.desc";


                const response =
                    await fetch(
                        url,
                        {
                            method: "GET",
                            headers: getHeaders(false)
                        }
                    );


                if (!response.ok) {

                    const errorText =
                        await response.text();

                    console.error(
                        "LosOja search error:",
                        response.status,
                        errorText
                    );

                    throw new Error(
                        "Search failed."
                    );
                }


                const businesses =
                    await response.json();


                renderBusinesses(
                    businesses
                );


            } catch (error) {

                console.error(
                    "LosOja: Search error:",
                    error
                );

                grid.innerHTML =
                    '<p style="grid-column:1/-1;text-align:center;color:#ef4444;">Search failed. Please try again.</p>';

            }
        };


    /* =====================================================
       CATEGORY FILTER
    ===================================================== */

    window.filterBusinessesByCategory =
        async function (category) {

            if (!category) {
                await loadBusinesses();
                return;
            }


            const grid =
                document.getElementById(
                    "businessGrid"
                );

            if (!grid) {
                return;
            }


            grid.innerHTML =
                '<p style="grid-column:1/-1;text-align:center;">Loading...</p>';


            try {

                const url =
                    BUSINESSES_SUPABASE_URL +
                    "/rest/v1/businesses" +
                    "?select=*" +
                    "&category=eq." +
                    encodeURIComponent(category) +
                    "&order=created_at.desc";


                const response =
                    await fetch(
                        url,
                        {
                            method: "GET",
                            headers: getHeaders(false)
                        }
                    );


                if (!response.ok) {

                    const errorText =
                        await response.text();

                    console.error(
                        "LosOja category error:",
                        response.status,
                        errorText
                    );

                    throw new Error(
                        "Category filter failed."
                    );
                }


                const businesses =
                    await response.json();


                renderBusinesses(
                    businesses
                );


            } catch (error) {

                console.error(
                    "LosOja: Category filter error:",
                    error
                );

                grid.innerHTML =
                    '<p style="grid-column:1/-1;text-align:center;color:#ef4444;">Could not filter businesses.</p>';

            }
        };


    /* =====================================================
       ADD BUSINESS BUTTON
    ===================================================== */

    function setupAddBusinessButtons() {

        const buttons =
            document.querySelectorAll(
                ".add-business-btn, #addBusinessBtn"
            );


        buttons.forEach(function (button) {

            button.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    const user =
                        getCurrentUser();

                    const token =
                        getAccessToken();


                    if (!user || !token) {

                        notify(
                            "Please login first."
                        );

                        openModal(
                            "loginModal"
                        );

                        return;
                    }


                    openModal(
                        "addBusinessModal"
                    );

                }
            );

        });
    }


    /* =====================================================
       ADD BUSINESS FORM
    ===================================================== */

    function setupAddBusinessForm() {

        const form =
            document.getElementById(
                "addBusinessForm"
            );


        if (!form) {

            console.warn(
                "LosOja: #addBusinessForm was not found."
            );

            return;
        }


        form.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();

                await addBusiness();

            }
        );
    }


    /* =====================================================
       ADD BUSINESS
    ===================================================== */

    async function addBusiness() {

        const errorElement =
            document.getElementById(
                "addBusinessError"
            );


        function showError(message) {

            if (errorElement) {

                errorElement.textContent =
                    message;

                errorElement.classList.add(
                    "show"
                );

            } else {

                notify(message);

            }
        }


        if (errorElement) {

            errorElement.textContent = "";
            errorElement.classList.remove(
                "show"
            );

        }


        const user =
            getCurrentUser();

        const token =
            getAccessToken();


        if (!user || !token) {

            showError(
                "Please login before adding a business."
            );

            openModal("loginModal");

            return;
        }


        const name =
            (
                document.getElementById(
                    "businessName"
                )?.value || ""
            ).trim();


        const category =
            (
                document.getElementById(
                    "businessCategory"
                )?.value || ""
            ).trim();


        const location =
            (
                document.getElementById(
                    "businessLocation"
                )?.value || ""
            ).trim();


        const description =
            (
                document.getElementById(
                    "businessDescription"
                )?.value || ""
            ).trim();


        const phone =
            (
                document.getElementById(
                    "businessPhone"
                )?.value || ""
            ).trim();


        const email =
            (
                document.getElementById(
                    "businessEmail"
                )?.value || ""
            ).trim();


        if (!name) {

            showError(
                "Business name is required."
            );

            return;
        }


        if (!category) {

            showError(
                "Please select a category."
            );

            return;
        }


        if (!location) {

            showError(
                "Business location is required."
            );

            return;
        }


        /* =================================================
           IMPORTANT

           Your Supabase table uses:

           user_id
           name
           category
           location
           description
           phone
           email

           It does NOT use owner_id.
        ================================================= */


        const businessData = {

            user_id: user.id,

            name: name,

            category: category,

            location: location,

            description:
                description || null,

            phone:
                phone || null,

            email:
                email || null

        };


        try {

            const response =
                await fetch(
                    BUSINESSES_SUPABASE_URL +
                    "/rest/v1/businesses",
                    {
                        method: "POST",

                        headers: {
                            ...getHeaders(true),

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


            if (!response.ok) {

                console.error(
                    "LosOja: Supabase business save failed.",
                    {
                        status:
                            response.status,

                        response:
                            responseText,

                        data:
                            businessData
                    }
                );


                let errorMessage =
                    "Business could not be saved.";


                try {

                    const errorJSON =
                        JSON.parse(
                            responseText
                        );


                    if (
                        errorJSON.message
                    ) {

                        errorMessage =
                            errorJSON.message;

                    } else if (
                        errorJSON.error_description
                    ) {

                        errorMessage =
                            errorJSON.error_description;

                    } else if (
                        errorJSON.details
                    ) {

                        errorMessage =
                            errorJSON.details;

                    }

                } catch (parseError) {

                    if (
                        responseText
                    ) {

                        errorMessage =
                            responseText;

                    }

                }


                showError(
                    errorMessage
                );

                return;
            }


            let savedBusiness =
                null;


            try {

                const parsed =
                    JSON.parse(
                        responseText
                    );

                if (
                    Array.isArray(parsed) &&
                    parsed.length > 0
                ) {

                    savedBusiness =
                        parsed[0];

                }

            } catch (parseError) {

                console.warn(
                    "LosOja: Could not parse saved business response."
                );

            }


            console.log(
                "LosOja: Business saved successfully.",
                savedBusiness ||
                businessData
            );


            closeModal(
                "addBusinessModal"
            );


            const form =
                document.getElementById(
                    "addBusinessForm"
                );

            if (form) {
                form.reset();
            }


            notify(
                "Business added successfully!"
            );


            await loadBusinesses();

        } catch (error) {

            console.error(
                "LosOja: Business save error:",
                error
            );


            showError(
                "Could not connect to the database. Please try again."
            );

        }

    }


    /* =====================================================
       EXPOSE FUNCTIONS
    ===================================================== */

    window.openBusiness =
        function (id) {

            /*
             * Reload the business list and
             * find the requested business.
             */

            fetch(
                BUSINESSES_SUPABASE_URL +
                "/rest/v1/businesses?select=*",
                {
                    method: "GET",
                    headers: getHeaders(false)
                }
            )
            .then(function (response) {

                if (!response.ok) {
                    throw new Error(
                        "Could not load business."
                    );
                }

                return response.json();

            })
            .then(function (businesses) {

                openBusiness(
                    id,
                    businesses
                );

            })
            .catch(function (error) {

                console.error(
                    "LosOja: Could not open business:",
                    error
                );

                notify(
                    "Could not load business details."
                );

            });

        };


    window.loadBusinesses =
        loadBusinesses;


    window.addBusiness =
        addBusiness;


    /* =====================================================
       INITIALIZATION
    ===================================================== */

    document.addEventListener(
        "DOMContentLoaded",
        function () {

            setupAddBusinessButtons();

            setupAddBusinessForm();

            loadBusinesses();

        }
    );


})();
