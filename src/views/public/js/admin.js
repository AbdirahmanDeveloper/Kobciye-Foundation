/* ============================================================
   AUTHENTICATION CHECK
============================================================ */

const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "/login";
  throw new Error("Unauthorized - redirecting to login");
}

/* ============================================================
   HELPER
============================================================ */

function closeAndReload() {
  window.location.reload();
}

/* ============================================================
   AUTHENTICATION NAVIGATION
============================================================ */

const goToLoginBtn = document.getElementById("goToLoginBtn");
const adminLogoutBtn = document.getElementById("adminLogoutBtn");

goToLoginBtn?.addEventListener("click", (e) => {
  e.preventDefault();
  goToLoginBtn.disabled = true;
  goToLoginBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>Redirecting...</span>`;
  setTimeout(() => { window.location.href = "/login"; }, 300);
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
    setTimeout(() => { window.location.href = "/login"; }, 500);
  }
});

/* ============================================================
   NAVIGATION & SIDEBAR
============================================================ */

const navigationLinks = document.querySelectorAll(".nav-links a");
const contentSections = document.querySelectorAll(".content-section");

navigationLinks.forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    navigationLinks.forEach((l) => l.classList.remove("active"));
    contentSections.forEach((s) => s.classList.remove("active"));
    link.classList.add("active");
    const target = document.getElementById(link.getAttribute("href").substring(1));
    if (target) target.classList.add("active");
  });
});

document.getElementById("dashboard")?.classList.add("active");

const sidebarNav = document.querySelector("nav");
const navigationToggleBtn = document.querySelector(".navigation-btn");

navigationToggleBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  sidebarNav.classList.toggle("active");
});

/* ============================================================
   DASHBOARD STATISTICS
============================================================ */

async function fetchTotalDonationAmount() {
  try {
    const response = await fetch("/api/donations/totalAmount", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    const el = document.getElementById("totalDonatedAmount");
    if (el) el.textContent = response.ok ? `KES ${(data.data.totalAmount || 0).toLocaleString()}` : "KES 0";
  } catch (error) {
    console.error("Error fetching total donation amount:", error);
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
  } catch (error) {
    console.error("Error fetching total users:", error);
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
  } catch (error) {
    console.error("Error fetching total members:", error);
  }
}

async function fetchProjectCounts() {
  try {
    const response = await fetch("/api/projects/countProjects", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    const activeEl = document.getElementById("activeProjects");
    const completedEl = document.getElementById("completedProjects");
    if (response.ok) {
      if (activeEl) activeEl.textContent = data.data.countActive;
      if (completedEl) completedEl.textContent = data.data.countCompleted;
    }
  } catch (error) {
    console.error("Error fetching project counts:", error);
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
        datasets: [{
          label: "Monthly Donations (KES)",
          data: monthlyStatsData.map((i) => i.totalAmount),
          borderWidth: 2,
          tension: 0.3,
          fill: true,
          borderColor: "#667eea",
          backgroundColor: "rgba(102, 126, 234, 0.1)",
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: true } },
        scales: { y: { beginAtZero: true } },
      },
    });
  } catch (error) {
    console.error("Chart rendering error:", error);
  }
});

/* ============================================================
   PROJECTS MANAGEMENT
============================================================ */

const createProjectBtn = document.getElementById("addProject");
const createProjectModal = document.querySelector(".create-project");
const createProjectForm = document.getElementById("createProjectForm");
const projectSuccessModal = document.getElementById("projectSuccessMessage");
const projectErrorModal = document.getElementById("projectErrorMessage");
const allFormElements = document.querySelectorAll(".form");

createProjectBtn?.addEventListener("click", (e) => {
  e.preventDefault();
  createProjectModal.classList.add("active");
});

createProjectModal?.addEventListener("click", (e) => {
  if (e.target === createProjectModal) createProjectModal.classList.remove("active");
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
    } else {
      if (projectErrorModal) projectErrorModal.style.display = "flex";
    }
  } catch (error) {
    console.error("Project creation error:", error);
    if (projectErrorModal) projectErrorModal.style.display = "flex";
  }
});

// Edit project
const editProjectModal = document.querySelector(".edit-project");
const editProjectForm = document.getElementById("editProjectForm");
const editProjectFormWrapper = document.querySelector(".edit-project .form");
const projectUpdateSuccessModal = document.getElementById("projectUpdateSuccess");
const projectUpdateErrorModal = document.getElementById("projectUpdateError");

document.querySelectorAll(".edit-project-btn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const projectId = btn.getAttribute("data-id");
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        const editProjectId = document.getElementById("editProjectId");
        const editTitle = document.getElementById("editTitle");
        const editDescription = document.getElementById("editDescription");
        const editGoalAmount = document.getElementById("editGoalAmount");
        const editStatus = document.getElementById("editStatus");

        if (editProjectId) editProjectId.value = data.data._id;
        if (editTitle) editTitle.value = data.data.title;
        if (editDescription) editDescription.value = data.data.description;
        if (editGoalAmount) editGoalAmount.value = data.data.goalAmount;
        if (editStatus) editStatus.value = data.data.status;

        editProjectModal.classList.add("active");
      }
    } catch (error) {
      console.error("Fetch project error:", error);
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
      if (projectUpdateErrorModal) projectUpdateErrorModal.style.display = "none";
      if (projectUpdateSuccessModal) projectUpdateSuccessModal.style.display = "flex";
      editProjectForm.reset();
    } else {
      if (editProjectFormWrapper) editProjectFormWrapper.style.display = "none";
      if (projectUpdateSuccessModal) projectUpdateSuccessModal.style.display = "none";
      if (projectUpdateErrorModal) projectUpdateErrorModal.style.display = "flex";
    }
  } catch (error) {
    console.error("Project update error:", error);
    if (editProjectFormWrapper) editProjectFormWrapper.style.display = "none";
    if (projectUpdateSuccessModal) projectUpdateSuccessModal.style.display = "none";
    if (projectUpdateErrorModal) projectUpdateErrorModal.style.display = "flex";
  }
});

editProjectModal?.addEventListener("click", (e) => {
  if (e.target === editProjectModal) {
    editProjectModal.classList.remove("active");
    if (editProjectFormWrapper) editProjectFormWrapper.style.display = "flex";
    if (projectUpdateSuccessModal) projectUpdateSuccessModal.style.display = "none";
    if (projectUpdateErrorModal) projectUpdateErrorModal.style.display = "none";
  }
});

document.getElementById("projectUpdateOkBtn")?.addEventListener("click", closeAndReload);
document.getElementById("projectUpdateErrorBtn")?.addEventListener("click", () => {
  if (projectUpdateErrorModal) projectUpdateErrorModal.style.display = "none";
  if (editProjectFormWrapper) editProjectFormWrapper.style.display = "flex";
});

/* ============================================================
   NEWS MANAGEMENT
============================================================ */

const createNewsBtn = document.getElementById("addNews");
const createNewsModal = document.querySelector(".create-news");
const createNewsForm = document.getElementById("createNewsForm");
const newsSuccessModal = document.getElementById("newsSuccessMessage");
const newsErrorModal = document.getElementById("newsErrorMessage");

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
    } else {
      if (newsErrorModal) newsErrorModal.style.display = "flex";
    }
  } catch (error) {
    console.error("News creation error:", error);
    if (newsErrorModal) newsErrorModal.style.display = "flex";
  }
});

// Delete news
document.querySelectorAll(".delete-btn").forEach((btn) => {
  btn.addEventListener("click", async (e) => {
    e.preventDefault();
    const newsId = btn.getAttribute("data-id");
    if (!confirm("Are you sure you want to delete this news?")) return;

    try {
      const response = await fetch(`/api/news/${newsId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok || response.status === 204) {
        btn.closest("tr")?.remove();
        alert("News deleted successfully!");
      } else {
        const data = await response.json();
        alert(data.message || "Failed to delete news");
      }
    } catch (error) {
      console.error("Delete news error:", error);
      alert("An error occurred while deleting news");
    }
  });
});

