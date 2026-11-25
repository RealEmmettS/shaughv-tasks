/* =====================================================================
   SHAUGHV — Canonical Loader (vanilla JS drop-in)
   ---------------------------------------------------------------------
   The official loading indicator for any project built on the SHAUGHV
   design system. This is loader #47 from the SHAUGHV loaders library
   ("Portrait ↔ blob morph") packaged as a zero-dependency drop-in.

   The brandmark portrait (mustache + glasses) fills its lenses, drains,
   then dissolves through a soft goo filter into a wandering organic
   blob that drifts for ~4 s before morphing back into an empty
   portrait. ~12 s loop.

   USAGE
     <shaughv-loader style="color: var(--accent); height: 120px;"></shaughv-loader>
     <script src="path/to/shaughv-loader.js"></script>

   AUTO-MOUNT
     <span data-shaughv-loader style="color: var(--accent); height: 120px;"></span>

   PROGRAMMATIC
     ShaughvLoader.mount(document.querySelector('#loader'));

   THE ONLY THING YOU CAN CHANGE IS COLOR.
   The loader inherits its fill from CSS `currentColor`. Set the host
   element's `color` to whatever you want — default is SHAUGHV sage.
   Do NOT alter timing, paths, the goo filter, geometry, or animation.

   This component loads anime.js (v3.2.2) from the jsDelivr CDN on first
   mount if it isn't already on the page.
   ===================================================================== */

