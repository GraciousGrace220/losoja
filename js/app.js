const SUPABASE_URL =
    "https://ycxshwgeebskdozmornh.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_jFSLacwNupO6T8EnSqb2bw_bZmy7rVe";

const CURRENT_SESSION_KEY =
    "losoja_supabase_session";


/* =========================================================
   SUPABASE HEADERS
========================================================= */

function getBusinessHeaders() {

    const session =
        getLosOjaSession();

    const headers = {
        "apikey": SUPABASE_KEY,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    };

    if (
        session &&
        session.access_token
    ) {
        headers["Authorization"] =
            "Bearer " +
            session.access_token;
    }

    return headers;
}


/* =========================================================
   GET CURRENT SESSION
========================================================= */

function getLosOjaSession() {

    try {

        const saved =
            localStorage.getItem(
                CURRENT_SESSION_KEY
            );

        if (!saved) {
            return null;
        }

        return JSON.parse(saved);

    } catch (error) {

        console.error(
            "LosOja session error:",
            error
        );

        return null;
    }
}


/* =========================================================
   GET CURRENT USER
========================================================= */

function getLosOjaUser() {

    const session =
        getLosOjaSession();

    if (
        !session ||
        !session.user
    ) {
        return null;
    }

    return session.user;
}


/* =========================================================
   NOTIFICATION
========================================================= */

function showLosOjaNotification(
    message,
    type = "info"
) {

    if (
        typeof window.showNotification ===
        "function"
    ) {

        window.showNotification(
            message,
            type
        );

        return;
    }

    alert(message);
}


/* =========================================================
   ADD BUSINESS
========================================================= */

