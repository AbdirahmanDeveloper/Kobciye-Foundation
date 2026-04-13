const supportForm = document.getElementById("supportForm");

supportForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const response = await fetch("/api/support", {
      method: "POST",
      body: new FormData(supportForm),
    });

    if (response.ok) {
      document.getElementById("supportForm").style.display = "none";
      document.getElementById("supportSuccess").style.display = "flex";
    } else {
      document.getElementById("supportError").style.display = "flex";
    }
  } catch (err) {
    console.error(err);
    document.getElementById("supportError").style.display = "flex";
  }
});