const SUPABASE_URL = "https://ycxshwgeebskdozmornh.supabase.co";
const SUPABASE_KEY = "sb_publishable_jFSLacwNupO6T8EnSqb2bw_bZmy7rVe";

window.addBusiness = async function (businessData) {

    const user = JSON.parse(
        localStorage.getItem("losoja_current_user") || "null"
    );

    if (!user) {
        showNotification("Please log in first.");
        return false;
    }

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

    if (!business.name || !business.category || !business.location) {
        showNotification("Please fill in the required fields.");
        return false;
    }

    try {

        const response = await fetch(
            SUPABASE_URL + "/rest/v1/businesses",
            {
                method: "POST",
                headers: {
                    "apikey": SUPABASE_KEY,
                    "Authorization": "Bearer " + SUPABASE_KEY,
                    "Content-Type": "application/json",
                    "Prefer": "return=minimal"
                },
                body: JSON.stringify(business)
            }
        );

        if (!response.ok) {
            const error = await response.text();
            console.error("Supabase error:", error);
            showNotification("Business could not be saved.");
            return false;
        }

        showNotification("Business added successfully!");

        if (typeof window.loadBusinessesFromSupabase === "function") {
            await window.loadBusinessesFromSupabase();
        }

        return true;

    } catch (error) {

        console.error("LosOja error:", error);
        showNotification("Could not connect to the database.");
        return false;
    }
};


document.addEventListener("DOMContentLoaded", function () {

    const form = document.getElementById("addBusinessForm");

    if (!form) return;

    form.addEventListener("submit", async function (event) {

        event.preventDefault();

        const businessData = {
            name: document.getElementById("businessName").value,
            category: document.getElementById("businessCategory").value,
            location: document.getElementById("businessLocation").value,
            description: document.getElementById("businessDescription").value,
            phone: document.getElementById("businessPhone").value,
            email: document.getElementById("businessEmail").value
        };

        const success = await window.addBusiness(businessData);

        if (success) {
            form.reset();

            if (typeof closeModal === "function") {
                closeModal("addBusinessModal");
            }
        }

    });

});
