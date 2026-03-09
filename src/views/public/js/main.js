/* ============================================================
   HEADER SCROLL EFFECT
============================================================ */

const header = document.querySelector("header");
const SCROLL_THRESHOLD = 80;

window.addEventListener("scroll", () => {
  if (window.scrollY > SCROLL_THRESHOLD) {
    header.classList.add("active");
  } else {
    header.classList.remove("active");
  }
});


/* ============================================================
   MOBILE NAVIGATION TOGGLE
============================================================ */

const mobileNav = document.querySelector("nav");
const navigationToggleBtn = document.querySelector(".navigation-btn");

navigationToggleBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  mobileNav.classList.toggle("active");
});


/* ============================================================
   USER PROFILE MODAL
============================================================ */

const profileModal = document.querySelector(".profile-modal");
const profileBtn = document.getElementById("profileBtn");
const closeModalBtn = document.querySelector(".close-modal");

// Open profile modal
profileBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  profileModal.classList.add("active");
});

// Close profile modal
closeModalBtn?.addEventListener("click", () => {
  profileModal.classList.remove("active");
});

// Close modal when clicking outside
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

// Handle tab clicks
tabButtons.forEach((button) => {
  button.addEventListener("click", function () {
    const tabName = button.getAttribute("data-tab");
    switchTab(tabName);
  });
});

// Switch between tabs
function switchTab(tabName) {
  // Remove active class from all tabs and sections
  tabButtons.forEach((btn) => btn.classList.remove("active"));
  tabSections.forEach((section) => section.classList.remove("active"));

  // Add active class to selected tab and section
  const selectedButton = document.querySelector(`[data-tab="${tabName}"]`);
  const selectedSection = document.getElementById(tabName);

  selectedButton?.classList.add("active");
  selectedSection?.classList.add("active");

  // Load donations data when donations tab is opened
  if (tabName === "donations") {
    loadUserDonations();
  }
}

// Set default tab
switchTab("overview");


/* ============================================================
   USER PROFILE DATA LOADING
============================================================ */

