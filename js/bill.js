
(() => {
  "use strict";

  const SUPABASE_URL = "https://ycxshwgeebskdozmornh.supabase.co";
  const SUPABASE_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljeHNod2dlZWJza2Rvem1vcm5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzMDY0NjUsImV4cCI6MjEwMzg4MjQ2NX0.tMl7wILdVDhu0RWFaG_G84ngJEryLt2c5cB8MEKW3kfU";

  const $ = id => document.getElementById(id);
  let user = null;
  let session = null;
  let paymentLocked = false;

  function getSession() {
    try {
      return JSON.parse(
        localStorage.getItem("losoja_supabase_session") || "null"
      );
    } catch {
      return null;
    }
  }

  function showMessage(id, message, keepVisible = true) {
    const box = $(id);
    if (!box) return;

    box.textContent = message;
    box.classList.toggle("show", keepVisible);
  }

  function setButtonsDisabled(disabled) {
    ["airtimeButton", "dataButton"].forEach(id => {
      const button = $(id);
      if (button) button.disabled = disabled;
    });
  }

  function setPaymentLock(locked) {
    paymentLocked = locked;
    window.paymentInProgress = locked;
    setButtonsDisabled(locked);
  }

  function formatNaira(value) {
    const amount = Number(value);
    return Number.isFinite(amount)
      ? "₦" + amount.toLocaleString("en-NG")
      : "—";
  }

  function addHistoryRow(container, bill) {
    const row = document.createElement("div");
    row.style.cssText =
      "padding:12px 0;border-bottom:1px solid #e5e7eb;overflow-wrap:anywhere";

    const title = document.createElement("strong");
    title.textContent =
      String(bill.service_type || "Bill").toUpperCase() +
      " · " + formatNaira(bill.amount);

    const details = document.createElement("div");
    details.style.cssText =
      "font-size:14px;color:#555;margin-top:5px";

    const parts = [
      bill.network,
      bill.phone || bill.customer_identifier,
      bill.status,
      bill.created_at
        ? new Date(bill.created_at).toLocaleString()
        : ""
    ].filter(Boolean);

    details.textContent = parts.join(" · ");
    row.append(title, details);
    container.appendChild(row);
  }

  async function loadHistory() {
    const container = $("billHistory");
    if (!container || !user || !session?.access_token) return;

    container.textContent = "Loading bill history…";

    try {
      const params = new URLSearchParams({
        select: "*",
        user_id: "eq." + user.id,
        order: "created_at.desc",
        limit: "20"
      });

      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/bill_transactions?${params}`,
        {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: "Bearer " + session.access_token
          }
        }
      );

      if (!response.ok) {
        throw new Error("History could not be loaded (" + response.status + ").");
      }

      const rows = await response.json();
      container.replaceChildren();

      if (!Array.isArray(rows) || rows.length === 0) {
        container.textContent = "No bill transactions found yet.";
        return;
      }

      rows.forEach(bill => addHistoryRow(container, bill));
    } catch (error) {
      console.error("LosOja bill history error:", error);
      container.textContent =
        "Bill history is temporarily unavailable. Please refresh to try again.";
    }
  }

  async function submitBill(event, serviceType) {
    event.preventDefault();

    if (paymentLocked) {
      alert("A payment is still being resolved. Check history before trying again.");
      return;
    }

    session = getSession();
    user = session?.user || null;

    if (!user || !session?.access_token) {
      alert("Your login session is missing. Please log in again.");
      window.location.href = "index.html?openLogin=1";
      return;
    }

    const isAirtime = serviceType === "airtime";
    const prefix = isAirtime ? "airtime" : "data";
    const network = $(prefix + "Network")?.value;
    const phone = $(prefix + "Phone")?.value.trim();
    const amount = Number($(isAirtime ? "airtimeAmount" : "dataPlan")?.value);
    const processingId = prefix + "Processing";

    if (!network || !/^\d{11}$/.test(phone || "")) {
      showMessage(processingId, "Select a network and enter an 11-digit phone number.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      showMessage(processingId, "Please select a valid amount or data plan.");
      return;
    }

    let variationCode = null;

    if (!isAirtime) {
      const plan = $("dataPlan");
      variationCode = plan?.selectedOptions?.[0]?.dataset?.variation || null;

      if (
        network !== "mtn" ||
        !["mtn-10mb-100", "mtn-50mb-200", "mtn-100mb-1000"]
          .includes(variationCode)
      ) {
        showMessage(processingId, "Please select a supported MTN data plan.");
        return;
      }
    }

    if (isAirtime && (amount < 50 || amount > 100000)) {
      showMessage(processingId, "Airtime must be between ₦50 and ₦100,000.");
      return;
    }

    const payload = {
      service_type: serviceType,
      network,
      phone,
      amount,
      variation_code: variationCode
    };

    setPaymentLock(true);
    showMessage(processingId, "Submitting payment securely. Please wait.");

    let responseReceived = false;

    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/pay-bill`,
        {
          method: "POST",
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: "Bearer " + session.access_token,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        }
      );

      responseReceived = true;

      let result;
      try {
        result = await response.json();
      } catch {
        result = {};
      }

      if (result.status === "successful" && result.success) {
        showMessage(processingId, "Payment successful!");
        $(isAirtime ? "airtimePhone" : "dataPhone").value = "";

        if (isAirtime) {
          $("airtimeAmount").value = "";
          $("airtimeNetwork").value = "";
        } else {
          $("dataPlan").value = "";
        }

        setPaymentLock(false);
        await loadHistory();
        return;
      }

      if (
        result.status === "pending" ||
        response.status >= 500 ||
        !result.status && response.ok
      ) {
        setPaymentLock(true);
        showMessage(
          processingId,
          "Payment status is not confirmed. Do not submit again yet. Check your bill history before retrying."
        );
        await loadHistory();
        return;
      }

      if (result.payment_not_started === true) {
        setPaymentLock(false);
        showMessage(
          processingId,
          result.error || "Payment was not started. Please correct the issue and try again."
        );
        return;
      }

      if (result.status === "failed" && result.refunded === true) {
        setPaymentLock(false);
        showMessage(
          processingId,
          result.message || "Payment failed and the backend confirmed the refund."
        );
        await loadHistory();
        return;
      }

      // A response without a confirmed final outcome is treated cautiously.
      setPaymentLock(true);
      showMessage(
        processingId,
        result.error || "Payment outcome could not be confirmed. Do not retry yet; check history."
      );
      await loadHistory();

    } catch (error) {
      console.error("LosOja bill payment error:", error);

      // A lost connection may happen after the provider has received the request.
      setPaymentLock(true);
      showMessage(
        processingId,
        responseReceived
          ? "We could not verify the result. Do not retry yet; check history."
          : "Connection interrupted. The payment result may be uncertain. Do not retry yet; check history."
      );
    }
  }

  document.addEventListener("DOMContentLoaded", async () => {
    if (typeof window.getCurrentUser !== "function") {
      alert("LosOja login service did not load. Please refresh the page.");
      return;
    }

    session = getSession();
    user = await window.getCurrentUser();

    if (!user || !session?.access_token) {
      window.location.href = "index.html?openLogin=1";
      return;
    }

    $("airtimeForm")?.addEventListener("submit", event =>
      submitBill(event, "airtime")
    );

    $("dataForm")?.addEventListener("submit", event =>
      submitBill(event, "data")
    );

    await loadHistory();
  });
})();
