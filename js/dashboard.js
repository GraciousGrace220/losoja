document.addEventListener("DOMContentLoaded", function () {

    const BUSINESSES_KEY = "losoja_businesses";

    // ================================
    // GET CURRENT USER
    // ================================

    function getCurrentUser() {
        try {
            return JSON.parse(
                localStorage.getItem("losoja_current_user")
            );
        } catch (error) {
            return null;
        }
    }


    // ================================
    // GET USER'S BUSINESSES
    // ================================

    window.getDashboardBusinesses = function () {

        const currentUser = getCurrentUser();

        if (!currentUser) {
            return [];
        }

        const businesses =
            typeof window.getBusinesses === "function"
                ? window.getBusinesses()
                : [];

        return businesses.filter(function (business) {
            return String(business.ownerId) ===
                   String(currentUser.id);
        });
    };


    // ================================
    // ADD BUSINESS
    // ================================

    window.addBusiness = function (businessData) {

        const currentUser = getCurrentUser();

        if (!currentUser) {
            showNotification(
                "Please log in before adding a business."
            );

            openModal("loginModal");
            return false;
        }

        if (!businessData || !businessData.name) {
            showNotification(
                "Please enter a business name."
            );
            return false;
        }

        const businesses =
            typeof window.getBusinesses === "function"
                ? window.getBusinesses()
                : [];

        const newBusiness = {
            id: Date.now().toString(),

            ownerId: currentUser.id,

            name: businessData.name.trim(),

            category:
                businessData.category || "Other",

            location:
                businessData.location || "Nigeria",

            description:
                businessData.description || "",

            phone:
                businessData.phone || "",

            email:
                businessData.email || "",

            rating: 0,

            reviews: 0,

            createdAt: new Date().toISOString()
        };

        businesses.push(newBusiness);

        if (typeof window.saveBusinesses === "function") {
            window.saveBusinesses(businesses);
        } else {
            localStorage.setItem(
                BUSINESSES_KEY,
                JSON.stringify(businesses)
            );
        }

        if (typeof window.renderBusinesses === "function") {
            window.renderBusinesses(businesses);
        }

        showNotification(
            "Your business has been added successfully!"
        );

        return true;
    };


    // ================================
    // ADD BUSINESS FORM
    // ================================

    const addBusinessForm =
        document.getElementById("addBusinessForm");

    if (addBusinessForm) {

        addBusinessForm.addEventListener(
            "submit",
            function (event) {

                event.preventDefault();

                const name =
                    document.getElementById(
                        "businessName"
                    )?.value.trim();

                const category =
                    document.getElementById(
                        "businessCategory"
                    )?.value;

                const location =
                    document.getElementById(
                        "businessLocation"
                    )?.value.trim();

                const description =
                    document.getElementById(
                        "businessDescription"
                    )?.value.trim();

                const phone =
                    document.getElementById(
                        "businessPhone"
                    )?.value.trim();

                const email =
                    document.getElementById(
                        "businessEmail"
                    )?.value.trim();


                if (!name || !category || !location) {

                    showNotification(
                        "Please fill in the required fields."
                    );

                    return;
                }


                const success = window.addBusiness({

                    name: name,

                    category: category,

                    location: location,

                    description: description,

                    phone: phone,

                    email: email

                });


                if (success) {

                    addBusinessForm.reset();

                    closeModal("addBusinessModal");

                }

            }
        );
    }

});
