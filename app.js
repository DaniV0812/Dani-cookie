/* =========================================================
   Dani Cookies · Totem de pedidos
   JS puro, sem dependências. Funciona offline (fontes com fallback).
   ========================================================= */

(() => {
  "use strict";

  /* ---------------------------------------------------------
     Utilidades
     --------------------------------------------------------- */

  const money = (value) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const byId = (id) => document.getElementById(id);

  const stage = byId("stage");
  const screens = {
    home: byId("screen-home"),
    menu: byId("screen-menu"),
    cart: byId("screen-cart"),
    checkout: byId("screen-checkout"),
    success: byId("screen-success"),
  };

  let currentScreen = "home";
  let currentFilter = "todos";
  let payment = "pix";
  let cart = loadCart();
  let sheetProduct = null;
  let sheetQty = 1;
  let toastTimer = null;
  let successTimer = null;

  /* ---------------------------------------------------------
     Dados
     --------------------------------------------------------- */

  const CATEGORIES = [
    { id: "todos", label: "Todos" },
    { id: "classicos", label: "Clássicos" },
    { id: "recheados", label: "Recheados" },
    { id: "especiais", label: "Especiais" },
    { id: "bebidas", label: "Bebidas" },
  ];

  const PRODUCTS = [
    {
      id: "classico",
      name: "Clássico Chocolate",
      desc: "Massa amanteigada com gotas de chocolate meio amargo e borda crocante.",
      price: 12,
      cat: "classicos",
      tag: "Mais pedido",
      tags: ["Feito na hora", "Contém glúten", "Serve 1"],
      seed: 11,
      kind: "cookie",
      base: "#cf9463",
      edge: "#8b5836",
      chip: "#3a2218",
    },
    {
      id: "nutella",
      name: "Recheado de Nutella",
      desc: "Cookie macio com coração generoso de Nutella que escorre na primeira mordida.",
      price: 14,
      cat: "recheados",
      tag: "Favorito",
      tags: ["Recheio cremoso", "Contém glúten", "Serve 1"],
      seed: 23,
      kind: "cookie",
      base: "#c98a55",
      edge: "#7e4c2c",
      chip: "#4b2b17",
    },
    {
      id: "redvelvet",
      name: "Red Velvet",
      desc: "Massa vermelha aveludada com brigadeiro branco e um toque de baunilha.",
      price: 15,
      cat: "recheados",
      tags: ["Recheio de brigadeiro", "Contém glúten", "Serve 1"],
      seed: 37,
      kind: "cookie",
      base: "#b4544a",
      edge: "#7c2f2b",
      chip: "#f3e3d6",
    },
    {
      id: "docedeleite",
      name: "Doce de Leite & Flor de Sal",
      desc: "Recheio cremoso de doce de leite com flor de sal para equilibrar o açúcar.",
      price: 15,
      cat: "especiais",
      tag: "Novidade",
      tags: ["Doce & salgado", "Contém leite", "Serve 1"],
      seed: 53,
      kind: "cookie",
      base: "#d9a05e",
      edge: "#9a6631",
      chip: "#8e5a2e",
    },
    {
      id: "triple",
      name: "Triple Chocolate",
      desc: "Chocolate belga em três texturas: na massa, nas gotas e nas raspas por cima.",
      price: 16,
      cat: "classicos",
      tag: "Intenso",
      tags: ["70% cacau", "Contém glúten", "Serve 1"],
      seed: 71,
      kind: "cookie",
      base: "#8a5a3b",
      edge: "#4e2c1a",
      chip: "#2a1710",
    },
    {
      id: "vegano",
      name: "Vegano Aveia & Cacau",
      desc: "Aveia em flocos, cacau 70% e óleo de coco. Sem ingredientes de origem animal.",
      price: 13,
      cat: "especiais",
      tag: "Vegano",
      tags: ["100% vegetal", "Rico em fibras", "Serve 1"],
      seed: 89,
      kind: "cookie",
      base: "#b58a5e",
      edge: "#7a5636",
      chip: "#402818",
    },
    {
      id: "pistache",
      name: "Pistache & Chocolate Branco",
      desc: "Pistache torrado moído na massa com lascas grandes de chocolate branco.",
      price: 18,
      cat: "especiais",
      tag: "Premium",
      tags: ["Pistache torrado", "Contém castanhas", "Serve 1"],
      seed: 97,
      kind: "cookie",
      base: "#a9a05a",
      edge: "#6e6a32",
      chip: "#f1e4cb",
    },
    {
      id: "cafe",
      name: "Café Coado",
      desc: "Grãos torrados na casa, coados na hora. Xícara de 200 ml.",
      price: 7,
      cat: "bebidas",
      tags: ["Quente", "200 ml", "Sem açúcar"],
      seed: 103,
      kind: "cup",
      base: "#d9c0a0",
      edge: "#a9805b",
      chip: "#3a2116",
    },
    {
      id: "cappuccino",
      name: "Cappuccino",
      desc: "Espresso encorpado, leite cremoso e uma nuvem de espuma com canela.",
      price: 11,
      cat: "bebidas",
      tags: ["Quente", "300 ml", "Com canela"],
      seed: 113,
      kind: "cup",
      base: "#e3cdb2",
      edge: "#b08a64",
      chip: "#6b4326",
    },
    {
      id: "leite",
      name: "Leite com Chocolate",
      desc: "Chocolate meio amargo derretido lentamente no leite quente. 300 ml.",
      price: 9,
      cat: "bebidas",
      tags: ["Quente", "300 ml", "Contém leite"],
      seed: 127,
      kind: "cup",
      base: "#dcc3a6",
      edge: "#a87f5a",
      chip: "#5a3320",
    },
  ];

  const productById = (id) => PRODUCTS.find((p) => p.id === id);

  /* ---------------------------------------------------------
     Ilustrações SVG
     --------------------------------------------------------- */

  let artSeq = 0;

  function seeded(seed) {
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return () => ((s = (s * 16807) % 2147483647) / 2147483647);
  }

  function smoothPath(pts) {
    const n = pts.length;
    const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const start = mid(pts[n - 1], pts[0]);
    let d = `M${start[0].toFixed(1)} ${start[1].toFixed(1)}`;
    for (let i = 0; i < n; i += 1) {
      const p1 = pts[i];
      const p2 = pts[(i + 1) % n];
      const m = mid(p1, p2);
      d += `Q${p1[0].toFixed(1)} ${p1[1].toFixed(1)} ${m[0].toFixed(1)} ${m[1].toFixed(1)}`;
    }
    return `${d}Z`;
  }

  function cookieArt(p) {
    const r = seeded(p.seed);
    const cx = 100;
    const cy = 100;
    const radius = 66;
    const points = [];

    for (let i = 0; i < 16; i += 1) {
      const angle = (i / 16) * Math.PI * 2;
      const rr = radius + (r() - 0.5) * 10;
      points.push([cx + Math.cos(angle) * rr, cy + Math.sin(angle) * rr]);
    }

    const path = smoothPath(points);
    const gid = `ck${(artSeq += 1)}`;

    let chips = "";
    for (let i = 0; i < 12; i += 1) {
      const angle = r() * Math.PI * 2;
      const dist = Math.sqrt(r()) * 48;
      const x = cx + Math.cos(angle) * dist;
      const y = cy + Math.sin(angle) * dist;
      const rx = 3 + r() * 4.2;
      const ry = rx * (0.68 + r() * 0.42);
      const rot = (r() * 100 - 50).toFixed(0);
      chips += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${rx.toFixed(
        1
      )}" ry="${ry.toFixed(1)}" transform="rotate(${rot} ${x.toFixed(1)} ${y.toFixed(
        1
      )})" fill="${p.chip}"/>`;
    }

    let crumbs = "";
    for (let i = 0; i < 4; i += 1) {
      const angle = r() * Math.PI * 2;
      const dist = 70 + r() * 12;
      const x = cx + Math.cos(angle) * dist;
      const y = cy + Math.sin(angle) * dist;
      const size = 2 + r() * 2.6;
      crumbs += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${size.toFixed(
        1
      )}" fill="${p.edge}" opacity=".55"/>`;
    }

    return `
      <svg viewBox="0 0 200 200" role="img" aria-hidden="true">
        <defs>
          <radialGradient id="${gid}" cx="36%" cy="28%" r="82%">
            <stop offset="0%" stop-color="${p.base}"/>
            <stop offset="62%" stop-color="${p.base}"/>
            <stop offset="100%" stop-color="${p.edge}"/>
          </radialGradient>
        </defs>
        <ellipse cx="100" cy="178" rx="54" ry="10" fill="#2b1a12" opacity=".15"/>
        ${crumbs}
        <path d="${path}" fill="url(#${gid})"/>
        <path d="${path}" fill="none" stroke="${p.edge}" stroke-opacity=".45" stroke-width="2"/>
        ${chips}
        <ellipse cx="72" cy="62" rx="23" ry="13" transform="rotate(-24 72 62)" fill="#fff" opacity=".16"/>
      </svg>`;
  }

  function cupArt(p) {
    const gid = `cp${(artSeq += 1)}`;
    return `
      <svg viewBox="0 0 200 200" role="img" aria-hidden="true">
        <defs>
          <linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${p.base}"/>
            <stop offset="100%" stop-color="${p.edge}"/>
          </linearGradient>
        </defs>
        <ellipse cx="100" cy="178" rx="52" ry="9" fill="#2b1a12" opacity=".16"/>
        <path d="M148 90h8a22 22 0 0 1 0 44h-8" fill="none" stroke="${p.edge}" stroke-width="11" stroke-linecap="round"/>
        <path d="M54 80h92l-8 78a17 17 0 0 1-17 15H79a17 17 0 0 1-17-15l-8-78Z" fill="url(#${gid})"/>
        <ellipse cx="100" cy="80" rx="46" ry="13" fill="#f5ede3"/>
        <ellipse cx="100" cy="80" rx="39" ry="9.5" fill="${p.chip}"/>
        <ellipse cx="88" cy="77" rx="14" ry="4" fill="#fff" opacity=".18"/>
        <path d="M84 56c-6-8 4-11 0-19" fill="none" stroke="${p.edge}" stroke-width="4.5" stroke-linecap="round" opacity=".38"/>
        <path d="M102 52c-6-9 5-12 0-21" fill="none" stroke="${p.edge}" stroke-width="4.5" stroke-linecap="round" opacity=".28"/>
        <path d="M118 58c-5-7 4-10 0-17" fill="none" stroke="${p.edge}" stroke-width="4.5" stroke-linecap="round" opacity=".22"/>
      </svg>`;
  }

  function artFor(p) {
    return p.kind === "cup" ? cupArt(p) : cookieArt(p);
  }

  /* Ilustrações fixas da interface */
  const HOME_COOKIE = {
    seed: 7,
    kind: "cookie",
    base: "#d6a06a",
    edge: "#8f5a35",
    chip: "#37200f",
  };

  const BRAND_COOKIE = {
    seed: 15,
    kind: "cookie",
    base: "#e0b184",
    edge: "#a86f45",
    chip: "#3b2418",
  };

  /* ---------------------------------------------------------
     Carrinho (estado + persistência)
     --------------------------------------------------------- */

  const STORAGE_KEY = "dani-cookies.cart.v1";

  function loadCart() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(
        (item) => item && typeof item.id === "string" && Number.isFinite(item.qty)
      );
    } catch (error) {
      return [];
    }
  }

  function saveCart() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
      /* armazenamento indisponível: segue em memória */
    }
  }

  const cartCount = () => cart.reduce((sum, item) => sum + item.qty, 0);

  const cartTotal = () =>
    cart.reduce((sum, item) => {
      const product = productById(item.id);
      return sum + (product ? product.price * item.qty : 0);
    }, 0);

  function addToCart(id, qty = 1, note = "") {
    const existing = cart.find((item) => item.id === id && (item.note || "") === note);
    if (existing) {
      existing.qty = Math.min(20, existing.qty + qty);
    } else {
      cart.push({ id, qty: Math.min(20, qty), note });
    }
    saveCart();
    afterCartChange();
  }

  function changeQty(id, note, delta) {
    const item = cart.find((entry) => entry.id === id && (entry.note || "") === note);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) {
      cart = cart.filter((entry) => entry !== item);
    }
    saveCart();
    afterCartChange();
  }

  function removeItem(id, note) {
    cart = cart.filter((entry) => !(entry.id === id && (entry.note || "") === note));
    saveCart();
    afterCartChange();
  }

  function afterCartChange() {
    syncChrome();
    renderCart();
    renderCheckout();
  }

  /* ---------------------------------------------------------
     Navegação
     --------------------------------------------------------- */

  function show(name) {
    currentScreen = name;
    stage.dataset.screen = name;

    Object.entries(screens).forEach(([key, element]) => {
      element.classList.toggle("is-active", key === name);
    });

    if (name === "menu") {
      renderMenu();
      byId("screen-menu").querySelector(".scroll-area").scrollTop = 0;
    }
    if (name === "cart") {
      renderCart();
      byId("cartScroll").scrollTop = 0;
    }
    if (name === "checkout") renderCheckout();
  }

  /* ---------------------------------------------------------
     Topo / chrome
     --------------------------------------------------------- */

  function syncChrome() {
    const count = cartCount();
    const badge = byId("cartBadge");
    badge.textContent = count;
    badge.classList.toggle("is-empty", count === 0);

    const floating = byId("floatingCart");
    const hasItems = count > 0;
    floating.hidden = !hasItems || currentScreen !== "menu";
    byId("fCartCount").textContent = count === 1 ? "1 item" : `${count} itens`;
    byId("fCartTotal").textContent = money(cartTotal());

    const bar = byId("cartBar");
    bar.hidden = !hasItems;
    byId("cartEmpty").hidden = hasItems;
    byId("cartTotal").textContent = money(cartTotal());
    byId("goCheckout").disabled = !hasItems;
  }

  function popBadge() {
    const badge = byId("cartBadge");
    badge.classList.remove("pop");
    void badge.offsetWidth;
    badge.classList.add("pop");
  }

  function toast(message) {
    const element = byId("toast");
    element.textContent = message;
    element.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => element.classList.remove("is-visible"), 1700);
  }

  /* ---------------------------------------------------------
     Cardápio
     --------------------------------------------------------- */

  function renderPills() {
    byId("pills").innerHTML = CATEGORIES.map(
      (cat) => `
        <button class="pill${cat.id === currentFilter ? " is-active" : ""}" type="button"
          role="tab" aria-selected="${cat.id === currentFilter}" data-filter="${cat.id}">
          ${cat.label}
        </button>`
    ).join("");
  }

  function renderMenu() {
    renderPills();

    const list =
      currentFilter === "todos"
        ? PRODUCTS
        : PRODUCTS.filter((product) => product.cat === currentFilter);

    byId("productGrid").innerHTML = list
      .map(
        (product, index) => `
        <article class="product-card" data-id="${product.id}" role="button" tabindex="0"
          aria-label="${product.name}, ${money(product.price)}. Ver detalhes."
          style="animation-delay:${index * 45}ms">
          <div class="card-art">
            ${product.tag ? `<span class="card-tag">${product.tag}</span>` : ""}
            ${artFor(product)}
          </div>
          <div class="card-body">
            <h3 class="card-name">${product.name}</h3>
            <p class="card-desc">${product.desc}</p>
          </div>
          <div class="card-foot">
            <p class="card-price"><small>a partir de</small>${money(product.price)}</p>
            <button class="add-btn" type="button" data-add="${product.id}"
              aria-label="Adicionar ${product.name} ao carrinho">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"
                stroke-linecap="round" aria-hidden="true">
                <path d="M12 5v14M5 12h14"/>
              </svg>
            </button>
          </div>
        </article>`
      )
      .join("");

    syncChrome();
  }

  /* ---------------------------------------------------------
     Detalhe do produto
     --------------------------------------------------------- */

  function openSheet(id) {
    const product = productById(id);
    if (!product) return;

    sheetProduct = product;
    sheetQty = 1;

    byId("sheetBody").innerHTML = `
      <div class="sheet-art">
        ${product.tag ? `<span class="card-tag">${product.tag}</span>` : ""}
        ${artFor(product)}
      </div>
      <h2 class="sheet-name">${product.name}</h2>
      <p class="sheet-desc">${product.desc}</p>
      <div class="sheet-tags">
        ${product.tags.map((tag) => `<span>${tag}</span>`).join("")}
      </div>
      <label class="note-field">
        <span>Alguma observação?</span>
        <input id="sheetNote" type="text" maxlength="60" autocomplete="off"
          placeholder="Ex.: embalar separado, sem canela…" />
      </label>
      <div class="sheet-row">
        <div class="stepper">
          <button type="button" data-step="-1" aria-label="Diminuir quantidade">−</button>
          <output id="sheetQty" aria-live="polite">1</output>
          <button type="button" data-step="1" aria-label="Aumentar quantidade">+</button>
        </div>
        <button class="sheet-add" id="sheetAdd" type="button">
          <span>Adicionar</span>
          <strong id="sheetAddTotal">${money(product.price)}</strong>
        </button>
      </div>
    `;

    byId("sheetBody").scrollTop = 0;
    byId("overlay").hidden = false;
    byId("sheet").setAttribute("aria-hidden", "false");

    requestAnimationFrame(() => {
      byId("overlay").classList.add("is-open");
      byId("sheet").classList.add("is-open");
    });
  }

  function closeSheet() {
    const overlay = byId("overlay");
    const sheet = byId("sheet");
    overlay.classList.remove("is-open");
    sheet.classList.remove("is-open");
    sheet.setAttribute("aria-hidden", "true");
    sheetProduct = null;

    setTimeout(() => {
      if (!sheet.classList.contains("is-open")) overlay.hidden = true;
    }, 380);
  }

  function updateSheetTotal() {
    if (!sheetProduct) return;
    byId("sheetQty").textContent = sheetQty;
    byId("sheetAddTotal").textContent = money(sheetProduct.price * sheetQty);
  }

  /* ---------------------------------------------------------
     Carrinho (render)
     --------------------------------------------------------- */

  const trashIcon = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"
      stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M4 7h16"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7"/>
      <path d="M6.5 7l.9 12A2 2 0 0 0 9.4 21h5.2a2 2 0 0 0 2-1.9l.9-12"/>
      <path d="M10.5 11v6M13.5 11v6"/>
    </svg>`;

  function renderCart() {
    const list = byId("cartList");
    const items = cart
      .map((entry) => ({ ...entry, product: productById(entry.id) }))
      .filter((entry) => entry.product);

    list.innerHTML = items
      .map(
        ({ product, qty, note }) => `
        <div class="cart-item" data-id="${product.id}" data-note="${escapeAttr(note || "")}">
          <div class="cart-item-art">${artFor(product)}</div>
          <div class="cart-item-main">
            <p class="cart-item-name">${product.name}</p>
            ${note ? `<p class="cart-item-note">Obs.: ${escapeHtml(note)}</p>` : ""}
            <p class="cart-item-price">${money(product.price)} cada</p>
          </div>
          <div class="cart-item-actions">
            <div class="mini-stepper">
              <button type="button" data-dec aria-label="Diminuir ${product.name}">−</button>
              <output>${qty}</output>
              <button type="button" data-inc aria-label="Aumentar ${product.name}">+</button>
            </div>
            <span class="item-total">${money(product.price * qty)}</span>
            <button class="remove-btn" type="button" data-remove aria-label="Remover ${product.name}">
              ${trashIcon}
            </button>
          </div>
        </div>`
      )
      .join("");

    byId("cartTotal").textContent = money(cartTotal());
    byId("cartBar").hidden = items.length === 0;
    byId("cartEmpty").hidden = items.length > 0;
    syncChrome();
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[char];
    });
  }

  const escapeAttr = escapeHtml;

  /* ---------------------------------------------------------
     Checkout
     --------------------------------------------------------- */

  function renderCheckout() {
    const container = byId("checkoutSummary");

    if (cart.length === 0) {
      container.innerHTML = `<p class="summary-line"><span class="name">Seu carrinho está vazio.</span></p>`;
    } else {
      container.innerHTML = cart
        .map((entry) => {
          const product = productById(entry.id);
          if (!product) return "";
          return `
            <div class="summary-line">
              <span class="qty">${entry.qty}×</span>
              <span class="name">${product.name}${
                entry.note ? ` <em style="color:var(--muted);font-style:normal;font-size:19px">· ${escapeHtml(entry.note)}</em>` : ""
              }</span>
              <span class="value">${money(product.price * entry.qty)}</span>
            </div>`;
        })
        .join("");
    }

    byId("checkoutTotal").textContent = money(cartTotal());
    byId("payBtn").disabled = cart.length === 0;
    byId("payBtn").textContent = payment === "pix" ? "Pagar com Pix" : "Pagar com cartão";
  }

  function selectPayment(kind) {
    payment = kind;
    document.querySelectorAll(".pay-option").forEach((button) => {
      const active = button.dataset.pay === kind;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    renderCheckout();
  }

  /* ---------------------------------------------------------
     Sucesso
     --------------------------------------------------------- */

  function pay() {
    if (cart.length === 0) return;

    const button = byId("payBtn");
    button.disabled = true;
    button.textContent = "Processando…";

    const snapshot = cart.map((entry) => ({ ...entry }));
    const total = cartTotal();
    const name = byId("nameInput").value.trim();

    setTimeout(() => {
      const orderNumber = `#DC-${1000 + Math.floor(Math.random() * 9000)}`;
      byId("orderNumber").textContent = orderNumber;

      const itemCount = snapshot.reduce((sum, entry) => sum + entry.qty, 0);
      const paymentLabel = payment === "pix" ? "Pix" : "Cartão";

      byId("successReceipt").innerHTML = `
        <div class="receipt-line"><span>Itens</span><strong>${itemCount} ${
        itemCount === 1 ? "item" : "itens"
      }</strong></div>
        <div class="receipt-line"><span>Pagamento</span><strong>${paymentLabel} (simulado)</strong></div>
        ${name ? `<div class="receipt-line"><span>Nome</span><strong>${escapeHtml(name)}</strong></div>` : ""}
        <div class="receipt-line receipt-total"><span>Total</span><strong>${money(total)}</strong></div>
      `;

      byId("successMsg").textContent =
        payment === "pix"
          ? "Pague no balcão via Pix e retire seu pedido em até 5 minutos."
          : "Aproxime o cartão no leitor do balcão para finalizar a retirada.";

      cart = [];
      saveCart();
      afterCartChange();
      byId("nameInput").value = "";
      selectPayment(payment);
      closeSheet();

      button.disabled = false;
      show("success");
      startSuccessCountdown();
    }, 1200);
  }

  function startSuccessCountdown() {
    clearInterval(successTimer);
    let left = 12;
    const countEl = byId("successCount");
    const progress = byId("successProgress");
    countEl.textContent = left;
    progress.style.width = "100%";

    successTimer = setInterval(() => {
      left -= 1;
      countEl.textContent = Math.max(left, 0);
      progress.style.width = `${Math.max((left / 12) * 100, 0)}%`;
      if (left <= 0) {
        clearInterval(successTimer);
        goHome(true);
      }
    }, 1000);
  }

  function goHome(resetFilter = false) {
    clearInterval(successTimer);
    closeSheet();
    hideIdle();
    if (resetFilter) {
      currentFilter = "todos";
      byId("nameInput").value = "";
    }
    show("home");
    if (resetFilter) renderMenu();
    syncChrome();
  }

  /* ---------------------------------------------------------
     Inatividade
     --------------------------------------------------------- */

  const IDLE_LIMIT = 60000;
  const IDLE_WARN = 12000;
  let lastActivity = Date.now();
  let idleVisible = false;

  function resetIdle() {
    lastActivity = Date.now();
    if (idleVisible) hideIdle();
  }

  function showIdle() {
    if (idleVisible) return;
    idleVisible = true;
    const idle = byId("idle");
    idle.hidden = false;
    byId("idleArt").innerHTML = cookieArt(HOME_COOKIE);
  }

  function hideIdle() {
    idleVisible = false;
    byId("idle").hidden = true;
  }

  function idleTick() {
    if (currentScreen === "home") {
      lastActivity = Date.now();
      return;
    }

    const elapsed = Date.now() - lastActivity;

    if (elapsed >= IDLE_LIMIT) {
      cart = [];
      saveCart();
      afterCartChange();
      goHome(true);
      lastActivity = Date.now();
      return;
    }

    const remaining = Math.ceil((IDLE_LIMIT - elapsed) / 1000);

    if (elapsed >= IDLE_LIMIT - IDLE_WARN) {
      showIdle();
      byId("idleCount").textContent = Math.min(remaining, 12);
    }
  }

  setInterval(idleTick, 400);

  /* ---------------------------------------------------------
     Escala do palco
     --------------------------------------------------------- */

  function fitStage() {
    const scale = Math.min(window.innerWidth / 1080, window.innerHeight / 1920);
    stage.style.setProperty("--scale", String(scale));
  }

  /* ---------------------------------------------------------
     Eventos
     --------------------------------------------------------- */

  byId("startBtn").addEventListener("click", () => show("menu"));
  byId("brandBtn").addEventListener("click", () => goHome());
  byId("cartBtn").addEventListener("click", () => show("cart"));
  byId("fCartBtn").addEventListener("click", () => show("cart"));
  byId("addMoreBtn").addEventListener("click", () => show("menu"));
  byId("emptyGoMenu").addEventListener("click", () => show("menu"));
  byId("backToCart").addEventListener("click", () => show("cart"));
  byId("idleContinue").addEventListener("click", resetIdle);
  byId("payBtn").addEventListener("click", pay);

  byId("goCheckout").addEventListener("click", () => {
    if (cart.length === 0) return;
    show("checkout");
  });

  /* Pills + cards */
  byId("pills").addEventListener("click", (event) => {
    const pill = event.target.closest("[data-filter]");
    if (!pill) return;
    currentFilter = pill.dataset.filter;
    renderMenu();
  });

  const grid = byId("productGrid");

  grid.addEventListener("click", (event) => {
    const addButton = event.target.closest("[data-add]");
    if (addButton) {
      const product = productById(addButton.dataset.add);
      if (!product) return;
      addToCart(product.id, 1);
      popBadge();
      toast(`${product.name} adicionado`);
      return;
    }
    const card = event.target.closest(".product-card");
    if (card) openSheet(card.dataset.id);
  });

  grid.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const card = event.target.closest(".product-card");
    if (!card) return;
    event.preventDefault();
    openSheet(card.dataset.id);
  });

  /* Sheet */
  byId("sheetClose").addEventListener("click", closeSheet);
  byId("overlay").addEventListener("click", closeSheet);

  byId("sheetBody").addEventListener("click", (event) => {
    const stepButton = event.target.closest("[data-step]");
    if (stepButton && sheetProduct) {
      sheetQty = Math.min(20, Math.max(1, sheetQty + Number(stepButton.dataset.step)));
      updateSheetTotal();
      return;
    }

    const addButton = event.target.closest("#sheetAdd");
    if (addButton && sheetProduct) {
      const noteInput = byId("sheetNote");
      const note = noteInput ? noteInput.value.trim() : "";
      addToCart(sheetProduct.id, sheetQty, note);
      popBadge();
      toast(`${sheetQty}× ${sheetProduct.name} no carrinho`);
      closeSheet();
    }
  });

  /* Cartão / carrinho */
  byId("cartList").addEventListener("click", (event) => {
    const row = event.target.closest(".cart-item");
    if (!row) return;
    const id = row.dataset.id;
    const note = row.dataset.note || "";

    if (event.target.closest("[data-inc]")) {
      changeQty(id, note, 1);
      return;
    }
    if (event.target.closest("[data-dec]")) {
      changeQty(id, note, -1);
      return;
    }
    if (event.target.closest("[data-remove]")) {
      removeItem(id, note);
      toast("Item removido");
    }
  });

  /* Pagamento */
  byId("payOptions").addEventListener("click", (event) => {
    const option = event.target.closest("[data-pay]");
    if (option) selectPayment(option.dataset.pay);
  });

  /* Atividade / idle */
  ["pointerdown", "keydown", "wheel", "touchstart"].forEach((type) => {
    stage.addEventListener(type, resetIdle, { passive: true });
  });

  /* Teclado (útil em testes no navegador) */
  document.addEventListener("keydown", (event) => {
    const typing = /^(INPUT|TEXTAREA)$/.test(event.target.tagName);
    if (event.key === "Escape") closeSheet();
    if (typing) return;
    if (event.key === "f" || event.key === "F") {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.().catch(() => {});
      } else {
        document.exitFullscreen?.().catch(() => {});
      }
    }
  });

  /* Sem menu de contexto / arrastar imagens */
  stage.addEventListener("contextmenu", (event) => event.preventDefault());
  stage.addEventListener("dragstart", (event) => event.preventDefault());

  window.addEventListener("resize", fitStage);
  window.addEventListener("orientationchange", fitStage);

  /* ---------------------------------------------------------
     Inicialização
     --------------------------------------------------------- */

  function init() {
    fitStage();

    byId("brandMark").innerHTML = cookieArt(BRAND_COOKIE);
    byId("homeArt").innerHTML = cookieArt(HOME_COOKIE);
    byId("cartEmpty").querySelector(".empty-art").innerHTML = cookieArt({
      ...HOME_COOKIE,
      seed: 31,
    });

    renderPills();
    renderMenu();
    renderCart();
    renderCheckout();
    syncChrome();
    show("home");

    lastActivity = Date.now();
    if (cart.length > 0) toast("Seu carrinho foi recuperado");
  }

  init();
})();
