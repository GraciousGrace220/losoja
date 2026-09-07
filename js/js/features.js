/* =========================================================
   LOSOJA - FEATURE STYLES
   Property • Transportation • Ride Providers • Feedback
========================================================= */


/* =========================================================
   FEATURE SECTIONS
========================================================= */

.feature-section {
    background: var(--gray-light);
}

.feature-toolbar {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    margin-bottom: 24px;
}


/* =========================================================
   FEATURE GRID
========================================================= */

.feature-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 22px;
}


/* =========================================================
   FEATURE CARD
========================================================= */

.feature-card {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 24px;
    box-shadow: var(--shadow);
    transition:
        transform 0.2s ease,
        box-shadow 0.2s ease,
        border-color 0.2s ease;
}

.feature-card:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow-hover);
    border-color: var(--green);
}

.feature-card h3 {
    margin-bottom: 10px;
    font-size: 20px;
    color: var(--black);
}

.feature-card p {
    color: var(--gray-dark);
    margin-bottom: 8px;
    line-height: 1.6;
}

.feature-card .feature-meta {
    color: var(--gray);
    font-size: 14px;
}


/* =========================================================
   FEATURE ICON
========================================================= */

.feature-icon {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: var(--green-light);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 30px;
    margin-bottom: 16px;
}


/* =========================================================
   PROPERTY CARDS
========================================================= */

.property-card {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
    box-shadow: var(--shadow);
}

.property-card-image {
    width: 100%;
    height: 190px;
    background: var(--green-light);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 55px;
    overflow: hidden;
}

.property-card-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.property-card-body {
    padding: 22px;
}

.property-card h3 {
    margin-bottom: 10px;
    font-size: 20px;
}

.property-type {
    display: inline-block;
    background: var(--green-light);
    color: var(--green-dark);
    font-size: 12px;
    font-weight: 700;
    padding: 5px 9px;
    border-radius: 20px;
    margin-bottom: 12px;
}

.property-location {
    color: var(--gray-dark);
    font-size: 14px;
    margin-bottom: 8px;
}

.property-price {
    color: var(--green-dark);
    font-size: 18px;
    font-weight: 700;
    margin: 12px 0;
}

.property-description {
    color: var(--gray);
    font-size: 14px;
    line-height: 1.6;
    margin-bottom: 16px;
}


/* =========================================================
   RIDE PROVIDER CARDS
========================================================= */

.ride-provider-card {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 24px;
    box-shadow: var(--shadow);
}

.ride-provider-card h3 {
    margin-bottom: 10px;
    font-size: 20px;
}

.ride-provider-type {
    display: inline-block;
    background: var(--green-light);
    color: var(--green-dark);
    font-size: 12px;
    font-weight: 700;
    padding: 5px 9px;
    border-radius: 20px;
    margin-bottom: 14px;
}

.ride-provider-card p {
    color: var(--gray-dark);
    font-size: 14px;
    line-height: 1.6;
    margin-bottom: 8px;
}

.ride-provider-phone {
    font-weight: 700;
    color: var(--green-dark);
}


/* =========================================================
   VEHICLE IMAGE
========================================================= */

.vehicle-image {
    width: 100%;
    height: 180px;
    background: var(--green-light);
    border-radius: 10px;
    overflow: hidden;
    margin-bottom: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 50px;
}

.vehicle-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}


/* =========================================================
   FEATURE FORMS
========================================================= */

.feature-form .form-group {
    margin-bottom: 18px;
}

.feature-form label {
    display: block;
    margin-bottom: 7px;
    font-weight: 600;
    color: var(--black);
}

.feature-form input,
.feature-form select,
.feature-form textarea {
    width: 100%;
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 12px 14px;
    font-family: inherit;
    font-size: 15px;
    background: var(--white);
    color: var(--black);
}

.feature-form textarea {
    min-height: 120px;
    resize: vertical;
}

.feature-form input:focus,
.feature-form select:focus,
.feature-form textarea:focus {
    outline: none;
    border-color: var(--green);
    box-shadow: 0 0 0 3px rgba(8, 122, 62, 0.1);
}


/* =========================================================
   FORM ROW
========================================================= */

.form-row {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
}


/* =========================================================
   MODAL SUPPORT
========================================================= */

.feature-modal-content {
    max-width: 650px;
}

.feature-modal-content h2 {
    margin-bottom: 8px;
}

.feature-modal-content > p {
    color: var(--gray);
    margin-bottom: 24px;
}


/* =========================================================
   FEATURE BUTTONS
========================================================= */

.feature-card .btn,
.property-card .btn,
.ride-provider-card .btn {
    margin-top: 8px;
}


/* =========================================================
   EMPTY STATES
========================================================= */

.feature-section .no-results {
    margin-top: 20px;
}


/* =========================================================
   RESPONSIVE - TABLET
========================================================= */

@media (max-width: 900px) {

    .feature-grid {
        grid-template-columns: repeat(2, 1fr);
    }

}


/* =========================================================
   RESPONSIVE - MOBILE
========================================================= */

@media (max-width: 700px) {

    .feature-grid {
        grid-template-columns: 1fr;
    }

    .feature-toolbar {
        justify-content: stretch;
    }

    .feature-toolbar .btn {
        width: 100%;
    }

    .form-row {
        grid-template-columns: 1fr;
    }

    .feature-card,
    .ride-provider-card {
        padding: 20px;
    }

    .property-card-body {
        padding: 20px;
    }

}


/* =========================================================
   SMALL MOBILE
========================================================= */

@media (max-width: 480px) {

    .property-card-image {
        height: 160px;
    }

    .vehicle-image {
        height: 160px;
    }

}
