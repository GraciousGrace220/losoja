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
