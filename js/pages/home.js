import { listProducts } from "../api.js";
import { productCard } from "../components/product-card.js";
import { heroImage } from "../products.js";
import { html, raw, setOutlet } from "../utils.js";

export async function renderHome() {
  const products = await listProducts();
  setOutlet(html`
    <section class="relative">
      <div class="relative h-[78vh] min-h-[520px] overflow-hidden">
        <img
          src="${heroImage}"
          alt="Editorial flat-lay of Maison essentials in muted, warm tones"
          class="absolute inset-0 w-full h-full object-cover"
        />
        <div class="absolute inset-0 bg-foreground/25"></div>
        <div class="relative h-full max-w-7xl mx-auto px-6 flex items-end pb-16 md:pb-24">
          <div class="max-w-xl text-background">
            <p class="text-xs uppercase tracking-[0.24em] opacity-90">Autumn / Winter</p>
            <h1 class="mt-4 text-5xl md:text-6xl leading-[1.05]">
              Quiet pieces for considered days.
            </h1>
            <p class="mt-5 opacity-90 max-w-md">
              Honest materials, slow making, and the kind of clothes you keep reaching for.
            </p>
            <a
              href="/shop"
              data-link
              class="inline-block mt-8 px-7 py-3 bg-background text-foreground text-sm tracking-wide hover:opacity-90 transition"
              >Shop the collection</a
            >
          </div>
        </div>
      </div>
    </section>

    <section class="max-w-7xl mx-auto px-6 py-16 grid gap-10 md:grid-cols-3 border-b border-border">
      ${raw(
        [
          ["Honest materials", "Cashmere, full-grain leather, European linen — sourced with intent."],
          ["Slow making", "Small batches with family-run ateliers across Italy and Portugal."],
          ["Built to last", "Designed for a long, quiet life beyond a single season."],
        ]
          .map(
            ([t, d]) => html`
              <div>
                <p class="font-display text-xl">${t}</p>
                <p class="mt-2 text-sm text-muted-foreground leading-relaxed">${d}</p>
              </div>
            `,
          )
          .join(""),
      )}
    </section>

    <section id="collection" class="max-w-7xl mx-auto px-6 py-20">
      <div class="flex items-end justify-between mb-10">
        <div>
          <p class="text-xs uppercase tracking-[0.2em] text-muted-foreground">The Collection</p>
          <h2 class="mt-2 text-3xl md:text-4xl">New this season</h2>
        </div>
        <a href="/shop" data-link class="hidden md:inline text-sm hover:text-accent transition-colors"
          >View all →</a
        >
      </div>
      <div class="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-12">
        ${raw(products.map(productCard).join(""))}
      </div>
    </section>
  `);
}
