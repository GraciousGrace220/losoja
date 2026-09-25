/*
=========================================================
LosOja - Dashboard
js/dashboard.js

Handles:
- My Dashboard
- User's businesses
- Edit business
- Delete business
=========================================================
*/

(function () {

    "use strict";


    const SUPABASE_URL =
        "https://ycxshwgeebskdozmornh.supabase.co";

    const SUPABASE_KEY =
        "sb_publishable_jFSLacwNupO6T8EnSqb2bw_bZmy7rVe";


    /* =====================================================
       SESSION
    ===================================================== */

    function getSession() {

        if (
            typeof window.getSupabaseSession ===
            "function"
        ) {

            return window.getSupabaseSession();
        }


        try {

            const raw =
                localStorage.getItem(
                    "losoja_supabase_session"
                );

            return raw
                ? JSON.parse(raw)
                : null;

        } catch {

            return null;
        }
    }


    function getUser() {

        return getSession()?.user || null;
    }


    function getToken() {

        const session =
            getSession();

        return (
            session?.access_token ||
            session?.accessToken ||
            null
        );
    }


    /* =====================================================
       HEADERS
    ===================================================== */

    function headers() {

        const token =
            getToken();


        return {

            "apikey":
                SUPABASE_KEY,

            "Content-Type":
                "application/json",

            "Accept":
                "application/json",

            ...(token
                ? {
                    "Authorization":
                        "Bearer " + token
                }
                : {})
        };
    }


    /* =====================================================
       ESCAPE
    ===================================================== */

    function escapeHTML(value) {

        const div =
            document.createElement(
                "div"
            );

        div.textContent =
            String(value ?? "");

        return div.innerHTML;
    }


    /* =====================================================
       DASHBOARD
    ===================================================== */

    function show() {

        const user =
            getUser();

        if (!user) {

            if (
                window.App &&
                typeof App.openModal ===
                "function"
            ) {

                App.openModal(
                    "loginModal"
                );
            }

            return;
        }


        const dashboard =
            document.getElementById(
                "dashboard"
            );

        if (!dashboard) return;


        document.querySelectorAll(
            "main > section"
        ).forEach(
            function (section) {

                if (
                    section.id !==
                    "dashboard"
                ) {

                    section.classList.add(
                        "hidden"
                    );
                }
            }
        );


        dashboard.classList.remove(
            "hidden"
        );


        dashboard.scrollIntoView({
            behavior:
                "smooth",
            block:
                "start"
        });


        load();
    }


    function hide() {

        const dashboard =
            document.getElementById(
                "dashboard"
            );


        if (dashboard) {

            dashboard.classList.add(
                "hidden"
            );
        }


        document.querySelectorAll(
            "main > section"
        ).forEach(
            function (section) {

                if (
                    section.id !==
                    "dashboard"
                ) {

                    section.classList.remove(
                        "hidden"
                    );
                }
            }
        );
    }


    /* =====================================================
       LOAD
    ===================================================== */

    async function load() {

        const user =
            getUser();

        const token =
            getToken();


        const list =
            document.getElementById(
                "dashboardBusinesses"
            );

        const empty =
            document.getElementById(
                "dashboardEmpty"
            );


        if (!list || !empty) {
            return;
        }


        if (
            !user ||
            !token
        ) {

            list.innerHTML = "";

            empty.classList.remove(
                "hidden"
            );

            return;
        }


        list.innerHTML = `
            <p>
                Loading your businesses...
            </p>
        `;

        empty.classList.add(
            "hidden"
        );


        try {

            const response =
                await fetch(
                    SUPABASE_URL +
                    "/rest/v1/businesses?user_id=eq." +
                    encodeURIComponent(
                        user.id
                    ) +
                    "&select=*&order=created_at.desc",
                    {
                        method:
                            "GET",
                        headers:
                            headers()
                    }
                );


            if (!response.ok) {

                let message =
                    "Could not load your businesses.";

                try {

                    const data =
                        await response.json();

                    message =
                        data.message ||
                        data.details ||
                        data.hint ||
                        message;

                } catch {}


                throw new Error(
                    message
                );
            }


            const businesses =
                await response.json();


            if (
                !businesses ||
                businesses.length === 0
            ) {

                list.innerHTML = "";

                empty.classList.remove(
                    "hidden"
                );

                return;
            }


            empty.classList.add(
                "hidden"
            );


            list.innerHTML =
                businesses
                    .map(
                        dashboardCard
                    )
                    .join("");


        } catch (error) {

            console.error(
                "LosOja dashboard error:",
                error
            );


            list.innerHTML = `
                <div class="no-results">

                    <p>
                        Could not load your businesses.
                    </p>

                    <p style="font-size:0.85rem;color:#64748b;">
                        ${escapeHTML(
                            error.message
                        )}
                    </p>

                </div>
            `;
        }
    }


    /* =====================================================
       CARD
    ===================================================== */

    function dashboardCard(
        business
    ) {

        const id =
            escapeHTML(
                business.id
            );


        return `
            <div class="dashboard-business">

                <div>

                    <span class="business-category">
                        ${escapeHTML(
                            business.category
                        )}
                    </span>

                    <h3>
                        ${escapeHTML(
                            business.name
                        )}
                    </h3>

                    <p>
                        📍 ${escapeHTML(
                            business.location
                        )}
                    </p>

                    ${
                        business.description
                        ? `
                            <p>
                                ${escapeHTML(
                                    business.description
                                )}
                            </p>
                        `
                        : ""
                    }

                </div>


                <div class="dashboard-business-actions">

                    <button
                        type="button"
                        class="btn btn-outline"
                        onclick="openEditBusiness('${id}')"
                    >
                        Edit
                    </button>


                    <button
                        type="button"
                        class="btn btn-outline"
                        onclick="deleteDashboardBusiness('${id}')"
                    >
                        Delete
                    </button>

                </div>

            </div>
        `;
    }


    /* =====================================================
       DELETE
    ===================================================== */

    async function deleteDashboardBusiness(
        id
    ) {

        const user =
            getUser();

        const token =
            getToken();


        if (
            !user ||
            !token
        ) {

            if (
                window.App
            ) {

                App.showToast(
                    "Please log in first."
                );
            }

            return;
        }


        const confirmed =
            window.confirm(
                "Are you sure you want to delete this business?"
            );


        if (!confirmed) {
            return;
        }


        try {

            const response =
                await fetch(
                    SUPABASE_URL +
                    "/rest/v1/businesses?id=eq." +
                    encodeURIComponent(
                        id
                    ) +
                    "&user_id=eq." +
                    encodeURIComponent(
                        user.id
                    ),
                    {
                        method:
                            "DELETE",

                        headers:
                            headers()
                    }
                );


            if (!response.ok) {

                let message =
                    "Business could not be deleted.";

                try {

                    const data =
                        await response.json();

                    message =
                        data.message ||
                        data.details ||
                        data.hint ||
                        message;

                } catch {}


                throw new Error(
                    message
                );
            }


            if (
                window.App
            ) {

                App.showToast(
                    "Business deleted successfully."
                );
            }


            await load();


            if (
                typeof window.loadBusinesses ===
                "function"
            ) {

                await window.loadBusinesses();
            }


        } catch (error) {

            console.error(
                "LosOja delete error:",
                error
            );


            if (
                window.App
            ) {

                App.showToast(
                    error.message
                );
            }
        }
    }
    /* =====================================================
       EDIT BUSINESS
    ===================================================== */

    async function openEditBusiness(id) {

        const user =
            getUser();

        const token =
            getToken();

        if (!user || !token) {

            if (
                window.App &&
                typeof window.App.showToast ===
                "function"
            ) {
                window.App.showToast(
                    "Please log in first.",
                    "error"
                );
            }

            return;
        }


        if (!id) {
            return;
        }


        try {

            /* -----------------------------------------
               LOAD BUSINESS
            ----------------------------------------- */

            const response =
                await fetch(
                    SUPABASE_URL +
                    "/rest/v1/businesses?id=eq." +
                    encodeURIComponent(id) +
                    "&user_id=eq." +
                    encodeURIComponent(user.id) +
                    "&select=*",
                    {
                        method: "GET",
                        headers: headers()
                    }
                );


            if (!response.ok) {

                let message =
                    "Could not load this business.";

                try {

                    const data =
                        await response.json();

                    message =
                        data.message ||
                        data.details ||
                        data.hint ||
                        message;

                } catch {}

                throw new Error(message);
            }


            const businesses =
                await response.json();


            if (
                !Array.isArray(businesses) ||
                businesses.length === 0
            ) {

                throw new Error(
                    "Business not found or you do not have permission to edit it."
                );
            }


            const business =
                businesses[0];


            /* -----------------------------------------
               CREATE EDIT MODAL
            ----------------------------------------- */

            let modal =
                document.getElementById(
                    "editBusinessModal"
                );


            if (!modal) {

                modal =
                    document.createElement("div");

                modal.id =
                    "editBusinessModal";

                modal.className =
                    "modal-overlay hidden";

                modal.innerHTML = `
                    <div class="modal-content large">

                        <button
                            type="button"
                            class="modal-close"
                            aria-label="Close"
                        >
                            ×
                        </button>

                        <h2>
                            Edit Your Business
                        </h2>

                        <form
                            id="editBusinessForm"
                        >

                            <div class="form-group">

                                <label
                                    for="editBusinessName"
                                >
                                    Business Name *
                                </label>

                                <input
                                    type="text"
                                    id="editBusinessName"
                                    required
                                >

                            </div>


                            <div class="form-group">

                                <label
                                    for="editBusinessCategory"
                                >
                                    Category *
                                </label>

                                <input
                                    type="text"
                                    id="editBusinessCategory"
                                    required
                                >

                            </div>


                            <div class="form-group">

                                <label
                                    for="editBusinessLocation"
                                >
                                    Location *
                                </label>

                                <input
                                    type="text"
                                    id="editBusinessLocation"
                                    required
                                >

                            </div>


                            <div class="form-group">

                                <label
                                    for="editBusinessPhone"
                                >
                                    Phone Number
                                </label>

                                <input
                                    type="tel"
                                    id="editBusinessPhone"
                                >

                            </div>


                            <div class="form-group">

                                <label
                                    for="editBusinessDescription"
                                >
                                    Description
                                </label>

                                <textarea
                                    id="editBusinessDescription"
                                    rows="5"
                                ></textarea>

                            </div>


                            <p
                                id="editBusinessError"
                                class="form-error hidden"
                            ></p>


                            <button
                                type="submit"
                                class="btn btn-primary form-submit"
                            >
                                Save Changes
                            </button>

                        </form>

                    </div>
                `;

                document.body.appendChild(
                    modal
                );


                const closeButton =
                    modal.querySelector(
                        ".modal-close"
                    );

                if (closeButton) {

                    closeButton.addEventListener(
                        "click",
                        function () {

                            if (
                                window.App &&
                                typeof window.App.closeModal ===
                                "function"
                            ) {
                                window.App.closeModal(
                                    modal
                                );
                            } else {
                                modal.classList.add(
                                    "hidden"
                                );
                                modal.style.display =
                                    "none";
                            }

                        }
                    );

                }


                const form =
                    modal.querySelector(
                        "#editBusinessForm"
                    );


                if (form) {

                    form.addEventListener(
                        "submit",
                        async function (event) {

                            event.preventDefault();

                            await saveEditedBusiness(
                                id
                            );

                        }
                    );

                }

            }


            /* -----------------------------------------
               FILL FORM
            ----------------------------------------- */

            const nameInput =
                document.getElementById(
                    "editBusinessName"
                );

            const categoryInput =
                document.getElementById(
                    "editBusinessCategory"
                );

            const locationInput =
                document.getElementById(
                    "editBusinessLocation"
                );

            const phoneInput =
                document.getElementById(
                    "editBusinessPhone"
                );

            const descriptionInput =
                document.getElementById(
                    "editBusinessDescription"
                );


            if (nameInput) {
                nameInput.value =
                    business.name || "";
            }

            if (categoryInput) {
                categoryInput.value =
                    business.category || "";
            }

            if (locationInput) {
                locationInput.value =
                    business.location || "";
            }

            if (phoneInput) {
                phoneInput.value =
                    business.phone || "";
            }

            if (descriptionInput) {
                descriptionInput.value =
                    business.description || "";
            }


            const error =
                document.getElementById(
                    "editBusinessError"
                );

            if (error) {

                error.textContent = "";

                error.classList.add(
                    "hidden"
                );

            }


            /* -----------------------------------------
               OPEN MODAL
            ----------------------------------------- */

            if (
                window.App &&
                typeof window.App.openModal ===
                "function"
            ) {

                window.App.openModal(
                    modal
                );

            } else {

                modal.classList.remove(
                    "hidden"
                );

                modal.classList.add(
                    "active"
                );

                modal.style.display =
                    "flex";

            }


        } catch (error) {

            console.error(
                "LosOja edit load error:",
                error
            );


            if (
                window.App &&
                typeof window.App.showToast ===
                "function"
            ) {

                window.App.showToast(
                    error.message ||
                    "Could not open the business for editing.",
                    "error"
                );

            }

        }

    }


    /* =====================================================
       SAVE EDITED BUSINESS
    ===================================================== */

    async function saveEditedBusiness(id) {

        const user =
            getUser();

        const token =
            getToken();


        if (!user || !token) {
            return;
        }


        const name =
            document.getElementById(
                "editBusinessName"
            )?.value.trim() || "";

        const category =
            document.getElementById(
                "editBusinessCategory"
            )?.value.trim() || "";

        const location =
            document.getElementById(
                "editBusinessLocation"
            )?.value.trim() || "";

        const phone =
            document.getElementById(
                "editBusinessPhone"
            )?.value.trim() || "";

        const description =
            document.getElementById(
                "editBusinessDescription"
            )?.value.trim() || "";


        const error =
            document.getElementById(
                "editBusinessError"
            );


        if (
            !name ||
            !category ||
            !location
        ) {

            if (error) {

                error.textContent =
                    "Please complete the required fields.";

                error.classList.remove(
                    "hidden"
                );

            }

            return;
        }


        const form =
            document.getElementById(
                "editBusinessForm"
            );


        const submitButton =
            form?.querySelector(
                'button[type="submit"]'
            );


        const originalText =
            submitButton
                ? submitButton.textContent
                : "Save Changes";


        if (submitButton) {

            submitButton.disabled =
                true;

            submitButton.textContent =
                "Saving...";

        }


        try {

            const response =
                await fetch(
                    SUPABASE_URL +
                    "/rest/v1/businesses?id=eq." +
                    encodeURIComponent(id) +
                    "&user_id=eq." +
                    encodeURIComponent(user.id),
                    {
                        method: "PATCH",

                        headers: {
                            ...headers(),

                            "Prefer":
                                "return=representation"
                        },

                        body:
                            JSON.stringify({
                                name,
                                category,
                                location,
                                phone,
                                description
                            })
                    }
                );


            const responseText =
                await response.text();


            let result = null;

            try {

                result =
                    responseText
                        ? JSON.parse(
                            responseText
                        )
                        : null;

            } catch {

                result =
                    responseText;

            }


            if (!response.ok) {

                console.error(
                    "LosOja edit save error:",
                    result
                );


                const message =
                    result &&
                    typeof result === "object" &&
                    (
                        result.message ||
                        result.details ||
                        result.hint
                    )
                        ? (
                            result.message ||
                            result.details ||
                            result.hint
                        )
                        : "Could not save your changes.";

                throw new Error(
                    message
                );

            }


            if (
                window.App &&
                typeof window.App.closeModal ===
                "function"
            ) {

                window.App.closeModal(
                    "editBusinessModal"
                );

            }


            if (
                window.App &&
                typeof window.App.showToast ===
                "function"
            ) {

                window.App.showToast(
                    "Business updated successfully!",
                    "success"
                );

            }


            /* Refresh dashboard */

            await load();


            /* Refresh main business list */

            if (
                typeof window.loadBusinesses ===
                "function"
            ) {

                await window.loadBusinesses(
                    true
                );

            }


        } catch (error) {

            console.error(
                "LosOja edit business error:",
                error
            );


            if (error) {

                if (
                    typeof error.message ===
                    "string"
                ) {

                    if (
                        document.getElementById(
                            "editBusinessError"
                        )
                    ) {

                        const editError =
                            document.getElementById(
                                "editBusinessError"
                            );

                        editError.textContent =
                            error.message;

                        editError.classList.remove(
                            "hidden"
                        );

                    }

                }

            }

        } finally {

            if (submitButton) {

                submitButton.disabled =
                    false;

                submitButton.textContent =
                    originalText;

            }

        }

    }

    /* =====================================================
       NAVIGATION
    ===================================================== */

    function bindDashboardNavigation() {

        const link =
            document.getElementById(
                "dashboardNavLink"
            );


        if (!link) return;


        link.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                show();
            }
        );
    }

/* =====================================================
   PUBLIC API
===================================================== */

window.Dashboard = {

    show:
        show,

    hide:
        hide,

    load:
        load
};


window.deleteDashboardBusiness =
    deleteDashboardBusiness;

window.openEditBusiness =
    openEditBusiness;


/* =====================================================
   START
===================================================== */

    document.addEventListener(
        "DOMContentLoaded",
        function () {

            bindDashboardNavigation();

        }
    );

})();
