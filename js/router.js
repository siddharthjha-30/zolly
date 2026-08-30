// Minimal History API router.
// Routes are objects: { pattern: RegExp | string, params: string[], handler }
const routes = [];

function compile(pattern) {
  // "/product/:id" -> { regex, params: ['id'] }
  const params = [];
  const regex = new RegExp(
    "^" +
      pattern.replace(/:[^/]+/g, (m) => {
        params.push(m.slice(1));
        return "([^/]+)";
      }) +
      "/?$",
  );
  return { regex, params };
}

export function registerRoute(pattern, handler, meta = {}) {
  const { regex, params } = compile(pattern);
  routes.push({ regex, params, handler, meta });
}

function match(pathname) {
  for (const r of routes) {
    const m = pathname.match(r.regex);
    if (m) {
      const params = {};
      r.params.forEach((p, i) => (params[p] = decodeURIComponent(m[i + 1])));
      return { route: r, params };
    }
  }
  return null;
}

function applyMeta(meta, params) {
  if (!meta) return;
  if (typeof meta.title === "function") document.title = meta.title(params);
  else if (meta.title) document.title = meta.title;
  if (meta.description) {
    let el = document.querySelector('meta[name="description"]');
    if (!el) {
      el = document.createElement("meta");
      el.name = "description";
      document.head.appendChild(el);
    }
    el.content =
      typeof meta.description === "function"
        ? meta.description(params)
        : meta.description;
  }
}

export function navigate(to, { replace = false } = {}) {
  if (replace) history.replaceState({}, "", to);
  else history.pushState({}, "", to);
  resolve();
}

function resolve() {
  const path = window.location.pathname || "/";
  const found = match(path);
  if (!found) {
    document.title = "Not found — Maison";
    const outlet = document.getElementById("outlet");
    outlet.innerHTML = `
      <section class="max-w-3xl mx-auto px-6 py-32 text-center">
        <p class="text-sm uppercase tracking-[0.2em] text-muted-foreground">404</p>
        <h1 class="text-4xl mt-3">This page can't be found.</h1>
        <p class="text-muted-foreground mt-4">It may have moved, or never existed.</p>
        <a href="/" data-link class="inline-block mt-8 px-6 py-3 bg-foreground text-background text-sm tracking-wide hover:opacity-90 transition">Return home</a>
      </section>`;
    return;
  }
  applyMeta(found.route.meta, found.params);
  found.route.handler(found.params);
}

export function startRouter() {
  document.addEventListener("click", (e) => {
    const link = e.target.closest("a[data-link]");
    if (!link) return;
    const href = link.getAttribute("href");
    if (!href || href.startsWith("http") || href.startsWith("#")) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    if (href !== window.location.pathname) navigate(href);
  });
  window.addEventListener("popstate", resolve);
  resolve();
}
