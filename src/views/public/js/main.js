/* ============================================================
   THEME BTN
============================================================ */
const themeBtn = document.querySelector(".theme-btn");
const themeIcon = themeBtn?.querySelector("i");

themeBtn?.addEventListener("click", () => {
  document.body.classList.toggle("darke-theme");

  const isDark = document.body.classList.contains("darke-theme");
  themeIcon.className = isDark ? "fa-solid fa-sun" : "fa-solid fa-moon";
  localStorage.setItem("theme", isDark ? "dark" : "light");
});

// Persist across page loads
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("darke-theme");
  if (themeIcon) themeIcon.className = "fa-solid fa-sun";
}
/* ============================================================
   MOBILE NAVIGATION TOGGLE
============================================================ */
const mobileNav = document.querySelector("nav");
const navToggleBtn = document.querySelector(".navigation-btn");

function openNav() {
  mobileNav.classList.add("active");
  document.body.style.overflow = "hidden";
  document.documentElement.style.overflow = "hidden";
}

function closeNav() {
  mobileNav.classList.remove("active");
  document.body.style.overflow = "";
  document.documentElement.style.overflow = "";
}

navToggleBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  mobileNav.classList.contains("active") ? closeNav() : openNav();
});

document.addEventListener("click", (e) => {
  if (mobileNav.classList.contains("active") && !mobileNav.contains(e.target)) {
    closeNav();
  }
});

document.querySelectorAll(".nav-links .nav-link").forEach((link) => {
  link.addEventListener("click", closeNav);
});
/* ============================================================
| DROPDOWN TOGGLE
============================================================ */
const dropdownToggle = document.querySelector(".dropdown-toggle");
const dropdown = document.querySelector(".dropdown");

if (dropdownToggle) {
  dropdownToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown.classList.toggle("open");
  });
}

const navCloseBtn = document.querySelector(".close-btn");
if (navCloseBtn) {
  navCloseBtn.addEventListener("click", () => {
    dropdown?.classList.remove("open");
    dropdownToggle?.setAttribute("aria-expanded", "false");
  });
}
/* ============================================================
   USER PROFILE MODAL
============================================================ */

const profileModal = document.querySelector(".profile-modal");
const profileBtn = document.getElementById("profileBtn");
const closeModalBtn = document.querySelector(".close-modal");

profileBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  profileModal.classList.add("active");
});

closeModalBtn?.addEventListener("click", () => {
  profileModal.classList.remove("active");
});

profileModal?.addEventListener("click", (e) => {
  if (e.target === profileModal) {
    profileModal.classList.remove("active");
  }
});

/* ============================================================
   PROFILE TABS NAVIGATION
============================================================ */

const tabButtons = document.querySelectorAll(".tab-btn");
const tabSections = document.querySelectorAll(".modal-section");

tabButtons.forEach((button) => {
  button.addEventListener("click", function () {
    const tabName = button.getAttribute("data-tab");
    switchTab(tabName);
  });
});

function switchTab(tabName) {
  tabButtons.forEach((btn) => btn.classList.remove("active"));
  tabSections.forEach((section) => section.classList.remove("active"));

  const selectedButton = document.querySelector(`[data-tab="${tabName}"]`);
  const selectedSection = document.getElementById(tabName);

  selectedButton?.classList.add("active");
  selectedSection?.classList.add("active");

  if (tabName === "donations") {
    loadUserDonations();
  }
}

switchTab("overview");

/* ============================================================
   USER PROFILE DATA LOADING
============================================================ */

