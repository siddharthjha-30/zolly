import { getCart, removeItem, setQty, subtotal, clearCart } from "../cart.js";
import { products } from "../products.js";
import { formatCurrency, html, raw, setOutlet, toast } from "../utils.js";
import { getAuthClient, getDb } from "../firebase.js";
import { navigate } from "../router.js";

const SHIPPING_FREE_OVER = 150;
const SHIPPING_COST = 12;

function lineRow(item, product) {
  return html`
    <li class="flex gap-5 py-6 border-b border-border" data-key="${item.key}">
      <a href="/product/${product.id}" data-link class="block w-24 h-28 bg-muted overflow-hidden shrink-0">
        <img src="${product.image}" alt="${product.name}" class="w-full h-full object-cover" />
      </a>
      <div class="flex-1 flex flex-col">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">${product.category}</p>
            <a href="/product/${product.id}" data-link class="mt-1 inline-block hover:text-accent transition-colors">${product.name}</a>
            ${item.size ? raw(html`<p class="text-sm text-muted-foreground mt-1">Size ${item.size}</p>`) : ""}
          </div>
          <p class="text-sm tabular-nums">${formatCurrency(product.price * item.qty)}</p>
        </div>
        <div class="mt-auto flex items-center justify-between pt-4">
          <div class="inline-flex items-center border border-border">
            <button type="button" aria-label="Decrease quantity" data-action="dec" class="w-9 h-9 hover:bg-muted transition-colors">−</button>
            <span class="w-9 text-center tabular-nums text-sm">${item.qty}</span>
            <button type="button" aria-label="Increase quantity" data-action="inc" class="w-9 h-9 hover:bg-muted transition-colors">+</button>
          </div>
          <button type="button" data-action="remove" class="text-xs uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground transition-colors">Remove</button>
        </div>
      </div>
    </li>
  `;
}

function emptyState() {
  return html`
    <section class="max-w-3xl mx-auto px-6 py-24 text-center">
      <p class="text-xs uppercase tracking-[0.2em] text-muted-foreground">Your bag</p>
      <h1 class="mt-3 text-4xl">Your bag is empty.</h1>
      <p class="mt-4 text-muted-foreground">Begin with something timeless.</p>
      <a href="/shop" data-link class="inline-block mt-8 px-7 py-3 bg-foreground text-background text-sm tracking-wide hover:opacity-90 transition">Shop the collection</a>
    </section>
  `;
}

function summaryView() {
  const sub = subtotal();
  const shipping = sub === 0 ? 0 : sub >= SHIPPING_FREE_OVER ? 0 : SHIPPING_COST;
  const total = sub + shipping;
  return html`
    <aside class="border border-border p-6 md:p-8 h-fit md:sticky md:top-24">
      <h2 class="text-2xl">Summary</h2>
      <dl class="mt-6 space-y-3 text-sm">
        <div class="flex justify-between"><dt>Subtotal</dt><dd class="tabular-nums">${formatCurrency(sub)}</dd></div>
        <div class="flex justify-between">
          <dt>Shipping</dt>
          <dd class="tabular-nums">${shipping === 0 ? "Free" : formatCurrency(shipping)}</dd>
        </div>
        ${sub > 0 && sub < SHIPPING_FREE_OVER
          ? raw(html`<p class="text-xs text-muted-foreground">Add ${formatCurrency(SHIPPING_FREE_OVER - sub)} for free shipping.</p>`)
          : ""}
      </dl>
      <div class="mt-6 pt-6 border-t border-border flex justify-between">
        <p>Total</p>
        <p class="tabular-nums">${formatCurrency(total)}</p>
      </div>
      <button
        type="button"
        id="btn-checkout"
        class="mt-8 w-full h-12 bg-foreground text-background text-sm tracking-wide hover:opacity-90 transition"
      >
        Checkout
      </button>
      <p class="mt-4 text-xs text-muted-foreground text-center">Secure checkout · Free returns within 30 days</p>
    </aside>
  `;
}

export function renderCart() {
  const draw = () => {
    const cart = getCart();
    if (cart.length === 0) {
      setOutlet(emptyState());
      return;
    }
    const lines = cart
      .map((item) => {
        const product = products.find((p) => p.id === item.id);
        return product ? lineRow(item, product) : "";
      })
      .join("");

    const outlet = setOutlet(html`
      <section class="max-w-7xl mx-auto px-6 py-16">
        <p class="text-xs uppercase tracking-[0.2em] text-muted-foreground">Your bag</p>
        <h1 class="mt-2 text-4xl">Bag</h1>
        <div class="mt-12 grid gap-12 md:grid-cols-[1fr_22rem]">
          <ul class="border-t border-border" data-lines>${raw(lines)}</ul>
          ${raw(summaryView())}
        </div>
      </section>
    `);

    // Attach quantity and remove actions
    outlet.querySelector("[data-lines]").addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-action]");
      if (!btn) return;
      const li = btn.closest("li[data-key]");
      const key = li.dataset.key;
      const item = getCart().find((i) => i.key === key);
      if (!item) return;
      const action = btn.dataset.action;
      if (action === "inc") setQty(key, item.qty + 1);
      else if (action === "dec") setQty(key, item.qty - 1);
      else if (action === "remove") removeItem(key);
    });

    // Attach checkout logic
    const checkoutBtn = outlet.querySelector("#btn-checkout");
    if (checkoutBtn) {
      checkoutBtn.addEventListener("click", async () => {
        try {
          const { auth } = await getAuthClient();
          if (!auth.currentUser) {
            toast("Please sign in to place an order");
            navigate("/login");
            return;
          }

          checkoutBtn.disabled = true;
          checkoutBtn.textContent = "Processing...";

          const { db, mod: fsMod } = await getDb();
          const cart = getCart();
          const items = cart.map((item) => {
            const product = products.find((p) => p.id === item.id);
            return {
              id: item.id,
              name: product ? product.name : "Unknown Item",
              price: product ? product.price : 0,
              image: product ? product.image : "/assets/images/p1.jpg",
              size: item.size,
              qty: item.qty,
            };
          });

          const sub = subtotal();
          const shipping = sub >= SHIPPING_FREE_OVER ? 0 : SHIPPING_COST;
          const total = sub + shipping;

          const orderId = "ORD-" + Math.floor(100000 + Math.random() * 900000);
          const orderDoc = {
            items,
            total,
            status: "Processing",
            createdAt: new Date().toISOString(),
          };

          // Save under /users/{uid}/orders for user profile history
          await fsMod.setDoc(fsMod.doc(db, "users", auth.currentUser.uid, "orders", orderId), orderDoc);

          // Save globally under /orders for Admin Panel dashboard
          await fsMod.setDoc(fsMod.doc(db, "orders", orderId), {
            ...orderDoc,
            userEmail: auth.currentUser.email || "anonymous",
            userId: auth.currentUser.uid,
          });

          clearCart();
          toast("Order placed successfully!");
          navigate("/profile");
        } catch (err) {
          console.error("Checkout failed:", err);
          toast("Checkout failed. Please try again.");
          checkoutBtn.disabled = false;
          checkoutBtn.textContent = "Checkout";
        }
      });
    }
  };

  draw();
  const onChange = () => draw();
  window.addEventListener("cart:change", onChange);
}
