/* =====================================================================
   SHAUGHV — Animated Brand Mark (vanilla JS drop-in)
   ---------------------------------------------------------------------
   Framework-agnostic port of the AnimatedBrandMark React component used
   on SHAUGHV production surfaces. Renders an SVG into a host element,
   then runs the canonical draw / undraw loop:

       wordmark (filled, held 10s)
       → undraws (deco first, then letters reversed)
       → 3s pause
       → icon-only (mustache + glasses) draws in
       → held 10s
       → undraws
       → 3s pause
       → wordmark draws back in
       → held 10s → loop

   No dependencies. Inherits color via CSS currentColor, so the host
   element controls fill/stroke through its own `color` property.

   Honors `prefers-reduced-motion: reduce` by skipping the loop and
   rendering the static wordmark (parity with the React component).
   ---------------------------------------------------------------------
   USAGE — auto mount

     <span class="brand-lockup-mark" data-shaughv-mark
           style="color: var(--fg); height: 56px; width: auto;"></span>
     <script src="path/to/animated-brand-mark.js"></script>

   USAGE — custom element (preferred for slot semantics)

     <shaughv-mark aria-label="SHAUGHV"></shaughv-mark>
     <script src="path/to/animated-brand-mark.js"></script>

   USAGE — manual mount

     ShaughvMark.mount(document.querySelector('#mark'), { reducedMotion: false });

   OPTIONS (data-* on host, or opts.* in mount)
     - data-static        / static:        true → no loop, just renders mark
     - data-icon-only     / iconOnly:      true → renders ICON variant only
     - data-aria-label    / ariaLabel:     accessible name (default "SHAUGHV")

   ===================================================================== */

