/**
 * videoPlayer.js
 * -----------------------------------------------------------------------
 * Reproductor de video embebido (HTML5 / iframe) reutilizado a partir de
 * los enlaces reales detectados en el manual oficial (YouTube / Google
 * Drive). El código QR se conserva SIEMPRE como método alternativo,
 * nunca como el único acceso: el usuario puede reproducir el video sin
 * salir del curso.
 *
 * video = {
 *   id, title, provider: 'youtube' | 'drive' | 'mp4',
 *   url, embedUrl, poster, qr, note
 * }
 * -----------------------------------------------------------------------
 */
import { onVideoWatched } from "../core/gamification.js";

export function renderVideoBlock(video) {
  const posterStyle = video.poster ? `style="background-image:url('${video.poster}')"` : "";
  return `
  <div class="video-block" data-video-block data-video-id="${video.id}">
    <div class="video-block__frame-wrap">
      <div class="video-block__cover" ${posterStyle} data-video-play>
        <div class="video-block__play" aria-label="Reproducir video">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        </div>
      </div>
    </div>
    <div class="video-block__footer">
      <span>▶ ${video.title || "Video institucional"}</span>
      <button class="video-block__qr-toggle" data-qr-toggle type="button">
        ¿Prefieres tu celular?
      </button>
    </div>
    <div class="video-block__qr-panel" data-qr-panel>
      <img src="${video.qr}" alt="Código QR para ${video.title}" loading="lazy" />
      <p class="text-muted" style="font-size:var(--fs-xs)">Escanea con la cámara de tu celular para ver "${video.title}" directamente en tu equipo.</p>
      <a href="${video.url}" target="_blank" rel="noopener" style="font-size:var(--fs-xs)">O abre el enlace original ↗</a>
    </div>
  </div>`;
}

export function mountVideoBlocks(root = document) {
  root.querySelectorAll("[data-video-block]").forEach((block) => {
    const videoId = block.dataset.videoId;
    const cover = block.querySelector("[data-video-play]");
    const frameWrap = block.querySelector(".video-block__frame-wrap");
    const qrToggle = block.querySelector("[data-qr-toggle]");
    const qrPanel = block.querySelector("[data-qr-panel]");

    if (cover) {
      cover.addEventListener("click", () => {
        const embed = block.dataset.embed;
        const provider = block.dataset.provider;
        if (provider === "mp4") {
          frameWrap.innerHTML = `<video src="${embed}" controls autoplay playsinline></video>`;
        } else {
          frameWrap.innerHTML = `<iframe src="${embed}" allow="autoplay; encrypted-media; fullscreen" allowfullscreen loading="lazy" title="Video"></iframe>`;
        }
        onVideoWatched(videoId);
      });
    }
    if (qrToggle) {
      qrToggle.addEventListener("click", () => {
        qrPanel.classList.toggle("is-open");
        qrToggle.textContent = qrPanel.classList.contains("is-open") ? "Ocultar QR" : "¿Prefieres tu celular?";
      });
    }
  });
}

/** Construye el objeto video listo para renderVideoBlock a partir del registro central. */
export function buildVideo(entry) {
  let embed = entry.url;
  let provider = entry.provider;
  if (provider === "youtube") {
    const idMatch = entry.url.match(/(?:v=|youtu\.be\/)([\w-]{11})/);
    const ytId = idMatch ? idMatch[1] : "";
    embed = `https://www.youtube.com/embed/${ytId}`;
  } else if (provider === "drive") {
    const idMatch = entry.url.match(/\/d\/([\w-]+)/);
    const driveId = idMatch ? idMatch[1] : "";
    embed = driveId ? `https://drive.google.com/file/d/${driveId}/preview` : entry.url;
  }
  return { ...entry, embed, providerResolved: provider };
}

export function renderVideoBlockFull(entry) {
  const v = buildVideo(entry);
  const html = renderVideoBlock(v);
  return html.replace(
    "data-video-block",
    `data-video-block data-embed="${v.embed}" data-provider="${v.providerResolved}"`
  );
}
