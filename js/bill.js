**File:** `js/bill.js`

(() => {
  "use strict";

  if (window.__losojaBillJsLoaded) return;
  window.__losojaBillJsLoaded = true;

  const SUPABASE_URL =
    "https://ycxshwgeebskdozmornh.supabase.co";

  const SUPABASE_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljeHNod2dlZWJza2Rvem1vcm5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzMDY0NjUsImV4cCI6MjEwMzg4MjQ2NX0.tMl7wILdVDhu0RWFaG_84ngJEryLt2c5cB8MEKW3kfU";

  const API = `${SUPABASE_URL}/functions/v1/pay-bill`;
  const HISTORY_API = `${SUPABASE_URL}/rest/v1/bill_transactions`;

  const DATA_PLANS = {
    "mtn-10mb-100": 100,
    "mtn-50mb-200": 200,
    "mtn-100mb-1000": 1000
  };

  const $ = (id) => document.getElementById(id);

  let airtimeBusy = false;
  let dataBusy = false;

  function getSession() {
    try {
      return JSON.parse(
        localStorage.getItem("losoja_supabase_session") || "null"
      );
    } catch (error) {
      return null;
    }
  }

  function getAccessToken() {
    const session = getSession();
    return session?.access_token || null;
  }

  function getUserId() {
    const session = getSession();
    return session?.user?.id || null;
  }

  function showNotice(message, type = "info") {
    const notice = $("authNotice");
    if (!notice) {
      alert(message);
      return;
    }

    notice.textContent = message;
    notice.style.display = "block";
    notice.style.padding = "12px";
    notice.style.margin = "12px 0";
    notice.style.borderRadius = "8px";
    notice.style.background =
      type === "error" ? "#fdecec" :
      type === "success" ? "#e8f7ed" : "#eef4ff";
    notice.style.color =
      type === "error" ? "#a11" :
      type === "success" ? "#176b35" : "#173d75";
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]);
  }

  function money(value) {
    const amount = Number(value);
    return "₦" + (Number.isFinite(amount) ? amount : 0)
      .toLocaleString("en-NG");
  }

  function formatDate(value) {
    if (!value) return "Date unavailable";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Date unavailable";

    return date.toLocaleString("en-NG");
  }

  async function requestHeaders(json = false) {
    const token = getAccessToken();

    if (!token) {
      throw new Error(
        "You are not logged in. Please sign in, then return to Bills."
      );
    }

    return {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${token}`,
      ...(json ? { "Content-Type": "application/json" } : {})
    };
  }

  async function readResponse(response) {
    const text = await response.text();

    if (!text) return {};

    try {
      return JSON.parse(text);
    } catch {
      return { message: text };
    }
  }

  function getErrorMessage(data, fallback) {
    return (
      data?.error ||
      data?.message ||
      data?.msg ||
      data?.details ||
      fallback
    );
  }

  async function loadHistory() {
    const container = $("billHistory");
    if (!container) return;

    const userId = getUserId();

    if (!userId || !getAccessToken()) {
      container.innerHTML =
        "<p>Please sign in to view your bill history.</p>";
      return;
    }

    container.innerHTML = "<p>Loading bill history...</p>";

    try {
      const headers = await requestHeaders();

      const url =
        `${HISTORY_API}?select=*&user_id=eq.${encodeURIComponent(userId)}` +
        "&order=created_at.desc&limit=20";

      const response = await fetch(url, {
        method: "GET",
        headers
      });

      const data = await readResponse(response);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            "Your login session may have expired. Sign in again, then reopen Bills."
          );
        }

        throw new Error(
          getErrorMessage(data, "Could not load bill history.")
        );
      }

      if (!Array.isArray(data) || data.length === 0) {
        container.innerHTML = "<p>No bill transactions yet.</p>";
        return;
      }

      container.innerHTML = data.map((item) => {
        const status = String(item.status || "pending").toLowerCase();

        const statusColor =
          status === "success" || status === "completed"
            ? "#087a3e"
            : status === "failed" || status === "refunded"
              ? "#b42318"
              : "#946200";

        const phone = item.phone || item.customer_identifier || "";
        const service = item.service_type || "Bill payment";

        return `
          <article style="
            padding:14px;
            margin:10px 0;
            border:1px solid #e3e8e5;
            border-radius:10px;
            background:#fff;
          ">
            <div style="
              display:flex;
              justify-content:space-between;
              gap:12px;
              flex-wrap:wrap;
            ">
              <strong>${escapeHTML(service)}</strong>
              <strong>${money(item.amount)}</strong>
            </div>

            <p style="margin:8px 0">
              ${escapeHTML(item.network || "")}
              ${phone ? " · " + escapeHTML(phone) : ""}
            </p>

            <p style="margin:6px 0;color:${statusColor}">
              Status: ${escapeHTML(status)}
            </p>

            <small style="color:#667085">
              ${escapeHTML(formatDate(item.created_at))}
            </small>
          </article>
        `;
      }).join("");

    } catch (error) {
      container.innerHTML =
        `<p>${escapeHTML(error.message || "Could not load bill history.")}</p>`;
    }
  }

  function setButton(button, processing, originalText) {
    if (!button) return;

    button.disabled = processing;
    button.textContent = processing ? "Processing..." : originalText;
  }

  function validatePhone(phone) {
    return /^\d{11}$/.test(phone);
  }

  async function payBill(payload, button, originalText) {
    const headers = await requestHeaders(true);

    const response = await fetch(API, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });

    const data = await readResponse(response);

    if (!response.ok) {
      throw new Error(
        getErrorMessage(data, `Payment request failed (${response.status}).`)
      );
    }

    return data;
  }

  async function submitAirtime(event) {
    event.preventDefault();

    if (airtimeBusy) return;

    const network = $("airtimeNetwork")?.value?.trim().toLowerCase();
    const phone = $("airtimePhone")?.value?.trim();
    const amount = Number($("airtimeAmount")?.value);
    const button = $("airtimeButton");
    const originalText = button?.textContent || "Buy Airtime";

    if (!["mtn", "airtel", "glo", "9mobile"].includes(network)) {
      showNotice("Please select a valid network.", "error");
      return;
    }

    if (!validatePhone(phone)) {
      showNotice("Enter a valid 11-digit phone number.", "error");
      return;
    }

    if (!Number.isFinite(amount) || amount < 50 || amount > 100000) {
      showNotice("Airtime amount must be between ₦50 and ₦100,000.", "error");
      return;
    }

    try {
      if (!getUserId() || !getAccessToken()) {
        throw new Error(
          "You are not logged in. Please sign in, then return to Bills."
        );
      }

      airtimeBusy = true;
      setButton(button, true, originalText);
      showNotice("Submitting airtime request. Please wait.");

      const result = await payBill({
        service_type: "airtime",
        network,
        phone,
        amount
      }, button, originalText);

      showNotice(
        getErrorMessage(result, "Airtime request submitted.") ,
        "success"
      );

      $("airtimeForm")?.reset();
      await loadHistory();

    } catch (error) {
      showNotice(
        `${error.message || "Airtime request failed."} If the request timed out or its outcome is unclear, check bill history before trying again.`,
        "error"
      );

      await loadHistory();

    } finally {
      airtimeBusy = false;
      setButton(button, false, originalText);
    }
  }

  async function submitData(event) {
    event.preventDefault();

    if (dataBusy) return;

    const network = $("dataNetwork")?.value?.trim().toLowerCase();
    const phone = $("dataPhone")?.value?.trim();
    const variationCode = $("dataPlan")?.value?.trim();
    const amount = DATA_PLANS[variationCode];
    const button = $("dataButton");
    const originalText = button?.textContent || "Buy Data";

    if (network !== "mtn") {
      showNotice("Only MTN data plans are currently supported.", "error");
      return;
    }

    if (!validatePhone(phone)) {
      showNotice("Enter a valid 11-digit phone number.", "error");
      return;
    }

    if (!variationCode || !amount) {
      showNotice("Please select a valid MTN data plan.", "error");
      return;
    }

    try {
      if (!getUserId() || !getAccessToken()) {
        throw new Error(
          "You are not logged in. Please sign in, then return to Bills."
        );
      }

      dataBusy = true;
      setButton(button, true, originalText);
      showNotice("Submitting data request. Please wait.");

      const result = await payBill({
        service_type: "data",
        network: "mtn",
        phone,
        amount,
        variation_code: variationCode
      }, button, originalText);

      showNotice(
        getErrorMessage(result, "Data request submitted."),
        "success"
      );

      $("dataForm")?.reset();
      await loadHistory();

    } catch (error) {
      showNotice(
        `${error.message || "Data request failed."} If the request timed out or its outcome is unclear, check bill history before trying again.`,
        "error"
      );

      await loadHistory();

    } finally {
      dataBusy = false;
      setButton(button, false, originalText);
    }
  }

  function init() {
    $("airtimeForm")?.addEventListener("submit", submitAirtime);
    $("dataForm")?.addEventListener("submit", submitData);
    $("refreshHistory")?.addEventListener("click", loadHistory);

    if (!getAccessToken() || !getUserId()) {
      showNotice(
        "Please sign in to buy airtime, buy data, and view your bill history.",
        "error"
      );
    }

    loadHistory();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

  window.losojaLoadBillHistory = loadHistory;
})();
