const BUSINESSES_KEY = "losoja_businesses";

const defaultBusinesses = [
    {
        id: "1",
        name: "Taste Haven",
        category: "Food",
        location: "Lagos, Nigeria",
        description: "Delicious meals and great local food.",
        phone: "",
        email: "",
        rating: 4.5,
        reviews: 12
    },
    {
        id: "2",
        name: "Urban Style",
        category: "Fashion",
        location: "Lagos, Nigeria",
        description: "Modern fashion and stylish clothing.",
        phone: "",
        email: "",
        rating: 4.7,
        reviews: 8
    },
    {
        id: "3",
        name: "Tech Hub Nigeria",
        category: "Technology",
        location: "Abuja, Nigeria",
        description: "Technology products, services and support.",
        phone: "",
        email: "",
        rating: 4.6,
        reviews: 15
    },
    {
        id: "4",
        name: "Glow Beauty Studio",
        category: "Beauty",
        location: "Lagos, Nigeria",
        description: "Beauty, hair and personal care services.",
        phone: "",
        email: "",
        rating: 4.8,
        reviews: 20
    }
];


// ================================
// GET BUSINESSES
// ================================

function getBusinesses() {
    try {
        const saved = localStorage.getItem(BUSINESSES_KEY);

        if (saved) {
            const savedBusinesses = JSON.parse(saved);

            if (Array.isArray(savedBusinesses)) {

                // Add any missing default businesses
                const existingIds = savedBusinesses.map(function (business) {
                    return String(business.id);
                });

                const missingDefaults = defaultBusinesses.filter(function (business) {
                    return !existingIds.includes(String(business.id));
                });

                if (missingDefaults.length > 0) {

                    const combinedBusinesses = [
                        ...savedBusinesses,
                        ...missingDefaults
                    ];

                    localStorage.setItem(
                        BUSINESSES_KEY,
                        JSON.stringify(combinedBusinesses)
                    );

                    return combinedBusinesses;
                }

                return savedBusinesses;
            }
        }

        localStorage.setItem(
            BUSINESSES_KEY,
            JSON.stringify(defaultBusinesses)
        );

        return defaultBusinesses;

    } catch (error) {

        console.error(
            "Could not load businesses:",
            error
        );

        return defaultBusinesses;
    }
}

// ================================
// SAVE BUSINESSES
// ================================

function saveBusinesses(businesses) {
    localStorage.setItem(
        BUSINESSES_KEY,
        JSON.stringify(businesses)
    );
}

window.getBusinesses = getBusinesses;
window.saveBusinesses = saveBusinesses;


// ================================
// SEARCH BUSINESSES
// ================================

window.searchBusinesses = function (
    searchTerm,
    locationTerm
) {

    const businesses = getBusinesses();

    const search =
        (searchTerm || "")
            .toLowerCase()
            .trim();

    const location =
        (locationTerm || "")
            .toLowerCase()
            .trim();

    const results = businesses.filter(
        function (business) {

            const searchableText = [
                business.name,
                business.category,
                business.location,
                business.description
            ]
                .join(" ")
                .toLowerCase();

            const matchesSearch =
                !search ||
                searchableText.includes(search);

            const matchesLocation =
                !location ||
                business.location
                    .toLowerCase()
                    .includes(location);

            return (
                matchesSearch &&
                matchesLocation
            );
        }
    );

    renderBusinesses(results);

    const resultsSection =
        document.getElementById("businesses");

    if (resultsSection) {
        resultsSection.scrollIntoView({
            behavior: "smooth"
        });
    }
};


// ================================
// FILTER BY CATEGORY
// ================================

window.filterBusinessesByCategory =
    function (category) {

        const businesses = getBusinesses();

        if (!category) {
            renderBusinesses(businesses);
            return;
        }

        const categoryLower =
            category.toLowerCase();

        const results =
            businesses.filter(
                function (business) {

                    return (
                        business.category
                            .toLowerCase() ===
                        categoryLower
                    );
                }
            );

        renderBusinesses(results);

        const resultsSection =
            document.getElementById(
                "businesses"
            );

        if (resultsSection) {
            resultsSection.scrollIntoView({
                behavior: "smooth"
            });
        }
    };


// ================================
// DISPLAY BUSINESSES
// ================================