window.addBusiness = async function (
    businessData
) {

    console.log(
        "LosOja: Starting business save..."
    );

    const session =
        getLosOjaSession();

    const user =
        getLosOjaUser();

    /* -----------------------------------------------------
       CHECK LOGIN
    ----------------------------------------------------- */

    if (
        !session ||
        !session.access_token ||
        !user ||
        !user.id
    ) {

        showLosOjaNotification(
            "Please log in before adding your business."
        );

        return false;
    }


    /* -----------------------------------------------------
       VALIDATE BUSINESS DATA
    ----------------------------------------------------- */

    const name =
        String(
            businessData?.name || ""
        ).trim();

    const category =
        String(
            businessData?.category || ""
        ).trim();

    const location =
        String(
            businessData?.location || ""
        ).trim();

    const description =
        String(
            businessData?.description || ""
        ).trim();

    const phone =
        String(
            businessData?.phone || ""
        ).trim();

    const email =
        String(
            businessData?.email || ""
        ).trim();


    if (!name) {

        showLosOjaNotification(
            "Please enter your business name."
        );

        return false;
    }


    if (!category) {

        showLosOjaNotification(
            "Please select a business category."
        );

        return false;
    }


    if (!location) {

        showLosOjaNotification(
            "Please enter your business location."
        );

        return false;
    }


    /* -----------------------------------------------------
       DATABASE OBJECT

       IMPORTANT:
       These are ONLY columns that actually exist
       in your businesses table.
    ----------------------------------------------------- */

    const business = {

        user_id: user.id,

        name: name,

        category: category,

        location: location,

        description:
            description || null,

        phone:
            phone || null,

        email:
            email || null
    };


    console.log(
        "LosOja business being sent:",
        business
    );


    /* -----------------------------------------------------
       SAVE TO SUPABASE
    ----------------------------------------------------- */

    try {

        const response =
            await fetch(
                SUPABASE_URL +
                "/rest/v1/businesses",
                {
                    method: "POST",

                    headers:
                        getBusinessHeaders(),

                    body:
                        JSON.stringify(
                            business
                        )
                }
            );


        const responseText =
            await response.text();


        console.log(
            "LosOja Supabase status:",
            response.status
        );

        console.log(
            "LosOja Supabase response:",
            responseText
        );


        /* -------------------------------------------------
           HANDLE ERROR
        ------------------------------------------------- */

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
                    errorData.msg ||
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
                "LosOja business save error:",
                errorMessage
            );


            showLosOjaNotification(
                "Business could not be saved: " +
                errorMessage
            );

            return false;
        }


        /* -------------------------------------------------
           SUCCESS
        ------------------------------------------------- */

        let savedBusiness = null;

        try {

            savedBusiness =
                JSON.parse(
                    responseText
                );

        } catch (parseError) {

            console.warn(
                "Could not parse saved business response."
            );
        }


        console.log(
            "LosOja business saved successfully:",
            savedBusiness
        );


        /* -------------------------------------------------
           REFRESH BUSINESS LIST
        ------------------------------------------------- */

        if (
            typeof window
                .loadBusinessesFromSupabase ===
            "function"
        ) {

            try {

                await window
                    .loadBusinessesFromSupabase();

            } catch (loadError) {

                console.warn(
                    "Business saved, but list refresh failed:",
                    loadError
                );
            }
        }


        showLosOjaNotification(
            "Your business was added successfully!"
        );


        return true;


    } catch (error) {

        console.error(
            "LosOja business save network error:",
            error
        );


        showLosOjaNotification(
            "Could not connect to the database. Please try again."
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

            console.error(
                "LosOja: #addBusinessForm was not found."
            );

            return;
        }


        console.log(
            "LosOja: Add Business form connected."
        );


        form.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                console.log(
                    "LosOja: Add Business form submitted."
                );


                /* -----------------------------------------
                   CHECK LOGIN
                ----------------------------------------- */

                const session =
                    getLosOjaSession();

                const user =
                    getLosOjaUser();


                if (
                    !session ||
                    !session.access_token ||
                    !user ||
                    !user.id
                ) {

                    showLosOjaNotification(
                        "Please log in before adding a business."
                    );

                    return;
                }


                /* -----------------------------------------
                   GET FORM FIELDS
                ----------------------------------------- */

                const nameInput =
                    document.getElementById(
                        "businessName"
                    );

                const categoryInput =
                    document.getElementById(
                        "businessCategory"
                    );

                const locationInput =
                    document.getElementById(
                        "businessLocation"
                    );

                const descriptionInput =
                    document.getElementById(
                        "businessDescription"
                    );

                const phoneInput =
                    document.getElementById(
                        "businessPhone"
                    );

                const emailInput =
                    document.getElementById(
                        "businessEmail"
                    );


                /* -----------------------------------------
                   VERIFY FIELDS EXIST
                ----------------------------------------- */

                if (
                    !nameInput ||
                    !categoryInput ||
                    !locationInput
                ) {

                    console.error(
                        "LosOja: One or more required form fields are missing."
                    );

                    showLosOjaNotification(
                        "The business form is not configured correctly."
                    );

                    return;
                }


                /* -----------------------------------------
                   COLLECT DATA
                ----------------------------------------- */

                const businessData = {

                    name:
                        nameInput.value.trim(),

                    category:
                        categoryInput.value.trim(),

                    location:
                        locationInput.value.trim(),

                    description:
                        descriptionInput
                            ? descriptionInput.value.trim()
                            : "",

                    phone:
                        phoneInput
                            ? phoneInput.value.trim()
                            : "",

                    email:
                        emailInput
                            ? emailInput.value.trim()
                            : ""
                };


                console.log(
                    "LosOja form data:",
                    businessData
                );


                /* -----------------------------------------
                   SUBMIT BUTTON
                ----------------------------------------- */

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

                    const success =
                        await window.addBusiness(
                            businessData
                        );


                    if (success) {

                        form.reset();


                        /* -----------------------------
                           CLOSE ADD BUSINESS MODAL
                        ----------------------------- */

                        if (
                            typeof window
                                .closeAddBusinessModal ===
                            "function"
                        ) {

                            window
                                .closeAddBusinessModal();

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

                                document.body.classList.remove(
                                    "modal-open"
                                );
                            }
                        }
                    }

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


/* =========================================================
   EXPOSE SESSION FUNCTIONS
========================================================= */

window.getLosOjaSession =
    getLosOjaSession;

window.getLosOjaUser =
    getLosOjaUser;
