const LOSOJA_SUPABASE_URL =
    "https://ycxshwgeebskdozmornh.supabase.co";

const LOSOJA_SUPABASE_KEY =
    "sb_publishable_jFSLacwNupO6T8EnSqb2bw_bZmy7rVe";


/* =========================================================
   NOTIFICATION
========================================================= */

function showLosOjaNotification(message) {

    if (
        typeof window.showNotification === "function" &&
        window.showNotification !== showLosOjaNotification
    ) {
        window.showNotification(message);
        return;
    }

    alert(message);
}


/* =========================================================
   GET CURRENT SUPABASE SESSION
========================================================= */

function getLosOjaSession() {

    try {

        const saved =
            localStorage.getItem(
                "losoja_supabase_session"
            );

        if (!saved) {
            return null;
        }

        return JSON.parse(saved);

    } catch (error) {

        console.error(
            "LosOja: Could not read session:",
            error
        );

        return null;
    }
}


/* =========================================================
   SUPABASE HEADERS
========================================================= */

function getBusinessHeaders(accessToken) {

    const headers = {

        "apikey":
            LOSOJA_SUPABASE_KEY,

        "Content-Type":
            "application/json",

        "Prefer":
            "return=representation"

    };


    if (accessToken) {

        headers["Authorization"] =
            "Bearer " +
            accessToken;

    }


    return headers;
}


/* =========================================================
   ADD BUSINESS
========================================================= */

window.addBusiness = async function (businessData) {

    console.log(
        "LosOja: addBusiness() started."
    );


    /* -----------------------------------------
       CHECK LOGIN
    ----------------------------------------- */

    const session =
        getLosOjaSession();


    if (
        !session ||
        !session.user ||
        !session.access_token
    ) {

        console.error(
            "LosOja: No valid authenticated session found."
        );

        showLosOjaNotification(
            "Please log in to add a business."
        );

        return false;
    }


    const user =
        session.user;


    console.log(
        "LosOja: Authenticated user:",
        user.id
    );


    /* -----------------------------------------
       COLLECT BUSINESS DATA
    ----------------------------------------- */

    const business = {

        /*
         * IMPORTANT:
         * The Supabase businesses table uses
         * USER_ID, not OWNER_ID.
         */
        user_id:
            user.id,

        name:
            String(
                businessData.name || ""
            ).trim(),

        category:
            String(
                businessData.category || ""
            ).trim(),

        location:
            String(
                businessData.location || ""
            ).trim(),

        description:
            String(
                businessData.description || ""
            ).trim(),

        phone:
            String(
                businessData.phone || ""
            ).trim(),

        email:
            String(
                businessData.email || ""
            ).trim(),

        rating:
            0,

        reviews:
            0
    };


    /* -----------------------------------------
       VALIDATION
    ----------------------------------------- */

    if (!business.name) {

        showLosOjaNotification(
            "Please enter the business name."
        );

        return false;
    }


    if (!business.category) {

        showLosOjaNotification(
            "Please select a business category."
        );

        return false;
    }


    if (!business.location) {

        showLosOjaNotification(
            "Please enter the business location."
        );

        return false;
    }


    console.log(
        "LosOja: Business being sent to Supabase:",
        business
    );


    /* -----------------------------------------
       SAVE TO SUPABASE
    ----------------------------------------- */

    try {

        const response =
            await fetch(
                LOSOJA_SUPABASE_URL +
                "/rest/v1/businesses",
                {
                    method: "POST",

                    headers:
                        getBusinessHeaders(
                            session.access_token
                        ),

                    body:
                        JSON.stringify(
                            business
                        )
                }
            );


        const responseText =
            await response.text();


        console.log(
            "LosOja: Supabase status:",
            response.status
        );


        console.log(
            "LosOja: Supabase response:",
            responseText
        );


        /* -----------------------------------------
           HANDLE ERROR
        ----------------------------------------- */

        if (!response.ok) {

            let errorMessage =
                "Business could not be saved.";


            try {

                const errorData =
                    JSON.parse(
                        responseText
                    );


                errorMessage =
                    errorData.message ||
                    errorData.details ||
                    errorData.hint ||
                    errorData.error ||
                    errorMessage;


            } catch (parseError) {

                if (responseText) {

                    errorMessage =
                        responseText;

                }

            }


            console.error(
                "LosOja: SUPABASE SAVE ERROR:",
                {
                    status:
                        response.status,

                    response:
                        responseText,

                    business:
                        business
                }
            );


            if (
                response.status === 401 ||
                response.status === 403
            ) {

                showLosOjaNotification(
                    "You are not authorized to add this business.\n\n" +
                    errorMessage
                );

            } else {

                showLosOjaNotification(
                    "Business could not be saved.\n\n" +
                    errorMessage
                );

            }


            return false;
        }


        /* -----------------------------------------
           SUCCESS
        ----------------------------------------- */

        let savedBusiness = null;


        try {

            const returnedData =
                JSON.parse(
                    responseText
                );


            if (
                Array.isArray(
                    returnedData
                ) &&
                returnedData.length > 0
            ) {

                savedBusiness =
                    returnedData[0];

            }

        } catch (parseError) {

            console.warn(
                "LosOja: Could not parse saved business response.",
                parseError
            );

        }


        console.log(
            "LosOja: BUSINESS SAVED SUCCESSFULLY:",
            savedBusiness
        );


        /* -----------------------------------------
           RELOAD BUSINESSES
        ----------------------------------------- */

        if (
            typeof window.loadBusinessesFromSupabase ===
            "function"
        ) {

            try {

                await window.loadBusinessesFromSupabase();

            } catch (loadError) {

                console.error(
                    "LosOja: Business saved but reload failed:",
                    loadError
                );

            }

        }


        /* -----------------------------------------
           SUCCESS MESSAGE
        ----------------------------------------- */

        showLosOjaNotification(
            "Business added successfully!"
        );


        /* -----------------------------------------
           SCROLL TO BUSINESSES
        ----------------------------------------- */

        setTimeout(
            function () {

                const businessesSection =
                    document.getElementById(
                        "businesses"
                    );


                if (businessesSection) {

                    businessesSection.scrollIntoView({
                        behavior:
                            "smooth",

                        block:
                            "start"
                    });

                }

            },
            200
        );


        return true;


    } catch (error) {

        console.error(
            "LosOja: Database connection error:",
            error
        );


        showLosOjaNotification(
            "Could not connect to the database.\n\n" +
            error.message
        );


        return false;

    }

};


