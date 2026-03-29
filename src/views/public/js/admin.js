/* ============================================================
   AUTH CHECK
============================================================ */

const token = localStorage.getItem("token");

if (!token) {
  document.documentElement.style.display = "none";
  window.location.href = "/login";
  throw new Error("Unauthorized");
}

document.documentElement.style.display = "";

/* ============================================================
   HELPERS
============================================================ */

function closeAndReload() {
  window.location.reload();
}

const goToLoginBtn = document.getElementById("goToLoginBtn");
const adminLogoutBtn = document.getElementById("adminLogoutBtn");

goToLoginBtn?.addEventListener("click", (e) => {
  e.preventDefault();
  goToLoginBtn.disabled = true;
  goToLoginBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>Redirecting...</span>`;
  setTimeout(() => {
    window.location.href = "/login";
  }, 300);
});

adminLogoutBtn?.addEventListener("click", (e) => {
  e.preventDefault();
  if (confirm("Are you sure you want to logout?")) {
    adminLogoutBtn.disabled = true;
    adminLogoutBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>Logging out...</span>`;
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userId");
    sessionStorage.clear();
    setTimeout(() => {
      window.location.href = "/login";
    }, 500);
  }
});

/* ============================================================
   NOTIFICATIONS
============================================================ */

let notificationCount = 0;
let lastChecked = new Date(Date.now() - 60000).toISOString();
const notificationList = document.getElementById("notificationList");
const notificationCounter = document.querySelector(".notification-counter");
const notificationLink = document.querySelector(".notification-link");
const notificationSection = document.querySelector(".notification-section");

const timeAgo = (d) => {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  return s < 60
    ? `${s}s ago`
    : s < 3600
    ? `${Math.floor(s / 60)}m ago`
    : s < 86400
    ? `${Math.floor(s / 3600)}h ago`
    : new Date(d).toLocaleDateString();
};

function addNotification(type, message, time) {
  notificationList.querySelector(".notification-empty")?.remove();

  const item = document.createElement("div");
  item.className = "notification-item unread";
  item.innerHTML = `
    <div class="notification-icon ${type}">
      <i class="fa-solid ${
        type === "donation" ? "fa-hand-holding-dollar" : "fa-envelope"
      }"></i>
    </div>
    <div class="notification-text">
      <p>${message}</p>
      <span>${timeAgo(time)}</span>
    </div>
  `;
  notificationList.prepend(item);

  notificationCount++;
  notificationCounter.textContent =
    notificationCount > 99 ? "99+" : notificationCount;
  notificationCounter.style.display = "flex";
}

async function pollNotifications() {
  try {
    const [donRes, conRes] = await Promise.all([
      fetch(`/api/donations/recent?since=${lastChecked}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`/api/contact/recent?since=${lastChecked}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    const donData = await donRes.json();
    const conData = await conRes.json();

    if (donRes.ok && donData.data.length)
      donData.data.forEach((d) =>
        addNotification(
          "donation",
          `💰 ${
            d.donor?.name || "Anonymous"
          } donated KES ${d.amount.toLocaleString()}`,
          d.createdAt
        )
      );

    if (conRes.ok && conData.data.length)
      conData.data.forEach((c) =>
        addNotification(
          "contact",
          `✉️ New message from ${c.name}: "${c.subject}"`,
          c.createdAt
        )
      );

    lastChecked = new Date().toISOString();
  } catch {
    /* silent fail */
  }
}

pollNotifications();
setInterval(pollNotifications, 30000);

document.getElementById("clearNotifications")?.addEventListener("click", () => {
  notificationCount = 0;
  notificationCounter.textContent = "0";
  notificationCounter.style.display = "none";
  notificationList.innerHTML = `<div class="notification-empty"><i class="fa-regular fa-bell"></i> No new notifications</div>`;
});

notificationLink?.addEventListener("click", (e) => {
  e.preventDefault();
  notificationSection.classList.toggle("active");
  document
    .querySelectorAll(".notification-item.unread")
    .forEach((i) => i.classList.remove("unread"));
});

document.addEventListener("click", (e) => {
  if (
    notificationSection?.classList.contains("active") &&
    !notificationSection.contains(e.target) &&
    !notificationLink.contains(e.target)
  )
    notificationSection.classList.remove("active");
});

/* ============================================================
   SIDEBAR & NAVIGATION
============================================================ */

const loginBtn = document.querySelector(".login-btn");
const logoutBtn = document.getElementById("logoutBtn");
const userProfileSection = document.querySelector(".user-profile");

if (token) {
  if (loginBtn) loginBtn.style.display = "none";
  if (logoutBtn) logoutBtn.style.display = "block";
  if (userProfileSection) userProfileSection.style.display = "block";
} else {
  if (loginBtn) loginBtn.style.display = "block";
  if (logoutBtn) logoutBtn.style.display = "none";
  if (userProfileSection) userProfileSection.style.display = "none";
}

const navigationLinks = document.querySelectorAll(".nav-links a");
const contentSections = document.querySelectorAll(".content-section");
const sidebarNav = document.querySelector("nav");
const navigationToggleBtn = document.querySelector(".navigation-btn");

navigationLinks.forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    navigationLinks.forEach((l) => l.classList.remove("active"));
    contentSections.forEach((s) => s.classList.remove("active"));
    link.classList.add("active");
    document
      .getElementById(link.getAttribute("href").substring(1))
      ?.classList.add("active");
  });
});

