/* ============================================================
   footer.js
   ============================================================ */

/* ── DOM References ──────────────────────────────────────── */
const footerNewsletterForm = document.getElementById("footerNewsletterForm");
const footerNewsletterModal = document.getElementById("footerNewsletterModal");
const footerNewsletterSuccess = document.getElementById(
  "footerNewsletterSuccess"
);
const footerNewsletterError = document.getElementById("footerNewsletterError");

/* ── Newsletter Form Submit ──────────────────────────────── */
footerNewsletterForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const emailInput = document.getElementById("footer-newsletter-email");
  if (!emailInput) return;
  const email = emailInput.value.trim();

  if (!email) {
    alert("Please enter your email address");
    return;
  }

  const submitBtn = footerNewsletterForm.querySelector('button[type="submit"]');
  const originalHTML = submitBtn.innerHTML;
  submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
  submitBtn.disabled = true;

  // Reset modal state before every submission
  footerNewsletterSuccess.style.display = "none";
  footerNewsletterError.style.display = "none";
  footerNewsletterModal.style.display = "none";

  try {
    const response = await fetch("/api/contact/newsletter/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (response.ok) {
      /* ── Success ── */
      footerNewsletterSuccess.style.display = "flex";
      footerNewsletterError.style.display = "none";
      footerNewsletterModal.style.display = "flex";
      footerNewsletterForm.reset();
    } else {
      /* ── Other server error ── */
      footerNewsletterSuccess.style.display = "none";
      footerNewsletterError.style.display = "flex";
      footerNewsletterModal.style.display = "flex";
    }
  } catch (error) {
    /* ── Network error ── */
    console.error("Footer newsletter error:", error);
    footerNewsletterSuccess.style.display = "none";
    footerNewsletterError.style.display = "flex";
    footerNewsletterModal.style.display = "flex";
  } finally {
    submitBtn.innerHTML = originalHTML;
    submitBtn.disabled = false;
  }
});

/* ── Close Modal on Backdrop Click ──────────────────────── */
footerNewsletterModal?.addEventListener("click", (e) => {
  if (e.target === footerNewsletterModal) {
    footerNewsletterModal.style.display = "none";
    footerNewsletterSuccess.style.display = "none";
    footerNewsletterError.style.display = "none";
  }
});

/* ── Close Modal on OK Button ───────────────────────────── */
document.querySelectorAll("#footerNewsletterModal .ok-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    footerNewsletterModal.style.display = "none";
    footerNewsletterSuccess.style.display = "none";
    footerNewsletterError.style.display = "none";
  });
});
