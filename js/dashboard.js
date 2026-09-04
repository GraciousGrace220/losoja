const SUPABASE_URL = "https://ycxshwgeebskdozmornh.supabase.co";
const SUPABASE_KEY = "sb_publishable_jFSLacwNupO6T8EnSqb2bw_bZmy7rVe";

const BUSINESSES_KEY = "losoja_businesses";

function supabaseHeaders() {
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": "Bearer " + SUPABASE_KEY,
        "Content-Type": "application/json"
    };
}

/* =========================
   GET CURRENT USER
========================= */

function getCurrentUser() {
    try {
        return JSON.parse(
            localStorage.getItem("losoja_current_user")
        );
    } catch (error) {
        return null;
    }
}

/* =========================
   DASHBOARD BUSINESSES
========================= */

window.getDashboardBusinesses = function () {
    const currentUser = getCurrentUser();

    if (!currentUser) {
        return [];
    }

    let businesses = [];

    try {
        businesses =
            JSON.parse(
                localStorage.getItem(BUSINESSES_KEY)
            ) || [];
    } catch (error) {
        businesses = [];
    }

    return businesses.filter(function (business) {
        return String(business.ownerId) === String(currentUser.id);
    });
};

/* =========================
   ADD BUSINESS
========================= */

window.addBusiness = async function (businessData) {
    const currentUser = getCurrentUser();

    if (!currentUser) {
        if (typeof showNotification === "function") {
            showNotification("Please log in first.");
        }

        if (typeof openModal === "function") {
            openModal("loginModal");
        }

        return false;
    }

    const business = {
        owner_id: String(currentUser.id),
        name: String(businessData.name || "").trim(),
        category: String(businessData.category || "").trim(),
        location: String(businessData.location || "").trim(),
        description: String(
            businessData.description || ""
        ).trim(),
        phone: String(
            businessData.phone || ""
        ).trim(),
        email: String(
            businessData.email || ""
        ).trim(),
        rating: 0,
        reviews: 0
    };

    if (!business.name || !business.category || !business.location) {
        if (typeof showNotification === "function") {
            showNotification(
                "Please fill in the business name, category and location."
            );
        }

        return false;
    }

    try {
        const response = await fetch(
            SUPABASE_URL + "/rest/v1/businesses?select=*",
            {
                method: "POST",
                headers: {
                    ...supabaseHeaders(),
                    "Prefer": "return=representation"
                },
                body: JSON.stringify(business)
            }
        );

        if (!response.ok) {
            const errorText = await response.text();

            throw new Error(
                "Supabase error " +
                response.status +
                ": " +
                errorText
            );
        }

        const result = await response.json();

        if (!Array.isArray(result) || result.length === 0) {
            throw new Error(
                "Business was not returned by Supabase."
            );
        }

        const savedBusiness = result[0];

        /* Convert Supabase format to website format */
        const localBusiness = {
            id: savedBusiness.id,
            ownerId: savedBusiness.owner_id,
            name: savedBusiness.name,
            category: savedBusiness.category,
            location: savedBusiness.location,
            description: savedBusiness.description || "",
            phone: savedBusiness.phone || "",
            email: savedBusiness.email || "",
            rating: Number(savedBusiness.rating || 0),
            reviews: Number(savedBusiness.reviews || 0)
        };

        /* Save to local cache */
        let businesses = [];

        try {
            businesses =
                JSON.parse(
                    localStorage.getItem(BUSINESSES_KEY)
                ) || [];
        } catch (error) {
            businesses = [];
        }

        businesses.push(localBusiness);

        localStorage.setItem(
            BUSINESSES_KEY,
            JSON.stringify(businesses)
        );

        /* Refresh business list */
        if (
            typeof window.loadBusinessesFromSupabase ===
            "function"
        ) {
            await window.loadBusinessesFromSupabase();
        } else if (
            typeof window.renderBusinesses ===
            "function"
        ) {
            window.renderBusinesses(businesses);
        }

        if (typeof showNotification === "function") {
            showNotification(
                "Business added successfully!"
            );
        }

        return true;

    } catch (error) {
        console.error(
            "Could not add business:",
            error
        );

        if (typeof showNotification === "function") {
            showNotification(
                "Could not save your business online. Please try again."
            );
        }

        return false;
    }
};

/* =========================
   ADD BUSINESS FORM
========================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {
        const form =
            document.getElementById(
                "addBusinessForm"
            );

        if (!form) return;

        form.addEventListener(
            "submit",
            async function (event) {
                event.preventDefault();

                const businessData = {
                    name:
                        document.getElementById(
                            "businessName"
                        )?.value || "",

                    category:
                        document.getElementById(
                            "businessCategory"
                        )?.value || "",

                    location:
                        document.getElementById(
                            "businessLocation"
                        )?.value || "",

                    description:
                        document.getElementById(
                            "businessDescription"
                        )?.value || "",

                    phone:
                        document.getElementById(
                            "businessPhone"
                        )?.value || "",

                    email:
                        document.getElementById(
                            "businessEmail"
                        )?.value || ""
                };

                const success =
                    await window.addBusiness(
                        businessData
                    );

                if (!success) {
                    return;
                }

                form.reset();

                if (
                    typeof closeModal ===
                    "function"
                ) {
                    closeModal(
                        "addBusinessModal"
                    );
                }
            }
        );
    }
);
