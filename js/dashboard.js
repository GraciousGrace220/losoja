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

function getCurrentUser() {
    try {
        return JSON.parse(
            localStorage.getItem("losoja_current_user")
        );
    } catch (error) {
        return null;
    }
}

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
        return String(business.ownerId) ===
            String(currentUser.id);
    });
};

window.addBusiness = async function (businessData) {

    const currentUser = getCurrentUser();

    if (!currentUser) {
        showNotification("Please log in first.");

        if (typeof openModal === "function") {
            openModal("loginModal");
        }

        return false;
    }

    const business = {
        name: String(
            businessData.name || ""
        ).trim(),

        category: String(
            businessData.category || ""
        ).trim(),

        location: String(
            businessData.location || ""
        ).trim(),

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

    if (
        !business.name ||
        !business.category ||
        !business.location
    ) {
        showNotification(
            "Please fill in the business name, category and location."
        );

        return false;
    }

    try {

        /*
         * First attempt:
         * Save with the current user's local ID.
         */
        let response = await fetch(
            SUPABASE_URL +
            "/rest/v1/businesses?select=*",
            {
                method: "POST",

                headers: {
                    ...supabaseHeaders(),
                    "Prefer": "return=representation"
                },

                body: JSON.stringify({
                    owner_id: String(currentUser.id),
                    ...business
                })
            }
        );

        /*
         * If owner_id causes a database error,
         * try again without owner_id.
         */
        if (!response.ok) {

            const firstError =
                await response.text();

            console.warn(
                "First business save failed:",
                firstError
            );

            response = await fetch(
                SUPABASE_URL +
                "/rest/v1/businesses?select=*",
                {
                    method: "POST",

                    headers: {
                        ...supabaseHeaders(),
                        "Prefer": "return=representation"
                    },

                    body: JSON.stringify(business)
                }
            );
        }

        if (!response.ok) {

            const errorText =
                await response.text();

            throw new Error(
                "Supabase error " +
                response.status +
                ": " +
                errorText
            );
        }

        const result =
            await response.json();

        if (
            !Array.isArray(result) ||
            result.length === 0
        ) {
            throw new Error(
                "Supabase did not return the new business."
            );
        }

        const savedBusiness = result[0];

        /*
         * Convert Supabase data to LosOja format.
         */
        const localBusiness = {
            id: savedBusiness.id,

            ownerId:
                savedBusiness.owner_id ||
                currentUser.id,

            name:
                savedBusiness.name,

            category:
                savedBusiness.category,

            location:
                savedBusiness.location,

            description:
                savedBusiness.description || "",

            phone:
                savedBusiness.phone || "",

            email:
                savedBusiness.email || "",

            rating:
                Number(
                    savedBusiness.rating || 0
                ),

            reviews:
                Number(
                    savedBusiness.reviews || 0
                )
        };

        /*
         * Update local cache.
         */
        let businesses = [];

        try {
            businesses =
                JSON.parse(
                    localStorage.getItem(
                        BUSINESSES_KEY
                    )
                ) || [];
        } catch (error) {
            businesses = [];
        }

        /*
         * Remove an older copy with the same ID.
         */
        businesses =
            businesses.filter(function (item) {
                return String(item.id) !==
                    String(localBusiness.id);
            });

        businesses.push(localBusiness);

        localStorage.setItem(
            BUSINESSES_KEY,
            JSON.stringify(businesses)
        );

        /*
         * Reload everything from Supabase.
         */
        if (
            typeof window.loadBusinessesFromSupabase ===
            "function"
        ) {
            await window.loadBusinessesFromSupabase();
        } else if (
            typeof window.renderBusinesses ===
            "function"
        ) {
            window.renderBusinesses(
                businesses
            );
        }

        showNotification(
            "Business added successfully!"
        );

        return true;

    } catch (error) {

        console.error(
            "LosOja business save failed:",
            error
        );

        showNotification(
            "Business could not be saved. Check the Supabase businesses table."
        );

        return false;
    }
};

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const form =
            document.getElementById(
                "addBusinessForm"
            );

        if (!form) {
            console.warn(
                "LosOja: addBusinessForm was not found."
            );
            return;
        }

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