document.getElementById("dashboard")?.classList.add("active");

navigationToggleBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  sidebarNav.classList.toggle("active");
});

/* ============================================================
   DASHBOARD STATS
============================================================ */

async function fetchTotalDonationAmount() {
  try {
    const response = await fetch("/api/donations/totalAmount", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    const el = document.getElementById("totalDonatedAmount");
    if (el)
      el.textContent = response.ok
        ? `KES ${(data.data.totalAmount || 0).toLocaleString()}`
        : "KES 0";
  } catch {
    /* silent fail */
  }
}

async function fetchTotalUsersCount() {
  try {
    const response = await fetch("/api/users/totalUsers", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    const el = document.getElementById("totalUsers");
    if (el) el.textContent = response.ok ? data.data.totalUsers : "0";
  } catch {
    /* silent fail */
  }
}

async function fetchTotalMembersCount() {
  try {
    const response = await fetch("/api/members/totalMembers", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    const el = document.getElementById("totalMembers");
    if (el) el.textContent = response.ok ? data.data.totalMembers : "0";
  } catch {
    /* silent fail */
  }
}

async function fetchProjectCounts() {
  try {
    const response = await fetch("/api/projects/countProjects", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    if (response.ok) {
      const activeEl = document.getElementById("activeProjects");
      const completedEl = document.getElementById("completedProjects");
      if (activeEl) activeEl.textContent = data.data.countActive;
      if (completedEl) completedEl.textContent = data.data.countCompleted;
    }
  } catch {
    /* silent fail */
  }
}

fetchTotalDonationAmount();
fetchTotalUsersCount();
fetchTotalMembersCount();
fetchProjectCounts();

/* ============================================================
   DONATIONS CHART
============================================================ */

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const response = await fetch("/api/donations/monthly-stats", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const monthlyStatsData = await response.json();
    const canvas = document.getElementById("donationsChart");
    if (!canvas) return;

    new Chart(canvas.getContext("2d"), {
      type: "line",
      data: {
        labels: monthlyStatsData.map((i) => i.month),
        datasets: [
          {
            label: "Monthly Donations (KES)",
            data: monthlyStatsData.map((i) => i.totalAmount),
            borderWidth: 2,
            tension: 0.3,
            fill: true,
            borderColor: "#667eea",
            backgroundColor: "rgba(102, 126, 234, 0.1)",
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: true } },
        scales: { y: { beginAtZero: true } },
      },
    });
  } catch {}
});

/* ============================================================
   PROJECTS
============================================================ */

const createProjectBtn = document.getElementById("addProject");
const createProjectModal = document.querySelector(".create-project");
const createProjectForm = document.getElementById("createProjectForm");
const projectSuccessModal = document.getElementById("projectSuccessMessage");
const projectErrorModal = document.getElementById("projectErrorMessage");
const editProjectModal = document.querySelector(".edit-project");
const editProjectForm = document.getElementById("editProjectForm");
const editProjectFormWrapper = document.querySelector(".edit-project .form");
const projectUpdateSuccessModal = document.getElementById(
  "projectUpdateSuccess"
);
const projectUpdateErrorModal = document.getElementById("projectUpdateError");
const allFormElements = document.querySelectorAll(".form");

createProjectBtn?.addEventListener("click", (e) => {
  e.preventDefault();
  createProjectModal.classList.add("active");
});

createProjectModal?.addEventListener("click", (e) => {
  if (e.target === createProjectModal)
    createProjectModal.classList.remove("active");
});

createProjectForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  allFormElements.forEach((f) => (f.style.display = "none"));
  try {
    const response = await fetch("/api/projects/createProject", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: new FormData(createProjectForm),
    });
    if (response.ok) {
      if (projectSuccessModal) projectSuccessModal.style.display = "flex";
      createProjectForm.reset();
    } else if (projectErrorModal) projectErrorModal.style.display = "flex";
  } catch {
    if (projectErrorModal) projectErrorModal.style.display = "flex";
  }
});

