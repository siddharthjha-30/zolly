import { listProducts } from "../api.js";
import { productCard } from "../components/product-card.js";
import { formatCurrency, html, raw, setOutlet } from "../utils.js";

export async function renderSearch() {
  const products = await listProducts();

  // Parse initial query from URL
  const params = new URLSearchParams(window.location.search);
  const initialQuery = params.get("q") || "";

  // State
  const state = {
    query: initialQuery,
    selectedCategories: [],
    minPrice: "",
    maxPrice: "",
    sort: "featured", // 'price-asc', 'price-desc', 'name-asc'
  };

  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));

  const draw = () => {
    // Filter & Sort Products
    const filtered = products
      .filter((p) => {
        // Query
        if (state.query) {
          const q = state.query.toLowerCase();
          const nameMatch = p.name?.toLowerCase().includes(q);
          const descMatch = p.description?.toLowerCase().includes(q);
          const catMatch = p.category?.toLowerCase().includes(q);
          if (!nameMatch && !descMatch && !catMatch) return false;
        }
        // Category
        if (state.selectedCategories.length > 0) {
          if (!state.selectedCategories.includes(p.category)) return false;
        }
        // Min Price
        if (state.minPrice !== "") {
          if (p.price < Number(state.minPrice)) return false;
        }
        // Max Price
        if (state.maxPrice !== "") {
          if (p.price > Number(state.maxPrice)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (state.sort === "price-asc") return a.price - b.price;
        if (state.sort === "price-desc") return b.price - a.price;
        if (state.sort === "name-asc") return (a.name || "").localeCompare(b.name || "");
        return 0; // Featured / Default
      });

    const outlet = setOutlet(html`
      <section class="max-w-7xl mx-auto px-6 py-12">
        <p class="text-xs uppercase tracking-[0.2em] text-muted-foreground">Search</p>
        <h1 class="mt-2 text-4xl font-display">Explore Collection</h1>

        <div class="mt-10 grid gap-10 md:grid-cols-[16rem_1fr]">
          <!-- Sidebar Filters -->
          <aside class="space-y-8 border-b border-border md:border-b-0 md:border-r border-border pb-8 md:pb-0 md:pr-8">
            <!-- Search field inside sidebar -->
            <div class="space-y-3">
              <h3 class="text-xs uppercase tracking-[0.18em] text-muted-foreground">Search</h3>
              <input
                type="text"
                id="search-input"
                value="${state.query}"
                placeholder="Type keywords..."
                class="w-full px-3 py-2 text-sm border border-border bg-card focus:border-accent outline-none"
              />
            </div>

            <!-- Categories Checklist -->
            <div class="space-y-3">
              <h3 class="text-xs uppercase tracking-[0.18em] text-muted-foreground">Categories</h3>
              <div class="space-y-2">
                ${raw(
                  categories
                    .map(
                      (cat) => html`
                        <label class="flex items-center gap-2.5 text-sm cursor-pointer select-none">
                          <input
                            type="checkbox"
                            value="${cat}"
                            class="rounded border-border text-accent focus:ring-accent"
                            ${state.selectedCategories.includes(cat) ? "checked" : ""}
                          />
                          <span class="text-foreground/90">${cat}</span>
                        </label>
                      `,
                    )
                    .join(""),
                )}
              </div>
            </div>

            <!-- Price Filters -->
            <div class="space-y-3">
              <h3 class="text-xs uppercase tracking-[0.18em] text-muted-foreground">Price Range</h3>
              <div class="flex gap-2 items-center">
                <input
                  type="number"
                  id="price-min"
                  placeholder="Min"
                  value="${state.minPrice}"
                  class="w-full px-2 py-1.5 text-sm border border-border bg-card focus:border-accent outline-none tabular-nums"
                />
                <span class="text-muted-foreground text-xs">—</span>
                <input
                  type="number"
                  id="price-max"
                  placeholder="Max"
                  value="${state.maxPrice}"
                  class="w-full px-2 py-1.5 text-sm border border-border bg-card focus:border-accent outline-none tabular-nums"
                />
              </div>
            </div>

            <!-- Sort option -->
            <div class="space-y-3">
              <h3 class="text-xs uppercase tracking-[0.18em] text-muted-foreground">Sort By</h3>
              <select
                id="sort-select"
                class="w-full px-3 py-2 text-sm border border-border bg-card focus:border-accent outline-none"
              >
                <option value="featured" ${state.sort === "featured" ? "selected" : ""}>Featured</option>
                <option value="price-asc" ${state.sort === "price-asc" ? "selected" : ""}>Price: Low to High</option>
                <option value="price-desc" ${state.sort === "price-desc" ? "selected" : ""}>Price: High to Low</option>
                <option value="name-asc" ${state.sort === "name-asc" ? "selected" : ""}>Name: A-Z</option>
              </select>
            </div>

            <!-- Reset Button -->
            <button
              type="button"
              id="btn-reset"
              class="w-full py-2 border border-border text-xs uppercase tracking-[0.18em] hover:bg-muted transition"
            >
              Reset Filters
            </button>
          </aside>

          <!-- Search Results Grid -->
          <main>
            <div class="flex items-center justify-between mb-8">
              <p class="text-sm text-muted-foreground font-mono">
                Showing ${filtered.length} of ${products.length} product${products.length === 1 ? "" : "s"}
              </p>
            </div>

            ${filtered.length === 0
              ? raw(html`
                  <div class="border border-border p-16 text-center bg-card">
                    <p class="text-muted-foreground">No products match your filters.</p>
                    <button type="button" id="btn-clear-search" class="mt-4 text-xs uppercase tracking-[0.18em] text-accent hover:underline">
                      Clear filters
                    </button>
                  </div>
                `)
              : raw(html`
                  <div class="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-12">
                    ${raw(filtered.map(productCard).join(""))}
                  </div>
                `)}
          </main>
        </div>
      </section>
    `);

    // Attach interaction handlers for live updates
    const searchInput = outlet.querySelector("#search-input");
    searchInput.addEventListener("input", (e) => {
      state.query = e.target.value;
      // Update browser URL query parameter silently (without reloading page)
      const newUrl = new URL(window.location.href);
      if (state.query) newUrl.searchParams.set("q", state.query);
      else newUrl.searchParams.delete("q");
      history.replaceState({}, "", newUrl.toString());
      draw();
      // Refocus because outlet replacement redraws, but keep cursor in input
      const newInput = document.getElementById("search-input");
      if (newInput) {
        newInput.focus();
        newInput.setSelectionRange(newInput.value.length, newInput.value.length);
      }
    });

    const categoryChecks = outlet.querySelectorAll('input[type="checkbox"]');
    categoryChecks.forEach((chk) => {
      chk.addEventListener("change", () => {
        state.selectedCategories = Array.from(categoryChecks)
          .filter((c) => c.checked)
          .map((c) => c.value);
        draw();
      });
    });

    const minInput = outlet.querySelector("#price-min");
    minInput.addEventListener("input", (e) => {
      state.minPrice = e.target.value;
      draw();
      // Keep input focused
      const el = document.getElementById("price-min");
      if (el) el.focus();
    });

    const maxInput = outlet.querySelector("#price-max");
    maxInput.addEventListener("input", (e) => {
      state.maxPrice = e.target.value;
      draw();
      // Keep input focused
      const el = document.getElementById("price-max");
      if (el) el.focus();
    });

    const sortSelect = outlet.querySelector("#sort-select");
    sortSelect.addEventListener("change", (e) => {
      state.sort = e.target.value;
      draw();
    });

    const resetBtn = outlet.querySelector("#btn-reset");
    resetBtn.addEventListener("click", () => {
      state.query = "";
      state.selectedCategories = [];
      state.minPrice = "";
      state.maxPrice = "";
      state.sort = "featured";
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("q");
      history.replaceState({}, "", newUrl.toString());
      draw();
    });

    const clearBtn = outlet.querySelector("#btn-clear-search");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        resetBtn.click();
      });
    }
  };

  draw();
}
