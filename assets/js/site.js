(function () {
  const root = document.documentElement;
  let backgroundWidthRatio = Math.min(1500 / window.innerWidth, 1);

  // Viewport units keep the scene stable during zoom without resizing the text.
  try {
    const savedRatio = Number(sessionStorage.getItem("backgroundWidthRatio"));
    if (savedRatio > 0 && savedRatio <= 1) {
      backgroundWidthRatio = savedRatio;
    } else {
      sessionStorage.setItem("backgroundWidthRatio", String(backgroundWidthRatio));
    }
  } catch {
    // Storage may be disabled; keep the current page's initial scale instead.
  }

  root.style.setProperty("--background-width", `${backgroundWidthRatio * 100}vw`);

  const toggle = document.getElementById("themeToggle");
  const icon = toggle.querySelector("span");
  const savedTheme = localStorage.getItem("theme");

  function setTheme(theme) {
    root.dataset.theme = theme;
    localStorage.setItem("theme", theme);
    icon.textContent = theme === "dark" ? "🌙" : "☀️";
  }

  setTheme(savedTheme || "light");

  toggle.addEventListener("click", function () {
    setTheme(root.dataset.theme === "dark" ? "light" : "dark");
  });
})();
