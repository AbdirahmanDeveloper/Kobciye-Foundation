const form = document.getElementById("newsletterForm");
const newsletterBox = document.querySelector(".newsletter-input-box");
const checkedSubscriber = document.querySelector(".checked-subscriber");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const emailInput = document.getElementById("newsletterEmail");
  if (!emailInput) return;

  const email = emailInput.value;
  const btn = form.querySelector("button");

  btn.disabled = true;
  btn.textContent = "Subscribing...";

  try {
    const res = await fetch("/api/news/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();

    if (res.ok) {
      form.reset();
      newsletterBox.style.display = "none";
      checkedSubscriber.style.display = "flex";
    }
  } catch (err) {
    alert("failed subscribing newsletter", err)
  }
});
