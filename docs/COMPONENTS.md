# Catálogo de componentes (Design System)

Todos los estilos usan los tokens definidos en `assets/css/tokens.css` — nunca colores "quemados". Si necesitas un nuevo tono, agrégalo ahí primero.

## Tokens principales

```css
--color-primary       /* azul institucional */
--color-accent        /* dorado institucional */
--color-bg            /* gris muy claro de fondo */
--color-surface       /* blanco (tarjetas) */
--radius-md / --radius-lg / --radius-pill
--shadow-sm / --shadow-md / --shadow-lg
--sp-1 ... --sp-16    /* escala de espaciado en base 4px */
```

## Botones

```html
<button class="btn btn-primary">Continuar</button>
<button class="btn btn-accent">Acción destacada</button>
<button class="btn btn-ghost">Secundario</button>
<button class="btn btn-primary btn-block">Ancho completo</button>
```

## Cards

```html
<div class="card">Contenido</div>
<div class="card card-interactive">Se eleva al pasar el mouse / se puede usar como botón</div>
```

Tarjeta de módulo (usa `assets/js/components/ui.js#moduleCardHTML`):

```js
import { moduleCardHTML } from "./components/ui.js";
moduleCardHTML(moduleData, progressData);
```

## Video Player

```js
import { renderVideoBlockFull, mountVideoBlocks } from "./components/videoPlayer.js";

container.innerHTML = renderVideoBlockFull({
  id: "video-x", title: "Mi video", provider: "youtube",
  url: "https://www.youtube.com/watch?v=XXXX",
  poster: "assets/images/photos/mi-foto.jpg",
  qr: "assets/images/qr/mi-video.png",
});
mountVideoBlocks(container); // conecta el botón de play y el toggle de QR
```

## Motor de Quiz

```js
import { QuizEngine } from "./components/quiz.js";

const engine = new QuizEngine(containerEl, arrayDeItems, {
  onFinish: (correctas, total, porcentaje) => { /* ... */ },
});
engine.start();
```

Ver `docs/ADD_MODULES.md` para el esquema completo de cada tipo de pregunta.

## Toast (notificaciones flotantes)

```js
import { toast } from "./components/toast.js";
toast("+10 XP", "xp");           // tipos: xp, achievement, levelup, info
```

## Confeti

```js
import { fireConfetti } from "./components/confetti.js";
fireConfetti(); // se dispara al completar un módulo, simulación o la evaluación final
```

## Topbar / Tabbar / Progress Ring

```js
import { topbar, tabbar, mountTabbar, mountTopbar, progressRing } from "./components/ui.js";

html = topbar("Título de la pantalla", { back: true }) + tabbar("/ruta-activa");
mountTopbar(root); mountTabbar(root);

progressRing(72); // anillo de progreso circular, 72%
```

## Callouts / Alerts

```html
<div class="callout callout-info"><span>ℹ️</span><span>Mensaje informativo</span></div>
<div class="callout callout-warn"><span>⚠️</span><span>Advertencia</span></div>
<div class="callout callout-danger"><span>🚫</span><span>Error o riesgo</span></div>
<div class="callout callout-success"><span>✅</span><span>Éxito</span></div>
```

## Chips / Badges

```html
<span class="chip">⏱ 10 min</span>
<span class="chip chip-gold">⚡ 100 XP</span>
```

## Accordion (disponible en CSS, útil para FAQs futuras)

```html
<div class="accordion-item is-open">
  <div class="accordion-item__head">Pregunta <span class="accordion-item__chevron">⌄</span></div>
  <div class="accordion-item__body">Respuesta...</div>
</div>
```//conmutar la clase `is-open` con JS al hacer clic en `.accordion-item__head`.

## Timeline

```html
<div class="timeline">
  <div class="timeline-item is-done">Paso 1</div>
  <div class="timeline-item">Paso 2</div>
</div>
```

## Principios de uso

1. **Reutiliza antes de crear.** Si necesitas un nuevo tipo de tarjeta, revisa primero si `.card`, `.callout` o `.module-card` ya resuelven el caso con una variante.
2. **Toda animación pasa por `assets/css/animations.css`.** No agregues `@keyframes` sueltos en otros archivos.
3. **Mobile-first siempre.** Diseña primero a 390px, luego revisa 430px y escritorio (el layout ya escala solo gracias a `--app-max-width`).
