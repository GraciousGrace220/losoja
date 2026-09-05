```javascript
const LOSOJA_SUPABASE_URL = "https://ycxshwgeebskdozmornh.supabase.co";
const LOSOJA_SUPABASE_KEY = "sb_publishable_jFSLacwNupO6T8EnSqb2bw_bZmy7rVe";

/* =========================================================
   SHOW NOTIFICATION
========================================================= */

function showNotification(message) {
    if (typeof window.showNotification === "function" &&
        window.showNotification !== showNotification) {
        window.showNotification(message);
        return;
    }

    alert(message);
}


/* =========================================================
   ADD BUSINESS TO SUPABASE
========================================================= */

window.addBusiness = async function (businessData) {

    const business = {
        name: String(businessData.name || "").trim(),
        category: String(businessData.category || "").trim(),
        location: String(businessData.location || "").trim(),
        description: String(businessData.description || "").trim(),
        phone: String(businessData.phone || "").trim(),
        email: String(businessData.email || "").trim(),
        rating: 0,
        reviews: 0
    };

    /* Check required fields */

    if (!business.name) {
        showNotification("Please enter the business name.");
        return false;
    }

    if (!business.category) {
        showNotification("Please select a business category.");
        return false;
    }

    if (!business.location) {
        showNotification("Please enter the business location.");
        return false;
    }

    try {

        console.log("Saving business to Supabase:", business);

        const response = await fetch(
            LOSOJA_SUPABASE_URL + "/rest/v1/businesses",
            {
                method: "POST",

                headers: {
                    "apikey": LOSOJA_SUPABASE_KEY,
                    "Authorization": "Bearer " + LOSOJA_SUPABASE_KEY,
                    "Content-Type": "application/json",
                    "Prefer": "return=representation"
                },

                body: JSON.stringify(business)
            }
        );

        /* Get Supabase response */

        const responseText = await response.text();

        console.log("Supabase status:", response.status);
        console.log("Supabase response:", responseText);

        /* Handle error */

        if (!response.ok) {

            let errorMessage = "Business could not be saved.";

            try {
                const errorData = JSON.parse(responseText);

                if (errorData.message) {
                    errorMessage = errorData.message;
                } else if (errorData.error) {
                    errorMessage = errorData.error;
                } else if (errorData.hint) {
                    errorMessage = errorData.hint;
                }

            } catch (parseError) {
                if (responseText) {
                    errorMessage = responseText;
                }
            }

            console.error(
                "SUPABASE ERROR:",
                response.status,
                responseText
            );

            showNotification(
                "Business could not be saved.\n\n" +
                errorMessage
            );

            return false;
        }

        /* Business saved successfully */

        console.log("Business saved successfully:", responseText);

        showNotification("Business added successfully!");

        /* Reload businesses if the function exists */

        if (
            typeof window.loadBusinessesFromSupabase === "function"
        ) {
            try {
                await window.loadBusinessesFromSupabase();
            } catch (loadError) {
                console.error(
                    "Business saved, but businesses could not be reloaded:",
                    loadError
                );
            }
        }

        return true;

    } catch (error) {

        console.error(
            "LosOja connection error:",
            error
        );

        showNotification(
            "Could not connect to the database.\n\n" +
            error.message
        );

        return false;
    }
};


/* =========================================================
   ADD BUSINESS FORM
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    const form = document.getElementById("addBusinessForm");

    if (!form) {
        console.warn(
            "Add Business form (#addBusinessForm) was not found."
        );
        return;
    }

    console.log("Add Business form found.");

    form.addEventListener("submit", async function (event) {

        event.preventDefault();

        /* Prevent double submissions */

        const submitButton =
            form.querySelector('button[type="submit"]');

        if (submitButton) {
            submitButton.disabled = true;
        }

        try {

            /* Safely get form values */

            const nameElement =
                document.getElementById("businessName");

            const categoryElement =
                document.getElementById("businessCategory");

            const locationElement =
                document.getElementById("businessLocation");

            const descriptionElement =
                document.getElementById("businessDescription");

            const phoneElement =
                document.getElementById("businessPhone");

            const emailElement =
                document.getElementById("businessEmail");


            /* Make sure required HTML fields exist */

            if (!nameElement) {
                showNotification(
                    "Business name field was not found."
                );
                return;
            }

            if (!categoryElement) {
                showNotification(
                    "Business category field was not found."
                );
                return;
            }

            if (!locationElement) {
                showNotification(
                    "Business location field was not found."
                );
                return;
            }


            /* Collect form data */

            const businessData = {

                name: nameElement.value,

                category: categoryElement.value,

                location: locationElement.value,

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
                "Business form submitted:",
                businessData
            );


            /* Save business */

            const success =
                await window.addBusiness(businessData);


            /* If successful */

            if (success) {

                form.reset();

                /* Close modal */

                if (
                    typeof window.closeModal === "function"
                ) {
                    window.closeModal("addBusinessModal");
                }

            }

        } catch (error) {

            console.error(
                "Add Business form error:",
                error
            );

            showNotification(
                "Something went wrong while adding the business.\n\n" +
                error.message
            );

        } finally {

            /* Re-enable submit button */

            if (submitButton) {
                submitButton.disabled = false;
            }
        }
    });
});
```
