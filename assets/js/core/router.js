/**
 * router.js
 * -----------------------------------------------------------------------
 * Router SPA minimalista basado en hash (#/ruta/param). No requiere
 * build step ni dependencias — funciona directo en GitHub Pages.
 *
 * Registro de rutas: router.register('/modulo/:id', renderFn)
 * Navegación: router.go('/modulo/m01')
 * -----------------------------------------------------------------------
 */

class Router {
  constructor(rootEl) {
    this.rootEl = rootEl;
    this.routes = [];
    this.notFound = () => `<div class="screen"><h2>Página no encontrada</h2></div>`;
    window.addEventListener("hashchange", () => this._resolve());
  }

  register(pattern, renderFn) {
    const paramNames = [];
    const regexStr = pattern
      .split("/")
      .map((seg) => {
        if (seg.startsWith(":")) {
          paramNames.push(seg.slice(1));
          return "([^/]+)";
        }
        return seg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      })
      .join("/");
    const regex = new RegExp(`^${regexStr}$`);
    this.routes.push({ regex, paramNames, renderFn });
    return this;
  }

  setNotFound(fn) {
    this.notFound = fn;
    return this;
  }

  start(defaultPath = "/") {
    if (!location.hash) location.hash = `#${defaultPath}`;
    this._resolve();
  }

  go(path) {
    location.hash = `#${path}`;
  }

  replace(path) {
    const url = `${location.pathname}${location.search}#${path}`;
    history.replaceState(null, "", url);
    this._resolve();
  }

  async _resolve() {
    const hash = location.hash.replace(/^#/, "") || "/";
    const [pathOnly] = hash.split("?");
    const query = Object.fromEntries(new URLSearchParams(hash.split("?")[1] || ""));

    for (const route of this.routes) {
      const match = pathOnly.match(route.regex);
      if (match) {
        const params = {};
        route.paramNames.forEach((name, i) => (params[name] = decodeURIComponent(match[i + 1])));
        window.scrollTo(0, 0);
        const html = await route.renderFn(params, query);
        if (typeof html === "string") this.rootEl.innerHTML = html;
        this._afterRender();
        return;
      }
    }
    this.rootEl.innerHTML = await this.notFound();
  }

  _afterRender() {
    document.dispatchEvent(new CustomEvent("route:rendered"));
    // Intersection Observer genérico para animaciones "reveal" declarativas.
    const revealEls = this.rootEl.querySelectorAll(".reveal");
    if (revealEls.length) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15 }
      );
      revealEls.forEach((el) => io.observe(el));
    }
  }
}

export function createRouter(rootEl) {
  return new Router(rootEl);
}
