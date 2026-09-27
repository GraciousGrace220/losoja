"use strict";

/*
=========================================================
LosOja Wallet
Secure Paystack deposit flow
=========================================================
*/

const LOSOJA_SUPABASE_URL =
    "https://ycxshwgeebskdozmornh.supabase.co";

const LOSOJA_SUPABASE_KEY =
    "sb_publishable_jFSLacwNupO6T8EnSqb2bw_bZmy7rVe";


/*
=========================================================
GET SUPABASE ACCESS TOKEN
=========================================================
*/

async function getWalletAccessToken() {

    if (
        typeof window.getSupabaseAccessToken ===
        "function"
    ) {

        const token =
            await window.getSupabaseAccessToken();

        if (token) {
            return token;
        }
    }

    return null;
}


/*
=========================================================
DEPOSIT MONEY
=========================================================
*/

async function losojaDepositFunds() {

    try {

        /*
           Make sure user is logged in.
        */

        const user =
            typeof window.getCurrentUser ===
            "function"
                ? await window.getCurrentUser()
                : null;

        if (!user) {

            alert(
                "Please log in before depositing money."
            );

            return;
        }


        /*
           Ask for deposit amount.
        */

        const input =
            prompt(
                "Enter the amount you want to deposit in ₦:"
            );

        if (
            input === null
        ) {
            return;
        }


        const amount =
            Number(
                String(input)
                    .replace(/,/g, "")
                    .trim()
            );


        /*
           Validate amount.
        */

        if (
            !Number.isFinite(amount) ||
            amount < 100
        ) {

            alert(
                "Minimum deposit is ₦100."
            );

            return;
        }


        /*
           Get authenticated Supabase token.
        */

        const token =
            await getWalletAccessToken();

        if (!token) {

            alert(
                "Your login session has expired. Please log in again."
            );

            return;
        }


        /*
           Show progress.
        */

        const depositButton =
            document.querySelector(
                ".deposit-button"
            );

        if (depositButton) {

            depositButton.disabled =
                true;

            depositButton.textContent =
                "Opening payment...";
        }


        /*
           Initialize secure Paystack payment.
        */

        const response =
            await fetch(
                `${LOSOJA_SUPABASE_URL}/functions/v1/initialize-payment`,
                {
                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "apikey":
                            LOSOJA_SUPABASE_KEY,

                        "Authorization":
                            `Bearer ${token}`

                    },

                    body: JSON.stringify({
                        amount: amount
                    })
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.status ||
            !data.authorization_url
        ) {

            throw new Error(
                data.error ||
                "Unable to start payment."
            );
        }


        /*
           Save reference temporarily.

           This helps us know what payment
           we started when the user returns.
        */

        if (
            data.reference
        ) {

            sessionStorage.setItem(
                "losoja_pending_payment",
                data.reference
            );
        }


        /*
           Send user to Paystack.
        */

        window.location.href =
            data.authorization_url;

    } catch (error) {

        console.error(
            "LosOja deposit error:",
            error
        );

        alert(
            error instanceof Error
                ? error.message
                : "Unable to start deposit."
        );


        /*
           Restore button.
        */

        const depositButton =
            document.querySelector(
                ".deposit-button"
            );

        if (depositButton) {

            depositButton.disabled =
                false;

            depositButton.textContent =
                "+ Deposit";
        }
    }
}


/*
=========================================================
VERIFY PAYMENT AFTER PAYSTACK REDIRECT
=========================================================
*/

async function verifyLosOjaPayment() {

    try {

        const params =
            new URLSearchParams(
                window.location.search
            );

        const reference =
            params.get(
                "reference"
            );


        /*
           No Paystack reference means
           normal Balance page visit.
        */

        if (!reference) {
            return;
        }


        /*
           Get authenticated user.
        */

        const user =
            typeof window.getCurrentUser ===
            "function"
                ? await window.getCurrentUser()
                : null;

        if (!user) {

            alert(
                "Please log in again to complete your payment."
            );

            return;
        }


        /*
           Get access token.
        */

        const token =
            await getWalletAccessToken();

        if (!token) {

            alert(
                "Your login session has expired. Please log in again."
            );

            return;
        }


        /*
           Prevent duplicate processing attempts
           during this browser session.
        */

        const pendingReference =
            sessionStorage.getItem(
                "losoja_pending_payment"
            );

        if (
            pendingReference &&
            pendingReference !== reference
        ) {

            console.warn(
                "LosOja: payment reference differs from pending reference."
            );
        }


        /*
           Verify payment securely.
        */

        const response =
            await fetch(
                `${LOSOJA_SUPABASE_URL}/functions/v1/verify-payment`,
                {
                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "apikey":
                            LOSOJA_SUPABASE_KEY,

                        "Authorization":
                            `Bearer ${token}`

                    },

                    body: JSON.stringify({
                        reference: reference
                    })
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.status
        ) {

            throw new Error(
                data.error ||
                "Payment verification failed."
            );
        }


        /*
           Payment successfully verified.
        */

        sessionStorage.removeItem(
            "losoja_pending_payment"
        );


        /*
           Remove Paystack reference from
           the browser address bar.
        */

        window.history.replaceState(
            {},
            document.title,
            window.location.pathname
        );


        /*
           Tell the user what happened.
        */

        if (
            data.already_processed
        ) {

            alert(
                "This payment was already added to your wallet."
            );

        } else {

            alert(
                `₦${Number(data.amount).toLocaleString(
                    "en-NG",
                    {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    }
                )} was added to your LosOja wallet.`
            );
        }


        /*
           Reload Balance page so the new
           wallet balance and transaction
           history appear.
        */

        window.location.reload();

    } catch (error) {

        console.error(
            "LosOja payment verification error:",
            error
        );

        alert(
            error instanceof Error
                ? error.message
                : "Payment verification failed."
        );
    }
}


/*
=========================================================
MAKE FUNCTIONS AVAILABLE TO THE APP
=========================================================
*/

window.losojaDepositFunds =
    losojaDepositFunds;


/*
=========================================================
CHECK FOR PAYSTACK RETURN
=========================================================
*/

document.addEventListener(
    "DOMContentLoaded",
    () => {

        verifyLosOjaPayment();

    }
);
