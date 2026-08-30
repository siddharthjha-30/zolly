import {
  deleteProduct,
  listProducts,
  seedProducts,
  upsertProduct,
} from "../api.js";
import { getAuthClient, getDb, isConfigured } from "../firebase.js";
import { formatCurrency, html, raw, setOutlet, toast } from "../utils.js";
import { navigate } from "../router.js";

function notConfigured() {
  return html`
    <section class="max-w-2xl mx-auto px-6 py-24 text-center">
      <p class="text-xs uppercase tracking-[0.2em] text-muted-foreground">Admin</p>
      <h1 class="mt-3 text-4xl font-display">Firebase Not Connected</h1>
      <p class="mt-4 text-muted-foreground">
        Please check your Firebase credentials configuration in the project code.
      </p>
    </section>
  `;
}

function loginRequired() {
  return html`
    <section class="max-w-2xl mx-auto px-6 py-24 text-center">
      <p class="text-xs uppercase tracking-[0.2em] text-muted-foreground">Admin</p>
      <h1 class="mt-3 text-4xl font-display">Access Restricted</h1>
      <p class="mt-4 text-muted-foreground">
        Please sign in with your administrator account to access the dashboard.
      </p>
      <a
        href="/login"
        data-link
        class="inline-block mt-8 px-7 py-3 bg-foreground text-background text-sm tracking-wide hover:opacity-90 transition"
        >Sign In</a
      >
    </section>
  `;
}

function accessDenied(email) {
  return html`
    <section class="max-w-2xl mx-auto px-6 py-24 text-center">
      <p class="text-xs uppercase tracking-[0.2em] text-muted-foreground">Admin</p>
      <h1 class="mt-3 text-4xl font-display">Access Denied</h1>
      <p class="mt-4 text-muted-foreground">
        The account <strong class="text-foreground">${email}</strong> does not have administrator privileges.
      </p>
      <div class="flex gap-4 justify-center mt-8">
        <a href="/" data-link class="px-6 py-3 border border-border text-sm tracking-wide hover:bg-muted transition">Return Home</a>
        <button id="btn-switch-admin" class="px-6 py-3 bg-foreground text-background text-sm tracking-wide hover:opacity-90 transition">Switch Account</button>
      </div>
    </section>
  `;
}

function productRow(p) {
  return html`
    <tr data-id="${p.id}" class="border-b border-border align-top">
      <td class="py-4 pr-4">
        <div class="flex items-center gap-3">
          <div class="w-12 h-14 bg-muted overflow-hidden shrink-0 border border-border">
            ${p.image ? raw(`<img src="${p.image}" alt="" class="w-full h-full object-cover" />`) : ""}
          </div>
          <div>
            <p class="text-sm font-medium text-foreground">${p.name || "(untitled)"}</p>
            <p class="text-xs text-muted-foreground font-mono mt-0.5">${p.id}</p>
          </div>
        </div>
      </td>
      <td class="py-4 pr-4 text-sm text-muted-foreground">${p.category || "—"}</td>
      <td class="py-4 pr-4 text-sm tabular-nums font-medium">${p.price != null ? formatCurrency(p.price) : "—"}</td>
      <td class="py-4 text-right whitespace-nowrap">
        <button data-action="edit" class="text-xs uppercase tracking-[0.18em] hover:text-accent mr-4">Edit</button>
        <button data-action="delete" class="text-xs uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground">Delete</button>
      </td>
    </tr>
  `;
}

function orderRow(o) {
  return html`
    <tr data-id="${o.id}" data-user-id="${o.userId || ""}" class="border-b border-border align-middle text-sm">
      <td class="py-4 pr-4 font-mono font-medium">${o.id}</td>
      <td class="py-4 pr-4 text-muted-foreground text-xs">
        <p class="font-medium text-foreground">${o.userEmail || "anonymous"}</p>
        <p class="mt-0.5">${formatDate(o.createdAt)}</p>
      </td>
      <td class="py-4 pr-4 text-xs max-w-xs truncate">
        ${raw(o.items?.map(i => `${i.name} (x${i.qty})${i.size ? ` [${i.size}]` : ""}`).join(", ") || "—")}
      </td>
      <td class="py-4 pr-4 font-medium tabular-nums">${formatCurrency(o.total || 0)}</td>
      <td class="py-4 pr-4">
        <select data-action="status" class="px-2 py-1 text-xs border border-border bg-card outline-none focus:border-accent">
          <option value="Processing" ${o.status === "Processing" ? "selected" : ""}>Processing</option>
          <option value="Shipped" ${o.status === "Shipped" ? "selected" : ""}>Shipped</option>
          <option value="Delivered" ${o.status === "Delivered" ? "selected" : ""}>Delivered</option>
          <option value="Cancelled" ${o.status === "Cancelled" ? "selected" : ""}>Cancelled</option>
        </select>
      </td>
    </tr>
  `;
}

