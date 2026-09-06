/**
 * LosOja - Reviews system
 * Supabase version
 */

const LOSOJA_REVIEWS_URL =
    "https://ycxshwgeebskdozmornh.supabase.co";

const LOSOJA_REVIEWS_KEY =
    "sb_publishable_jFSLacwNupO6T8EnSqb2bw_bZmy7rVe";


const Reviews = {

    /* =====================================================
       SESSION HELPERS
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

        const session = this.getSession();

        return session?.user || null;
    },


    getAccessToken() {

        const session = this.getSession();

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

    async getForBusiness(businessId) {

        try {

            const response =
                await fetch(
                    LOSOJA_REVIEWS_URL +
                    "/rest/v1/reviews" +
                    "?business_id=eq." +
                    encodeURIComponent(businessId) +
                    "&select=*" +
                    "&order=created_at.desc",
                    {
                        method: "GET",
                        headers: this.headers()
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
       REVIEW STATS
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


        if (
            !rating ||
            Number(rating) < 1 ||
            Number(rating) > 5
        ) {

            return {

                success: false,

                message:
                    "Please select a rating."
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


        /*
         * Check whether this user already
         * reviewed this business.
         */

        const existingResponse =
            await fetch(
                LOSOJA_REVIEWS_URL +
                "/rest/v1/reviews" +
                "?business_id=eq." +
                encodeURIComponent(businessId) +
                "&user_id=eq." +
                encodeURIComponent(user.id) +
                "&select=id",
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


        /*
         * Get display name.
         */

        const userName =
            user.user_metadata?.name ||
            user.user_metadata?.full_name ||
            user.email ||
            "LosOja User";


        /*
         * Insert review.
         */

        const review = {

            business_id:
                businessId,

            user_id:
                user.id,

            rating:
                Number(rating),

            text:
                String(text || "").trim()
        };


        const response =
            await fetch(
                LOSOJA_REVIEWS_URL +
                "/rest/v1/reviews",
                {
                    method: "POST",

                    headers:
                        this.headers(
                            accessToken
                        ),

                    body:
                        JSON.stringify(
                            review
                        )
                }
            );


        if (!response.ok) {

            return {

                success: false,

                message:
                    await this.getError(
                        response
                    )
            };
        }


        let savedReview = null;


        try {

            const data =
                await response.json();

            savedReview =
                Array.isArray(data)
                    ? data[0]
                    : data;

        } catch (error) {

            savedReview =
                review;
        }


        return {

            success: true,

            review:
                savedReview,

            userName:
                userName
        };
    },


    /* =====================================================
       RENDER REVIEWS
    ===================================================== */

    async renderForBusiness(
        businessId
    ) {

        const section =
            document.getElementById(
                "reviewsSection"
            );


        if (!section) {

            console.warn(
                "LosOja Reviews: reviewsSection was not found."
            );

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


        let formHTML = "";


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
                <p
                    style="
                        margin-bottom:1rem;
                        color:var(--text-muted);
                        font-size:0.9rem;
                    "
                >
                    Please log in to leave a review.
                </p>
            `;
        }


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
                                review.text ||
                                review.comment ||
                                "";


                            const date =
                                review.created_at ||
                                review.createdAt ||
                                "";


                            return `
                                <div class="review-item">

                                    <div class="review-header">

                                        <span class="reviewer">
                                            ${Reviews.escapeHTML(name)}
                                        </span>

                                        <span class="review-stars">
                                            ${"★".repeat(rating)}
                                            ${"☆".repeat(5 - rating)}
                                        </span>

                                    </div>


                                    ${
                                        text
                                            ? `
                                                <p class="review-text">
                                                    ${Reviews.escapeHTML(text)}
                                                </p>
                                            `
                                            : ""
                                    }


                                    ${
                                        date
                                            ? `
                                                <div class="review-date">
                                                    ${Reviews.formatDate(date)}
                                                </div>
                                            `
                                            : ""
                                    }

                                </div>
                            `;
                        }
                    )
                    .join("")

                : `
                    <p
                        style="
                            color:var(--text-muted);
                            font-size:0.9rem;
                        "
                    >
                        No reviews yet. Be the first!
                    </p>
                `;


        section.innerHTML = `

            <h3>
                Reviews (${reviews.length})
            </h3>

            ${formHTML}

            <div class="review-list">
                ${listHTML}
            </div>

        `;


        /*
         * STAR SELECTION
         */

        if (isLoggedIn) {

            let selectedRating = 0;


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


            /*
             * SUBMIT REVIEW
             */

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

                            if (submitButton) {

                                submitButton.disabled =
                                    false;

                                submitButton.textContent =
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
            String(value ?? "");

        return div.innerHTML;
    },


    /* =====================================================
       DATE
    ===================================================== */

    formatDate(value) {

        if (!value) {
            return "";
        }


        try {

            return new Date(
                value
            ).toLocaleDateString(
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
   GLOBAL ACCESS
========================================================= */

window.Reviews = Reviews;


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        Reviews.init();

    }
);
