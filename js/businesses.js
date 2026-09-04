const SUPABASE_URL = "https://ycxshwgeebskdozmornh.supabase.co";
const SUPABASE_KEY = "sb_publishable_jFSLacwNupO6T8EnSqb2bw_bZmy7rVe";

const BUSINESSES_KEY = "losoja_businesses";

const DEFAULT_BUSINESSES = [
    {
        id: "default-1",
        ownerId: "system",
        name: "Taste Haven",
        category: "Food",
        location: "Lagos, Nigeria",
        description: "Delicious Nigerian and international meals.",
        phone: "",
        email: "",
        rating: 4.5,
        reviews: 12
    },
    {
        id: "default-2",
        ownerId: "system",
        name: "Urban Style",
        category: "Fashion",
        location: "Lagos, Nigeria",
        description: "Modern fashion and clothing.",
        phone: "",
        email: "",
        rating: 4.7,
        reviews: 8
    },
    {
        id: "default-3",
        ownerId: "system",
        name: "Tech Hub Nigeria",
        category: "Technology",
        location: "Abuja, Nigeria",
        description: "Technology products and services.",
        phone: "",
        email: "",
        rating: 4.6,
        reviews: 15
    },
    {
        id: "default-4",
        ownerId: "system",
        name: "Glow Beauty Studio",
        category: "Beauty",
        location: "Lagos, Nigeria",
        description: "Beauty and personal care services.",
        phone: "",
        email: "",
        rating: 4.8,
        reviews: 20
    }
];

function supabaseHeaders() {
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": "Bearer " + SUPABASE_KEY,
        "Content-Type": "application/json"
    };
}

/* =========================
   LOCAL STORAGE
========================= */

function getBusinesses() {
    try {
        const saved = JSON.parse(
            localStorage.getItem(BUSINESSES_KEY)
        );

        if (Array.isArray(saved) && saved.length > 0) {
            return saved;
        }
    } catch (error) {
        console.error("Could not read businesses:", error);
    }

    saveBusinesses(DEFAULT_BUSINESSES);

    return DEFAULT_BUSINESSES;
}

function saveBusinesses(businesses) {
    localStorage.setItem(
        BUSINESSES_KEY,
        JSON.stringify(businesses)
    );
}

window.getBusinesses = getBusinesses;
window.saveBusinesses = saveBusinesses;

/* =========================
   LOAD FROM SUPABASE
========================= */

async function loadBusinessesFromSupabase() {
    try {
        const response = await fetch(
            SUPABASE_URL +
            "/rest/v1/businesses?select=*&order=created_at.desc",
            {
                method: "GET",
                headers: supabaseHeaders()
            }
        );

        if (!response.ok) {
            const errorText = await response.text();

            throw new Error(
                "Supabase returned " +
                response.status +
                ": " +
                errorText
            );
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error(
                "Supabase returned an invalid response."
            );
        }

        const remoteBusinesses = data.map(function (business) {
            return {
                id: business.id,
                ownerId: business.owner_id,
                name: business.name || "",
                category: business.category || "",
                location: business.location || "",
                description: business.description || "",
                phone: business.phone || "",
                email: business.email || "",
                rating: Number(business.rating || 0),
                reviews: Number(business.reviews || 0)
            };
        });

        /*
         * Keep the sample businesses and add
         * businesses from Supabase.
         */
        const businesses = [
            ...DEFAULT_BUSINESSES,
            ...remoteBusinesses
        ];

        saveBusinesses(businesses);

        renderBusinesses(businesses);

        console.log(
            "LosOja: loaded " +
            remoteBusinesses.length +
            " businesses from Supabase."
        );

        return businesses;

    } catch (error) {
        console.error(
            "LosOja: Supabase business loading failed:",
            error
        );

        /*
         * If Supabase is temporarily unavailable,
         * keep showing the locally saved businesses.
         */
        renderBusinesses(getBusinesses());

        return getBusinesses();
    }
}

window.loadBusinessesFromSupabase =
    loadBusinessesFromSupabase;

/* =========================
   RENDER BUSINESSES
========================= */

