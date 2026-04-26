/* ============================================================
   VOLUNTEER
============================================================ */

const volonteerForm = document.getElementById("volonteerForm");
const volModal = document.getElementById("volMessageModal");
const volSuccess =
  document.getElementById("volSuccessMessage") ||
  document.getElementById("contactSuccessMessage");
const volError = document.getElementById("volErrorMessage");
const volunteerTypeSelect = document.getElementById("volunteerType");
const missionsBox = document.getElementById("missionsBox");
const projectsBox = document.getElementById("projectsBox");
const missionSelect = document.getElementById("missionSelect");
const projectSelect = document.getElementById("projectSelect");

// ── VOLUNTEER TYPE ──
volunteerTypeSelect?.addEventListener("change", () => {
  const val = volunteerTypeSelect.value;

  if (missionsBox) missionsBox.style.display = "none";
  if (projectsBox) projectsBox.style.display = "none";
  if (missionSelect) missionSelect.required = false;
  if (projectSelect) projectSelect.required = false;

  if (val === "mission" && missionsBox && missionSelect) {
    missionsBox.style.display = "block";
    missionSelect.required = true;
  } else if (val === "project" && projectsBox && projectSelect) {
    projectsBox.style.display = "block";
    projectSelect.required = true;
  }
});

// ── FORM SUBMIT ──
volonteerForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const type = volunteerTypeSelect?.value;

  if (!type) {
    alert("Please select a volunteer type");
    return;
  }
  if (type === "mission" && missionSelect && !missionSelect.value) {
    alert("Please select a mission");
    return;
  }
  if (type === "project" && projectSelect && !projectSelect.value) {
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

    if (volModal) volModal.style.display = "flex";

    if (res.ok) {
      if (volSuccess) volSuccess.style.display = "flex";
      if (volError) volError.style.display = "none";
      volonteerForm.reset();
      if (missionsBox) missionsBox.style.display = "none";
      if (projectsBox) projectsBox.style.display = "none";
    } else {
      if (volError) {
        volError.style.display = "flex";
        const p = volError.querySelector("p");
        if (p)
          p.textContent =
            data.message || "Something went wrong. Please try again.";
      }
      if (volSuccess) volSuccess.style.display = "none";
    }
  } catch (err) {
    console.error(err);
    if (volModal) volModal.style.display = "flex";
    if (volError) volError.style.display = "flex";
    if (volSuccess) volSuccess.style.display = "none";
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit Application";
  }
});

// ── OK BUTTONS ──
document.querySelectorAll("#volMessageModal .ok-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (volModal) volModal.style.display = "none";
    if (volSuccess) volSuccess.style.display = "none";
    if (volError) volError.style.display = "none";
  });
});
