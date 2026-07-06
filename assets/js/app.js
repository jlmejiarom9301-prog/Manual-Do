/**
 * app.js
 * -----------------------------------------------------------------------
 * Punto de entrada de Inter-Con Academy. Registra las rutas del SPA y
 * conecta cada pantalla con su función de "mount" (listeners de eventos).
 *
 * ARQUITECTURA (ver docs/ARCHITECTURE.md):
 *   core/       -> router, state (localStorage), gamification, data (JSON)
 *   components/ -> piezas de UI reutilizables (quiz, video, toast, confetti, ui)
 *   screens/    -> una función render + una función mount por pantalla
 *   data/       -> contenido versionable en JSON (fácil de editar sin tocar JS)
 * -----------------------------------------------------------------------
 */
import { createRouter } from "./core/router.js";
import { getModule } from "./core/data.js";

import { renderHome, mountHome } from "./screens/home.js";
import { renderModuleList, mountModuleList } from "./screens/moduleList.js";
import { renderModuleIntro, mountModuleIntro } from "./screens/moduleIntro.js";
import { renderAchievements, mountAchievements } from "./screens/achievements.js";
import { renderProfile, mountProfile } from "./screens/profile.js";
import { renderFinalExam, mountFinalExam } from "./screens/finalExam.js";
import { renderCertificate, mountCertificate } from "./screens/certificate.js";

const appRoot = document.getElementById("app-root");
export const router = createRouter(appRoot);

let pendingMount = null;

function route(renderFn, mountFn) {
  return async (params, query) => {
    const html = await renderFn(params, query);
    pendingMount = async (root) => mountFn(root, params, query);
    return html;
  };
}

router
  .register("/", route(renderHome, mountHome))
  .register("/modulos", route(renderModuleList, mountModuleList))
  .register("/modulo/:id", route(renderModuleIntro, mountModuleIntro))
  .register("/logros", route(renderAchievements, mountAchievements))
  .register("/perfil", route(renderProfile, mountProfile))
  .register("/evaluacion-final", route(renderFinalExam, mountFinalExam))
  .register("/constancia", route(renderCertificate, mountCertificate))
  .setNotFound(() => `<div class="screen text-center"><h2>404</h2><p>Pantalla no encontrada.</p></div>`);

document.addEventListener("route:rendered", () => {
  if (pendingMount) {
    const fn = pendingMount;
    pendingMount = null;
    fn(appRoot);
  }
});

router.start("/");
