/**
 * achievements.js — Logros / insignias + ranking local (mock).
 */
import { state } from "../core/state.js";
import { ACHIEVEMENTS, computeMockRanking, levelForXP } from "../core/gamification.js";
import { topbar, tabbar, mountTabbar, mountTopbar } from "../components/ui.js";

export async function renderAchievements() {
  const s = state.get();
  const ranking = computeMockRanking();
  const { level } = levelForXP(s.xp);

  return `
  ${topbar("Logros y ranking")}
  <div class="screen">
    <div class="card mb-6 text-center">
      <div class="step-badge">Tu nivel</div>
      <h2>Nivel ${level} · ${s.xp} XP</h2>
      <div class="chip-row" style="justify-content:center">
        <span class="chip chip-gold">🔥 Racha ${s.streak.count} días</span>
        <span class="chip">🏆 ${s.achievements.length}/${ACHIEVEMENTS.length} logros</span>
      </div>
    </div>

    <h4 class="mb-4">Insignias</h4>
    <div class="badge-grid mb-8">
      ${ACHIEVEMENTS.map((a) => {
        const unlocked = s.achievements.includes(a.id);
        return `<div class="badge ${unlocked ? "is-unlocked" : ""}" title="${a.desc}">
          <span>${a.icon}</span>
          <span class="badge__label">${a.label}</span>
        </div>`;
      }).join("")}
    </div>

    <h4 class="mb-4 mt-6">Ranking local</h4>
    <div class="card">
      ${ranking
        .map(
          (p) => `<div class="spread" style="padding:10px 0;${p.isMe ? "font-weight:700;color:var(--color-primary)" : ""};border-bottom:1px solid var(--color-border)">
          <span>#${p.rank} ${p.name}</span><span>${p.xp} XP</span>
        </div>`
        )
        .join("")}
    </div>
    <p class="text-muted mt-2" style="font-size:var(--fs-xs)">* Ranking simulado localmente para esta demostración. En la versión LMS se conectará a datos reales de todos los guardias.</p>
  </div>
  ${tabbar("/logros")}`;
}

export function mountAchievements(root) {
  mountTopbar(root);
  mountTabbar(root);
}