function renderBusinesses(businesses) {
    const grid =
        document.getElementById("businessGrid");

    if (!grid) return;

    if (!businesses || businesses.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <h3>No businesses found</h3>
                <p>Try another search or category.</p>
            </div>
        `;

        return;
    }

    grid.innerHTML = businesses.map(function (business) {
        return `
            <div class="business-card">

                <div class="business-image">
                    <span>
                        ${escapeHTML(business.category)}
                    </span>
                </div>

                <div class="business-content">

                    <h3>
                        ${escapeHTML(business.name)}
                    </h3>

                    <div class="business-category">
                        ${escapeHTML(business.category)}
                    </div>

                    <div class="business-location">
                        📍 ${escapeHTML(business.location)}
                    </div>

                    <div class="rating">
                        ⭐ ${Number(
                            business.rating || 0
                        ).toFixed(1)}
                        (${Number(
                            business.reviews || 0
                        )} reviews)
                    </div>

                    <p class="business-description">
                        ${escapeHTML(
                            business.description || ""
                        )}
                    </p>

                    <div class="business-actions">

                        <button
                            type="button"
                            class="btn btn-primary"
                            data-business-id="${business.id}">
                            View Details
                        </button>

                    </div>

                </div>
            </div>
        `;
    }).join("");
}

window.renderBusinesses = renderBusinesses;

/* =========================
   SEARCH
========================= */

window.searchBusinesses = function (
    searchTerm,
    locationTerm
) {
    const businesses = getBusinesses();

    const search = String(searchTerm || "")
        .trim()
        .toLowerCase();

    const location = String(locationTerm || "")
        .trim()
        .toLowerCase();

    const filtered = businesses.filter(
        function (business) {

            const matchesSearch =
                !search ||
                String(business.name)
                    .toLowerCase()
                    .includes(search) ||
                String(business.category)
                    .toLowerCase()
                    .includes(search) ||
                String(business.description || "")
                    .toLowerCase()
                    .includes(search);

            const matchesLocation =
                !location ||
                String(business.location)
                    .toLowerCase()
                    .includes(location);

            return (
                matchesSearch &&
                matchesLocation
            );
        }
    );

    renderBusinesses(filtered);
};

/* =========================
   CATEGORY FILTER
========================= */

window.filterBusinessesByCategory =
    function (category) {

        const businesses = getBusinesses();

        if (
            !category ||
            String(category).toLowerCase() === "all"
        ) {
            renderBusinesses(businesses);
            return;
        }

        const filtered = businesses.filter(
            function (business) {

                return String(
                    business.category
                )
                    .toLowerCase()
                    .includes(
                        String(category).toLowerCase()
                    );
            }
        );

        renderBusinesses(filtered);
    };

/* =========================
   OPEN BUSINESS
========================= */

window.openBusiness = function (businessId) {

    const businesses = getBusinesses();

    const business = businesses.find(
        function (item) {
            return String(item.id) ===
                String(businessId);
        }
    );

    if (!business) return;

    const modal =
        document.getElementById("businessModal");

    if (!modal) return;

    const details =
        modal.querySelector(".business-details") ||
        modal.querySelector(".modal-content");

    if (!details) return;

    let reviewsHTML = "";

    if (
        typeof window.getBusinessReviews ===
        "function"
    ) {
        const reviews =
            window.getBusinessReviews(
                business.id
            );

        if (reviews.length > 0) {

            reviewsHTML = `
                <div class="business-reviews">

                    <h3>Reviews</h3>

                    ${reviews.map(
                        function (review) {

                            return `
                                <div class="review-item">

                                    <strong>
                                        ${escapeHTML(
                                            review.userName
                                        )}
                                    </strong>

                                    <div>
                                        ⭐ ${review.rating}/5
                                    </div>

                                    <p>
                                        ${escapeHTML(
                                            review.comment
                                        )}
                                    </p>

                                </div>
                            `;
                        }
                    ).join("")}

                </div>
            `;
        }
    }

    details.innerHTML = `

        <button
            type="button"
            class="modal-close"
            onclick="closeModal('businessModal')">
            ×
        </button>

        <h2>
            ${escapeHTML(business.name)}
        </h2>

        <p>
            <strong>Category:</strong>
            ${escapeHTML(business.category)}
        </p>

        <p>
            <strong>Location:</strong>
            ${escapeHTML(business.location)}
        </p>

        <p>
            <strong>Rating:</strong>
            ⭐ ${Number(
                business.rating || 0
            ).toFixed(1)}
        </p>

        <p>
            ${escapeHTML(
                business.description || ""
            )}
        </p>

        ${
            business.phone
                ? `
                    <p>
                        <strong>Phone:</strong>
                        ${escapeHTML(
                            business.phone
                        )}
                    </p>
                `
                : ""
        }

        ${
            business.email
                ? `
                    <p>
                        <strong>Email:</strong>
                        ${escapeHTML(
                            business.email
                        )}
                    </p>
                `
                : ""
        }

        <button
            type="button"
            class="btn btn-primary"
            onclick="addReview('${business.id}')">
            Leave a Review
        </button>

        ${reviewsHTML}
    `;

    openModal("businessModal");
};

/* =========================
   SECURITY
========================= */

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/* =========================
   START WEBSITE
========================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        renderBusinesses(
            getBusinesses()
        );

        loadBusinessesFromSupabase();
    }
);
