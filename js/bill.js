
(() => {
  "use strict";

  if (window.__losojaBillJsLoaded) return;
  window.__losojaBillJsLoaded = true;

  const SUPABASE_URL =
    "https://ycxshwgeebskdozmornh.supabase.co";

  const SUPABASE_KEY =
    "sb_publishable_jFSLacwNupO6T8EnSqb2bw_bZmy7rVe";

  const API = `${SUPABASE_URL}/functions/v1/pay-bill`;
  const HISTORY_API = `${SUPABASE_URL}/rest/v1/bill_transactions`;

  const $ = (id) => document.getElementById(id);

  let airtimeBusy = false;
  let dataBusy = false;
  let dataPlansLoading = false;
  let pendingAirtime = false;
  let pendingData = false;

  function getSession() {
    try {
      return JSON.parse(
        localStorage.getItem("losoja_supabase_session") || "null"
      );
    } catch {
      return null;
    }
  }

  function getAccessToken() {
    return getSession()?.access_token || null;
  }

  function getUserId() {
    return getSession()?.user?.id || null;
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function money(value) {
    const amount = Number(value);

    return "₦" + (
      Number.isFinite(amount) ? amount : 0
    ).toLocaleString("en-NG");
  }

  function formatDate(value) {
    if (!value) return "Date unavailable";

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? "Date unavailable"
      : date.toLocaleString("en-NG");
  }

  function showNotice(message, type = "info", id = null) {
    const target =
      $(id) ||
      $("authNotice") ||
      (
        $("dataTab")?.classList.contains("active")
          ? $("dataProcessing")
          : $("airtimeProcessing")
      );

    if (!target) {
      console.log(message);
      return;
    }

    target.textContent = message;

    target.style.background =
      type === "error" ? "#fdecec" :
      type === "success" ? "#e8f7ed" :
      type === "warning" ? "#fff7df" :
      "#eef4ff";

    target.style.color =
      type === "error" ? "#a11" :
      type === "success" ? "#176b35" :
      type === "warning" ? "#805900" :
      "#173d75";

    target.style.display = "block";
    target.classList.add("show");
  }

  function hideNotice(id) {
    const target = $(id);

    if (!target) return;

    target.textContent = "";
    target.classList.remove("show");
    target.style.display = "none";
  }

  function hideStaleAttemptNotice(service) {
    const target = $(
      service === "airtime"
        ? "airtimeProcessing"
        : "dataProcessing"
    );

    if (!target) return;

    const message = String(target.textContent || "").toLowerCase();

    if (message.includes("previous attempt")) {
      hideNotice(
        service === "airtime"
          ? "airtimeProcessing"
          : "dataProcessing"
      );
    }
  }

  async function requestHeaders(json = false) {
    let token;

    if (typeof window.ensureValidSupabaseSession === "function") {
      const session = await window.ensureValidSupabaseSession();
      token = session?.access_token;
    } else {
      token = getAccessToken();
    }

    if (!token) {
      throw new Error(
        "Your session is unavailable. Please sign in again."
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

  async function apiRequest(payload) {
    const headers = await requestHeaders(true);

    const response = await fetch(API, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });

    const data = await readResponse(response);

    if (!response.ok) {
      const error = new Error(
        getErrorMessage(data, `Request failed (${response.status}).`)
      );

      error.paymentNotStarted =
        data?.payment_not_started === true;

      throw error;
    }

    return data;
  }

  function attemptStorageKey(service) {
    const userId = getUserId();

    if (!userId) {
      throw new Error("Please sign in again.");
    }

    return `losoja_bill_attempt_v1_${userId}_${service}`;
  }

  function readAttempt(service) {
    try {
      const value = localStorage.getItem(
        attemptStorageKey(service)
      );

      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  }

  function saveAttempt(service, attempt) {
    localStorage.setItem(
      attemptStorageKey(service),
      JSON.stringify(attempt)
    );
  }

  function clearAttempt(service) {
    try {
      localStorage.removeItem(attemptStorageKey(service));
    } catch (error) {
      console.error(error);
    }
  }

  function makeFingerprint(service, data) {
    return JSON.stringify({
      serviceType: service,
      network: data.network,
      phone: data.phone,
      amount: data.amount ?? null,
      planId: data.planId ?? null
    });
  }

  function getOrCreateAttempt(service, data) {
    const fingerprint = makeFingerprint(service, data);
    const existing = readAttempt(service);

    if (existing) {
      if (existing.fingerprint !== fingerprint) {
        throw new Error(
          "A previous purchase attempt is still saved. " +
          "Check bill history first. Do not start a different " +
          "purchase until the earlier result is resolved."
        );
      }

      return existing;
    }

    if (!crypto.randomUUID) {
      throw new Error(
        "Your browser cannot create a secure purchase reference."
      );
    }

    const attempt = {
      key: crypto.randomUUID(),
      fingerprint,
      createdAt: new Date().toISOString()
    };

    saveAttempt(service, attempt);

    return attempt;
  }

  async function findAttemptTransaction(attempt) {
    const userId = getUserId();

    if (!userId || !attempt?.key) return null;

    const headers = await requestHeaders();

    const query = new URLSearchParams({
      select:
        "id,user_id,status,amount,wallet_reference,idempotency_key",
      user_id: `eq.${userId}`,
      idempotency_key: `eq.${attempt.key}`,
      limit: "1"
    });

    const response = await fetch(
      `${HISTORY_API}?${query.toString()}`,
      { headers }
    );

    const data = await readResponse(response);

    if (!response.ok || !Array.isArray(data)) {
      return null;
    }

    return data.find(
      (row) =>
        row.user_id === userId &&
        row.idempotency_key === attempt.key
    ) || null;
  }

  async function hasConfirmedRefund(transaction) {
    const status = String(
      transaction?.status || ""
    ).toLowerCase();

    if (
      [
        "failed",
        "reversed",
        "refunded",
        "successful",
        "success",
        "completed"
      ].includes(status)
    ) {
      return true;
    }

    return false;
  }

  async function reconcileAttempt(service) {
    const attempt = readAttempt(service);

    if (!attempt?.key) return false;

    let transaction;

    try {
      transaction = await findAttemptTransaction(attempt);
    } catch {
      return false;
    }

    if (!transaction) return false;

    const status = String(
      transaction.status || ""
    ).toLowerCase();

    if (
      [
        "successful",
        "success",
        "completed",
        "failed",
        "reversed",
        "refunded"
      ].includes(status)
    ) {
      clearAttempt(service);
      return true;
    }

    return false;
  }

  function setButton(button, disabled, text) {
    if (!button) return;

    button.disabled = disabled;
    button.textContent = text;
  }

  function syncAttemptStates() {
    pendingAirtime = Boolean(readAttempt("airtime"));
    pendingData = Boolean(readAttempt("data"));

    const airtimeButton = $("airtimeButton");
    const dataButton = $("dataButton");

    if (airtimeBusy) {
      setButton(airtimeButton, true, "Processing...");
    } else if (pendingAirtime) {
      setButton(
        airtimeButton,
        true,
        "Previous Attempt — Check History"
      );

      showNotice(
        "A previous airtime attempt is still unresolved. " +
        "Check bill history before proceeding.",
        "warning",
        "airtimeProcessing"
      );
    } else {
      setButton(airtimeButton, false, "Buy Airtime");
      hideStaleAttemptNotice("airtime");
    }

    if (dataBusy) {
      setButton(dataButton, true, "Processing...");
    } else if (pendingData) {
      setButton(
        dataButton,
        true,
        "Previous Attempt — Check History"
      );

      showNotice(
        "A previous data attempt is still unresolved. " +
        "Check bill history before proceeding.",
        "warning",
        "dataProcessing"
      );
    } else {
      setButton(dataButton, false, "Buy Data");
      hideStaleAttemptNotice("data");
    }
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

    container.textContent = "Loading bill history...";

    try {
      const headers = await requestHeaders();

      const query = new URLSearchParams({
        select: "*",
        user_id: `eq.${userId}`,
        order: "created_at.desc",
        limit: "20"
      });

      const response = await fetch(
        `${HISTORY_API}?${query.toString()}`,
        { headers }
      );

      const data = await readResponse(response);

      if (!response.ok || !Array.isArray(data)) {
        throw new Error(
          getErrorMessage(data, "Could not load bill history.")
        );
      }

      await Promise.all([
        reconcileAttempt("airtime"),
        reconcileAttempt("data")
      ]);

      syncAttemptStates();

      try {
        await apiRequest({
          service_type: "check_pending_bills"
        });

        const headers2 = await requestHeaders();

        const response2 = await fetch(
          `${HISTORY_API}?${query.toString()}`,
          { headers: headers2 }
        );

        const data2 = await readResponse(response2);

        if (response2.ok && Array.isArray(data2)) {
          data.length = 0;
          data2.forEach((item) => data.push(item));
        }
      } catch (error) {
        console.warn(error);
      }

      if (data.length === 0) {
        container.innerHTML =
          "<p>No bill transactions yet.</p>";
        return;
      }

      container.innerHTML = data.map((item) => {
        const status = String(
          item.status || "pending"
        ).toLowerCase();

        const statusColor = [
          "success",
          "successful",
          "completed"
        ].includes(status)
          ? "#087a3e"
          : [
              "failed",
              "refunded",
              "reversed"
            ].includes(status)
            ? "#b42318"
            : "#946200";

        const phone =
          item.phone || item.customer_identifier || "";

        return `
          <article class="history-row">
            <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap">
              <strong>${escapeHTML(item.service_type || "Bill payment")}</strong>
              <strong>${money(item.amount)}</strong>
            </div>

            <div class="history-details">
              ${escapeHTML(item.provider || "")}
              ${item.network ? " · " + escapeHTML(item.network) : ""}
              ${phone ? " · " + escapeHTML(phone) : ""}
              ${item.variation_code ? " · Plan " + escapeHTML(item.variation_code) : ""}
            </div>

            <p style="color:${statusColor};margin:8px 0">
              Status: ${escapeHTML(status)}
            </p>

            <small class="muted">
              ${escapeHTML(formatDate(item.created_at))}
            </small>
          </article>
        `;
      }).join("");
    } catch (error) {
      container.textContent =
        error.message || "Could not load bill history.";
    } finally {
      syncAttemptStates();
    }
  }

  function validatePhone(phone) {
    return /^\d{11}$/.test(phone);
  }

  // =========================================================
  // LOAD TOPPA DATA PLANS
  // Supports flat arrays and network/category groupings.
  // =========================================================

  async function loadDataPlans() {
    const select = $("dataPlan");

    if (!select || dataPlansLoading) return;

    dataPlansLoading = true;
    select.disabled = true;

    select.innerHTML =
      '<option value="">Loading Toppa plans...</option>';

    hideNotice("dataProcessing");

    try {
      const network =
        $("dataNetwork")?.value?.trim().toLowerCase() || "mtn";

      const result = await apiRequest({
        service_type: "get_data_plans",
        network
      });

      if (result.success !== true) {
        throw new Error(
          getErrorMessage(result, "Could not load data plans.")
        );
      }

      const plans = [];
      const seen = new Set();

      function collectPlans(value) {
        if (Array.isArray(value)) {
          value.forEach(collectPlans);
          return;
        }

        if (!value || typeof value !== "object") {
          return;
        }

        const id =
          value.id ??
          value.plan_id ??
          value.variation_code;

        const price =
          value.price_raw ??
          value.price;

        if (
          id != null &&
          price != null &&
          Number.isFinite(Number(price)) &&
          Number(price) > 0
        ) {
          const key = String(id);

          if (!seen.has(key)) {
            seen.add(key);

            plans.push({
              ...value,
              id: key,
              price_raw: Number(price)
            });
          }

          return;
        }

        Object.values(value).forEach(collectPlans);
      }

      // Check known response formats.
      collectPlans(result.data);
      collectPlans(result.mtn_plans);

      const networkKey = String(
        result.network || network
      ).toUpperCase();

      collectPlans(result.plans?.[networkKey]);

      // Also support plans returned directly as an array
      // or an object grouped by network/category.
      collectPlans(result.plans);

      plans.sort((a, b) =>
        a.price_raw - b.price_raw ||
        String(a.name || a.size || "").localeCompare(
          String(b.name || b.size || "")
        )
      );

      console.log("LosOja: data plans loaded", {
        network,
        count: plans.length
      });

      if (plans.length === 0) {
        select.innerHTML =
          '<option value="">No plans available</option>';

        showNotice(
          "The provider returned no usable plans for this network. " +
          "Please retry later.",
          "warning",
          "dataProcessing"
        );

        return;
      }

      select.innerHTML =
        '<option value="">Select a data plan</option>';

      plans.forEach((plan) => {
        const option = document.createElement("option");

        option.value = String(plan.id);

        const name =
          plan.name ||
          plan.size ||
          `Plan ${plan.id}`;

        const size =
          plan.size && plan.name
            ? ` — ${plan.size}`
            : "";

        const validity =
          plan.validity
            ? ` · ${plan.validity}`
            : "";

        option.textContent =
          `${name}${size}${validity} — ${money(plan.price_raw)}`;

        select.appendChild(option);
      });
    } catch (error) {
      console.error(
        "LosOja: unable to load data plans",
        error
      );

      select.innerHTML =
        '<option value="">Unable to load plans — retry</option>';

      showNotice(
        error.message || "Unable to load data plans.",
        "error",
        "dataProcessing"
      );
    } finally {
      dataPlansLoading = false;
      select.disabled = false;
    }
  }

  function restoreAttemptStates() {
    syncAttemptStates();
  }

  async function submitAirtime(event) {
    event.preventDefault();

    if (airtimeBusy || pendingAirtime) {
      showNotice(
        "A previous airtime attempt is unresolved.",
        "warning",
        "airtimeProcessing"
      );
      return;
    }

    const network =
      $("airtimeNetwork")?.value?.trim().toLowerCase();

    const phone =
      $("airtimePhone")?.value?.trim();

    const amount =
      Number($("airtimeAmount")?.value);

    if (!["mtn", "airtel", "glo", "9mobile"].includes(network)) {
      showNotice(
        "Please select a valid network.",
        "error",
        "airtimeProcessing"
      );
      return;
    }

    if (!validatePhone(phone)) {
      showNotice(
        "Enter a valid 11-digit phone number.",
        "error",
        "airtimeProcessing"
      );
      return;
    }

    let attempt = null;

    try {
      attempt = getOrCreateAttempt("airtime", {
        network,
        phone,
        amount
      });

      airtimeBusy = true;
      syncAttemptStates();

      showNotice(
        "Submitting airtime request. Please wait...",
        "info",
        "airtimeProcessing"
      );

      const result = await apiRequest({
        service_type: "airtime",
        network,
        phone,
        amount,
        idempotency_key: attempt.key
      });

      if (
        result.status === "failed" ||
        result.status === "reversed"
      ) {
        clearAttempt("airtime");
        pendingAirtime = false;

        showNotice(
          "Failed and refunded.",
          "success",
          "airtimeProcessing"
        );
      } else if (
        result.success === true &&
        result.status === "successful"
      ) {
        clearAttempt("airtime");
        pendingAirtime = false;

        showNotice(
          "Airtime purchase confirmed.",
          "success",
          "airtimeProcessing"
        );

        $("airtimeForm")?.reset();
      } else if (result.status === "pending") {
        pendingAirtime = true;

        showNotice(
          "Pending - check history.",
          "warning",
          "airtimeProcessing"
        );
      } else {
        if (result.payment_not_started === true) {
          clearAttempt("airtime");
        }

        throw new Error(
          getErrorMessage(result, "Not confirmed.")
        );
      }

      await loadHistory();
    } catch (error) {
      if (error.paymentNotStarted === true) {
        clearAttempt("airtime");
      } else if (attempt) {
        pendingAirtime = true;
      }

      showNotice(
        error.message,
        "error",
        "airtimeProcessing"
      );

      await loadHistory();
    } finally {
      airtimeBusy = false;
      syncAttemptStates();
    }
  }

  async function submitData(event) {
    event.preventDefault();

    if (dataBusy || pendingData) {
      showNotice(
        "A previous data attempt is unresolved.",
        "warning",
        "dataProcessing"
      );
      return;
    }

    const network =
      $("dataNetwork")?.value?.trim().toLowerCase();

    const phone =
      $("dataPhone")?.value?.trim();

    const planId =
      Number($("dataPlan")?.value);

    if (!["mtn", "airtel", "glo", "9mobile"].includes(network)) {
      showNotice(
        "Please select a valid network.",
        "error",
        "dataProcessing"
      );
      return;
    }

    if (!validatePhone(phone)) {
      showNotice(
        "Enter a valid 11-digit phone number.",
        "error",
        "dataProcessing"
      );
      return;
    }

    if (!Number.isSafeInteger(planId) || planId <= 0) {
      showNotice(
        "Please select a data plan.",
        "error",
        "dataProcessing"
      );
      return;
    }

    let attempt = null;

    try {
      attempt = getOrCreateAttempt("data", {
        network,
        phone,
        planId
      });

      dataBusy = true;
      syncAttemptStates();

      showNotice(
        "Submitting data request. Please wait...",
        "info",
        "dataProcessing"
      );

      const result = await apiRequest({
        service_type: "data",
        network,
        phone,
        plan_id: planId,
        idempotency_key: attempt.key
      });

      if (
        result.status === "failed" ||
        result.status === "reversed"
      ) {
        clearAttempt("data");
        pendingData = false;

        showNotice(
          "Failed and refunded.",
          "success",
          "dataProcessing"
        );
      } else if (
        result.success === true &&
        result.status === "successful"
      ) {
        clearAttempt("data");
        pendingData = false;

        showNotice(
          result.message || "Data purchase confirmed.",
          "success",
          "dataProcessing"
        );

        $("dataForm")?.reset();
      } else if (result.status === "pending") {
        pendingData = true;

        showNotice(
          "Pending - check history.",
          "warning",
          "dataProcessing"
        );
      } else {
        if (result.payment_not_started === true) {
          clearAttempt("data");
        }

        throw new Error(
          getErrorMessage(result, "Not confirmed.")
        );
      }

      await loadHistory();
    } catch (error) {
      if (error.paymentNotStarted === true) {
        clearAttempt("data");
      } else if (attempt) {
        pendingData = true;
      }

      showNotice(
        error.message,
        "error",
        "dataProcessing"
      );

      await loadHistory();
    } finally {
      dataBusy = false;
      syncAttemptStates();
    }
  }

  function init() {
    $("airtimeForm")?.addEventListener(
      "submit",
      submitAirtime
    );

    $("dataForm")?.addEventListener(
      "submit",
      submitData
    );

    $("refreshHistory")?.addEventListener(
      "click",
      loadHistory
    );

    $("dataNetwork")?.addEventListener(
      "change",
      loadDataPlans
    );

    restoreAttemptStates();

    loadHistory();
    loadDataPlans();
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      init,
      { once: true }
    );
  } else {
    init();
  }

  window.losojaLoadBillHistory = loadHistory;
})();