(function (global) {
  "use strict";

  var ANIME_URL = "https://cdn.jsdelivr.net/npm/animejs@3.2.2/lib/anime.min.js";
  var _animePromise = null;
  function loadAnime() {
    if (global.anime) return Promise.resolve(global.anime);
    if (_animePromise) return _animePromise;
    _animePromise = new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = ANIME_URL;
      s.async = true;
      s.onload = function () { resolve(global.anime); };
      s.onerror = function () { _animePromise = null; reject(new Error("Failed to load anime.js")); };
      document.head.appendChild(s);
    });
    return _animePromise;
  }

  /* SVG markup for the loader. IDs are suffixed per-instance so multiple
     loaders on the same page don't collide on the goo filter or clip paths. */
  function svgMarkup(uid) {
    return ''
    + '<svg viewBox="70 120 110 60" aria-label="Loading" role="img">'
    +   '<defs>'
    +     '<clipPath id="l47-lens-l-' + uid + '" clipPathUnits="userSpaceOnUse">'
    +       '<path transform="translate(0.485 -2.329931)" '
    +         'd="M115.98,142.64C113.38,152.79 108.15,158.6 97.33,158.6 C88.65,158.6 85.39,155.23 83.94,150.69 C82.21,145.21 81,134.66 85.72,131.81 C88.96,130.04 93.46,129.59 98.14,129.59 C104.25,129.59 110.82,130.51 113.97,132.72 C117.26,135.01 116.88,139.19 115.98,142.64Z" />'
    +     '</clipPath>'
    +     '<clipPath id="l47-lens-r-' + uid + '" clipPathUnits="userSpaceOnUse">'
    +       '<path transform="translate(0.485 -2.329931)" '
    +         'd="M166.2,150.37C164.26,155.92 159.86,158.45 151.12,158.45 C141.65,158.45 136.76,153.45 133.54,143.89 C131.88,138.06 132.67,132.65 139.95,130.6 C143.64,129.57 147.78,129.38 151.5,129.45 C156.19,129.57 161.05,130.04 163.76,131.33 C168.92,133.79 168.56,142.95 166.2,150.37Z" />'
    +     '</clipPath>'
    +     '<filter id="l47-goo-' + uid + '">'
    +       '<feGaussianBlur in="SourceGraphic" stdDeviation="3.6" />'
    +       '<feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 16 -6" />'
    +     '</filter>'
    +   '</defs>'
    +   '<g class="stage-wrap" filter="url(#l47-goo-' + uid + ')">'
    +     '<g class="portrait">'
    +       '<g clip-path="url(#l47-lens-l-' + uid + ')">'
    +         '<g class="water l">'
    +           '<rect x="80" y="155" width="40" height="40" fill="currentColor" />'
    +           '<ellipse class="wave-a" cx="88"  cy="155" rx="12" ry="5" fill="currentColor" />'
    +           '<ellipse class="wave-b" cx="108" cy="155" rx="12" ry="5" fill="currentColor" />'
    +         '</g>'
    +       '</g>'
    +       '<g clip-path="url(#l47-lens-r-' + uid + ')">'
    +         '<g class="water r">'
    +           '<rect x="131" y="155" width="40" height="40" fill="currentColor" />'
    +           '<ellipse class="wave-a" cx="139" cy="155" rx="12" ry="5" fill="currentColor" />'
    +           '<ellipse class="wave-b" cx="159" cy="155" rx="12" ry="5" fill="currentColor" />'
    +         '</g>'
    +       '</g>'
    +       '<g class="stache" transform="matrix(0.733139 0 0 0.733139 32.840353 32.386425)">'
    +         '<path d="M170.81,191.69C177.09,186.38 175.745,179.816 174.583,176.899C173.528,174.25 172.079,174.231 172.079,174.231C172.079,174.231 169.423,173.764 170.81,175.651C172.167,177.497 170.599,182.447 166.62,182.88C160.09,183.59 154.33,175.18 145.11,169.83C138.45,166.37 130.45,166.68 124.52,172.18C118.59,166.37 111.28,167.19 106.15,170.24C98.37,174.83 90.82,183.18 84.54,182.67C80.4,182.4 79.236,177.428 80.78,175.52C81.922,174.109 79.748,174.231 79.748,174.231C79.748,174.231 77.315,173.811 75.82,176.14C72.54,181.25 73.23,188.73 81.99,193.71C88.34,197.44 96.2,196.78 99.01,196.43C109.67,195.24 117.93,190.88 124.33,184.86C130.21,191.33 139.73,196.2 153.37,196.75C159.6,196.97 166.18,195.94 170.81,191.69Z" />'
    +       '</g>'
    +       '<g transform="translate(0.485 -2.329931)">'
    +         '<path class="glass" fill-rule="evenodd" d="M175.2,127.7C167.73,125.96 160.48,125.29 152.73,125.29C143.29,125.29 136.88,127.46 131.05,128.89C127.7,129.74 123.83,130.01 120.18,128.89C113.87,126.81 107.45,125.48 98.05,125.29C89.95,125.09 83.05,126.17 74,128.21C73.38,128.36 73.31,128.6 73.31,129.27L73.31,134.6C73.31,136.16 73.8,136.69 74.66,136.99C76.21,137.64 77.03,138.89 77.75,143.95C79.07,152.04 80.17,156.76 84.35,159.38C88.73,162.16 93.62,162.57 97.97,162.37C108.76,161.83 115.95,155.54 120.15,142.3C121.15,138.78 122.33,137.79 124.53,137.72C126.96,137.79 127.92,139.25 129,143.2C132.72,155.94 139.21,162.25 150.23,162.34C157.15,162.34 163.67,160.77 166.89,156.8C169.75,153.34 170.85,148.16 171.79,141.39C172.28,138.33 173.32,137.04 174.54,136.76C175.62,136.47 175.72,135.77 175.72,134.44L175.72,129.14C175.72,128.35 175.65,127.83 175.2,127.7ZM115.98,142.64C113.38,152.79 108.15,158.6 97.33,158.6C88.65,158.6 85.39,155.23 83.94,150.69C82.21,145.21 81,134.66 85.72,131.81C88.96,130.04 93.46,129.59 98.14,129.59C104.25,129.59 110.82,130.51 113.97,132.72C117.26,135.01 116.88,139.19 115.98,142.64ZM166.2,150.37C164.26,155.92 159.86,158.45 151.12,158.45C141.65,158.45 136.76,153.45 133.54,143.89C131.88,138.06 132.67,132.65 139.95,130.6C143.64,129.57 147.78,129.38 151.5,129.45C156.19,129.57 161.05,130.04 163.76,131.33C168.92,133.79 168.56,142.95 166.2,150.37Z" />'
    +       '</g>'
    +     '</g>'
    +     '<path class="blob" d="" />'
    +   '</g>'
    + '</svg>';
  }

  /* Scoped CSS — applied inside each shadow root */
  var STYLE = ''
    + ':host{display:inline-flex;align-items:center;justify-content:center;color:#5B8A5B;line-height:0;}'
    + ':host([hidden]){display:none;}'
    + 'svg{width:100%;height:100%;color:currentColor;overflow:visible;display:block;}'
    + '.glass,.stache{fill:currentColor;}'
    + '.portrait{transform-box:fill-box;transform-origin:center;}'
    + '.blob{fill:currentColor;opacity:0;transform-box:fill-box;transform-origin:center;}'
    + '.water{transform-box:fill-box;transform-origin:center;}'
    + '.wave-a,.wave-b{transform-box:fill-box;transform-origin:center;animation:l47-wave 1.6s ease-in-out infinite;}'
    + '.wave-b{animation-delay:-0.8s;}'
    + '@keyframes l47-wave{0%,100%{transform:translateX(-2px)}50%{transform:translateX(2px)}}'
    + '@media (prefers-reduced-motion: reduce){.wave-a,.wave-b{animation:none;}}';

  /* Animation runner for a single mounted loader instance.
     Mirrors the IIFE in loaders.js #47 line-for-line, scoped to the
     shadow root so multiple loaders can co-exist on the page. */
  function run(root, host) {
    var blobEl = root.querySelector('.blob');
    var gooBlur   = root.querySelector('filter feGaussianBlur');
    var gooMatrix = root.querySelector('filter feColorMatrix');
    if (!blobEl || !gooBlur || !gooMatrix) return null;

    // ── Reduced-motion fallback: render static portrait, skip everything ──
    var reduced = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      // Show portrait sharp; goo off.
      gooBlur.setAttribute('stdDeviation', '0');
      gooMatrix.setAttribute('values', '1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0');
      return { destroy: function () {} };
    }

    var gooState = { k: 0 };
    function applyGoo() {
      var k = gooState.k;
      gooBlur.setAttribute('stdDeviation', (3.6 * k).toFixed(3));
      var scale  = (1 + 15 * k).toFixed(3);
      var offset = (-6 * k).toFixed(3);
      gooMatrix.setAttribute('values',
        '1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ' + scale + ' ' + offset);
    }
    applyGoo();

    // ── Continuous organic blob shape (rebuilt every frame from time `t`) ──
    var cx = 125, cy = 150, baseR = 26, N = 14;
    function blobAt(t) {
      var pts = [];
      for (var i = 0; i < N; i++) {
        var a = (i / N) * Math.PI * 2;
        var rr = baseR * (1
          + 0.12 * Math.sin(t * 0.85 + i * 0.55)
          + 0.08 * Math.sin(t * 0.55 + i * 1.1)
          + 0.05 * Math.cos(t * 1.10 + i * 0.4));
        pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
      }
      var d = '';
      for (var j = 0; j < N; j++) {
        var p1 = pts[j], p2 = pts[(j + 1) % N];
        var mx = (p1[0] + p2[0]) / 2, my = (p1[1] + p2[1]) / 2;
        if (j === 0) {
          var p0 = pts[N - 1];
          var mx0 = (p0[0] + p1[0]) / 2, my0 = (p0[1] + p1[1]) / 2;
          d += 'M ' + mx0.toFixed(2) + ' ' + my0.toFixed(2) + ' ';
        }
        d += 'Q ' + p1[0].toFixed(2) + ' ' + p1[1].toFixed(2) + ' ' + mx.toFixed(2) + ' ' + my.toFixed(2) + ' ';
      }
      return d + 'Z';
    }
    blobEl.setAttribute('d', blobAt(0));

    // rAF-driven shape rebuild (cancelled on destroy)
    var t0 = performance.now();
    var rafId = 0;
    var cancelled = false;
    function tick(now) {
      if (cancelled) return;
      blobEl.setAttribute('d', blobAt((now - t0) / 1000));
      rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);

    var anime = global.anime;
    var tl = anime.timeline({ loop: true });

    // anime.js targets accept arrays of elements scoped to this shadow root.
    var portrait = root.querySelector('.portrait');
    var blob     = blobEl;
    var waterL   = root.querySelector('.water.l');
    var waterR   = root.querySelector('.water.r');

    // 1. Both lenses fill together
    tl.add({
      targets: [waterL, waterR],
      translateY: [0, -30],
      duration: 1300,
      easing: 'easeInOutCubic',
    }, 0);

    // 2. Alternating drain/refill (left)
    tl.add({
      targets: waterL,
      keyframes: [
        { translateY:   0, duration: 1000, easing: 'easeInOutSine' },
        { translateY: -30, duration: 1000, easing: 'easeInOutSine' },
        { translateY:   0, duration: 1000, easing: 'easeInOutSine' },
        { translateY: -30, duration: 1000, easing: 'easeInOutSine' },
      ],
    });
    // 2b. Alternating right (in parallel)
    tl.add({
      targets: waterR,
      keyframes: [
        { translateY: -30, duration: 1000, easing: 'linear' },
        { translateY:   0, duration: 1000, easing: 'easeInOutSine' },
        { translateY: -30, duration: 1000, easing: 'easeInOutSine' },
        { translateY: -30, duration: 1000, easing: 'linear' },
      ],
    }, '-=4000');

    // 3. Both drain together
    tl.add({
      targets: [waterL, waterR],
      translateY: [-30, 0],
      duration: 900,
      easing: 'easeInOutCubic',
    });

    // 4. Dissolve portrait → blob
    var MORPH_OUT = 1400;
    tl.add({
      targets: portrait,
      opacity: [{ value: 1, duration: 0 }, { value: 0, duration: MORPH_OUT, easing: 'easeInOutSine' }],
      scale:   [{ value: 1, duration: 0 }, { value: 0.7, duration: MORPH_OUT, easing: 'easeInOutQuad' }],
    }, '+=200');
    tl.add({
      targets: blob,
      opacity: [{ value: 0, duration: 0 }, { value: 1, duration: MORPH_OUT, easing: 'easeInOutSine' }],
      scale:   [{ value: 0.7, duration: 0 }, { value: 1, duration: MORPH_OUT, easing: 'easeInOutQuad' }],
    }, '-=' + MORPH_OUT);
    tl.add({
      targets: gooState,
      k: [0, 1],
      duration: MORPH_OUT,
      easing: 'easeInOutSine',
      update: applyGoo,
    }, '-=' + MORPH_OUT);

    // 5. Blob wanders
    tl.add({
      targets: blob,
      keyframes: [
        { translateX: -14, translateY: -7  },
        { translateX:  11, translateY:  9  },
        { translateX:   6, translateY: -11 },
        { translateX:  -9, translateY:  5  },
        { translateX:  13, translateY: -4  },
        { translateX:  -6, translateY: -10 },
        { translateX:   8, translateY:  8  },
        { translateX:   0, translateY:  0  },
      ],
      duration: 4000,
      easing: 'easeInOutSine',
    });

    // 6. Morph back: blob → empty portrait
    var MORPH_IN = 1300;
    tl.add({
      targets: blob,
      opacity: [{ value: 1, duration: 0 }, { value: 0, duration: MORPH_IN, easing: 'easeInOutSine' }],
      scale:   [{ value: 1, duration: 0 }, { value: 0.7, duration: MORPH_IN, easing: 'easeInOutQuad' }],
    }, '+=200');
    tl.add({
      targets: portrait,
      opacity: [{ value: 0, duration: 0 }, { value: 1, duration: MORPH_IN, easing: 'easeInOutSine' }],
      scale:   [{ value: 0.7, duration: 0 }, { value: 1, duration: MORPH_IN, easing: 'easeInOutQuad' }],
    }, '-=' + MORPH_IN);
    tl.add({
      targets: gooState,
      k: [1, 0],
      duration: MORPH_IN,
      easing: 'easeInOutSine',
      update: applyGoo,
    }, '-=' + MORPH_IN);

    // 7. Brief breath before the cycle loops
    tl.add({ targets: portrait, opacity: [1, 1], duration: 300 });

    return {
      destroy: function () {
        cancelled = true;
        cancelAnimationFrame(rafId);
        try { tl.pause(); } catch (e) {}
      }
    };
  }

  var uidCounter = 0;
  function nextUid() { uidCounter += 1; return 'sl' + uidCounter; }

  function mountIntoShadow(host) {
    if (host._shaughvLoader) return host._shaughvLoader;
    var uid = nextUid();
    var shadow = host.shadowRoot || host.attachShadow({ mode: 'open' });
    shadow.innerHTML = '<style>' + STYLE + '</style>' + svgMarkup(uid);
    var instance = { destroy: function () { shadow.innerHTML = ''; host._shaughvLoader = null; } };
    host._shaughvLoader = instance;
    loadAnime().then(function () {
      if (!host.isConnected) return;
      var runner = run(shadow, host);
      if (runner) {
        var origDestroy = instance.destroy;
        instance.destroy = function () { runner.destroy(); origDestroy(); };
      }
    }).catch(function () {/* anime.js failed to load — static portrait remains */});
    return instance;
  }

  function mount(host) {
    if (!host) return null;
    if (host.tagName && host.tagName.toLowerCase() === 'shaughv-loader') {
      return mountIntoShadow(host);
    }
    // Light-DOM host (data-shaughv-loader). Build a sub-element with shadow root.
    if (!host._shaughvLoaderProxy) {
      var proxy = document.createElement('shaughv-loader');
      proxy.style.display = 'inline-flex';
      proxy.style.width = '100%';
      proxy.style.height = '100%';
      host.appendChild(proxy);
      host._shaughvLoaderProxy = proxy;
    }
    return mountIntoShadow(host._shaughvLoaderProxy);
  }

  function autoMount(root) {
    var scope = root || document;
    scope.querySelectorAll('[data-shaughv-loader]:not([data-shaughv-loader-mounted])').forEach(function (host) {
      host.setAttribute('data-shaughv-loader-mounted', '');
      mount(host);
    });
  }

  if (typeof customElements !== 'undefined' && !customElements.get('shaughv-loader')) {
    try {
      class ShaughvLoaderEl extends HTMLElement {
        connectedCallback() {
          if (!this.style.color) this.style.color = 'currentColor';
          mountIntoShadow(this);
        }
        disconnectedCallback() {
          if (this._shaughvLoader) this._shaughvLoader.destroy();
        }
      }
      customElements.define('shaughv-loader', ShaughvLoaderEl);
    } catch (e) {
      // Fall back to manual mount on existing tags
      document.querySelectorAll('shaughv-loader:not([data-shaughv-loader-mounted])').forEach(function (host) {
        host.setAttribute('data-shaughv-loader-mounted', '');
        mountIntoShadow(host);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { autoMount(); });
  } else {
    autoMount();
  }

  global.ShaughvLoader = { mount: mount, autoMount: autoMount };
})(typeof window !== "undefined" ? window : this);
