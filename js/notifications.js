(function () {
  "use strict";

  if (window.__losojaNotificationsLoaded) return;
  window.__losojaNotificationsLoaded = true;

  const SUPABASE_URL = "https://ycxshwgeebskdozmornh.supabase.co";
  const SUPABASE_KEY = "sb_publishable_jFSLacwNupO6T8EnSqb2bw_bZmy7rVe";

  function readStoredSession() {
    try {
      return JSON.parse(localStorage.getItem("losoja_supabase_session") || "null");
    } catch (error) {
      console.warn("LosOja notifications: stored session could not be read.", error);
      return null;
    }
  }

  async function getCredentials() {
    const stored = readStoredSession();
    if (!stored || !stored.user || !stored.user.id) {
      return { user: null, token: null };
    }

    try {
      let validSession = stored;

      // Use the existing LosOja auth refresh flow. Never silently fall back
      // to an expired token when refresh fails.
      if (typeof window.ensureValidSupabaseSession === "function") {
        validSession = await window.ensureValidSupabaseSession();
      }

      let user = validSession && validSession.user ? validSession.user : stored.user;
      let token = validSession && validSession.access_token ? validSession.access_token : null;

      if (typeof window.getCurrentUser === "function") {
        user = await window.getCurrentUser() || user;
      }
      if (typeof window.getSupabaseAccessToken === "function") {
        token = await window.getSupabaseAccessToken();
      }

      if (!user || !user.id || !token) {
        return { user: null, token: null };
      }
      return { user, token };
    } catch (error) {
      console.warn("LosOja notifications: no valid signed-in session.", error);
      return { user: null, token: null };
    }
  }

  function requestHeaders(token, extra) {
    return Object.assign({
      apikey: SUPABASE_KEY,
      Authorization: "Bearer " + token
    }, extra || {});
  }

  async function readSupabaseError(response) {
    const raw = await response.text().catch(() => "");
    let body = raw;
    try {
      body = raw ? JSON.parse(raw) : null;
    } catch (error) {
      // Keep the raw response text for debugging.
    }
    return {
      status: response.status,
      statusText: response.statusText,
      body: body
    };
  }

  async function supabaseFetch(url, options, operation) {
    const response = await fetch(url, options || {});
    if (!response.ok) {
      const details = await readSupabaseError(response);
      console.error("LosOja notifications Supabase " + operation + " failed:", JSON.stringify(details));
      const error = new Error("Notifications are temporarily unavailable. Please try again.");
      error.status = response.status;
      error.details = details;
      throw error;
    }
    if (response.status === 204) return null;
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  function addStyles() {
    if (document.getElementById("losojaNotifStyle")) return;
    const style = document.createElement("style");
    style.id = "losojaNotifStyle";
    style.textContent = `
      .losoja-notif-wrap { display:inline-flex; align-items:center; margin-left:8px; }
      .losoja-notif-btn, #notificationBtn {
        position:relative; border:0; border-radius:10px; background:#eef8f2;
        color:#087a3e; padding:9px 12px; font-size:19px; cursor:pointer;
      }
      .losoja-notif-count {
        position:absolute; top:-7px; right:-7px; min-width:18px; height:18px;
        padding:0 4px; border-radius:99px; background:#dc2626; color:#fff;
        font:bold 11px Arial; display:flex; align-items:center; justify-content:center;
      }
      .notification-card { cursor:pointer; transition:background .15s ease, box-shadow .15s ease; }\n      .notification-card:hover { background:#eef8f2; box-shadow:0 3px 12px rgba(8,122,62,.10); }\n      .notification-card:focus-visible { outline:2px solid #087a3e; outline-offset:2px; }\n      @media(max-width:600px) {
        .losoja-notif-wrap { margin-left:4px; }
        .losoja-notif-btn, #notificationBtn { padding:8px 10px; }
      }
    `;
    document.head.appendChild(style);
  }

  function attachBell(button) {
    if (!button || button.dataset.losojaNotifReady === "true") return;
    button.dataset.losojaNotifReady = "true";
    button.type = "button";
    button.classList.add("losoja-notif-btn");
    button.setAttribute("aria-label", "Notifications");
    if (!button.querySelector(".losoja-notif-count")) {
      const count = document.createElement("span");
      count.className = "losoja-notif-count";
      count.hidden = true;
      count.textContent = "0";
      button.appendChild(count);
    }
    button.addEventListener("click", function () {
      window.location.href = "notifications.html";
    });
  }

  function mountBell() {
    addStyles();

    // Reuse the homepage's existing bell rather than creating a duplicate.
    const existingBell = document.getElementById("notificationBtn");
    if (existingBell) {
      attachBell(existingBell);
      return;
    }

    const header = document.querySelector("header");
    let wrap = document.querySelector(".losoja-notif-wrap");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.className = "losoja-notif-wrap";
      if (header) {
        const target = header.querySelector(".header-actions, .topbar-inner, .header-inner") || header;
        target.appendChild(wrap);
      } else {
        wrap.style.cssText = "position:fixed;top:12px;right:12px;z-index:12000;background:#fff;padding:5px;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,.15)";
        document.body.appendChild(wrap);
      }
    }

    let button = wrap.querySelector(".losoja-notif-btn");
    if (!button) {
      button = document.createElement("button");
      button.className = "losoja-notif-btn";
      button.innerHTML = "🔔";
      wrap.appendChild(button);
    }
    attachBell(button);
  }

  async function refreshCount() {
    const button = document.querySelector("#notificationBtn, .losoja-notif-btn");
    const count = button && button.querySelector(".losoja-notif-count");
    if (!count) return;

    const credentials = await getCredentials();
    if (!credentials.user || !credentials.token) {
      count.hidden = true;
      return;
    }

    try {
      const url = SUPABASE_URL + "/rest/v1/notifications?select=id&user_id=eq." +
        encodeURIComponent(credentials.user.id) + "&is_read=eq.false";
      const rows = await supabaseFetch(url, {
        headers: requestHeaders(credentials.token)
      }, "unread count");
      const total = Array.isArray(rows) ? rows.length : 0;
      count.textContent = total > 99 ? "99+" : String(total);
      count.hidden = total === 0;
    } catch (error) {
      count.hidden = true;
    }
  }

  function showLoginPrompt(status, list, markButton) {
    status.textContent = "Login to see your notifications.";
    const login = document.createElement("a");
    login.href = "index.html?openLogin=1";
    login.className = "primary";
    login.textContent = "Login";
    list.replaceChildren(login);
    if (markButton) markButton.hidden = true;
  }

  function getNotificationDestination(notification) {
    const type = String(notification.type || "").trim().toLowerCase();
    const title = String(notification.title || "").trim().toLowerCase();
    const message = String(notification.message || "").trim().toLowerCase();

    if (type === "shop_saved" || title.includes("saved your shop") || title.includes("saved your business")) {
      return "saved.html";
    }

    if (
      type.includes("chat") ||
      type.includes("message") ||
      title.includes("new losoja message") ||
      title.includes("new message") ||
      message.includes("new losoja message")
    ) {
      return "baba-oja-chat.html";
    }

    if (type === "wallet_update" || title.includes("wallet update")) {
      return "balance.html";
    }

    if (type === "escrow_update" || title.includes("escrow update")) {
      return "balance.html#escrow";
    }

    return "notifications.html";
  }

  async function renderPage() {
    const list = document.getElementById("notificationsList");
    if (!list) return;

    const status = document.getElementById("notificationsStatus");
    const markButton = document.getElementById("markAllRead");
    const credentials = await getCredentials();

    if (!credentials.user || !credentials.token) {
      showLoginPrompt(status, list, markButton);
      return;
    }

    if (markButton) {
      markButton.hidden = false;
      markButton.onclick = async function () {
        markButton.disabled = true;
        try {
          const url = SUPABASE_URL + "/rest/v1/notifications?user_id=eq." +
            encodeURIComponent(credentials.user.id) + "&is_read=eq.false";
          await supabaseFetch(url, {
            method: "PATCH",
            headers: requestHeaders(credentials.token, {
              "Content-Type": "application/json",
              Prefer: "return=minimal"
            }),
            body: JSON.stringify({ is_read: true })
          }, "mark all read");
          await renderPage();
          await refreshCount();
        } catch (error) {
          status.textContent = error.message;
        } finally {
          markButton.disabled = false;
        }
      };
    }

    status.textContent = "Loading notifications…";
    try {
      // Only request fields displayed here. This avoids a failure if optional
      // related-record columns are changed independently of the notification UI.
      const url = SUPABASE_URL +
        "/rest/v1/notifications?select=id,type,title,message,is_read,created_at,user_id" +
        "&user_id=eq." + encodeURIComponent(credentials.user.id) +
        "&order=is_read.asc,created_at.desc";
      const rows = await supabaseFetch(url, {
        headers: requestHeaders(credentials.token)
      }, "list");

      list.replaceChildren();
      if (!Array.isArray(rows) || rows.length === 0) {
        status.textContent = "No notifications yet";
        list.textContent = "No notifications yet";
        return;
      }

      status.textContent = rows.length + " notification(s)";
      rows.forEach(function (notification) {
        const card = document.createElement("article");
        card.className = "notification-card" + (notification.is_read ? "" : " unread");

        const title = document.createElement("strong");
        title.textContent = notification.title || "LosOja notification";

        const message = document.createElement("p");
        message.textContent = notification.message || "";

        const time = document.createElement("time");
        time.textContent = notification.created_at
          ? new Date(notification.created_at).toLocaleString()
          : "";

        card.append(title, message, time);

        card.tabIndex = 0;
        card.setAttribute("role", "link");
        card.setAttribute("aria-label", (notification.title || "Notification") + ". Open notification destination.");
        const destination = getNotificationDestination(notification);

        async function openNotification() {
          card.style.pointerEvents = "none";
          try {
            if (!notification.is_read) {
              const updateUrl = SUPABASE_URL + "/rest/v1/notifications?id=eq." +
                encodeURIComponent(notification.id) + "&user_id=eq." +
                encodeURIComponent(credentials.user.id);
              await supabaseFetch(updateUrl, {
                method: "PATCH",
                headers: requestHeaders(credentials.token, {
                  "Content-Type": "application/json",
                  Prefer: "return=minimal"
                }),
                body: JSON.stringify({ is_read: true })
              }, "mark read");
              notification.is_read = true;
              card.classList.remove("unread");
              await refreshCount();
            }

            // Generic/unknown notifications intentionally remain on this page.
            if (destination && destination !== "notifications.html") {
              window.location.href = destination;
            }
          } catch (error) {
            status.textContent = error.message || "Could not open this notification.";
          } finally {
            card.style.pointerEvents = "";
          }
        }

        card.addEventListener("click", openNotification);
        card.addEventListener("keydown", function (event) {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openNotification();
          }
        });
        list.appendChild(card);
      });
    } catch (error) {
      status.textContent = error.message || "Notifications are temporarily unavailable.";
      list.replaceChildren();
    }
  }

  function init() {
    mountBell();
    refreshCount();
    if (document.getElementById("notificationsList")) renderPage();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

  window.LosojaNotifications = {
    refreshCount: refreshCount,
    renderPage: renderPage
  };
})();