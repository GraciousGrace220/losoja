
(() => {
  "use strict";

  const URL_BASE = "https://ycxshwgeebskdozmornh.supabase.co";

  // Same public anon JWT used by the existing root auth.js.
  const API_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljeHNod2dlZWJza2Rvem1vcm5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzMDY0NjUsImV4cCI6MjEwMzg4MjQ2NX0.tMl7wILdVDhu0RWFaG_G84ngJEryLt2c5cB8MEKW3kfU";

  const $ = id => document.getElementById(id);

  let busy = false;
  let uncertain = false;
  let currentUser = null;
  let currentSession = null;

  function readSession() {
    try {
      return JSON.parse(
        localStorage.getItem("losoja_supabase_session") || "null"
      );
    } catch {
      return null;
    }
  }

  function message(id, text) {
    const box = $(id);
    if (!box) return;
    box.textContent = text;
    box.classList.add("show");
  }

  function lockPayment(value) {
    busy = value;
    window.paymentInProgress = value;

    ["airtimeButton", "dataButton"].forEach(id => {
      if ($(id)) $(id).disabled = value;
    });
  }

  function money(value) {
    const number = Number(value);
    return Number.isFinite(number)
      ? "₦" + number.toLocaleString("en-NG")
      : "Amount unavailable";
  }

  async function loadHistory() {
    const output = $("billHistory");
    if (!output) return;

    currentSession = readSession();
    currentUser = currentSession?.user || null;

    if (!currentUser || !currentSession?.access_token) {
      output.textContent = "Please log in to view bill history.";
      return;
    }

    output.textContent = "Loading history…";

    try {
      const query = new URLSearchParams({
        select: "id,user_id,service_type,network,phone,customer_identifier,amount,status,created_at",
        user_id: "eq." + currentUser.id,
        order: "created_at.desc",
        limit: "20"
      });

      const response = await fetch(
        `${URL_BASE}/rest/v1/bill_transactions?${query}`,
        {
          headers: {
            apikey: API_KEY,
            Authorization: "Bearer " + currentSession.access_token
          }
        }
      );

      if (!response.ok) {
        throw new Error("History request failed: HTTP " + response.status);
      }

      const rows = await response.json();
      output.replaceChildren();

      if (!Array.isArray(rows) || rows.length === 0) {
        output.textContent = "No bill transactions found yet.";
        return;
      }

      rows.forEach(item => {
        const row = document.createElement("div");
        row.className = "history-row";

        const heading = document.createElement("strong");
        heading.textContent =
          String(item.service_type || "Bill").toUpperCase() +
          " — " + money(item.amount);

        const details = document.createElement("div");
        details.className = "history-details";

        const values = [
          item.network,
          item.phone || item.customer_identifier,
          "Status: " + String(item.status || "unknown"),
          item.created_at
            ? new Date(item.created_at).toLocaleString()
            : ""
        ].filter(Boolean);

        details.textContent = values.join(" · ");
        row.append(heading, details);
        output.appendChild(row);
      });
    } catch (error) {
      console.error("LosOja history error:", error);
      output.textContent =
        "History could not load. Check the table permissions and session, then refresh.";
    }
  }

  async function submitBill(event, type) {
    event.preventDefault();

    if (busy || uncertain) {
      alert(
        "A payment may still be processing. Refresh history and confirm its status before making another purchase."
      );
      return;
    }

    currentSession = readSession();
    currentUser = currentSession?.user || null;

    if (!currentUser || !currentSession?.access_token) {
      alert("Your LosOja login session is missing. Please log in again.");
      window.location.href = "index.html?openLogin=1";
      return;
    }

    const airtime = type === "airtime";
    const prefix = airtime ? "airtime" : "data";
    const network = $(prefix + "Network")?.value;
    const phone = $(prefix + "Phone")?.value.trim();
    const amount = Number(
      $(airtime ? "airtimeAmount" : "dataPlan")?.value
    );
    const statusId = prefix + "Processing";

    if (!network || !/^\d{11}$/.test(phone || "")) {
      message(statusId, "Select a network and enter an 11-digit phone number.");
      return;
    }

    if (!Number.isInteger(amount) || amount <= 0) {
      message(statusId, "Please choose a valid amount or data plan.");
      return;
    }

    let variationCode = null;

    if (airtime) {
      if (!["mtn", "airtel", "glo", "9mobile"].includes(network)) {
        message(statusId, "Please select a supported network.");
        return;
      }

      if (amount < 50 || amount > 100000) {
        message(statusId, "Airtime must be between ₦50 and ₦100,000.");
        return;
      }
    } else {
      const plan = $("dataPlan");
      variationCode =
        plan?.selectedOptions?.[0]?.dataset?.variation || null;

      if (
        network !== "mtn" ||
        ![
          "mtn-10mb-100",
          "mtn-50mb-200",
          "mtn-100mb-1000"
        ].includes(variationCode)
      ) {
        message(statusId, "Please select a supported MTN data plan.");
        return;
      }
    }

    lockPayment(true);
    message(statusId, "Submitting your request. Please wait…");

    try {
      const response = await fetch(`${URL_BASE}/functions/v1/pay-bill`, {
        method: "POST",
        headers: {
          apikey: API_KEY,
          Authorization: "Bearer " + currentSession.access_token,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          service_type: type,
          network,
          phone,
          amount,
          variation_code: variationCode
        })
      });

      let result = {};
      try {
        result = await response.json();
      } catch {
        // An unreadable response does not prove the payment failed.
      }

      if (result.success === true && result.status === "successful") {
        message(statusId, "Payment successful.");
        uncertain = false;
        lockPayment(false);

        if (airtime) {
          $("airtimeNetwork").value = "";
          $("airtimePhone").value = "";
          $("airtimeAmount").value = "";
        } else {
          $("dataPhone").value = "";
          $("dataPlan").value = "";
        }

        await loadHistory();
        return;
      }

      if (
        result.payment_not_started === true ||
        response.status === 400 ||
        response.status === 401 ||
        response.status === 403 ||
        response.status === 405
      ) {
        // These responses indicate the request was rejected before
        // a provider payment was confirmed as started.
        lockPayment(false);
        message(
          statusId,
          result.error || "Request rejected. Check your login and the details."
        );
        return;
      }

      if (result.status === "failed" && result.refunded === true) {
        uncertain = false;
        lockPayment(false);
        message(
          statusId,
          result.message || "Payment failed; the backend reports a refund."
        );
        await loadHistory();
        return;
      }

      // Pending, server errors, and unknown outcomes must not be retried
      // automatically: the provider may already have received the request.
      uncertain = true;
      lockPayment(true);
      message(
        statusId,
        result.error ||
          "Payment outcome is unconfirmed. Do not submit again. Check history and confirm the transaction status first."
      );
      await loadHistory();

    } catch (error) {
      console.error("LosOja payment request error:", error);

      // A network error cannot tell us whether the backend processed payment.
      uncertain = true;
      lockPayment(true);
      message(
        statusId,
        "Connection interrupted. The payment result is unknown. Do not retry until the transaction has been checked."
      );
    }
  }

  document.addEventListener("DOMContentLoaded", async () => {
    if (typeof window.getCurrentUser !== "function") {
      alert("LosOja authentication did not load. Refresh and try again.");
      return;
    }

    currentSession = readSession();
    currentUser = await window.getCurrentUser();

    if (!currentUser || !currentSession?.access_token) {
      window.location.href = "index.html?openLogin=1";
      return;
    }

    $("airtimeForm")?.addEventListener("submit", event =>
      submitBill(event, "airtime")
    );

    $("dataForm")?.addEventListener("submit", event =>
      submitBill(event, "data")
    );

    $("refreshHistory")?.addEventListener("click", loadHistory);

    await loadHistory();
  });
})();
