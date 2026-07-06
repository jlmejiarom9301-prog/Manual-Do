/**
 * gamification.js
 * -----------------------------------------------------------------------
 * Motor de gamificación: XP, niveles, racha diaria, logros y ranking local
 * (mock). Se apoya en state.js para persistir todo en localStorage.
 * -----------------------------------------------------------------------
 */
import { state } from "./state.js";
import { toast } from "../components/toast.js";

export const XP_RULES = {
  STEP_COMPLETE: 5,
  VIDEO_WATCHED: 10,
  QUIZ_CORRECT: 8,
  QUIZ_PERFECT_BONUS: 20,
  MODULE_COMPLETE: 60,
  SIMULATION_COMPLETE: 40,
  FINAL_EXAM_PASSED: 150,
};

// Curva de niveles: cada nivel requiere un poco más que el anterior.
export function levelForXP(xp) {
  let level = 1;
  let threshold = 100;
  let remaining = xp;
  while (remaining >= threshold) {
    remaining -= threshold;
    level += 1;
    threshold = Math.round(threshold * 1.25);
  }
  return { level, xpIntoLevel: remaining, xpForNextLevel: threshold };
}

export const ACHIEVEMENTS = [
  { id: "first_step", label: "Primer Paso", icon: "🎯", desc: "Completa tu primera lección." },
  { id: "first_video", label: "Cinéfilo IC", icon: "🎬", desc: "Mira tu primer video institucional." },
  { id: "first_module", label: "Módulo Dominado", icon: "🏅", desc: "Completa tu primer módulo." },
  { id: "quiz_perfect", label: "Mente Brillante", icon: "🧠", desc: "Responde un quiz sin errores." },
  { id: "streak_3", label: "Racha x3", icon: "🔥", desc: "Entra 3 días seguidos." },
  { id: "streak_7", label: "Semana Completa", icon: "⚡", desc: "Entra 7 días seguidos." },
  { id: "halfway", label: "Mitad del Camino", icon: "🚩", desc: "Completa 5 de 9 módulos." },
  { id: "all_modules", label: "Guardia Experto", icon: "🛡️", desc: "Completa los 9 módulos." },
  { id: "simulator", label: "Listo Para Todo", icon: "🚨", desc: "Aprueba una simulación de emergencia." },
  { id: "graduate", label: "Constancia DC-3", icon: "🎓", desc: "Aprueba la evaluación final." },
];

function unlockAchievement(id) {
  let unlocked = false;
  state.update((draft) => {
    if (!draft.achievements.includes(id)) {
      draft.achievements.push(id);
      unlocked = true;
    }
  });
  if (unlocked) {
    const meta = ACHIEVEMENTS.find((a) => a.id === id);
    if (meta) {
      toast(`${meta.icon} ¡Logro desbloqueado! ${meta.label}`, "achievement");
    }
  }
  return unlocked;
}

export function addXP(amount, reason = "") {
  const before = state.get().xp;
  const beforeLevel = levelForXP(before).level;
  state.update((draft) => {
    draft.xp += amount;
  });
  const after = state.get().xp;
  const afterLevel = levelForXP(after).level;
  if (amount > 0) {
    toast(`+${amount} XP ${reason ? "· " + reason : ""}`, "xp");
  }
  if (afterLevel > beforeLevel) {
    toast(`⭐ ¡Subiste a nivel ${afterLevel}!`, "levelup");
  }
  return after;
}

/** Debe llamarse una vez por sesión activa (por ejemplo al entrar al Home). */
export function registerDailyVisit() {
  const today = new Date().toISOString().slice(0, 10);
  const { streak } = state.get();
  if (streak.lastActiveDate === today) return streak.count;

  let newCount = 1;
  if (streak.lastActiveDate) {
    const last = new Date(streak.lastActiveDate);
    const diffDays = Math.round((new Date(today) - last) / 86400000);
    newCount = diffDays === 1 ? streak.count + 1 : 1;
  }

  state.update((draft) => {
    draft.streak = { count: newCount, lastActiveDate: today };
  });

  if (newCount === 3) unlockAchievement("streak_3");
  if (newCount >= 7) unlockAchievement("streak_7");

  return newCount;
}

export function onStepComplete() {
  addXP(XP_RULES.STEP_COMPLETE);
  unlockAchievement("first_step");
}

export function onVideoWatched(videoId) {
  state.markVideoWatched(videoId);
  addXP(XP_RULES.VIDEO_WATCHED, "video visto");
  unlockAchievement("first_video");
}

export function onQuizAnswer(correct) {
  if (correct) addXP(XP_RULES.QUIZ_CORRECT, "respuesta correcta");
}

export function onQuizFinished(scorePct) {
  if (scorePct === 100) {
    addXP(XP_RULES.QUIZ_PERFECT_BONUS, "quiz perfecto");
    unlockAchievement("quiz_perfect");
  }
}

export function onSimulationComplete() {
  addXP(XP_RULES.SIMULATION_COMPLETE, "simulación superada");
  unlockAchievement("simulator");
}

export function onModuleComplete(totalModules, completedModules) {
  addXP(XP_RULES.MODULE_COMPLETE, "módulo completado");
  unlockAchievement("first_module");
  if (completedModules >= Math.ceil(totalModules / 2)) unlockAchievement("halfway");
  if (completedModules >= totalModules) unlockAchievement("all_modules");
}

export function onFinalExamPassed() {
  addXP(XP_RULES.FINAL_EXAM_PASSED, "evaluación final aprobada");
  unlockAchievement("graduate");
}

/** Ranking local (mock): compara al usuario contra un set de compañeros simulados. */
export function computeMockRanking() {
  const myXP = state.get().xp;
  const peers = [
    { name: "Ana R.", xp: 320 },
    { name: "Carlos M.", xp: 480 },
    { name: "Luis G.", xp: 210 },
    { name: "Fernanda T.", xp: 610 },
    { name: "Jorge P.", xp: 150 },
  ];
  const all = [...peers, { name: "Tú", xp: myXP, isMe: true }].sort((a, b) => b.xp - a.xp);
  return all.map((p, i) => ({ ...p, rank: i + 1 }));
}
