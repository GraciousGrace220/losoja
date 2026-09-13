```javascript
/*
=========================================================
LosOja - Businesses Loader
js/businesses.js

Launch-safe version:
- Loads businesses from Supabase
- Uses only core confirmed fields
- Works with businessesGrid or businessGrid
- Safe HTML output
- Search/filter compatible
=========================================================
*/

(function () {

    "use strict";


    /* =====================================================
       SUPABASE
    ===================================================== */

    const SUPABASE_URL =
        "https://ycxshwgeebskdozmornh.supabase.co";

    const SUPABASE_KEY =
        "sb_publishable_jFSLacwNupO6T8EnSqb2bw_bZmy7rVe";


    /* =====================================================
       FIND BUSINESS GRID
    ===================================================== */

    function getBusinessGrid() {

        return (
            document.getElementById("businessesGrid") ||
            document.getElementById("businessGrid")
        );

    }


    /* =====================================================
       ESCAPE HTML
    ===================================================== */

    function escapeHTML(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    /* =====================================================
       CATEGORY ICON
    ===================================================== */

    function getCategoryIcon(category) {

        const value =
            String(category || "").toLowerCase();

        if (value.includes("food")) return "🍴";
        if (value.includes("fashion")) return "👗";
        if (value.includes("technology")) return "💻";
        if (value.includes("beauty")) return "💄";
        if (value.includes("health")) return "🏥";
        if (value.includes("education")) return "🎓";
        if (value.includes("service")) return "🛠️";
        if (value.includes("shopping")) return "🛍️";

        return "🏪";

    }


    /* =====================================================
       LOAD BUSINESSES
    ===================================================== */

    async function loadBusinesses() {

        const grid = getBusinessGrid();


        if (!grid) {

            console.error(
                "LosOja: Business grid not found."
            );

            return;

        }


        /* Show loading */

        grid.innerHTML = `
            <div class="loading-message">
                Loading businesses...
            </div>
        `;


        try {

            /*
            -------------------------------------------------
            IMPORTANT:
            Only request the core columns here.

            This prevents one missing optional column
            from breaking the entire Businesses section.
            -------------------------------------------------
            */

            const endpoint =
                SUPABASE_URL +
                "/rest/v1/businesses" +
                "?select=id,name,category,location";


            console.log(
                "LosOja: Loading businesses from Supabase..."
            );


            const response =
                await fetch(
                    endpoint,
                    {
                        method: "GET",

                        headers: {
                            "apikey": SUPABASE_KEY,
                            "Accept": "application/json"
                        }
                    }
                );


            console.log(
                "LosOja: Supabase response:",
                response.status
            );


            if (!response.ok) {

                const errorText =
                    await response.text();

                console.error(
                    "LosOja Supabase error:",
                    errorText
                );

                throw new Error(
                    "Supabase HTTP " +
                    response.status
                );

            }


            const businesses =
                await response.json();


            console.log(
                "LosOja businesses loaded:",
                businesses
            );


            if (!Array.isArray(businesses)) {

                throw new Error(
                    "Invalid businesses response."
                );

            }


            /*
            -------------------------------------------------
            NO BUSINESSES
            -------------------------------------------------
            */

            if (businesses.length === 0) {

                grid.innerHTML = `
                    <div class="no-results">
                        <h3>No businesses found</h3>

                        <p>
                            Be the first to add a business
                            to LosOja.
                        </p>
                    </div>
                `;

                window.losojaBusinesses = [];

                return;

            }


            /*
            -------------------------------------------------
            BUILD BUSINESS CARDS
            -------------------------------------------------
            */

            grid.innerHTML =
                businesses.map(function (business) {


                    const id =
                        business.id || "";


                    const name =
                        business.name ||
                        "Unnamed Business";


                    const category =
                        business.category ||
                        "Business";


                    const location =
                        business.location ||
                        "Nigeria";


                    const icon =
                        getCategoryIcon(category);


                    return `
                        <article
                            class="business-card"
                            data-business-id="${escapeHTML(id)}"
                            data-name="${escapeHTML(name)}"
                            data-category="${escapeHTML(category)}"
                            data-location="${escapeHTML(location)}"
                        >

                            <div class="business-image">

                                <span
                                    aria-hidden="true"
                                    style="
                                        font-size:42px;
                                        display:block;
                                        text-align:center;
                                    "
                                >
                                    ${icon}
                                </span>

                            </div>


                            <div class="business-card-content">

                                <span class="business-card-category">
                                    ${escapeHTML(category)}
                                </span>


                                <h3>
                                    ${escapeHTML(name)}
                                </h3>


                                <p class="business-location">
                                    📍
                                    ${escapeHTML(location)}
                                </p>


                                <div class="business-card-actions">

                                    <button
                                        type="button"
                                        class="btn btn-primary"
                                        data-business-id="${escapeHTML(id)}"
                                    >
                                        View Business
                                    </button>

                                </div>

                            </div>

                        </article>
                    `;

                }).join("");


            /*
            -------------------------------------------------
            STORE BUSINESSES GLOBALLY
            -------------------------------------------------
            */

            window.losojaBusinesses =
                businesses;


            /*
            -------------------------------------------------
            VIEW BUSINESS BUTTONS
            -------------------------------------------------
            */

            grid
                .querySelectorAll(
                    "[data-business-id]"
                )
                .forEach(function (button) {

                    /*
                    Only attach to actual buttons.
                    */

                    if (
                        button.tagName !== "BUTTON"
                    ) {
                        return;
                    }


                    button.addEventListener(
                        "click",
                        function () {

                            const id =
                                this.dataset.businessId;


                            if (
                                typeof window.viewBusiness ===
                                "function"
                            ) {

                                window.viewBusiness(id);

                            } else {

                                console.log(
                                    "LosOja: View Business clicked:",
                                    id
                                );

                            }

                        }
                    );

                });


            /*
            -------------------------------------------------
            NOTIFY OTHER SCRIPTS
            -------------------------------------------------
            */

            document.dispatchEvent(
                new CustomEvent(
                    "losojaBusinessesLoaded",
                    {
                        detail: businesses
                    }
                )
            );


            console.log(
                "LosOja: Businesses displayed successfully."
            );


        } catch (error) {

            console.error(
                "LosOja businesses error:",
                error
            );


            grid.innerHTML = `
                <div class="error-message">

                    <h3>
                        Unable to load businesses
                    </h3>

                    <p>
                        We couldn't load the businesses
                        right now.
                    </p>

                    <button
                        type="button"
                        class="btn btn-primary"
                        id="losojaRetryBusinesses"
                        style="margin-top:15px;"
                    >
                        Try Again
                    </button>

                </div>
            `;


            const retryButton =
                document.getElementById(
                    "losojaRetryBusinesses"
                );


            if (retryButton) {

                retryButton.addEventListener(
                    "click",
                    loadBusinesses
                );

            }

        }

    }


    /* =====================================================
       SEARCH
    ===================================================== */

    function filterBusinesses(searchText) {

        const grid =
            getBusinessGrid();


        if (!grid) return;


        const cards =
            grid.querySelectorAll(
                ".business-card"
            );


        const search =
            String(searchText || "")
                .trim()
                .toLowerCase();


        let visibleCount = 0;


        cards.forEach(function (card) {

            const name =
                String(
                    card.dataset.name || ""
                ).toLowerCase();


            const category =
                String(
                    card.dataset.category || ""
                ).toLowerCase();


            const location =
                String(
                    card.dataset.location || ""
                ).toLowerCase();


            const matches =
                !search ||
                name.includes(search) ||
                category.includes(search) ||
                location.includes(search);


            card.style.display =
                matches ? "" : "none";


            if (matches) {
                visibleCount++;
            }

        });


        let noResults =
            grid.querySelector(
                ".search-no-results"
            );


        if (
            visibleCount === 0 &&
            cards.length > 0
        ) {

            if (!noResults) {

                noResults =
                    document.createElement(
                        "div"
                    );

                noResults.className =
                    "no-results search-no-results";

                noResults.innerHTML = `
                    <h3>
                        No matching businesses
                    </h3>

                    <p>
                        Try another business name,
                        category, or location.
                    </p>
                `;

                grid.appendChild(noResults);

            }


            noResults.style.display =
                "block";

        } else if (noResults) {

            noResults.style.display =
                "none";

        }

    }


    /* =====================================================
       CATEGORY FILTER
    ===================================================== */

    function filterByCategory(category) {

        const grid =
            getBusinessGrid();


        if (!grid) return;


        const cards =
            grid.querySelectorAll(
                ".business-card"
            );


        const selected =
            String(category || "")
                .trim()
                .toLowerCase();


        cards.forEach(function (card) {

            const cardCategory =
                String(
                    card.dataset.category || ""
                ).toLowerCase();


            const matches =
                !selected ||
                selected === "all" ||
                cardCategory === selected;


            card.style.display =
                matches ? "" : "none";

        });

    }


    /* =====================================================
       GLOBAL FUNCTIONS
    ===================================================== */

    window.loadBusinesses =
        loadBusinesses;

    window.filterBusinesses =
        filterBusinesses;

    window.filterByCategory =
        filterByCategory;


    /* =====================================================
       START
    ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            loadBusinesses
        );

    } else {

        loadBusinesses();

    }


})();
```
