/**
 * quiz.js
 * -----------------------------------------------------------------------
 * Motor de preguntas reutilizable. Soporta múltiples formatos dinámicos
 * para evitar el "quiz aburrido" de opción múltiple tradicional:
 *
 *   mcq          -> opción múltiple clásica (con letras A/B/C)
 *   truefalse    -> verdadero / falso
 *   order        -> ordenar pasos (subir/bajar, apto para touch)
 *   imageselect  -> seleccionar la imagen/tarjeta correcta
 *   fillblank    -> completar el espacio (banco de palabras clicable)
 *   flashcard    -> tarjeta de estudio con flip (sin calificar)
 *   scenario     -> storytelling: escenario + decisión + retroalimentación
 *
 * Uso:
 *   const engine = new QuizEngine(containerEl, items, { onFinish(score, total) });
 *   engine.start();
 * -----------------------------------------------------------------------
 */
import { onQuizAnswer, onQuizFinished } from "../core/gamification.js";

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const LETTERS = ["A", "B", "C", "D", "E", "F"];

export class QuizEngine {
  constructor(root, items, opts = {}) {
    this.root = root;
    this.items = items;
    this.index = 0;
    this.correctCount = 0;
    this.gradableCount = items.filter((i) => i.type !== "flashcard").length || items.length;
    this.opts = opts;
    this._timerHandle = null;
  }

  start() {
    this._renderCurrent();
  }

  _progressHTML() {
    return `<div class="progress-steps mb-4">${this.items
      .map((_, i) => {
        const cls = i < this.index ? "is-done" : i === this.index ? "is-current" : "";
        return `<div class="progress-steps__dot ${cls}"></div>`;
      })
      .join("")}</div>`;
  }

  _finish() {
    clearInterval(this._timerHandle);
    const pct = Math.round((this.correctCount / this.gradableCount) * 100);
    onQuizFinished(pct);
    if (this.opts.onFinish) this.opts.onFinish(this.correctCount, this.gradableCount, pct);
  }

  _next(wasCorrect) {
    clearInterval(this._timerHandle);
    if (wasCorrect) this.correctCount += 1;
    this.index += 1;
    if (this.index >= this.items.length) {
      this._finish();
    } else {
      this._renderCurrent();
    }
  }

  _renderCurrent() {
    const item = this.items[this.index];
    this.root.innerHTML = this._progressHTML() + `<div data-quiz-item></div>`;
    const mount = this.root.querySelector("[data-quiz-item]");
    const renderers = {
      mcq: () => this._renderMCQ(mount, item),
      truefalse: () => this._renderTrueFalse(mount, item),
      order: () => this._renderOrder(mount, item),
      imageselect: () => this._renderImageSelect(mount, item),
      fillblank: () => this._renderFillBlank(mount, item),
      flashcard: () => this._renderFlashcard(mount, item),
      scenario: () => this._renderScenario(mount, item),
    };
    (renderers[item.type] || renderers.mcq)();
    if (item.timerSeconds) this._startTimer(item.timerSeconds);
  }

  _startTimer(seconds) {
    const circumference = 2 * Math.PI * 22;
    let remaining = seconds;
    const el = this.root.querySelector("[data-chrono-fill]");
    const num = this.root.querySelector("[data-chrono-num]");
    if (!el) return;
    this._timerHandle = setInterval(() => {
      remaining -= 1;
      const frac = Math.max(remaining, 0) / seconds;
      el.style.strokeDashoffset = String(circumference * (1 - frac));
      if (num) num.textContent = String(Math.max(remaining, 0));
      if (remaining <= 0) {
        clearInterval(this._timerHandle);
        const answerEls = this.root.querySelectorAll("[data-lock-on-timeout]");
        answerEls.forEach((n) => (n.disabled = true));
        const feedback = document.createElement("div");
        feedback.className = "feedback-box feedback-box--incorrect";
        feedback.textContent = "⏱ Se acabó el tiempo. Continuemos.";
        this.root.querySelector("[data-quiz-item]").appendChild(feedback);
        setTimeout(() => this._next(false), 1400);
      }
    }, 1000);
  }

