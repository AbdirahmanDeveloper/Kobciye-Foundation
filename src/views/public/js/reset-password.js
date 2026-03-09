// ── OTP page (forget-password.html) ──────────────────────────────────────
const emailInput  = document.getElementById("email");
const sendOtpBtn  = document.getElementById("sendOtpBtn");
const verifyOtpBtn = document.getElementById("verifyOtpBtn");
const resendBtn   = document.getElementById("resendBtn");
const emailError  = document.getElementById("emailError");
const otpError    = document.getElementById("otpError");
const resendTimer = document.getElementById("resendTimer");
const otpBoxes    = document.querySelectorAll(".otp-box");

let storedEmail = "";
let countdown;

// SEND OTP
if (sendOtpBtn) {
  sendOtpBtn.addEventListener("click", async () => {
    emailError.textContent = "";
    const email = emailInput.value.trim();
    if (!email) { emailError.textContent = "Please enter your email."; return; }

    try {
      sendOtpBtn.disabled = true;
      sendOtpBtn.innerHTML = "Sending...";

      const res  = await fetch("/api/users/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      storedEmail = email;
      enableOTPSection();
      startResendTimer();
    } catch (err) {
      emailError.textContent = err.message;
    } finally {
      sendOtpBtn.disabled = false;
      sendOtpBtn.innerHTML = "Send OTP";
    }
  });
}

function enableOTPSection() {
  verifyOtpBtn.disabled = false;
  resendBtn.disabled    = false;
  otpBoxes.forEach((box) => (box.disabled = false));
  otpBoxes[0].focus();
}

// AUTO-ADVANCE OTP boxes
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

// VERIFY OTP
if (verifyOtpBtn) {
  verifyOtpBtn.addEventListener("click", async () => {
    otpError.textContent = "";
    const otp = Array.from(otpBoxes).map((b) => b.value).join("");
    if (otp.length !== 4) { otpError.textContent = "Enter the full 4-digit code."; return; }

    try {
      verifyOtpBtn.disabled = true;
      verifyOtpBtn.innerHTML = "Verifying...";

      const res  = await fetch("/api/users/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: storedEmail, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      // ← Store in sessionStorage and redirect
      sessionStorage.setItem("resetToken", data.token);
      sessionStorage.setItem("resetEmail", storedEmail);
      window.location.href = "/reset-password";
    } catch (err) {
      otpError.textContent = err.message;
    } finally {
      verifyOtpBtn.disabled = false;
      verifyOtpBtn.innerHTML = "Verify";
    }
  });
}

// RESEND TIMER
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

// RESEND OTP
if (resendBtn) {
  resendBtn.addEventListener("click", async () => {
    if (!storedEmail) return;
    try {
      resendBtn.disabled = true;
      await fetch("/api/users/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: storedEmail }),
      });
      startResendTimer();
    } catch {
      otpError.textContent = "Failed to resend OTP.";
    }
  });
}

// ── Reset-password page ───────────────────────────────────────────────────
const resetForm = document.getElementById("reset-form");

if (resetForm) {
  resetForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const errorBox       = document.getElementById("resetError");
    const password       = document.getElementById("newPassword").value;    
    const confirmPassword = document.getElementById("confirmPassword").value;

    errorBox.textContent = "";

    if (password !== confirmPassword) {                                
      errorBox.textContent = "Passwords do not match.";
      return;
    }
    if (password.length < 8) {
      errorBox.textContent = "Password must be at least 8 characters.";
      return;
    }

    const token = sessionStorage.getItem("resetToken");                  
    if (!token) {
      errorBox.textContent = "Session expired. Please request a new OTP.";
      return;
    }

    try {
      const res = await fetch(`/api/users/reset-password/${token}`, {       
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, confirmPassword }),                 
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      sessionStorage.removeItem("resetToken");
      sessionStorage.removeItem("resetEmail");
      window.location.href = "/login";                                       
    } catch (err) {
      errorBox.textContent = err.message;
    }
  });
}