document.querySelectorAll(".delete-project-btn").forEach((btn) => {
  btn.addEventListener("click", async (e) => {
    e.preventDefault();
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      const response = await fetch(
        `/api/projects/${btn.getAttribute("data-id")}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.ok || response.status === 204) btn.closest("tr")?.remove();
      else alert((await response.json()).message || "Failed to delete project");
    } catch {
      alert("An error occurred while deleting project");
    }
  });
});

document.querySelectorAll(".edit-project-btn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    try {
      const response = await fetch(
        `/api/projects/${btn.getAttribute("data-id")}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      if (response.ok) {
        document.getElementById("editProjectId").value = data.data._id;
        document.getElementById("editTitle").value = data.data.title;
        document.getElementById("editDescription").value =
          data.data.description;
        document.getElementById("editGoalAmount").value = data.data.goalAmount;
        document.getElementById("editStatus").value = data.data.status;
        editProjectModal.classList.add("active");
      }
    } catch {
      /* silent fail */
    }
  });
});

editProjectForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const projectId = document.getElementById("editProjectId")?.value;
  if (!projectId) return;
  try {
    const response = await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: document.getElementById("editTitle")?.value,
        description: document.getElementById("editDescription")?.value,
        goalAmount: document.getElementById("editGoalAmount")?.value,
        status: document.getElementById("editStatus")?.value,
      }),
    });
    if (response.ok) {
      if (editProjectFormWrapper) editProjectFormWrapper.style.display = "none";
      if (projectUpdateErrorModal)
        projectUpdateErrorModal.style.display = "none";
      if (projectUpdateSuccessModal)
        projectUpdateSuccessModal.style.display = "flex";
      editProjectForm.reset();
    } else {
      if (editProjectFormWrapper) editProjectFormWrapper.style.display = "none";
      if (projectUpdateSuccessModal)
        projectUpdateSuccessModal.style.display = "none";
      if (projectUpdateErrorModal)
        projectUpdateErrorModal.style.display = "flex";
    }
  } catch {
    if (editProjectFormWrapper) editProjectFormWrapper.style.display = "none";
    if (projectUpdateSuccessModal)
      projectUpdateSuccessModal.style.display = "none";
    if (projectUpdateErrorModal) projectUpdateErrorModal.style.display = "flex";
  }
});

editProjectModal?.addEventListener("click", (e) => {
  if (e.target === editProjectModal) {
    editProjectModal.classList.remove("active");
    if (editProjectFormWrapper) editProjectFormWrapper.style.display = "flex";
    if (projectUpdateSuccessModal)
      projectUpdateSuccessModal.style.display = "none";
    if (projectUpdateErrorModal) projectUpdateErrorModal.style.display = "none";
  }
});

