import { html } from "../utils.js";

export function renderFooter() {
  const el = document.getElementById("site-footer");
  el.innerHTML = html`
    <div class="border-t border-border mt-24">
      <div class="max-w-7xl mx-auto px-6 py-16 grid gap-12 md:grid-cols-4">
        <div class="md:col-span-2">
          <p class="font-display text-2xl">Maison</p>
          <p class="text-sm text-muted-foreground mt-3 max-w-sm">
            Considered everyday essentials, made slowly and built to last.
          </p>
          <form class="mt-6 flex max-w-sm gap-2" onsubmit="event.preventDefault();">
            <label for="newsletter-email" class="sr-only">Email address</label>
            <input
              id="newsletter-email"
              type="email"
              required
              placeholder="Your email"
              class="flex-1 px-4 py-2.5 text-sm border border-border bg-card focus:border-accent outline-none transition-colors"
            />
            <button
              type="submit"
              class="px-4 py-2.5 text-sm bg-foreground text-background hover:opacity-90 transition"
            >
              Subscribe
            </button>
          </form>
        </div>
        <div>
          <p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">Shop</p>
          <ul class="mt-4 space-y-2 text-sm">
            <li><a href="/" data-link class="hover:text-accent transition-colors">New arrivals</a></li>
            <li><a href="/" data-link class="hover:text-accent transition-colors">Knitwear</a></li>
            <li><a href="/" data-link class="hover:text-accent transition-colors">Accessories</a></li>
          </ul>
        </div>
        <div>
          <p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">Studio</p>
          <ul class="mt-4 space-y-2 text-sm">
            <li><a href="/" data-link class="hover:text-accent transition-colors">About</a></li>
            <li><a href="/" data-link class="hover:text-accent transition-colors">Journal</a></li>
            <li><a href="/" data-link class="hover:text-accent transition-colors">Contact</a></li>
          </ul>
        </div>
      </div>
      <div class="border-t border-border">
        <div class="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>© ${new Date().getFullYear()} Maison Studio. All rights reserved.</p>
          <p>Made slowly in Europe.</p>
        </div>
      </div>
    </div>
  `;
}
