/**
 * ui.js — Fragmentos de interfaz compartidos (topbar, tabbar, ring de progreso).
 */
import { router } from "../app.js";

export function topbar(title, { back = false } = {}) {
  return `
  <header class="topbar">
    ${
      back
        ? `<button class="topbar__back" data-go-back aria-label="Volver">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M15 18l-6-6 6-6"/></svg>
      </button>`
        : `<img src="assets/images/photos/logo-ic.png" class="topbar__logo" alt="Inter-Con" />`
    }
    <span class="topbar__title">${title}</span>
  </header>`;
}

export function mountTopbar(root = document) {
  root.querySelectorAll("[data-go-back]").forEach((btn) => {
    btn.addEventListener("click", () => history.back());
  });
}

const TABS = [
  { path: "/", label: "Inicio", icon: "home" },
  { path: "/modulos", label: "Módulos", icon: "grid" },
  { path: "/logros", label: "Logros", icon: "award" },
  { path: "/perfil", label: "Perfil", icon: "user" },
];

const ICONS = {
  home: `<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9"/>`,
  grid: `<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>`,
  award: `<circle cx="12" cy="8" r="5"/><path d="M8.5 12.5 7 21l5-2.5L17 21l-1.5-8.5"/>`,
  user: `<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4.5 5-6 8-6s6.5 1.5 8 6"/>`,
};

export function tabbar(activePath) {
  return `
  <nav class="tabbar">
    ${TABS.map((t) => {
      const active = t.path === activePath;
      return `<button class="tabbar__item ${active ? "is-active" : ""}" data-nav="${t.path}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${ICONS[t.icon]}</svg>
        <span>${t.label}</span>
      </button>`;
    }).join("")}
  </nav>`;
}

export function mountTabbar(root = document) {
  root.querySelectorAll("[data-nav]").forEach((btn) => {
    btn.addEventListener("click", () => router.go(btn.dataset.nav));
  });
}

export function progressRing(pct, size = 96) {
  const r = (size - 10) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct / 100);
  return `
  <div class="ring" style="--ring-size:${size}px">
    <svg width="${size}" height="${size}">
      <circle class="ring__bg" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="8"></circle>
      <circle class="ring__fill" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="8"
        stroke-dasharray="${c}" stroke-dashoffset="${offset}"></circle>
    </svg>
    <div class="ring__label"><strong>${pct}%</strong><span>completado</span></div>
  </div>`;
}

export function moduleCardHTML(mod, progress) {
  const pct = progressPct(mod, progress);
  const statusIcon =
    progress.status === "completed"
      ? `<div class="module-card__done">✓</div>`
      : progress.status === "locked"
      ? `<div class="module-card__lock">🔒</div>`
      : "";
  return `
  <div class="module-card card-interactive" data-open-module="${mod.id}">
    <div class="module-card__bg" style="background-image:url('${mod.hero}')"></div>
    <div class="module-card__scrim"></div>
    ${statusIcon}
    <div class="module-card__body">
      <div class="module-card__num">MÓDULO ${String(mod.order).padStart(2, "0")}</div>
      <div class="module-card__title">${mod.title}</div>
      <div class="module-card__meta"><span>⏱ ${mod.estimatedMinutes} min</span><span>·</span><span>⚡ ${mod.xpTotal} XP</span></div>
      <div class="mini-bar"><div class="mini-bar__fill" style="width:${pct}%"></div></div>
    </div>
  </div>`;
}

export function progressPct(mod, progress) {
  const total = (mod.steps || mod.lessons || []).length || 1;
  const done = (progress.completedSteps || []).length;
  return Math.min(100, Math.round((done / total) * 100));
}
