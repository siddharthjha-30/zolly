# Maison — Vanilla HTML + Tailwind + JS

A static ecommerce frontend (no React, no TypeScript) ready to wire up to Firebase.

## Stack

- HTML5
- Tailwind CSS v4 (compiled via the Vite plugin)
- Vanilla JavaScript (ES6 modules)
- History API routing — no framework router

## Run

```bash
bun install         # or npm install
bun run dev         # vite static dev server on :8080
bun run build       # production build to ./dist
```

Open `http://localhost:8080`. Refresh on `/cart` or `/product/:id` works — Vite's SPA fallback serves `index.html`.

## Structure

```
project/
├── index.html
├── css/styles.css         Tailwind entry + theme tokens
├── js/
│   ├── app.js             entry: header, footer, router
│   ├── router.js          History API router
│   ├── api.js             swap stubs with Firebase here
│   ├── cart.js            localStorage cart store + 'cart:change' event
│   ├── products.js        static catalog
│   ├── utils.js           html`` template tag, $, formatCurrency, toast
│   ├── components/        site-header, site-footer, product-card
│   └── pages/             home, product, cart
└── assets/images/         hero + product photography
```