// Load and display user profile information
async function loadUserProfile() {
  try {
    const authToken = localStorage.getItem("token");

    // Redirect to login if no token
    if (!authToken) {
      window.location.href = "/login";
      return;
    }

    // Fetch user data from API
    const response = await fetch("/api/users/me", {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    const data = await response.json();

    if (response.ok) {
      const userData = data.data;

      console.log("✅ User profile loaded:", userData);

      // Update all user name elements
      const userNameElements = document.querySelectorAll("#userName");
      userNameElements.forEach((element) => {
        element.textContent = userData.name;
      });

      // Update email
      const userEmailElement = document.getElementById("userEmail");
      if (userEmailElement) {
        userEmailElement.textContent = userData.email;
      }

      // Update role
      const userRoleElement = document.getElementById("role");
      if (userRoleElement) {
        userRoleElement.textContent = userData.role || "User";
      }

      // Update member since date
      const memberSinceElement = document.getElementById("memberSince");
      if (memberSinceElement) {
        const memberSinceDate = new Date(userData.createdAt).toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        });
        memberSinceElement.textContent = memberSinceDate;
      }

      // Populate edit form fields
      const editNameInput = document.getElementById("editName");
      if (editNameInput) {
        editNameInput.value = userData.name;
      }

      const editEmailInput = document.getElementById("editEmail");
      if (editEmailInput) {
        editEmailInput.value = userData.email;
      }

      // Load donation statistics
      loadDonationStatistics();

    } else {
      console.error("❌ Failed to load user:", data.message);

      // Handle unauthorized access
      if (response.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    }
  } catch (error) {
    console.error("❌ Error loading profile:", error);

    // Clear token and redirect to login on error
    localStorage.removeItem("token");
    window.location.href = "/login";
  }
}


/* ============================================================
   DONATION STATISTICS
============================================================ */

// Load and display donation statistics in overview tab
async function loadDonationStatistics() {
  try {
    const authToken = localStorage.getItem("token");

    const response = await fetch("/api/donations/me", {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      const userDonations = data.data;

      // Calculate total donations count
      const totalDonationsCount = userDonations.length;

      // Calculate total amount (only successful donations)
      const totalDonationAmount = userDonations
        .filter((donation) => donation.status === "success")
        .reduce((sum, donation) => sum + donation.amount, 0);

      // Update total donations count
      const totalDonationsElement = document.querySelector("#overview #totalDonations");
      if (totalDonationsElement) {
        totalDonationsElement.textContent = totalDonationsCount;
      }

      // Update total amount (in second stat card)
      const statCards = document.querySelectorAll("#overview .stat-card");
      if (statCards[1]) {
        const amountElement = statCards[1].querySelector("h4");
        if (amountElement) {
          amountElement.textContent = `KES ${totalDonationAmount.toLocaleString()}`;
        }
      }

      console.log("✅ Donation stats loaded:", {
        count: totalDonationsCount,
        amount: totalDonationAmount,
      });

    } else {
      console.error("❌ Failed to load donation stats");
    }
  } catch (error) {
    console.error("❌ Error loading donation stats:", error);
  }
}


/* ============================================================
   USER DONATIONS LIST
============================================================ */

// Load and display user's donation history
async function loadUserDonations(filter = "all") {
  try {
    const authToken = localStorage.getItem("token");
    const donationsListContainer = document.querySelector(".donations-list");

    if (!donationsListContainer) return;

    // Show loading state
    donationsListContainer.innerHTML = `
      <div class="loading-state">
        <i class="fa-solid fa-spinner fa-spin"></i>
        <p>Loading donations...</p>
      </div>
    `;

    // Fetch donations from API
    const response = await fetch("/api/donations/me", {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      let donations = data.data;

      // Apply filter (all, success, pending, failed)
      if (filter !== "all") {
        donations = donations.filter((donation) => donation.status === filter);
      }

      // Sort by date (newest first)
      donations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // Show empty state if no donations
      if (donations.length === 0) {
        donationsListContainer.innerHTML = `
          <div class="empty-state">
            <i class="fa-solid fa-inbox"></i>
            <p>No ${filter !== "all" ? filter : ""} donations found</p>
          </div>
        `;
        return;
      }

      // Render donations list
      donationsListContainer.innerHTML = donations
        .map(
          (donation) => `
        <div class="donation-card">
          <div class="donation-card-header">
            <div>
              <h4>${donation.project?.title || "Unknown Project"}</h4>
              <span class="status-badge ${donation.status}">${donation.status}</span>
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

      console.log(`✅ Loaded ${donations.length} donations (filter: ${filter})`);

    } else {
      console.error("❌ Failed to load donations");
      donationsListContainer.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-exclamation-circle"></i>
          <p>Failed to load donations</p>
        </div>
      `;
    }
  } catch (error) {
    console.error("❌ Error loading donations:", error);

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

// Handle donation filter button clicks
const filterButtons = document.querySelectorAll(".filter-btn");

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    // Remove active class from all filter buttons
    filterButtons.forEach((btn) => btn.classList.remove("active"));

    // Add active class to clicked button
    button.classList.add("active");

    // Get filter value and reload donations
    const filterValue = button.getAttribute("data-filter");
    loadUserDonations(filterValue);

    console.log(`🔍 Filtering donations: ${filterValue}`);
  });
});


/* ============================================================
   AUTHENTICATION STATE MANAGEMENT
============================================================ */

const authToken = localStorage.getItem("token");
const loginButton = document.getElementById("loginBtn");
const userProfileSection = document.querySelector(".user-profile");

// Show/hide UI elements based on authentication state
if (authToken) {
  // User is logged in
  console.log("✅ User authenticated");

  if (loginButton) loginButton.style.display = "none";
  if (userProfileSection) userProfileSection.style.display = "block";

  // Load user profile data
  loadUserProfile();

} else {
  // User is not logged in
  console.log("❌ User not authenticated");

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
    console.log("🚪 Logging out user...");

    // Clear authentication data
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userId");

    // Redirect to login page
    window.location.href = "/login";
  }
});


/* ============================================================
   NEWSLETTER SUBSCRIPTION (FOOTER)
============================================================ */

