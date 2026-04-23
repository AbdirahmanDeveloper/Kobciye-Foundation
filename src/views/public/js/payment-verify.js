const token = localStorage.getItem("token");
const params = new URLSearchParams(window.location.search);
const reference = params.get("ref");

async function verifyPayment() {
  if (!reference) {
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
      document.getElementById(
        "receiptAmount"
      ).textContent = `KES ${data.data.amount.toLocaleString()}`;
      document.getElementById("receiptMethod").textContent = (
        data.data.paymentMethod || "CARD"
      ).toUpperCase();

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
