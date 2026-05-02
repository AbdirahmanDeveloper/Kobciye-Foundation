const token = localStorage.getItem("token");
const params = new URLSearchParams(window.location.search);
const reference = params.get("ref");

async function verifyPayment() {
  if (!reference || !token) {
    showState("failedState");
    return;
  }

  try {
    const res = await fetch(`/api/donations/verify/${reference}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();

    if (res.ok && data.data.paymentStatus === "success") {
      document.getElementById("receiptRef").textContent = reference;
      document.getElementById("receiptDate").textContent =
        new Date().toDateString();

      const amount = data.data.amount ?? 0;
      document.getElementById(
        "receiptAmount"
      ).textContent = `KES ${amount.toLocaleString()}`;

      const method = data.data.paymentMethod ?? "CARD";
      document.getElementById("receiptMethod").textContent =
        method.toUpperCase();

      showState("successState");
    } else {
      showState("failedState");
    }
  } catch (err) {
    console.error(err);
    showState("failedState");
  }
}

function showState(id) {
  ["loadingState", "successState", "failedState"].forEach((s) => {
    document.getElementById(s).style.display = "none";
  });
  document.getElementById(id).style.display = "flex";
}

verifyPayment();
