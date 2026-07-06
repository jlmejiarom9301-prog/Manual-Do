/**
 * profile.js — Perfil del usuario + estadísticas + contacto de capacitación.
 * También incluye el punto de entrada al roadmap (placeholder de login real).
 */
import { state } from "../core/state.js";
import { getModulesIndex, getTeam } from "../core/data.js";
import { topbar, tabbar, mountTabbar, mountTopbar } from "../components/ui.js";
import { levelForXP } from "../core/gamification.js";

export async function renderProfile() {
  const s = state.get();
  const modules = await getModulesIndex();
  const team = await getTeam();
  const completed = modules.filter((m) => state.getModuleProgress(m.id).status === "completed").length;
  const { level } = levelForXP(s.xp);

  return `
  ${topbar("Mi perfil")}
  <div class="screen">
    <div class="hstack mb-6">
      <div class="avatar">${s.user.avatarInitials}</div>
      <div>
        <h3 style="margin-bottom:2px">${s.user.name}</h3>
        <span class="text-muted" style="font-size:var(--fs-sm)">${s.user.role} · Nivel ${level}</span>
      </div>
    </div>

    <div class="stat-grid mb-6">
      <div class="card stat-card"><strong>${completed}</strong><span>Módulos</span></div>
      <div class="card stat-card"><strong>${s.xp}</strong><span>XP</span></div>
      <div class="card stat-card"><strong>${s.videosWatched.length}</strong><span>Videos vistos</span></div>
    </div>

    <h4 class="mb-2">¿Necesitas ayuda?</h4>
    <div class="callout callout-info mb-6">
      <span class="callout__icon">💬</span>
      <span>Si te sientes vulnerable, llámanos: <strong>55 1882 9500</strong> / <strong>55 1434 8360</strong> o escribe a <a href="mailto:icteescucha@intercon.com.mx">icteescucha@intercon.com.mx</a></span>
    </div>

    <h4 class="mb-2">Equipo de capacitación</h4>
    <div class="stack mb-6">
      ${team
        .map(
          (t) => `<div class="card hstack">
        <div class="avatar" style="width:44px;height:44px;font-size:var(--fs-md)">${t.initials}</div>
        <div>
          <strong style="display:block">${t.name}</strong>
          <span class="text-muted" style="font-size:var(--fs-xs)">${t.role} · ${t.zone}</span><br/>
          <span class="text-muted" style="font-size:var(--fs-xs)">${t.phone}</span>
        </div>
      </div>`
        )
        .join("")}
    </div>

    <details class="mb-6">
      <summary style="cursor:pointer;font-weight:600;color:var(--color-primary)">Opciones avanzadas</summary>
      <button class="btn btn-ghost btn-block mt-4" data-reset-progress>Reiniciar mi avance (demo)</button>
    </details>

    <p class="text-muted text-center" style="font-size:var(--fs-xs)">Inter-Con Academy · MVP interno · v1.0</p>
  </div>
  ${tabbar("/perfil")}`;
}

export function mountProfile(root) {
  mountTopbar(root);
  mountTabbar(root);
  const resetBtn = root.querySelector("[data-reset-progress]");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (confirm("¿Seguro que deseas borrar todo tu avance local? Esto es solo para pruebas de la demo.")) {
        state.reset();
        location.reload();
      }
    });
  }
}
