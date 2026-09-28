/* =================================================
   NOTIFICATIONS
================================================= */

async openNotifications() {

    let modal =
        document.getElementById(
            "notificationsModal"
        );

    if (!modal) {

        modal =
            document.createElement(
                "div"
            );

        modal.id =
            "notificationsModal";

        modal.className =
            "modal-overlay hidden";

        modal.setAttribute(
            "aria-hidden",
            "true"
        );

        modal.innerHTML = `
            <div class="modal-content">

                <button
                    type="button"
                    class="modal-close"
                    aria-label="Close"
                    onclick="closeModal('notificationsModal')"
                >
                    ×
                </button>

                <div class="modal-header">
                    <h2>Notifications</h2>
                </div>

                <div
                    id="notificationsList"
                    class="notifications-list"
                >
                    <p>Loading notifications...</p>
                </div>

            </div>
        `;

        document.body.appendChild(
            modal
        );
    }

    /* ---------------------------------------------
       OPEN MODAL
    --------------------------------------------- */

    if (
        window.App &&
        typeof window.App.openModal ===
            "function"
    ) {

        window.App.openModal(
            "notificationsModal"
        );

    } else {

        modal.classList.remove(
            "hidden"
        );

        modal.classList.add(
            "active"
        );

        modal.style.display = "flex";
        modal.style.visibility = "visible";
        modal.style.opacity = "1";
        modal.style.pointerEvents = "auto";

        modal.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.classList.add(
            "modal-open"
        );
    }

    const list =
        document.getElementById(
            "notificationsList"
        );

    if (!list) {
        return;
    }

    /* ---------------------------------------------
       CHECK LOGIN
    --------------------------------------------- */

    let currentUser = null;

    try {

        if (
            typeof window.getCurrentUser ===
                "function"
        ) {

            currentUser =
                await window.getCurrentUser();

        }

    } catch (error) {

        console.error(
            "LosOja: Could not get current user:",
            error
        );

    }

    if (!currentUser) {

        list.innerHTML = `
            <p>
                Please login to view your notifications.
            </p>
        `;

        return;
    }

    /* ---------------------------------------------
       GET SUPABASE ACCESS TOKEN
    --------------------------------------------- */

    let accessToken = null;

    try {

        if (
            typeof window.getSupabaseAccessToken ===
                "function"
        ) {

            accessToken =
                window.getSupabaseAccessToken();

        }

    } catch (error) {

        console.error(
            "LosOja: Could not get access token:",
            error
        );

    }

    if (!accessToken) {

        list.innerHTML = `
            <p>
                Please login again to view notifications.
            </p>
        `;

        return;
    }

    /* ---------------------------------------------
       SUPABASE
    --------------------------------------------- */

    const SUPABASE_URL =
        "https://ycxshwgeebskdozmornh.supabase.co";

    /*
       IMPORTANT:
       Paste the exact same complete Supabase
       anon/publishable key already used by your
       working LosOja Supabase code.

       Do not add spaces inside the key.
    */

    const SUPABASE_KEY =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljeHNod2dlZWJza2Rvem1vcm5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzMDY0NjUsImV4cCI6MjEwMzg4MjQ2NX0.tMl7wILdVDhu0RWFaG_84ngJEryLt2c5cB8MEKW3kfU";

    /* ---------------------------------------------
       LOAD NOTIFICATIONS
    --------------------------------------------- */

    try {

        const response =
            await fetch(
                SUPABASE_URL +
                    "/rest/v1/notifications?select=*" +
                    "&user_id=eq." +
                    encodeURIComponent(
                        currentUser.id
                    ) +
                    "&order=created_at.desc",
                {
                    method: "GET",

                    headers: {
                        apikey:
                            SUPABASE_KEY,

                        Authorization:
                            "Bearer " +
                            accessToken,

                        "Content-Type":
                            "application/json"
                    }
                }
            );

        if (!response.ok) {

            let errorData = null;

            try {

                errorData =
                    await response.json();

            } catch (error) {

                errorData = null;

            }

            console.error(
                "LosOja notifications load error:",
                errorData
            );

            throw new Error(
                errorData?.message ||
                "Could not load notifications"
            );
        }

        const notifications =
            await response.json();

        /* -----------------------------------------
           NO NOTIFICATIONS
        ----------------------------------------- */

        if (
            !Array.isArray(
                notifications
            ) ||
            notifications.length === 0
        ) {

            list.innerHTML = `
                <div class="notification-empty">
                    <p>No notifications yet.</p>
                </div>
            `;

            return;
        }

        /* -----------------------------------------
           ESCAPE TEXT
        ----------------------------------------- */

        const escapeNotificationText =
            function (value) {

                const div =
                    document.createElement(
                        "div"
                    );

                div.textContent =
                    value == null
                        ? ""
                        : String(value);

                return div.innerHTML;
            };

        /* -----------------------------------------
           RENDER
        ----------------------------------------- */

        list.innerHTML =
            notifications
                .map(
                    notification => {

                        const title =
                            escapeNotificationText(
                                notification.title ||
                                "Notification"
                            );

                        const message =
                            escapeNotificationText(
                                notification.message ||
                                ""
                            );

                        const date =
                            notification.created_at
                                ? new Date(
                                    notification.created_at
                                  ).toLocaleString()
                                : "";

                        const unread =
                            notification.is_read !==
                            true;

                        return `
                            <div
                                class="notification-item ${
                                    unread
                                        ? "unread"
                                        : ""
                                }"
                                data-notification-id="${
                                    escapeNotificationText(
                                        notification.id
                                    )
                                }"
                            >

                                <div class="notification-content">

                                    <h3>
                                        ${title}

                                        ${
                                            unread
                                                ? `
                                                    <span
                                                        class="notification-new"
                                                    >
                                                        NEW
                                                    </span>
                                                `
                                                : ""
                                        }
                                    </h3>

                                    <p>
                                        ${message}
                                    </p>

                                    <small>
                                        ${escapeNotificationText(
                                            date
                                        )}
                                    </small>

                                </div>

                                ${
                                    unread
                                        ? `
                                            <button
                                                type="button"
                                                class="notification-read-btn"
                                                data-notification-id="${
                                                    escapeNotificationText(
                                                        notification.id
                                                    )
                                                }"
                                            >
                                                Mark as read
                                            </button>
                                        `
                                        : ""
                                }

                            </div>
                        `;

                    }
                )
                .join("");

        /* -----------------------------------------
           MARK AS READ
        ----------------------------------------- */

        list
            .querySelectorAll(
                ".notification-read-btn"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        async () => {

                            const notificationId =
                                button.getAttribute(
                                    "data-notification-id"
                                );

                            if (
                                !notificationId
                            ) {
                                return;
                            }

                            try {

                                const updateResponse =
                                    await fetch(
                                        SUPABASE_URL +
                                            "/rest/v1/notifications?id=eq." +
                                            encodeURIComponent(
                                                notificationId
                                            ),
                                        {
                                            method:
                                                "PATCH",

                                            headers: {
                                                apikey:
                                                    SUPABASE_KEY,

                                                Authorization:
                                                    "Bearer " +
                                                    accessToken,

                                                "Content-Type":
                                                    "application/json",

                                                Prefer:
                                                    "return=minimal"
                                            },

                                            body:
                                                JSON.stringify(
                                                    {
                                                        is_read:
                                                            true
                                                    }
                                                )
                                        }
                                    );

                                if (
                                    !updateResponse.ok
                                ) {

                                    let updateError =
                                        null;

                                    try {

                                        updateError =
                                            await updateResponse.json();

                                    } catch (
                                        error
                                    ) {

                                        updateError =
                                            null;

                                    }

                                    console.error(
                                        "LosOja: Could not mark notification as read:",
                                        updateError
                                    );

                                    throw new Error(
                                        updateError?.message ||
                                        "Could not mark notification as read"
                                    );
                                }

                                /*
                                   Reload notifications
                                   after marking as read.
                                */

                                await this.openNotifications();

                            } catch (
                                error
                            ) {

                                console.error(
                                    "LosOja notifications read error:",
                                    error
                                );

                                if (
                                    typeof window.showToast ===
                                        "function"
                                ) {

                                    window.showToast(
                                        "Could not mark notification as read."
                                    );

                                }

                            }

                        }
                    );

                }
            );

    } catch (error) {

        console.error(
            "LosOja notifications error:",
            error
        );

        list.innerHTML = `
            <div class="notification-error">
                <p>
                    Could not load notifications.
                </p>
            </div>
        `;

        if (
            typeof window.showToast ===
                "function"
        ) {

            window.showToast(
                "Could not load notifications: " +
                (error.message ||
                    "Unknown error")
            );

        }

    }

},
