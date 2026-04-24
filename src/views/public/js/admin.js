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
  } catch {}
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
    sidebarNav.classList.remove("active");
    contentSections.forEach((s) => s.classList.remove("active"));
    link.classList.add("active");
    document
      .getElementById(link.getAttribute("href").substring(1))
      ?.classList.add("active");
  });
});

// Restore the active section after a reload
const savedSection = localStorage.getItem("activeSectionId") || "dashboard";
localStorage.removeItem("activeSectionId");
const savedLink = document.querySelector(
  `.nav-links a[href="#${savedSection}"]`
);
if (savedLink) {
  savedLink.classList.add("active");
  document.getElementById(savedSection)?.classList.add("active");
} else {
  document.querySelector(".nav-links a")?.classList.add("active");
  document.getElementById("dashboard")?.classList.add("active");
}

document.addEventListener("click", (e) => {
  if (!sidebarNav.contains(e.target) && sidebarNav.classList.contains("active"))
    sidebarNav.classList.remove("active");
});

navigationToggleBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  sidebarNav.classList.toggle("active");
});

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
      if (response.ok || response.status === 204) closeAndReload();
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
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      if (response.ok) {
        document.getElementById("editProjectId").value = data.data._id;
        document.getElementById("editTitle").value = data.data.title;
        document.getElementById("editDescription").value =
          data.data.description;
        document.getElementById("editBeneficiaries").value = data.data.beneficiares;
        document.getElementById("editImplementation").value = data.data.implementation;
        document.getElementById("editGoalAmount").value = data.data.goalAmount;
        document.getElementById("editStatus").value = data.data.status;
        editProjectModal.classList.add("active");
      }
    } catch {}
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

