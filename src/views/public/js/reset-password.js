// ─── OTP ──────────────────────────────────────────────────────

const emailInput = document.getElementById("email");
const sendOtpBtn = document.getElementById("sendOtpBtn");
const verifyOtpBtn = document.getElementById("verifyOtpBtn");
const resendBtn = document.getElementById("resendBtn");
const emailError = document.getElementById("emailError");
const otpError = document.getElementById("otpError");
const resendTimer = document.getElementById("resendTimer");
const otpBoxes = document.querySelectorAll(".otp-box");

let storedEmail = "";
let countdown;

if (sendOtpBtn) {
  sendOtpBtn.addEventListener("click", async () => {
    emailError.textContent = "";

    const email = emailInput.value.trim();
    if (!email) {
      emailError.textContent = "Please enter your email.";
      return;
    }

    try {
      sendOtpBtn.disabled = true;
      sendOtpBtn.textContent = "Sending...";

      const res = await fetch("/api/users/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        emailError.textContent = data.message || "Failed to send OTP.";
        return;
      }

      storedEmail = email;
      enableOTPSection();
      startResendTimer();
    } catch (err) {
      emailError.textContent = "Network error. Please try again.";
    } finally {
      sendOtpBtn.disabled = false;
      sendOtpBtn.textContent = "Send OTP";
    }
  });
}

function enableOTPSection() {
  verifyOtpBtn.disabled = false;
  resendBtn.disabled = false;
  otpBoxes.forEach((box) => (box.disabled = false));
  otpBoxes[0].focus();
}

// Auto-advance OTP boxes
otpBoxes.forEach((box, index) => {
  box.addEventListener("input", () => {
    if (box.value.length === 1 && index < otpBoxes.length - 1)
      otpBoxes[index + 1].focus();
  });
  box.addEventListener("keydown", (e) => {
    if (e.key === "Backspace" && !box.value && index > 0)
      otpBoxes[index - 1].focus();
  });
});

if (verifyOtpBtn) {
  verifyOtpBtn.addEventListener("click", async () => {
    otpError.textContent = "";

    const otp = Array.from(otpBoxes)
      .map((b) => b.value)
      .join("");
    if (otp.length !== 4) {
      otpError.textContent = "Enter the full 4-digit code.";
      return;
    }

    try {
      verifyOtpBtn.disabled = true;
      verifyOtpBtn.textContent = "Verifying...";

      const res = await fetch("/api/users/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: storedEmail, otp }),
      });
      const data = await res.json();

      if (!res.ok) {
        otpError.textContent = data.message || "Invalid or expired OTP.";
        return;
      }

      sessionStorage.setItem("resetToken", data.token);
      sessionStorage.setItem("resetEmail", storedEmail);
      window.location.href = "/reset-password";
    } catch (err) {
      otpError.textContent = "Network error. Please try again.";
    } finally {
      verifyOtpBtn.disabled = false;
      verifyOtpBtn.textContent = "Verify";
    }
  });
}

// ─── RESEND TIMER ─────────────────────────────────────────────

function startResendTimer() {
  let timeLeft = 60;
  resendBtn.disabled = true;
  resendTimer.textContent = `(00:${String(timeLeft).padStart(2, "0")})`;

  countdown = setInterval(() => {
    timeLeft--;
    resendTimer.textContent = `(00:${String(timeLeft).padStart(2, "0")})`;
    if (timeLeft <= 0) {
      clearInterval(countdown);
      resendTimer.textContent = "";
      resendBtn.disabled = false;
    }
  }, 1000);
}

if (resendBtn) {
  resendBtn.addEventListener("click", async () => {
    if (!storedEmail) return;
    try {
      resendBtn.disabled = true;

      const res = await fetch("/api/users/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: storedEmail }),
      });
      const data = await res.json();

      if (!res.ok) {
        otpError.textContent = data.message || "Failed to resend OTP.";
        return;
      }

      startResendTimer();
    } catch {
      otpError.textContent = "Network error. Please try again.";
    }
  });
}

// ─── RESET PASSWORD ───────────────────────────────────────────

const resetForm = document.getElementById("reset-form");

if (resetForm) {
  resetForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const errorBox = document.getElementById("resetError");
    const passError = document.querySelector(".pass-error-message");
    const passConfirmError = document.querySelector(
      ".pass-confirm-error-message"
    );
    const submitBtn = resetForm.querySelector("button[type='submit']");
    const password = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    // Reset all errors
    errorBox.textContent = "";
    passError.style.display = "none";
    passConfirmError.style.display = "none";

    if (password !== confirmPassword) {
      passConfirmError.style.display = "block";
      passConfirmError.textContent = "Passwords do not match.";
      return;
    }

    if (password.length < 8) {
      passError.style.display = "block";
      passError.textContent = "Password must be at least 8 characters.";
      return;
    }

    const token = sessionStorage.getItem("resetToken");
    if (!token) {
      errorBox.textContent = "Session expired. Please request a new OTP.";
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = "Resetting...";

      const res = await fetch(`/api/users/reset-password/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, confirmPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        errorBox.textContent =
          data.message || "Reset failed. Please try again.";
        return;
      }

      sessionStorage.removeItem("resetToken");
      sessionStorage.removeItem("resetEmail");
      window.location.href = "/login";
    } catch (err) {
      errorBox.textContent = "Network error. Please try again.";
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Update Password";
    }
  });
}

// ─── TOGGLE PASSWORD VISIBILITY ───────────────────────────────

const togglePassword = document.getElementById("togglePassword");
const passwordInput = document.getElementById("newPassword");

togglePassword?.addEventListener("click", () => {
  const isPassword = passwordInput.type === "password";
  passwordInput.type = isPassword ? "text" : "password";
  togglePassword.classList.toggle("fa-eye");
  togglePassword.classList.toggle("fa-eye-slash");
});

const toggleConfirmPassword = document.getElementById("toggleConfirmPassword");
const confirmPasswordInput = document.getElementById("confirmPassword");

toggleConfirmPassword?.addEventListener("click", function () {
  const isPassword = confirmPasswordInput.type === "password";
  confirmPasswordInput.type = isPassword ? "text" : "password";
  this.classList.toggle("fa-eye");
  this.classList.toggle("fa-eye-slash");
});
