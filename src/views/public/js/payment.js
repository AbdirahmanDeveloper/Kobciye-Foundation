/* ============================================================
   payment.js
   Handles: M-Pesa STK Push initiation + payment status polling
   Used on: /payment page
   Pug file: views/payment.pug
============================================================ */

/* ============================================================
   1. AMOUNT PRESET BUTTONS
============================================================ */

const amountButtons = document.querySelectorAll(".amount-btn");
const amountInput   = document.getElementById("amount");

amountButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    amountButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    amountInput.value = btn.dataset.amount;
  });
});

/* ============================================================
   2. PAY BUTTON — TRIGGER STK PUSH
============================================================ */

const payBtn         = document.getElementById("payBtn");
const statusBox      = document.getElementById("paymentStatus");
let   pollingInterval = null;

payBtn.addEventListener("click", async () => {

  const project = document.getElementById("project-category").value;
  const amount  = document.getElementById("amount").value;
  const phone   = document.getElementById("phone").value.trim();

  /* ── Validation ── */
  if (!project) {
    showStatus("Please select a project", "error");
    return;
  }
  if (!phone) {
    showStatus("Please enter your M-Pesa phone number", "error");
    return;
  }
  if (!amount || Number(amount) < 10) {
    showStatus("Minimum donation amount is KES 10", "error");
    return;
  }

  /* ── Auth check ── */
  const token = localStorage.getItem("token");
  if (!token) {
    showStatus("Please login first", "error");
    setTimeout(() => { window.location.href = "/login"; }, 1500);
    return;
  }

  /* ── Loading state ── */
  payBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>  Sending request...';
  payBtn.disabled  = true;
  showStatus("Sending STK Push to your phone...", "info");

  try {
    const response = await fetch("/api/donations/initialize-payment", {
      method:  "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:  `Bearer ${token}`,
      },
      body: JSON.stringify({ project, amount, phone }),
    });

    const data = await response.json();

    if (response.ok && data.status === "success") {
      const checkoutRequestId = data.data.checkoutRequestId;

      showStatus(
        "📱 Check your phone! Enter your M-Pesa PIN to complete the donation.",
        "info"
      );

      /* ── Start polling for payment status ── */
      startPolling(checkoutRequestId, token);

    } else {
      showStatus(data.message || "Payment request failed. Try again.", "error");
      resetPayBtn();
    }

  } catch (error) {
    console.error("Payment error:", error);
    showStatus("Network error. Please try again.", "error");
    resetPayBtn();
  }
});

/* ============================================================
   3. POLLING — CHECK PAYMENT STATUS EVERY 3 SECONDS
============================================================ */

function startPolling(checkoutRequestId, token) {
  let attempts = 0;
  const maxAttempts = 20; // 60 seconds total (20 × 3s)

  pollingInterval = setInterval(async () => {
    attempts++;

    try {
      const response = await fetch(`/api/donations/verify/${checkoutRequestId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      const paymentStatus = data.data?.paymentStatus;

      if (paymentStatus === "success") {
        /* ── Payment confirmed ── */
        clearInterval(pollingInterval);
        showStatus("✅ Payment successful! Thank you for your donation.", "success");
        payBtn.innerHTML = '<i class="fa-solid fa-circle-check"></i>  Donated!';
        payBtn.style.background = "#22c55e";

      } else if (paymentStatus === "failed") {
        /* ── Payment failed or cancelled ── */
        clearInterval(pollingInterval);
        showStatus("❌ Payment was cancelled or failed. Please try again.", "error");
        resetPayBtn();

      } else if (attempts >= maxAttempts) {
        /* ── Timeout ── */
        clearInterval(pollingInterval);
        showStatus("⏱ Payment timed out. If you paid, it will be confirmed shortly.", "warning");
        resetPayBtn();
      }

    } catch (err) {
      console.error("Polling error:", err);
    }

  }, 3000);
}

/* ============================================================
   4. HELPERS
============================================================ */

function showStatus(message, type) {
  statusBox.style.display = "block";
  statusBox.textContent   = message;
  statusBox.className     = `payment-status ${type}`;
}

function resetPayBtn() {
  payBtn.innerHTML = '<i class="fa-solid fa-mobile-screen-button"></i>  Pay with M-Pesa';
  payBtn.disabled  = false;
  payBtn.style.background = "";
}