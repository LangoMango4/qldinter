(function () {
  if (!window.SITE_CONFIG || !SITE_CONFIG.maintenance) return;

  document.documentElement.innerHTML = `
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Under Maintenance - Queensland Interactive</title>
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          background: linear-gradient(135deg, #0a0f1c 0%, #1a2a4a 100%);
          color: white;
          font-family: 'Poppins', sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          text-align: center;
          min-height: 100vh;
        }
        .container {
          max-width: 600px;
          padding: 2rem;
          animation: fadeIn 0.8s ease-out;
        }
        .content {
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 50px 40px;
          border-radius: 20px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        .icon {
          width: 80px;
          height: 80px;
          margin: 0 auto 30px;
          background: linear-gradient(135deg, #1e90ff 0%, #00d4ff 100%);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 40px;
          animation: float 3s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        h1 {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 12px;
          background: linear-gradient(135deg, #1e90ff 0%, #00d4ff 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .subtitle {
          font-size: 1rem;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 30px;
        }
        .divider {
          width: 50px;
          height: 3px;
          background: linear-gradient(90deg, #1e90ff 0%, #00d4ff 100%);
          margin: 25px auto;
          border-radius: 2px;
        }
        p {
          font-size: 1.05rem;
          color: rgba(255, 255, 255, 0.8);
          line-height: 1.6;
          margin-bottom: 30px;
        }
        .timer {
          margin-top: 30px;
          padding: 20px;
          background: rgba(30, 144, 255, 0.1);
          border: 2px solid rgba(30, 144, 255, 0.3);
          border-radius: 12px;
          font-size: 1.3rem;
          font-weight: 600;
          color: #1e90ff;
          letter-spacing: 1px;
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        .footer {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.5);
          margin-top: 25px;
        }
        @keyframes fadeIn {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media (max-width: 600px) {
          .content {
            padding: 40px 25px;
          }
          h1 {
            font-size: 2rem;
          }
          p {
            font-size: 0.95rem;
          }
          .timer {
            font-size: 1.1rem;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="content">
          <div class="icon">⚙️</div>
          <h1>Under Maintenance</h1>
          <div class="divider"></div>
          <p class="subtitle">We're working hard to bring you something better</p>
          <p>Queensland Interactive is currently undergoing scheduled maintenance. We'll be back online soon with improvements and new features!</p>
          <div class="timer" id="timer">Calculating time...</div>
          <p class="footer">Thank you for your patience</p>
        </div>
      </div>
    </body>
  `;

  const end = new Date(SITE_CONFIG.maintenanceEnds).getTime();
  const timer = document.getElementById("timer");

  const updateTimer = () => {
    const diff = end - Date.now();
    if (diff <= 0) {
      // Maintenance period is over
      timer.textContent = "✓ Maintenance completed. Redirecting...";
      // Store in localStorage to prevent re-showing maintenance on refresh
      localStorage.setItem('maintenanceCompleted', 'true');
      // Disable maintenance flag
      SITE_CONFIG.maintenance = false;
      // Reload after short delay
      setTimeout(() => {
        window.location.href = window.location.href;
      }, 1000);
      return;
    }
    const h = Math.floor(diff / 36e5);
    const m = Math.floor((diff % 36e5) / 6e4);
    const s = Math.floor((diff % 6e4) / 1000);
    timer.textContent = `⏱️ Back in ${h}h ${m}m ${s}s`;
  };

  // Update immediately
  updateTimer();
  // Then update every second
  setInterval(updateTimer, 1000);
})();
