/**
 * home.js — Dashboard principal (pantalla de inicio).
 * Muestra: continuar curso, progreso global, tiempo invertido, módulos
 * completados, última actividad y logros recientes.
 */
import { state } from "../core/state.js";
import { getModulesIndex } from "../core/data.js";
import { registerDailyVisit, levelForXP, ACHIEVEMENTS } from "../core/gamification.js";
import { topbar, tabbar, mountTabbar, mountTopbar, progressRing } from "../components/ui.js";
import { router } from "../app.js";

function fmtMinutes(totalSec) {
  const m = Math.round(totalSec / 60);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

export async function renderHome() {
  const streakCount = registerDailyVisit();
  const modules = await getModulesIndex();
  const s = state.get();
  const completed = modules.filter((m) => state.getModuleProgress(m.id).status === "completed");
  const globalPct = Math.round((completed.length / modules.length) * 100);
  const { level, xpIntoLevel, xpForNextLevel } = levelForXP(s.xp);

  const nextModule =
    modules.find((m) => state.getModuleProgress(m.id).status === "in_progress") ||
    modules.find((m) => state.getModuleProgress(m.id).status !== "completed") ||
    modules[0];

  const recentAchievements = s.achievements
    .slice(-3)
    .reverse()
    .map((id) => ACHIEVEMENTS.find((a) => a.id === id))
    .filter(Boolean);

  return `
  ${topbar("Inter-Con Academy")}
  <div class="screen">
    <div class="hero mb-6" style="background-image:url('assets/images/photos/cover-building.jpeg')">
      <div class="hero__content">
        <div class="hero__eyebrow">¡Hola, ${s.user.name}! 👋</div>
        <h2 class="hero__title">Sigamos construyendo tu futuro en Inter-Con</h2>
        <div class="hero__subtitle">Racha activa: ${streakCount} ${streakCount === 1 ? "día" : "días"} 🔥</div>
      </div>
    </div>

    <div class="card mb-6">
      <div class="spread">
        <div>
          <div class="step-badge">Continuar aprendiendo</div>
          <h3>${nextModule ? nextModule.title : "¡Todo completado!"}</h3>
          <p class="text-muted" style="font-size:var(--fs-sm)">${nextModule ? nextModule.subtitle : "Revisa tus logros"}</p>
          <button class="btn btn-accent mt-2" data-continue-course>Continuar curso →</button>
        </div>
        ${progressRing(globalPct, 84)}
      </div>
    </div>

    <div class="stat-grid mb-6">
      <div class="card stat-card"><strong>${completed.length}/${modules.length}</strong><span>Módulos</span></div>
      <div class="card stat-card"><strong>${fmtMinutes(s.totalTimeSpentSec)}</strong><span>Tiempo invertido</span></div>
      <div class="card stat-card"><strong>Nv. ${level}</strong><span>${xpIntoLevel}/${xpForNextLevel} XP</span></div>
    </div>

    <div class="spread mb-2">
      <h4>Logros recientes</h4>
      <button class="btn-ghost btn btn-sm" data-nav="/logros">Ver todos</button>
    </div>
    <div class="chip-row mb-6">
      ${
        recentAchievements.length
          ? recentAchievements.map((a) => `<span class="chip chip-gold">${a.icon} ${a.label}</span>`).join("")
          : `<span class="chip">Completa tu primera lección para desbloquear logros 🎯</span>`
      }
    </div>

    ${
      s.lastActivity
        ? `<div class="callout callout-info mb-6"><span class="callout__icon">🕓</span><span>Última actividad: <strong>${s.lastActivity.label}</strong></span></div>`
        : ""
    }

    <div class="card card-interactive mb-4" data-go-exam>
      <div class="spread">
        <div>
          <h4 class="mb-2">📝 Evaluación final</h4>
          <p class="text-muted" style="font-size:var(--fs-sm);margin:0">12 preguntas · obtén tu constancia DC-3</p>
        </div>
        <span>→</span>
      </div>
    </div>
  </div>
  ${tabbar("/")}`;
}

export function mountHome(root) {
  mountTopbar(root);
  mountTabbar(root);
  const cont = root.querySelector("[data-continue-course]");
  if (cont) cont.addEventListener("click", async () => {
    const modules = await getModulesIndex();
    const s = state.get();
    const next =
      modules.find((m) => state.getModuleProgress(m.id).status === "in_progress") ||
      modules.find((m) => state.getModuleProgress(m.id).status !== "completed") ||
      modules[0];
    router.go(`/modulo/${next.id}`);
  });
  const examCard = root.querySelector("[data-go-exam]");
  if (examCard) examCard.addEventListener("click", () => router.go("/evaluacion-final"));
}