function editorForm(p = {}) {
  const isNew = !p.id;
  return html`
    <form id="editor-form" class="grid gap-4 border border-border p-6 bg-card mb-8">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl">${isNew ? "New product" : "Edit product"}</h2>
        <button type="button" id="editor-close" class="text-xs uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground">Close</button>
      </div>
      <label class="block">
        <span class="text-xs uppercase tracking-[0.18em] text-muted-foreground">ID (slug) *</span>
        <input name="id" required ${isNew ? "" : "readonly"} value="${p.id || ""}" placeholder="cashmere-sweater"
          class="mt-1.5 w-full px-4 py-2.5 text-sm border border-border bg-background focus:border-accent outline-none font-mono" />
      </label>
      <label class="block">
        <span class="text-xs uppercase tracking-[0.18em] text-muted-foreground">Name *</span>
        <input name="name" required value="${p.name || ""}"
          class="mt-1.5 w-full px-4 py-2.5 text-sm border border-border bg-background focus:border-accent outline-none" />
      </label>
      <div class="grid grid-cols-2 gap-4">
        <label class="block">
          <span class="text-xs uppercase tracking-[0.18em] text-muted-foreground">Price (USD) *</span>
          <input name="price" type="number" min="0" step="1" required value="${p.price ?? ""}"
            class="mt-1.5 w-full px-4 py-2.5 text-sm border border-border bg-background focus:border-accent outline-none tabular-nums" />
        </label>
        <label class="block">
          <span class="text-xs uppercase tracking-[0.18em] text-muted-foreground">Category</span>
          <input name="category" value="${p.category || ""}" placeholder="Knitwear"
            class="mt-1.5 w-full px-4 py-2.5 text-sm border border-border bg-background focus:border-accent outline-none" />
        </label>
      </div>
      <label class="block">
        <span class="text-xs uppercase tracking-[0.18em] text-muted-foreground">Image URL</span>
        <input name="image" value="${p.image || ""}" placeholder="/assets/images/p1.jpg or https://..."
          class="mt-1.5 w-full px-4 py-2.5 text-sm border border-border bg-background focus:border-accent outline-none" />
      </label>
      <label class="block">
        <span class="text-xs uppercase tracking-[0.18em] text-muted-foreground">Description</span>
        <textarea name="description" rows="4"
          class="mt-1.5 w-full px-4 py-2.5 text-sm border border-border bg-background focus:border-accent outline-none">${p.description || ""}</textarea>
      </label>
      <div class="flex gap-3 pt-2">
        <button type="submit" class="px-6 py-3 bg-foreground text-background text-sm tracking-wide hover:opacity-90 transition">
          ${isNew ? "Create product" : "Save changes"}
        </button>
      </div>
    </form>
  `;
}

