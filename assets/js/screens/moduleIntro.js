/**
 * moduleIntro.js — Pantalla de detalle de un módulo antes/durante el curso.
 * Si el módulo ya está en progreso, permite "Continuar"; si no, "Comenzar".
 * Al confirmar, monta ModuleRunner en el mismo contenedor.
 */
import { state } from "../core/state.js";
import { getModule } from "../core/data.js";
import { topbar, mountTopbar, progressPct } from "../components/ui.js";
import { ModuleRunner } from "./moduleRunner.js";

export async function renderModuleIntro(params) {
  const mod = await getModule(params.id);
  const progress = state.getModuleProgress(mod.id);
  const pct = progressPct(mod, progress);
  const isStarted = progress.status && progress.status !== "available";
  const isCompleted = progress.status === "completed";

  return `
  ${topbar(mod.title, { back: true })}
  <div class="screen">
    <div class="hero mb-6" style="background-image:url('${mod.hero}')">
      <div class="hero__content">
        <div class="hero__eyebrow">MÓDULO ${String(mod.order).padStart(2, "0")}</div>
        <h2 class="hero__title">${mod.title}</h2>
        <div class="hero__subtitle">${mod.subtitle}</div>
      </div>
    </div>

    <div class="chip-row mb-4">
      <span class="chip">⏱ ${mod.estimatedMinutes} min</span>
      <span class="chip chip-gold">⚡ ${mod.xpTotal} XP</span>
      ${mod.simulation ? `<span class="chip">🎮 Incluye simulación</span>` : ""}
      ${isCompleted ? `<span class="chip" style="color:var(--color-success)">✓ Completado</span>` : ""}
    </div>

    ${isStarted ? `<div class="progress mb-2"><div class="progress__fill" style="width:${pct}%"></div></div><p class="text-muted mb-4" style="font-size:var(--fs-sm)">${pct}% completado</p>` : ""}

    <p>${mod.intro?.text || ""}</p>

    <div class="card mb-6 mt-4">
      <h4 class="mb-2">Lo que vas a aprender</h4>
      <div class="stack">
        ${(mod.learningPoints || []).map((p) => `<div class="hstack"><span>✅</span><span>${p}</span></div>`).join("")}
      </div>
    </div>

    <button class="btn btn-accent btn-block" data-start-module>
      ${isCompleted ? "Repasar módulo" : isStarted ? "Continuar módulo →" : "Comenzar módulo →"}
    </button>
  </div>`;
}

export function mountModuleIntro(root, params, mod) {
  mountTopbar(root);
  const btn = root.querySelector("[data-start-module]");
  if (!btn) return;
  btn.addEventListener("click", async () => {
    const fullMod = await getModule(params.id);
    const progress = state.getModuleProgress(fullMod.id);
    if (progress.status === "completed") {
      state.setModuleProgress(fullMod.id, { stepIndex: 0, completedSteps: [], status: "in_progress" });
    }
    const screenRoot = document.getElementById("app-root");
    const runner = new ModuleRunner(screenRoot, fullMod);
    runner.start();
  });
}
