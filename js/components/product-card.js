import { formatCurrency, html } from "../utils.js";

export function productCard(product) {
  return html`
    <a
      href="/product/${product.id}"
      data-link
      class="group block"
      aria-label="${product.name}, ${formatCurrency(product.price)}"
    >
      <div class="overflow-hidden bg-muted aspect-[4/5]">
        <img
          src="${product.image}"
          alt="${product.name}"
          loading="lazy"
          class="w-full h-full object-cover transition-transform duration-[600ms] ease-out group-hover:scale-105"
        />
      </div>
      <div class="mt-4 flex items-start justify-between gap-4">
        <div>
          <p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">${product.category}</p>
          <h3 class="mt-1 text-base">${product.name}</h3>
        </div>
        <p class="text-sm tabular-nums">${formatCurrency(product.price)}</p>
      </div>
    </a>
  `;
}
