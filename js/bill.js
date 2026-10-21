
/* LosOja Bills
   Uses the existing auth.js session.
   Does not expose service-role credentials.
*/
(function () {
  "use strict";

  const SUPABASE_URL =
    "https://ycxshwgeebskdozmornh.supabase.co";

  const SUPABASE_KEY =
    "sb_publishable_jFSLacwNupO6T8EnSqb2bw_bZmy7rVe";

  const BILL_FUNCTION =
    SUPABASE_URL + "/functions/v1/pay-bill";

  const HISTORY_URL =
    SUPABASE_URL +
    "/rest/v1/bill_transactions";

  const $ = (id) => document.getElementById(id);

  let paymentInProgress = false;
  let unresolvedPayment = false;
  let currentUserId = null;

  const money = (value) =>
    "₦" + Number(value || 0).toLocaleString("en-NG", {
      maximumFractionDigits: 2
    });

  function showNotice(id, message, type) {
    const element = $(id);
    if (!element) return;

    element.className = "notice show " + (type || "info");
    element.textContent = message;
  }

  function clearNotice(id) {
    const element = $(id);
    if (!element) return;

    element.className = "notice";
    element.textContent = "";
  }

  function setButtonsDisabled(disabled) {
    ["airtimeButton", "dataButton"].forEach((id) => {
      if ($(id)) $(id).disabled = disabled;
    });
  }

  function setPaymentLock(locked) {
    window.paymentInProgress = locked;
    setButtonsDisabled(locked);
  }

  async function getSessionAndToken() {
    if (typeof window.ensureValidSupabaseSession === "function") {
      await window.ensureValidSupabaseSession();
    }

    if (typeof window.getSupabaseSession !== "function") {
      throw new Error(
        "LosOja authentication is unavailable. Please check auth.js."
      );
    }

    const session = window.getSupabaseSession();

    if (!session || !session.access_token) {
      throw new Error("Please log in to your LosOja account first.");
    }

    if (session.expires_at &&
        session.expires_at <= Math.floor(Date.now() / 1000)) {
      throw new Error(
        "Your login session has expired. Please log in again."
      );
    }

    const token =
      typeof window.getSupabaseAccessToken === "function"
        ? window.getSupabaseAccessToken()
        : session.access_token;

    if (!token) {
      throw new Error("Could not retrieve your login token.");
    }

    return { session, token };
  }

  async function getCurrentUser(token) {
    const response = await fetch(
      SUPABASE_URL + "/auth/v1/user",
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: "Bearer " + token
        }
      }
    );

    if (!response.ok) {
      throw new Error(
        "Could not verify your login. Please refresh or log in again."
      );
    }

    return response.json();
  }

  async function apiHistory(token) {
    const url = new URL(HISTORY_URL);

    url.searchParams.set("select", "*");
    url.searchParams.set("user_id", "eq." + currentUserId);
    url.searchParams.set("order", "created_at.desc");
    url.searchParams.set("limit", "50");

    const response = await fetch(url.toString(), {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: "Bearer " + token
      },
      cache: "no-store"
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        "History could not load (" + response.status + "). " +
        text.slice(0, 180)
      );
    }

    return response.json();
  }

  function normalizeStatus(value) {
    return String(value || "unknown").toLowerCase();
  }

  function renderHistory(rows) {
    const container = $("billHistory");
    if (!container) return;

    container.replaceChildren();

    if (!Array.isArray(rows) || rows.length === 0) {
      container.textContent = "No bill transactions found yet.";
      unresolvedPayment = false;
      setPaymentLock(false);
      return;
    }

    const hasPending = rows.some((row) =>
      ["pending", "processing", "initiated"].includes(
        normalizeStatus(row.status)
      )
    );

    unresolvedPayment = hasPending;

    rows.forEach((row) => {
      const item = document.createElement("div");
      item.className = "history-item";

      const title = document.createElement("strong");
      title.textContent =
        String(row.service_type || "Bill")
          .replace(/_/g, " ")
          .replace(/\b\w/g, (char) => char.toUpperCase()) +
        (row.network ? " · " + String(row.network).toUpperCase() : "");

      const amount = document.createElement("div");
      amount.textContent = money(
        row.total_amount != null
          ? row.total_amount
          : Number(row.amount || 0) + Number(row.fee || 0)
      );

      const status = document.createElement("div");
      status.textContent =
        "Status: " + normalizeStatus(row.status).toUpperCase();

      const details = document.createElement("div");
      details.className = "muted";

      const phone =
        row.customer_identifier || row.phone || "Not provided";

      const date = row.created_at
        ? new Date(row.created_at).toLocaleString("en-NG")
        : "Date unavailable";

      details.textContent = "Phone: " + phone + " · " + date;

      item.append(title, amount, status, details);

      if (row.failure_reason) {
        const reason = document.createElement("div");
        reason.className = "muted";
        reason.textContent = "Details: " + row.failure_reason;
        item.appendChild(reason);
      }

      container.appendChild(item);
    });

    setPaymentLock(unresolvedPayment);
  }

  async function refreshHistory() {
    const container = $("billHistory");

    if (!currentUserId) {
      if (container) {
        container.textContent =
          "Log in to view your bill transaction history.";
      }
      return;
    }

    if (container) container.textContent = "Loading transaction history…";

    try {
      const { token } = await getSessionAndToken();
      const rows = await apiHistory(token);
      renderHistory(rows);

      if (unresolvedPayment) {
        showNotice(
          "authNotice",
          "A bill transaction is still pending. Check history before attempting another payment.",
          "warning"
        );
      }
    } catch (error) {
      if (container) {
        container.textContent = error.message ||
          "Unable to load bill history.";
      }
    }
  }

  async function submitPayment({
    serviceType,
    network,
    phone,
    amount,
    variationCode,
    noticeId,
    buttonId
  }) {
    if (paymentInProgress || unresolvedPayment) {
      showNotice(
        noticeId,
        "A previous payment is unresolved. Refresh transaction history and confirm its status before paying again.",
        "warning"
      );
      return;
    }

    if (!/^\d{11}$/.test(phone)) {
      showNotice(noticeId, "Enter a valid 11-digit phone number.", "error");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      showNotice(noticeId, "Enter a valid payment amount.", "error");
      return;
    }

    if (
      serviceType === "airtime" &&
      (amount < 50 || amount > 100000)
    ) {
      showNotice(
        noticeId,
        "Airtime must be between ₦50 and ₦100,000.",
        "error"
      );
      return;
    }

    const expectedDataPrices = {
      "mtn-10mb-100": 100,
      "mtn-50mb-200": 200,
      "mtn-100mb-1000": 1000
    };

    if (
      serviceType === "data" &&
      expectedDataPrices[variationCode] !== amount
    ) {
      showNotice(noticeId, "Invalid data plan selection.", "error");
      return;
    }

    clearNotice(noticeId);
    paymentInProgress = true;
    setPaymentLock(true);

    const button = $(buttonId);
    const originalText = button ? button.textContent : "";

    if (button) button.textContent = "Processing…";

    showNotice(
      noticeId,
      "Submitting your request. Please do not refresh or submit another payment.",
      "info"
    );

    let serverAcceptedRequest = false;

    try {
      const { token } = await getSessionAndToken();

      const payload = {
        service_type: serviceType,
        network,
        phone,
        amount
      };

      if (serviceType === "data") {
        payload.variation_code = variationCode;
      }

      const response = await fetch(BILL_FUNCTION, {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: "Bearer " + token,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      let result;

      try {
        result = await response.json();
      } catch {
        throw new Error(
          "The payment result could not be confirmed. Check transaction history before retrying."
        );
      }

      if (result.transaction_id) {
        serverAcceptedRequest = true;
      }

      if (result.status === "successful" && result.success) {
        showNotice(
          noticeId,
          "Payment successful! Check your transaction history for details.",
          "success"
        );
      } else if (
        result.status === "failed" &&
        result.refunded === true
      ) {
        showNotice(
          noticeId,
          result.message || "Payment failed and the server reports a refund.",
          "error"
        );
      } else if (
        result.status === "pending" ||
        result.transaction_id ||
        response.status >= 500
      ) {
        unresolvedPayment = true;

        showNotice(
          noticeId,
          result.error ||
            "Payment status is not confirmed. Check transaction history before trying again.",
          "warning"
        );
      } else {
        showNotice(
          noticeId,
          result.error ||
            "The request was rejected. No successful payment was confirmed.",
          "error"
        );
      }

      await refreshHistory();

      if (result.status === "pending" || result.transaction_id) {
        unresolvedPayment = true;
        setPaymentLock(true);
      }
    } catch (error) {
      if (serverAcceptedRequest) {
        unresolvedPayment = true;
        setPaymentLock(true);
      }

      showNotice(
        noticeId,
        error.message ||
          "The payment result is uncertain. Check history before retrying.",
        "warning"
      );
    } finally {
      paymentInProgress = false;

      if (button) button.textContent = originalText;

      setPaymentLock(unresolvedPayment);
    }
  }

  function initializeTabs() {
    document.querySelectorAll(".tab-button").forEach((button) => {
      button.addEventListener("click", () => {
        if (paymentInProgress || unresolvedPayment) {
          alert(
            "Please resolve the pending payment before starting another transaction."
          );
          return;
        }

        document.querySelectorAll(".tab-button").forEach((tab) =>
          tab.classList.remove("active")
        );

        document.querySelectorAll(".tab-content").forEach((tab) =>
          tab.classList.remove("active")
        );

        button.classList.add("active");

        const target = $(button.dataset.tab);
        if (target) target.classList.add("active");
      });
    });
  }

  function initializeForms() {
    $("airtimeForm").addEventListener("submit", async (event) => {
      event.preventDefault();

      await submitPayment({
        serviceType: "airtime",
        network: $("airtimeNetwork").value,
        phone: $("airtimePhone").value.trim(),
        amount: Number($("airtimeAmount").value),
        noticeId: "airtimeNotice",
        buttonId: "airtimeButton"
      });
    });

    $("dataForm").addEventListener("submit", async (event) => {
      event.preventDefault();

      const plan = $("dataPlan");
      const selected = plan.options[plan.selectedIndex];

      await submitPayment({
        serviceType: "data",
        network: $("dataNetwork").value,
        phone: $("dataPhone").value.trim(),
        amount: Number(plan.value),
        variationCode: selected
          ? selected.dataset.variation
          : "",
        noticeId: "dataNotice",
        buttonId: "dataButton"
      });
    });

    $("refreshHistory").addEventListener("click", refreshHistory);
  }

  async function initialize() {
    initializeTabs();
    initializeForms();
    setPaymentLock(true);

    try {
      const { token } = await getSessionAndToken();
      const user = await getCurrentUser(token);

      if (!user || !user.id) {
        throw new Error("Please log in to use LosOja Bills.");
      }

      currentUserId = user.id;

      showNotice(
        "authNotice",
        "You are logged in. Your bill history is linked to your account.",
        "success"
      );

      await refreshHistory();
    } catch (error) {
      showNotice(
        "authNotice",
        error.message || "Please log in to continue.",
        "warning"
      );

      const history = $("billHistory");
      if (history) {
        history.textContent = "Log in to view your bill history.";
      }

      setPaymentLock(true);
    }
  }

  initialize();
})();
