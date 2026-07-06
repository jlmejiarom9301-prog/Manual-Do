/**
 * moduleRunner.js
 * -----------------------------------------------------------------------
 * Motor de microlearning: recorre module.steps paso a paso siguiendo el
 * patrón pedido — bloque corto de info → interacción → video → quiz →
 * continuar — y al final aplica la simulación (si el módulo la tiene) y
 * el mini-quiz de cierre del módulo. Guarda avance real en cada paso.
 * -----------------------------------------------------------------------
 */
import { state } from "../core/state.js";
import { onStepComplete, onModuleComplete, onSimulationComplete } from "../core/gamification.js";
import { renderVideoBlockFull, mountVideoBlocks } from "../components/videoPlayer.js";
import { QuizEngine } from "../components/quiz.js";
import { fireConfetti } from "../components/confetti.js";
import { router } from "../app.js";
import { getModulesIndex } from "../core/data.js";

export class ModuleRunner {
  constructor(root, mod) {
    this.root = root;
    this.mod = mod;
    this.progress = state.getModuleProgress(mod.id);
    this.stepIndex = Math.min(this.progress.stepIndex || 0, mod.steps.length);
    this.phase = this.stepIndex >= mod.steps.length ? (mod.simulation ? "simulation" : "quiz") : "steps";
    this._sessionStart = Date.now();
  }

  start() {
    state.setModuleProgress(this.mod.id, { status: "in_progress" });
    state.setLastActivity({ moduleId: this.mod.id, label: `Continuando ${this.mod.title}` });
    this._render();
  }

  _saveTime() {
    const secs = Math.round((Date.now() - this._sessionStart) / 1000);
    state.addTimeSpent(secs, this.mod.id);
    this._sessionStart = Date.now();
  }

  _render() {
    if (this.phase === "steps") return this._renderStep();
    if (this.phase === "simulation") return this._renderSimulationIntro();
    if (this.phase === "quiz") return this._renderQuizIntro();
    if (this.phase === "done") return this._renderComplete();
  }

  _headerHTML() {
    const total = this.mod.steps.length + (this.mod.simulation ? 1 : 0) + 1;
    const doneCount =
      this.phase === "steps"
        ? this.stepIndex
        : this.phase === "simulation"
        ? this.mod.steps.length
        : this.mod.steps.length + (this.mod.simulation ? 1 : 0);
    const pct = Math.round((doneCount / total) * 100);
    return `
    <div class="lesson-header">
      <button class="topbar__back" data-exit-runner aria-label="Salir"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
      <div class="progress"><div class="progress__fill" style="width:${pct}%"></div></div>
    </div>`;
  }

  _bindExit() {
    const btn = this.root.querySelector("[data-exit-runner]");
    if (btn) btn.addEventListener("click", () => {
      this._saveTime();
      router.go(`/modulo/${this.mod.id}`);
    });
  }

  _renderStep() {
    const step = this.mod.steps[this.stepIndex];
    this.root.innerHTML = `<div class="screen">${this._headerHTML()}<div data-step-body></div></div>`;
    this._bindExit();
    const body = this.root.querySelector("[data-step-body]");

    if (step.kind === "info") this._renderInfoStep(body, step);
    else if (step.kind === "video") this._renderVideoStep(body, step);
    else if (step.kind === "quiz") this._renderQuizStep(body, step);
    else if (step.kind === "drive") this._renderDriveStep(body, step);
  }

  _renderDriveStep(body, step) {
    body.innerHTML = `
      <span class="step-badge">Recurso en Google Drive</span>
      <h3 class="mb-4">${step.title}</h3>
      <p>${step.body || ""}</p>
      <div class="qr-inline mb-4">
        <img src="${step.qr}" alt="QR ${step.title}" loading="lazy" />
        <div>
          <strong>Escanea o da clic para acceder</strong>
          <p class="text-muted mt-2" style="font-size:var(--fs-sm);margin:0"><a href="${step.url}" target="_blank" rel="noopener">Abrir carpeta de Google Drive ↗</a></p>
        </div>
      </div>
      <button class="btn btn-primary btn-block mt-2" data-continue>Continuar</button>
    `;
    body.querySelector("[data-continue]").addEventListener("click", () => this._advanceStep());
  }

  _renderInfoStep(body, step) {
    body.innerHTML = `
      <span class="step-badge">${step.eyebrow || "Micro-lección"}</span>
      ${step.image ? `<div class="hero mb-4" style="min-height:170px;background-image:url('${step.image}')"><div class="hero__content"></div></div>` : ""}
      <h3>${step.title}</h3>
      <div class="stack">${(step.bullets || []).map((b) => `<div class="callout callout-info"><span>${b}</span></div>`).join("")}</div>
      <p class="mt-4">${step.body || ""}</p>
      <button class="btn btn-primary btn-block mt-6" data-continue>Continuar</button>
    `;
    body.querySelector("[data-continue]").addEventListener("click", () => this._advanceStep());
  }

