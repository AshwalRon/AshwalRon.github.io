document.querySelector('.download-btn').addEventListener('click', function() {
  console.log('Download started');
});
document.addEventListener("DOMContentLoaded", function () {
  const downloadBtn = document.querySelector(".download-btn");

  // When user clicks the button
  downloadBtn.addEventListener("click", function () {
    fetch("https://script.google.com/macros/s/AKfycbwK0e3ntFgOBUHqlo6Ua6gzDKXB4BkjK75esb_WWQIMWBrgYaSqeC-LqvV58V68QLAl/exec")
      .then(response => response.json())
      .then(data => {
        console.log("Total clicks: " + data.count);

        // Optional: disable after 5 clicks globally
        if (data.count >= 5) {
          downloadBtn.disabled = true;
          downloadBtn.textContent = "Limit Reached";
        }

        // Optional: update a visible counter
        const counter = document.getElementById("counter");
        if (counter) {
          counter.textContent = `Downloads: ${data.count}`;
        }
      })
      .catch(error => {
        console.error("Error counting clicks:", error);
      });
  });
});

