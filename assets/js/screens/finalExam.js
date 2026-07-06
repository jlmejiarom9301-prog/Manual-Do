/**
 * finalExam.js — Evaluación final (12 preguntas) + checklist de cierre,
 * replicando fielmente las instrucciones de la página 73 del manual oficial.
 */
import { state } from "../core/state.js";
import { getFinalExam } from "../core/data.js";
import { onFinalExamPassed } from "../core/gamification.js";
import { fireConfetti } from "../components/confetti.js";
import { QuizEngine } from "../components/quiz.js";
import { topbar, mountTopbar } from "../components/ui.js";
import { router } from "../app.js";

const PASS_PCT = 70;

export async function renderFinalExam() {
  const s = state.get();
  if (s.finalExam.attempted) {
    return renderResult(s.finalExam);
  }
  return `
  ${topbar("Evaluación final", { back: true })}
  <div class="screen">
    <h2>¡Hora de poner a prueba tus conocimientos!</h2>
    <p>Terminaste tu capacitación por medio de este manual. ¡Felicidades! Antes de comenzar, ten en cuenta lo siguiente:</p>
    <div class="stack mb-6">
      <div class="callout callout-info"><span>📋</span><span>Consta de <strong>12 preguntas</strong> de opción múltiple.</span></div>
      <div class="callout callout-info"><span>📝</span><span>Puedes utilizar tus apuntes para apoyarte.</span></div>
      <div class="callout callout-warn"><span>⚠️</span><span>Solo puedes realizar la evaluación <strong>una vez</strong>.</span></div>
    </div>
    <div class="card mb-6">
      <label class="hstack mb-4"><input type="checkbox" data-check="manual" style="width:20px;height:20px" /> He leído en su totalidad este manual.</label>
      <label class="hstack"><input type="checkbox" data-check="medios" style="width:20px;height:20px" /> Cuento con los medios de comunicación y atención al personal.</label>
    </div>
    <button class="btn btn-accent btn-block" data-start-exam disabled>Comenzar evaluación</button>
  </div>`;
}

function renderResult(finalExam) {
  const passed = finalExam.passed;
  return `
  ${topbar("Resultado", { back: true })}
  <div class="screen text-center">
    <div style="font-size:64px;margin-top:16px">${passed ? "🎉" : "📌"}</div>
    <h2>${passed ? "¡Aprobaste tu evaluación!" : "Casi lo logras"}</h2>
    <p class="text-muted">Calificación: ${finalExam.score}%</p>
    ${
      passed
        ? `<button class="btn btn-accent btn-block mt-6" data-go-cert>Ver mi constancia DC-3 →</button>`
        : `<div class="callout callout-danger mt-4"><span>Consulta a tu reclutador para conocer los siguientes pasos.</span></div>`
    }
  </div>`;
}

export function mountFinalExam(root) {
  mountTopbar(root);

  const checks = root.querySelectorAll("[data-check]");
  const startBtn = root.querySelector("[data-start-exam]");
  if (checks.length && startBtn) {
    const update = () => {
      const all = Array.from(checks).every((c) => c.checked);
      startBtn.disabled = !all;
    };
    checks.forEach((c) => c.addEventListener("change", update));
    startBtn.addEventListener("click", async () => {
      const exam = await getFinalExam();
      runExam(exam);
    });
  }

  const goCert = root.querySelector("[data-go-cert]");
  if (goCert) goCert.addEventListener("click", () => router.go("/constancia"));
}

async function runExam(exam) {
  const appRoot = document.getElementById("app-root");
  appRoot.innerHTML = `${topbar("Evaluación final")}<div class="screen"><div data-exam-mount></div></div>`;
  const mount = appRoot.querySelector("[data-exam-mount]");
  const engine = new QuizEngine(mount, exam.questions, {
    onFinish: (correct, total, pct) => {
      const passed = pct >= PASS_PCT;
      state.update((draft) => {
        draft.finalExam = { attempted: true, passed, score: pct, answers: null, selfieConfirmed: false };
      });
      if (passed) {
        onFinalExamPassed();
        fireConfetti(2400);
      }
      appRoot.innerHTML = `${topbar("Resultado")}<div class="screen text-center">
        <div style="font-size:64px;margin-top:16px">${passed ? "🎉" : "📌"}</div>
        <h2>${passed ? "¡Aprobaste tu evaluación!" : "Casi lo logras"}</h2>
        <p class="text-muted">Calificación: ${pct}% (${correct}/${total} correctas)</p>
        ${
          passed
            ? `<button class="btn btn-accent btn-block mt-6" data-go-cert>Ver mi constancia DC-3 →</button>`
            : `<div class="callout callout-danger mt-4"><span>Consulta a tu reclutador para conocer los siguientes pasos.</span></div>
               <button class="btn btn-ghost btn-block mt-4" data-go-home>Volver al inicio</button>`
        }
      </div>`;
      const goCert = appRoot.querySelector("[data-go-cert]");
      if (goCert) goCert.addEventListener("click", () => router.go("/constancia"));
      const goHome = appRoot.querySelector("[data-go-home]");
      if (goHome) goHome.addEventListener("click", () => router.go("/"));
    },
  });
  engine.start();
}
