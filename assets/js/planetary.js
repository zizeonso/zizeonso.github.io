(function () {
  "use strict";
  const root = document.documentElement;
  root.classList.add("js");
  const params = new URLSearchParams(location.search);
  const preview = params.get("preview") === "background";
  const key = preview ? "zijin-planetary-background-preview-v1" : "zijin-planetary-v1";
  const scenePreset = "orbital-exploration-v2";
  const defaultScene = root.dataset.scene || "earth-orbit";
  const orbitalScenes = [
    { id: "earth-orbit", name: "Terra", icon: "Orbit", image: "earth-orbit-v1.png", portrait: "earth-orbit-mobile-v1.png" },
    { id: "lunar-orbit", name: "Luna", icon: "Moon", image: "luna-orbit-aligned-v1.png", portrait: "luna-orbit-aligned-mobile-v1.png" },
    { id: "mars-orbit", name: "Mars", icon: "Orbit", image: "mars-orbit-aligned-v1.png", portrait: "mars-orbit-aligned-mobile-v1.png" }
  ];
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(key)) || {}; } catch { /* Storage is optional. */ }
  let theme = params.get("theme") || saved.theme || root.dataset.theme || "dark";
  let scene = params.get("scene") || (saved.scenePreset === scenePreset ? saved.scene : null) || defaultScene;
  theme = theme === "light" ? "light" : "dark";
  scene = ["earth-orbit", "mars", "lunar", "lunar-orbit", "mars-orbit", "deep-space"].includes(scene) ? scene : defaultScene;
  root.dataset.theme = theme;
  root.dataset.scene = scene;

  function nextScene() {
    const current = scene === "lunar" ? "lunar-orbit" : scene === "mars" ? "mars-orbit" : scene;
    const index = orbitalScenes.findIndex(function (item) { return item.id === current; });
    return orbitalScenes[(index + 1) % orbitalScenes.length];
  }

  function icon(name) {
    const nodes = (window.PlanetaryIcons || {})[name];
    if (!nodes) return null;
    const namespace = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(namespace, "svg");
    const attrs = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "1.6", "stroke-linecap": "round", "stroke-linejoin": "round", class: "icon", "aria-hidden": "true", focusable: "false" };
    Object.entries(attrs).forEach(function ([key, value]) { svg.setAttribute(key, value); });
    nodes.forEach(function ([tag, attributes]) {
      const child = document.createElementNS(namespace, tag);
      Object.entries(attributes).forEach(function ([key, value]) { child.setAttribute(key, value); });
      svg.appendChild(child);
    });
    return svg;
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-icon]").forEach(function (placeholder) {
      const svg = icon(placeholder.dataset.icon);
      if (svg) placeholder.replaceWith(svg);
    });
    const toggle = document.getElementById("themeToggle");
    const sceneToggle = document.getElementById("sceneToggle");
    const sceneName = document.getElementById("sceneName");
    const menu = document.getElementById("menuToggle");
    const navigation = document.getElementById("primaryNav");

    function sync() {
      root.dataset.theme = theme;
      root.dataset.scene = scene;
      if (toggle) {
        const graphic = icon(theme === "dark" ? "Sun" : "Moon");
        if (graphic) toggle.replaceChildren(graphic);
        const label = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";
        toggle.setAttribute("aria-label", label);
        toggle.title = label;
      }
      if (sceneToggle) {
        const current = orbitalScenes.find(function (item) { return item.id === scene; }) || { name: scene === "lunar" ? "Luna" : "Mars", icon: scene === "lunar" ? "Moon" : "Orbit" };
        const graphic = icon(current.icon);
        if (graphic) sceneToggle.replaceChildren(graphic);
        const next = nextScene();
        sceneToggle.setAttribute("aria-label", `${current.name} scene. Switch to ${next.name}`);
        sceneToggle.removeAttribute("title");
        sceneToggle.dataset.tooltip = `${current.name} / Switch to ${next.name}`;
        if (sceneName) sceneName.textContent = current.name;
      }
      try { localStorage.setItem(key, JSON.stringify({ theme, scene, scenePreset })); } catch { /* Keep the current page usable without storage. */ }
      const url = new URL(location.href);
      url.searchParams.set("theme", theme);
      url.searchParams.set("scene", scene);
      try { history.replaceState(null, "", url.href); } catch { /* Local files may restrict URL changes. */ }
      document.querySelectorAll("a[href]").forEach(function (link) {
        const value = link.getAttribute("href");
        if (value.startsWith("#")) return;
        const target = new URL(value, location.href);
        const filename = target.pathname.split("/").pop();
        if (target.origin !== location.origin || !["index.html", "research.html", "insights.html", "index-planetary-option-c.html", "research-planetary-option-c.html"].includes(filename)) return;
        target.searchParams.set("theme", theme);
        target.searchParams.set("scene", scene);
        if (preview) target.searchParams.set("preview", "background");
        link.href = target.href;
      });
    }

    function setMenu(open) {
      navigation.classList.toggle("is-open", open);
      menu.setAttribute("aria-expanded", String(open));
      menu.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
      menu.title = open ? "Close navigation" : "Open navigation";
      const graphic = icon(open ? "X" : "Menu");
      if (graphic) menu.replaceChildren(graphic);
    }

    if (toggle) toggle.addEventListener("click", function () { theme = theme === "dark" ? "light" : "dark"; sync(); });
    if (sceneToggle) setupSceneSwitch();
    menu.addEventListener("click", function () { setMenu(menu.getAttribute("aria-expanded") !== "true"); });
    navigation.addEventListener("click", function (event) { if (event.target.closest("a")) setMenu(false); });
    document.addEventListener("keydown", function (event) { if (event.key === "Escape" && menu.getAttribute("aria-expanded") === "true") { setMenu(false); menu.focus(); } });
    document.addEventListener("click", function (event) { if (!menu.contains(event.target) && !navigation.contains(event.target)) setMenu(false); });

    const sections = [...document.querySelectorAll("main > section[id]")];
    if (sections.length && "IntersectionObserver" in window) {
      const visible = new Map();
      const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) { visible.set(entry.target.id, entry.isIntersecting); });
        const active = sections.find(function (section) { return visible.get(section.id); });
        navigation.querySelectorAll('a[href^="#"]').forEach(function (link) {
          if (active && link.hash === `#${active.id}`) link.setAttribute("aria-current", "location");
          else link.removeAttribute("aria-current");
        });
      }, { rootMargin: "-15% 0px -45% 0px", threshold: 0 });
      sections.forEach(function (section) { observer.observe(section); });
    }
    sync();
    setupFigures();

    function setupSceneSwitch() {
      const images = new Map();
      let switching = false;

      function imageURL(value) {
        const entry = orbitalScenes.find(function (item) { return item.id === value; });
        const portrait = window.matchMedia?.("(max-aspect-ratio: 3/4)").matches;
        const filename = portrait && entry.portrait ? entry.portrait : entry.image;
        return new URL(`assets/img/space-preview/${filename}`, location.href).href;
      }

      function prepare(value) {
        const url = imageURL(value);
        if (images.has(url)) return images.get(url);
        const image = new Image();
        image.decoding = "async";
        const ready = new Promise(function (resolve, reject) {
          const timeout = setTimeout(function () { finish(new Error("Scene loading timed out")); }, 12000);
          function finish(error) {
            clearTimeout(timeout);
            image.onload = null;
            image.onerror = null;
            if (error) reject(error);
            else resolve({ image, url });
          }
          image.onload = function () {
            const decoded = image.decode ? image.decode() : Promise.resolve();
            decoded.then(function () { finish(); }, finish);
          };
          image.onerror = function () { finish(new Error("Scene image unavailable")); };
          image.src = url;
        });
        images.set(url, ready);
        ready.catch(function () { images.delete(url); });
        return ready;
      }

      sceneToggle.addEventListener("pointerenter", function () { prepare(nextScene().id).catch(function () {}); });
      sceneToggle.addEventListener("focus", function () { prepare(nextScene().id).catch(function () {}); });
      sceneToggle.addEventListener("click", async function () {
        if (switching) return;
        switching = true;
        sceneToggle.setAttribute("aria-busy", "true");
        sceneToggle.setAttribute("aria-disabled", "true");
        let outgoing;
        let animation;
        try {
          const target = nextScene().id;
          let ready;
          do { ready = await prepare(target); } while (ready.url !== imageURL(target));
          const panel = document.querySelector(".scene-panel");
          const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
          // Freeze the old frame above the decoded new scene; only opacity changes.
          if (panel && typeof panel.animate === "function" && !reducedMotion) {
            const style = getComputedStyle(panel);
            outgoing = document.createElement("div");
            outgoing.className = "scene-panel scene-panel--outgoing";
            outgoing.setAttribute("aria-hidden", "true");
            ["backgroundImage", "backgroundPosition", "backgroundSize", "backgroundColor", "backgroundRepeat"].forEach(function (property) {
              outgoing.style[property] = style[property];
            });
            outgoing.style.setProperty("--scene-wash", style.getPropertyValue("--scene-wash"));
            panel.after(outgoing);
          }
          scene = target;
          sync();
          if (outgoing) {
            animation = outgoing.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 1400, easing: "cubic-bezier(0.45, 0, 0.2, 1)", fill: "forwards" });
            await animation.finished.catch(function () {});
          }
        } catch {
          sceneToggle.setAttribute("aria-label", "Scene unavailable. Try switching scenes again");
          sceneToggle.dataset.tooltip = "Scene unavailable. Try again";
        } finally {
          outgoing?.remove();
          animation?.cancel();
          switching = false;
          sceneToggle.setAttribute("aria-busy", "false");
          sceneToggle.setAttribute("aria-disabled", "false");
        }
      });
    }
  });

  function setupFigures() {
    const figures = [...document.querySelectorAll(".research-showcase figure")];
    if (!figures.length || !("HTMLDialogElement" in window)) return;
    const viewer = document.createElement("dialog");
    viewer.className = "figure-viewer";
    viewer.setAttribute("aria-labelledby", "figureViewerCaption");
    const toolbar = document.createElement("div");
    toolbar.className = "viewer-toolbar";
    const count = document.createElement("span");
    count.className = "viewer-count";
    toolbar.appendChild(count);

    function button(name, label, action) {
      const control = document.createElement("button");
      control.type = "button";
      control.className = "icon-button";
      control.setAttribute("aria-label", label);
      control.title = label;
      const graphic = icon(name);
      if (graphic) control.appendChild(graphic);
      control.addEventListener("click", action);
      return control;
    }

    let current = 0;
    let opener = null;
    const previous = button("ChevronLeft", "Previous figure", function () { display(current - 1); });
    const next = button("ChevronRight", "Next figure", function () { display(current + 1); });
    const close = button("X", "Close enlarged figure", function () { viewer.close(); });
    close.autofocus = true;
    toolbar.appendChild(previous);
    toolbar.appendChild(next);
    toolbar.appendChild(close);
    const image = document.createElement("img");
    image.className = "viewer-image";
    image.decoding = "async";
    const caption = document.createElement("p");
    caption.className = "viewer-caption";
    caption.id = "figureViewerCaption";
    viewer.appendChild(toolbar);
    viewer.appendChild(image);
    viewer.appendChild(caption);
    document.body.appendChild(viewer);

    const entries = figures.map(function (figure, index) {
      const figureImage = figure.querySelector("img");
      let figureCaption = figure.querySelector("figcaption");
      const title = figureCaption?.textContent.trim() || figure.closest("article").querySelector("h2").textContent.trim();
      const link = figureImage.closest("a");
      const source = link?.getAttribute("href") || figureImage.getAttribute("src");
      const zoom = button("Maximize2", `Enlarge figure: ${title}`, function () { open(index, zoom); });
      zoom.className = "figure-zoom";
      if (!figureCaption) {
        figureCaption = document.createElement("figcaption");
        figureCaption.textContent = title;
        figure.appendChild(figureCaption);
      }
      const label = document.createElement("span");
      while (figureCaption.firstChild) label.appendChild(figureCaption.firstChild);
      figureCaption.appendChild(label);
      figureCaption.appendChild(zoom);
      (link || figureImage).addEventListener("click", function (event) { event.preventDefault(); open(index, zoom); });
      return { source, alt: figureImage.alt, title };
    });

    function display(index) {
      if (index < 0 || index >= entries.length) return;
      current = index;
      const entry = entries[index];
      image.src = entry.source;
      image.alt = entry.alt;
      caption.textContent = entry.title;
      count.textContent = `${index + 1} / ${entries.length}`;
      previous.disabled = index === 0;
      next.disabled = index === entries.length - 1;
    }

    function open(index, trigger) {
      opener = trigger;
      display(index);
      document.body.classList.add("is-viewing-figure");
      if (!viewer.open) viewer.showModal();
    }

    viewer.addEventListener("close", function () {
      document.body.classList.remove("is-viewing-figure");
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    });
    viewer.addEventListener("click", function (event) {
      if (event.target !== viewer) return;
      const bounds = viewer.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) viewer.close();
    });
    viewer.addEventListener("keydown", function (event) {
      if (event.key === "ArrowLeft") { event.preventDefault(); display(current - 1); }
      if (event.key === "ArrowRight") { event.preventDefault(); display(current + 1); }
    });
  }
})();
