// Firebase loader. Uses config saved in localStorage via the /settings page.
// Firebase SDK is loaded from a CDN only when config exists — no npm dep.

const CONFIG_KEY = "maison.firebase.config.v1";
const REQUIRED = ["apiKey", "authDomain", "projectId", "appId"];

let appPromise = null;
let cachedDb = null;
let cachedAuth = null;
let firestoreMod = null;
let authMod = null;

const DEFAULT_CONFIG = {
  apiKey: "AIzaSyBMR3rxf1SW98KZ_9C6WAEucwOECu6wekA",
  authDomain: "zolly-42534.firebaseapp.com",
  projectId: "zolly-42534",
  storageBucket: "zolly-42534.firebasestorage.app",
  messagingSenderId: "647894257172",
  appId: "1:647894257172:web:539f8f70abae54f7732101",
  measurementId: "G-6LMXEFJ32N"
};

export function getFirebaseConfig() {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return DEFAULT_CONFIG;
    const cfg = JSON.parse(raw);
    if (!cfg || typeof cfg !== "object") return DEFAULT_CONFIG;
    for (const k of REQUIRED) if (!cfg[k]) return DEFAULT_CONFIG;
    return cfg;
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveFirebaseConfig(cfg) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
  // reset caches so next call reinitialises with the new config
  appPromise = null;
  cachedDb = null;
  cachedAuth = null;
  window.dispatchEvent(new CustomEvent("firebase:config"));
}

export function clearFirebaseConfig() {
  localStorage.removeItem(CONFIG_KEY);
  appPromise = null;
  cachedDb = null;
  cachedAuth = null;
  window.dispatchEvent(new CustomEvent("firebase:config"));
}

export function isConfigured() {
  return !!getFirebaseConfig();
}

async function loadApp() {
  const cfg = getFirebaseConfig();
  if (!cfg) throw new Error("Firebase is not configured. Visit /settings to add your project details.");
  if (appPromise) return appPromise;
  appPromise = (async () => {
    const [{ initializeApp, getApps, getApp }, firestore, auth] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js"),
      import("https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js"),
    ]);
    firestoreMod = firestore;
    authMod = auth;
    const app = getApps().length ? getApp() : initializeApp(cfg);
    return app;
  })();
  return appPromise;
}

export async function getDb() {
  if (cachedDb) return { db: cachedDb, mod: firestoreMod };
  const app = await loadApp();
  cachedDb = firestoreMod.getFirestore(app);
  return { db: cachedDb, mod: firestoreMod };
}

export async function getAuthClient() {
  if (cachedAuth) return { auth: cachedAuth, mod: authMod };
  const app = await loadApp();
  cachedAuth = authMod.getAuth(app);
  return { auth: cachedAuth, mod: authMod };
}
