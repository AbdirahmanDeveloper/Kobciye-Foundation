// LOGIN SUBMITION
const loginForm = document.getElementById("login-form");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  try {
    const res = await fetch("/api/users/login", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.message || "Signup failed");
      return;
    }

    // save the token
    localStorage.setItem("token", data.token);

    // redirect
    const role = data.data.role;

    if (role === "admin") {
      window.location.href = "/admin";
    } else {
      window.location.href = "/";
    }
  } catch (err) {
    console.error(err);
  }
});

document.getElementById("forgotBtn")?.addEventListener("click", (e) => {
  e.preventDefault();
  window.location.href = "/otp";
});