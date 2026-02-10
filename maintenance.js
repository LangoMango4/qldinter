(function () {
  if (!window.SITE_CONFIG || !SITE_CONFIG.maintenance) return;

  document.documentElement.innerHTML = `
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Under Repairs</title>
      <style>
        body {
          margin: 0;
          background: #0a0f1c;
          color: white;
          font-family: system-ui, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          text-align: center;
        }
        .box {
          max-width: 480px;
          padding: 2rem;
        }
        img {
          width: 96px;
          margin-bottom: 1.5rem;
        }
        h1 {
          font-size: 2.2rem;
          margin-bottom: 1rem;
        }
        .timer {
          margin-top: 1.2rem;
          opacity: 0.85;
        }
      </style>
    </head>
    <body>
      <div class="box">
        <img src="images_/ErrorIcon.png" alt="">
        <h1>Website Under Repairs</h1>
        <p>We are currently performing maintenance. Please check back later.</p>
        <div class="timer" id="timer"></div>
      </div>
    </body>

    
  `;

  const end = new Date(SITE_CONFIG.maintenanceEnds).getTime();
  const timer = document.getElementById("timer");

  setInterval(() => {
    const diff = end - Date.now();
    if (diff <= 0) {
      timer.textContent = "Maintenance completed. Please wait while an administrator restarts the server.";
      return;
    }
    const h = Math.floor(diff / 36e5);
    const m = Math.floor((diff % 36e5) / 6e4);
    const s = Math.floor((diff % 6e4) / 1000);
    timer.textContent = `Estimated Fix ${h}h ${m}m ${s}s`;
  }, 1000);
})();
