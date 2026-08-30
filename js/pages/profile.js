import { getAuthClient, getDb, isConfigured } from "../firebase.js";
import { formatCurrency, html, raw, setOutlet, toast } from "../utils.js";
import { navigate } from "../router.js";

export async function renderProfile() {
  if (!isConfigured()) {
    setOutlet(html`
      <section class="max-w-md mx-auto px-6 py-24 text-center">
        <h1 class="text-3xl font-display">Firebase Not Connected</h1>
        <p class="mt-4 text-muted-foreground">Profile requires Firebase configuration. Please check your credentials in the project configuration code.</p>
      </section>
    `);
    return;
  }

  const { auth, mod: authMod } = await getAuthClient();
  const user = auth.currentUser;

  if (!user) {
    navigate("/login", { replace: true });
    return;
  }

  let orders = [];
  try {
    const { db, mod: fsMod } = await getDb();
    // Try to fetch orders from Firestore. We do a try-catch in case index is missing or collection doesn't exist
    const ref = fsMod.collection(db, "users", user.uid, "orders");
    const q = fsMod.query(ref, fsMod.orderBy("createdAt", "desc"));
    const snap = await fsMod.getDocs(q);
    orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn("Failed to fetch orders from Firestore. Falling back to empty order list.", err);
    // If ordering failed, try fetching without order-by
    try {
      const { db, mod: fsMod } = await getDb();
      const snap = await fsMod.getDocs(fsMod.collection(db, "users", user.uid, "orders"));
      orders = snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => b.createdAt - a.createdAt);
    } catch (err2) {
      console.error("Failed fallback order fetch:", err2);
    }
  }

  const isGoogleUser = user.providerData.some((p) => p.providerId === "google.com");

  const draw = () => {
    setOutlet(html`
      <section class="max-w-7xl mx-auto px-6 py-12">
        <p class="text-xs uppercase tracking-[0.2em] text-muted-foreground">Account</p>
        <h1 class="mt-2 text-4xl font-display">Customer Profile</h1>

        <div class="mt-12 grid gap-12 lg:grid-cols-[20rem_1fr]">
          <!-- Profile sidebar info -->
          <aside class="space-y-8">
            <div class="border border-border p-6 bg-card text-center relative overflow-hidden">
              <div class="w-20 h-20 rounded-full bg-accent text-accent-foreground font-display text-3xl flex items-center justify-center mx-auto mb-4 border border-border">
                ${user.photoURL 
                  ? raw(`<img src="${user.photoURL}" alt="" class="w-full h-full rounded-full object-cover" />`)
                  : (user.displayName || user.email || "?").charAt(0).toUpperCase()}
              </div>
              <h2 class="text-lg font-medium">${user.displayName || "Valued Customer"}</h2>
              <p class="text-xs text-muted-foreground mt-1">${user.email}</p>
              
              <div class="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                ${isGoogleUser ? "Google Auth" : "Email & Password"}
              </div>

              <button
                type="button"
                id="profile-logout"
                class="mt-8 w-full py-2.5 border border-border text-xs uppercase tracking-[0.18em] hover:bg-muted transition"
              >
                Log Out
              </button>
            </div>

            <!-- Profile Settings Form -->
            <div class="border border-border p-6 bg-card">
              <h3 class="text-sm uppercase tracking-[0.18em] text-muted-foreground mb-4">Edit Profile</h3>
              <form id="settings-form" class="space-y-4">
                <label class="block">
                  <span class="text-xs uppercase tracking-[0.15em] text-muted-foreground">Display Name</span>
                  <input
                    name="name"
                    type="text"
                    value="${user.displayName || ""}"
                    placeholder="Jane Doe"
                    class="mt-1.5 w-full px-3 py-2 text-sm border border-border bg-background focus:border-accent outline-none"
                  />
                </label>

                ${!isGoogleUser
                  ? html`
                      <label class="block">
                        <span class="text-xs uppercase tracking-[0.15em] text-muted-foreground">Change Password</span>
                        <input
                          name="password"
                          type="password"
                          placeholder="New password (min 6 chars)"
                          class="mt-1.5 w-full px-3 py-2 text-sm border border-border bg-background focus:border-accent outline-none"
                        />
                      </label>
                    `
                  : ""}

                <button
                  type="submit"
                  id="settings-submit"
                  class="w-full py-2.5 bg-foreground text-background text-xs uppercase tracking-[0.18em] hover:opacity-90 transition"
                >
                  Save Profile
                </button>
              </form>
            </div>
          </aside>

          <!-- Order History -->
          <main>
            <h2 class="text-2xl mb-6">Order History</h2>
            ${orders.length === 0
              ? raw(html`
                  <div class="border border-border p-12 text-center bg-card">
                    <p class="text-muted-foreground">You haven't placed any orders yet.</p>
                    <a href="/shop" data-link class="inline-block mt-6 px-6 py-3 bg-foreground text-background text-xs uppercase tracking-[0.18em] hover:opacity-90 transition">
                      Shop the Collection
                    </a>
                  </div>
                `)
              : raw(
                  orders
                    .map(
                      (order) => html`
                        <div class="border border-border mb-6 bg-card">
                          <!-- Order header details -->
                          <div class="flex flex-wrap items-center justify-between gap-4 p-4 border-b border-border bg-muted/30 text-xs">
                            <div class="flex gap-6">
                              <div>
                                <p class="uppercase tracking-wider text-muted-foreground">Order Placed</p>
                                <p class="font-medium text-foreground mt-0.5">${formatDate(order.createdAt)}</p>
                              </div>
                              <div>
                                <p class="uppercase tracking-wider text-muted-foreground">Total</p>
                                <p class="font-medium text-foreground mt-0.5">${formatCurrency(order.total)}</p>
                              </div>
                              <div>
                                <p class="uppercase tracking-wider text-muted-foreground">Order ID</p>
                                <p class="font-mono text-foreground mt-0.5">${order.id || "—"}</p>
                              </div>
                            </div>
                            <div>
                              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                ${order.status || "Processing"}
                              </span>
                            </div>
                          </div>
                          <!-- Order items -->
                          <ul class="divide-y divide-border px-6">
                            ${raw(
                              order.items
                                .map(
                                  (item) => html`
                                    <li class="flex items-center gap-4 py-4">
                                      <div class="w-12 h-14 bg-muted overflow-hidden shrink-0 border border-border">
                                        <img src="${item.image}" alt="" class="w-full h-full object-cover" />
                                      </div>
                                      <div class="flex-1 min-w-0">
                                        <p class="text-sm font-medium text-foreground truncate">${item.name}</p>
                                        <p class="text-xs text-muted-foreground mt-0.5">
                                          ${item.size ? `Size ${item.size} · ` : ""}Qty ${item.qty}
                                        </p>
                                      </div>
                                      <p class="text-sm font-medium tabular-nums">${formatCurrency(item.price * item.qty)}</p>
                                    </li>
                                  `,
                                )
                                .join(""),
                            )}
                          </ul>
                        </div>
                      `,
                    )
                    .join(""),
                )}
          </main>
        </div>
      </section>
    `);

    // Handle logout
    document.getElementById("profile-logout").addEventListener("click", async () => {
      try {
        await authMod.signOut(auth);
        toast("Logged out successfully");
        navigate("/");
      } catch (err) {
        console.error("Logout failed:", err);
        toast("Logout failed");
      }
    });

    // Handle profile update
    const form = document.getElementById("settings-form");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById("settings-submit");
      submitBtn.disabled = true;
      submitBtn.classList.add("opacity-50");

      const data = Object.fromEntries(new FormData(form).entries());
      try {
        let nameUpdated = false;
        let passUpdated = false;

        // Update displayName if changed
        if (data.name !== user.displayName) {
          await authMod.updateProfile(user, { displayName: data.name });
          nameUpdated = true;
        }

        // Update password if entered
        if (data.password && data.password.trim().length >= 6) {
          await authMod.updatePassword(user, data.password.trim());
          passUpdated = true;
        }

        if (nameUpdated && passUpdated) {
          toast("Name and password updated");
        } else if (nameUpdated) {
          toast("Display name updated");
        } else if (passUpdated) {
          toast("Password changed");
        } else {
          toast("No changes made");
        }

        // Redraw profile page to show updated settings
        renderProfile();
      } catch (err) {
        console.error("Profile update error:", err);
        if (err.code === "auth/requires-recent-login") {
          toast("Re-authentication required. Please sign out and sign in again.");
        } else {
          toast(err.message || "Failed to update profile");
        }
      } finally {
        submitBtn.disabled = false;
        submitBtn.classList.remove("opacity-50");
      }
    });
  };

  draw();
}

function formatDate(val) {
  if (!val) return "—";
  let d;
  if (val.seconds) {
    d = new Date(val.seconds * 1000);
  } else if (typeof val === "string" || typeof val === "number") {
    d = new Date(val);
  } else if (val instanceof Date) {
    d = val;
  } else {
    return "—";
  }
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
