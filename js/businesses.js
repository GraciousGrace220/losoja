/*
========================================
LosOja - Simple Businesses Loader
========================================
*/

(function () {

    "use strict";

    const SUPABASE_URL =
        "https://ycxshwgeebskdozmornh.supabase.co";

    const SUPABASE_KEY =
        "sb_publishable_jFSLacwNupO6T8EnSqb2bw_bZmy7rVe";


    function loadBusinesses() {

        const grid =
            document.getElementById("businessGrid");

        if (!grid) {
            console.error("LosOja: businessGrid not found.");
            return;
        }

        grid.innerHTML = `
            <div class="loading-message">
                Loading businesses...
            </div>
        `;


        fetch(
            SUPABASE_URL +
            "/rest/v1/businesses?select=id,name,category,location",
            {
                method: "GET",

                headers: {
                    "apikey": SUPABASE_KEY,
                    "Accept": "application/json"
                }
            }
        )
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
                "LosOja businesses:",
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
                        No businesses found.
                    </div>
                `;

                return;
            }


            grid.innerHTML = businesses.map(
                function (business) {

                    return `
                        <div class="business-card">

                            <div class="business-card-content">

                                <span class="business-category">
                                    ${escapeHTML(
                                        business.category || "Business"
                                    )}
                                </span>

                                <h3>
                                    ${escapeHTML(
                                        business.name || "Unnamed Business"
                                    )}
                                </h3>

                                <p>
                                    📍 ${escapeHTML(
                                        business.location || "Nigeria"
                                    )}
                                </p>

                            </div>

                        </div>
                    `;
                }
            ).join("");

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
                        ${escapeHTML(error.message)}
                    </p>

                </div>
            `;
        });
    }


    function escapeHTML(value) {

        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    window.loadBusinesses =
        loadBusinesses;


    document.addEventListener(
        "DOMContentLoaded",
        function () {
            loadBusinesses();
        }
    );

})();
