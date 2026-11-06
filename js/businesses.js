/*

LOSOJA - BUSINESSES
js/businesses.js - SAFE UPGRADE VERSION

Keeps:
- Supabase connection
- Loading businesses
- Displaying business cards
- Search
- Category filtering
- Business details
- Images
- Safe HTML output

Adds:
- Better "No results" message with Show All button
- Verified badge

*/

(function () {

    "use strict";

    /* =====================================================
       SUPABASE
    ===================================================== */

    const SUPABASE_URL =
        "https://ycxshwgeebskdozmornh.supabase.co";

    const SUPABASE_KEY =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljeHNod2dlZWJza2Rvem1vcm5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzMDY0NjUsImV4cCI6MjEwMzg4MjQ2NX0.tMl7wILdVDhu0RWFaG_84ngJEryLt2c5cB8MEKW3kfU";

    /* =====================================================
       SETTINGS
    ===================================================== */

    const REQUEST_TIMEOUT = 15000;

    /* =====================================================
       ELEMENT
    ===================================================== */

    const businessGrid =
        document.getElementById("businessGrid");

    /* =====================================================
       DATA
    ===================================================== */

    let businesses = [];
    const NIGERIAN_STATES = ["Abia State","Adamawa State","Akwa Ibom State","Anambra State","Bauchi State","Bayelsa State","Benue State","Borno State","Cross River State","Delta State","Ebonyi State","Edo State","Ekiti State","Enugu State","FCT","Gombe State","Imo State","Jigawa State","Kaduna State","Kano State","Katsina State","Kebbi State","Kogi State","Kwara State","Lagos State","Nasarawa State","Niger State","Ogun State","Ondo State","Osun State","Oyo State","Plateau State","Rivers State","Sokoto State","Taraba State","Yobe State","Zamfara State"];
    let selectedBusinessState = "";

    function normalizeState(value) {
        return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
    }

    function getBusinessState(business) {
        const explicitState = String(business.state || "").trim();
        if (explicitState) return explicitState;
        const location = String(business.location || business.address || "").trim();
        const commaIndex = location.indexOf(",");
        return commaIndex >= 0 ? location.slice(commaIndex + 1).trim() : location;
    }

    function normalizeStateLabel(value) {
        const raw = String(value || "").trim();
        if (normalizeState(raw) === "fct") return "FCT";
        if (/\s+state$/i.test(raw)) return raw;
        const match = NIGERIAN_STATES.find(state => normalizeState(state).replace(/\s+state$/, "") === normalizeState(raw));
        return match || raw;
    }

    function updateStateOptions(list) {
        const select = document.getElementById("losojaStateFilter");
        if (!select) return;
        const discovered = (Array.isArray(list) ? list : []).map(getBusinessState).filter(Boolean).map(normalizeStateLabel);
        const allStates = Array.from(new Set(NIGERIAN_STATES.concat(discovered))).sort((a, b) => a.localeCompare(b));
        const previous = selectedBusinessState || select.value;
        select.innerHTML = '<option value="">All Nigeria</option>' + allStates.map(state =>
            '<option value="' + escapeHTML(state) + '">' + escapeHTML(state) + '</option>'
        ).join("");
        if (previous && allStates.some(state => normalizeState(state) === normalizeState(previous))) {
            select.value = allStates.find(state => normalizeState(state) === normalizeState(previous));
        }
        select.onchange = function () {
            selectedBusinessState = select.value;
            renderBusinesses(businesses);
        };
    }

    function matchesSelectedState(business) {
        if (!selectedBusinessState) return true;
        const wanted = normalizeState(selectedBusinessState);
        const businessState = normalizeState(normalizeStateLabel(getBusinessState(business)));
        const location = normalizeState(business.location || business.address || "");
        const shortName = wanted.replace(/\s+state$/, "");
        return businessState === wanted || businessState.includes(wanted) ||
            location.includes(wanted) || location.includes(shortName);
    }


    let businessesLoaded = false;
    let businessesLoading = false;
    let loadingPromise = null;

    /* =====================================================
       HTML SAFETY
    ===================================================== */

    function escapeHTML(value) {
        if (value === null || value === undefined) {
            return "";
        }
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    /* =====================================================
       LOADING
    ===================================================== */

    function showLoading() {
        if (!businessGrid) return;
        businessGrid.innerHTML = `
            <div class="loading-card">
                <div class="loading-spinner"></div>
                <p>Loading businesses...</p>
            </div>
        `;
    }

    /* =====================================================
       ERROR
    ===================================================== */

    function showError(message) {
        if (!businessGrid) return;
        businessGrid.innerHTML = `
            <div class="loading-card">
                <div style="font-size:32px; margin-bottom:8px;">⚠️</div>
                <p>${escapeHTML(message)}</p>
                <button type="button" id="retryBusinessesBtn" style="margin-top:12px; padding:10px 18px; border:0; border-radius:9px; background:#087a3e; color:#ffffff; font-weight:700; cursor:pointer;">Try Again</button>
            </div>
        `;
        const retryButton = document.getElementById("retryBusinessesBtn");
        if (retryButton) {
            retryButton.addEventListener("click", function () {
                loadBusinesses(true);
            });
        }
    }

    /* =====================================================
       GET BUSINESSES FROM SUPABASE
    ===================================================== */

    async function getBusinesses() {
        if (!SUPABASE_KEY || SUPABASE_KEY === "PASTE_YOUR_EXISTING_KEY_HERE") {
            console.error("LosOja: Supabase key has not been added.");
            showError("Supabase key is missing.");
            return [];
        }

        const url = SUPABASE_URL + "/rest/v1/businesses" + "?select=*";
        const controller = new AbortController();
        const timeout = setTimeout(function () { controller.abort(); }, REQUEST_TIMEOUT);

        try {
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "apikey": SUPABASE_KEY,
                    "Authorization": "Bearer " + SUPABASE_KEY,
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                signal: controller.signal
            });

            clearTimeout(timeout);

            if (!response.ok) {
                const errorText = await response.text();
                console.error("LosOja Supabase error:", response.status, errorText);
                if (response.status === 401) showError("Supabase key is not valid.");
                else if (response.status === 403) showError("Supabase denied access to the businesses.");
                else showError("Supabase error " + response.status + ".");
                return [];
            }

            const data = await response.json();
            if (!Array.isArray(data)) {
                console.error("LosOja: unexpected Supabase data:", data);
                showError("The business data could not be read.");
                return [];
            }

            console.log("LosOja: businesses loaded:", data.length);
            return data;

        } catch (error) {
            clearTimeout(timeout);
            console.error("LosOja: business loading error:", error);
            if (error.name === "AbortError") showError("Loading took too long. Please try again.");
            else showError("Could not connect to LosOja.");
            return [];
        }
    }

    /* =====================================================
       LOAD BUSINESSES
    ===================================================== */

    function loadBusinesses(forceReload) {
        if (businessesLoaded && !forceReload) {
            renderBusinesses(businesses);
            return Promise.resolve(businesses);
        }
        if (businessesLoading && loadingPromise) {
            return loadingPromise;
        }
        if (!businessGrid) {
            console.error("LosOja: businessGrid was not found.");
            return Promise.resolve([]);
        }

        businessesLoading = true;
        showLoading();

        loadingPromise = getBusinesses()
            .then(function (data) {
                if (data === null) {
                    businessesLoaded = false;
                    return [];
                }
                businesses = Array.isArray(data) ? data : [];
                businessesLoaded = true;
                window.losojaBusinesses = businesses;
                renderBusinesses(businesses);
                return businesses;
            })
            .catch(function (error) {
                console.error("LosOja loading error:", error);
                businessesLoaded = false;
                return [];
            })
            .finally(function () {
                businessesLoading = false;
                loadingPromise = null;
            });

        return loadingPromise;
    }

    /* =====================================================
       RENDER BUSINESSES - UPGRADED (SAFE)
    ===================================================== */

    function renderBusinesses(list) {
        if (!businessGrid) return;

        const stateFilteredList = Array.isArray(list)
            ? list.filter(matchesSelectedState)
            : [];
        const allBusinessesInSelectedState = Array.isArray(businesses)
            ? businesses.filter(matchesSelectedState)
            : [];

        if (selectedBusinessState && allBusinessesInSelectedState.length === 0) {
            const stateLabel = escapeHTML(selectedBusinessState);
            businessGrid.innerHTML = `
                <div class="loading-card" style="grid-column:1/-1; padding:30px 18px; background:#fffaf0; border-color:#f2d58a;">
                    <div style="font-size:36px; margin-bottom:10px;">📍</div>
                    <p style="font-weight:800; font-size:18px; color:#17201b;">No businesses yet in ${stateLabel} - Be the first to add your business!</p>
                    <button type="button" onclick="document.getElementById('addBusinessBtn').click()" style="display:inline-block; margin-top:16px; padding:12px 20px; border:0; border-radius:10px; background:#087a3e; color:#fff; font-weight:800; cursor:pointer;">Add Your Business Free</button>
                </div>
            `;
            return;
        }

        if (stateFilteredList.length === 0) {
            businessGrid.innerHTML = `
                <div class="loading-card">
                    <div style="font-size:32px; margin-bottom:8px;">🔍</div>
                    <p style="font-weight:700; font-size:16px;">No businesses found</p>
                    <p style="font-size:14px; margin-top:6px; opacity:0.8; max-width:300px; margin-left:auto; margin-right:auto;">
                        Try a different keyword or select All Nigeria.
                    </p>
                    <button type="button" onclick="window.loadBusinesses(true)" style="margin-top:14px; padding:10px 18px; border:0; border-radius:9px; background:#087a3e; color:#ffffff; font-weight:700; cursor:pointer;">
                        Show All Businesses
                    </button>
                </div>
            `;
            return;
        }

        businessGrid.innerHTML = stateFilteredList.map(createBusinessCard).join("");
    }

    /* =====================================================
       BUSINESS CARD - UPGRADED (SAFE - adds verified badge)
    ===================================================== */

    function createBusinessCard(business) {
        const id = escapeHTML(business.id);
        const name = escapeHTML(business.name || "Unnamed Business");
        const category = escapeHTML(business.category || "Business");
        const location = escapeHTML(business.location || business.address || "Nigeria");
        const phone = escapeHTML(business.phone || "");
        const description = escapeHTML(business.description || "");
        const image = business.image_url || business.image || business.photo_url || "";

        let imageHTML = "";
        if (image) {
            imageHTML = `<img class="business-card-image" src="${escapeHTML(image)}" alt="${name}" loading="lazy" onerror="this.onerror=null;this.src='fallback.svg'" style="background:#FFC107;">`;
        } else {
            imageHTML = `<img class="business-card-image" src="fallback.svg" alt="LosOja" loading="lazy" style="background:#FFC107;">`;
        }

        let ratingHTML = "";
        if (business.rating !== null && business.rating !== undefined && business.rating !== "") {
            const rating = Number(business.rating);
            if (!Number.isNaN(rating)) {
                const reviews = Number(business.reviews_count || business.review_count || business.total_reviews || 0);
                ratingHTML = `<p style="margin-top:7px; color:#087a3e; font-weight:700;">⭐ ${rating.toFixed(1)} ${reviews > 0 ? ` (${reviews} reviews)` : ""}</p>`;
            }
        }

        // SAFE UPGRADE: verified badge
        const verifiedBadge = business.verified ? `<span style="background:#087a3e; color:#fff; padding:3px 8px; border-radius:12px; font-size:11px; font-weight:700;">✓ Verified</span>` : "";

        return `
            <article class="business-card" data-business-id="${id}" onclick="openBusiness('${id}')" style="cursor:pointer;">
                ${imageHTML}
              <div class="business-card-content">
                    <h3>${name}</h3>
                    <p>${category}</p>
                    <p>📍 ${location}</p>
                    ${phone ? `<p>📞 ${phone}</p>` : ""}
                    ${description ? `<p>${description}</p>` : ""}
                    ${ratingHTML}
                    <span style="display:flex; gap:8px; margin-top:8px; flex-wrap:wrap; align-items:center;">
                        <span class="business-category">${category}</span>
                        ${verifiedBadge}
                        ${(() => {
                            try {
                                const savedLoc = JSON.parse(localStorage.getItem("losoja_user_location") || "null");
                                if (savedLoc && business.latitude && business.longitude) {
                                    const dist = App.calculateDistance(
                                        savedLoc.latitude,
                                        savedLoc.longitude,
                                        business.latitude,
                                        business.longitude
                                    );
                                    if (dist != null) {
                                        return `<span class="distance-badge">📍 ${App.formatDistance(dist)}</span>`;
                                    }
                                }
                            } catch(e) {}
                            return "";
                        })()}
                    </span>
                </div>
            </article>
        `;
    }

    /* =====================================================
       SEARCH - SAME AS BEFORE (SAFE)
    ===================================================== */

       function searchBusinesses(searchTerm, location) {
        searchTerm = String(searchTerm || "").trim().toLowerCase();
        location = String(location || "").trim().toLowerCase();

        if (!businessesLoaded && businessesLoading) {
            if (loadingPromise) {
                loadingPromise.then(function () {
                    searchBusinesses(searchTerm, location);
                });
            }
            return;
        }

        if (!searchTerm && !location) {
            renderBusinesses(businesses);
            return;
        }

        let results = businesses.filter(function (business) {
            const searchable = [business.name, business.category, business.location, business.address, business.phone, business.description]
                .filter(Boolean).join(" ").toLowerCase();
            const matchesSearch = !searchTerm || searchable.includes(searchTerm);
            const matchesLocation = !location || searchable.includes(location);
            return matchesSearch && matchesLocation;
        });

        /* =================================================
           SORT BY NEAREST DISTANCE
        ================================================= */

        try {
            const savedLocStr = localStorage.getItem("losoja_user_location");
            const savedLoc = savedLocStr ? JSON.parse(savedLocStr) : null;

            if (savedLoc && savedLoc.latitude && savedLoc.longitude) {

                results.sort(function (a, b) {
                    const distA = App.calculateDistance(
                        savedLoc.latitude,
                        savedLoc.longitude,
                        a.latitude,
                        a.longitude
                    );

                    const distB = App.calculateDistance(
                        savedLoc.latitude,
                        savedLoc.longitude,
                        b.latitude,
                        b.longitude
                    );

                    if (distA == null) return 1;
                    if (distB == null) return -1;

                    return distA - distB;
                });

                console.log("Sorted by nearest!");
            }
        } catch(e) {}

        renderBusinesses(results);
    }
    /* =====================================================
       CATEGORY FILTER - SAME AS BEFORE (SAFE)
    ===================================================== */

    function filterByCategory(category) {
        category = String(category || "").trim().toLowerCase();
        if (!businessesLoaded) {
            if (loadingPromise) {
                loadingPromise.then(function () { filterByCategory(category); });
            } else {
                loadBusinesses().then(function () { filterByCategory(category); });
            }
            return;
        }
        if (!category) {
            renderBusinesses(businesses);
            return;
        }
              const results = businesses.filter(function (business) {
            const businessCategory = String(business.category || "").trim().toLowerCase();
            return businessCategory === category || businessCategory.includes(category) || category.includes(businessCategory);
        });
        renderBusinesses(results);
        const section = document.getElementById("businesses");
        if (section) {
            section.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }

    /* =====================================================
       OPEN BUSINESS - SAME AS BEFORE (SAFE)
    ===================================================== */

    function openBusiness(businessId) {
        if (!businessId) {
            console.warn("LosOja: No business ID provided.");
            return;
        }
        const business = businesses.find(function (item) {
            return String(item.id) === String(businessId);
        });
        if (!business) {
            console.warn("LosOja: Business not found:", businessId);
            return;
        }
        window.losojaSelectedBusiness = business;
        console.log("LosOja: Opening storefront:", businessId);
        window.location.href = "shop.html?id=" + encodeURIComponent(String(businessId));
    }
      /* =====================================================
       DISCOVER NEAR ME - FINAL WORKING VERSION
    ===================================================== */

        function findNearbyBusinesses(maxDistanceKm = 10) {
        if (!navigator.geolocation) { 
            showToast("Geolocation not supported", "error"); 
            return; 
        }
        
        showToast("Getting your location... move near window", "info");

        // Try high accuracy first, then low accuracy if fail
        function success(position) {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;
            localStorage.setItem("losoja_user_location", JSON.stringify({ 
                latitude: userLat, 
                longitude: userLng 
            }));
            showToast("Your location was found successfully.", "success");
            
            let nearby = [...businesses];
            if (businesses.some(b => b.latitude && b.longitude)) {
                nearby = businesses.filter(b => {
                    if (!b.latitude || !b.longitude) return false;
                    const dist = App.calculateDistance(userLat, userLng, Number(b.latitude), Number(b.longitude));
                    b._distance = dist;
                    return dist <= maxDistanceKm;
                });
                nearby.sort((a,b) => (a._distance||9999) - (b._distance||9999));
            }
            if (nearby.length === 0) {
                nearby = [...businesses].sort((a,b) => {
                    const dA = App.calculateDistance(userLat, userLng, Number(a.latitude), Number(a.longitude));
                    const dB = App.calculateDistance(userLat, userLng, Number(b.latitude), Number(b.longitude));
                    return (dA||9999) - (dB||9999);
                });
                showToast(`📍 Showing ${nearby.length} closest businesses!`, "info");
            } else {
                showToast(`📍 Showing ${nearby.length} businesses near you!`, "success");
            }
            renderBusinesses(nearby);
        }

        function error(err) {
            console.log("High accuracy failed, trying low accuracy...", err);
            // Second try with low accuracy - e dey work inside house!
            navigator.geolocation.getCurrentPosition(success, function(err2){
                console.error("Both failed:", err2);
                let msg = "Location timeout - Try near window/outside & allow location!";
                if (err2.code === 1) msg = "Permission denied - Go settings allow location!";
                showToast(msg, "error");
            }, {
                enableHighAccuracy: false, // <-- This one no go timeout
                timeout: 20000,
                maximumAge: 60000
            });
        }

        navigator.geolocation.getCurrentPosition(success, error, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        });
    }

    /* =====================================================
       PUBLIC FUNCTIONS
    ===================================================== */

    window.loadBusinesses = loadBusinesses;
    window.searchBusinesses = searchBusinesses;
    window.filterBusinessesByCategory = filterByCategory;
    window.filterByCategory = filterByCategory;
    window.openBusiness = openBusiness;
    window.findNearbyBusinesses = findNearbyBusinesses;

    /* =====================================================
       START
    ===================================================== */

    function init() {
        console.log("LosOja businesses.js loaded");
        loadBusinesses();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

})();   // <-- LAST LINE, ONLY ONE!
