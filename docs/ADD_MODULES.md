# Cómo agregar o profundizar un módulo

Todo el contenido vive en JSON. **No necesitas tocar JavaScript** para agregar un módulo, una lección o una pregunta nueva.

## 1. Agregar un módulo nuevo (módulo 10, 11, ...)

1. Agrega una entrada en `assets/data/modules.json`:
   ```json
   {
     "id": "modulo-10",
     "order": 10,
     "title": "Nombre del módulo",
     "subtitle": "Subtítulo corto",
     "hero": "assets/images/photos/tu-imagen.jpg",
     "estimatedMinutes": 10,
     "xpTotal": 100
   }
   ```
2. Crea `assets/data/modulo-10.json` (usa cualquier `modulo-0X.json` existente como plantilla — ver esquema completo abajo).
3. Si tienes una imagen nueva, colócala en `assets/images/photos/`. Si necesitas un QR nuevo para un video/enlace, genera uno (cualquier generador de QR está bien, o reutiliza el script de Python descrito al final de este documento) y colócalo en `assets/images/qr/`.
4. Listo — el módulo aparecerá automáticamente en `/modulos` y será navegable.

## 2. Profundizar uno de los 6 módulos "ágiles" al nivel de los módulos insignia

Los módulos `02, 04, 05, 06, 07, 09` ya tienen todo el contenido del manual, pero con menos interactividad que los módulos insignia (`01, 03, 08`). Para llevarlos al mismo nivel:

1. Abre el `modulo-0X.json` correspondiente.
2. Intercala más `steps` de tipo `"quiz"` entre los de tipo `"info"` (ver tipos disponibles abajo) para variar la interacción.
3. Agrega un bloque `"simulation"` (mismo formato que en `modulo-03.json` o `modulo-08.json`) si el tema se presta a una decisión ramificada tipo storytelling.
4. Ajusta `xpTotal` y `estimatedMinutes` en `modules.json` si el módulo creció.

No hay ningún límite técnico — el motor (`moduleRunner.js`) es el mismo para los 9 módulos.

## Esquema de un módulo (`modulo-0X.json`)

```jsonc
{
  "id": "modulo-XX",
  "order": 1,
  "title": "...",
  "subtitle": "...",
  "hero": "assets/images/photos/....jpg",
  "estimatedMinutes": 10,
  "xpTotal": 100,
  "intro": { "text": "..." },
  "learningPoints": ["...", "..."],
  "steps": [ /* ver tipos de step abajo */ ],
  "simulation": { /* opcional — ver abajo */ },
  "quiz": [ /* preguntas de cierre del módulo, mismo formato que los items de quiz */ ]
}
```

## Tipos de `step` (dentro de `steps`)

| `kind` | Para qué sirve | Campos clave |
|---|---|---|
| `info` | Bloque corto de contenido (microlearning) | `eyebrow`, `title`, `body`, `bullets[]`, `image` (opcional) |
| `video` | Video institucional embebido + QR alterno | `title`, `caption`, `video: { id, title, provider, url, poster, qr }` |
| `drive` | Enlace a una carpeta de Google Drive (no se puede embeber) | `title`, `body`, `url`, `qr` |
| `quiz` | Una pregunta interactiva | `title`, `item: { ...ver tipos de pregunta abajo }` |

`video.provider` acepta `"youtube"` o `"drive"`. El componente resuelve automáticamente la URL de embed (`videoPlayer.js` → `buildVideo()`).

## Tipos de pregunta (`item.type`, usados en `steps[].item`, `simulation.scenes[]` y `quiz[]`)

| `type` | Campos | Ejemplo de uso |
|---|---|---|
| `mcq` | `prompt`, `options: [{id, text}]`, `correctId`, `explanation` | Opción múltiple clásica |
| `truefalse` | `prompt`, `correctBool`, `explanation` | Verdadero/falso |
| `order` | `prompt`, `steps: [{id, text}]` (en el orden correcto), `explanation` | Ordenar pasos (ej. cadena de mando, protocolo PAS) |
| `imageselect` | `prompt`, `options: [{id, img, label}]`, `correctId`, `explanation` | Elegir la imagen correcta |
| `fillblank` | `prompt`, `template` (con `___` como hueco), `answer`, `wordbank[]`, `explanation` | Completar el enunciado |
| `flashcard` | `front`, `back` | Tarjeta de estudio (no califica, solo repaso) |
| `scenario` | `scene`, `choices: [{id, text, correct, feedback}]` | Storytelling / simulación |

Cualquier pregunta puede llevar `"timerSeconds": 20` para activar el cronómetro (modo contrarreloj).

## Esquema de `simulation`

```jsonc
"simulation": {
  "title": "Nombre de la simulación",
  "intro": "Texto de introducción antes de empezar",
  "scenes": [
    { "type": "scenario", "scene": "...", "choices": [ /* ... */ ] },
    { "type": "scenario", "scene": "...", "choices": [ /* ... */ ], "timerSeconds": 20 }
  ]
}
```

## Generar un QR nuevo (opcional, Python)

```python
import qrcode
img = qrcode.make("https://tu-enlace-aqui.com")
img.save("assets/images/qr/mi-video.png")
```

## Reglas de contenido (para no romper el espíritu del proyecto)

- Nunca borres información del manual oficial: si un tema ya no cabe en un `step`, divídelo en dos.
- Prioriza reutilizar imágenes reales (`assets/images/raw/` tiene las 180 originales del PDF) antes de usar íconos genéricos.
- Mantén cada `step` de tipo `info` corto (una idea por pantalla) — es la esencia del microlearning.
