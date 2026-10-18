/* Nick Freiburger — Portfolio interactions (no dependencies) */
(function () {
  const root = document.documentElement;
  root.classList.add("js");

  /* ---------- Theme toggle (dark by default) ---------- */
  const toggle = document.querySelector(".theme-toggle");
  if (toggle) {
    toggle.addEventListener("click", () => {
      const next = root.dataset.theme === "light" ? "dark" : "light";
      root.dataset.theme = next;
      try {
        localStorage.setItem("theme", next);
      } catch (e) {
        /* storage unavailable */
      }
    });
  }

  /* ---------- Card spotlight ---------- */
  document.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
  });

  /* ---------- Header border on scroll + reading progress ---------- */
  const header = document.querySelector(".site-header");
  const progress = document.querySelector(".progress");
  const onScroll = () => {
    const y = window.scrollY;
    if (header) header.classList.toggle("is-scrolled", y > 8);
    if (progress) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = `scaleX(${max > 0 ? Math.min(y / max, 1) : 0})`;
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Reveal on scroll ---------- */
  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px" }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-in"));
  }

  /* ---------- Copy email ---------- */
  document.querySelectorAll("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const label = btn.querySelector("span") || btn;
      const original = label.textContent;
      try {
        await navigator.clipboard.writeText(btn.dataset.copy);
        label.textContent = "Copied!";
      } catch (e) {
        label.textContent = "Press Ctrl+C";
      }
      setTimeout(() => (label.textContent = original), 1800);
    });
  });

  /* ---------- Table of contents highlighting ---------- */
  const tocLinks = Array.from(document.querySelectorAll(".toc a"));
  if (tocLinks.length && "IntersectionObserver" in window) {
    const byId = new Map(tocLinks.map((a) => [a.hash.slice(1), a]));
    const sections = tocLinks
      .map((a) => document.getElementById(a.hash.slice(1)))
      .filter(Boolean);
    const setActive = () => {
      let current = sections[0];
      for (const s of sections) {
        if (s.getBoundingClientRect().top < window.innerHeight * 0.35) current = s;
      }
      tocLinks.forEach((a) => a.classList.remove("is-active"));
      const link = current && byId.get(current.id);
      if (link) link.classList.add("is-active");
    };
    window.addEventListener("scroll", () => requestAnimationFrame(setActive), { passive: true });
    setActive();
  }

  /* ---------- Lightbox ---------- */
  const dialog = document.querySelector(".lightbox");
  if (dialog && typeof dialog.showModal === "function") {
    const img = dialog.querySelector("img");
    let opener = null;
    document.querySelectorAll(".zoom").forEach((btn) => {
      btn.addEventListener("click", () => {
        const source = btn.querySelector("img");
        opener = btn;
        img.src = source.currentSrc || source.src;
        img.alt = source.alt;
        img.classList.toggle("is-tall", source.naturalHeight / source.naturalWidth > 2.2);
        dialog.showModal();
      });
    });
    dialog.addEventListener("click", () => dialog.close());
    dialog.addEventListener("close", () => {
      img.removeAttribute("src");
      if (opener) opener.focus();
    });
  }

  /* ---------- Galleries ---------- */
  document.querySelectorAll(".gallery").forEach((gallery) => {
    const track = gallery.querySelector(".gallery-track");
    const prev = gallery.querySelector("[data-dir='prev']");
    const next = gallery.querySelector("[data-dir='next']");
    const count = gallery.querySelector(".gallery-count");
    const items = Array.from(track.children);

    const update = () => {
      const max = track.scrollWidth - track.clientWidth - 2;
      prev.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft >= max;
      let index = 0;
      items.forEach((item, i) => {
        if (item.offsetLeft - track.offsetLeft <= track.scrollLeft + 4) index = i;
      });
      if (track.scrollLeft >= max) index = items.length - 1;
      count.textContent = `${String(index + 1).padStart(2, "0")} / ${String(items.length).padStart(2, "0")}`;
    };

    const step = (dir) => {
      const amount = Math.max(track.clientWidth * 0.8, 240);
      track.scrollBy({ left: dir * amount, behavior: "smooth" });
    };
    prev.addEventListener("click", () => step(-1));
    next.addEventListener("click", () => step(1));
    track.addEventListener("scroll", () => requestAnimationFrame(update), { passive: true });
    window.addEventListener("resize", update);
    items.forEach((item) => {
      const im = item.querySelector("img");
      if (im && !im.complete) im.addEventListener("load", update, { once: true });
    });
    update();
  });

  /* ---------- Figma prototypes (load on demand) ---------- */
  document.querySelectorAll(".proto [data-load]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const proto = btn.closest(".proto");
      const iframe = document.createElement("iframe");
      iframe.src = proto.dataset.src;
      iframe.title = proto.dataset.title || "Interactive Figma prototype";
      iframe.allowFullscreen = true;
      iframe.setAttribute("allow", "fullscreen");
      proto.querySelector(".proto-placeholder").remove();
      proto.classList.add("is-loaded");
      proto.appendChild(iframe);
      iframe.focus();
    });
  });

  /* ---------- Hero tiles: grid cells that light up and fade ---------- */
  const tilesCanvas = document.querySelector(".tiles");
  if (tilesCanvas && tilesCanvas.getContext) {
    const ctx = tilesCanvas.getContext("2d");
    const SIZE = 72; // matches .grid-lines background-size
    const host = tilesCanvas.closest(".page-head") || tilesCanvas.parentElement;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let cols = 0;
    let rows = 0;
    let tiles = [];
    let rgb = "94, 234, 160";
    let running = false;
    let visible = false;
    let last = 0;
    let nextSpawn = 0;

    const readAccent = () => {
      const hex = getComputedStyle(root).getPropertyValue("--accent").trim();
      const m = hex.match(/^#([da-f]{2})([da-f]{2})([da-f]{2})$/i);
      if (m) rgb = m.slice(1).map((h) => parseInt(h, 16)).join(", ");
    };

    // Random tile index, favoring the upper rows where the grid is most visible.
    const randomTile = () =>
      Math.floor(Math.pow(Math.random(), 1.5) * rows) * cols + Math.floor(Math.random() * cols);

    // Raise a tile toward `peak`; it fades on its own once it gets there.
    const light = (i, peak) => {
      const t = tiles[i];
      if (t && peak > t.a) t.peak = Math.max(t.peak, peak);
    };

    const draw = () => {
      ctx.clearRect(0, 0, tilesCanvas.width, tilesCanvas.height);
      ctx.lineWidth = 1;
      for (let i = 0; i < tiles.length; i++) {
        const a = tiles[i].a;
        if (!a) continue;
        const x = (i % cols) * SIZE;
        const y = Math.floor(i / cols) * SIZE;
        ctx.fillStyle = `rgba(${rgb}, ${a.toFixed(3)})`;
        ctx.fillRect(x + 1, y + 1, SIZE - 1, SIZE - 1);
        ctx.strokeStyle = `rgba(${rgb}, ${Math.min(a * 2.2, 0.6).toFixed(3)})`;
        ctx.strokeRect(x + 1.5, y + 1.5, SIZE - 2, SIZE - 2);
      }
    };

    const resize = () => {
      const r = tilesCanvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      tilesCanvas.width = Math.round(r.width * dpr);
      tilesCanvas.height = Math.round(r.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(r.width / SIZE);
      rows = Math.ceil(r.height / SIZE);
      tiles = Array.from({ length: cols * rows }, () => ({ a: 0, peak: 0 }));
      if (reduceMotion) {
        // A still pattern instead of motion.
        for (let k = 0; k < Math.round(tiles.length / 14); k++) tiles[randomTile()].a = 0.08 + Math.random() * 0.12;
        draw();
      } else {
        // Start with a scattering of lit tiles so the effect reads right away.
        for (let k = 0; k < Math.round(tiles.length / 16); k++) light(randomTile(), 0.12 + Math.random() * 0.16);
      }
    };

    const frame = (now) => {
      if (!running) return;
      const dt = Math.min(now - last, 64);
      last = now;

      if (now >= nextSpawn) {
        light(randomTile(), 0.12 + Math.random() * 0.16);
        // Keep density even: smaller screens (fewer tiles) light up less often.
        const sparsity = Math.min(Math.max(240 / tiles.length, 1), 3);
        nextSpawn = now + (90 + Math.random() * 170) * sparsity;
      }

      for (const t of tiles) {
        if (t.peak) {
          t.a += (t.peak - t.a) * Math.min(dt / 220, 1);
          if (t.a >= t.peak * 0.95) t.peak = 0;
        } else if (t.a) {
          t.a *= Math.exp(-dt / 1300);
          if (t.a < 0.004) t.a = 0;
        }
      }
      draw();
      requestAnimationFrame(frame);
    };

    const sync = () => {
      const shouldRun = visible && !document.hidden;
      if (shouldRun && !running) {
        running = true;
        last = performance.now();
        requestAnimationFrame(frame);
      } else if (!shouldRun) {
        running = false;
      }
    };

    readAccent();
    resize();
    new ResizeObserver(resize).observe(tilesCanvas);
    new MutationObserver(() => {
      readAccent();
      if (reduceMotion) draw();
    }).observe(root, { attributes: true, attributeFilter: ["data-theme"] });

    if (!reduceMotion) {
      new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        sync();
      }).observe(tilesCanvas);
      document.addEventListener("visibilitychange", sync);

      if (window.matchMedia("(hover: hover)").matches) {
        host.addEventListener("pointermove", (e) => {
          const r = tilesCanvas.getBoundingClientRect();
          const c = Math.floor((e.clientX - r.left) / SIZE);
          const rr = Math.floor((e.clientY - r.top) / SIZE);
          if (c >= 0 && c < cols && rr >= 0 && rr < rows) light(rr * cols + c, 0.3);
        });
      }
    }
  }
})();
