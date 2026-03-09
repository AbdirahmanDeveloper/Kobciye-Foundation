/* ============================================================
   contact.js
   Handles: Contact form submission only
   Used on: /contact page
   Pug file: views/contact.pug
   ============================================================ */

/* ── DOM References ──────────────────────────────────────── */
const contactForm = document.getElementById("contactForm");
const contactMessageModal = document.getElementById("contactMessageModal");
// RENAMED: was "successMessage" in old code — fixed to match Pug id #contactSuccessMessage
const contactSuccessMessage = document.getElementById("contactSuccessMessage");
const contactErrorMessage = document.getElementById("contactErrorMessage");

/* ── Contact Form Submit ─────────────────────────────────── */
contactForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = {
    name: document.getElementById("name").value,
    email: document.getElementById("email").value,
    subject: document.getElementById("subject").value,
    message: document.getElementById("message").value,
  };

  const submitBtn = contactForm.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = "Sending...";
  submitBtn.disabled = true;

  // Reset modal state before every submission
  contactSuccessMessage.style.display = "none";
  contactErrorMessage.style.display = "none";
  contactMessageModal.style.display = "none";

  try {
    const response = await fetch("/api/contact/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    await response.json();

    if (response.ok) {
      contactSuccessMessage.style.display = "flex";
      contactErrorMessage.style.display = "none";
      contactMessageModal.style.display = "flex";
      contactForm.reset();
    } else {
      contactSuccessMessage.style.display = "none";
      contactErrorMessage.style.display = "flex";
      contactMessageModal.style.display = "flex";
    }
  } catch (error) {
    console.error("Contact form error:", error);
    contactSuccessMessage.style.display = "none";
    contactErrorMessage.style.display = "flex";
    contactMessageModal.style.display = "flex";
  } finally {
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
});

/* ── Close Modal on Backdrop Click ──────────────────────── */
contactMessageModal?.addEventListener("click", (e) => {
  if (e.target === contactMessageModal) {
    contactMessageModal.style.display = "none";
    contactSuccessMessage.style.display = "none";
    contactErrorMessage.style.display = "none";
  }
});

/* ── Close Modal on OK Button ───────────────────────────── */
document.querySelectorAll("#contactMessageModal .ok-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    contactMessageModal.style.display = "none";
    contactSuccessMessage.style.display = "none";
    contactErrorMessage.style.display = "none";
  });
});
