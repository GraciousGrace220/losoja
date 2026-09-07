/**
 * LosOja - Reviews System
 * Supabase version
 */

(function () {

    "use strict";


    /* =========================================================
       SUPABASE CONFIGURATION
    ========================================================= */

    const LOSOJA_REVIEWS_URL =
        "https://ycxshwgeebskdozmornh.supabase.co";

    const LOSOJA_REVIEWS_KEY =
        "sb_publishable_jFSLacwNupO6T8EnSqb2bw_bZmy7rVe";


    const Reviews = {

        /* =====================================================
           SESSION
        ===================================================== */

        getSession() {

            try {

                if (
                    typeof window.getSupabaseSession ===
                    "function"
                ) {

                    return window.getSupabaseSession();
                }


                const raw =
                    localStorage.getItem(
                        "losoja_supabase_session"
                    );


                if (!raw) {
                    return null;
                }


                return JSON.parse(raw);

            } catch (error) {

                console.error(
                    "LosOja Reviews: Session error:",
                    error
                );

                return null;
            }
        },


        getUser() {

            const session =
                this.getSession();

            return session?.user || null;
        },


        getAccessToken() {

            const session =
                this.getSession();

            return (
                session?.access_token ||
                session?.accessToken ||
                null
            );
        },


        /* =====================================================
           HEADERS
        ===================================================== */

        headers(accessToken) {

            const headers = {

                "apikey":
                    LOSOJA_REVIEWS_KEY,

                "Content-Type":
                    "application/json",

                "Accept":
                    "application/json"
            };


            if (accessToken) {

                headers["Authorization"] =
                    "Bearer " + accessToken;
            }


            return headers;
        },


        /* =====================================================
           ERROR
        ===================================================== */

        async getError(response) {

            try {

                const data =
                    await response.json();

                return (
                    data?.message ||
                    data?.msg ||
                    data?.error_description ||
                    data?.details ||
                    data?.hint ||
                    data?.error ||
                    "Request failed."
                );

            } catch (error) {

                return (
                    response.statusText ||
                    "Request failed."
                );
            }
        },


        /* =====================================================
           INIT
        ===================================================== */

        init() {

            console.log(
                "LosOja Reviews initialized."
            );
        },


        /* =====================================================
           GET REVIEWS
        ===================================================== */

        async getForBusiness(
            businessId
        ) {

            if (!businessId) {
                return [];
            }


            const accessToken =
                this.getAccessToken();


            const url =
                LOSOJA_REVIEWS_URL +
                "/rest/v1/reviews" +
                "?business_id=eq." +
                encodeURIComponent(
                    businessId
                ) +
                "&select=*" +
                "&order=created_at.desc";


            try {

                const response =
                    await fetch(
                        url,
                        {
                            method: "GET",

                            headers:
                                this.headers(
                                    accessToken
                                )
                        }
                    );


                if (!response.ok) {

                    const message =
                        await this.getError(
                            response
                        );

                    console.error(
                        "LosOja Reviews: GET failed:",
                        message
                    );

                    throw new Error(
                        message
                    );
                }


                const reviews =
                    await response.json();


                return Array.isArray(
                    reviews
                )
                    ? reviews
                    : [];


            } catch (error) {

                console.error(
                    "LosOja Reviews: Could not load reviews:",
                    error
                );

                return [];
            }
        },


        /* =====================================================
           ADD REVIEW
        ===================================================== */

        async addReview(
            businessId,
            rating,
            text
        ) {

            const user =
                this.getUser();


            if (!user || !user.id) {

                return {
                    success: false,
                    message:
                        "Please log in to leave a review."
                };
            }


            if (!businessId) {

                return {
                    success: false,
                    message:
                        "Business information is missing."
                };
            }


            const numericRating =
                Number(rating);


            if (
                !Number.isInteger(
                    numericRating
                ) ||
                numericRating < 1 ||
                numericRating > 5
            ) {

                return {
                    success: false,
                    message:
                        "Please select a rating from 1 to 5."
                };
            }


            const accessToken =
                this.getAccessToken();


            if (!accessToken) {

                return {
                    success: false,
                    message:
                        "Your login session has expired. Please log in again."
                };
            }


            /* =================================================
               CHECK EXISTING REVIEW
            ================================================= */

            try {

                const existingURL =
                    LOSOJA_REVIEWS_URL +
                    "/rest/v1/reviews" +
                    "?business_id=eq." +
                    encodeURIComponent(
                        businessId
                    ) +
                    "&user_id=eq." +
                    encodeURIComponent(
                        user.id
                    ) +
                    "&select=id";


                const existingResponse =
                    await fetch(
                        existingURL,
                        {
                            method: "GET",

                            headers:
                                this.headers(
                                    accessToken
                                )
                        }
                    );


                if (!existingResponse.ok) {

                    return {
                        success: false,
                        message:
                            await this.getError(
                                existingResponse
                            )
                    };
                }


                const existing =
                    await existingResponse.json();


                if (
                    Array.isArray(existing) &&
                    existing.length > 0
                ) {

                    return {
                        success: false,
                        message:
                            "You have already reviewed this business."
                    };
                }

            } catch (error) {

                console.error(
                    "LosOja Reviews: Existing review check failed:",
                    error
                );

                return {
                    success: false,
                    message:
                        "Could not check your existing reviews."
                };
            }


            /* =================================================
               USER NAME
            ================================================= */

            const userName =
                user.user_metadata?.name ||
                user.user_metadata?.full_name ||
                user.user_metadata?.username ||
                user.email ||
                "LosOja User";


            /* =================================================
               REVIEW DATA
            ================================================= */

            const reviewData = {

                business_id:
                    businessId,

                user_id:
                    user.id,

                rating:
                    numericRating,

                review:
                    String(
                        text || ""
                    ).trim()
            };


            /* =================================================
               INSERT
            ================================================= */

            try {

                const response =
                    await fetch(
                        LOSOJA_REVIEWS_URL +
                        "/rest/v1/reviews",
                        {
                            method: "POST",

                            headers: {

                                ...this.headers(
                                    accessToken
                                ),

                                "Prefer":
                                    "return=representation"
                            },

                            body:
                                JSON.stringify(
                                    reviewData
                                )
                        }
                    );


                if (!response.ok) {

                    const message =
                        await this.getError(
                            response
                        );


                    console.error(
                        "LosOja Reviews: Insert failed:",
                        message
                    );


                    return {
                        success: false,
                        message: message
                    };
                }


                let savedReview =
                    {
                        ...reviewData
                    };


                try {

                    const data =
                        await response.json();


                    if (
                        Array.isArray(data) &&
                        data.length > 0
                    ) {

                        savedReview =
                            data[0];

                    } else if (data) {

                        savedReview =
                            data;
                    }

                } catch (error) {

                    /*
                     * Insert already succeeded.
                     */
                }


                return {

                    success: true,

                    review:
                        savedReview,

                    userName:
                        userName
                };


            } catch (error) {

                console.error(
                    "LosOja Reviews: Insert error:",
                    error
                );


                return {

                    success: false,

                    message:
                        error.message ||
                        "Review could not be submitted."
                };
            }
        },


        /* =====================================================
           REVIEWS SECTION
        ===================================================== */

        getOrCreateSection() {

            let section =
                document.getElementById(
                    "reviewsSection"
                );


            if (section) {
                return section;
            }


            const details =
                document.getElementById(
                    "businessDetails"
                );


            if (!details) {

                console.error(
                    "LosOja Reviews: businessDetails not found."
                );

                return null;
            }


            section =
                document.createElement(
                    "section"
                );


            section.id =
                "reviewsSection";


            section.className =
                "reviews-section";


            details.appendChild(
                section
            );


            return section;
        },


        /* =====================================================
           RENDER
        ===================================================== */

        async renderForBusiness(
            businessId
        ) {

            if (!businessId) {
                return;
            }


            const section =
                this.getOrCreateSection();


            if (!section) {
                return;
            }


            section.innerHTML = `
                <div class="reviews-loading">
                    Loading reviews...
                </div>
            `;


            const reviews =
                await this.getForBusiness(
                    businessId
                );


            const user =
                this.getUser();


            const isLoggedIn =
                Boolean(
                    user &&
                    user.id
                );


            let formHTML =
                "";


            if (isLoggedIn) {

                formHTML = `

                    <form
                        class="review-form"
                        id="reviewForm"
                    >

                        <h4 class="review-form-title">
                            Leave a Review
                        </h4>

                        <div
                            class="star-rating"
                            id="starRating"
                            role="radiogroup"
                            aria-label="Choose a rating"
                        >

                            <button
                                type="button"
                                class="review-star"
                                data-value="1"
                                aria-label="1 star"
                            >★</button>

                            <button
                                type="button"
                                class="review-star"
                                data-value="2"
                                aria-label="2 stars"
                            >★</button>

                            <button
                                type="button"
                                class="review-star"
                                data-value="3"
                                aria-label="3 stars"
                            >★</button>

                            <button
                                type="button"
                                class="review-star"
                                data-value="4"
                                aria-label="4 stars"
                            >★</button>

                            <button
                                type="button"
                                class="review-star"
                                data-value="5"
                                aria-label="5 stars"
                            >★</button>

                        </div>


                        <textarea
                            id="reviewText"
                            placeholder="Share your experience (optional)..."
                            rows="3"
                            maxlength="1000"
                        ></textarea>


                        <p
                            id="reviewError"
                            class="form-error hidden"
                        ></p>


                        <button
                            type="submit"
                            class="btn btn-primary"
                        >
                            Submit Review
                        </button>

                    </form>

                `;

            } else {

                formHTML = `

                    <p class="review-login-message">
                        Please log in to leave a review.
                    </p>

                `;
            }


            /* =================================================
               REVIEW LIST
            ================================================= */

            const listHTML =
                reviews.length

                    ? reviews
                        .map(
                            (review) => {

                                const name =
                                    review.user_name ||
                                    review.username ||
                                    review.userName ||
                                    "LosOja User";


                                const rating =
                                    Math.max(
                                        1,
                                        Math.min(
                                            5,
                                            Number(
                                                review.rating || 0
                                            )
                                        )
                                    );


                                const text =
                                    String(
                                        review.review ||
                                        ""
                                    );


                                const date =
                                    review.created_at ||
                                    "";


                                return `

                                    <article
                                        class="review-item"
                                    >

                                        <div
                                            class="review-header"
                                        >

                                            <strong
                                                class="reviewer"
                                            >
                                                ${this.escapeHTML(name)}
                                            </strong>


                                            <span
                                                class="review-stars"
                                            >
                                                ${"★".repeat(rating)}
                                                ${"☆".repeat(5 - rating)}
                                            </span>

                                        </div>


                                        ${
                                            text
                                                ? `
                                                    <p class="review-text">
                                                        ${this.escapeHTML(text)}
                                                    </p>
                                                `
                                                : ""
                                        }


                                        ${
                                            date
                                                ? `
                                                    <div class="review-date">
                                                        ${this.formatDate(date)}
                                                    </div>
                                                `
                                                : ""
                                        }

                                    </article>

                                `;
                            }
                        )
                        .join("")

                    : `

                        <p class="reviews-empty">
                            No reviews yet. Be the first to review this business!
                        </p>

                    `;


            section.innerHTML = `

                <div class="reviews-heading">

                    <h3>
                        Customer Reviews
                    </h3>

                    <span class="reviews-count">
                        ${reviews.length}
                    </span>

                </div>


                ${formHTML}


                <div class="review-list">
                    ${listHTML}
                </div>

            `;


            /* =================================================
               STAR RATING
            ================================================= */

            if (isLoggedIn) {

                let selectedRating =
                    0;


                const stars =
                    Array.from(
                        section.querySelectorAll(
                            ".review-star"
                        )
                    );


                function updateStars(
                    rating
                ) {

                    selectedRating =
                        Number(rating);


                    stars.forEach(
                        function (star) {

                            const value =
                                Number(
                                    star.dataset.value
                                );


                            star.classList.toggle(
                                "active",
                                value <=
                                selectedRating
                            );

                        }
                    );
                }


                stars.forEach(
                    function (star) {

                        star.addEventListener(
                            "click",
                            function (event) {

                                event.preventDefault();

                                updateStars(
                                    star.dataset.value
                                );
                            }
                        );


                        star.addEventListener(
                            "mouseenter",
                            function () {

                                const hoverRating =
                                    Number(
                                        star.dataset.value
                                    );


                                stars.forEach(
                                    function (item) {

                                        item.classList.toggle(
                                            "hover",
                                            Number(
                                                item.dataset.value
                                            ) <=
                                            hoverRating
                                        );

                                    }
                                );
                            }
                        );


                        star.addEventListener(
                            "mouseleave",
                            function () {

                                stars.forEach(
                                    function (item) {

                                        item.classList.remove(
                                            "hover"
                                        );

                                    }
                                );
                            }
                        );
                    }
                );


                /* =================================================
                   SUBMIT
                ================================================= */

                const form =
                    section.querySelector(
                        "#reviewForm"
                    );


                if (form) {

                    form.addEventListener(
                        "submit",
                        async function (event) {

                            event.preventDefault();


                            const errorElement =
                                section.querySelector(
                                    "#reviewError"
                                );


                            if (errorElement) {

                                errorElement.textContent =
                                    "";

                                errorElement.classList.add(
                                    "hidden"
                                );
                            }


                            if (
                                selectedRating < 1 ||
                                selectedRating > 5
                            ) {

                                if (errorElement) {

                                    errorElement.textContent =
                                        "Please select a rating from 1 to 5.";

                                    errorElement.classList.remove(
                                        "hidden"
                                    );
                                }

                                return;
                            }


                            const text =
                                section.querySelector(
                                    "#reviewText"
                                )?.value || "";


                            const submitButton =
                                form.querySelector(
                                    'button[type="submit"]'
                                );


                            if (submitButton) {

                                submitButton.disabled =
                                    true;

                                submitButton.textContent =
                                    "Submitting...";
                            }


                            try {

                                const result =
                                    await Reviews.addReview(
                                        businessId,
                                        selectedRating,
                                        text
                                    );


                                if (!result.success) {

                                    throw new Error(
                                        result.message
                                    );
                                }


                                if (
                                    typeof window.showNotification ===
                                    "function"
                                ) {

                                    window.showNotification(
                                        "Review submitted successfully!",
                                        "success"
                                    );
                                }


                                /*
                                 * IMPORTANT:
                                 * Display the saved review immediately
                                 * instead of depending only on another
                                 * database read.
                                 */

                                const saved =
                                    result.review || {};


                                const immediateReview = {

                                    ...saved,

                                    user_name:
                                        result.userName,

                                    rating:
                                        Number(
                                            saved.rating ||
                                            selectedRating
                                        ),

                                    review:
                                        saved.review ??
                                        text,

                                    created_at:
                                        saved.created_at ||
                                        new Date().toISOString()
                                };


                                /*
                                 * Re-render with the newly
                                 * submitted review first.
                                 */

                                const currentReviews =
                                    await Reviews.getForBusiness(
                                        businessId
                                    );


                                const withoutDuplicate =
                                    currentReviews.filter(
                                        function (item) {

                                            return (
                                                String(
                                                    item.id || ""
                                                ) !==
                                                String(
                                                    immediateReview.id || ""
                                                )
                                            );
                                        }
                                    );


                                withoutDuplicate.unshift(
                                    immediateReview
                                );


                                Reviews.renderReviewList(
                                    section,
                                    businessId,
                                    withoutDuplicate
                                );


                            } catch (error) {

                                console.error(
                                    "LosOja Reviews: Submit error:",
                                    error
                                );


                                if (errorElement) {

                                    errorElement.textContent =
                                        error.message ||
                                        "Review could not be submitted.";

                                    errorElement.classList.remove(
                                        "hidden"
                                    );
                                }

                            } finally {

                                const currentButton =
                                    section.querySelector(
                                        '#reviewForm button[type="submit"]'
                                    );


                                if (currentButton) {

                                    currentButton.disabled =
                                        false;

                                    currentButton.textContent =
                                        "Submit Review";
                                }
                            }
                        }
                    );
                }
            }
        },


        /* =====================================================
           RENDER REVIEW LIST AFTER SUBMIT
        ===================================================== */

        renderReviewList(
            section,
            businessId,
            reviews
        ) {

            const list =
                section.querySelector(
                    ".review-list"
                );


            const count =
                section.querySelector(
                    ".reviews-count"
                );


            if (count) {

                count.textContent =
                    reviews.length;
            }


            if (!list) {
                return;
            }


            if (!reviews.length) {

                list.innerHTML = `

                    <p class="reviews-empty">
                        No reviews yet. Be the first to review this business!
                    </p>

                `;

                return;
            }


            list.innerHTML =
                reviews
                    .map(
                        (review) => {

                            const name =
                                review.user_name ||
                                review.username ||
                                review.userName ||
                                "LosOja User";


                            const rating =
                                Math.max(
                                    1,
                                    Math.min(
                                        5,
                                        Number(
                                            review.rating || 0
                                        )
                                    )
                                );


                            const text =
                                String(
                                    review.review ||
                                    ""
                                );


                            const date =
                                review.created_at ||
                                "";


                            return `

                                <article
                                    class="review-item"
                                >

                                    <div class="review-header">

                                        <strong class="reviewer">
                                            ${this.escapeHTML(name)}
                                        </strong>

                                        <span class="review-stars">
                                            ${"★".repeat(rating)}
                                            ${"☆".repeat(5 - rating)}
                                        </span>

                                    </div>


                                    ${
                                        text
                                            ? `
                                                <p class="review-text">
                                                    ${this.escapeHTML(text)}
                                                </p>
                                            `
                                            : ""
                                    }


                                    ${
                                        date
                                            ? `
                                                <div class="review-date">
                                                    ${this.formatDate(date)}
                                                </div>
                                            `
                                            : ""
                                    }

                                </article>

                            `;
                        }
                    )
                    .join("");
        },


        /* =====================================================
           ESCAPE HTML
        ===================================================== */

        escapeHTML(value) {

            const div =
                document.createElement(
                    "div"
                );


            div.textContent =
                String(
                    value ?? ""
                );


            return div.innerHTML;
        },


        /* =====================================================
           DATE
        ===================================================== */

        formatDate(value) {

            if (!value) {
                return "";
            }


            const date =
                new Date(value);


            if (
                Number.isNaN(
                    date.getTime()
                )
            ) {

                return "";
            }


            return date.toLocaleDateString(
                undefined,
                {
                    year: "numeric",
                    month: "short",
                    day: "numeric"
                }
            );
        }
    };


    /* =========================================================
       GLOBAL
    ========================================================= */

    window.Reviews =
        Reviews;


    /* =========================================================
       INITIALIZE
    ========================================================= */

    document.addEventListener(
        "DOMContentLoaded",
        function () {

            Reviews.init();

        }
    );

})();
