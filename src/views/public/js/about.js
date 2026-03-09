const scrollLeft = document.querySelector(".left");
const scrollRight = document.querySelector(".right");
const teamContainer = document.querySelector(".team-container")

const scrollAmount = 420;
scrollLeft.addEventListener("click", () =>{
    teamContainer.scrollBy({
        left:-scrollAmount,
        behavior:"smooth"
    });
});

scrollRight.addEventListener("click", () => {
    teamContainer.scrollBy({
        left: scrollAmount,   
        behavior: "smooth"
    });
});