function renderBusinesses(businesses) {

    const container =
        document.getElementById(
            "businessGrid"
        ) ||
        document.querySelector(
            ".business-grid"
        );

    if (!container) {
        return;
    }

    if (
        !businesses ||
        businesses.length === 0
    ) {

        container.innerHTML = `
            <div class="empty-state">
                <h3>No businesses found</h3>
                <p>
                    Try another search or choose
                    a different category.
                </p>
            </div>
        `;

        return;
    }

    container.innerHTML =
        businesses.map(
            function (business) {

                const rating =
                    typeof business.rating ===
                    "number"
                        ? business.rating.toFixed(1)
                        : "0.0";

                const reviewCount =
                    Number(business.reviews) || 0;

                return `
                    <div class="business-card">

                        <div class="business-image">
                            🏪
                        </div>

                        <div class="business-content">

                            <span class="business-category">
                                ${escapeHTML(
                                    business.category
                                )}
                            </span>

                            <h3>
                                ${escapeHTML(
                                    business.name
                                )}
                            </h3>

                            <div class="business-location">
                                📍 ${escapeHTML(
                                    business.location
                                )}
                            </div>

                            <div class="rating">
                                ⭐ ${rating}
                                <span>
                                    (${reviewCount} reviews)
                                </span>
                            </div>

                            <p class="business-description">
                                ${escapeHTML(
                                    business.description
                                )}
                            </p>

                            <div class="business-actions">

                                <button
                                    class="btn btn-primary"
                                    data-business-id="${escapeHTML(
                                        business.id
                                    )}"
                                >
                                    View Details
                                </button>

                            </div>

                        </div>

                    </div>
                `;

            }
        ).join("");
}

window.renderBusinesses =
    renderBusinesses;


// ================================
// OPEN BUSINESS DETAILS
// ================================

window.openBusiness =
    function (businessId) {

        const businesses =
            getBusinesses();

        const business =
            businesses.find(
                function (item) {

                    return (
                        String(item.id) ===
                        String(businessId)
                    );
                }
            );

        if (!business) {

            showNotification(
                "Business not found."
            );

            return;
        }

        const modal =
            document.getElementById(
                "businessModal"
            );

        if (!modal) {

            showNotification(
                business.name +
                " - " +
                business.location
            );

            return;
        }

        const content =
            modal.querySelector(
                ".business-details"
            ) ||
            modal.querySelector(
                ".modal-content"
            );

        if (!content) {
            return;
        }


        // Get reviews for this business
        const reviews =
            typeof window.getBusinessReviews ===
            "function"
                ? window.getBusinessReviews(
                    business.id
                )
                : [];


        // Build reviews HTML
        let reviewsHTML = "";

        if (reviews.length === 0) {

            reviewsHTML = `
                <div class="reviews-section">
                    <h3>Customer Reviews</h3>
                    <p>
                        No customer reviews yet.
                        Be the first to leave one!
                    </p>
                </div>
            `;

        } else {

            reviewsHTML = `
                <div class="reviews-section">

                    <h3>
                        Customer Reviews
                    </h3>

                    ${reviews.map(
                        function (review) {

                            const stars =
                                "⭐".repeat(
                                    Number(
                                        review.rating
                                    )
                                );

                            const reviewDate =
                                review.createdAt
                                    ? new Date(
                                        review.createdAt
                                      ).toLocaleDateString()
                                    : "";

                            return `
                                <div class="review-item">

                                    <div class="review-header">

                                        <strong>
                                            ${escapeHTML(
                                                review.userName
                                            )}
                                        </strong>

                                        <span>
                                            ${reviewDate}
                                        </span>

                                    </div>

                                    <div class="review-rating">
                                        ${stars}
                                        ${Number(
                                            review.rating
                                        )}/5
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


        content.innerHTML = `

            <button
                class="modal-close"
                onclick="closeModal('businessModal')"
            >
                ×
            </button>

            <div class="business-image">
                🏪
            </div>

            <h2>
                ${escapeHTML(
                    business.name
                )}
            </h2>

            <p class="business-category">
                ${escapeHTML(
                    business.category
                )}
            </p>

            <p class="business-location">
                📍 ${escapeHTML(
                    business.location
                )}
            </p>

            <div class="rating">

                ⭐ ${
                    typeof business.rating ===
                    "number"
                        ? business.rating.toFixed(1)
                        : "0.0"
                }

                <span>
                    (${Number(
                        business.reviews
                    ) || 0} reviews)
                </span>

            </div>

            <p>
                ${escapeHTML(
                    business.description
                )}
            </p>

            ${
                business.phone
                    ? `
                        <p>
                            📞 ${escapeHTML(
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
                            ✉️ ${escapeHTML(
                                business.email
                            )}
                        </p>
                    `
                    : ""
            }

            <br>

            <button
                class="btn btn-primary"
                onclick="addReview(
                    '${escapeHTML(
                        business.id
                    )}'
                )"
            >
                Leave a Review
            </button>

            ${reviewsHTML}

        `;

        openModal("businessModal");
    };


// ================================
// ESCAPE HTML
// ================================

function escapeHTML(value) {

    return String(value ?? "")
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


// ================================
// INITIAL DISPLAY
// ================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        renderBusinesses(
            getBusinesses()
        );

    }
);
