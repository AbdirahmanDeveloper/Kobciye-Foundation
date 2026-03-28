// ─── TOGGLE PASSWORD VISIBILITY ───────────────────────────────

const togglePassword = document.getElementById("togglePassword");
const passwordInput = document.getElementById("password");

togglePassword.addEventListener("click", () => {
  const isPassword = passwordInput.type === "password";
  passwordInput.type = isPassword ? "text" : "password";
  togglePassword.classList.toggle("fa-eye");
  togglePassword.classList.toggle("fa-eye-slash");
});

// ─── LOGIN ────────────────────────────────────────────────────

const loginForm = document.getElementById("login-form");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  const loginError = document.querySelector(".login-error-message");
  const passError = document.querySelector(".pass-error-message");
  const submitBtn = document.querySelector(".auth-btn");

  // Reset errors
  loginError.style.display = "none";
  passError.style.display = "none";

  // Client-side validation
  if (!email) {
    loginError.style.display = "block";
    loginError.textContent = "Please enter your email";
    return;
  }

  if (!password) {
    passError.style.display = "block";
    passError.textContent = "Please enter your password";
    return;
  }

  try {
    submitBtn.disabled = true;
    submitBtn.textContent = "Logging in...";

    const res = await fetch("/api/users/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      loginError.style.display = "block";
      loginError.textContent =
        data.message || "Login failed. Please try again.";
      return;
    }

    localStorage.setItem("token", data.token);

    const role = data.data.role;
    window.location.href = role === "admin" ? "/admin" : "/";
  } catch (err) {
    console.error(err);
    loginError.style.display = "block";
    loginError.textContent = "Network error. Please try again.";
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Login";
  }
});

document.getElementById("forgotBtn")?.addEventListener("click", (e) => {
  e.preventDefault();
  window.location.href = "/otp";
});
