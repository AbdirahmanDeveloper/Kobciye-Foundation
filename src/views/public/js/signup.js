const signUpForm = document.getElementById("signup-form");

signUpForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const country = document.getElementById("country").value;
  const confirmPassword = document
    .getElementById("confirm-password")
    .value.trim();

  const passError = document.querySelector(".pass-error-message");
  const passConfirmError = document.querySelector(
    ".pass-confirm-error-message"
  );
  const signupError = document.querySelector(".signup-error-message");
  const submitBtn = document.querySelector(".auth-btn");


  // Client-side validation
  if (!name || !email || !phone || !country) {
    signupError.style.display = "block";
    signupError.textContent = "Please fill in all fields";
    return;
  }

  if (password !== confirmPassword) {
    passConfirmError.style.display = "block";
    passConfirmError.textContent = "Passwords do not match";
    return;
  }

  if (password.length < 8) {
    passError.style.display = "block";
    passError.textContent = "Password must be at least 8 characters";
    return;
  }

  try {
    submitBtn.disabled = true;
    submitBtn.textContent = "Creating account...";

    const res = await fetch("/api/users/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, country, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      signupError.style.display = "block";
      signupError.textContent =
        data.message || "Signup failed. Please try again.";
      return;
    }

    localStorage.setItem("token", data.token);
    window.location.href = "/";
  } catch (err) {
    console.error("Fetch error:", err);
    signupError.style.display = "block";
    signupError.textContent = "Network error. Please try again.";
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Sign Up";
  }
});

// Load countries
fetch("https://restcountries.com/v3.1/all?fields=name,cca2,flag")
  .then((res) => res.json())
  .then((countries) => {
    const select = document.getElementById("country");
    countries
      .sort((a, b) => a.name.common.localeCompare(b.name.common))
      .forEach((country) => {
        const option = document.createElement("option");
        option.value = country.cca2;
        option.textContent = `${country.flag} ${country.name.common}`;
        select.appendChild(option);
      });
  })
  .catch(() => console.error("Failed to load countries"));

// Toggle password visibility
const togglePassword = document.getElementById("togglePassword");
const passwordInput = document.getElementById("password");

togglePassword.addEventListener("click", () => {
  const isPassword = passwordInput.type === "password";
  passwordInput.type = isPassword ? "text" : "password";
  togglePassword.classList.toggle("fa-eye");
  togglePassword.classList.toggle("fa-eye-slash");
});

const toggleConfirmPassword = document.getElementById("toggleConfirmPassword");
const confirmPasswordInput = document.getElementById("confirm-password");

toggleConfirmPassword?.addEventListener("click", function () {
  const isPassword = confirmPasswordInput.type === "password";
  confirmPasswordInput.type = isPassword ? "text" : "password";
  this.classList.toggle("fa-eye");
  this.classList.toggle("fa-eye-slash");
});