/* =========================================================
   ADD BUSINESS FORM
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const form =
            document.getElementById(
                "addBusinessForm"
            );


        if (!form) {

            console.warn(
                "LosOja: #addBusinessForm was not found."
            );

            return;
        }


        console.log(
            "LosOja: Add Business form found."
        );


        form.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                console.log(
                    "LosOja: Add Business form submitted."
                );


                const submitButton =
                    form.querySelector(
                        'button[type="submit"]'
                    );


                if (submitButton) {

                    submitButton.disabled =
                        true;

                    submitButton.textContent =
                        "Saving...";

                }


                try {

                    /* -----------------------------------------
                       GET FORM ELEMENTS
                    ----------------------------------------- */

                    const nameElement =
                        document.getElementById(
                            "businessName"
                        );

                    const categoryElement =
                        document.getElementById(
                            "businessCategory"
                        );

                    const locationElement =
                        document.getElementById(
                            "businessLocation"
                        );

                    const descriptionElement =
                        document.getElementById(
                            "businessDescription"
                        );

                    const phoneElement =
                        document.getElementById(
                            "businessPhone"
                        );

                    const emailElement =
                        document.getElementById(
                            "businessEmail"
                        );


                    /* -----------------------------------------
                       CHECK REQUIRED FIELDS
                    ----------------------------------------- */

                    if (!nameElement) {

                        showLosOjaNotification(
                            "Business name field was not found."
                        );

                        return;
                    }


                    if (!categoryElement) {

                        showLosOjaNotification(
                            "Business category field was not found."
                        );

                        return;
                    }


                    if (!locationElement) {

                        showLosOjaNotification(
                            "Business location field was not found."
                        );

                        return;
                    }


                    /* -----------------------------------------
                       CHECK SESSION
                    ----------------------------------------- */

                    const session =
                        getLosOjaSession();


                    if (
                        !session ||
                        !session.user ||
                        !session.access_token
                    ) {

                        showLosOjaNotification(
                            "Please log in before adding your business."
                        );

                        return;
                    }


                    /* -----------------------------------------
                       COLLECT FORM DATA
                    ----------------------------------------- */

                    const businessData = {

                        name:
                            nameElement.value,

                        category:
                            categoryElement.value,

                        location:
                            locationElement.value,

                        description:
                            descriptionElement
                                ? descriptionElement.value
                                : "",

                        phone:
                            phoneElement
                                ? phoneElement.value
                                : "",

                        email:
                            emailElement
                                ? emailElement.value
                                : ""

                    };


                    console.log(
                        "LosOja: Business form data:",
                        businessData
                    );


                    /* -----------------------------------------
                       SAVE
                    ----------------------------------------- */

                    const success =
                        await window.addBusiness(
                            businessData
                        );


                    /* -----------------------------------------
                       SUCCESS
                    ----------------------------------------- */

                    if (success) {

                        form.reset();


                        if (
                            typeof window.closeModal ===
                            "function"
                        ) {

                            window.closeModal(
                                "addBusinessModal"
                            );

                        } else {

                            const modal =
                                document.getElementById(
                                    "addBusinessModal"
                                );


                            if (modal) {

                                modal.classList.remove(
                                    "active"
                                );

                                modal.setAttribute(
                                    "aria-hidden",
                                    "true"
                                );

                            }

                        }

                    }


                } catch (error) {

                    console.error(
                        "LosOja: Add Business form error:",
                        error
                    );


                    showLosOjaNotification(
                        "Something went wrong while adding the business.\n\n" +
                        error.message
                    );


                } finally {

                    if (submitButton) {

                        submitButton.disabled =
                            false;

                        submitButton.textContent =
                            "Add Business";

                    }

                }

            }
        );

    }
);
