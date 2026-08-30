import { getProduct, listProducts } from "../api.js";
import { addItem } from "../cart.js";
import { productCard } from "../components/product-card.js";
import { formatCurrency, html, raw, setOutlet, toast } from "../utils.js";
import { navigate } from "../router.js";

const SIZES = ["S", "M", "L"];

export async function renderProduct({ id }) {
  let product = await getProduct(id);
  if (!product) {
    product = {
      id: id,
      name: id === "product_id" ? "Zolly Signature Knitwear" : "Template Product",
      price: 189,
      image: "/assets/images/p1.jpg",
      category: "Knitwear",
      description: "A placeholder for our timeless essentials. Handcrafted with precision, using the finest materials. This template page showcases the product presentation and layouts for custom items."
    };
  }
  const all = await listProducts();
  const others = all.filter((p) => p.id !== product.id).slice(0, 3);

  const state = { size: "", qty: 1 };

  const outlet = setOutlet(html`
    <article class="max-w-7xl mx-auto px-6 py-12">
      <nav aria-label="Breadcrumb" class="text-xs uppercase tracking-[0.18em] text-muted-foreground">
        <a href="/shop" data-link class="hover:text-accent transition-colors">Shop</a>
        <span class="mx-2">/</span>
        <span>${product.category}</span>
      </nav>
      <div class="mt-8 grid gap-12 md:grid-cols-2">
        <div class="bg-muted overflow-hidden aspect-[4/5]">
          <img src="${product.image}" alt="${product.name}" class="w-full h-full object-cover" />
        </div>
        <div class="md:pt-6">
          <p class="text-xs uppercase tracking-[0.2em] text-muted-foreground">${product.category}</p>
          <h1 class="mt-2 text-4xl">${product.name}</h1>
          <p class="mt-3 text-lg tabular-nums">${formatCurrency(product.price)}</p>
          <p class="mt-6 text-sm leading-relaxed text-muted-foreground max-w-md">
            ${product.description}
          </p>

          <fieldset class="mt-10">
            <legend class="text-xs uppercase tracking-[0.18em] text-muted-foreground">Size</legend>
            <div role="radiogroup" aria-label="Size" class="mt-3 flex gap-2" data-size-group>
              ${raw(
                SIZES.map(
                  (s) => html`
                    <button
                      type="button"
                      role="radio"
                      aria-checked="false"
                      data-size="${s}"
                      class="w-12 h-12 border border-border text-sm hover:border-foreground transition-colors aria-checked:bg-foreground aria-checked:text-background aria-checked:border-foreground"
                    >
                      ${s}
                    </button>
                  `,
                ).join(""),
              )}
            </div>
          </fieldset>

          <div class="mt-8 flex items-center gap-4">
            <div class="inline-flex items-center border border-border">
              <button
                type="button"
                aria-label="Decrease quantity"
                data-qty="-1"
                class="w-10 h-10 hover:bg-muted transition-colors"
              >−</button>
              <span data-qty-value class="w-10 text-center tabular-nums text-sm">1</span>
              <button
                type="button"
                aria-label="Increase quantity"
                data-qty="1"
                class="w-10 h-10 hover:bg-muted transition-colors"
              >+</button>
            </div>
            <button
              type="button"
              data-add
              disabled
              class="flex-1 h-12 bg-foreground text-background text-sm tracking-wide hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Select a size
            </button>
          </div>

          <dl class="mt-10 border-t border-border pt-6 text-sm space-y-2 text-muted-foreground">
            <div class="flex justify-between"><dt>Shipping</dt><dd>Complimentary over ${formatCurrency(150)}</dd></div>
            <div class="flex justify-between"><dt>Returns</dt><dd>Free within 30 days</dd></div>
          </dl>
        </div>
      </div>

      <section class="mt-24">
        <h2 class="text-2xl">You may also like</h2>
        <div class="mt-8 grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-12">
          ${raw(others.map(productCard).join(""))}
        </div>
      </section>
    </article>
  `);

  const sizeBtns = outlet.querySelectorAll("[data-size]");
  const qtyValue = outlet.querySelector("[data-qty-value]");
  const addBtn = outlet.querySelector("[data-add]");

  sizeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      state.size = btn.dataset.size;
      sizeBtns.forEach((b) =>
        b.setAttribute("aria-checked", b === btn ? "true" : "false"),
      );
      addBtn.disabled = false;
      addBtn.textContent = "Add to bag";
    });
  });

  outlet.querySelectorAll("[data-qty]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const delta = Number(btn.dataset.qty);
      state.qty = Math.max(1, Math.min(10, state.qty + delta));
      qtyValue.textContent = state.qty;
    });
  });

  addBtn.addEventListener("click", () => {
    if (!state.size) return;
    addItem({ id: product.id, size: state.size, qty: state.qty });
    addBtn.textContent = "Added to bag";
    toast(`${product.name} added to bag`);
    setTimeout(() => (addBtn.textContent = "Add to bag"), 1400);
  });
}