  _chronoBadge(seconds) {
    if (!seconds) return "";
    const circumference = 2 * Math.PI * 22;
    return `<div class="chrono-ring mb-4" style="margin-left:auto">
      <svg width="54" height="54">
        <circle class="chrono-ring__bg" cx="27" cy="27" r="22" stroke-width="5"></circle>
        <circle data-chrono-fill class="chrono-ring__fill" cx="27" cy="27" r="22" stroke-width="5"
          stroke-dasharray="${circumference}" stroke-dashoffset="0"></circle>
      </svg>
      <div class="chrono-ring__num"><span data-chrono-num>${seconds}</span></div>
    </div>`;
  }

  _wrapHeader(item) {
    return `<div class="hstack mb-2">
      <span class="step-badge">${this._typeLabel(item.type)}</span>
      ${item.timerSeconds ? this._chronoBadge(item.timerSeconds) : ""}
    </div>
    <h3 class="mb-4">${item.prompt || item.scene || ""}</h3>`;
  }

  _typeLabel(type) {
    return (
      {
        mcq: "Opción múltiple",
        truefalse: "Verdadero o falso",
        order: "Ordena los pasos",
        imageselect: "Selecciona la imagen",
        fillblank: "Completa el enunciado",
        flashcard: "Flash card",
        scenario: "Escenario",
      }[type] || "Pregunta"
    );
  }

  _feedback(mount, correct, text) {
    const box = document.createElement("div");
    box.className = `feedback-box ${correct ? "feedback-box--correct" : "feedback-box--incorrect"}`;
    box.textContent = text || (correct ? "¡Correcto! Bien hecho." : "No es correcto, revisemos.");
    mount.appendChild(box);
    const btn = document.createElement("button");
    btn.className = "btn btn-primary btn-block mt-4";
    btn.textContent = "Continuar";
    btn.onclick = () => this._next(correct);
    mount.appendChild(btn);
  }

  _renderMCQ(mount, item) {
    const options = item.shuffle === false ? item.options : shuffle(item.options);
    mount.innerHTML =
      this._wrapHeader(item) +
      options
        .map(
          (opt, i) => `<div class="quiz-option" data-opt="${opt.id}" data-lock-on-timeout>
        <span class="quiz-option__letter">${LETTERS[i]}</span><span>${opt.text}</span>
      </div>`
        )
        .join("");
    mount.querySelectorAll("[data-opt]").forEach((el) => {
      el.addEventListener("click", () => {
        if (mount.dataset.locked) return;
        mount.dataset.locked = "1";
        const correct = el.dataset.opt === item.correctId;
        el.classList.add(correct ? "is-correct" : "is-incorrect");
        if (!correct) {
          const correctEl = mount.querySelector(`[data-opt="${item.correctId}"]`);
          if (correctEl) correctEl.classList.add("is-correct");
        }
        onQuizAnswer(correct);
        this._feedback(mount, correct, item.explanation);
      });
    });
  }

