// SIGNUP SUBMITION
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

  if (password !== confirmPassword) {
    alert("Passwords do not match");
    return;
  }

  try {
    const res = await fetch("/api/users/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, phone, country, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Signup failed");
      return;
    }
    // save the token
    localStorage.setItem("token", data.token);

    // redirect
    window.location.href = "/";
  } catch (err) {
    console.error("Fetch error:", err);
  }
});

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
  .catch(() => {
    console.error("Failed to load countries");
  });
