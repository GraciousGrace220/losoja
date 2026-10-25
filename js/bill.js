(() => {
  "use strict";

  if (window.__losojaBillJsLoaded) return;
  window.__losojaBillJsLoaded = true;

  const SUPABASE_URL = "https://ycxshwgeebskdozmornh.supabase.co";
  const SUPABASE_KEY = "sb_publishable_jFSLacwNupO6T8EnSqb2bw_bZmy7rVe";
  const API = `${SUPABASE_URL}/functions/v1/pay-bill`;
  const HISTORY_API = `${SUPABASE_URL}/rest/v1/bill_transactions`;
  const WALLET_API = `${SUPABASE_URL}/rest/v1/wallet_transactions`;

  const $ = (id) => document.getElementById(id);

  let airtimeBusy = false;
  let dataBusy = false;
  let dataPlansLoading = false;
  let pendingAirtime = false;
  let pendingData = false;

  function getSession() {
    try { return JSON.parse(localStorage.getItem("losoja_supabase_session") || "null"); } catch { return null; }
  }
  function getAccessToken() { return getSession()?.access_token || null; }
  function getUserId() { return getSession()?.user?.id || null; }
  function escapeHTML(value) { return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]); }
  function money(value) { const amount = Number(value); return "₦" + (Number.isFinite(amount) ? amount : 0).toLocaleString("en-NG"); }
  function formatDate(value) { if (!value) return "Date unavailable"; const date = new Date(value); return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleString("en-NG"); }

  function showNotice(message, type = "info", targetId = null) {
    const target = $(targetId) || $("authNotice") || ($("dataTab")?.classList.contains("active") ? $("dataProcessing") : $("airtimeProcessing"));
    if (!target) { console.log(message); return; }
    target.textContent = message;
    target.style.background = type === "error" ? "#fdecec" : type === "success" ? "#e8f7ed" : type === "warning" ? "#fff7df" : "#eef4ff";
    target.style.color = type === "error" ? "#a11" : type === "success" ? "#176b35" : type === "warning" ? "#805900" : "#173d75";
    target.style.display = "block"; target.classList.add("show");
  }
  function hideNotice(targetId) { const target = $(targetId); if (target) { target.textContent = ""; target.classList.remove("show"); target.style.display = "none"; } }
  function hideStaleAttemptNotice(serviceType) {
    const target = $(serviceType === "airtime" ? "airtimeProcessing" : "dataProcessing");
    if (!target) return;
    const message = String(target.textContent || "").toLowerCase();
    const isStale = message.includes("previous attempt") || message.includes("previous airtime attempt is saved") || message.includes("previous data attempt is saved") || message.includes("previous airtime attempt is unresolved") || message.includes("previous data attempt is unresolved");
    if (isStale) hideNotice(serviceType === "airtime" ? "airtimeProcessing" : "dataProcessing");
  }

  async function requestHeaders(json = false) {
    let token;
    if (typeof window.ensureValidSupabaseSession === "function") { const session = await window.ensureValidSupabaseSession(); token = session?.access_token; }
    else token = getAccessToken();
    if (!token) throw new Error("Your session is unavailable. Please sign in again.");
    return { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}`, ...(json ? { "Content-Type": "application/json" } : {}) };
  }
  async function readResponse(response) { const text = await response.text(); if (!text) return {}; try { return JSON.parse(text); } catch { return { message: text }; } }
  function getErrorMessage(data, fallback) { return data?.error || data?.message || data?.msg || data?.details || fallback; }

  async function apiRequest(payload) {
    const headers = await requestHeaders(true);
    const response = await fetch(API, { method: "POST", headers, body: JSON.stringify(payload) });
    const data = await readResponse(response);
    if (!response.ok) { const error = new Error(getErrorMessage(data, `Request failed (${response.status}).`)); error.paymentNotStarted = data?.payment_not_started === true; throw error; }
    return data;
  }

  function attemptStorageKey(serviceType) { const userId = getUserId(); if (!userId) throw new Error("Please sign in again."); return `losoja_bill_attempt_v1_${userId}_${serviceType}`; }
  function readAttempt(serviceType) { try { const value = localStorage.getItem(attemptStorageKey(serviceType)); return value ? JSON.parse(value) : null; } catch { return null; } }
  function saveAttempt(serviceType, attempt) { localStorage.setItem(attemptStorageKey(serviceType), JSON.stringify(attempt)); }
  function clearAttempt(serviceType) { try { localStorage.removeItem(attemptStorageKey(serviceType)); } catch (e) { console.error(e); } }
  function makeFingerprint(serviceType, details) { return JSON.stringify({ serviceType, network: details.network, phone: details.phone, amount: details.amount ?? null, planId: details.planId ?? null }); }
  function getOrCreateAttempt(serviceType, details) {
    const fingerprint = makeFingerprint(serviceType, details);
    const existing = readAttempt(serviceType);
    if (existing) { if (existing.fingerprint !== fingerprint) throw new Error("A previous purchase attempt is still saved. Check bill history first. Do not start a different purchase until the earlier result is resolved."); return existing; }
    if (!crypto.randomUUID) throw new Error("Your browser cannot create a secure purchase reference. Please update your browser before continuing.");
    const attempt = { key: crypto.randomUUID(), fingerprint, createdAt: new Date().toISOString() }; saveAttempt(serviceType, attempt); return attempt;
  }

  async function findAttemptTransaction(attempt) {
    const userId = getUserId(); if (!userId || !attempt?.key) return null;
    const headers = await requestHeaders();
    const query = new URLSearchParams({ select: "id,user_id,status,amount,wallet_reference,idempotency_key", user_id: `eq.${userId}`, idempotency_key: `eq.${attempt.key}`, limit: "1" });
    const response = await fetch(`${HISTORY_API}?${query.toString()}`, { headers });
    const data = await readResponse(response); if (!response.ok || !Array.isArray(data)) return null;
    return data.find((row) => row.user_id === userId && row.idempotency_key === attempt.key) || null;
  }
  async function hasConfirmedRefund(transaction) {
    const reference = transaction?.wallet_reference; const billAmount = Number(transaction?.amount);
    if (!reference || !Number.isFinite(billAmount) || billAmount <= 0) return false;
    try {
      const headers = await requestHeaders();
      const query = new URLSearchParams({ select: "id,type,amount,status,reference", reference: `eq.${reference}-REFUND`, type: "eq.deposit", status: "eq.completed", limit: "5" });
      const response = await fetch(`${WALLET_API}?${query.toString()}`, { headers }); if (!response.ok) return false;
      const rows = await readResponse(response); if (!Array.isArray(rows)) return false;
      return rows.some((row) => row.reference === `${reference}-REFUND` && row.type === "deposit" && row.status === "completed" && Number.isFinite(Number(row.amount)) && Math.abs(Number(row.amount) - billAmount) < 0.01);
    } catch (e) { console.warn(e); return false; }
  }
  async function reconcileAttempt(serviceType) {
    const attempt = readAttempt(serviceType); if (!attempt?.key) return false;
    let transaction; try { transaction = await findAttemptTransaction(attempt); } catch (e) { console.warn(e); return false; }
    if (!transaction) return false;
    const status = String(transaction.status || "").toLowerCase();
    if (["successful","success","completed"].includes(status)) { clearAttempt(serviceType); return true; }
    if (status === "failed" || status === "reversed") { const refunded = await hasConfirmedRefund(transaction); if (refunded) { clearAttempt(serviceType); return true; } }
    return false;
  }
  function syncAttemptStates() {
    pendingAirtime = Boolean(readAttempt("airtime")); pendingData = Boolean(readAttempt("data"));
    const airtimeButton = $("airtimeButton"); const dataButton = $("dataButton");
    if (airtimeBusy) setButton(airtimeButton, true, "Processing...");
    else if (pendingAirtime) { setButton(airtimeButton, true, "Previous Attempt — Check History"); showNotice("A previous airtime attempt is still unresolved. Check bill history before proceeding. Do not create another purchase while its outcome is uncertain.", "warning", "airtimeProcessing"); }
    else { setButton(airtimeButton, false, "Buy Airtime"); hideStaleAttemptNotice("airtime"); }
    if (dataBusy) setButton(dataButton, true, "Processing...");
    else if (pendingData) { setButton(dataButton, true, "Previous Attempt — Check History"); showNotice("A previous data attempt is still unresolved. Check bill history before proceeding. Do not create another purchase while its outcome is uncertain.", "warning", "dataProcessing"); }
    else { setButton(dataButton, false, "Buy Data"); hideStaleAttemptNotice("data"); }
  }

  async function loadHistory() {
    const container = $("billHistory"); if (!container) return;
    const userId = getUserId(); if (!userId || !getAccessToken()) { container.innerHTML = "<p>Please sign in to view your bill history.</p>"; return; }
    container.textContent = "Loading bill history...";
    try {
      const headers = await requestHeaders();
      const query = new URLSearchParams({ select: "*", user_id: `eq.${userId}`, order: "created_at.desc", limit: "20" });
      const response = await fetch(`${HISTORY_API}?${query.toString()}`, { headers });
      const data = await readResponse(response); if (!response.ok || !Array.isArray(data)) throw new Error(getErrorMessage(data, "Could not load bill history."));
      await Promise.all([reconcileAttempt("airtime"), reconcileAttempt("data")]); syncAttemptStates();
      if (data.length === 0) { container.innerHTML = "<p>No bill transactions yet.</p>"; return; }
      container.innerHTML = data.map((item) => {
        const status = String(item.status || "pending").toLowerCase();
        const statusColor = ["success","successful","completed"].includes(status) ? "#087a3e" : ["failed","refunded","reversed"].includes(status) ? "#b42318" : "#946200";
        const phone = item.phone || item.customer_identifier || "";
        return `<article class="history-row"><div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap"><strong>${escapeHTML(item.service_type || "Bill payment")}</strong><strong>${money(item.amount)}</strong></div><div class="history-details">${escapeHTML(item.provider || "")}${item.network ? " · " + escapeHTML(item.network) : ""}${phone ? " · " + escapeHTML(phone) : ""}${item.variation_code ? " · Plan " + escapeHTML(item.variation_code) : ""}</div><p style="color:${statusColor};margin:8px 0">Status: ${escapeHTML(status)}</p><small class="muted">${escapeHTML(formatDate(item.created_at))}</small></article>`;
      }).join("");
    } catch (error) { container.textContent = error.message || "Could not load bill history."; console.error(error); } finally { syncAttemptStates(); }
  }

  function setButton(button, disabled, text) { if (!button) return; button.disabled = disabled; button.textContent = text; }
  function validatePhone(phone) { return /^\d{11}$/.test(phone); }

  // === FIXED FUNCTION - THIS WAS THE BUG ===
  async function loadDataPlans() {
    const select = $("dataPlan");
    if (!select || dataPlansLoading) return;
    dataPlansLoading = true;
    select.disabled = true;
    select.innerHTML = '<option value="">Loading Toppa plans...</option>';
    hideNotice("dataProcessing");
    try {
      const networkRaw = $("dataNetwork")?.value?.trim().toLowerCase() || "mtn";
      const result = await apiRequest({ service_type: "get_data_plans", network: networkRaw });

      if (result.success !== true) {
        throw new Error(getErrorMessage(result, "Could not load data plans."));
      }

      const networkLower = String(result.network || networkRaw || "mtn").toLowerCase();
      const networkUpper = networkLower.toUpperCase();

      let networkPlans = null;
      if (result.plans && typeof result.plans === "object") {
        if (Array.isArray(result.plans)) {
          networkPlans = result.plans;
        } else {
          networkPlans = result.plans[networkUpper] || result.plans[networkLower] || result.plans[networkRaw] || null;
        }
      }
      if (!networkPlans && Array.isArray(result.data)) networkPlans = result.data;
      if (!networkPlans && Array.isArray(result.mtn_plans)) networkPlans = result.mtn_plans;
      // Fallback: if backend sent plans as {mtn: [...] } lowercase, we already handled. If still null, try whole plans object
      if (!networkPlans && result.plans) networkPlans = result.plans;

      const plans = [];
      function collectPlans(value) {
        if (Array.isArray(value)) {
          value.forEach((plan) => {
            if (plan && plan.id != null && (plan.price_raw != null || plan.price != null)) plans.push(plan);
          });
          return;
        }
        if (value && typeof value === "object") Object.values(value).forEach(collectPlans);
      }
      collectPlans(networkPlans);

      const uniquePlans = [...new Map(plans.map((plan) => [String(plan.id), plan])).values()].sort((a,b)=>{
        const priceA = Number(a.price_raw ?? a.price ?? 0);
        const priceB = Number(b.price_raw ?? b.price ?? 0);
        return priceA - priceB || String(a.name||"").localeCompare(String(b.name||""));
      });

      if (!uniquePlans.length) {
        select.innerHTML = '<option value="">No plans available</option>';
        showNotice("No plans were returned for this network. Try refreshing later.", "warning", "dataProcessing");
        return;
      }
      select.innerHTML = '<option value="">Select a data plan</option>';
      uniquePlans.forEach((plan) => {
        const option = document.createElement("option");
        option.value = String(plan.id);
        const name = plan.name || plan.size || `Plan ${plan.id}`;
        const size = plan.size && plan.name ? ` — ${plan.size}` : "";
        const validity = plan.validity ? ` · ${plan.validity}` : "";
        const price = Number(plan.price_raw ?? plan.price);
        const displayPrice = Number.isFinite(price) && price > 0 ? money(price) : String(plan.price || "");
        option.textContent = `${name}${size}${validity} — ${displayPrice}`;
        select.appendChild(option);
      });
    } catch (error) {
      select.innerHTML = '<option value="">Unable to load plans — retry</option>';
      showNotice(`${error.message} You can retry by changing the network or reopening Bills.`, "error", "dataProcessing");
    } finally {
      dataPlansLoading = false;
      select.disabled = false;
    }
  }

  function restoreAttemptStates() { syncAttemptStates(); }

  async function submitAirtime(event) {
    event.preventDefault();
    if (airtimeBusy || pendingAirtime) { showNotice("A previous airtime attempt is unresolved. Check bill history before starting another purchase.", "warning", "airtimeProcessing"); return; }
    const network = $("airtimeNetwork")?.value?.trim().toLowerCase();
    const phone = $("airtimePhone")?.value?.trim();
    const amount = Number($("airtimeAmount")?.value);
    if (!["mtn","airtel","glo","9mobile"].includes(network)) { showNotice("Please select a valid network.", "error", "airtimeProcessing"); return; }
    if (!validatePhone(phone)) { showNotice("Enter a valid 11-digit phone number.", "error", "airtimeProcessing"); return; }
    if (!Number.isFinite(amount) || amount < 50 || amount > 50000) { showNotice("Airtime amount must be between ₦50 and ₦50,000.", "error", "airtimeProcessing"); return; }
    let attempt = null;
    try {
      if (!getUserId() || !getAccessToken()) throw new Error("Please sign in before buying airtime.");
      attempt = getOrCreateAttempt("airtime", { network, phone, amount });
      airtimeBusy = true; window.paymentInProgress = true; syncAttemptStates();
      showNotice("Submitting airtime request. Please wait and do not refresh this page.", "info", "airtimeProcessing");
      const result = await apiRequest({ service_type: "airtime", network, phone, amount, idempotency_key: attempt.key });
      if (result.status === "pending") { pendingAirtime = true; showNotice(`${result.message || "The result is still pending."} Check bill history before taking further action.`, "warning", "airtimeProcessing"); }
      else if (result.status === "failed" || result.status === "reversed") {
        if (result.refunded === true) { clearAttempt("airtime"); pendingAirtime = false; showNotice("The purchase failed and the wallet refund is confirmed.", "success", "airtimeProcessing"); $("airtimeForm")?.reset(); }
        else { pendingAirtime = true; showNotice("The transaction has a final status, but its refund is not confirmed yet. Check history again before retrying.", "warning", "airtimeProcessing"); }
      } else if (result.success === true && result.status === "successful") { clearAttempt("airtime"); pendingAirtime = false; showNotice(result.message || "Airtime purchase confirmed.", "success", "airtimeProcessing"); $("airtimeForm")?.reset(); }
      else { if (result.payment_not_started === true) clearAttempt("airtime"); throw new Error(getErrorMessage(result, "The airtime purchase was not confirmed.")); }
      await loadHistory();
    } catch (error) {
      if (error.paymentNotStarted === true) clearAttempt("airtime"); else if (attempt) pendingAirtime = true;
      showNotice(`${error.message || "Airtime request failed."} Check bill history before retrying.`, "error", "airtimeProcessing"); await loadHistory();
    } finally { airtimeBusy = false; window.paymentInProgress = false; syncAttemptStates(); }
  }

  async function submitData(event) {
    event.preventDefault();
    if (dataBusy || pendingData) { showNotice("A previous data attempt is unresolved. Check bill history before starting another purchase.", "warning", "dataProcessing"); return; }
    const network = $("dataNetwork")?.value?.trim().toLowerCase();
    const phone = $("dataPhone")?.value?.trim();
    const planId = Number($("dataPlan")?.value);
    if (!["mtn","airtel","glo","9mobile"].includes(network)) { showNotice("Please select a valid network.", "error", "dataProcessing"); return; }
    if (!validatePhone(phone)) { showNotice("Enter a valid 11-digit phone number.", "error", "dataProcessing"); return; }
    if (!Number.isSafeInteger(planId) || planId <= 0) { showNotice("Please select an available data plan.", "error", "dataProcessing"); return; }
    let attempt = null;
    try {
      if (!getUserId() || !getAccessToken()) throw new Error("Please sign in before buying data.");
      attempt = getOrCreateAttempt("data", { network, phone, planId });
      dataBusy = true; window.paymentInProgress = true; syncAttemptStates();
      showNotice("Submitting data request. Please wait and do not refresh this page.", "info", "dataProcessing");
      const result = await apiRequest({ service_type: "data", network, phone, plan_id: planId, idempotency_key: attempt.key });
      if (result.status === "pending") { pendingData = true; showNotice(`${result.message || "The result is still pending."} Check bill history before taking further action.`, "warning", "dataProcessing"); }
      else if (result.status === "failed" || result.status === "reversed") {
        if (result.refunded === true) { clearAttempt("data"); pendingData = false; showNotice("The purchase failed and the wallet refund is confirmed.", "success", "dataProcessing"); $("dataForm")?.reset(); }
        else { pendingData = true; showNotice("The transaction has a final status, but its refund is not confirmed yet. Check history again before retrying.", "warning", "dataProcessing"); }
      } else if (result.success === true && result.status === "successful") { clearAttempt("data"); pendingData = false; showNotice(result.message || "Data purchase confirmed.", "success", "dataProcessing"); $("dataForm")?.reset(); }
      else { if (result.payment_not_started === true) clearAttempt("data"); throw new Error(getErrorMessage(result, "The data purchase was not confirmed.")); }
      await loadHistory();
    } catch (error) {
      if (error.paymentNotStarted === true) clearAttempt("data"); else if (attempt) pendingData = true;
      showNotice(`${error.message || "Data request failed."} Check bill history before retrying.`, "error", "dataProcessing"); await loadHistory();
    } finally { dataBusy = false; window.paymentInProgress = false; syncAttemptStates(); }
  }

  function init() {
    $("airtimeForm")?.addEventListener("submit", submitAirtime);
    $("dataForm")?.addEventListener("submit", submitData);
    $("refreshHistory")?.addEventListener("click", loadHistory);
    $("dataNetwork")?.addEventListener("change", loadDataPlans);
    if (!getAccessToken() || !getUserId()) showNotice("Please sign in to buy airtime, buy data, and view bill history.", "error", "airtimeProcessing");
    restoreAttemptStates(); loadHistory(); loadDataPlans();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true }); else init();
  window.losojaLoadBillHistory = loadHistory;
})();