const newsletterForm = document.querySelector(".newsletter-form");
const messageModal = document.querySelector(".message-modal");

newsletterForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const emailInput = newsletterForm.querySelector('input[type="email"]');
  const emailValue = emailInput.value.trim();

  if (!emailValue) {
    alert("Please enter your email address");
    return;
  }

  try {
    const response = await fetch("/api/contact/newsletter/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: emailValue }),
    });

    const data = await response.json();

    if (response.ok) {
      // Show success message
      showMessage("success", "Successfully subscribed to newsletter!");
      emailInput.value = "";
    } else {
      // Show error message
      showMessage("error", data.message || "Subscription failed");
    }
  } catch (error) {
    console.error("Newsletter subscription error:", error);
    showMessage("error", "An error occurred. Please try again.");
  }
});

// Helper function to show messages
function showMessage(type, message) {
  const modal = document.querySelector(".message-modal");
  const content = modal?.querySelector(".message-content");

  if (!modal || !content) return;

  content.className = `message-content ${type}`;
  content.querySelector("h2").textContent =
    type === "success" ? "Success!" : "Error";
  content.querySelector("p").textContent = message;

  modal.style.display = "flex";
  content.style.display = "flex";

  // Auto-hide after 3 seconds
  setTimeout(() => {
    modal.style.display = "none";
    content.style.display = "none";
  }, 3000);
}

// Close message modal on OK button click
document.querySelector(".message-modal .ok-btn")?.addEventListener("click", () => {
  const modal = document.querySelector(".message-modal");
  const content = modal?.querySelector(".message-content");

  if (modal) modal.style.display = "none";
  if (content) content.style.display = "none";
});


/* ============================================================
   COMPLETE THE PROJECT AFTER RAISE GOAL AMOUNT
============================================================ */
async function completeProject() {
  try{
    const response = await fetch("/api/projects");
    const data = await response.json();
    console.log(data);
  }catch(error){
    console.error(error);
    
  }
}

/* ============================================================
   SHARED VARIABLES (used across profile & account functions)
============================================================ */

const token = localStorage.getItem("token");
const API = "";

/* ============================================================
   TOAST NOTIFICATIONS
============================================================ */

function showToast(message, type = "success") {
  document.querySelector(".toast")?.remove();

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <i class="fa-solid ${type === "success" ? "fa-circle-check" : "fa-circle-xmark"}"></i>
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
   UPDATE ACCOUNT INFO (name & email)
============================================================ */

document.getElementById("acountInfo")?.addEventListener("submit", handleAccountUpdate);

// Also trigger on the save button since it's type="button"
document.querySelector("#acountInfo .save-btn")?.addEventListener("click", handleAccountUpdate);

async function handleAccountUpdate() {
  const name = document.getElementById("editName")?.value?.trim();
  const email = document.getElementById("editEmail")?.value?.trim();

  if (!name || !email) {
    return showToast("Name and email are required", "error");
  }

  try {
    const res = await fetch(`${API}/api/users/me`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, email }),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.message);

    // Update displayed name everywhere
    document.querySelectorAll("#userName").forEach((el) => (el.textContent = data.data.name));

    showToast("Profile updated successfully!", "success");
  } catch (err) {
    showToast(err.message || "Update failed", "error");
  }
}

/* ============================================================
   UPDATE PASSWORD
============================================================ */

document.querySelector("#changePassword .save-btn")?.addEventListener("click", async () => {
  const currentPassword = document.getElementById("currentPassword")?.value;
  const newPassword = document.getElementById("newPassword")?.value;
  const confirmPassword = document.getElementById("confirmPassword")?.value;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return showToast("All password fields are required", "error");
  }

  if (newPassword !== confirmPassword) {
    return showToast("New passwords do not match", "error");
  }

  if (newPassword.length < 8) {
    return showToast("Password must be at least 8 characters", "error");
  }

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

    // Clear password fields
    document.getElementById("currentPassword").value = "";
    document.getElementById("newPassword").value = "";
    document.getElementById("confirmPassword").value = "";

    showToast("Password updated successfully!", "success");
  } catch (err) {
    showToast(err.message || "Password update failed", "error");
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