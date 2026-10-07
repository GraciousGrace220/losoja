/*
=========================================================
LOSOJA - BUSINESSES
js/businesses.js

Handles:
- Supabase connection
- Loading businesses
- Displaying business cards
- Search
- Category filtering
- Business details
- Images
- Safe HTML output
=========================================================
*/

(function () {

    "use strict";


    /* =====================================================
       SUPABASE
    ===================================================== */

    const SUPABASE_URL =
        "https://ycxshwgeebskdozmornh.supabase.co";

    /*
       KEEP YOUR EXISTING SUPABASE ANON KEY HERE.
       Do not remove the quotation marks.
    */

    const SUPABASE_KEY =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljeHNod2dlZWJza2Rvem1vcm5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzMDY0NjUsImV4cCI6MjEwMzg4MjQ2NX0.tMl7wILdVDhu0RWFaG_84ngJEryLt2c5cB8MEKW3kfU";


    /* =====================================================
       SETTINGS
    ===================================================== */

    const REQUEST_TIMEOUT = 15000;


    /* =====================================================
       ELEMENT
    ===================================================== */

    const businessGrid =
        document.getElementById("businessGrid");


    /* =====================================================
       DATA
    ===================================================== */

    let businesses = [];

    let businessesLoaded = false;

    let businessesLoading = false;

    let loadingPromise = null;


    /* =====================================================
       HTML SAFETY
    ===================================================== */

    function escapeHTML(value) {

        if (
            value === null ||
            value === undefined
        ) {
            return "";
        }

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    /* =====================================================
       LOADING
    ===================================================== */

    function showLoading() {

        if (!businessGrid) {
            return;
        }

        businessGrid.innerHTML = `
            <div class="loading-card">
                <div class="loading-spinner"></div>
                <p>Loading businesses...</p>
            </div>
        `;
    }


    /* =====================================================
       ERROR
    ===================================================== */

    function showError(message) {

        if (!businessGrid) {
            return;
        }

        businessGrid.innerHTML = `
            <div class="loading-card">

                <div
                    style="
                        font-size:32px;
                        margin-bottom:8px;
                    "
                >
                    ⚠️
                </div>

                <p>
                    ${escapeHTML(message)}
                </p>

                <button
                    type="button"
                    id="retryBusinessesBtn"
                    style="
                        margin-top:12px;
                        padding:10px 18px;
                        border:0;
                        border-radius:9px;
                        background:#087a3e;
                        color:#ffffff;
                        font-weight:700;
                        cursor:pointer;
                    "
                >
                    Try Again
                </button>

            </div>
        `;

        const retryButton =
            document.getElementById(
                "retryBusinessesBtn"
            );

        if (retryButton) {

            retryButton.addEventListener(
                "click",
                function () {
                    loadBusinesses(true);
                }
            );
        }
    }


    /* =====================================================
       GET BUSINESSES FROM SUPABASE
    ===================================================== */

    async function getBusinesses() {

        if (
            !SUPABASE_KEY ||
            SUPABASE_KEY ===
                "PASTE_YOUR_EXISTING_KEY_HERE"
        ) {

            console.error(
                "LosOja: Supabase key has not been added."
            );

            showError(
                "Supabase key is missing."
            );

            return [];
        }

const url =
    SUPABASE_URL +
    "/rest/v1/businesses" +
    "?select=*";
        const controller =
            new AbortController();


        const timeout =
            setTimeout(
                function () {
                    controller.abort();
                },
                REQUEST_TIMEOUT
            );


        try {

            const response =
                await fetch(
                    url,
                    {
                        method: "GET",

                        headers: {

                            "apikey":
                                SUPABASE_KEY,

                            "Authorization":
                                "Bearer " +
                                SUPABASE_KEY,

                            "Content-Type":
                                "application/json",

                            "Accept":
                                "application/json"
                        },

                        signal:
                            controller.signal
                    }
                );


            clearTimeout(timeout);


            if (!response.ok) {

                const errorText =
                    await response.text();

                console.error(
                    "LosOja Supabase error:",
                    response.status,
                    errorText
                );


                if (response.status === 401) {

                    showError(
                        "Supabase key is not valid."
                    );

                } else if (response.status === 403) {

                    showError(
                        "Supabase denied access to the businesses."
                    );

                } else {

                    showError(
                        "Supabase error " +
                        response.status +
                        "."
                    );
                }

                return [];
            }


            const data =
                await response.json();


            if (!Array.isArray(data)) {

                console.error(
                    "LosOja: unexpected Supabase data:",
                    data
                );

                showError(
                    "The business data could not be read."
                );

                return [];
            }


            console.log(
                "LosOja: businesses loaded:",
                data.length
            );


            return data;

        } catch (error) {

            clearTimeout(timeout);


            console.error(
                "LosOja: business loading error:",
                error
            );


            if (
                error.name ===
                "AbortError"
            ) {

                showError(
                    "Loading took too long. Please try again."
                );

            } else {

                showError(
                    "Could not connect to LosOja."
                );
            }


            return [];
        }
    }


    /* =====================================================
       LOAD BUSINESSES
    ===================================================== */

  function loadBusinesses(forceReload) {

    if (
        businessesLoaded &&
        !forceReload
    ) {
        renderBusinesses(businesses);

        return Promise.resolve(businesses);
    }

    if (
        businessesLoading &&
        loadingPromise
    ) {
        return loadingPromise;
    }

    if (!businessGrid) {
        console.error(
            "LosOja: businessGrid was not found."
        );

        return Promise.resolve([]);
    }

    businessesLoading = true;

    showLoading();

    loadingPromise = getBusinesses()
        .then(function (data) {

            /*
             * If Supabase returned an error,
             * getBusinesses() returns null.
             *
             * Do NOT replace the error message
             * with "No businesses found."
             */
            if (data === null) {
                businessesLoaded = false;
                return [];
            }

            businesses = Array.isArray(data)
                ? data
                : [];

            businessesLoaded = true;

            window.losojaBusinesses = businesses;

            renderBusinesses(businesses);

            return businesses;
        })
        .catch(function (error) {

            console.error(
                "LosOja loading error:",
                error
            );

            businessesLoaded = false;

            return [];
        })
        .finally(function () {

            businessesLoading = false;

            loadingPromise = null;
        });

    return loadingPromise;
}


    /* =====================================================
       RENDER BUSINESSES
    ===================================================== */

    function renderBusinesses(list) {

        if (!businessGrid) {
            return;
        }


        if (
            !Array.isArray(list) ||
            list.length === 0
        ) {

            businessGrid.innerHTML = `
                <div class="loading-card">

                    <div
                        style="
                            font-size:32px;
                            margin-bottom:8px;
                        "
                    >
                        🏪
                    </div>

                    <p>
                        No businesses found.
                    </p>

                </div>
            `;

            return;
        }


        businessGrid.innerHTML =
            list
                .map(createBusinessCard)
                .join("");
    }


    /* =====================================================
       BUSINESS CARD
    ===================================================== */

    function createBusinessCard(business) {

        const id =
            escapeHTML(
                business.id
            );


        const name =
            escapeHTML(
                business.name ||
                "Unnamed Business"
            );


        const category =
            escapeHTML(
                business.category ||
                "Business"
            );


        const location =
            escapeHTML(
                business.location ||
                business.address ||
                "Nigeria"
            );


        const phone =
            escapeHTML(
                business.phone ||
                ""
            );


        const description =
            escapeHTML(
                business.description ||
                ""
            );


        const image =
            business.image_url ||
            business.image ||
            business.photo_url ||
            "";


        let imageHTML = "";


        if (image) {

            imageHTML = `
                <img
                    class="business-card-image"
                    src="${escapeHTML(image)}"
                    alt="${name}"
                    loading="lazy"
                    onerror="this.style.display='none'"
                >
            `;

        } else {

            imageHTML = `
                <div
                    class="business-card-image"
                    style="
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        font-size:42px;
                    "
                >
                    🏪
                </div>
            `;
        }


        let ratingHTML = "";


        if (
            business.rating !== null &&
            business.rating !== undefined &&
            business.rating !== ""
        ) {

            const rating =
                Number(
                    business.rating
                );


            if (!Number.isNaN(rating)) {

                const reviews =
                    Number(
                        business.reviews_count ||
                        business.review_count ||
                        business.total_reviews ||
                        0
                    );


                ratingHTML = `
                    <p
                        style="
                            margin-top:7px;
                            color:#087a3e;
                            font-weight:700;
                        "
                    >
                        ⭐ ${rating.toFixed(1)}
                        ${
                            reviews > 0
                                ? ` (${reviews} reviews)`
                                : ""
                        }
                    </p>
                `;
            }
        }


        return `
            <article
                class="business-card"
                data-business-id="${id}"
                onclick="openBusiness('${id}')"
                style="cursor:pointer;"
            >

                ${imageHTML}

                <div
                    class="business-card-content"
                >

                    <h3>
                        ${name}
                    </h3>

                    <p>
                        ${category}
                    </p>

                    <p>
                        📍 ${location}
                    </p>

                    ${
                        phone
                            ? `
                                <p>
                                    📞 ${phone}
                                </p>
                              `
                            : ""
                    }

                    ${
                        description
                            ? `
                                <p>
                                    ${description}
                                </p>
                              `
                            : ""
                    }

                    ${ratingHTML}

                    <span
                        class="business-category"
                    >
                        ${category}
                    </span>

                </div>

            </article>
        `;
    }


    /* =====================================================
       SEARCH
    ===================================================== */

    function searchBusinesses(
        searchTerm,
        location
    ) {

        searchTerm =
            String(
                searchTerm || ""
            )
            .trim()
            .toLowerCase();


        location =
            String(
                location || ""
            )
            .trim()
            .toLowerCase();


        /*
           If the user searches before
           businesses finish loading,
           wait for the same request.
        */

        if (
            !businessesLoaded &&
            businessesLoading
        ) {

            if (loadingPromise) {

                loadingPromise.then(
                    function () {

                        searchBusinesses(
                            searchTerm,
                            location
                        );
                    }
                );

            }

            return;
        }


        if (
            !searchTerm &&
            !location
        ) {

            renderBusinesses(
                businesses
            );

            return;
        }


        const results =
            businesses.filter(
                function (business) {

                    const searchable = [

                        business.name,

                        business.category,

                        business.location,

                        business.address,

                        business.phone,

                        business.description

                    ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();


                    const matchesSearch =
                        !searchTerm ||
                        searchable.includes(
                            searchTerm
                        );


                    const matchesLocation =
                        !location ||
                        searchable.includes(
                            location
                        );


                    return (
                        matchesSearch &&
                        matchesLocation
                    );
                }
            );


        renderBusinesses(
            results
        );
    }


    /* =====================================================
       CATEGORY FILTER
    ===================================================== */

    function filterByCategory(category) {

        category =
            String(
                category || ""
            )
            .trim()
            .toLowerCase();


        /*
           If the businesses are still loading,
           wait for that SAME request.

           Do NOT call loadBusinesses again.
        */

        if (
            !businessesLoaded
        ) {

            if (loadingPromise) {

                loadingPromise.then(
                    function () {

                        filterByCategory(
                            category
                        );
                    }
                );

            } else {

                loadBusinesses()
                    .then(
                        function () {

                            filterByCategory(
                                category
                            );
                        }
                    );
            }

            return;
        }


        /*
           Empty category = show everything.
        */

        if (!category) {

            renderBusinesses(
                businesses
            );

            return;
        }


        /*
           Filter the businesses already
           downloaded from Supabase.
        */

        const results =
            businesses.filter(
                function (business) {

                    const businessCategory =
                        String(
                            business.category ||
                            ""
                        )
                        .trim()
                        .toLowerCase();


                    return (
                        businessCategory ===
                        category
                    );
                }
            );


        renderBusinesses(
            results
        );


        /*
           Scroll to business section.
        */

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
    }


    /* =====================================================
       OPEN BUSINESS
    ===================================================== */

    function openBusiness(businessId) {

        const business =
            businesses.find(
                function (item) {

                    return String(
                        item.id
                    ) ===
                    String(
                        businessId
                    );
                }
            );


        if (!business) {

            console.warn(
                "LosOja: Business not found:",
                businessId
            );

            return;
        }


        window.losojaSelectedBusiness =
            business;


        if (
            typeof window.showBusinessDetails ===
            "function"
        ) {

            window.showBusinessDetails(
                business
            );

            return;
        }


        if (
            typeof window.openBusinessDetails ===
            "function"
        ) {

            window.openBusinessDetails(
                business
            );

            return;
        }


        if (
            typeof window.showToast ===
            "function"
        ) {

            window.showToast(
                business.name +
                " • " +
                (
                    business.location ||
                    "Nigeria"
                )
            );
        }
    }


    /* =====================================================
       PUBLIC FUNCTIONS
    ===================================================== */

    window.loadBusinesses =
        loadBusinesses;

    window.searchBusinesses =
        searchBusinesses;

    window.filterBusinessesByCategory =
        filterByCategory;

    window.filterByCategory =
        filterByCategory;

    window.openBusiness =
        openBusiness;


    /* =====================================================
       START
    ===================================================== */

    function init() {

        console.log(
            "LosOja businesses.js loaded"
        );

        loadBusinesses();
    }


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
