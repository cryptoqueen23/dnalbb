/* ============================================================
   DLBB — shared site behavior (vanilla JS, no dependencies)
   - mobile nav toggle
   - scroll reveal animations
   - blockchain particle background for hero sections
   ============================================================ */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- Mobile menu ---------------- */
  function initMobileMenu() {
    var toggle = document.getElementById("menu-toggle");
    var nav = document.getElementById("primary-nav");
    if (!toggle || !nav) return;

    function closeMenu() {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open menu");
    }
    function openMenu() {
      nav.classList.add("open");
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Close menu");
    }

    toggle.addEventListener("click", function () {
      var isOpen = nav.classList.contains("open");
      if (isOpen) { closeMenu(); } else { openMenu(); }
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("open")) {
        closeMenu();
        toggle.focus();
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 980) closeMenu();
    });
  }

  /* ---------------- Scroll reveal ---------------- */
  function initScrollReveal() {
    var selectors = [
      ".section-head", ".card", ".two-col", ".banner-block",
      ".stat", ".form-block", ".quote-block"
    ];
    var targets = document.querySelectorAll(selectors.join(","));
    if (!targets.length) return;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      // No animation — just make sure everything is visible.
      return;
    }

    targets.forEach(function (el, i) {
      el.classList.add("reveal");
      el.style.transitionDelay = (Math.min(i % 3, 2) * 90) + "ms";
    });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });

    targets.forEach(function (el) { observer.observe(el); });
  }

  /* ---------------- Blockchain particle background ---------------- */
  function initHeroParticles() {
    if (reduceMotion) return;

    var heroes = document.querySelectorAll(".hero, .page-hero");
    heroes.forEach(function (hero) {
      var canvas = document.createElement("canvas");
      canvas.className = "hero-canvas";
      canvas.setAttribute("aria-hidden", "true");
      hero.insertBefore(canvas, hero.firstChild);

      var ctx = canvas.getContext("2d");
      var width, height, nodes;
      var NODE_COUNT_BASE = 42; // per 1000x600 area, scaled by size
      var LINK_DIST = 130;
      var SPEED = 0.12; // slow drift

      function resize() {
        var rect = hero.getBoundingClientRect();
        width = canvas.width = Math.floor(rect.width);
        height = canvas.height = Math.floor(rect.height);
        var area = (width * height) / (1000 * 600);
        var count = Math.max(14, Math.min(70, Math.round(NODE_COUNT_BASE * area)));
        nodes = [];
        for (var i = 0; i < count; i++) {
          nodes.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * SPEED,
            vy: (Math.random() - 0.5) * SPEED,
            r: Math.random() * 1.6 + 1
          });
        }
      }

      function step() {
        ctx.clearRect(0, 0, width, height);

        // update
        nodes.forEach(function (n) {
          n.x += n.vx;
          n.y += n.vy;
          if (n.x < 0 || n.x > width) n.vx *= -1;
          if (n.y < 0 || n.y > height) n.vy *= -1;
        });

        // links (blockchain-style connections between nearby nodes)
        for (var i = 0; i < nodes.length; i++) {
          for (var j = i + 1; j < nodes.length; j++) {
            var a = nodes[i], b = nodes[j];
            var dx = a.x - b.x, dy = a.y - b.y;
            var dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < LINK_DIST) {
              var alpha = (1 - dist / LINK_DIST) * 0.35;
              ctx.strokeStyle = "rgba(111,161,255," + alpha + ")";
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.stroke();
            }
          }
        }

        // nodes — alternating gold / blue like the brand palette
        nodes.forEach(function (n, idx) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
          ctx.fillStyle = idx % 5 === 0 ? "rgba(232,193,122,.85)" : "rgba(111,161,255,.75)";
          ctx.fill();
        });

        raf = requestAnimationFrame(step);
      }

      var raf;
      resize();
      raf = requestAnimationFrame(step);

      var resizeTimer;
      window.addEventListener("resize", function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(resize, 200);
      });

      // Pause the animation when the hero scrolls off-screen to save cycles.
      if ("IntersectionObserver" in window) {
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              if (!raf) raf = requestAnimationFrame(step);
            } else {
              cancelAnimationFrame(raf);
              raf = null;
            }
          });
        }, { threshold: 0 });
        io.observe(hero);
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initMobileMenu();
    initScrollReveal();
    initHeroParticles();
  });
})();
