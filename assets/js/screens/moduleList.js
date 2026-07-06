/**
 * moduleList.js — Selección de módulo (grid de 9 módulos con progreso).
 */
import { state } from "../core/state.js";
import { getModulesIndex } from "../core/data.js";
import { topbar, tabbar, mountTabbar, mountTopbar, moduleCardHTML } from "../components/ui.js";
import { router } from "../app.js";

export async function renderModuleList() {
  const modules = await getModulesIndex();
  return `
  ${topbar("Módulos de capacitación")}
  <div class="screen">
    <p class="text-muted mb-6">Elige un módulo para continuar tu inducción. Puedes ir y volver cuando quieras — tu avance se guarda automáticamente.</p>
    <div class="stack">
      ${modules.map((m) => moduleCardHTML(m, state.getModuleProgress(m.id))).join("")}
    </div>
  </div>
  ${tabbar("/modulos")}`;
}

export function mountModuleList(root) {
  mountTopbar(root);
  mountTabbar(root);
  root.querySelectorAll("[data-open-module]").forEach((card) => {
    card.addEventListener("click", () => router.go(`/modulo/${card.dataset.openModule}`));
  });
}
