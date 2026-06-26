(function () {
  const root = document.documentElement;
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
