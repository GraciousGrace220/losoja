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
        String(
            business.image_url ||
            business.image ||
            business.photo_url ||
            ""
        ).trim();


    let imageHTML = "";


    if (image) {

        imageHTML = `
            <div
                class="business-card-image"
                style="
                    width:100%;
                    height:220px;
                    overflow:hidden;
                    background:#f3f4f6;
                    border-radius:12px 12px 0 0;
                    position:relative;
                "
            >
                <img
                    src="${escapeHTML(image)}"
                    alt="${name}"
                    loading="lazy"
                    style="
                        width:100%;
                        height:100%;
                        display:block;
                        object-fit:cover;
                    "
                >
            </div>
        `;

    } else {

        imageHTML = `
            <div
                class="business-card-image"
                style="
                    width:100%;
                    height:220px;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    background:#f3f4f6;
                    border-radius:12px 12px 0 0;
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


    /* =====================================================
       SAVED BUTTON
    ===================================================== */

    let isSaved = false;

    try {

        const savedItems =
            JSON.parse(
                localStorage.getItem(
                    "losoja_saved_items"
                ) || "[]"
            );

        isSaved =
            Array.isArray(savedItems) &&
            savedItems.some(function (item) {

                return (
                    item &&
                    item.type === "business" &&
                    String(item.id) ===
                    String(business.id)
                );

            });

    } catch (error) {

        console.warn(
            "LosOja: Could not read saved items.",
            error
        );

    }


    const saveButtonHTML = `
        <button
            type="button"
            class="business-save-button"
            data-business-id="${id}"
            aria-label="${isSaved ? "Remove from saved" : "Save business"}"
            title="${isSaved ? "Remove from saved" : "Save business"}"
            onclick="event.stopPropagation(); window.toggleSavedBusiness && window.toggleSavedBusiness('${id}')"
            style="
                position:absolute;
                top:12px;
                right:12px;
                width:42px;
                height:42px;
                border:0;
                border-radius:50%;
                background:#ffffff;
                box-shadow:0 2px 8px rgba(0,0,0,0.15);
                cursor:pointer;
                font-size:21px;
                display:flex;
                align-items:center;
                justify-content:center;
                z-index:5;
            "
        >
            ${isSaved ? "❤️" : "♡"}
        </button>
    `;


    /*
       Add the Save button over the business image.
       This does NOT change the existing business card click.
    */

    imageHTML =
        imageHTML.replace(
            "</div>",
            saveButtonHTML + "</div>"
        );


    return `
        <article
    class="business-card"
    data-business-id="${id}"
    onclick="window.openBusiness('${id}')"
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
   SAVE / UNSAVE BUSINESS
===================================================== */

function toggleSavedBusiness(businessId) {

    const storageKey =
        "losoja_saved_items";

    let savedItems = [];

    try {

        savedItems =
            JSON.parse(
                localStorage.getItem(
                    storageKey
                ) || "[]"
            );

        if (!Array.isArray(savedItems)) {
            savedItems = [];
        }

    } catch (error) {

        console.error(
            "LosOja: Could not read saved items.",
            error
        );

        savedItems = [];
    }


    const existingIndex =
        savedItems.findIndex(function (item) {

            return (
                item &&
                item.type === "business" &&
                String(item.id) ===
                String(businessId)
            );

        });


    if (existingIndex !== -1) {

        savedItems.splice(
            existingIndex,
            1
        );

        console.log(
            "LosOja: Business removed from saved:",
            businessId
        );

    } else {

        const business =
            businesses.find(function (item) {

                return String(item.id) ===
                    String(businessId);

            });


        if (!business) {

            console.warn(
                "LosOja: Cannot save business. Business not found:",
                businessId
            );

            return;
        }


        savedItems.push({

            type: "business",

            id: String(
                business.id
            ),

            name:
                business.name ||
                "Unnamed Business",

            category:
                business.category ||
                "Business",

            location:
                business.location ||
                business.address ||
                "Nigeria",

            phone:
                business.phone ||
                "",

            description:
                business.description ||
                "",

            image:
                business.image_url ||
                business.image ||
                business.photo_url ||
                ""

        });


        console.log(
            "LosOja: Business saved:",
            businessId
        );
    }


    try {

        localStorage.setItem(
            storageKey,
            JSON.stringify(savedItems)
        );

    } catch (error) {

        console.error(
            "LosOja: Could not save favorites.",
            error
        );

        return;
    }


    /*
       Re-render the business cards
       so the heart changes immediately.
    */

    renderBusinesses(
        businesses
    );


    /*
       If the Saved section renderer
       exists later, update it too.
    */

    if (
        typeof window.renderSavedItems ===
        "function"
    ) {

        window.renderSavedItems();

    }
}


window.toggleSavedBusiness =
    toggleSavedBusiness;
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

        console.log(
            "LosOja: Business card clicked:",
            businessId
        );

        /*
        -----------------------------------------------------
        Find the business
        -----------------------------------------------------
        */

        const business =
            businesses.find(
                function (item) {

                    return String(item.id) ===
                        String(businessId);

                }
            );

        if (!business) {

            console.error(
                "LosOja: Business not found:",
                businessId,
                businesses
            );

            if (
                typeof window.showToast ===
                "function"
            ) {

                window.showToast(
                    "Business could not be found."
                );

            }

            return;
        }

        /*
        -----------------------------------------------------
        Save selected business globally
        -----------------------------------------------------
        */

        window.losojaSelectedBusiness =
            business;

        console.log(
            "LosOja: Opening business:",
            business
        );

        /*
        -----------------------------------------------------
        Open Business Details
        -----------------------------------------------------
        */

        if (
            typeof window.showBusinessDetails ===
            "function"
        ) {

            try {

                const result =
                    window.showBusinessDetails(
                        business
                    );

                /*
                 * showBusinessDetails is async.
                 * Catch rejected promises too.
                 */

                if (
                    result &&
                    typeof result.catch ===
                    "function"
                ) {

                    result.catch(
                        function (error) {

                            console.error(
                                "LosOja: Business details error:",
                                error
                            );

                            if (
                                typeof window.showToast ===
                                "function"
                            ) {

                                window.showToast(
                                    "Could not open business details."
                                );
                            }

                        }
                    );
                }

            } catch (error) {

                console.error(
                    "LosOja: Business details crashed:",
                    error
                );

                if (
                    typeof window.showToast ===
                    "function"
                ) {

                    window.showToast(
                        "Could not open business details."
                    );
                }
            }

            return;
        }

        /*
        -----------------------------------------------------
        Fallback: open the modal directly if
        showBusinessDetails is not available.
        -----------------------------------------------------
        */

        const modal =
            document.getElementById(
                "businessDetailsModal"
            );

        const content =
            document.getElementById(
                "businessDetailsContent"
            );

        if (
            modal &&
            content
        ) {

            const safe =
                function (value) {

                    return String(
                        value ?? ""
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

                };

            content.innerHTML = `

                <div class="business-details">

                    <h2>
                        ${safe(
                            business.name ||
                            "Business"
                        )}
                    </h2>

                    <p>
                        <strong>Category:</strong>
                        ${safe(
                            business.category ||
                            "Business"
                        )}
                    </p>

                    <p>
                        📍
                        ${safe(
                            business.location ||
                            "Nigeria"
                        )}
                    </p>

                    ${
                        business.phone
                            ? `
                                <p>
                                    📞
                                    ${safe(
                                        business.phone
                                    )}
                                </p>
                              `
                            : ""
                    }

                    <p>
                        ${safe(
                            business.description ||
                            "No description provided."
                        )}
                    </p>

                    <button
                        type="button"
                        onclick="
                            if (
                                typeof window.showBusinessDetails ===
                                'function'
                            ) {
                                window.showBusinessDetails(
                                    window.losojaSelectedBusiness
                                );
                            }
                        "
                        style="
                            width:100%;
                            padding:14px;
                            margin-top:15px;
                            border:0;
                            border-radius:10px;
                            background:#087a3e;
                            color:#ffffff;
                            font-weight:700;
                            cursor:pointer;
                        "
                    >
                        View Business Details
                    </button>

                </div>

            `;

            modal.classList.add("active");

            modal.classList.remove("hidden");

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

            return;
        }

        /*
        -----------------------------------------------------
        Nothing available
        -----------------------------------------------------
        */

        console.error(
            "LosOja: Business Details modal was not found."
        );

    }


    /* =====================================================
       PUBLIC FUNCTIONS
    ===================================================== */

   window.loadBusinesses = loadBusinesses;
window.searchBusinesses = searchBusinesses;
window.filterBusinessesByCategory = filterByCategory;
window.filterByCategory = filterByCategory;
window.openBusiness = openBusiness;
window.renderBusinesses = renderBusinesses;
    /* =====================================================
       FIND NEARBY BUSINESSES
    ===================================================== */

    function getDistanceInKm(
        latitude1,
        longitude1,
        latitude2,
        longitude2
    ) {

        const earthRadiusKm = 6371;

        const lat1 =
            latitude1 * Math.PI / 180;

        const lat2 =
            latitude2 * Math.PI / 180;

        const differenceLat =
            (latitude2 - latitude1) *
            Math.PI / 180;

        const differenceLon =
            (longitude2 - longitude1) *
            Math.PI / 180;

        const a =
            Math.sin(differenceLat / 2) *
            Math.sin(differenceLat / 2) +
            Math.cos(lat1) *
            Math.cos(lat2) *
            Math.sin(differenceLon / 2) *
            Math.sin(differenceLon / 2);

        const c =
            2 *
            Math.atan2(
                Math.sqrt(a),
                Math.sqrt(1 - a)
            );

        return earthRadiusKm * c;
    }


    function findNearbyBusinesses(
        maximumDistanceKm = 10
    ) {

        const savedLocation =
            localStorage.getItem(
                "losoja_user_location"
            );

        if (!savedLocation) {

            console.warn(
                "LosOja: No saved user location."
            );

            return [];

        }

        let userLocation;

        try {

            userLocation =
                JSON.parse(savedLocation);

        } catch (error) {

            console.error(
                "LosOja: Invalid saved location.",
                error
            );

            return [];

        }

        const userLatitude =
            Number(
                userLocation.latitude
            );

        const userLongitude =
            Number(
                userLocation.longitude
            );

        if (
            !Number.isFinite(userLatitude) ||
            !Number.isFinite(userLongitude)
        ) {

            return [];

        }

        const nearbyBusinesses =
            businesses
                .filter(function (business) {

                    const latitude =
                        Number(
                            business.latitude
                        );

                    const longitude =
                        Number(
                            business.longitude
                        );

                    if (
                        !Number.isFinite(latitude) ||
                        !Number.isFinite(longitude)
                    ) {

                        return false;

                    }

                    const distance =
                        getDistanceInKm(
                            userLatitude,
                            userLongitude,
                            latitude,
                            longitude
                        );

                    business.distance_km =
                        distance;

                    return (
                        distance <=
                        maximumDistanceKm
                    );

                })
                .sort(function (a, b) {

                    return (
                        a.distance_km -
                        b.distance_km
                    );

                });

        return nearbyBusinesses;
    }


    window.findNearbyBusinesses =
        findNearbyBusinesses;
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
