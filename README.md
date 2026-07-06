# Inter-Con Academy

MVP de una plataforma de capacitación corporativa moderna, interactiva y mobile-first para Inter-Con Seguridad Privada, construida a partir del **MANUAL OFICIAL 2026**. Es el primer módulo de lo que puede convertirse en el LMS empresarial completo de Inter-Con.

No es un PDF convertido a HTML: es una aplicación web con microlearning, gamificación, storytelling, simulaciones interactivas y quizzes dinámicos, con calidad visual comparable a Duolingo, Kahoot o LinkedIn Learning — respetando siempre la identidad de marca de Inter-Con (azul institucional, blanco, gris y dorado).

## ¿Qué incluye este MVP?

- **9 módulos** con la información íntegra del manual oficial (nada fue eliminado ni resumido).
- **3 módulos insignia con experiencia completa**: `01 Bienvenida a Inter-Con`, `03 Así Trabajamos en Inter-Con` y `08 Guía para Emergencias`, con storytelling, simulaciones interactivas ramificadas y quizzes variados.
- **6 módulos en formato ágil**: `02, 04, 05, 06, 07, 09` — con todo el contenido del manual en microlearning + quiz de cierre, listos para profundizarse con el mismo patrón de los módulos insignia (ver `docs/ADD_MODULES.md`).
- **Videos reales del manual embebidos** (YouTube / Google Drive) reproducibles sin salir del curso, con el código QR conservado como método alternativo.
- **180 imágenes originales** extraídas del PDF, reutilizadas como heroes, fondos e íconos (ver `assets/images/raw/`).
- **Gamificación completa**: XP, niveles, racha diaria, insignias/logros, ranking local (mock) y confeti al completar módulos.
- **Motor de quiz con 7 formatos**: opción múltiple, verdadero/falso, ordenar pasos, seleccionar imagen, completar espacio, flashcards y escenarios de storytelling — varios con cronómetro.
- **Evaluación final de 12 preguntas** y pantalla de constancia DC-3, replicando el proceso real descrito en el manual.
- **Progreso persistente** en `localStorage`: continúa exactamente donde te quedaste.
- **Arquitectura preparada para crecer** hacia un LMS real (Azure AD, Power BI, SharePoint, SCORM/xAPI, API REST, etc. — ver `docs/ARCHITECTURE.md`).

## Cómo probarlo en 30 segundos

Este proyecto es 100% estático (HTML + CSS + JS, sin build step), pero los módulos se cargan vía `fetch()` de archivos JSON, así que **necesitas un servidor local** (no puedes abrir `index.html` con doble clic).

```bash
cd interconacademy
python3 -m http.server 8080
# o: npx serve .
```

Abre `http://localhost:8080` en tu navegador (idealmente con las DevTools en modo responsive, 390px o 430px de ancho).

Para publicarlo de forma real, ve a **`docs/DEPLOY.md`** (GitHub Pages, 5 minutos).

### Validar el contenido antes de publicar

Antes de hacer commit de un módulo nuevo o editado, corre:

```bash
node scripts/validate-content.mjs
```

Este script verifica (sin necesidad de navegador) que el estado, la gamificación y el motor de quiz funcionen, y que **todos** los `assets/data/modulo-*.json` cumplan el esquema que espera la app — atrapa typos de esquema antes de que lleguen a producción.

## Estructura del proyecto

```
interconacademy/
├── index.html                 # Shell de la app (una sola página)
├── assets/
│   ├── css/                   # Design system (tokens, base, componentes, animaciones)
│   ├── js/
│   │   ├── core/              # router, state (localStorage), gamification, data
│   │   ├── components/        # quiz engine, video player, toast, confetti, ui
│   │   └── screens/           # home, módulos, logros, perfil, evaluación, constancia
│   ├── data/                  # Contenido de cada módulo en JSON (editable sin tocar JS)
│   └── images/
│       ├── photos/            # Fotos e ilustraciones curadas y optimizadas para web
│       ├── qr/                # Códigos QR reales generados a partir de los enlaces del manual
│       └── raw/                # Las 180 imágenes originales extraídas del PDF (banco para futuros módulos)
└── docs/
    ├── ARCHITECTURE.md
    ├── DEPLOY.md
    ├── ADD_MODULES.md
    └── COMPONENTS.md
```

## Documentación

| Documento | Para qué sirve |
|---|---|
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Cómo está construida la app y el roadmap hacia el LMS completo |
| [`docs/DEPLOY.md`](docs/DEPLOY.md) | Publicar en GitHub Pages paso a paso |
| [`docs/ADD_MODULES.md`](docs/ADD_MODULES.md) | Cómo agregar un módulo nuevo o profundizar uno existente |
| [`docs/COMPONENTS.md`](docs/COMPONENTS.md) | Catálogo de componentes del design system y cómo reutilizarlos |

## Nota sobre los videos

El manual usa códigos QR y enlaces a Google Drive / YouTube. Esta app **detecta esas URLs reales** y las reproduce dentro del curso:

- Videos de **YouTube** → `<iframe>` embed estándar.
- Archivos individuales de **Google Drive** → `https://drive.google.com/file/d/ID/preview` (requiere que el archivo esté compartido como "Cualquier persona con el enlace").
- **Carpetas** de Drive (no un archivo específico) → no se intentan embeber (Drive no permite iframes de carpetas); se muestran como tarjeta con QR + enlace directo, igual que en el manual original.
- El **código QR original se conserva siempre** como alternativa para ver el video desde el celular.

Si algún video no carga dentro del iframe, casi siempre es porque el archivo de Drive no está compartido públicamente — pide a Recursos Humanos que cambie el permiso a "Cualquiera con el enlace puede ver".

## Limpieza opcional

`assets/images/raw/` conserva las 180 imágenes originales sin curar (banco de recursos para futuros módulos) y algunos `pagepreview_*.png` quedaron como referencia del proceso de extracción. Ninguno de los dos es necesario para que la app funcione — se pueden borrar con seguridad si se quiere un repositorio más ligero.

## Estado del proyecto

Este es un **MVP interno** para validar el potencial del proyecto ante Dirección. No incluye todavía backend, autenticación real, generación automática de PDF ni analítica — esas piezas están **contempladas en la arquitectura** y documentadas en `docs/ARCHITECTURE.md`, listas para integrarse sin rehacer lo ya construido.