document.querySelectorAll(".delete-news-btn").forEach((btn) => {
  btn.addEventListener("click", async (e) => {
    e.preventDefault();
    if (!confirm("Are you sure you want to delete this news?")) return;
    try {
      const response = await fetch(`/api/news/${btn.getAttribute("data-id")}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok || response.status === 204) closeAndReload();
      else alert((await response.json()).message || "Failed to delete news");
    } catch {
      alert("An error occurred while deleting news");
    }
  });
});

document.querySelectorAll(".edit-news-btn").forEach((btn) => {
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
    } catch {}
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
      if (response.ok || response.status === 204) closeAndReload();
      else alert((await response.json()).message || "Failed to delete member");
    } catch {
      alert("An error occurred while deleting member");
    }
  });
});

/* ============================================================
   IMPACTS
============================================================ */

const editImpactsBtn = document.getElementById("editImpacts");
const impactsSection = document.querySelector(".impacts-section");
const impactsForm = document.getElementById("impactsForm");
const impactsSuccess = document.getElementById("impactsSuccess");
const impactsError = document.getElementById("impactsError");
const impactsWrapper = impactsSection?.querySelector(".form");

const loadImpacts = async () => {
  try {
    const res = await fetch("/api/impacts");
    const { data } = await res.json();
    if (!data) return;
    document.getElementById("impactCommunities").value = data.communities || 0;
    document.getElementById("impactProjects").value = data.projects || 0;
    document.getElementById("impactVolunteers").value = data.volunteers || 0;
  } catch (err) {
    console.error("Failed to load impacts:", err);
  }
};

editImpactsBtn?.addEventListener("click", () => {
  loadImpacts();
  impactsSection.classList.add("active");
});

impactsSection?.addEventListener("click", (e) => {
  if (e.target === impactsSection) impactsSection.classList.remove("active");
});

impactsForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (impactsWrapper) impactsWrapper.style.display = "none";
  try {
    const res = await fetch("/api/impacts", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        communities: document.getElementById("impactCommunities").value,
        projects: document.getElementById("impactProjects").value,
        volunteers: document.getElementById("impactVolunteers").value,
      }),
    });
    if (res.ok) impactsSuccess.style.display = "flex";
    else impactsError.style.display = "flex";
  } catch {
    impactsError.style.display = "flex";
  }
});

/* ============================================================
   VOLUNTEERS
============================================================ */

async function updateVolunteerStatus(id, status) {
  try {
    const res = await fetch(`/api/volunteers/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    if (res.ok) closeAndReload();
    else alert("Failed to update volunteer status");
  } catch {
    alert("An error occurred");
  }
}

document.querySelectorAll(".accept-volunteer-btn").forEach((btn) => {
  btn.addEventListener("click", () =>
    updateVolunteerStatus(btn.dataset.id, "accepted")
  );
});

document.querySelectorAll(".reject-volunteer-btn").forEach((btn) => {
  btn.addEventListener("click", () =>
    updateVolunteerStatus(btn.dataset.id, "rejected")
  );
});

document.querySelectorAll(".delete-volunteer-btn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    if (!confirm("Are you sure you want to delete this volunteer?")) return;
    try {
      const res = await fetch(`/api/volunteers/${btn.dataset.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok || res.status === 204) closeAndReload();
      else alert("Failed to delete volunteer");
    } catch {
      alert("An error occurred");
    }
  });
});

/* ============================================================
   MISSIONS
============================================================ */

const createMissionBtn = document.getElementById("createMission");
const createMissionSection = document.querySelector(".missions-section");
const createMissionForm = document.getElementById("missionsForm");
const missionsFormWrapper = createMissionSection?.querySelector(".form");
const editMissionSection = document.querySelector(".edit-mission");
const editMissionForm = document.getElementById("editMissionForm");
const editMissionFormWrapper = document.querySelector(".edit-mission .form");
const missionUpdateSuccess = document.getElementById("missionUpdateSuccess");
const missionUpdateError = document.getElementById("missionUpdateError");

createMissionBtn?.addEventListener("click", () => {
  createMissionSection.classList.add("active");
});

createMissionSection?.addEventListener("click", (e) => {
  if (e.target === createMissionSection)
    createMissionSection.classList.remove("active");
});

createMissionForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (missionsFormWrapper) missionsFormWrapper.style.display = "none";
  try {
    const response = await fetch("/api/missions/createMission", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: new FormData(createMissionForm),
    });
    if (response.ok) {
      document.getElementById("missionsSuccess").style.display = "flex";
      createMissionForm.reset();
    } else {
      document.getElementById("missionsError").style.display = "flex";
    }
  } catch {
    document.getElementById("missionsError").style.display = "flex";
  }
});

document.querySelectorAll(".edit-mission-btn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    try {
      const res = await fetch(`/api/missions/${btn.getAttribute("data-id")}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) return;
      const m = data.data;
      document.getElementById("editMissionId").value = m._id;
      document.getElementById("editMissionTitle").value = m.title;
      document.getElementById("editMissionDescription").value = m.description;
      document.getElementById("editMissionLocation").value = m.location;
      document.getElementById("editMissionDuration").value = m.duration;
      document.getElementById("editMissionVolunteers").value = m.volunteers;
      document.getElementById("editMissionStatus").value = m.status;
      if (editMissionFormWrapper) editMissionFormWrapper.style.display = "flex";
      if (missionUpdateSuccess) missionUpdateSuccess.style.display = "none";
      if (missionUpdateError) missionUpdateError.style.display = "none";
      editMissionSection.classList.add("active");
    } catch (err) {
      console.error("Failed to load mission:", err);
      alert("Failed to load mission data");
    }
  });
});

editMissionForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const missionId = document.getElementById("editMissionId")?.value;
  if (!missionId) return;
  if (editMissionFormWrapper) editMissionFormWrapper.style.display = "none";
  try {
    const response = await fetch(`/api/missions/${missionId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      body: new FormData(editMissionForm),
    });
    if (response.ok) {
      if (missionUpdateSuccess) missionUpdateSuccess.style.display = "flex";
      if (missionUpdateError) missionUpdateError.style.display = "none";
      editMissionForm.reset();
    } else {
      if (missionUpdateSuccess) missionUpdateSuccess.style.display = "none";
      if (missionUpdateError) missionUpdateError.style.display = "flex";
    }
  } catch (err) {
    console.error("Failed to update mission:", err);
    if (missionUpdateSuccess) missionUpdateSuccess.style.display = "none";
    if (missionUpdateError) missionUpdateError.style.display = "flex";
  }
});

editMissionSection?.addEventListener("click", (e) => {
  if (e.target === editMissionSection) {
    editMissionSection.classList.remove("active");
    if (editMissionFormWrapper) editMissionFormWrapper.style.display = "flex";
    if (missionUpdateSuccess) missionUpdateSuccess.style.display = "none";
    if (missionUpdateError) missionUpdateError.style.display = "none";
  }
});

document.getElementById("cancelEditMission")?.addEventListener("click", () => {
  editMissionSection?.classList.remove("active");
  if (editMissionFormWrapper) editMissionFormWrapper.style.display = "flex";
  if (missionUpdateSuccess) missionUpdateSuccess.style.display = "none";
  if (missionUpdateError) missionUpdateError.style.display = "none";
});

document
  .getElementById("missionUpdateErrorBtn")
  ?.addEventListener("click", () => {
    if (missionUpdateError) missionUpdateError.style.display = "none";
    if (editMissionFormWrapper) editMissionFormWrapper.style.display = "flex";
  });

document.querySelectorAll(".delete-mission-btn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    if (!confirm("Are you sure you want to delete this mission?")) return;
    try {
      const res = await fetch(`/api/missions/deleteMission/${btn.dataset.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok || res.status === 204) closeAndReload();
      else alert((await res.json()).message || "Failed to delete mission");
    } catch {
      alert("An error occurred while deleting mission");
    }
  });
});

