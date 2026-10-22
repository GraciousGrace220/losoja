
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
    return Number.isNaN(date.getTime())
      ? "Date unavailable"
      : date.toLocaleString("en-NG");
  }

  function showNotice(message, type = "info", targetId = null) {
    const target =
      $(targetId) ||
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
      type === "warning" ? "#fff7df" : "#eef4ff";

    target.style.color =
      type === "error" ? "#a11" :
      type === "success" ? "#176b35" :
      type === "warning" ? "#805900" : "#173d75";

    target.style.display = "block";
    target.classList.add("show");
  }

  function hideNotice(targetId) {
    const target = $(targetId);
    if (target) {
      target.textContent = "";
      target.classList.remove("show");
      target.style.display = "none";
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
      throw new Error("Your session is unavailable. Please sign in again.");
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
    return data?.error || data?.message || data?.msg ||
      data?.details || fallback;
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
      throw new Error(
        getErrorMessage(data, `Request failed (${response.status}).`)
      );
    }

    return data;
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

      const url =
        `${HISTORY_API}?select=*&user_id=eq.${encodeURIComponent(userId)}` +
        "&order=created_at.desc&limit=20";

      const response = await fetch(url, { headers });
      const data = await readResponse(response);

      if (!response.ok) {
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
          ["success", "successful", "completed"].includes(status)
            ? "#087a3e"
            : ["failed", "refunded", "reversed"].includes(status)
              ? "#b42318"
              : "#946200";

        const phone = item.phone || item.customer_identifier || "";

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
              ${item.variation_code
                ? " · Plan " + escapeHTML(item.variation_code)
                : ""}
            </div>
            <p style="color:${statusColor};margin:8px 0">
              Status: ${escapeHTML(status)}
            </p>
            <small class="muted">${escapeHTML(formatDate(item.created_at))}</small>
          </article>
        `;
      }).join("");

    } catch (error) {
      container.textContent =
        error.message || "Could not load bill history.";
    }
  }

  function setButton(button, disabled, text) {
    if (!button) return;
    button.disabled = disabled;
    button.textContent = text;
  }

  function validatePhone(phone) {
    return /^\d{11}$/.test(phone);
  }

  async function loadDataPlans() {
    const select = $("dataPlan");
    if (!select || dataPlansLoading) return;

    dataPlansLoading = true;
    select.disabled = true;
    select.innerHTML = '<option value="">Loading Toppa plans...</option>';
    hideNotice("dataProcessing");

    try {
      const network = $("dataNetwork")?.value?.trim().toLowerCase();

      const result = await apiRequest({
        service_type: "get_data_plans",
        network: network || "mtn"
      });

      if (result.success !== true || !result.plans) {
        throw new Error(
          getErrorMessage(result, "Could not load data plans.")
        );
      }

      const networkKey = String(result.network || network || "mtn").toUpperCase();
      const networkPlans = result.plans[networkKey];

      const plans = [];

      function collectPlans(value) {
        if (Array.isArray(value)) {
          value.forEach((plan) => {
            if (
              plan &&
              plan.id != null &&
              (plan.price_raw != null || plan.price != null)
            ) {
              plans.push(plan);
            }
          });
          return;
        }

        if (value && typeof value === "object") {
          Object.values(value).forEach(collectPlans);
        }
      }

      collectPlans(networkPlans);

      const uniquePlans = [
        ...new Map(plans.map((plan) => [String(plan.id), plan])).values()
      ].sort((a, b) => {
        const priceA = Number(a.price_raw ?? 0);
        const priceB = Number(b.price_raw ?? 0);
        return priceA - priceB || String(a.name || "").localeCompare(String(b.name || ""));
      });

      if (!uniquePlans.length) {
        select.innerHTML = '<option value="">No plans available</option>';
        showNotice(
          "No plans were returned for this network. Try refreshing later.",
          "warning",
          "dataProcessing"
        );
        return;
      }

      select.innerHTML = '<option value="">Select a data plan</option>';

      uniquePlans.forEach((plan) => {
        const option = document.createElement("option");
        option.value = String(plan.id);

        const name = plan.name || plan.size || `Plan ${plan.id}`;
        const size = plan.size && plan.name
          ? ` — ${plan.size}`
          : "";
        const validity = plan.validity
          ? ` · ${plan.validity}`
          : "";
        const price = Number(plan.price_raw);

        const displayPrice = Number.isFinite(price) && price > 0
          ? money(price)
          : String(plan.price || "");

        option.textContent =
          `${name}${size}${validity} — ${displayPrice}`;

        select.appendChild(option);
      });

    } catch (error) {
      select.innerHTML = '<option value="">Unable to load plans — retry</option>';

      showNotice(
        `${error.message} You can retry by changing the network or reopening Bills.`,
        "error",
        "dataProcessing"
      );

    } finally {
      dataPlansLoading = false;
      select.disabled = false;
    }
  }

  async function submitAirtime(event) {
    event.preventDefault();

    if (airtimeBusy || pendingAirtime) {
      showNotice(
        "An airtime result is still pending. Check bill history before attempting another purchase.",
        "warning",
        "airtimeProcessing"
      );
      return;
    }

    const network = $("airtimeNetwork")?.value?.trim().toLowerCase();
    const phone = $("airtimePhone")?.value?.trim();
    const amount = Number($("airtimeAmount")?.value);
    const button = $("airtimeButton");
    const originalText = "Buy Airtime";

    if (!["mtn", "airtel", "glo", "9mobile"].includes(network)) {
      showNotice("Please select a valid network.", "error", "airtimeProcessing");
      return;
    }

    if (!validatePhone(phone)) {
      showNotice("Enter a valid 11-digit phone number.", "error", "airtimeProcessing");
      return;
    }

    if (!Number.isFinite(amount) || amount < 50 || amount > 50000) {
      showNotice(
        "Airtime amount must be between ₦50 and ₦50,000.",
        "error",
        "airtimeProcessing"
      );
      return;
    }

    try {
      if (!getUserId() || !getAccessToken()) {
        throw new Error("Please sign in before buying airtime.");
      }

      airtimeBusy = true;
      window.paymentInProgress = true;
      setButton(button, true, "Processing...");
      showNotice(
        "Submitting airtime request. Please wait and do not refresh this page.",
        "info",
        "airtimeProcessing"
      );

      const result = await apiRequest({
        service_type: "airtime",
        network,
        phone,
        amount
      });

          if (result.status === "pending") {
        pendingAirtime = true;
        setButton(button, true, "Pending — Check History");

        showNotice(
          `${result.message || "The result is still pending."} Do not buy the same airtime again until the transaction is resolved.`,
          "warning",
          "airtimeProcessing"
        );

      } else if (result.status === "failed") {
        pendingAirtime = false;

        showNotice(
          result.refunded === true
            ? "Airtime purchase failed. The server reports that your wallet refund was processed."
            : "Airtime purchase failed. Check your wallet and transaction history before trying again.",
          "error",
          "airtimeProcessing"
        );

        $("airtimeForm")?.reset();

      } else if (
        result.success === true &&
        result.status === "successful"
      ) {
        pendingAirtime = false;

        showNotice(
          result.message || "Airtime purchase confirmed.",
          "success",
          "airtimeProcessing"
        );

        $("airtimeForm")?.reset();

      } else {
        throw new Error(
          getErrorMessage(
            result,
            "The airtime purchase was not confirmed."
          )
        );
      }

      await loadHistory();

    } catch (error) {
      showNotice(
        `${error.message || "Airtime request failed."} If the outcome is unclear, check bill history before retrying.`,
        "error",
        "airtimeProcessing"
      );
      await loadHistory();

    } finally {
      airtimeBusy = false;
      window.paymentInProgress = false;

      if (!pendingAirtime) {
        setButton(button, false, originalText);
      }
    }
  }

  async function submitData(event) {
    event.preventDefault();

    if (dataBusy || pendingData) {
      showNotice(
        "A data purchase result is still pending. Check bill history before trying again.",
        "warning",
        "dataProcessing"
      );
      return;
    }

    const network = $("dataNetwork")?.value?.trim().toLowerCase();
    const phone = $("dataPhone")?.value?.trim();
    const planId = Number($("dataPlan")?.value);
    const button = $("dataButton");
    const originalText = "Buy Data";

    if (!network) {
      showNotice("Please select a network.", "error", "dataProcessing");
      return;
    }

    if (!validatePhone(phone)) {
      showNotice("Enter a valid 11-digit phone number.", "error", "dataProcessing");
      return;
    }

    if (!Number.isSafeInteger(planId) || planId <= 0) {
      showNotice("Please select an available data plan.", "error", "dataProcessing");
      return;
    }

    try {
      if (!getUserId() || !getAccessToken()) {
        throw new Error("Please sign in before buying data.");
      }

      dataBusy = true;
      window.paymentInProgress = true;
      setButton(button, true, "Processing...");
      showNotice(
        "Submitting data request. Please wait and do not refresh this page.",
        "info",
        "dataProcessing"
      );

     
      const result = await apiRequest({
        service_type: "data",
        network,
        phone,
        plan_id: planId
      });

      if (result.status === "pending") {
        pendingData = true;
        setButton(button, true, "Pending — Check History");

        showNotice(
          `${result.message || "The result is still pending."} Do not buy the same data again until the transaction is resolved.`,
          "warning",
          "dataProcessing"
        );

      } else if (result.status === "failed") {
        pendingData = false;

        showNotice(
          result.refunded === true
            ? "Data purchase failed. The server reports that your wallet refund was processed."
            : "Data purchase failed. Check your wallet and transaction history before trying again.",
          "error",
          "dataProcessing"
        );

        $("dataForm")?.reset();

      } else if (
        result.success === true &&
        result.status === "successful"
      ) {
        pendingData = false;

        showNotice(
          result.message || "Data purchase confirmed.",
          "success",
          "dataProcessing"
        );

        $("dataForm")?.reset();

      } else {
        throw new Error(
          getErrorMessage(
            result,
            "The data purchase was not confirmed."
          )
        );
      }

      await loadHistory();


    } catch (error) {
      showNotice(
        `${error.message || "Data request failed."} If the outcome is unclear, check bill history before retrying.`,
        "error",
        "dataProcessing"
      );
      await loadHistory();

    } finally {
      dataBusy = false;
      window.paymentInProgress = false;

      if (!pendingData) {
        setButton(button, false, originalText);
      }
    }
  }

  function init() {
    $("airtimeForm")?.addEventListener("submit", submitAirtime);
    $("dataForm")?.addEventListener("submit", submitData);
    $("refreshHistory")?.addEventListener("click", loadHistory);

    $("dataNetwork")?.addEventListener("change", loadDataPlans);

    if (!getAccessToken() || !getUserId()) {
      showNotice(
        "Please sign in to buy airtime, buy data, and view bill history.",
        "error",
        "airtimeProcessing"
      );
    }

    loadHistory();
    loadDataPlans();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

  window.losojaLoadBillHistory = loadHistory;
})();
