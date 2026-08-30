export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) =>
  Array.from(root.querySelectorAll(sel));

export const formatCurrency = (n) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

// Tagged template that escapes interpolations by default. Use `${raw(x)}` to
// opt out (e.g. when embedding another rendered fragment string).
const escapeHTML = (s) =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const RAW = Symbol("raw");
export const raw = (s) => ({ [RAW]: true, value: String(s) });

export function html(strings, ...values) {
  let out = "";
  strings.forEach((str, i) => {
    out += str;
    if (i < values.length) {
      const v = values[i];
      if (v == null || v === false) return;
      if (Array.isArray(v)) {
        out += v
          .map((item) =>
            item && typeof item === "object" && item[RAW] ? item.value : escapeHTML(item),
          )
          .join("");
      } else if (typeof v === "object" && v[RAW]) {
        out += v.value;
      } else {
        out += escapeHTML(v);
      }
    }
  });
  return out;
}

export function setOutlet(htmlString) {
  const outlet = document.getElementById("outlet");
  outlet.innerHTML = htmlString;
  outlet.classList.remove("page-enter");
  // restart animation
  void outlet.offsetWidth;
  outlet.classList.add("page-enter");
  window.scrollTo({ top: 0, behavior: "instant" });
  return outlet;
}

let toastTimer;
export function toast(message) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = message;
  el.classList.add("toast-show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("toast-show"), 1800);
}
