/* ============================================================
   project.js
   Handles: Project progress bar animations, card UI updates
   Used on: /projects page
   Pug file: views/projects.pug
   ============================================================ */

   document.addEventListener("DOMContentLoaded", () => {

    /* ── Animate All Progress Bars on Page Load ─────────────── */
    const progressBars = document.querySelectorAll(".progress-bar");
  
    progressBars.forEach((bar) => {
      const targetWidth = bar.style.width;
      bar.style.width   = "0%";
      setTimeout(() => {
        bar.style.width = targetWidth;
      }, 300);
    });
  
    /* ── Update a Project Card's UI After Donation ───────────── */
    // Called externally after a successful donation API response
    // VARIABLES: all local to DOMContentLoaded callback — no collision risk
    function updateProjectCard(card, project) {
      const bar       = card.querySelector(".progress-bar");
      const goalEl    = card.querySelector(".goal-amount");
      const raisedEl  = card.querySelector(".raised-amount");
      const percentEl = card.querySelector(".progress-percentage");
      const btn       = card.querySelector(".donate-btn");
      const badge     = card.querySelector(".card-badge");
  
      /* ── Update Progress Bar ── */
      bar.style.width        = `${project.progressPercentage}%`;
      goalEl.textContent     = `🎯 KSh ${project.goalAmount.toLocaleString()}`;
      raisedEl.textContent   = `💰 KSh ${project.raisedAmount.toLocaleString()}`;
      percentEl.textContent  = `${project.progressPercentage}% Funded`;
  
      /* ── If Project Just Completed, Update Card Visuals ── */
      if (project.status === "completed") {
        card.classList.add("completed");
        bar.style.background   = "linear-gradient(to right, #42a5f5, #1565c0)";
        percentEl.style.color  = "#1565c0";
        badge.textContent      = "✓ Funded";
        badge.classList.remove("active");
        badge.classList.add("done");
        btn.textContent        = "✓ Goal Reached";
        btn.classList.add("completed-btn");
        btn.disabled           = true;
        btn.removeAttribute("href");
      }
    }
  
    // Expose to global scope in case main.js or other scripts need to call it
    window.updateProjectCard = updateProjectCard;
  
  });