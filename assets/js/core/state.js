/**
 * state.js
 * -----------------------------------------------------------------------
 * Capa única de persistencia local para Inter-Con Academy.
 *
 * Hoy: localStorage.
 * Mañana (roadmap): esta es la ÚNICA clase que habría que sustituir/extender
 * para conectar a una API REST / base de datos real, Azure AD, Human Work
 * Social, etc. Todas las pantallas leen/escriben el estado A TRAVÉS de
 * este módulo — nunca acceden a localStorage directamente — para que ese
 * reemplazo futuro no obligue a tocar el resto del código.
 * -----------------------------------------------------------------------
 */

const STORAGE_KEY = "interconAcademy.v1";

const DEFAULT_STATE = {
  user: {
    name: "Guardia Inter-Con",
    role: "Guardia de seguridad",
    avatarInitials: "GI",
    createdAt: null,
  },
  progress: {
    // moduleId -> { status: 'locked'|'available'|'in_progress'|'completed',
    //               stepIndex, completedSteps: [], quizScore, quizPassed, timeSpentSec }
  },
  videosWatched: [],       // ids de video
  xp: 0,
  level: 1,
  streak: { count: 0, lastActiveDate: null },
  achievements: [],        // ids de logros desbloqueados
  totalTimeSpentSec: 0,
  lastActivity: null,      // { moduleId, lessonId, label, at }
  finalExam: { attempted: false, passed: false, score: null, answers: null, selfieConfirmed: false },
  ranking: null,           // se calcula localmente (mock) en gamification.js
};

function deepMerge(base, extra) {
  const out = Array.isArray(base) ? [...base] : { ...base };
  for (const k in extra) {
    if (extra[k] && typeof extra[k] === "object" && !Array.isArray(extra[k]) && base[k]) {
      out[k] = deepMerge(base[k], extra[k]);
    } else {
      out[k] = extra[k];
    }
  }
  return out;
}

class StateManager {
  constructor() {
    this._state = this._load();
    this._listeners = new Set();
  }

  _load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return structuredClone(DEFAULT_STATE);
      const parsed = JSON.parse(raw);
      return deepMerge(structuredClone(DEFAULT_STATE), parsed);
    } catch (e) {
      console.warn("[state] no se pudo leer localStorage, usando estado por defecto", e);
      return structuredClone(DEFAULT_STATE);
    }
  }

  _save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._state));
    } catch (e) {
      console.warn("[state] no se pudo guardar en localStorage", e);
    }
    this._listeners.forEach((fn) => fn(this._state));
  }

  get() {
    return this._state;
  }

  subscribe(fn) {
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  }

  /** Actualiza el estado con un "patch" parcial (merge superficial de primer nivel). */
  update(patchFn) {
    const draft = structuredClone(this._state);
    patchFn(draft);
    this._state = draft;
    this._save();
  }

  getModuleProgress(moduleId) {
    return (
      this._state.progress[moduleId] || {
        status: "available",
        stepIndex: 0,
        completedSteps: [],
        quizScore: null,
        quizPassed: false,
        timeSpentSec: 0,
      }
    );
  }

  setModuleProgress(moduleId, patch) {
    this.update((draft) => {
      const current = draft.progress[moduleId] || {
        status: "available",
        stepIndex: 0,
        completedSteps: [],
        quizScore: null,
        quizPassed: false,
        timeSpentSec: 0,
      };
      draft.progress[moduleId] = { ...current, ...patch };
    });
  }

  markVideoWatched(videoId) {
    this.update((draft) => {
      if (!draft.videosWatched.includes(videoId)) draft.videosWatched.push(videoId);
    });
  }

  setLastActivity(entry) {
    this.update((draft) => {
      draft.lastActivity = { ...entry, at: new Date().toISOString() };
    });
  }

  addTimeSpent(seconds, moduleId) {
    this.update((draft) => {
      draft.totalTimeSpentSec += seconds;
      if (moduleId) {
        const mp = draft.progress[moduleId] || { timeSpentSec: 0 };
        mp.timeSpentSec = (mp.timeSpentSec || 0) + seconds;
        draft.progress[moduleId] = mp;
      }
    });
  }

  reset() {
    this._state = structuredClone(DEFAULT_STATE);
    this._save();
  }
}

export const state = new StateManager();