export async function renderAdmin() {
  if (!isConfigured()) {
    setOutlet(notConfigured());
    return;
  }

  // Security check: Must be authenticated and have admin privileges
  const { auth } = await getAuthClient();
  const user = auth.currentUser;
  if (!user) {
    setOutlet(loginRequired());
    return;
  }

  const ADMIN_EMAILS = ["siddharth30127@gmail.com"];
  let isAdmin = ADMIN_EMAILS.includes(user.email);

  if (!isAdmin) {
    try {
      const { db, mod: fsMod } = await getDb();
      const userSnap = await fsMod.getDoc(fsMod.doc(db, "users", user.uid));
      if (userSnap.exists() && userSnap.data().role === "admin") {
        isAdmin = true;
      }
    } catch (err) {
      console.warn("Failed to check Firestore user role:", err);
    }
  }

  if (!isAdmin) {
    const outlet = setOutlet(accessDenied(user.email));
    outlet.querySelector("#btn-switch-admin").addEventListener("click", async () => {
      const { auth: a, mod: authMod } = await getAuthClient();
      await authMod.signOut(a);
      toast("Logged out. Please sign in as an admin.");
      navigate("/login");
    });
    return;
  }

  let activeTab = "products"; // 'products' or 'orders'

  const outlet = setOutlet(html`
    <section class="max-w-7xl mx-auto px-6 py-12">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="text-xs uppercase tracking-[0.2em] text-muted-foreground">Admin</p>
          <h1 class="mt-2 text-4xl font-display">Dashboard</h1>
        </div>
        <div class="flex gap-2" id="action-buttons-slot">
          <!-- Action buttons for Products will load here -->
        </div>
      </div>

      <!-- Dashboard statistics row -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8" id="stats-slot">
        <div class="border border-border p-5 bg-card">
          <p class="text-xs uppercase tracking-[0.15em] text-muted-foreground">Products Catalog</p>
          <p class="text-3xl font-display mt-2" id="stat-products">0</p>
        </div>
        <div class="border border-border p-5 bg-card">
          <p class="text-xs uppercase tracking-[0.15em] text-muted-foreground">Total Orders</p>
          <p class="text-3xl font-display mt-2" id="stat-orders">0</p>
        </div>
        <div class="border border-border p-5 bg-card">
          <p class="text-xs uppercase tracking-[0.15em] text-muted-foreground">Total Revenue</p>
          <p class="text-3xl font-display mt-2 tabular-nums" id="stat-revenue">$0</p>
        </div>
      </div>

      <!-- Tab Buttons -->
      <div class="flex border-b border-border mt-10 text-sm">
        <button type="button" id="tab-products" class="px-6 py-3 border-b-2 font-medium tracking-wide transition-all border-foreground text-foreground">
          Products Catalog
        </button>
        <button type="button" id="tab-orders" class="px-6 py-3 border-b-2 font-medium tracking-wide transition-all border-transparent text-muted-foreground hover:text-foreground">
          Customer Orders
        </button>
      </div>

      <!-- Editor Slot -->
      <div id="editor-slot" class="mt-8"></div>

      <!-- Table Section -->
      <div class="mt-8 overflow-x-auto">
        <table class="w-full text-left" id="admin-table">
          <!-- Loaded dynamically based on active tab -->
        </table>
      </div>
    </section>
  `);

  const statsProducts = outlet.querySelector("#stat-products");
  const statsOrders = outlet.querySelector("#stat-orders");
  const statsRevenue = outlet.querySelector("#stat-revenue");

  const tabProducts = outlet.querySelector("#tab-products");
  const tabOrders = outlet.querySelector("#tab-orders");

  const actionButtonsSlot = outlet.querySelector("#action-buttons-slot");
  const editorSlot = outlet.querySelector("#editor-slot");
  const tableEl = outlet.querySelector("#admin-table");

  async function loadStatsAndRefresh() {
    const productsList = await listProducts();
    statsProducts.textContent = productsList.length;

    let ordersList = [];
    try {
      const { db, mod: fsMod } = await getDb();
      const snap = await fsMod.getDocs(fsMod.collection(db, "orders"));
      ordersList = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.warn("Could not load global orders for stats:", err);
    }

    statsOrders.textContent = ordersList.length;
    const revenue = ordersList.reduce((sum, o) => sum + (o.total || 0), 0);
    statsRevenue.textContent = formatCurrency(revenue);

    // Refresh active tab layout
    if (activeTab === "products") {
      renderProductsView(productsList);
    } else {
      renderOrdersView(ordersList);
    }
  }

  function renderProductsView(productsList) {
    // Action buttons
    actionButtonsSlot.innerHTML = html`
      <button id="btn-seed" class="px-4 py-2 border border-border text-sm hover:bg-muted transition">Seed demo</button>
      <button id="btn-new" class="px-4 py-2 bg-foreground text-background text-sm hover:opacity-90 transition">New product</button>
    `;

    // Table structure
    tableEl.innerHTML = html`
      <thead>
        <tr class="border-b border-border text-xs uppercase tracking-[0.18em] text-muted-foreground">
          <th class="py-3 pr-4 font-normal">Product</th>
          <th class="py-3 pr-4 font-normal">Category</th>
          <th class="py-3 pr-4 font-normal">Price</th>
          <th class="py-3"></th>
        </tr>
      </thead>
      <tbody id="rows-products">
        ${productsList.length === 0
        ? raw(`<tr><td colspan="4" class="py-10 text-center text-muted-foreground text-sm">No products found.</td></tr>`)
        : raw(productsList.map(productRow).join(""))}
      </tbody>
    `;

    // Hook products event listeners
    outlet.querySelector("#btn-new").addEventListener("click", () => openEditor(null));
    outlet.querySelector("#btn-seed").addEventListener("click", async () => {
      if (!confirm("Upload the built-in demo catalog to Firestore?")) return;
      try {
        await seedProducts();
        toast("Seeded demo catalog");
        loadStatsAndRefresh();
      } catch (err) {
        console.error(err);
        toast("Seed failed");
      }
    });

    const rowsEl = outlet.querySelector("#rows-products");
    rowsEl.addEventListener("click", async (e) => {
      const btn = e.target.closest("button[data-action]");
      if (!btn) return;
      const id = btn.closest("tr").dataset.id;
      if (btn.dataset.action === "delete") {
        if (!confirm(`Delete "${id}"? This cannot be undone.`)) return;
        try {
          await deleteProduct(id);
          toast("Deleted");
          loadStatsAndRefresh();
        } catch (err) {
          console.error(err);
          toast("Delete failed");
        }
      } else if (btn.dataset.action === "edit") {
        const p = productsList.find((x) => x.id === id);
        if (p) openEditor(p);
      }
    });
  }

  function renderOrdersView(ordersList) {
    // Action buttons (none for orders, or just a refresh button)
    actionButtonsSlot.innerHTML = html`
      <button id="btn-refresh-orders" class="px-4 py-2 border border-border text-sm hover:bg-muted transition">Refresh Orders</button>
    `;

    // Table structure
    tableEl.innerHTML = html`
      <thead>
        <tr class="border-b border-border text-xs uppercase tracking-[0.18em] text-muted-foreground">
          <th class="py-3 pr-4 font-normal">Order ID</th>
          <th class="py-3 pr-4 font-normal">Customer & Date</th>
          <th class="py-3 pr-4 font-normal">Items</th>
          <th class="py-3 pr-4 font-normal">Total</th>
          <th class="py-3 font-normal">Status</th>
        </tr>
      </thead>
      <tbody id="rows-orders">
        ${ordersList.length === 0
        ? raw(`<tr><td colspan="5" class="py-10 text-center text-muted-foreground text-sm">No customer orders placed yet.</td></tr>`)
        : raw(ordersList.map(orderRow).join(""))}
      </tbody>
    `;

    // Hook orders event listeners
    outlet.querySelector("#btn-refresh-orders").addEventListener("click", () => {
      loadStatsAndRefresh();
      toast("Orders reloaded");
    });

    const rowsEl = outlet.querySelector("#rows-orders");
    rowsEl.addEventListener("change", async (e) => {
      const select = e.target.closest("select[data-action='status']");
      if (!select) return;
      const row = select.closest("tr");
      const orderId = row.dataset.id;
      const userId = row.dataset.userId;
      const newStatus = select.value;

      try {
        const { db, mod: fsMod } = await getDb();
        // Update global order status
        await fsMod.updateDoc(fsMod.doc(db, "orders", orderId), { status: newStatus });
        // Update customer's copy
        if (userId) {
          await fsMod.updateDoc(fsMod.doc(db, "users", userId, "orders", orderId), { status: newStatus });
        }
        toast(`Order ${orderId} updated to ${newStatus}`);
      } catch (err) {
        console.error("Failed to update status:", err);
        toast("Failed to update status");
      }
    });
  }

  function openEditor(product) {
    editorSlot.innerHTML = editorForm(product || {});
    editorSlot.scrollIntoView({ behavior: "smooth", block: "start" });
    const form = editorSlot.querySelector("#editor-form");
    editorSlot.querySelector("#editor-close").addEventListener("click", () => (editorSlot.innerHTML = ""));
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      data.price = Number(data.price);
      try {
        await upsertProduct(data);
        toast("Saved");
        editorSlot.innerHTML = "";
        loadStatsAndRefresh();
      } catch (err) {
        console.error(err);
        toast("Save failed");
      }
    });
  }

  // Hook tab switching
  tabProducts.addEventListener("click", () => {
    activeTab = "products";
    tabProducts.className = "px-6 py-3 border-b-2 font-medium tracking-wide transition-all border-foreground text-foreground";
    tabOrders.className = "px-6 py-3 border-b-2 font-medium tracking-wide transition-all border-transparent text-muted-foreground hover:text-foreground";
    editorSlot.innerHTML = "";
    loadStatsAndRefresh();
  });

  tabOrders.addEventListener("click", () => {
    activeTab = "orders";
    tabOrders.className = "px-6 py-3 border-b-2 font-medium tracking-wide transition-all border-foreground text-foreground";
    tabProducts.className = "px-6 py-3 border-b-2 font-medium tracking-wide transition-all border-transparent text-muted-foreground hover:text-foreground";
    editorSlot.innerHTML = "";
    loadStatsAndRefresh();
  });

  // Initial load
  loadStatsAndRefresh();
}

function formatDate(val) {
  if (!val) return "—";
  const d = new Date(val);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}
