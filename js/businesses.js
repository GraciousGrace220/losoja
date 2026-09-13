```javascript
/*
=========================================================
LosOja - Businesses Loader
js/businesses.js

Handles:
- Loading businesses from Supabase
- Displaying business cards
- Supporting both businessGrid and businessesGrid
- Search/filter compatibility
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

    function loadBusinesses() {

        const grid = getBusinessGrid();

        if (!grid) {

            console.error(
                "LosOja: Business grid not found. " +
                "Expected #businessesGrid or #businessGrid."
            );

            return;
        }


        grid.innerHTML = `
            <div class="loading-message">
                Loading businesses...
            </div>
        `;


        const endpoint =
            SUPABASE_URL +
            "/rest/v1/businesses" +
            "?select=id,name,category,location,description,phone,image_url,created_at" +
            "&order=created_at.desc";


        fetch(endpoint, {

            method: "GET",

            headers: {
                "apikey": SUPABASE_KEY,
                "Accept": "application/json"
            }

        })

        .then(function (response) {

            if (!response.ok) {

                throw new Error(
                    "Supabase returned HTTP " +
                    response.status
                );
            }

            return response.json();

        })

        .then(function (businesses) {

            console.log(
                "LosOja businesses loaded:",
                businesses
            );


            if (!Array.isArray(businesses)) {

                throw new Error(
                    "Supabase did not return a business list."
                );
            }


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

                return;
            }


            grid.innerHTML =
                businesses.map(function (business) {

                    const name =
                        business.name ||
                        "Unnamed Business";

                    const category =
                        business.category ||
                        "Business";

                    const location =
                        business.location ||
                        "Nigeria";

                    const description =
                        business.description ||
                        "Discover this business on LosOja.";

                    const icon =
                        getCategoryIcon(category);


                    let imageHTML = `
                        <div class="business-image">
                            <span aria-hidden="true">
                                ${icon}
                            </span>
                        </div>
                    `;


                    if (business.image_url) {

                        imageHTML = `
                            <div class="business-image">

                                <img
                                    src="${escapeHTML(
                                        business.image_url
                                    )}"
                                    alt="${escapeHTML(name)}"
                                    loading="lazy"
                                    onerror="
                                        this.style.display='none';
                                        this.parentElement
                                            .querySelector('span')
                                            .style.display='block';
                                    "
                                >

                                <span
                                    aria-hidden="true"
                                    style="display:none;"
                                >
                                    ${icon}
                                </span>

                            </div>
                        `;
                    }


                    return `
                        <article
                            class="business-card"
                            data-business-id="${escapeHTML(
                                business.id
                            )}"
                            data-name="${escapeHTML(name)}"
                            data-category="${escapeHTML(category)}"
                            data-location="${escapeHTML(location)}"
                        >

                            ${imageHTML}


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


                                <p class="business-description">
                                    ${escapeHTML(description)}
                                </p>


                                ${
                                    business.phone
                                    ? `
                                        <p class="business-phone">
                                            📞
                                            ${escapeHTML(
                                                business.phone
                                            )}
                                        </p>
                                      `
                                    : ""
                                }


                                <div class="business-card-actions">

                                    <button
                                        type="button"
                                        class="btn btn-primary"
                                        onclick="
                                            window.viewBusiness &&
                                            window.viewBusiness(
                                                '${escapeHTML(
                                                    business.id
                                                )}'
                                            );
                                        "
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
            Make businesses available globally
            -------------------------------------------------
            */

            window.losojaBusinesses =
                businesses;


            /*
            -------------------------------------------------
            Notify other LosOja scripts
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

        })

        .catch(function (error) {

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
                        onclick="loadBusinesses()"
                        style="margin-top:15px;"
                    >
                        Try Again
                    </button>

                </div>
            `;
        });
    }


    /* =====================================================
       SEARCH / FILTER
    ===================================================== */

    function filterBusinesses(searchText) {

        const grid = getBusinessGrid();

        if (!grid) return;


        const cards =
            grid.querySelectorAll(".business-card");


        const search =
            String(searchText || "")
                .trim()
                .toLowerCase();


        let visibleCount = 0;


        cards.forEach(function (card) {

            const name =
                card.dataset.name || "";

            const category =
                card.dataset.category || "";

            const location =
                card.dataset.location || "";


            const matches =
                !search ||
                name.toLowerCase().includes(search) ||
                category.toLowerCase().includes(search) ||
                location.toLowerCase().includes(search);


            card.style.display =
                matches ? "" : "flex";


            if (matches) {
                visibleCount++;
            }
        });


        let noResults =
            grid.querySelector(".search-no-results");


        if (visibleCount === 0 && cards.length > 0) {

            if (!noResults) {

                noResults =
                    document.createElement("div");

                noResults.className =
                    "no-results search-no-results";

                noResults.innerHTML = `
                    <h3>No matching businesses</h3>
                    <p>
                        Try another business name,
                        category, or location.
                    </p>
                `;

                grid.appendChild(noResults);
            }

            noResults.style.display = "block";

        } else if (noResults) {

            noResults.style.display = "none";
        }
    }


    /* =====================================================
       CATEGORY FILTER
    ===================================================== */

    function filterByCategory(category) {

        const grid = getBusinessGrid();

        if (!grid) return;


        const cards =
            grid.querySelectorAll(".business-card");


        const selected =
            String(category || "")
                .trim()
                .toLowerCase();


        cards.forEach(function (card) {

            const cardCategory =
                String(
                    card.dataset.category || ""
                ).toLowerCase();


            if (
                !selected ||
                selected === "all" ||
                cardCategory === selected
            ) {

                card.style.display = "flex";

            } else {

                card.style.display = "none";
            }
        });
    }


    /* =====================================================
       PUBLIC FUNCTIONS
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

    document.addEventListener(
        "DOMContentLoaded",
        function () {

            loadBusinesses();

        }
    );

})();
```