async function loadUserProfile() {
  try {
    const authToken = localStorage.getItem("token");

    if (!authToken) {
      window.location.href = "/login";
      return;
    }

    const response = await fetch("/api/users/me", {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    const data = await response.json();

    if (response.ok) {
      const userData = data.data;

      document.querySelectorAll("#userName").forEach((element) => {
        element.textContent = userData.name;
      });

      const userEmailElement = document.getElementById("userEmail");
      if (userEmailElement) userEmailElement.textContent = userData.email;

      const userRoleElement = document.getElementById("role");
      if (userRoleElement)
        userRoleElement.textContent = userData.role || "User";

      const memberSinceElement = document.getElementById("memberSince");
      if (memberSinceElement) {
        memberSinceElement.textContent = new Date(
          userData.createdAt
        ).toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        });
      }

      const editNameInput = document.getElementById("editName");
      if (editNameInput) editNameInput.value = userData.name;

      const editEmailInput = document.getElementById("editEmail");
      if (editEmailInput) editEmailInput.value = userData.email;

      const editPhoneInput = document.getElementById("editPhone");
      if (editPhoneInput) editPhoneInput.value = userData.phone || "";

      loadDonationStatistics();
    } else {
      if (response.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    }
  } catch (error) {
    localStorage.removeItem("token");
    window.location.href = "/login";
  }
}

/* ============================================================
   DONATION STATISTICS
============================================================ */

async function loadDonationStatistics() {
  try {
    const authToken = localStorage.getItem("token");

    const response = await fetch("/api/donations/me", {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (response.ok) {
      const data = await response.json();
      const userDonations = data.data;

      const totalDonationsCount = userDonations.length;
      const totalDonationAmount = userDonations
        .filter((d) => d.status === "success")
        .reduce((sum, d) => sum + d.amount, 0);

      const totalDonationsElement = document.querySelector(
        "#overview #totalDonations"
      );
      if (totalDonationsElement)
        totalDonationsElement.textContent = totalDonationsCount;

      const statCards = document.querySelectorAll("#overview .stat-card");
      if (statCards[1]) {
        const amountElement = statCards[1].querySelector("h4");
        if (amountElement)
          amountElement.textContent = `KES ${totalDonationAmount.toLocaleString()}`;
      }
    }
  } catch (error) {
    // silent fail
  }
}

/* ============================================================
   USER DONATIONS LIST
============================================================ */

async function loadUserDonations(filter = "all") {
  try {
    const authToken = localStorage.getItem("token");
    const donationsListContainer = document.querySelector(".donations-list");

    if (!donationsListContainer) return;

    donationsListContainer.innerHTML = `
      <div class="loading-state">
        <i class="fa-solid fa-spinner fa-spin"></i>
        <p>Loading donations...</p>
      </div>
    `;

    const response = await fetch("/api/donations/me", {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (response.ok) {
      const data = await response.json();
      let donations = data.data;

      if (filter !== "all") {
        donations = donations.filter((d) => d.status === filter);
      }

      donations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      if (donations.length === 0) {
        donationsListContainer.innerHTML = `
          <div class="empty-state">
            <i class="fa-solid fa-inbox"></i>
            <p>No ${filter !== "all" ? filter : ""} donations found</p>
          </div>
        `;
        return;
      }

      donationsListContainer.innerHTML = donations
        .map(
          (donation) => `
        <div class="donation-card">
          <div class="donation-card-header">
            <div>
              <h4>${donation.project?.title || "Unknown Project"}</h4>
              <span class="status-badge ${donation.status}">${
            donation.status
          }</span>
            </div>
            <h3 class="donation-amount">KES ${donation.amount.toLocaleString()}</h3>
          </div>
          <div class="donation-details">
            <span>
              <i class="fa-solid fa-calendar"></i>
              ${new Date(donation.createdAt).toLocaleDateString()}
            </span>
            <span>
              <i class="fa-solid fa-credit-card"></i>
              ${donation.paymentMethod}
            </span>
            ${
              donation.reference
                ? `
              <span>
                <i class="fa-solid fa-hashtag"></i>
                ${donation.reference}
              </span>
            `
                : ""
            }
          </div>
        </div>
      `
        )
        .join("");
    } else {
      donationsListContainer.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-exclamation-circle"></i>
          <p>Failed to load donations</p>
        </div>
      `;
    }
  } catch (error) {
    const donationsListContainer = document.querySelector(".donations-list");
    if (donationsListContainer) {
      donationsListContainer.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-exclamation-circle"></i>
          <p>Error loading donations</p>
        </div>
      `;
    }
  }
}

/* ============================================================
   DONATION FILTERS
============================================================ */

const filterButtons = document.querySelectorAll(".filter-btn");

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");
    const filterValue = button.getAttribute("data-filter");
    loadUserDonations(filterValue);
  });
});

/* ============================================================
   AUTHENTICATION STATE MANAGEMENT
============================================================ */

const authToken = localStorage.getItem("token");
const loginButton = document.getElementById("loginBtn");
const userProfileSection = document.querySelector(".user-profile");

if (authToken) {
  if (loginButton) loginButton.style.display = "none";
  if (userProfileSection) userProfileSection.style.display = "block";
  loadUserProfile();
} else {
  if (loginButton) loginButton.style.display = "block";
  if (userProfileSection) userProfileSection.style.display = "none";
}

/* ============================================================
   LOGOUT FUNCTIONALITY
============================================================ */

const logoutButton = document.getElementById("logoutBtn");

logoutButton?.addEventListener("click", (e) => {
  e.preventDefault();
  if (confirm("Are you sure you want to logout?")) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userId");
    window.location.href = "/login";
  }
});
/* ============================================================
   SHARED VARIABLES
============================================================ */

