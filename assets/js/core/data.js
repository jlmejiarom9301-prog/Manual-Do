/**
 * data.js
 * -----------------------------------------------------------------------
 * Capa de acceso a datos. HOY lee archivos JSON estáticos en /assets/data.
 * MAÑANA (roadmap): reemplazar el cuerpo de estas funciones por llamadas
 * fetch() a una API REST / SharePoint / Power Automate sin tocar las
 * pantallas que las consumen (todas importan desde aquí).
 * -----------------------------------------------------------------------
 */

const cache = new Map();

async function loadJSON(path) {
  if (cache.has(path)) return cache.get(path);
  const res = await fetch(path);
  if (!res.ok) throw new Error(`No se pudo cargar ${path}`);
  const json = await res.json();
  cache.set(path, json);
  return json;
}

export function getModulesIndex() {
  return loadJSON("assets/data/modules.json");
}

export function getModule(id) {
  return loadJSON(`assets/data/${id}.json`);
}

export function getFinalExam() {
  return loadJSON("assets/data/final-exam.json");
}

export function getTeam() {
  return loadJSON("assets/data/team.json");
}
