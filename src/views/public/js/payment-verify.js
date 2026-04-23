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
      // Populate receipt
      document.getElementById("receiptRef").textContent = reference;
      document.getElementById("receiptDate").textContent = new Date().toDateString();

      // Fetch the donation details for amount and method
      const donRes = await fetch(`/api/donations/my-donations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const donData = await donRes.json();

      // Find the matching donation by reference
      const donation = donData.data?.find(d => d.reference === reference);
      if (donation) {
        document.getElementById("receiptAmount").textContent =
          `KES ${donation.amount.toLocaleString()}`;
        document.getElementById("receiptMethod").textContent =
          donation.paymentMethod.toUpperCase();
      }

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