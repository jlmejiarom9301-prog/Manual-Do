# Arquitectura

## Principios

1. **Sin build step.** HTML + CSS + JS ES6 (módulos nativos del navegador). Corre directo en GitHub Pages, sin Node, sin bundlers.
2. **Contenido separado del código.** Cada módulo vive en `assets/data/*.json`. Un capacitador o content designer puede editar/agregar contenido sin tocar una sola línea de JavaScript.
3. **Una sola capa de acceso a datos y una sola capa de estado.** Todo pasa por `core/data.js` y `core/state.js`. El día que haya una API real o Azure AD, solo esos dos archivos cambian — nada más en el proyecto necesita enterarse.
4. **Componentes, no copy-paste.** Video player, quiz engine, tarjetas, barras de progreso, etc. son piezas reutilizables en `assets/js/components/` y `assets/css/components.css`.

## Mapa de carpetas

```
core/
  router.js          SPA hash-router (sin dependencias)
  state.js            Única fuente de verdad persistida en localStorage
  gamification.js      XP, niveles, racha, logros, ranking (mock)
  data.js              fetch() de JSON — punto único para migrar a API real

components/
  ui.js                topbar, tabbar, progress ring, module card
  quiz.js              QuizEngine: mcq, truefalse, order, imageselect, fillblank, flashcard, scenario
  videoPlayer.js       Reproductor embebido (YouTube/Drive) + QR alterno
  toast.js             Notificaciones flotantes (XP, logros, nivel)
  confetti.js          Efecto de celebración en Canvas puro

screens/
  home.js              Dashboard
  moduleList.js        Selector de los 9 módulos
  moduleIntro.js        Detalle de un módulo antes de iniciar
  moduleRunner.js        Motor de microlearning (recorre los "steps" de un módulo)
  achievements.js         Logros + ranking
  profile.js              Perfil + contacto de capacitación
  finalExam.js            Evaluación final (12 preguntas)
  certificate.js           Constancia DC-3

data/
  modules.json            Índice de los 9 módulos (metadatos ligeros)
  modulo-0X.json           Contenido completo de cada módulo
  final-exam.json          Preguntas de la evaluación final
  team.json                Equipo de capacitación
```

## Flujo de una pantalla

1. `app.js` registra rutas: `router.register('/modulo/:id', route(renderFn, mountFn))`.
2. El usuario navega (`router.go('/modulo/modulo-01')` o clic con `data-nav`).
3. `renderFn(params)` hace `fetch()` del JSON necesario (vía `core/data.js`) y regresa un **string de HTML**.
4. El router inyecta ese HTML en `#app-root` y dispara el evento `route:rendered`.
5. `mountFn(root, params)` se ejecuta después del render: aquí se agregan los `addEventListener`.

Este patrón (render = string, mount = listeners) es intencional: mantiene el HTML declarativo y fácil de leer, y separa "qué se ve" de "qué hace".

## El motor de microlearning (`moduleRunner.js`)

Cada módulo tiene un arreglo `steps`. `ModuleRunner` avanza paso a paso seguiendo el patrón pedido:

```
info (30s) → interacción → info (40s) → actividad/quiz → video → quiz → continuar
```

Tipos de `step.kind` soportados: `info`, `video`, `quiz`, `drive` (carpeta de Google Drive). Al terminar los steps, si el módulo tiene `simulation`, se ejecuta esa simulación ramificada (una secuencia de escenarios tipo `scenario`); después siempre se ejecuta el `quiz` de cierre del módulo, y finalmente se muestra la pantalla de módulo completado con confeti.

## Motor de preguntas (`components/quiz.js`)

`QuizEngine` recibe un arreglo de "items" con distintos `type` y los va mostrando uno por uno, llevando el conteo de aciertos. Ver `docs/ADD_MODULES.md` para el esquema completo de cada tipo.

## Estado y gamificación

`core/state.js` expone una única clase `StateManager` con `get()`, `update(fn)`, `subscribe(fn)` — todo el proyecto lee/escribe el progreso a través de ahí, nunca contra `localStorage` directamente. `core/gamification.js` reacciona a eventos (`onStepComplete`, `onVideoWatched`, `onQuizAnswer`, `onModuleComplete`, etc.) y aplica las reglas de XP/logros/niveles.

## Roadmap: de MVP a LMS empresarial

La arquitectura ya está pensada para que estas piezas se integren **sin reescribir lo existente**:

| Pieza futura | Dónde conecta |
|---|---|
| **Azure AD / Microsoft Entra** (login real) | Nuevo módulo `core/auth.js`; `state.js` ya tiene `user.name/role` listos para poblarse desde el token |
| **API REST / base de datos** | Reemplazar el cuerpo de `core/data.js` y `core/state.js` (mismo contrato de funciones) |
| **Human Work Social** | Ya está enlazado como recurso dentro del Módulo 1/3; a futuro puede exponer un SSO o webhook de nómina/vacaciones |
| **Power BI / Dashboard de RH** | `state.js` ya centraliza XP, tiempos, avance y evaluaciones — solo falta exportarlos a un endpoint |
| **SharePoint / OneDrive** | Sustituir las carpetas de Google Drive en `assets/data/*.json` por URLs de SharePoint (mismo componente `kind: "drive"`) |
| **Microsoft Forms / Power Automate / n8n** | Los pasos `kind: "drive"` que hoy apuntan a Google Forms pueden apuntar a Forms/Power Automate sin cambiar el componente |
| **ChatGPT / Claude / Gemini / Copilot** | Se puede agregar un `core/aiTutor.js` que llame a un endpoint propio y se muestre como un nuevo tipo de step (`kind: "ai-tutor"`) |
| **Certificados PDF reales / constancias automáticas** | `screens/certificate.js` ya tiene el punto de entrada; solo falta conectar un servicio de generación de PDF |
| **Evaluaciones reales con banco de reactivos** | `assets/data/final-exam.json` puede volverse dinámico vía `core/data.js` apuntando a una API |
| **Panel administrativo / Analytics** | Nueva sección `admin/` que lea el mismo `state.js` (o su versión backend) de todos los usuarios |
| **SCORM / xAPI / LMS** | El modelo de datos de `modulo-0X.json` (steps + quiz + simulation) es directamente traducible a un paquete SCORM; se recomienda un script de exportación cuando llegue ese momento |

Ninguna de estas piezas se construyó todavía — **la arquitectura solo se dejó lista** para no bloquear al equipo cuando Dirección decida avanzar.
