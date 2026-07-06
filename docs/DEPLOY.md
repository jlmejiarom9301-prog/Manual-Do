# Despliegue en GitHub Pages

El proyecto es 100% estático — no requiere build ni servidor con backend.

## Opción A — Repositorio nuevo

1. Crea un repositorio en GitHub (puede ser privado si es interno, ej. `intercon-academy`).
2. Copia el contenido de la carpeta `interconacademy/` a la raíz del repositorio (que `index.html` quede en la raíz, no dentro de una subcarpeta).
3. Sube los cambios:
   ```bash
   git init
   git add .
   git commit -m "Inter-Con Academy MVP"
   git branch -M main
   git remote add origin https://github.com/<tu-organizacion>/intercon-academy.git
   git push -u origin main
   ```
4. En GitHub: **Settings → Pages → Source → Deploy from a branch → `main` / `/root`** → Save.
5. En 1-2 minutos tu app estará en `https://<tu-organizacion>.github.io/intercon-academy/`.

## Opción B — Dentro de un repositorio existente

Si ya tienen un repo y quieren publicar esta app como proyecto GitHub Pages de usuario/organización (`usuario.github.io`), copien el contenido directamente en ese repositorio.

## Verificación post-despliegue

Una vez publicado, revisa:

- [ ] La página carga y navega entre Inicio / Módulos / Logros / Perfil.
- [ ] Los videos reproducen dentro del curso (si alguno no carga, revisa que el archivo de Drive esté compartido como "Cualquiera con el enlace").
- [ ] El progreso persiste al recargar la página (usa `localStorage`, es por navegador/dispositivo).
- [ ] Se ve bien en un celular real (390–430px) y no solo en el emulador de escritorio.

## Dominio propio (opcional)

En **Settings → Pages → Custom domain** pueden apuntar un subdominio propio (ej. `academy.intercon.com.mx`) agregando un registro CNAME en su proveedor de DNS hacia `<tu-organizacion>.github.io`.

## Nota sobre HTTPS y cámaras/QR

GitHub Pages sirve todo por HTTPS de forma automática, lo cual es importante si en el futuro se agrega escaneo de QR con la cámara del navegador (hoy los QR solo se muestran como imagen para escanear con la app nativa de cámara del celular).

## ¿Por qué no puedo abrir `index.html` con doble clic?

Los módulos se cargan con `fetch()` desde archivos `.json`. Los navegadores bloquean `fetch()` sobre `file://` por seguridad (CORS). Por eso, tanto para desarrollo local como en producción, siempre se necesita un servidor HTTP real (GitHub Pages lo es; en local basta `python3 -m http.server` o `npx serve`).