  _renderTrueFalse(mount, item) {
    mount.innerHTML =
      this._wrapHeader(item) +
      `<div class="truefalse-row">
        <button class="truefalse-btn truefalse-btn--true" data-val="true" data-lock-on-timeout>Verdadero</button>
        <button class="truefalse-btn truefalse-btn--false" data-val="false" data-lock-on-timeout>Falso</button>
      </div>`;
    mount.querySelectorAll(".truefalse-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (mount.dataset.locked) return;
        mount.dataset.locked = "1";
        const val = btn.dataset.val === "true";
        const correct = val === item.correctBool;
        btn.classList.add("is-selected");
        onQuizAnswer(correct);
        this._feedback(mount, correct, item.explanation);
      });
    });
  }

  _renderOrder(mount, item) {
    let order = shuffle(item.steps);
    const draw = () => {
      mount.innerHTML =
        this._wrapHeader(item) +
        `<div class="order-list" data-order-list>` +
        order
          .map(
            (s, i) => `<div class="order-item" draggable="true" data-id="${s.id}">
            <span class="order-item__num">${i + 1}</span>
            <span>${s.text}</span>
            <span class="order-item__updown">
              <button type="button" data-move="up" data-id="${s.id}">▲</button>
              <button type="button" data-move="down" data-id="${s.id}">▼</button>
            </span>
          </div>`
          )
          .join("") +
        `</div><button class="btn btn-primary btn-block mt-4" data-check-order>Verificar orden</button>`;

      mount.querySelectorAll("[data-move]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = btn.dataset.id;
          const dir = btn.dataset.move;
          const idx = order.findIndex((s) => s.id === id);
          const swapWith = dir === "up" ? idx - 1 : idx + 1;
          if (swapWith < 0 || swapWith >= order.length) return;
          [order[idx], order[swapWith]] = [order[swapWith], order[idx]];
          draw();
        });
      });
      mount.querySelector("[data-check-order]").addEventListener("click", () => {
        const correct = order.every((s, i) => s.id === item.steps[i].id);
        onQuizAnswer(correct);
        mount.querySelectorAll("[data-move]").forEach((b) => (b.disabled = true));
        this._feedback(mount, correct, item.explanation);
      });
    };
    draw();
  }

  _renderImageSelect(mount, item) {
    mount.innerHTML =
      this._wrapHeader(item) +
      `<div class="imgselect-grid">` +
      item.options
        .map(
          (opt) => `<div class="imgselect-card" data-opt="${opt.id}">
          <img src="${opt.img}" alt="${opt.label}" loading="lazy"/>
          <div class="imgselect-card__label">${opt.label}</div>
        </div>`
        )
        .join("") +
      `</div>`;
    mount.querySelectorAll("[data-opt]").forEach((el) => {
      el.addEventListener("click", () => {
        if (mount.dataset.locked) return;
        mount.dataset.locked = "1";
        const correct = el.dataset.opt === item.correctId;
        el.classList.add(correct ? "is-correct" : "is-incorrect");
        if (!correct) mount.querySelector(`[data-opt="${item.correctId}"]`).classList.add("is-correct");
        onQuizAnswer(correct);
        this._feedback(mount, correct, item.explanation);
      });
    });
  }

  _renderFillBlank(mount, item) {
    const parts = item.template.split("___");
    const bank = shuffle(item.wordbank || [item.answer]);
    mount.innerHTML =
      this._wrapHeader(item) +
      `<p style="font-size:var(--fs-lg);font-weight:600">${parts[0]}<span class="fillblank-input" data-blank>____</span>${
        parts[1] || ""
      }</p>
      <div class="wordbank">${bank
        .map((w) => `<div class="wordbank__chip" data-word="${w}">${w}</div>`)
        .join("")}</div>`;
    const blank = mount.querySelector("[data-blank]");
    mount.querySelectorAll("[data-word]").forEach((chip) => {
      chip.addEventListener("click", () => {
        if (mount.dataset.locked) return;
        mount.dataset.locked = "1";
        blank.textContent = chip.dataset.word;
        const correct = chip.dataset.word.trim().toLowerCase() === item.answer.trim().toLowerCase();
        blank.style.color = correct ? "var(--color-success)" : "var(--color-danger)";
        onQuizAnswer(correct);
        this._feedback(mount, correct, item.explanation);
      });
    });
  }

  _renderFlashcard(mount, item) {
    mount.innerHTML = `
      ${this._wrapHeader({ ...item, prompt: "" })}
      <div class="flashcard" data-flip>
        <div class="flashcard__inner">
          <div class="flashcard__face flashcard__face--front">${item.front}</div>
          <div class="flashcard__face flashcard__face--back">${item.back}</div>
        </div>
      </div>
      <button class="btn btn-primary btn-block mt-4" data-continue>Ya la vi, continuar</button>
    `;
    mount.querySelector("[data-flip]").addEventListener("click", (e) => {
      e.currentTarget.classList.toggle("is-flipped");
    });
    mount.querySelector("[data-continue]").addEventListener("click", () => this._next(true));
  }

  _renderScenario(mount, item) {
    mount.innerHTML = `
      <span class="step-badge">${this._typeLabel("scenario")}</span>
      <div class="story-scene mt-2">
        <div class="story-scene__tag">Situación</div>
        <div class="story-scene__text">${item.scene}</div>
      </div>
      <div class="story-choice">
        ${item.choices
          .map((c) => `<button class="story-choice__btn" data-choice="${c.id}">${c.text}</button>`)
          .join("")}
      </div>
    `;
    mount.querySelectorAll("[data-choice]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (mount.dataset.locked) return;
        mount.dataset.locked = "1";
        const choice = item.choices.find((c) => c.id === btn.dataset.choice);
        btn.classList.add(choice.correct ? "chosen-good" : "chosen-bad");
        mount.querySelectorAll("[data-choice]").forEach((b) => (b.style.pointerEvents = "none"));
        onQuizAnswer(!!choice.correct);
        this._feedback(mount, !!choice.correct, choice.feedback);
      });
    });
  }
}
