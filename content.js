const overlay = document.createElement('div');
overlay.style.cssText = `
  position: absolute; /* Relative to the video player container */
  top: 25%;
  left: 50%;
  /*   transform: translate(-50%, -50%); */
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 10px 20px;
  border-radius: 4px;
  font-family: "YouTube Sans", Roboto, Arial, sans-serif;
  font-size: 20px;
  font-weight: 500;
  z-index: 9999;
  display: none;
  pointer-events: none;
  transition: opacity 0.25s ease;
`;
document.body.appendChild(overlay);

let fadeTimeout;

const showSpeed = (speed) => {
    // Find the actual YouTube player container
    const playerContainer = document.querySelector("#movie_player") || document.querySelector(".html5-video-player");
    const video = document.querySelector("video");

    // Ensure our overlay is inside the player so it moves with the video
    if (overlay.parentNode !== playerContainer) {
        playerContainer.appendChild(overlay);
    }

    overlay.innerText = `${speed}x`;
    overlay.style.display = "block";
    overlay.style.opacity = "1";

    clearTimeout(fadeTimeout);
    fadeTimeout = setTimeout(() => {
        overlay.style.opacity = "0";
        overlay.style.transition = "opacity 0.5s";
    }, 1000);
}

const adjustSpeed = (adjustment) => {
    const video = document.querySelector("video");
    if (video) {
        // if ( (video.playbackRate === 0.25 && adjustment > 0) ||
        //      (0.5 <= video.playbackRate && video.playbackRate <= 1.75) || 
        //      (video.playbackRate === 2.0 && adjustment < 0) ) {
        //         return;
        // };

        video.playbackRate += adjustment;
        console.log(`Speed set to: ${video.playbackRate}x`);
        showSpeed(video.playbackRate);
        chrome.storage.local.set({ lastSpeed: video.playbackRate });
    }
};

document.addEventListener("keydown", (event) => {
    //Skip if the user is currently typing in an input field or comment box
    if (event.target.tagName === "INPUT" ||
        event.target.tagname === "TEXTAREA" ||
        event.target.isContentEditable) {
            return;
    }

    // const video = document.querySelector("video");
    // if (video) {
    //     if ( (video.playbackRate === 0.25 && adjustment > 0) ||
    //          (0.5 <= video.playbackRate && video.playbackRate <= 1.75) ) { // || 
    //         //  (video.playbackRate === 2.0 && adjustment < 0) ) {
    //             return;
    //     };
    // }

    if (event.key === "<" || event.key === ">") {
        event.stopImmediatePropagation();
        event.preventDefault();
    }

    if (event.key === "<") {
        adjustSpeed(-0.25);
    } else if (event.key === ">") {
        adjustSpeed(+0.25);
    }
}, true);

// Apply saved speed on startup and when video changes
const applySavedSpeed = () => {
    chrome.storage.local.get(["lastSpeed"], (result) => {
        const video = document.querySelector("video");
        if (video && result.lastSpeed) {
            video.playbackRate = result.lastSpeed;
        }
    });
};

// YouTube uses AJAX to load videos, so we check for the video element periodically
setInterval(applySavedSpeed, 1000);



// Function to redirect Shorts to standard Watch player
const convertShortsToWatch = () => {
    const currentUrl = window.location.href;

    if (currentUrl.includes("/shorts/")) {
        const newUrl = currentUrl.replace("/shorts/", "/watch?v=");
        window.location.replace(newUrl);
        // By using replace() instead of setting .href directly, you prevent the browser from saving the "Shorts" URL in your back-button history. This means if you click "Back," you won't get stuck in a loop of redirecting.
    }
};

// Run immmediately on page load
convertShortsToWatch();

// Watch for URL changes (YouTube doesn't always reload the page when you click a new video)
let lastUrl = location.href;
new MutationObserver(() => {
    if (location.href !== lastUrl) {
        lastUrl = location.href;
        convertShortsToWatch();
    }
}).observe(document, { subtree: true, childList: true });