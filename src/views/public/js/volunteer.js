/* ============================================================
   VOLUNTEER
============================================================ */

const volonteerForm = document.getElementById("volonteerForm");
const volModal = document.getElementById("volMessageModal");
const volSuccess = document.getElementById("volSuccessMessage");
const volError = document.getElementById("volErrorMessage");
const volunteerTypeSelect = document.getElementById("volunteerType");
const missionsBox = document.getElementById("missionsBox");
const projectsBox = document.getElementById("projectsBox");
const missionSelect = document.getElementById("missionSelect");
const projectSelect = document.getElementById("projectSelect");

// ── VOLUNTEER TYPE ──
volunteerTypeSelect?.addEventListener("change", () => {
  const val = volunteerTypeSelect.value;

  missionsBox.style.display = "none";
  projectsBox.style.display = "none";
  missionSelect.required = false;
  projectSelect.required = false;

  if (val === "mission") {
    missionsBox.style.display = "block";
    missionSelect.required = true;
  } else if (val === "project") {
    projectsBox.style.display = "block";
    projectSelect.required = true;
  }
});

// ── FORM SUBMIT ──
volonteerForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const type = volunteerTypeSelect.value;

  if (!type) {
    alert("Please select a volunteer type");
    return;
  }
  if (type === "mission" && !missionSelect.value) {
    alert("Please select a mission");
    return;
  }
  if (type === "project" && !projectSelect.value) {
    alert("Please select a project");
    return;
  }

  const submitBtn = volonteerForm.querySelector(".vol-submit");
  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting...";

  try {
    const res = await fetch("/api/volunteers/apply", {
      method: "POST",
      body: new FormData(volonteerForm),
    });

    const data = await res.json();

    volModal.style.display = "flex";

    if (res.ok) {
      volSuccess.style.display = "flex";
      volError.style.display = "none";
      volonteerForm.reset();
      missionsBox.style.display = "none";
      projectsBox.style.display = "none";
    } else {
      volError.style.display = "flex";
      volSuccess.style.display = "none";
      volError.querySelector("p").textContent =
        data.message || "Something went wrong. Please try again.";
    }
  } catch (err) {
    console.error(err);
    volModal.style.display = "flex";
    volError.style.display = "flex";
    volSuccess.style.display = "none";
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit Application";
  }
});

// ── OK BUTTONS ──
document.querySelectorAll("#volMessageModal .ok-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    volModal.style.display = "none";
    volSuccess.style.display = "none";
    volError.style.display = "none";
  });
});