(function (global) {
  "use strict";

  /* -------- shape data — DO NOT EDIT (matches official SVG) ---------- */

  var MUSTACHE_D =
    "M170.81,191.69C177.09,186.38 175.745,179.816 174.583,176.899C173.528,174.25 172.079,174.231 172.079,174.231C172.079,174.231 169.423,173.764 170.81,175.651C172.167,177.497 170.599,182.447 166.62,182.88C160.09,183.59 154.33,175.18 145.11,169.83C138.45,166.37 130.45,166.68 124.52,172.18C118.59,166.37 111.28,167.19 106.15,170.24C98.37,174.83 90.82,183.18 84.54,182.67C80.4,182.4 79.236,177.428 80.78,175.52C81.922,174.109 79.748,174.231 79.748,174.231C79.748,174.231 77.315,173.811 75.82,176.14C72.54,181.25 73.23,188.73 81.99,193.71C88.34,197.44 96.2,196.78 99.01,196.43C109.67,195.24 117.93,190.88 124.33,184.86C130.21,191.33 139.73,196.2 153.37,196.75C159.6,196.97 166.18,195.94 170.81,191.69Z";

  var GLASSES_D =
    "M175.2,127.7C167.73,125.96 160.48,125.29 152.73,125.29C143.29,125.29 136.88,127.46 131.05,128.89C127.7,129.74 123.83,130.01 120.18,128.89C113.87,126.81 107.45,125.48 98.05,125.29C89.95,125.09 83.05,126.17 74,128.21C73.38,128.36 73.31,128.6 73.31,129.27L73.31,134.6C73.31,136.16 73.8,136.69 74.66,136.99C76.21,137.64 77.03,138.89 77.75,143.95C79.07,152.04 80.17,156.76 84.35,159.38C88.73,162.16 93.62,162.57 97.97,162.37C108.76,161.83 115.95,155.54 120.15,142.3C121.15,138.78 122.33,137.79 124.53,137.72C126.96,137.79 127.92,139.25 129,143.2C132.72,155.94 139.21,162.25 150.23,162.34C157.15,162.34 163.67,160.77 166.89,156.8C169.75,153.34 170.85,148.16 171.79,141.39C172.28,138.33 173.32,137.04 174.54,136.76C175.62,136.47 175.72,135.77 175.72,134.44L175.72,129.14C175.72,128.35 175.65,127.83 175.2,127.7ZM115.98,142.64C113.38,152.79 108.15,158.6 97.33,158.6C88.65,158.6 85.39,155.23 83.94,150.69C82.21,145.21 81,134.66 85.72,131.81C88.96,130.04 93.46,129.59 98.14,129.59C104.25,129.59 110.82,130.51 113.97,132.72C117.26,135.01 116.88,139.19 115.98,142.64ZM166.2,150.37C164.26,155.92 159.86,158.45 151.12,158.45C141.65,158.45 136.76,153.45 133.54,143.89C131.88,138.06 132.67,132.65 139.95,130.6C143.64,129.57 147.78,129.38 151.5,129.45C156.19,129.57 161.05,130.04 163.76,131.33C168.92,133.79 168.56,142.95 166.2,150.37Z";

  /* WORDMARK = the 7 letters S H A U G H V plus the mustache + glasses
     overlaid onto the letterforms. The first 7 (W_LETTER_COUNT) draw
     with their own stagger; the last 2 (W_DECO_COUNT) draw with the
     slower icon-stagger so the decoration reads like a final flourish. */
  var WORDMARK = [
    { d: "M31.24,94.54C28.45,87.09 20.12,84.05 16.09,80.33C13.79,78.33 12.89,76.86 12.88,72.78L12.88,67.76C12.88,63.06 15.16,62.34 16.98,62.34C19.57,62.34 20.91,63.97 20.91,67.82L20.91,77.05L31.58,77.05L31.58,67.71C31.58,57.72 25.31,52.9 16.9,53L16.62,53C6.62,53 2.51,59.66 2.51,67.39L2.51,72.98C2.51,80.13 5.2,85.16 10.95,88.92C17.93,93.55 20.56,95.48 20.81,100.42L20.81,106.83C20.79,110.78 18.62,112.14 16.52,112.14C13.67,112.14 12.41,110.3 12.41,106.83L12.41,97.93L2.88,97.93L2.88,107.42C2.88,116.13 8.11,121.1 16.79,121.1L16.87,121.1C25.98,121.1 31.75,115.24 31.75,106.92L31.75,101.91C31.75,99.06 31.44,96.68 31.24,94.54Z", sw: 1.2 },
    { d: "M58.55,53.59L58.55,83.36L48.49,83.36L48.49,53.59L37.3,53.59L37.3,144.49L48.19,152.34L48.19,92.08L58.55,92.08L58.55,160.09L68.17,160.09L68.17,53.59L58.55,53.59Z", sw: 1.2 },
    { d: "M82.47,53.7L72.3,120.34L84.07,120.34L85.21,106.75L94.37,106.75L95.62,120.13L106.19,120.13L97.37,53.7L82.47,53.7ZM86.03,97.86L89.49,65.78L89.7,65.78L92.85,97.86L86.03,97.86Z", sw: 1.2 },
    { d: "M128.8,106.4C128.8,111.12 126.72,112.27 125.06,112.27L124.91,112.27C121.88,112.27 120.22,110.56 120.22,106.76L120.22,53.63L109.57,53.63L109.57,106.76C109.57,116.12 115.15,121.14 124.42,120.93L124.78,120.93C134.31,120.73 139.34,114.44 139.34,106.5L139.34,53.63L128.8,53.63L128.8,106.4Z", sw: 1.2 },
    { d: "M160,52.72L159.8,52.72C149.28,52.72 145.1,59.65 145.1,67.28L145.1,106.96C145.1,115.1 150.09,121.01 159.65,121.01L160.16,121.01C169.13,121.01 174.78,115.31 174.78,107.88L174.78,86.34L159.88,86.34L159.88,95.43L164.6,95.43L164.6,106.79C164.6,110.35 162.46,112.31 159.93,112.31L159.83,112.31C157.07,112.31 155.53,110.07 155.53,106.9L155.53,67.06C155.53,63.71 157.34,61.72 159.93,61.72L160.03,61.72C162.84,61.72 164.55,63.87 164.55,67.53L164.55,77.62L174.55,77.62L174.55,67.73C174.55,57.83 169.51,52.72 160,52.72Z", sw: 1.2 },
    { d: "M201,53.6L201,83.36L190.97,83.36L190.97,53.6L181.16,53.6L181.16,160.1L190.97,160.1L190.97,91.77L201,91.77L201,152.3L211.22,144.51L211.22,53.61L201,53.61L201,53.6Z", sw: 1.2 },
    { d: "M237.8,53.7L232.31,105.72L232.1,105.72L225.98,53.7L214.9,53.7L224.5,120.13L238.71,120.13L247.49,53.7L237.8,53.7Z", sw: 1.2 },
    { d: MUSTACHE_D, sw: 1.64, t: "matrix(0.733139,0,0,0.733139,32.840353,32.386425)" },
    { d: GLASSES_D,  sw: 1.2,  t: "matrix(1,0,0,1,0.485,-2.329931)" }
  ];

  /* ICON = mustache + glasses scaled up to fill the same viewBox area. */
  var ICON = [
    { d: MUSTACHE_D, sw: 0.87, t: "matrix(1.3806,0,0,1.3806,-48.63,-83.81)" },
    { d: GLASSES_D,  sw: 0.64, t: "matrix(1.8835,0,0,1.8835,-109.56,-154.03)" }
  ];

  /* -------- timing constants — match React component exactly --------- */
  var HOLD = 10000;       // how long each filled state holds
  var PAUSE = 3000;       // pause between the two morphs
  var W_LETTER_COUNT = 7;
  var W_DECO_COUNT   = 2;
  var W_STAGGER = 650;
  var W_STROKE  = 700;
  var W_FILL    = 400;
  var I_COUNT   = 2;
  var I_STAGGER = 1800;
  var I_STROKE  = 1600;
  var I_FILL    = 600;
  var UNDRAW_STROKE_DELAY = 200;
  var DRAW_FILL_DELAY     = 400;

  /* expo-out cubic-bezier (0.16, 1, 0.3, 1) — Framer "easing" port. */
  var EASE = bezier(0.16, 1.0, 0.3, 1.0);

  function bezier(p1x, p1y, p2x, p2y) {
    function bezX(t) { return 3*(1-t)*(1-t)*t*p1x + 3*(1-t)*t*t*p2x + t*t*t; }
    function bezY(t) { return 3*(1-t)*(1-t)*t*p1y + 3*(1-t)*t*t*p2y + t*t*t; }
    function dBezX(t) { return 3*(1-t)*(1-t)*p1x + 6*(1-t)*t*(p2x - p1x) + 3*t*t*(1 - p2x); }
    return function (x) {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      var t = x;
      for (var i = 0; i < 8; i++) {
        var xt = bezX(t) - x;
        var dxt = dBezX(t);
        if (Math.abs(xt) < 1e-5 || dxt === 0) break;
        t = Math.max(0, Math.min(1, t - xt / dxt));
      }
      return bezY(t);
    };
  }

  /* -------- helpers -------------------------------------------------- */
  var SVG_NS = "http://www.w3.org/2000/svg";

  function el(name, attrs) {
    var n = document.createElementNS(SVG_NS, name);
    if (attrs) for (var k in attrs) if (attrs[k] != null) n.setAttribute(k, attrs[k]);
    return n;
  }

  function buildPath(shape, initial) {
    // pathLength="1" lets us express dasharray/offset in normalized units.
    var p = el("path", {
      d: shape.d,
      "fill-rule": "nonzero",
      "stroke-linejoin": "round",
      fill: "currentColor",
      stroke: "currentColor",
      "stroke-width": shape.sw,
      "pathLength": "1",
      "stroke-dasharray": "1 1"
    });
    p.style.fillOpacity   = initial.fill;
    p.style.strokeOpacity = initial.stroke;
    p.style.strokeDashoffset = String(1 - initial.path); // 1 = invisible, 0 = drawn
    if (shape.t) {
      var g = el("g", { transform: shape.t });
      g.appendChild(p);
      return { node: g, path: p };
    }
    return { node: p, path: p };
  }

  /* Per-attribute tween manager: cancels prior tween on the same attr. */
  function makeRunner(state) {
    var active = new Map(); // pathEl → { fill, stroke, dash } cancel fns
    function tween(pathEl, attr, from, to, dur, delay) {
      var key = pathEl;
      var bucket = active.get(key) || {};
      if (bucket[attr]) bucket[attr]();
      var start = performance.now() + delay;
      var raf;
      var cancelled = false;
      var apply = function (v) {
        if (attr === "fill")   pathEl.style.fillOpacity   = v;
        if (attr === "stroke") pathEl.style.strokeOpacity = v;
        if (attr === "dash")   pathEl.style.strokeDashoffset = String(v);
      };
      return new Promise(function (resolve) {
        function step(now) {
          if (cancelled || state.cancelled) { resolve(); return; }
          if (now < start) { raf = requestAnimationFrame(step); return; }
          var t = dur === 0 ? 1 : Math.min(1, (now - start) / dur);
          apply(from + (to - from) * EASE(t));
          if (t < 1) { raf = requestAnimationFrame(step); }
          else { resolve(); }
        }
        bucket[attr] = function () { cancelled = true; cancelAnimationFrame(raf); resolve(); };
        active.set(key, bucket);
        raf = requestAnimationFrame(step);
      });
    }
    return { tween: tween };
  }

  function wait(state, ms) {
    return new Promise(function (resolve) {
      if (state.cancelled) { resolve(); return; }
      var id = setTimeout(function () {
        state.timers.delete(id);
        resolve();
      }, ms);
      state.timers.add(id);
    });
  }

  /* draw / undraw match React component semantics:
       draw   = pathLength 0→1 staggered, then fill in (stroke fades out)
       undraw = fill out (stroke fades in), then pathLength 1→0 staggered reversed
  */
  function draw(runner, state, paths, stagger, strokeDur, fillDur) {
    paths.forEach(function (p, i) {
      runner.tween(p, "stroke", 0, 1, 0, i * stagger);
      runner.tween(p, "fill",   1, 0, 0, i * stagger); // fillOpacity 0 implicitly when redrawing
      runner.tween(p, "dash",   1, 0, strokeDur, i * stagger);
    });
    var total = (paths.length - 1) * stagger + strokeDur;
    return wait(state, total).then(function () {
      if (state.cancelled) return;
      return wait(state, DRAW_FILL_DELAY);
    }).then(function () {
      if (state.cancelled) return;
      paths.forEach(function (p) {
        runner.tween(p, "fill",   0, 1, fillDur, 0);
        runner.tween(p, "stroke", 1, 0, fillDur, 0);
      });
      return wait(state, fillDur);
    });
  }

  function undraw(runner, state, paths, stagger, strokeDur, fillDur) {
    paths.forEach(function (p) {
      runner.tween(p, "fill",   1, 0, fillDur, 0);
      runner.tween(p, "stroke", 0, 1, fillDur, 0);
    });
    return wait(state, fillDur + UNDRAW_STROKE_DELAY).then(function () {
      if (state.cancelled) return;
      paths.forEach(function (p, i) {
        // reverse stagger so the last-drawn shape is first to retreat
        var delay = (paths.length - 1 - i) * stagger;
        runner.tween(p, "dash", 0, 1, strokeDur, delay);
      });
      var total = (paths.length - 1) * stagger + strokeDur;
      return wait(state, total);
    });
  }

  /* -------- public API ---------------------------------------------- */

  function mount(host, opts) {
    opts = opts || {};
    if (!host) return null;

    // Read data-* attrs (host wins over opts)
    var staticOnly = opts.static || host.hasAttribute("data-static");
    var iconOnly   = opts.iconOnly || host.hasAttribute("data-icon-only");
    var ariaLabel  = host.getAttribute("data-aria-label") || opts.ariaLabel || "SHAUGHV";
    var reduced =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Brand-system enforcement: the animated mark has a hard 64 x 64 floor.
    // Below that, the morph + stroke math reads as illegible noise. Warn loudly
    // (and auto-fall-back to the static wordmark) so off-spec usage is caught
    // at runtime, not just in the spec. See BRANDMARK.md "Sizing rules".
    if (!staticOnly && !iconOnly && typeof host.getBoundingClientRect === "function") {
      var rect = host.getBoundingClientRect();
      if (rect && (rect.width > 0 || rect.height > 0) && (rect.width < 64 || rect.height < 64)) {
        if (typeof console !== "undefined" && console.warn) {
          console.warn(
            "[ShaughvMark] Animated brand mark requires \u2265 64\u00d764 px " +
            "(got " + Math.round(rect.width) + "\u00d7" + Math.round(rect.height) + " px). " +
            "Falling back to static wordmark. See BRANDMARK.md \u2192 Sizing rules."
          );
        }
        staticOnly = true;
      }
    }

    // Build the SVG
    var svg = el("svg", {
      viewBox: "2.5 52.7 245 165",
      xmlns: SVG_NS,
      "fill-rule": "evenodd",
      "clip-rule": "evenodd",
      role: "img",
      "aria-label": ariaLabel
    });
    svg.style.display = "block";
    svg.style.width = host.style.width || "auto";
    svg.style.height = host.style.height || "100%";
    svg.style.color = "inherit";

    // Letters
    var letterPaths = [];
    var letterGroup = el("g", { "data-layer": "wordmark-letters" });
    WORDMARK.slice(0, W_LETTER_COUNT).forEach(function (shape) {
      var b = buildPath(shape, { fill: 1, stroke: 0, path: 1 });
      letterGroup.appendChild(b.node);
      letterPaths.push(b.path);
    });

    // Wordmark deco (mustache + glasses overlay)
    var decoPaths = [];
    var decoGroup = el("g", { "data-layer": "wordmark-deco" });
    WORDMARK.slice(W_LETTER_COUNT).forEach(function (shape) {
      var b = buildPath(shape, { fill: 1, stroke: 0, path: 1 });
      decoGroup.appendChild(b.node);
      decoPaths.push(b.path);
    });

    // Icon-only variant (mustache + glasses, scaled up)
    var iconPaths = [];
    var iconGroup = el("g", { "data-layer": "icon" });
    ICON.forEach(function (shape) {
      var b = buildPath(shape, { fill: 0, stroke: 0, path: 0 });
      iconGroup.appendChild(b.node);
      iconPaths.push(b.path);
    });

    if (iconOnly) {
      // Render icon variant filled, hide the wordmark
      iconPaths.forEach(function (p) {
        p.style.fillOpacity = 1;
        p.style.strokeOpacity = 0;
        p.style.strokeDashoffset = "0";
      });
      letterPaths.concat(decoPaths).forEach(function (p) {
        p.style.fillOpacity = 0;
        p.style.strokeOpacity = 0;
      });
    }

    svg.appendChild(letterGroup);
    svg.appendChild(decoGroup);
    svg.appendChild(iconGroup);

    host.innerHTML = "";
    host.appendChild(svg);

    if (staticOnly || iconOnly || reduced) {
      // Nothing to animate. Static fallback (matches React's reduced-motion path).
      return { destroy: function () { host.innerHTML = ""; } };
    }

    // Run the loop
    var state = { cancelled: false, timers: new Set() };
    var runner = makeRunner(state);

    function loop() {
      return wait(state, HOLD).then(function tick() {
        if (state.cancelled) return;
        return undraw(runner, state, decoPaths,   I_STAGGER, I_STROKE, I_FILL)
          .then(function(){ if(!state.cancelled) return undraw(runner, state, letterPaths, W_STAGGER, W_STROKE, W_FILL); })
          .then(function(){ if(!state.cancelled) return wait(state, PAUSE); })
          .then(function(){ if(!state.cancelled) return draw  (runner, state, iconPaths,   I_STAGGER, I_STROKE, I_FILL); })
          .then(function(){ if(!state.cancelled) return wait(state, HOLD); })
          .then(function(){ if(!state.cancelled) return undraw(runner, state, iconPaths,   I_STAGGER, I_STROKE, I_FILL); })
          .then(function(){ if(!state.cancelled) return wait(state, PAUSE); })
          .then(function(){ if(!state.cancelled) return draw  (runner, state, letterPaths, W_STAGGER, W_STROKE, W_FILL); })
          .then(function(){ if(!state.cancelled) return draw  (runner, state, decoPaths,   I_STAGGER, I_STROKE, I_FILL); })
          .then(function(){ if(!state.cancelled) return wait(state, HOLD); })
          .then(function(){ if(!state.cancelled) return tick(); });
      });
    }
    loop();

    return {
      destroy: function () {
        state.cancelled = true;
        state.timers.forEach(function (id) { clearTimeout(id); });
        state.timers.clear();
        host.innerHTML = "";
      }
    };
  }

  function autoMount(root) {
    var scope = root || document;
    scope.querySelectorAll("[data-shaughv-mark]:not([data-shaughv-mounted])").forEach(function (host) {
      host.setAttribute("data-shaughv-mounted", "");
      mount(host);
    });
  }

  /* Custom element: <shaughv-mark icon-only static aria-label="...">
     Custom Element constructors MUST be ES6 classes — the V1 spec forbids
     calling HTMLElement as a function. We use `new Function` only to defer
     parsing the `class` keyword on engines that somehow don't support it;
     every browser that ships customElements ships ES6 classes, so the
     direct path runs everywhere in practice. */
  if (typeof customElements !== "undefined" && !customElements.get("shaughv-mark")) {
    try {
      class ShaughvMarkEl extends HTMLElement {
        connectedCallback() {
          if (!this.style.display) this.style.display = "inline-block";
          if (!this.style.color) this.style.color = "currentColor";
          mount(this, {
            static:    this.hasAttribute("static"),
            iconOnly:  this.hasAttribute("icon-only"),
            ariaLabel: this.getAttribute("aria-label") || "SHAUGHV"
          });
        }
      }
      customElements.define("shaughv-mark", ShaughvMarkEl);
    } catch (e) {
      // Fallback: auto-mount on element if customElements registration failed.
      document.querySelectorAll("shaughv-mark:not([data-shaughv-mounted])").forEach(function (host) {
        host.setAttribute("data-shaughv-mounted", "");
        if (!host.style.display) host.style.display = "inline-block";
        if (!host.style.color) host.style.color = "currentColor";
        mount(host, {
          static:    host.hasAttribute("static"),
          iconOnly:  host.hasAttribute("icon-only"),
          ariaLabel: host.getAttribute("aria-label") || "SHAUGHV"
        });
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { autoMount(); });
  } else {
    autoMount();
  }

  global.ShaughvMark = { mount: mount, autoMount: autoMount };
})(typeof window !== "undefined" ? window : this);
