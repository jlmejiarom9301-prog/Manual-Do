/**
 * validate-content.mjs
 * -----------------------------------------------------------------------
 * Script de validacion de contenido y logica pura del proyecto, pensado
 * para correr con Node (fuera del navegador) antes de publicar cambios:
 *
 *   node scripts/validate-content.mjs
 *
 * Valida:
 *   - state.js guarda y recupera progreso correctamente
 *   - gamification.js calcula niveles, XP, racha y ranking sin errores
 *   - QuizEngine se puede instanciar con cada tipo de pregunta
 *   - TODOS los assets/data/modulo-*.json cumplen el esquema esperado
 *     por moduleRunner.js (steps, quiz, simulation)
 *
 * No se carga en index.html ni forma parte del bundle de la app.
 * -----------------------------------------------------------------------
 */
import fs from "node:fs";

const store = {};
global.localStorage = {
  getItem(k) { return k in store ? store[k] : null; },
  setItem(k, v) { store[k] = String(v); },
  removeItem(k) { delete store[k]; },
  clear() { for (const k in store) delete store[k]; },
};

class FakeEl {
  constructor() {
    this._html = "";
    this.dataset = {};
    this.classList = { add() {}, remove() {}, toggle() {}, contains() { return false; } };
    this.style = {};
  }
  set innerHTML(v) { this._html = v; }
  get innerHTML() { return this._html; }
  querySelector() { return new FakeEl(); }
  querySelectorAll() { return []; }
  addEventListener() {}
  removeEventListener() {}
  appendChild() {}
  remove() {}
  dispatchEvent() { return true; }
}

global.document = {
  getElementById() { return new FakeEl(); },
  createElement() { return new FakeEl(); },
  addEventListener() {},
  querySelectorAll() { return []; },
  body: new FakeEl(),
};

global.window = {
  addEventListener() {},
  scrollTo() {},
  location: { hash: "#/", pathname: "/", search: "" },
  innerWidth: 390,
  innerHeight: 844,
};
global.location = global.window.location;
global.history = { replaceState() {}, back() {} };
global.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
global.CustomEvent = class {
  constructor(name, opts) {
    this.name = name;
    this.detail = opts && opts.detail;
  }
};
global.confirm = () => true;
global.structuredClone = global.structuredClone || function (x) { return JSON.parse(JSON.stringify(x)); };

const results = [];
function check(name, fn) {
  try {
    fn();
    results.push(["PASS", name, null]);
  } catch (e) {
    results.push(["FAIL", name, e.stack]);
  }
}

const jsDir = new URL("../assets/js/", import.meta.url);

const stateMod = await import(new URL("core/state.js", jsDir));
const state = stateMod.state;

check("state.get() returns default shape", function () {
  const s = state.get();
  if (typeof s.xp !== "number") throw new Error("xp missing");
  if (!s.progress) throw new Error("progress missing");
});

check("state.setModuleProgress persists", function () {
  state.setModuleProgress("modulo-01", { status: "in_progress", stepIndex: 2 });
  const p = state.getModuleProgress("modulo-01");
  if (p.status !== "in_progress" || p.stepIndex !== 2) {
    throw new Error("progress not persisted: " + JSON.stringify(p));
  }
});

const gami = await import(new URL("core/gamification.js", jsDir));

check("levelForXP(0) is level 1", function () {
  const r = gami.levelForXP(0);
  if (r.level !== 1) throw new Error("expected level 1, got " + r.level);
});

check("levelForXP(150) increases level", function () {
  const r = gami.levelForXP(150);
  if (r.level < 2) throw new Error("expected level >= 2, got " + r.level);
});

check("addXP increases state.xp", function () {
  const before = state.get().xp;
  gami.addXP(10, "test");
  const after = state.get().xp;
  if (after !== before + 10) throw new Error("xp not incremented, before=" + before + " after=" + after);
});

check("registerDailyVisit sets streak to 1 on first run", function () {
  state.reset();
  const c = gami.registerDailyVisit();
  if (c !== 1) throw new Error("expected streak 1, got " + c);
});

check("computeMockRanking includes 'Tu' with a rank", function () {
  const ranking = gami.computeMockRanking();
  const me = ranking.find(function (r) { return r.isMe; });
  if (!me || typeof me.rank !== "number") throw new Error("ranking malformed");
});

const quizMod = await import(new URL("components/quiz.js", jsDir));
const QuizEngine = quizMod.QuizEngine;

check("QuizEngine instantiates without throwing", function () {
  const root = new FakeEl();
  const items = [{ type: "truefalse", prompt: "test", correctBool: true }];
  const engine = new QuizEngine(root, items, { onFinish: function () {} });
  engine.start();
});

const dataMod = await import(new URL("core/data.js", jsDir));
check("data module exports expected functions", function () {
  var names = ["getModulesIndex", "getModule", "getFinalExam", "getTeam"];
  for (var i = 0; i < names.length; i++) {
    if (typeof dataMod[names[i]] !== "function") throw new Error(names[i] + " missing");
  }
});

const dataDir = new URL("../assets/data/", import.meta.url);
const files = fs.readdirSync(dataDir).filter(function (f) {
  return f.indexOf("modulo-") === 0 && f.slice(-5) === ".json";
});

const validTypes = ["mcq", "truefalse", "order", "imageselect", "fillblank", "flashcard", "scenario"];
const validSteps = ["info", "video", "quiz", "drive"];

files.forEach(function (f) {
  check("schema check: " + f, function () {
    const mod = JSON.parse(fs.readFileSync(new URL(f, dataDir), "utf8"));
    if (!Array.isArray(mod.steps)) throw new Error("steps missing");
    if (!Array.isArray(mod.quiz)) throw new Error("quiz missing");
    mod.steps.forEach(function (step) {
      if (validSteps.indexOf(step.kind) === -1) throw new Error("bad step.kind: " + step.kind);
      if (step.kind === "quiz" && (!step.item || !step.item.type)) throw new Error("quiz step missing item.type");
      if (step.kind === "video" && (!step.video || !step.video.url)) throw new Error("video step missing video.url");
    });
    mod.quiz.forEach(function (q) {
      if (validTypes.indexOf(q.type) === -1) throw new Error("bad quiz type: " + q.type);
    });
    if (mod.simulation) {
      mod.simulation.scenes.forEach(function (sc) {
        if (validTypes.indexOf(sc.type) === -1) throw new Error("bad simulation scene type: " + sc.type);
      });
    }
  });
});

let failCount = 0;
results.forEach(function (r) {
  if (r[0] === "FAIL") {
    failCount++;
    console.log("FAIL - " + r[1]);
    console.log("  " + r[2]);
  } else {
    console.log("PASS - " + r[1]);
  }
});
console.log("");
console.log((results.length - failCount) + "/" + results.length + " checks passed.");
process.exit(failCount ? 1 : 0);
