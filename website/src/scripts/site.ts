import Lenis from "lenis";

// Mobile menu, smooth scrolling, the hero video and gentle reveals. Everything works without this script.
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const header = document.querySelector<HTMLElement>("[data-hdr]");
const toggle = header?.querySelector<HTMLButtonElement>("[data-menu]");
if (header && toggle) {
  const set = (open: boolean) => {
    header.dataset.open = String(open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.textContent = open ? "Close" : "Menu";
  };
  toggle.addEventListener("click", () => set(header.dataset.open !== "true"));
  header.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => set(false)));
  window.addEventListener("keydown", (e) => e.key === "Escape" && set(false));
}

// On the home page the header floats transparent over the film, and turns solid once you scroll.
if (header && header.dataset.home === "true") {
  const update = () => (header.dataset.top = window.scrollY < 8 ? "true" : "false");
  update();
  window.addEventListener("scroll", update, { passive: true });
}

// Smooth scroll.
if (!reduced) {
  const lenis = new Lenis({
    duration: 1.25,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    wheelMultiplier: 0.95,
    anchors: { offset: -84 },
  });
  const raf = (time: number) => {
    lenis.raf(time);
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);
}

// Hero video: plays while on screen, stays on its poster frame for reduced motion.
const video = document.querySelector<HTMLVideoElement>("[data-hero-video]");
if (video) {
  if (reduced) {
    video.removeAttribute("autoplay");
    video.pause();
  } else {
    new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? void video.play().catch(() => undefined) : video.pause()));
    }).observe(video);
  }
}

// Reveals.
const items = document.querySelectorAll<HTMLElement>("[data-reveal]");
if (!reduced && "IntersectionObserver" in window) {
  document.documentElement.classList.add("js");
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          (e.target as HTMLElement).dataset.shown = "true";
          io.unobserve(e.target);
        }
      }
    },
    { rootMargin: "0px 0px -8% 0px" },
  );
  items.forEach((el) => io.observe(el));
}

export {};
