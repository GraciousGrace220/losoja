document.addEventListener("DOMContentLoaded", function () {

    // ================================
    // MODAL FUNCTIONS
    // ================================

    function openModal(id) {
        const modal = document.getElementById(id);

        if (modal) {
            modal.classList.add("active");
        }
    }

    function closeModal(id) {
        const modal = document.getElementById(id);

        if (modal) {
            modal.classList.remove("active");
        }
    }

    window.openModal = openModal;
    window.closeModal = closeModal;


    // ================================
    // LOGIN / SIGNUP BUTTONS
    // ================================

    const loginButtons = document.querySelectorAll(
        "#loginBtn, .login-btn"
    );

    loginButtons.forEach(function (button) {
        button.addEventListener("click", function (event) {
            event.preventDefault();
            openModal("loginModal");
        });
    });


    const signupButtons = document.querySelectorAll(
        "#signupBtn, .signup-btn"
    );

    signupButtons.forEach(function (button) {
        button.addEventListener("click", function (event) {
            event.preventDefault();
            openModal("signupModal");
        });
    });


    // ================================
    // CLOSE BUTTONS
    // ================================

    document.querySelectorAll(".modal-close").forEach(function (button) {

        button.addEventListener("click", function () {

            const modal = button.closest(".modal");

            if (modal) {
                modal.classList.remove("active");
            }

        });

    });


    // ================================
    // CLICK OUTSIDE MODAL
    // ================================

    document.querySelectorAll(".modal").forEach(function (modal) {

        modal.addEventListener("click", function (event) {

            if (event.target === modal) {
                modal.classList.remove("active");
            }

        });

    });


    // ================================
    // ESCAPE KEY
    // ================================

    document.addEventListener("keydown", function (event) {

        if (event.key === "Escape") {

            document.querySelectorAll(".modal.active").forEach(function (modal) {
                modal.classList.remove("active");
            });

        }

    });


    // ================================
    // SEARCH
    // ================================

    const searchForm = document.getElementById("searchForm");

    if (searchForm) {

        searchForm.addEventListener("submit", function (event) {

            event.preventDefault();

            const searchInput = document.getElementById("searchInput");
            const locationInput = document.getElementById("locationInput");

            const search = searchInput
                ? searchInput.value.trim()
                : "";

            const location = locationInput
                ? locationInput.value.trim()
                : "";

            if (typeof window.searchBusinesses === "function") {

                window.searchBusinesses(search, location);

            } else {

                showNotification("Search is loading. Please try again.");

            }

        });

    }


    // ================================
    // CATEGORY BUTTONS
    // ================================

    document.querySelectorAll("[data-category]").forEach(function (button) {

        button.addEventListener("click", function () {

            const category = button.getAttribute("data-category");

            if (
                category &&
                typeof window.filterBusinessesByCategory === "function"
            ) {

                window.filterBusinessesByCategory(category);

            }

        });

    });


    // ================================
    // POPULAR SEARCHES
    // ================================

    document.querySelectorAll("[data-search]").forEach(function (button) {

        button.addEventListener("click", function () {

            const searchTerm = button.getAttribute("data-search");

            const searchInput = document.getElementById("searchInput");

            if (searchInput) {
                searchInput.value = searchTerm;
            }

            if (typeof window.searchBusinesses === "function") {
                window.searchBusinesses(searchTerm, "");
            }

        });

    });


    // ================================
    // ADD BUSINESS BUTTONS
    // ================================

    document.querySelectorAll(
        "#addBusinessBtn, .add-business-btn"
    ).forEach(function (button) {

        button.addEventListener("click", function (event) {

            event.preventDefault();

            openModal("addBusinessModal");

        });

    });


    // ================================
    // BUSINESS VIEW BUTTONS
    // ================================

    document.addEventListener("click", function (event) {

        const button = event.target.closest("[data-business-id]");

        if (!button) {
            return;
        }

        const businessId = button.getAttribute("data-business-id");

        if (
            businessId &&
            typeof window.openBusiness === "function"
        ) {

            window.openBusiness(businessId);

        }

    });


    // ================================
    // NOTIFICATION
    // ================================

    window.showNotification = function (message) {

        let notification = document.getElementById("notification");

        if (!notification) {

            notification = document.createElement("div");

            notification.id = "notification";

            notification.className = "notification";

            document.body.appendChild(notification);

        }

        notification.textContent = message;

        notification.classList.add("show");

        setTimeout(function () {

            notification.classList.remove("show");

        }, 3000);

    };


    // ================================
    // YEAR IN FOOTER
    // ================================

    const yearElement = document.getElementById("currentYear");

    if (yearElement) {

        yearElement.textContent = new Date().getFullYear();

    }

});