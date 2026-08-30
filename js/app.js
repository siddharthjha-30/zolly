import { renderFooter } from "./components/site-footer.js";
import { renderHeader } from "./components/site-header.js";
import { renderAdmin } from "./pages/admin.js";
import { renderCart } from "./pages/cart.js";
import { renderHome } from "./pages/home.js";
import { renderProduct } from "./pages/product.js";

import { renderLogin } from "./pages/login.js";
import { renderProfile } from "./pages/profile.js";
import { renderSearch } from "./pages/search.js";
import { registerRoute, startRouter } from "./router.js";

renderHeader();
renderFooter();

registerRoute("/", () => renderHome(), {
  title: "Maison — Considered Everyday Essentials",
  description:
    "Maison crafts considered everyday essentials — knitwear, leather goods, and accessories made to last.",
});

registerRoute("/product/:id", (params) => renderProduct(params), {
  title: () => "Maison — Product",
  description: "A considered piece from the Maison collection.",
});

registerRoute("/cart", () => renderCart(), {
  title: "Your Bag — Maison",
  description: "Review the items in your Maison bag.",
});

registerRoute("/login", () => renderLogin(), {
  title: "Sign In — Maison",
  description: "Sign in or create a Maison account.",
});

registerRoute("/profile", () => renderProfile(), {
  title: "My Profile — Maison",
  description: "Manage your Maison profile, settings, and view order history.",
});

registerRoute("/shop", () => renderSearch(), {
  title: "Shop — Maison",
  description: "Explore and filter our considered everyday essentials catalog.",
});



registerRoute("/admin", () => renderAdmin(), {
  title: "Admin — Maison",
  description: "Manage the Maison product catalog.",
});

startRouter();
