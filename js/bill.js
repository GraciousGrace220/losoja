```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#087a3e">
  <title>LosOja Bills</title>

  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Arial, sans-serif;
      background: #f5f7f6;
      color: #17211b;
    }
    header {
      background: #087a3e;
      color: white;
      padding: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    header h1 { margin: 0; font-size: 22px; }
    header a { color: white; text-decoration: none; }
    nav { display: flex; gap: 16px; }
    main { max-width: 720px; margin: auto; padding: 20px 14px 40px; }
    .card {
      background: white;
      border-radius: 12px;
      padding: 18px;
      margin-bottom: 18px;
      box-shadow: 0 2px 8px rgba(0,0,0,.06);
    }
    .tabs { display: flex; gap: 8px; margin-bottom: 18px; }
    .tab-button {
      flex: 1;
      border: 0;
      background: #e5e7eb;
      padding: 12px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: bold;
    }
    .tab-button.active { background: #087a3e; color: white; }
    .tab-content { display: none; }
    .tab-content.active { display: block; }
    label { display: block; margin: 14px 0 6px; font-weight: 600; }
    input, select {
      width: 100%;
      padding: 12px;
      border: 1px solid #cbd5ce;
      border-radius: 8px;
      font: inherit;
      background: white;
    }
    .primary-button {
      width: 100%;
      margin-top: 18px;
      padding: 13px;
      border: 0;
      border-radius: 8px;
      background: #087a3e;
      color: white;
      font-weight: bold;
      cursor: pointer;
    }
    .primary-button:disabled { opacity: .6; cursor: wait; }
    .notice {
      display: none;
      padding: 12px;
      border-radius: 8px;
      margin-top: 14px;
      overflow-wrap: anywhere;
    }
    .notice.show { display: block; }
    .notice.info { background: #eff6ff; color: #1e40af; }
    .notice.success { background: #ecfdf5; color: #065f46; }
    .notice.error { background: #fef2f2; color: #991b1b; }
    .notice.warning { background: #fff7df; color: #854d0e; }
    .history-item {
      border-bottom: 1px solid #e5e7eb;
      padding: 12px 0;
      overflow-wrap: anywhere;
    }
    .history-item:last-child { border-bottom: 0; }
    .muted { color: #647067; font-size: 13px; }
    .small-link { color: #087a3e; font-weight: bold; }
  </style>
</head>

<body>
<header>
  <h1>LosOja Bills</h1>
  <nav>
    <a href="balance.html">Wallet</a>
    <a href="account.html">Account</a>
  </nav>
</header>

<main>
  <div id="authNotice" class="notice warning show">
    Checking your LosOja login…
  </div>

  <section class="card">
    <h2>Buy airtime or data</h2>
    <p class="muted">Confirm the network, phone number and amount before paying.</p>

    <div class="tabs">
      <button type="button" class="tab-button active" data-tab="airtimeTab">Airtime</button>
      <button type="button" class="tab-button" data-tab="dataTab">Data</button>
    </div>

    <section id="airtimeTab" class="tab-content active">
      <form id="airtimeForm">
        <label for="airtimeNetwork">Network</label>
        <select id="airtimeNetwork" required>
          <option value="">Select network</option>
          <option value="mtn">MTN</option>
          <option value="airtel">Airtel</option>
          <option value="glo">Glo</option>
          <option value="9mobile">9mobile</option>
        </select>

        <label for="airtimePhone">Phone number</label>
        <input id="airtimePhone" type="tel" inputmode="numeric"
               maxlength="11" pattern="[0-9]{11}"
               placeholder="11-digit phone number" required>

        <label for="airtimeAmount">Amount (₦)</label>
        <input id="airtimeAmount" type="number" min="50" max="100000"
               step="1" placeholder="e.g. 100" required>

        <button id="airtimeButton" type="submit" class="primary-button">
          Buy Airtime
        </button>
        <div id="airtimeNotice" class="notice" role="status" aria-live="polite"></div>
      </form>
    </section>

    <section id="dataTab" class="tab-content">
      <form id="dataForm">
        <label for="dataNetwork">Network</label>
        <select id="dataNetwork" required>
          <option value="mtn">MTN</option>
        </select>

        <label for="dataPhone">Phone number</label>
        <input id="dataPhone" type="tel" inputmode="numeric"
               maxlength="11" pattern="[0-9]{11}"
               placeholder="11-digit phone number" required>

        <label for="dataPlan">Data plan</label>
        <select id="dataPlan" required>
          <option value="">Select a plan</option>
          <option value="100" data-variation="mtn-10mb-100">MTN ₦100 plan</option>
          <option value="200" data-variation="mtn-50mb-200">MTN ₦200 plan</option>
          <option value="1000" data-variation="mtn-100mb-1000">MTN ₦1,000 plan</option>
        </select>

        <button id="dataButton" type="submit" class="primary-button">
          Buy Data
        </button>
        <div id="dataNotice" class="notice" role="status" aria-live="polite"></div>
      </form>
    </section>
  </section>

  <section class="card">
    <h2>Transaction history</h2>
    <button id="refreshHistory" type="button" class="primary-button"
            style="margin-top:0;margin-bottom:12px">
      Refresh History
    </button>
    <div id="billHistory" aria-live="polite">Loading transaction history…</div>
  </section>
</main>

<!-- Keep LosOja's existing authentication system -->
<script src="auth.js"></script>
<script src="js/bill.js?v=1"></script>
</body>
</html>
```