const token = localStorage.getItem("token");
const API = "";
const loginBtn = document.querySelector(".login-btn");

if (token) {
  loginBtn.style.display = "none";
} else {
  loginBtn.style.display = "block";
}

/* ============================================================
   TOAST NOTIFICATIONS
============================================================ */

function showToast(message, type = "success") {
  document.querySelector(".toast")?.remove();

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <i class="fa-solid ${
      type === "success" ? "fa-circle-check" : "fa-circle-xmark"
    }"></i>
    <span>${message}</span>
  `;

  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add("show"), 10);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

/* ============================================================
   UPDATE ACCOUNT INFO
============================================================ */

document
  .getElementById("acountInfo")
  ?.addEventListener("submit", handleAccountUpdate);
document
  .querySelector("#acountInfo .save-btn")
  ?.addEventListener("click", handleAccountUpdate);

async function handleAccountUpdate() {
  const name = document.getElementById("editName")?.value?.trim();
  const email = document.getElementById("editEmail")?.value?.trim();
  const phone = document.getElementById("editPhone")?.value?.trim();

  if (!name || !email) return showToast("Name and email are required", "error");

  try {
    const res = await fetch(`${API}/api/users/me`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, email, phone }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    document
      .querySelectorAll("#userName")
      .forEach((el) => (el.textContent = data.data.name));
    showToast("Profile updated successfully!", "success");
  } catch (err) {
    showToast(err.message || "Update failed", "error");
  }
}

/* ============================================================
   UPDATE PASSWORD
============================================================ */

document
  .querySelector("#changePassword .save-btn")
  ?.addEventListener("click", async () => {
    const currentPassword = document.getElementById("currentPassword")?.value;
    const newPassword = document.getElementById("newPassword")?.value;
    const confirmPassword = document.getElementById("confirmPassword")?.value;

    if (!currentPassword || !newPassword || !confirmPassword)
      return alert("All password fields are required", "error");

    if (newPassword !== confirmPassword)
      return alert("New passwords do not match", "error");

    if (newPassword.length < 8)
      return alert("Password must be at least 8 characters", "error");

    try {
      const res = await fetch(`/api/users/me/password`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      document.getElementById("currentPassword").value = "";
      document.getElementById("newPassword").value = "";
      document.getElementById("confirmPassword").value = "";
    } catch (err) {
      alert(err.message || "Password update failed", "error");
    }
  });

/* ============================================================
   SCROLL BEHAVIOR
============================================================ */

const scrollProjectLeft = document.querySelector(".ps-left");
const scrollProjectRight = document.querySelector(".ps-right");
const homeProjectContainer = document.querySelector(".home-projects-container");
const projectScrollAmount = 400;

scrollProjectLeft?.addEventListener("click", () => {
  homeProjectContainer?.scrollBy({
    left: -projectScrollAmount,
    behavior: "smooth",
  });
});

scrollProjectRight?.addEventListener("click", () => {
  homeProjectContainer?.scrollBy({
    left: projectScrollAmount,
    behavior: "smooth",
  });
});
