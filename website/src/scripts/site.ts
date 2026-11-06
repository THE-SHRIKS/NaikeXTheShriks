// Mobile menu and gentle reveals. Everything works without this script.
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

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