// Edit news
const editNewsSection = document.querySelector(".edit-news");
const editNewsForm = document.getElementById("editNewsForm");
const editNewsFormWrapper = document.querySelector(".edit-news .form");
const newsUpdateSuccess = document.getElementById("newsUpdateSuccess");
const newsUpdateError = document.getElementById("newsUpdateError");

document.querySelectorAll(".edit-btn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const newsId = btn.getAttribute("data-id");

    try {
      const res = await fetch(`/api/news/${newsId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok) {
        console.error("Failed to fetch news:", data.message);
        return;
      }

      // Safe null-checked assignments
      const editNewsId = document.getElementById("editNewsId");
      const editNewsTitle = document.getElementById("editNewsTitle");
      const editNewsContent = document.getElementById("editNewsContent");
      const editNewsPreview = document.getElementById("editNewsPreview");

      if (editNewsId) editNewsId.value = data.data._id;
      if (editNewsTitle) editNewsTitle.value = data.data.title;
      if (editNewsContent) editNewsContent.value = data.data.content;
      if (editNewsPreview) editNewsPreview.src = `/uploads/news/${data.data.image}`;

      if (editNewsSection) editNewsSection.classList.add("active");

    } catch (error) {
      console.error("Fetch news error:", error);
    }
  });
});

editNewsSection?.addEventListener("click", (e) => {
  if (e.target === editNewsSection) editNewsSection.classList.remove("active");
});

// Cancel edit news button
document.getElementById("cancelEditNews")?.addEventListener("click", () => {
  editNewsSection?.classList.remove("active");
});

editNewsForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const newsId = document.getElementById("editNewsId")?.value;

  if (!newsId) {
    console.error("News ID not found");
    return;
  }

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
  } catch (error) {
    console.error("Update news error:", error);
    if (editNewsFormWrapper) editNewsFormWrapper.style.display = "none";
    if (newsUpdateSuccess) newsUpdateSuccess.style.display = "none";
    if (newsUpdateError) newsUpdateError.style.display = "flex";
  }
});

document.getElementById("newsUpdateOkBtn")?.addEventListener("click", closeAndReload);
document.getElementById("newsUpdateErrorBtn")?.addEventListener("click", () => {
  if (newsUpdateError) newsUpdateError.style.display = "none";
  if (editNewsFormWrapper) editNewsFormWrapper.style.display = "flex";
});

/* ============================================================
   MEMBERS MANAGEMENT
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
    const data = await response.json();

    if (response.ok) {
      if (memberErrorModal) memberErrorModal.style.display = "none";
      if (memberSuccessModal) memberSuccessModal.style.display = "flex";
      addMemberForm.reset();
    } else {
      if (memberSuccessModal) memberSuccessModal.style.display = "none";
      if (memberErrorModal) memberErrorModal.style.display = "flex";
      console.error("Error:", data.message);
    }
  } catch (error) {
    console.error("Member creation error:", error);
    if (memberSuccessModal) memberSuccessModal.style.display = "none";
    if (memberErrorModal) memberErrorModal.style.display = "flex";
  }
});

// Delete member
document.querySelectorAll(".delete-member-btn").forEach((btn) => {
  btn.addEventListener("click", async (e) => {
    e.preventDefault();
    const memberId = btn.getAttribute("data-id");
    if (!confirm("Are you sure you want to delete this member?")) return;

    try {
      const response = await fetch(`/api/members/${memberId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok || response.status === 204) {
        btn.closest("tr")?.remove();
        alert("Member deleted successfully!");
      } else {
        const data = await response.json();
        alert(data.message || "Failed to delete member");
      }
    } catch (error) {
      console.error("Delete member error:", error);
      alert("An error occurred while deleting member");
    }
  });
});

/* ============================================================
   DONATIONS MANAGEMENT
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
  } catch (error) {
    console.error("Donor creation error:", error);
    if (donorSuccessModal) donorSuccessModal.style.display = "none";
    if (donorErrorModal) donorErrorModal.style.display = "flex";
  }
});

/* ============================================================
   GLOBAL OK BUTTONS — ALL RELOAD
============================================================ */

document.querySelectorAll(".ok-btn, .ok-error-btn").forEach((btn) => {
  btn.addEventListener("click", closeAndReload);
});