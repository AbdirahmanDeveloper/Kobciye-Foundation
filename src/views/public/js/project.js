/* ============================================================
   project.js
   Handles: Progress bar animations, live data fetch, card UI
============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  /* ── Animate All Progress Bars on Page Load ── */
  const progressBars = document.querySelectorAll(".progress-bar");
  progressBars.forEach((bar) => {
    const targetWidth = bar.style.width;
    bar.style.width = "0%";
    setTimeout(() => {
      bar.style.width = targetWidth;
    }, 300);
  });

  /* ── Update a Project Card's UI ── */
  function updateProjectCard(card, project) {
    const bar = card.querySelector(".progress-bar");
    const goalEl = card.querySelector(".goal-amount");
    const raisedEl = card.querySelector(".raised-amount");
    const percentEl = card.querySelector(".progress-percentage");
    const btn = card.querySelector(".donate-btn");
    const badge = card.querySelector(".card-badge");

    if (!bar) return;

    bar.style.width = `${project.progressPercentage}%`;
    goalEl.textContent = `🎯 KSh ${project.goalAmount.toLocaleString()}`;
    raisedEl.textContent = `💰 KSh ${project.raisedAmount.toLocaleString()}`;
    percentEl.textContent = `${project.progressPercentage}% Funded`;

    if (project.status === "completed") {
      card.classList.add("completed");
      bar.style.background = "linear-gradient(to right, #42a5f5, #1565c0)";
      percentEl.style.color = "#1565c0";
      if (badge) {
        badge.textContent = "✓ Funded";
        badge.classList.remove("active");
        badge.classList.add("done");
      }
      if (btn) {
        btn.textContent = "✓ Goal Reached";
        btn.classList.add("completed-btn");
        btn.disabled = true;
        btn.removeAttribute("href");
      }
    }
  }

  /* ── Fetch Live Project Data & Update Cards ── */
  const projectCards = document.querySelectorAll(".project-card");

  projectCards.forEach(async (card) => {
    const donateBtn = card.querySelector("[data-project-id]");
    if (!donateBtn) return;

    const projectId = donateBtn.dataset.projectId;
    if (!projectId) return;

    try {
      const res = await fetch(`/api/projects/${projectId}`);
      const data = await res.json();
      if (data.status === "success") {
        updateProjectCard(card, data.data);
      }
    } catch (err) {
      console.error("Failed to fetch project:", err);
    }
  });

  // Expose globally
  window.updateProjectCard = updateProjectCard;
});

/* ── Read More Toggle ── */
document.querySelectorAll('.read-more-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const wrapper = btn.previousElementSibling;
    const isExpanded = wrapper.classList.toggle('expanded');
    btn.classList.toggle('expanded');
    btn.querySelector('span').textContent = isExpanded ? 'Read Less' : 'Read More';
  });
});