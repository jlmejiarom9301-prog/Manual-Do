/**
 * certificate.js — Pantalla de constancia DC-3 (réplica del proceso real
 * descrito en la página 75 del manual: descarga desde Drive vía QR/enlace).
 * La generación automática de PDF queda para el roadmap (LMS completo).
 */
import { state } from "../core/state.js";
import { topbar, mountTopbar } from "../components/ui.js";

const DRIVE_QR = "assets/images/qr/drive-constancias.png";
const DRIVE_URL = "https://drive.google.com/drive/folders/1daB4T8m4-_iWIBnfosbTKXDTSE1fvT1L?usp=drive_link";

export async function renderCertificate() {
  const s = state.get();
  if (!s.finalExam.passed) {
    return `${topbar("Constancia", { back: true })}
    <div class="screen text-center">
      <h2>Aún no tienes tu constancia</h2>
      <p class="text-muted">Primero debes aprobar la evaluación final.</p>
    </div>`;
  }
  return `
  ${topbar("Constancia DC-3", { back: true })}
  <div class="screen">
    <div class="text-center mb-6">
      <div style="font-size:64px">🎓</div>
      <h2>¡Gracias por tu compromiso!</h2>
      <p class="text-muted">Tu evaluación fue aprobatoria. Inter-Con generará tu constancia DC-3, que comprueba que cuentas con los conocimientos necesarios para tus actividades.</p>
    </div>

    <div class="qr-inline mb-6">
      <img src="${DRIVE_QR}" alt="QR carpeta de constancias" />
      <div>
        <strong>Escanea o da clic para acceder al Drive</strong>
        <p class="text-muted mt-2" style="font-size:var(--fs-sm);margin:0">
          <a href="${DRIVE_URL}" target="_blank" rel="noopener">Abrir carpeta de constancias ↗</a>
        </p>
      </div>
    </div>

    <div class="card mb-6">
      <h4 class="mb-2">¿Cómo la descargo?</h4>
      <div class="timeline">
        <div class="timeline-item is-done"><strong>1.</strong> Ingresa a la carpeta "Inducción" → descarga DC-3 Nacional.</div>
        <div class="timeline-item is-done"><strong>2.</strong> Busca la carpeta del mes correspondiente (ej. Enero).</div>
        <div class="timeline-item is-done"><strong>3.</strong> Ingresa a la carpeta del día que te capacitaste.</div>
        <div class="timeline-item"><strong>4.</strong> Busca tu nombre, descárgala e imprímela.</div>
      </div>
    </div>

    <div class="callout callout-warn mb-6">
      <span>📸</span>
      <span>No olvides: imprime tu constancia, anota "Recibí constancia original", tu nombre, fecha y firma. Tómate una foto y súbela según las instrucciones de tu capacitador.</span>
    </div>

    <div class="card">
      <h4 class="mb-2">¿Dudas sobre este proceso?</h4>
      <p class="text-muted" style="font-size:var(--fs-sm)">Escríbenos: <strong>55 18 87 25 76</strong></p>
    </div>
  </div>`;
}

export function mountCertificate(root) {
  mountTopbar(root);
}
