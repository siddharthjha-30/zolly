import { products as staticProducts } from "./products.js";
import { getDb, isConfigured } from "./firebase.js";

// If Firebase is configured, read/write products from Firestore collection
// "products". Otherwise fall back to the static catalog bundled with the app.

export async function listProducts() {
  if (!isConfigured()) return staticProducts;
  try {
    const { db, mod } = await getDb();
    const snap = await mod.getDocs(mod.collection(db, "products"));
    const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return rows.length ? rows : staticProducts;
  } catch (err) {
    console.error("listProducts firestore error", err);
    return staticProducts;
  }
}

export async function getProduct(id) {
  if (!isConfigured()) {
    return staticProducts.find((p) => p.id === id) || null;
  }
  try {
    const { db, mod } = await getDb();
    const ref = mod.doc(db, "products", id);
    const snap = await mod.getDoc(ref);
    if (snap.exists()) return { id: snap.id, ...snap.data() };
  } catch (err) {
    console.error("getProduct firestore error", err);
  }
  return staticProducts.find((p) => p.id === id) || null;
}

export async function upsertProduct(product) {
  const { db, mod } = await getDb();
  const { id, ...data } = product;
  await mod.setDoc(mod.doc(db, "products", id), data, { merge: true });
}

export async function deleteProduct(id) {
  const { db, mod } = await getDb();
  await mod.deleteDoc(mod.doc(db, "products", id));
}

export async function seedProducts() {
  const { db, mod } = await getDb();
  const batch = mod.writeBatch(db);
  for (const p of staticProducts) {
    const { id, ...data } = p;
    batch.set(mod.doc(db, "products", id), data, { merge: true });
  }
  await batch.commit();
}