/* ============================================================
   OK BUTTONS & DROPDOWNS
============================================================ */

document.querySelectorAll(".ok-btn, .ok-error-btn").forEach((btn) => {
  btn.addEventListener("click", closeAndReload);
});

document.querySelectorAll(".action-btn").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const dropdown = btn.nextElementSibling;
    document.querySelectorAll(".see-more-btns.active").forEach((d) => {
      if (d !== dropdown) d.classList.remove("active");
    });
    dropdown.classList.toggle("active");
  });
});

document.addEventListener("click", () => {
  document
    .querySelectorAll(".see-more-btns.active")
    .forEach((d) => d.classList.remove("active"));
});

/* ============================================================
   SUPPORT
============================================================ */

document.querySelectorAll(".accept-support-btn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const id = btn.dataset.id;
    try {
      const res = await fetch(`/api/support/${id}/accept`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.status === "success") closeAndReload();
      else alert("Failed to accept support request");
    } catch (err) {
      console.error(err);
    }
  });
});

document.querySelectorAll(".reject-support-btn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const id = btn.dataset.id;
    try {
      const res = await fetch(`/api/support/${id}/reject`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.status === "success") closeAndReload();
      else alert("Failed to reject support request");
    } catch (err) {
      console.error(err);
    }
  });
});

document.querySelectorAll(".delete-support-btn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const id = btn.dataset.id;
    if (!confirm("Are you sure you want to delete this support request?"))
      return;
    try {
      const res = await fetch(`/api/support/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.status === "success") closeAndReload();
      else alert("Failed to delete support request");
    } catch (err) {
      console.error(err);
    }
  });
});

/* ============================================================
   READ MORE TOGGLE
============================================================ */

document.querySelectorAll(".read-more-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const wrapper = btn.previousElementSibling;
    const isExpanded = wrapper.classList.toggle("expanded");
    btn.classList.toggle("expanded");
    btn.querySelector("span").textContent = isExpanded
      ? "Read Less"
      : "Read More";
  });
});

/* ============================================================
   MONTHLY DONATIONS
============================================================ */

const addMonthlyDonorBtn = document.getElementById("addMonthlyDonor");
const createMonthlyDonorModal = document.querySelector(".create-monthly-donor");
const createMonthlyDonorForm = document.getElementById(
  "createMonthlyDonorForm"
);
const monthlyDonorSuccess = document.getElementById("monthlyDonorSuccess");
const monthlyDonorError = document.getElementById("monthlyDonorError");
const monthlyDonorFormWrapper = createMonthlyDonorModal?.querySelector(".form");

const checkinModal = document.querySelector(".monthly-checkin-section");
const checkinForm = document.getElementById("monthlyCheckinForm");
const checkinFormWrapper = checkinModal?.querySelector("form");
const checkinSuccess = document.getElementById("checkinSuccess");
const checkinError = document.getElementById("checkinError");

// ── Open / close create modal ──────────────────────────────

addMonthlyDonorBtn?.addEventListener("click", () => {
  createMonthlyDonorModal.classList.add("active");
});

createMonthlyDonorModal?.addEventListener("click", (e) => {
  if (e.target === createMonthlyDonorModal)
    createMonthlyDonorModal.classList.remove("active");
});

createMonthlyDonorModal
  ?.querySelector(".close-modal-btn")
  ?.addEventListener("click", () => {
    createMonthlyDonorModal.classList.remove("active");
  });

// ── Create donor form submit ───────────────────────────────

createMonthlyDonorForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (monthlyDonorFormWrapper) monthlyDonorFormWrapper.style.display = "none";
  try {
    const res = await fetch("/api/monthly-donors/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: document.getElementById("donorName").value,
        email: document.getElementById("donorEmail").value,
        phone: document.getElementById("donorPhone").value,
        shopCenter: document.getElementById("shopCenter").value,
        shopNo: document.getElementById("shopNo").value,
        amount: document.getElementById("donorAmount").value,
        startDate: document.getElementById("donorStartDate").value,
      }),
    });
    if (res.ok) {
      if (monthlyDonorError) monthlyDonorError.style.display = "none";
      if (monthlyDonorSuccess) monthlyDonorSuccess.style.display = "flex";
      createMonthlyDonorForm.reset();
    } else {
      if (monthlyDonorSuccess) monthlyDonorSuccess.style.display = "none";
      if (monthlyDonorError) monthlyDonorError.style.display = "flex";
    }
  } catch {
    if (monthlyDonorSuccess) monthlyDonorSuccess.style.display = "none";
    if (monthlyDonorError) monthlyDonorError.style.display = "flex";
  }
});

// ── Open check-in modal & load donor data ─────────────────

document.querySelectorAll(".monthly-checkin-btn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const id = btn.dataset.id;
    try {
      const res = await fetch(`/api/monthly-donors/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) return alert("Failed to load donor");

      const donor = data.data;

      // Populate donor info
      document.getElementById("checkinDonorId").value = donor._id;
      document.getElementById("checkinDonorName").textContent = donor.name;
      document.getElementById("checkinDonorEmail").textContent = donor.email;
      document.getElementById("checkinDonorAmount").textContent =
        donor.amount.toLocaleString();

      // Pre-tick already paid months
      document.querySelectorAll(".month-checkbox").forEach((cb) => {
        cb.checked = donor.paidMonths.includes(Number(cb.value));
      });

      // Reset modal state
      if (checkinFormWrapper) checkinFormWrapper.style.display = "block";
      if (checkinSuccess) checkinSuccess.style.display = "none";
      if (checkinError) checkinError.style.display = "none";

      checkinModal.classList.add("active");
    } catch {
      alert("An error occurred loading donor data");
    }
  });
});

