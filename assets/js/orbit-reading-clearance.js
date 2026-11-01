(function () {
  "use strict";
  const selector = ".intro > p, .topic-list, .section-heading, .news-list > li, .research-entry h3, .research-entry p, .publication-body, .timeline article, .capabilities > div, .research-abstract, .detail-header, .insight-entry";

  function collect(document, height) {
    const result = [];
    function add(rect, padding, solid = false) {
      if (rect.width <= 0 || rect.height <= 0 || rect.bottom < 0 || rect.top > height) return;
      result.push({ left: rect.left - padding, right: rect.right + padding, top: rect.top - padding, bottom: rect.bottom + padding, solid });
    }
    document.querySelectorAll(".profile, .research-image, .research-entry figure, .research-showcase figure, .showcase-card video, .paired-figures").forEach(function (element) {
      add(element.getBoundingClientRect(), 8, true);
    });
    const elements = document.querySelectorAll(selector);
    if (!document.createRange || !document.createTreeWalker) {
      elements.forEach(function (element) { add(element.getBoundingClientRect(), 3); });
      return result;
    }
    const range = document.createRange();
    const seen = new Set();
    elements.forEach(function (element) {
      const bounds = element.getBoundingClientRect();
      if (bounds.bottom < 0 || bounds.top > height) return;
      const walker = document.createTreeWalker(element, 4);
      let node;
      while ((node = walker.nextNode())) {
        if (seen.has(node) || !node.textContent.trim()) continue;
        seen.add(node);
        range.selectNodeContents(node);
        for (const rect of range.getClientRects()) add(rect, 3);
      }
    });
    range.detach?.();
    return result;
  }

  function visibility(x, y, pixels, rects) {
    let opacity = 1;
    for (const rect of rects) {
      if (x + pixels / 2 <= rect.left || x - pixels / 2 >= rect.right || y + pixels / 3 <= rect.top || y - pixels / 3 >= rect.bottom) continue;
      if (rect.solid) return 0;
      opacity = 0.3;
    }
    return opacity;
  }

  window.OrbitReadingClearance = Object.freeze({ collect, visibility });
}());