document
  .getElementById("projectUpdateOkBtn")
  ?.addEventListener("click", closeAndReload);
document
  .getElementById("projectUpdateErrorBtn")
  ?.addEventListener("click", () => {
    if (projectUpdateErrorModal) projectUpdateErrorModal.style.display = "none";
    if (editProjectFormWrapper) editProjectFormWrapper.style.display = "flex";
  });

/* ============================================================
   NEWS
============================================================ */

const createNewsBtn = document.getElementById("addNews");
const createNewsModal = document.querySelector(".create-news");
const createNewsForm = document.getElementById("createNewsForm");
const newsSuccessModal = document.getElementById("newsSuccessMessage");
const newsErrorModal = document.getElementById("newsErrorMessage");
const editNewsSection = document.querySelector(".edit-news");
const editNewsForm = document.getElementById("editNewsForm");
const editNewsFormWrapper = document.querySelector(".edit-news .form");
const newsUpdateSuccess = document.getElementById("newsUpdateSuccess");
const newsUpdateError = document.getElementById("newsUpdateError");

createNewsBtn?.addEventListener("click", (e) => {
  e.preventDefault();
  createNewsModal.classList.add("active");
});

createNewsModal?.addEventListener("click", (e) => {
  if (e.target === createNewsModal) createNewsModal.classList.remove("active");
});

createNewsForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  allFormElements.forEach((f) => (f.style.display = "none"));
  try {
    const response = await fetch("/api/news", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: new FormData(createNewsForm),
    });
    if (response.ok) {
      if (newsSuccessModal) newsSuccessModal.style.display = "flex";
      createNewsForm.reset();
    } else if (newsErrorModal) newsErrorModal.style.display = "flex";
  } catch {
    if (newsErrorModal) newsErrorModal.style.display = "flex";
  }
});

document.querySelectorAll(".delete-btn").forEach((btn) => {
  btn.addEventListener("click", async (e) => {
    e.preventDefault();
    if (!confirm("Are you sure you want to delete this news?")) return;
    try {
      const response = await fetch(`/api/news/${btn.getAttribute("data-id")}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok || response.status === 204) btn.closest("tr")?.remove();
      else alert((await response.json()).message || "Failed to delete news");
    } catch {
      alert("An error occurred while deleting news");
    }
  });
});

document.querySelectorAll(".edit-btn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    try {
      const res = await fetch(`/api/news/${btn.getAttribute("data-id")}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) return;
      document.getElementById("editNewsId").value = data.data._id;
      document.getElementById("editNewsTitle").value = data.data.title;
      document.getElementById("editNewsContent").value = data.data.content;
      document.getElementById(
        "editNewsPreview"
      ).src = `/uploads/news/${data.data.image}`;
      editNewsSection.classList.add("active");
    } catch {
      /* silent fail */
    }
  });
});

editNewsSection?.addEventListener("click", (e) => {
  if (e.target === editNewsSection) editNewsSection.classList.remove("active");
});

document.getElementById("cancelEditNews")?.addEventListener("click", () => {
  editNewsSection?.classList.remove("active");
});

editNewsForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const newsId = document.getElementById("editNewsId")?.value;
  if (!newsId) return;
  try {
    const response = await fetch(`/api/news/${newsId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      body: new FormData(editNewsForm),
    });
    if (response.ok) {
      if (editNewsFormWrapper) editNewsFormWrapper.style.display = "none";
      if (newsUpdateError) newsUpdateError.style.display = "none";
      if (newsUpdateSuccess) newsUpdateSuccess.style.display = "flex";
      editNewsForm.reset();
    } else {
      if (editNewsFormWrapper) editNewsFormWrapper.style.display = "none";
      if (newsUpdateSuccess) newsUpdateSuccess.style.display = "none";
      if (newsUpdateError) newsUpdateError.style.display = "flex";
    }
  } catch {
    if (editNewsFormWrapper) editNewsFormWrapper.style.display = "none";
    if (newsUpdateSuccess) newsUpdateSuccess.style.display = "none";
    if (newsUpdateError) newsUpdateError.style.display = "flex";
  }
});

document
  .getElementById("newsUpdateOkBtn")
  ?.addEventListener("click", closeAndReload);
document.getElementById("newsUpdateErrorBtn")?.addEventListener("click", () => {
  if (newsUpdateError) newsUpdateError.style.display = "none";
  if (editNewsFormWrapper) editNewsFormWrapper.style.display = "flex";
});

/* ============================================================
   MEMBERS
============================================================ */

const addMemberBtn = document.getElementById("addMember");
const addMemberModal = document.querySelector(".add-member");
const memberSuccessModal = document.getElementById("memberSuccessMessage");
const memberErrorModal = document.getElementById("memberErrorMessage");
const addMemberForm = document.getElementById("addMemberForm");

addMemberBtn?.addEventListener("click", (e) => {
  e.preventDefault();
  addMemberModal?.classList.add("active");
});

addMemberModal?.addEventListener("click", (e) => {
  if (e.target === addMemberModal) addMemberModal.classList.remove("active");
});

addMemberForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const memberFormWrapper = addMemberModal?.querySelector(".form");
  if (memberFormWrapper) memberFormWrapper.style.display = "none";
  try {
    const response = await fetch("/api/members/add", {
      method: "POST",
      body: new FormData(addMemberForm),
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.ok) {
      if (memberErrorModal) memberErrorModal.style.display = "none";
      if (memberSuccessModal) memberSuccessModal.style.display = "flex";
      addMemberForm.reset();
    } else {
      if (memberSuccessModal) memberSuccessModal.style.display = "none";
      if (memberErrorModal) memberErrorModal.style.display = "flex";
    }
  } catch {
    if (memberSuccessModal) memberSuccessModal.style.display = "none";
    if (memberErrorModal) memberErrorModal.style.display = "flex";
  }
});

document.querySelectorAll(".delete-member-btn").forEach((btn) => {
  btn.addEventListener("click", async (e) => {
    e.preventDefault();
    if (!confirm("Are you sure you want to delete this member?")) return;
    try {
      const response = await fetch(
        `/api/members/${btn.getAttribute("data-id")}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.ok || response.status === 204) btn.closest("tr")?.remove();
      else alert((await response.json()).message || "Failed to delete member");
    } catch {
      alert("An error occurred while deleting member");
    }
  });
});

/* ============================================================
   MANUAL DONATION ENTRY
============================================================ */

const addDonorBtn = document.getElementById("addDonor");
const addDonorModal = document.querySelector(".add-donor");
const donorSuccessModal = document.getElementById("donorSuccessMessage");
const donorErrorModal = document.getElementById("donorErrorMessage");
const addDonorForm = document.getElementById("addDonorForm");

addDonorBtn?.addEventListener("click", (e) => {
  e.preventDefault();
  addDonorModal?.classList.add("active");
});

addDonorModal?.addEventListener("click", (e) => {
  if (e.target === addDonorModal) addDonorModal.classList.remove("active");
});

addDonorForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(addDonorForm);
  try {
    const response = await fetch("/api/donations/monthlyDonation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        donor: fd.get("donor"),
        amount: fd.get("amount"),
        paymentMethod: fd.get("paymentMethod"),
        project: fd.get("project"),
      }),
    });
    if (response.ok) {
      if (donorErrorModal) donorErrorModal.style.display = "none";
      if (donorSuccessModal) donorSuccessModal.style.display = "flex";
      addDonorForm.reset();
    } else {
      if (donorSuccessModal) donorSuccessModal.style.display = "none";
      if (donorErrorModal) donorErrorModal.style.display = "flex";
    }
  } catch {
    if (donorSuccessModal) donorSuccessModal.style.display = "none";
    if (donorErrorModal) donorErrorModal.style.display = "flex";
  }
});

/* ============================================================
   GLOBAL OK BUTTONS
============================================================ */

document.querySelectorAll(".ok-btn, .ok-error-btn").forEach((btn) => {
  btn.addEventListener("click", closeAndReload);
});
