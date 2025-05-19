document.querySelector('.download-btn').addEventListener('click', function() {
  console.log('Download started');
});
document.addEventListener("DOMContentLoaded", function () {
  const downloadBtn = document.querySelector(".download-btn");

  let clickCount = parseInt(localStorage.getItem("downloadClicks")) || 0;

  if (clickCount >= 5) {
    downloadBtn.disabled = true;
    downloadBtn.textContent = "Limit Reached";
  }

  downloadBtn.addEventListener("click", function () {
    clickCount++;
    localStorage.setItem("downloadClicks", clickCount);

    if (clickCount >= 5) {
      downloadBtn.disabled = true;
      downloadBtn.textContent = "Limit Reached";
    }
  });
});