// ── Close check-in modal ──────────────────────────────────

checkinModal?.addEventListener("click", (e) => {
  if (e.target === checkinModal) checkinModal.classList.remove("active");
});

checkinModal
  ?.querySelector(".close-checkin-btn")
  ?.addEventListener("click", () => {
    checkinModal.classList.remove("active");
  });

// ── Submit check-in ───────────────────────────────────────

checkinForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("checkinDonorId").value;

  // Collect checked month indexes
  const checkedMonths = Array.from(
    document.querySelectorAll(".month-checkbox:checked")
  ).map((cb) => Number(cb.value));

  if (checkedMonths.length === 0) {
    return alert("Please select at least one month");
  }

  if (checkinFormWrapper) checkinFormWrapper.style.display = "none";

  try {
    const res = await fetch(`/api/monthly-donors/${id}/checkin`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ months: checkedMonths }),
    });
    if (res.ok) {
      if (checkinError) checkinError.style.display = "none";
      if (checkinSuccess) checkinSuccess.style.display = "flex";
    } else {
      if (checkinSuccess) checkinSuccess.style.display = "none";
      if (checkinError) checkinError.style.display = "flex";
    }
  } catch {
    if (checkinSuccess) checkinSuccess.style.display = "none";
    if (checkinError) checkinError.style.display = "flex";
  }
});

// ── Delete monthly donor ──────────────────────────────────

document.querySelectorAll(".delete-monthly-donor-btn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    if (!confirm("Are you sure you want to delete this monthly donor?")) return;
    try {
      const res = await fetch(`/api/monthly-donors/${btn.dataset.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok || res.status === 204) {
        document.getElementById("donorDeleteSuccess").style.display = "flex";
      }
    } catch {
      alert("An error occurred");
    }
  });
});

document.querySelectorAll(".delete-monthly-donor-btn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    if (!confirm("Are you sure you want to delete this monthly donor?")) return;
    try {
      const res = await fetch(`/api/monthly-donors/${btn.dataset.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok || res.status === 204) {
        document.getElementById("donorDeleteSuccess").style.display = "flex";
      } else {
        document.getElementById("donorDeleteError").style.display = "flex";
      }
      closeAndReload();
    } catch {
      document.getElementById("donorDeleteError").style.display = "flex";
    }
  });
});
