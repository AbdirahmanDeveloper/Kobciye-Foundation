/* ============================================================
   payment.js — Paystack (Card + M-Pesa)
============================================================ */

/* ── Amount Preset Buttons ── */
const amountButtons = document.querySelectorAll(".amount-btn");
const amountInput = document.getElementById("amount");

amountButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    amountButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    amountInput.value = btn.dataset.amount;
  });
});

/* ── Payment Method Toggle ── */
const methodMpesa = document.getElementById("method-mpesa");
const methodCard = document.getElementById("method-card");
const phoneField = document.getElementById("phone-field");
const payBtn = document.getElementById("payBtn");
const mpesaOption = document.getElementById("mpesa-option");
const cardOption = document.getElementById("card-option");

function updateMethodUI() {
  if (methodMpesa.checked) {
    phoneField.style.display = "block";
    payBtn.innerHTML =
      '<i class="fa-solid fa-mobile-screen-button"></i>  Pay with M-Pesa';
    mpesaOption.classList.add("active");
    cardOption.classList.remove("active");
  } else {
    phoneField.style.display = "none";
    payBtn.innerHTML = '<i class="fa-solid fa-credit-card"></i>  Pay with Card';
    cardOption.classList.add("active");
    mpesaOption.classList.remove("active");
  }
}

// Click on the div card itself to trigger selection
mpesaOption.addEventListener("click", () => {
  methodMpesa.checked = true;
  updateMethodUI();
});

cardOption.addEventListener("click", () => {
  methodCard.checked = true;
  updateMethodUI();
});

updateMethodUI(); // set initial state on page load

/* ── Pay Button ── */
const statusBox = document.getElementById("paymentStatus");

payBtn.addEventListener("click", async () => {
  const project = document.getElementById("project-category").value;
  const donationType = document.getElementById("donationType").value;
  const amount = document.getElementById("amount").value;
  const phone = document.getElementById("phone").value.trim();
  const paymentMethod = document.querySelector(
    'input[name="paymentMethod"]:checked'
  ).value;

  // Validation
  if (!project) {
    showStatus("Please select a project", "error");
    return;
  }
  if (!amount || Number(amount) < 10) {
    showStatus("Minimum donation is KES 10", "error");
    return;
  }
  if (paymentMethod === "mpesa" && !phone) {
    showStatus("Please enter your M-Pesa phone number", "error");
    return;
  }

  // Auth check
  const token = localStorage.getItem("token");
  if (!token) {
    showStatus("Please login first", "error");
    setTimeout(() => {
      window.location.href = "/login";
    }, 1500);
    return;
  }

  // Show loading state
  payBtn.innerHTML =
    '<i class="fa-solid fa-spinner fa-spin"></i>  Processing...';
  payBtn.disabled = true;
  showStatus("Connecting to payment gateway...", "info");

  // Send payment request to backend
  try {
    const response = await fetch("/api/donations/initialize-payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        project,
        donationType,
        amount,
        phone,
        paymentMethod,
      }),
    });

    const data = await response.json();

    if (response.ok && data.status === "success") {
      showStatus("Redirecting to payment page...", "info");
      setTimeout(() => {
        window.location.href = "/projects";
      }, 800);
    } else {
      showStatus(data.message || "Payment failed. Try again.", "error");
      resetPayBtn();
    }
  } catch (error) {
    console.error("Payment error:", error);
    showStatus("Network error. Please try again.", "error");
    resetPayBtn();
  }
});

/* ── Helpers ── */
function showStatus(message, type) {
  statusBox.style.display = "block";
  statusBox.textContent = message;
  statusBox.className = `payment-status ${type}`;
}

function resetPayBtn() {
  const method = document.querySelector(
    'input[name="paymentMethod"]:checked'
  ).value;
  payBtn.innerHTML =
    method === "mpesa"
      ? '<i class="fa-solid fa-mobile-screen-button"></i>  Pay with M-Pesa'
      : '<i class="fa-solid fa-credit-card"></i>  Pay with Card';
  payBtn.disabled = false;
  payBtn.style.background = "";
}
