/**
 * LosOja - Reviews System
 * Supabase version
 *
 * Works with:
 * - businesses.id = UUID
 * - reviews.business_id = UUID
 * - reviews.user_id = UUID
 * - reviews.rating = integer
 * - reviews.review = text
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
                    "LosOja Reviews: Could not read session:",
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
           ERROR HANDLING
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
           GET REVIEWS FOR BUSINESS
        ===================================================== */

        async getForBusiness(businessId) {

            if (!businessId) {
                return [];
            }


            try {

                const accessToken =
                    this.getAccessToken();


                const url =
                    LOSOJA_REVIEWS_URL +
                    "/rest/v1/reviews" +
                    "?business_id=eq." +
                    encodeURIComponent(businessId) +
                    "&select=*" +
                    "&order=created_at.desc";


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

                    throw new Error(
                        await this.getError(
                            response
                        )
                    );
                }


                const reviews =
                    await response.json();


                return Array.isArray(reviews)
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
           REVIEW STATISTICS
        ===================================================== */

        async getStats(businessId) {

            const reviews =
                await this.getForBusiness(
                    businessId
                );


            if (!reviews.length) {

                return {
                    avg: 0,
                    count: 0
                };
            }


            const total =
                reviews.reduce(
                    function (sum, review) {

                        return (
                            sum +
                            Number(
                                review.rating || 0
                            )
                        );

                    },
                    0
                );


            return {

                avg:
                    total /
                    reviews.length,

                count:
                    reviews.length
            };
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

            const review = {

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
                                    review
                                )
                        }
                    );


                if (!response.ok) {

                    const errorMessage =
                        await this.getError(
                            response
                        );


                    console.error(
                        "LosOja Reviews: Insert failed:",
                        errorMessage
                    );


                    return {

                        success: false,

                        message:
                            errorMessage
                    };
                }


                let savedReview =
                    review;


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
                     * Empty response is acceptable
                     * because the insert already succeeded.
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
           CREATE REVIEWS SECTION
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

                console.warn(
                    "LosOja Reviews: businessDetails was not found."
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
           RENDER REVIEWS
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

                        <div
                            class="star-rating"
                            id="starRating"
                            aria-label="Choose a rating"
                        >

                            <button
                                type="button"
                                data-value="1"
                                aria-label="1 star"
                            >★</button>

                            <button
                                type="button"
                                data-value="2"
                                aria-label="2 stars"
                            >★</button>

                            <button
                                type="button"
                                data-value="3"
                                aria-label="3 stars"
                            >★</button>

                            <button
                                type="button"
                                data-value="4"
                                aria-label="4 stars"
                            >★</button>

                            <button
                                type="button"
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
                            function (review) {

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
                                    review.review ||
                                    "";


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

                                            <span
                                                class="reviewer"
                                            >
                                                ${this.escapeHTML(name)}
                                            </span>


                                            <span
                                                class="review-stars"
                                                aria-label="${rating} out of 5 stars"
                                            >
                                                ${"★".repeat(rating)}
                                                ${"☆".repeat(5 - rating)}
                                            </span>

                                        </div>


                                        ${
                                            text
                                                ? `
                                                    <p
                                                        class="review-text"
                                                    >
                                                        ${this.escapeHTML(text)}
                                                    </p>
                                                `
                                                : ""
                                        }


                                        ${
                                            date
                                                ? `
                                                    <div
                                                        class="review-date"
                                                    >
                                                        ${this.formatDate(date)}
                                                    </div>
                                                `
                                                : ""
                                        }

                                    </article>

                                `;
                            }.bind(this)
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


                <div
                    class="review-list"
                >
                    ${listHTML}
                </div>

            `;


            /* =================================================
               STAR SELECTION
            ================================================= */

            if (isLoggedIn) {

                let selectedRating =
                    0;


                const stars =
                    section.querySelectorAll(
                        "#starRating button"
                    );


                stars.forEach(
                    function (button) {

                        button.addEventListener(
                            "click",
                            function () {

                                selectedRating =
                                    Number(
                                        button.dataset.value
                                    );


                                stars.forEach(
                                    function (star) {

                                        star.classList.toggle(
                                            "active",
                                            Number(
                                                star.dataset.value
                                            ) <=
                                            selectedRating
                                        );
                                    }
                                );
                            }
                        );
                    }
                );


                /* =================================================
                   FORM SUBMIT
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


                            if (!selectedRating) {

                                if (errorElement) {

                                    errorElement.textContent =
                                        "Please select a rating.";

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

                                } else {

                                    console.log(
                                        "Review submitted successfully!"
                                    );
                                }


                                await Reviews.renderForBusiness(
                                    businessId
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
           FORMAT DATE
        ===================================================== */

        formatDate(value) {

            if (!value) {
                return "";
            }


            try {

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


            } catch (error) {

                return "";
            }
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
