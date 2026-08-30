// Cart store — persists to localStorage, broadcasts via 'cart:change' event.
import { products } from "./products.js";

const STORAGE_KEY = "maison.cart.v1";

const lineKey = (id, size) => `${id}::${size || "_"}`;

function read() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("cart:change", { detail: items }));
}

export function getCart() {
  return read();
}

export function count() {
  return read().reduce((sum, item) => sum + item.qty, 0);
}

export function subtotal() {
  const items = read();
  return items.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.id);
    return sum + (product ? product.price * item.qty : 0);
  }, 0);
}

export function addItem({ id, size = "", qty = 1 }) {
  const items = read();
  const key = lineKey(id, size);
  const existing = items.find((i) => i.key === key);
  if (existing) {
    existing.qty += qty;
  } else {
    items.push({ key, id, size, qty });
  }
  write(items);
}

export function setQty(key, qty) {
  const items = read();
  const item = items.find((i) => i.key === key);
  if (!item) return;
  if (qty <= 0) {
    write(items.filter((i) => i.key !== key));
  } else {
    item.qty = qty;
    write(items);
  }
}

export function removeItem(key) {
  write(read().filter((i) => i.key !== key));
}

export function clearCart() {
  write([]);
}