  _renderVideoStep(body, step) {
    body.innerHTML = `
      <span class="step-badge">Video institucional</span>
      <h3 class="mb-4">${step.title}</h3>
      ${renderVideoBlockFull(step.video)}
      ${step.caption ? `<p class="mt-4 text-muted">${step.caption}</p>` : ""}
      <button class="btn btn-primary btn-block mt-6" data-continue>Ya vi el video, continuar</button>
    `;
    mountVideoBlocks(body);
    body.querySelector("[data-continue]").addEventListener("click", () => this._advanceStep());
  }

  _renderQuizStep(body, step) {
    body.innerHTML = `<h3 class="mb-4">${step.title || "Pon a prueba lo aprendido"}</h3><div data-quiz-mount></div>`;
    const mount = body.querySelector("[data-quiz-mount]");
    const engine = new QuizEngine(mount, [step.item], {
      onFinish: () => this._advanceStep(),
    });
    engine.start();
  }

  _advanceStep() {
    onStepComplete();
    this.progress.completedSteps = [...new Set([...(this.progress.completedSteps || []), this.stepIndex])];
    this.stepIndex += 1;
    state.setModuleProgress(this.mod.id, { stepIndex: this.stepIndex, completedSteps: this.progress.completedSteps });
    if (this.stepIndex >= this.mod.steps.length) {
      this.phase = this.mod.simulation ? "simulation" : "quiz";
    }
    this._render();
  }

  _renderSimulationIntro() {
    const sim = this.mod.simulation;
    this.root.innerHTML = `<div class="screen">${this._headerHTML()}
      <span class="step-badge">Simulación</span>
      <h2>${sim.title}</h2>
      <p>${sim.intro}</p>
      <div class="callout callout-warn mb-4"><span>🎮 Toma decisiones reales. Cada elección tiene retroalimentación inmediata.</span></div>
      <button class="btn btn-accent btn-block" data-start-sim>Iniciar simulación</button>
    </div>`;
    this._bindExit();
    this.root.querySelector("[data-start-sim]").addEventListener("click", () => this._renderSimulationRun());
  }

  _renderSimulationRun() {
    const sim = this.mod.simulation;
    this.root.innerHTML = `<div class="screen">${this._headerHTML()}<div data-sim-mount></div></div>`;
    this._bindExit();
    const mount = this.root.querySelector("[data-sim-mount]");
    const engine = new QuizEngine(mount, sim.scenes, {
      onFinish: (correct, total) => {
        onSimulationComplete();
        this.phase = "quiz";
        this._simResult = { correct, total };
        this._render();
      },
    });
    engine.start();
  }

  _renderQuizIntro() {
    this.root.innerHTML = `<div class="screen">${this._headerHTML()}
      <span class="step-badge">Evaluación del módulo</span>
      <h2>¡Último paso!</h2>
      <p>Responde estas preguntas para cerrar el módulo <strong>${this.mod.title}</strong>.</p>
      <button class="btn btn-primary btn-block" data-start-quiz>Comenzar evaluación</button>
    </div>`;
    this._bindExit();
    this.root.querySelector("[data-start-quiz]").addEventListener("click", () => this._renderQuizRun());
  }

  _renderQuizRun() {
    this.root.innerHTML = `<div class="screen">${this._headerHTML()}<div data-quiz-mount></div></div>`;
    this._bindExit();
    const mount = this.root.querySelector("[data-quiz-mount]");
    const engine = new QuizEngine(mount, this.mod.quiz, {
      onFinish: (correct, total, pct) => {
        this._quizResult = { correct, total, pct };
        this.phase = "done";
        this._saveTime();
        state.setModuleProgress(this.mod.id, {
          status: "completed",
          quizScore: pct,
          quizPassed: pct >= 70,
          stepIndex: this.mod.steps.length,
        });
        this._render();
      },
    });
    engine.start();
  }

  async _renderComplete() {
    const modules = await getModulesIndex();
    const completedCount = modules.filter((m) => state.getModuleProgress(m.id).status === "completed").length;
    onModuleComplete(modules.length, completedCount);
    fireConfetti();
    this.root.innerHTML = `<div class="screen text-center">
      <div class="animate-float" style="font-size:64px;margin-top:24px">🏅</div>
      <h2>¡Módulo completado!</h2>
      <p class="text-muted">${this.mod.title}</p>
      <div class="card mt-6">
        <div class="stat-grid">
          <div class="stat-card"><strong>${this._quizResult?.pct ?? "-"}%</strong><span>Evaluación</span></div>
          <div class="stat-card"><strong>${completedCount}/${modules.length}</strong><span>Módulos</span></div>
          <div class="stat-card"><strong>${state.get().xp}</strong><span>XP total</span></div>
        </div>
      </div>
      <button class="btn btn-primary btn-block mt-6" data-back-modules>Volver a módulos</button>
      <button class="btn btn-ghost btn-block mt-2" data-go-dashboard>Ir al panel</button>
    </div>`;
    this.root.querySelector("[data-back-modules]").addEventListener("click", () => router.go("/modulos"));
    this.root.querySelector("[data-go-dashboard]").addEventListener("click", () => router.go("/"));
  }
}
