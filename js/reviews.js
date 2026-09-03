const REVIEWS_KEY = "losoja_reviews";


// ================================
// GET REVIEWS
// ================================

function getReviews() {
    try {
        return JSON.parse(
            localStorage.getItem(REVIEWS_KEY)
        ) || [];
    } catch (error) {
        return [];
    }
}


// ================================
// SAVE REVIEWS
// ================================

function saveReviews(reviews) {
    localStorage.setItem(
        REVIEWS_KEY,
        JSON.stringify(reviews)
    );
}

window.getReviews = getReviews;
window.saveReviews = saveReviews;


// ================================
// ADD REVIEW
// ================================

window.addReview = function (businessId) {

    const currentUser = JSON.parse(
        localStorage.getItem("losoja_current_user")
    );

    if (!currentUser) {
        showNotification(
            "Please log in before leaving a review."
        );

        openModal("loginModal");
        return;
    }

    const ratingInput = prompt(
        "Give this business a rating from 1 to 5:"
    );

    if (ratingInput === null) {
        return;
    }

    const rating = Number(ratingInput);

    if (
        !Number.isInteger(rating) ||
        rating < 1 ||
        rating > 5
    ) {
        showNotification(
            "Please enter a rating from 1 to 5."
        );
        return;
    }

    const comment = prompt(
        "Write a short review:"
    );

    if (
        comment === null ||
        !comment.trim()
    ) {
        showNotification(
            "Please enter a review."
        );
        return;
    }

    const reviews = getReviews();

    const newReview = {
        id: Date.now().toString(),
        businessId: String(businessId),
        userId: currentUser.id,
        userName: currentUser.name,
        rating: rating,
        comment: comment.trim(),
        createdAt: new Date().toISOString()
    };

    reviews.push(newReview);

    saveReviews(reviews);

    updateBusinessRating(businessId);

    showNotification(
        "Thank you! Your review has been added."
    );

    // Refresh business information
    if (typeof window.openBusiness === "function") {
        window.openBusiness(businessId);
    }
};


// ================================
// UPDATE BUSINESS RATING
// ================================

function updateBusinessRating(businessId) {

    const businesses =
        typeof window.getBusinesses === "function"
            ? window.getBusinesses()
            : [];

    const reviews = getReviews();

    const business = businesses.find(function (item) {
        return String(item.id) === String(businessId);
    });

    if (!business) {
        return;
    }

    const businessReviews = reviews.filter(
        function (review) {
            return String(review.businessId) ===
                   String(businessId);
        }
    );

    if (businessReviews.length === 0) {
        return;
    }

    const total = businessReviews.reduce(
        function (sum, review) {
            return sum + Number(review.rating);
        },
        0
    );

    const average =
        total / businessReviews.length;

    business.rating =
        Number(average.toFixed(1));

    business.reviews =
        businessReviews.length;

    if (
        typeof window.saveBusinesses ===
        "function"
    ) {
        window.saveBusinesses(businesses);
    }
}


// ================================
// GET BUSINESS REVIEWS
// ================================

window.getBusinessReviews = function (
    businessId
) {

    return getReviews().filter(
        function (review) {
            return String(review.businessId) ===
                   String(businessId);
        }
    );
};
