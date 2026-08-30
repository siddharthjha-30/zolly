import { count } from "../cart.js";
import { html, raw } from "../utils.js";
import { getAuthClient, getDb, isConfigured } from "../firebase.js";
import { navigate } from "../router.js";

export function renderHeader() {
  const el = document.getElementById("site-header");
  let currentUser = null;
  let isAdmin = false;
  let authSubscribed = false;

  const draw = () => {
    const n = count();
    el.innerHTML = html`
      <div class="border-b border-border bg-background/80 backdrop-blur sticky top-0 z-40">
        <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div class="flex items-center gap-6">
            <a href="/" data-link class="font-display text-2xl tracking-tight">Maison</a>
            
            <form id="header-search-form" class="hidden sm:flex items-center relative max-w-[180px] md:max-w-[240px] w-full">
              <input
                type="search"
                name="q"
                placeholder="Search essentials..."
                class="w-full px-3 py-1.5 pl-8 text-xs border border-border bg-card rounded-md focus:border-accent outline-none transition-colors"
              />
              <svg class="absolute left-2.5 text-muted-foreground pointer-events-none" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </form>
          </div>

          <div class="flex items-center gap-6">
            <nav aria-label="Primary" class="hidden md:flex items-center gap-6 text-sm">
              ${isAdmin
                ? raw(html`<a href="/admin" data-link class="hover:text-accent transition-colors">Admin</a>`)
                : ""
              }
            </nav>

            <div class="flex items-center gap-3">
              ${currentUser
                ? raw(html`
                    <a
                      href="/profile"
                      data-link
                      aria-label="Profile"
                      class="relative inline-flex items-center hover:text-accent transition-colors p-2"
                    >
                      <span class="relative inline-block w-6 h-6 rounded-full overflow-hidden border border-border bg-muted flex items-center justify-center">
                        ${currentUser.photoURL
                          ? raw(html`<img src="${currentUser.photoURL}" alt="" class="w-full h-full object-cover" />`)
                          : raw(html`
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                              </svg>
                            `)
                        }
                      </span>
                    </a>
                  `)
                : raw(html`
                    <a
                      href="/login"
                      data-link
                      aria-label="Sign In"
                      class="relative inline-flex items-center hover:text-accent transition-colors p-2"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </a>
                  `)
              }

              <a
                href="/cart"
                data-link
                aria-label="Open bag${n > 0 ? `, ${n} item${n === 1 ? '' : 's'}` : ''}"
                class="relative inline-flex items-center gap-2 text-sm hover:text-accent transition-colors p-2 -mr-2"
              >
                <span class="relative inline-block">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M5 7h14l-1.2 11.3a2 2 0 0 1-2 1.7H8.2a2 2 0 0 1-2-1.7L5 7Z" />
                    <path d="M9 7V5.5a3 3 0 0 1 6 0V7" />
                  </svg>
                  ${n > 0
                    ? raw(html`<span
                        aria-hidden="true"
                        class="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center rounded-full bg-accent text-accent-foreground text-[10px] font-semibold leading-none"
                        >${n}</span
                      >`)
                    : ""}
                </span>
                <span class="hidden sm:inline">Bag</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    `;

    // Hook search submit
    const searchForm = el.querySelector("#header-search-form");
    if (searchForm) {
      searchForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const q = new FormData(searchForm).get("q");
        if (q.trim()) {
          navigate(`/shop?q=${encodeURIComponent(q.trim())}`);
        }
      });
    }
  };

  draw();

  // Listen to auth changes
  if (isConfigured() && !authSubscribed) {
    authSubscribed = true;
    getAuthClient().then(({ auth, mod }) => {
      mod.onAuthStateChanged(auth, async (user) => {
        currentUser = user;
        isAdmin = false;
        if (user) {
          const ADMIN_EMAILS = ["siddharth30127@gmail.com", "admin@zolly.com"];
          isAdmin = ADMIN_EMAILS.includes(user.email);
          
          if (!isAdmin) {
            try {
              const { db, mod: fsMod } = await getDb();
              const userSnap = await fsMod.getDoc(fsMod.doc(db, "users", user.uid));
              if (userSnap.exists() && userSnap.data().role === "admin") {
                isAdmin = true;
              }
            } catch (err) {
              console.warn("Header failed to verify admin status from Firestore:", err);
            }
          }
        }
        draw();
      });
    });
  }

  window.addEventListener("cart:change", draw);
}
