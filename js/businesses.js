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

        if (!Array.isArray(list) || list.length === 0) {
            businessGrid.innerHTML = `
                <div class="loading-card">
                    <div style="font-size:32px; margin-bottom:8px;">🔍</div>
                    <p style="font-weight:700; font-size:16px;">No businesses found</p>
                    <p style="font-size:14px; margin-top:6px; opacity:0.8; max-width:300px; margin-left:auto; margin-right:auto;">
                        Try different keyword - e.g. "phone", "fashion", "food", "Lagos"
                    </p>
                    <button type="button" onclick="window.loadBusinesses(true)" style="margin-top:14px; padding:10px 18px; border:0; border-radius:9px; background:#087a3e; color:#ffffff; font-weight:700; cursor:pointer;">
                        Show All Businesses
                    </button>
                </div>
            `;
            return;
        }

        businessGrid.innerHTML = list.map(createBusinessCard).join("");
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
            imageHTML = `<img class="business-card-image" src="${escapeHTML(image)}" alt="${name}" loading="lazy" onerror="this.style.display='none'">`;
        } else {
            imageHTML = `<div class="business-card-image" style="display:flex; align-items:center; justify-content:center; font-size:42px;">🏪</div>`;
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

        const results = businesses.filter(function (business) {
            const searchable = [business.name, business.category, business.location, business.address, business.phone, business.description]
                .filter(Boolean).join(" ").toLowerCase();
            const matchesSearch = !searchTerm || searchable.includes(searchTerm);
            const matchesLocation = !location || searchable.includes(location);
            return matchesSearch && matchesLocation;
        });

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
       DISCOVER NEAR ME - SAFE ADDITION
    ===================================================== */

    function findNearbyBusinesses() {
        if (!navigator.geolocation) {
            showToast("Location not supported on your phone");
            renderBusinesses(businesses);
            return;
        }

        if (businessGrid) {
            businessGrid.innerHTML = `
                <div class="loading-card">
                    <div class="loading-spinner"></div>
                    <p>Finding businesses near you...</p>
                </div>
            `;
        }

        navigator.geolocation.getCurrentPosition(
            function(position) {
                // For now LosOja shows all businesses as nearby
                // Later when you add latitude/longitude to Supabase,
                // we will filter by real distance
                console.log("User location:", position.coords.latitude, position.coords.longitude);
                
                // Show toast and all businesses
                if (typeof showToast === 'function') {
                    // toast exists in index.html
                    const toast = document.getElementById('toast');
                    if (toast) {
                        toast.textContent = "📍 Showing businesses near you in Nigeria";
                        toast.classList.add('show');
                        setTimeout(() => toast.classList.remove('show'), 3000);
                    }
                }

                // Since most businesses don't have GPS yet,
                // we show all, with Lagos businesses first
                const sorted = [...businesses].sort(function(a, b) {
                    const locA = (a.location || "").toLowerCase();
                    const locB = (b.location || "").toLowerCase();
                    const aLagos = locA.includes("lagos") ? 0 : 1;
                    const bLagos = locB.includes("lagos") ? 0 : 1;
                    return aLagos - bLagos;
                });

                renderBusinesses(sorted);
                
                const grid = document.getElementById("businessGrid");
                if (grid) grid.scrollIntoView({ behavior: "smooth" });
            },
            function(error) {
                console.error("Geolocation error:", error);
                const toast = document.getElementById('toast');
                if (toast) {
                    toast.textContent = "Could not get location - showing all businesses";
                    toast.classList.add('show');
                    setTimeout(() => toast.classList.remove('show'), 3000);
                }
                renderBusinesses(businesses);
            },
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
        );
    }

    function showToast(msg) {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(function() { toast.classList.remove('show'); }, 3000);
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

})();
