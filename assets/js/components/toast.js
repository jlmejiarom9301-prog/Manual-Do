/**
 * toast.js — Notificaciones flotantes no intrusivas (XP, logros, subir de nivel).
 */
let stackEl = null;

function ensureStack() {
  if (!stackEl) {
    stackEl = document.createElement("div");
    stackEl.className = "toast-stack";
    document.body.appendChild(stackEl);
  }
  return stackEl;
}

const ICONS = {
  xp: "✨",
  achievement: "🏆",
  levelup: "⭐",
  info: "ℹ️",
};

export function toast(message, type = "info", duration = 2600) {
  const stack = ensureStack();
  const el = document.createElement("div");
  el.className = "toast";
  el.innerHTML = `<span>${ICONS[type] || ""}</span><span>${message}</span>`;
  stack.appendChild(el);
  setTimeout(() => {
    el.style.transition = "opacity .3s, transform .3s";
    el.style.opacity = "0";
    el.style.transform = "translateY(-8px)";
    setTimeout(() => el.remove(), 300);
  }, duration);
}
