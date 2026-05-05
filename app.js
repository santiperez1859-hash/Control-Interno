const CONFIG = window.FT_CONFIG || {};

const CONTACT = {
  owner: "Santiago Pérez",
  whatsapp: "+598 092 768 291",
  waMe: "59892768291",
  email: "santiperez1859@gmail.com",
  instagram: "@59tech.uy",
  instagramUrl: "https://www.instagram.com/59tech.uy",
  prex: "1107459",
};

const DEFAULT_SETTINGS = {
  businessName: "59 Tech",
  ownerName: CONTACT.owner,
  email: CONTACT.email,
  whatsapp: CONTACT.whatsapp,
  instagram: CONTACT.instagram,
  prex: CONTACT.prex,
  mercadoPagoLink: CONFIG.mercadoPagoLink || "PENDIENTE_LINK_MERCADO_PAGO",
  qrPrincipal: "/assets/qr-pago.png",
  qrMercadoPago: "/assets/qr-mercadopago.png",
  logo: "/assets/logo-59tech.svg",
  paymentText:
    "Gracias por confiar en 59 Tech. Elegí el método de pago que prefieras y enviá el comprobante por WhatsApp.",
  fiscalData: "",
};

const SERVICES = [
  {
    title: "Diseño gráfico",
    description:
      "Diseñamos piezas visuales profesionales para que tu marca se vea sólida, moderna y confiable.",
    includes: [
      "logos",
      "branding",
      "identidad visual",
      "flyers",
      "redes",
      "cartelería",
      "banners",
      "diseño comercial",
    ],
  },
  {
    title: "Edición y diseño de video",
    description:
      "Creamos videos, reels y anuncios pensados para captar atención y comunicar con impacto.",
    includes: ["reels", "videos promocionales", "anuncios", "Instagram", "TikTok", "Facebook", "edición profesional"],
  },
  {
    title: "Soluciones digitales",
    description:
      "Implementamos herramientas digitales para que tu negocio trabaje de forma más rápida, clara y ordenada.",
    includes: ["bots de WhatsApp", "automatizaciones", "chats inteligentes", "formularios", "gestión", "flujos digitales"],
  },
  {
    title: "Desarrollo web y apps",
    description:
      "Diseñamos y desarrollamos experiencias digitales modernas, funcionales y preparadas para crecer.",
    includes: ["webs", "landing pages", "portafolios", "sistemas web", "apps simples", "UX/UI", "facturación"],
  },
  {
    title: "Soporte técnico",
    description:
      "Resolvemos problemas de hardware, software y configuración para que la tecnología no frene tu trabajo.",
    includes: ["PC", "programas", "mantenimiento", "optimización", "asistencia", "equipos"],
  },
  {
    title: "Implementación de IA en negocios",
    description:
      "No vendemos tecnología: mejoramos procesos. Aplicamos inteligencia artificial para ahorrar tiempo, automatizar tareas y potenciar negocios.",
    includes: ["automatización", "respuestas automáticas", "contenido", "organización", "administración", "IA interna"],
  },
];

const VALUES = [
  ["Diseño profesional", "Imagen sólida en cada punto de contacto."],
  ["Soluciones prácticas", "Herramientas pensadas para operar mejor."],
  ["Automatización inteligente", "Menos tareas repetidas, más foco."],
  ["Atención cercana", "Comunicación clara y seguimiento real."],
  ["Mejora continua", "Iteramos hasta que la solución rinda."],
];

const STORAGE = {
  session: "ft_session_v1",
  accounts: "ft_accounts_v1",
  clients: "ft_clients_v1",
  payments: "ft_payments_v1",
  services: "ft_services_v1",
  invoices: "ft_invoices_v1",
  settings: "ft_settings_v1",
};

const appState = {
  route: normalizePath(location.pathname),
  adminTab: "dashboard",
  authTab: "login",
  session: readJson(STORAGE.session, null),
  accounts: readJson(STORAGE.accounts, []),
  clients: readJson(STORAGE.clients, []),
  payments: readJson(STORAGE.payments, []),
  services: readJson(STORAGE.services, []),
  invoices: readJson(STORAGE.invoices, []),
  settings: { ...DEFAULT_SETTINGS, ...readJson(STORAGE.settings, {}) },
  editing: {
    client: null,
    payment: null,
    service: null,
    invoice: null,
  },
  invoiceItems: [{ description: "", quantity: 1, price: 0 }],
  filters: {
    clients: "",
    paymentsStatus: "all",
    paymentsMethod: "all",
    paymentsSearch: "",
    servicesSearch: "",
    invoicesSearch: "",
  },
  sound: {
    enabled: false,
    ctx: null,
    gain: null,
  },
  orb: {
    mouseX: 0,
    mouseY: 0,
    targetX: 0,
    targetY: 0,
    boost: 0,
    serviceBoost: 0,
  },
};

let supabaseClientPromise = null;

document.addEventListener("DOMContentLoaded", init);

function init() {
  renderServices();
  renderValues();
  applySettingsToPage();
  applyDemoMode();
  bindGlobalEvents();
  initOrb();
  renderRoute();
}

function bindGlobalEvents() {
  document.addEventListener("click", handleDocumentClick);
  document.addEventListener("submit", handleDocumentSubmit);
  document.addEventListener("input", handleDocumentInput);
  document.addEventListener("change", handleDocumentChange);
  window.addEventListener("popstate", () => {
    appState.route = normalizePath(location.pathname);
    renderRoute();
  });

  const menuToggle = document.querySelector(".menu-toggle");
  menuToggle?.addEventListener("click", () => {
    const open = document.body.classList.toggle("menu-open");
    menuToggle.setAttribute("aria-expanded", String(open));
  });

  document.getElementById("copy-prex")?.addEventListener("click", copyPrexData);
  document.getElementById("sound-toggle")?.addEventListener("click", toggleSound);
  document.getElementById("google-login")?.addEventListener("click", loginWithGoogle);
  document.getElementById("reset-password")?.addEventListener("click", resetPassword);
  document.getElementById("demo-client")?.addEventListener("click", () => demoLogin("client"));
  document.getElementById("demo-admin")?.addEventListener("click", () => demoLogin("admin"));
  document.getElementById("logout-btn")?.addEventListener("click", logout);
}

function handleDocumentClick(event) {
  const routeLink = event.target.closest("[data-route]");
  if (routeLink) {
    event.preventDefault();
    navigate(routeLink.getAttribute("data-route"));
    document.body.classList.remove("menu-open");
    document.querySelector(".menu-toggle")?.setAttribute("aria-expanded", "false");
    return;
  }

  const adminButton = event.target.closest("[data-admin-tab]");
  if (adminButton) {
    setAdminTab(adminButton.getAttribute("data-admin-tab"));
    return;
  }

  const authTab = event.target.closest("[data-auth-tab]");
  if (authTab) {
    setAuthTab(authTab.getAttribute("data-auth-tab"));
    return;
  }

  const action = event.target.closest("[data-action]");
  if (action) {
    runAction(action.getAttribute("data-action"), action.dataset);
  }
}

function handleDocumentSubmit(event) {
  const id = event.target.id;
  if (!id) return;
  if (
    [
      "login-form",
      "signup-form",
      "client-form",
      "payment-form",
      "service-form",
      "invoice-form",
      "settings-form",
    ].includes(id)
  ) {
    event.preventDefault();
  }

  if (id === "login-form") loginWithEmail();
  if (id === "signup-form") createAccount();
  if (id === "client-form") saveClient(new FormData(event.target));
  if (id === "payment-form") savePayment(new FormData(event.target));
  if (id === "service-form") saveServiceJob(new FormData(event.target));
  if (id === "invoice-form") saveInvoice(new FormData(event.target));
  if (id === "settings-form") saveSettings(new FormData(event.target));
}

function handleDocumentInput(event) {
  const { id, value } = event.target;
  if (id === "client-search") {
    appState.filters.clients = value;
    renderClients();
  }
  if (id === "payment-search") {
    appState.filters.paymentsSearch = value;
    renderPayments();
  }
  if (id === "service-search") {
    appState.filters.servicesSearch = value;
    renderServiceJobs();
  }
  if (id === "invoice-search") {
    appState.filters.invoicesSearch = value;
    renderInvoices();
  }
  if (event.target.closest(".invoice-items")) {
    updateInvoiceTotal();
  }
}

function handleDocumentChange(event) {
  const { id, value } = event.target;
  if (id === "payment-status-filter") {
    appState.filters.paymentsStatus = value;
    renderPayments();
  }
  if (id === "payment-method-filter") {
    appState.filters.paymentsMethod = value;
    renderPayments();
  }
  if (id === "invoice-import") {
    importInvoices(event.target.files?.[0]);
  }
  if (id === "invoice-client") {
    fillInvoiceClient(value);
  }
}

function runAction(action, dataset) {
  const id = dataset.id || "";
  const actions = {
    "edit-client": () => editClient(id),
    "delete-client": () => deleteClient(id),
    "clear-client": () => clearClientForm(),
    "edit-payment": () => editPayment(id),
    "delete-payment": () => deletePayment(id),
    "clear-payment": () => clearPaymentForm(),
    "edit-service": () => editServiceJob(id),
    "delete-service": () => deleteServiceJob(id),
    "clear-service": () => clearServiceForm(),
    "edit-invoice": () => editInvoice(id),
    "delete-invoice": () => deleteInvoice(id),
    "clear-invoice": () => clearInvoiceForm(),
    "add-invoice-item": () => addInvoiceItem(),
    "remove-invoice-item": () => removeInvoiceItem(Number(dataset.index)),
    "print-invoice": () => printInvoice(id || appState.editing.invoice),
    "pdf-invoice": () => downloadInvoicePdf(id || appState.editing.invoice),
    "export-invoices": () => exportInvoices(),
    "trigger-import": () => document.getElementById("invoice-import")?.click(),
  };
  actions[action]?.();
}

function navigate(path) {
  const next = normalizePath(path);
  if (next !== appState.route) {
    history.pushState(null, "", next);
    appState.route = next;
  }
  renderRoute();
}

function renderRoute() {
  const page = pageFromRoute(appState.route);
  if (page === "admin" && !isAdmin()) {
    setAuthStatus("Iniciá sesión con un usuario admin para entrar al panel.");
    history.replaceState(null, "", "/login");
    appState.route = "/login";
  }

  if (page === "login" && appState.session?.role === "admin") {
    history.replaceState(null, "", "/admin");
    appState.route = "/admin";
  }

  if (page === "login" && appState.session?.role === "client") {
    history.replaceState(null, "", "/cuenta");
    appState.route = "/cuenta";
  }

  const resolvedPage = pageFromRoute(appState.route);
  document.querySelectorAll(".route-page").forEach((section) => {
    section.hidden = section.dataset.page !== resolvedPage;
  });

  document.body.dataset.page = resolvedPage;
  document.querySelectorAll("[data-route]").forEach((link) => {
    link.classList.toggle("active", normalizePath(link.getAttribute("data-route")) === appState.route);
  });

  if (resolvedPage === "home") {
    requestAnimationFrame(() => {
      if (appState.route === "/servicios") document.getElementById("servicios")?.scrollIntoView({ block: "start" });
      if (appState.route === "/nosotros") document.getElementById("nosotros")?.scrollIntoView({ block: "start" });
      if (appState.route === "/") window.scrollTo({ top: 0, behavior: "smooth" });
    });
  } else {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (resolvedPage === "admin") renderAdmin();
  if (resolvedPage === "cuenta") renderAccount();
  applySettingsToPage();
}

function normalizePath(path) {
  const clean = (path || "/").replace(/\/index\.html$/, "/").replace(/\/+$/, "");
  return clean || "/";
}

function pageFromRoute(route) {
  if (route === "/pagar") return "pagar";
  if (route === "/login") return "login";
  if (route === "/cuenta") return "cuenta";
  if (route === "/admin") return "admin";
  return "home";
}

function renderServices() {
  const grid = document.getElementById("services-grid");
  if (!grid) return;
  grid.innerHTML = SERVICES.map((service, index) => {
    const chips = service.includes.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
    return `
      <article class="service-card" tabindex="0" data-service-card>
        <div>
          <span class="service-index">${String(index + 1).padStart(2, "0")}</span>
          <h3>${escapeHtml(service.title)}</h3>
          <p>${escapeHtml(service.description)}</p>
          <ul class="service-list">${chips}</ul>
        </div>
        <a class="btn btn-ghost" href="https://wa.me/${CONTACT.waMe}?text=${encodeURIComponent(
          `Hola, quiero consultar por ${service.title} de 59 Tech.`
        )}" target="_blank" rel="noreferrer">Consultar servicio</a>
      </article>
    `;
  }).join("");

  grid.querySelectorAll("[data-service-card]").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const rx = ((y / rect.height) - 0.5) * -7;
      const ry = ((x / rect.width) - 0.5) * 7;
      card.style.setProperty("--mx", `${x}px`);
      card.style.setProperty("--my", `${y}px`);
      card.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
      appState.orb.serviceBoost = 1;
    });
    card.addEventListener("pointerleave", () => {
      card.style.transform = "";
      appState.orb.serviceBoost = 0;
    });
    card.addEventListener("focus", () => {
      appState.orb.serviceBoost = 1;
      playPulse(140, 0.02);
    });
    card.addEventListener("blur", () => {
      appState.orb.serviceBoost = 0;
    });
  });
}

function renderValues() {
  const grid = document.getElementById("values-grid");
  if (!grid) return;
  grid.innerHTML = VALUES.map(
    ([title, text]) => `
      <article class="value-card">
        <strong>${escapeHtml(title)}</strong>
        <span>${escapeHtml(text)}</span>
      </article>
    `
  ).join("");
}

function initOrb() {
  const canvas = document.getElementById("tech-orb");
  const fallback = document.querySelector(".orb-fallback");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.style.display = "none";
    fallback.style.display = "block";
    return;
  }

  const particles = Array.from({ length: 96 }, (_, i) => ({
    a: (i / 96) * Math.PI * 2,
    r: 150 + Math.sin(i * 3.1) * 60,
    z: Math.cos(i * 1.7),
    speed: 0.0025 + (i % 9) * 0.00028,
  }));

  window.addEventListener("pointermove", (event) => {
    const rect = canvas.getBoundingClientRect();
    appState.orb.targetX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    appState.orb.targetY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
  });

  let time = 0;
  function draw() {
    const { width, height } = canvas;
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) * 0.29;
    const orb = appState.orb;

    orb.mouseX += (orb.targetX - orb.mouseX) * 0.045;
    orb.mouseY += (orb.targetY - orb.mouseY) * 0.045;
    orb.boost += (orb.serviceBoost - orb.boost) * 0.08;
    time += 1;

    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    for (let i = 0; i < 4; i += 1) {
      const glow = ctx.createRadialGradient(cx, cy, radius * 0.1, cx, cy, radius * (1.4 + i * 0.23));
      glow.addColorStop(0, `rgba(235, 15, 15, ${0.08 + orb.boost * 0.06})`);
      glow.addColorStop(0.45, `rgba(235, 15, 15, ${0.035 + orb.boost * 0.035})`);
      glow.addColorStop(1, "rgba(235, 15, 15, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * (1.5 + i * 0.22), 0, Math.PI * 2);
      ctx.fill();
    }

    particles.forEach((p, i) => {
      const angle = p.a + time * p.speed + orb.mouseX * 0.45;
      const depth = Math.sin(angle + p.z + orb.mouseY * 0.5);
      const x = cx + Math.cos(angle) * (p.r + depth * 22);
      const y = cy + Math.sin(angle * 0.88 + p.z) * (p.r * 0.46) + orb.mouseY * 26;
      const size = (1.5 + depth * 1.2) * (1 + orb.boost * 1.2);
      ctx.fillStyle = i % 4 === 0 ? "rgba(113, 230, 255, 0.38)" : "rgba(235, 15, 15, 0.42)";
      ctx.beginPath();
      ctx.arc(x, y, Math.max(0.7, size), 0, Math.PI * 2);
      ctx.fill();
      if (i % 5 === 0) {
        ctx.strokeStyle = `rgba(235, 15, 15, ${0.05 + orb.boost * 0.06})`;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - Math.cos(angle) * 28, y - Math.sin(angle) * 12);
        ctx.stroke();
      }
    });

    ctx.globalCompositeOperation = "source-over";
    const sphere = ctx.createRadialGradient(
      cx - radius * 0.36 + orb.mouseX * 18,
      cy - radius * 0.44 + orb.mouseY * 14,
      radius * 0.08,
      cx,
      cy,
      radius
    );
    sphere.addColorStop(0, "rgba(255, 255, 255, 0.94)");
    sphere.addColorStop(0.08, "rgba(255, 92, 92, 0.9)");
    sphere.addColorStop(0.28, "rgba(235, 15, 15, 0.94)");
    sphere.addColorStop(0.58, "rgba(62, 8, 8, 0.98)");
    sphere.addColorStop(0.9, "rgba(4, 3, 3, 1)");
    ctx.fillStyle = sphere;
    ctx.beginPath();
    ctx.ellipse(cx + orb.mouseX * 26, cy + orb.mouseY * 18, radius, radius * 0.98, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `rgba(255, 255, 255, ${0.11 + orb.boost * 0.05})`;
    ctx.lineWidth = 2;
    for (let ring = 0; ring < 5; ring += 1) {
      ctx.save();
      ctx.translate(cx + orb.mouseX * 22, cy + orb.mouseY * 18);
      ctx.rotate(time * 0.002 + ring * 0.52);
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * (0.76 + ring * 0.035), radius * (0.15 + ring * 0.05), 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    const shine = ctx.createRadialGradient(cx - radius * 0.38, cy - radius * 0.48, 0, cx - radius * 0.38, cy - radius * 0.48, radius * 0.28);
    shine.addColorStop(0, "rgba(255, 255, 255, 0.86)");
    shine.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = shine;
    ctx.beginPath();
    ctx.arc(cx - radius * 0.36 + orb.mouseX * 12, cy - radius * 0.42 + orb.mouseY * 8, radius * 0.25, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    requestAnimationFrame(draw);
  }
  draw();
}

async function toggleSound() {
  const button = document.getElementById("sound-toggle");
  appState.sound.enabled = !appState.sound.enabled;
  button?.setAttribute("aria-pressed", String(appState.sound.enabled));
  if (button) button.lastChild.textContent = appState.sound.enabled ? " Sonido on" : " Sonido off";
  if (appState.sound.enabled) {
    await ensureAudio();
    playPulse(220, 0.035);
  }
}

async function ensureAudio() {
  if (appState.sound.ctx) return appState.sound.ctx;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  const ctx = new AudioContext();
  const gain = ctx.createGain();
  gain.gain.value = 0.0001;
  gain.connect(ctx.destination);
  appState.sound.ctx = ctx;
  appState.sound.gain = gain;
  return ctx;
}

function playPulse(freq = 180, volume = 0.02) {
  if (!appState.sound.enabled || !appState.sound.ctx || !appState.sound.gain) return;
  const ctx = appState.sound.ctx;
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(freq * 1.8, ctx.currentTime + 0.08);
  filter.type = "lowpass";
  filter.frequency.value = 900;
  osc.connect(filter);
  filter.connect(appState.sound.gain);
  appState.sound.gain.gain.cancelScheduledValues(ctx.currentTime);
  appState.sound.gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  appState.sound.gain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + 0.02);
  appState.sound.gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
  osc.start();
  osc.stop(ctx.currentTime + 0.2);
}

async function copyPrexData() {
  const text = `Pago por Prex Uruguay
Nombre: ${CONTACT.owner}
Cuenta Prex: ${appState.settings.prex}
Celular: ${CONTACT.whatsapp}
Concepto: Servicio 59 Tech`;
  try {
    await navigator.clipboard.writeText(text);
    document.getElementById("copy-feedback").textContent = "Datos copiados correctamente.";
    toast("Datos de Prex copiados.", "success");
  } catch {
    const fallback = document.createElement("textarea");
    fallback.value = text;
    document.body.appendChild(fallback);
    fallback.select();
    document.execCommand("copy");
    fallback.remove();
    document.getElementById("copy-feedback").textContent = "Datos copiados correctamente.";
  }
}

async function getSupabaseClient() {
  const supabaseUrl = CONFIG.supabaseUrl || CONFIG.SUPABASE_URL;
  const supabaseAnonKey = CONFIG.supabaseAnonKey || CONFIG.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;
  if (!supabaseClientPromise) {
    supabaseClientPromise = import("https://esm.sh/@supabase/supabase-js@2").then(({ createClient }) =>
      createClient(supabaseUrl, supabaseAnonKey)
    );
  }
  return supabaseClientPromise;
}

async function loginWithEmail() {
  const email = document.getElementById("login-email").value.trim().toLowerCase();
  const password = document.getElementById("login-password").value;
  const supabase = await getSupabaseClient();

  if (supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setAuthStatus(error.message, true);
      return;
    }
    const role = await resolveSupabaseRole(supabase, data.user);
    setSession({
      id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.full_name || data.user.email,
      role,
      provider: "supabase",
    });
    navigate(role === "admin" ? "/admin" : "/cuenta");
    return;
  }

  const account = appState.accounts.find((item) => item.email === email);
  if (!account) {
    setAuthStatus("Cuenta no encontrada en modo demo. Podés crear una cuenta local o configurar Supabase.", true);
    return;
  }
  const hash = await hashPassword(password);
  if (hash !== account.passwordHash) {
    setAuthStatus("Contraseña incorrecta para esta cuenta demo.", true);
    return;
  }
  setSession({ id: account.id, email: account.email, name: account.name, role: "client", provider: "demo" });
  navigate("/cuenta");
}

async function createAccount() {
  const name = document.getElementById("signup-name").value.trim();
  const email = document.getElementById("signup-email").value.trim().toLowerCase();
  const password = document.getElementById("signup-password").value;
  const supabase = await getSupabaseClient();

  if (supabase) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name, role: "client" } },
    });
    if (error) {
      setAuthStatus(error.message, true);
      return;
    }
    setAuthStatus("Cuenta creada. Revisá tu correo si Supabase requiere confirmación.");
    return;
  }

  if (appState.accounts.some((account) => account.email === email)) {
    setAuthStatus("Ese correo ya existe en modo demo.", true);
    return;
  }
  appState.accounts.push({
    id: uid(),
    name,
    email,
    passwordHash: await hashPassword(password),
    createdAt: new Date().toISOString(),
  });
  saveJson(STORAGE.accounts, appState.accounts);
  setSession({ id: uid(), email, name, role: "client", provider: "demo" });
  navigate("/cuenta");
}

async function loginWithGoogle() {
  const supabase = await getSupabaseClient();
  if (!supabase) {
    setAuthStatus("Google Login requiere configurar Supabase URL y anon key en config.js.", true);
    return;
  }
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${location.origin}/cuenta` },
  });
  if (error) setAuthStatus(error.message, true);
}

async function resetPassword() {
  const email = document.getElementById("login-email").value.trim().toLowerCase();
  if (!email) {
    setAuthStatus("Ingresá tu correo para recuperar contraseña.", true);
    return;
  }
  const supabase = await getSupabaseClient();
  if (!supabase) {
    setAuthStatus("Recuperar contraseña requiere Supabase configurado.", true);
    return;
  }
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${location.origin}/login`,
  });
  setAuthStatus(error ? error.message : "Te enviamos un correo de recuperación.");
}

async function resolveSupabaseRole(supabase, user) {
  if (!user) return "client";
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  return data?.role === "admin" ? "admin" : "client";
}

function demoLogin(role) {
  if (CONFIG.enableDemo === false) {
    setAuthStatus("El modo demo está desactivado en esta instalación.", true);
    return;
  }
  if (role === "admin") ensureDemoData();
  setSession({
    id: uid(),
    email: role === "admin" ? CONTACT.email : "cliente.demo@59tech.uy",
    name: role === "admin" ? CONTACT.owner : "Cliente Demo",
    role,
    provider: "demo",
    demo: true,
  });
  navigate(role === "admin" ? "/admin" : "/cuenta");
}

function applyDemoMode() {
  if (CONFIG.enableDemo === false) {
    document.querySelector(".demo-access")?.setAttribute("hidden", "");
  }
}

function setSession(session) {
  appState.session = session;
  saveJson(STORAGE.session, session);
  toast(`Sesión iniciada como ${session.role === "admin" ? "admin" : "cliente"}.`);
}

function logout() {
  localStorage.removeItem(STORAGE.session);
  appState.session = null;
  toast("Sesión cerrada.");
  navigate("/");
}

function setAuthTab(tab) {
  appState.authTab = tab;
  document.querySelectorAll(".auth-tab").forEach((button) => button.classList.toggle("active", button.dataset.authTab === tab));
  document.getElementById("login-form").hidden = tab !== "login";
  document.getElementById("signup-form").hidden = tab !== "signup";
  setAuthStatus("");
}

function setAuthStatus(message, error = false) {
  const status = document.getElementById("auth-status");
  if (!status) return;
  status.textContent = message;
  status.style.color = error ? "var(--danger)" : "var(--muted)";
}

function isAdmin() {
  return appState.session?.role === "admin";
}

function renderAccount() {
  const target = document.getElementById("account-content");
  if (!target) return;
  if (!appState.session) {
    target.innerHTML = `
      <article class="account-card">
        <h2>Necesitás iniciar sesión</h2>
        <p>Entrá con tu cuenta para ver accesos rápidos y datos básicos.</p>
        <a class="btn btn-primary" href="/login" data-route="/login">Iniciar sesión</a>
      </article>
    `;
    return;
  }

  const invoices = appState.invoices.filter((invoice) => invoice.email === appState.session.email);
  const payments = appState.payments.filter((payment) => payment.email === appState.session.email);
  target.innerHTML = `
    <article class="account-card">
      <div>
        <span class="section-kicker">Sesión activa</span>
        <h2>${escapeHtml(appState.session.name || appState.session.email)}</h2>
        <p>${escapeHtml(appState.session.email)} · ${escapeHtml(appState.session.provider || "demo")}</p>
      </div>
      <div class="metrics-grid">
        <div class="metric-card"><span>Facturas</span><strong>${invoices.length}</strong></div>
        <div class="metric-card"><span>Pagos</span><strong>${payments.length}</strong></div>
        <div class="metric-card"><span>Acceso</span><strong>${appState.session.role}</strong></div>
      </div>
      <div class="hero-actions">
        <a class="btn btn-primary" href="/pagar" data-route="/pagar">Pagar servicio</a>
        <a class="btn btn-ghost" href="https://wa.me/${CONTACT.waMe}?text=${encodeURIComponent(
          "Hola, quiero consultar el estado de mi servicio en 59 Tech."
        )}" target="_blank" rel="noreferrer">Consultar por WhatsApp</a>
        ${isAdmin() ? '<a class="btn btn-ghost" href="/admin" data-route="/admin">Ir al panel admin</a>' : ""}
        <button class="btn btn-ghost" type="button" id="logout-account">Cerrar sesión</button>
      </div>
    </article>
  `;
  document.getElementById("logout-account")?.addEventListener("click", logout);
}

function setAdminTab(tab) {
  appState.adminTab = tab;
  document.querySelectorAll("[data-admin-tab]").forEach((button) => button.classList.toggle("active", button.dataset.adminTab === tab));
  document.querySelectorAll("[data-admin-panel]").forEach((panel) => {
    panel.hidden = panel.dataset.adminPanel !== tab;
  });
  const titles = {
    dashboard: "Dashboard",
    clients: "Clientes",
    payments: "Pagos",
    services: "Servicios",
    invoices: "Facturas",
    settings: "Configuración",
  };
  document.getElementById("admin-title").textContent = titles[tab] || "Dashboard";
  renderAdminPanel(tab);
}

function renderAdmin() {
  document.getElementById("session-pill").textContent = `${appState.session?.email || "Sin sesión"}${appState.session?.demo ? " · demo" : ""}`;
  setAdminTab(appState.adminTab);
}

function renderAdminPanel(tab) {
  if (tab === "dashboard") renderDashboard();
  if (tab === "clients") renderClients();
  if (tab === "payments") renderPayments();
  if (tab === "services") renderServiceJobs();
  if (tab === "invoices") renderInvoices();
  if (tab === "settings") renderSettings();
}

function renderDashboard() {
  const totalIncome = appState.payments
    .filter((payment) => payment.status === "confirmado")
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const pendingServices = appState.services.filter((item) => ["pendiente", "en proceso"].includes(item.status)).length;
  const outstanding = appState.invoices.filter((invoice) => invoice.status === "pendiente").length;

  document.getElementById("admin-dashboard").innerHTML = `
    <div class="metrics-grid">
      <div class="metric-card"><span>Total de clientes</span><strong>${appState.clients.length}</strong></div>
      <div class="metric-card"><span>Pagos registrados</span><strong>${appState.payments.length}</strong></div>
      <div class="metric-card"><span>Facturas creadas</span><strong>${appState.invoices.length}</strong></div>
      <div class="metric-card"><span>Servicios pendientes</span><strong>${pendingServices}</strong></div>
      <div class="metric-card"><span>Ingresos estimados</span><strong>${fmtMoney(totalIncome)}</strong></div>
    </div>
    <div class="admin-grid">
      <article class="admin-card">
        <h2>Accesos rápidos</h2>
        <div class="hero-actions">
          <button class="btn btn-primary" type="button" data-admin-tab="clients">Nuevo cliente</button>
          <button class="btn btn-ghost" type="button" data-admin-tab="payments">Registrar pago</button>
          <button class="btn btn-ghost" type="button" data-admin-tab="invoices">Crear factura</button>
        </div>
      </article>
      <article class="data-panel">
        <h2>Estado operativo</h2>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Módulo</th><th>Dato</th><th>Estado</th></tr></thead>
            <tbody>
              <tr><td>Facturación</td><td>${outstanding} pendiente(s)</td><td><span class="status-badge">Activa</span></td></tr>
              <tr><td>Auth</td><td>${CONFIG.supabaseUrl ? "Supabase configurado" : "Supabase pendiente"}</td><td><span class="status-badge">${CONFIG.supabaseUrl ? "Producción" : "Demo"}</span></td></tr>
              <tr><td>Pagos</td><td>${appState.settings.mercadoPagoLink === "PENDIENTE_LINK_MERCADO_PAGO" ? "Mercado Pago pendiente" : "Mercado Pago listo"}</td><td><span class="status-badge">Editable</span></td></tr>
            </tbody>
          </table>
        </div>
      </article>
    </div>
  `;
}

function renderClients() {
  const current = appState.editing.client ? appState.clients.find((client) => client.id === appState.editing.client) : null;
  const query = appState.filters.clients.toLowerCase();
  const clients = appState.clients.filter((client) =>
    [client.name, client.email, client.phone, client.company, client.instagram].some((value) => String(value || "").toLowerCase().includes(query))
  );

  document.getElementById("admin-clients").innerHTML = `
    <div class="admin-grid">
      <article class="admin-card">
        <h2>${current ? "Editar cliente" : "Crear cliente"}</h2>
        <form id="client-form" class="panel-form">
          <input type="hidden" name="id" value="${escapeAttr(current?.id || "")}">
          <div class="form-grid">
            ${field("Nombre", "name", current?.name, "text", true)}
            ${field("Correo", "email", current?.email, "email")}
            ${field("Teléfono", "phone", current?.phone, "tel")}
            ${field("Instagram / red social", "instagram", current?.instagram)}
            ${field("Empresa", "company", current?.company)}
            ${field("RUT opcional", "rut", current?.rut)}
            <label>Estado
              <select name="status">
                ${option("activo", "Activo", current?.status)}
                ${option("inactivo", "Inactivo", current?.status)}
              </select>
            </label>
            <label class="span-2">Notas
              <textarea name="notes">${escapeHtml(current?.notes || "")}</textarea>
            </label>
          </div>
          <div class="form-actions">
            <button class="btn btn-primary" type="submit">${current ? "Guardar cambios" : "Crear cliente"}</button>
            <button class="btn btn-ghost" type="button" data-action="clear-client">Limpiar</button>
          </div>
        </form>
      </article>
      <article class="data-panel">
        <div class="toolbar">
          <h2>Clientes</h2>
          <input id="client-search" type="search" placeholder="Buscar cliente..." value="${escapeAttr(appState.filters.clients)}">
        </div>
        ${renderClientTable(clients)}
      </article>
    </div>
  `;
}

function renderClientTable(clients) {
  if (!clients.length) return '<p class="empty">No hay clientes cargados todavía.</p>';
  return `
    <div class="table-wrap">
      <table>
        <thead><tr><th>Nombre</th><th>Contacto</th><th>Empresa</th><th>Estado</th><th></th></tr></thead>
        <tbody>${clients.map((client) => `
          <tr>
            <td><strong>${escapeHtml(client.name)}</strong><br><span>${fmtDate(client.createdAt)}</span></td>
            <td>${escapeHtml(client.email || "Sin correo")}<br>${escapeHtml(client.phone || "Sin teléfono")}</td>
            <td>${escapeHtml(client.company || "-")}<br>${escapeHtml(client.rut || "")}</td>
            <td><span class="status-badge">${escapeHtml(client.status || "activo")}</span></td>
            <td><div class="row-actions">
              <button class="mini-btn" type="button" data-action="edit-client" data-id="${client.id}">Editar</button>
              <button class="mini-btn danger" type="button" data-action="delete-client" data-id="${client.id}">Eliminar</button>
            </div></td>
          </tr>`).join("")}</tbody>
      </table>
    </div>
  `;
}

function saveClient(form) {
  const id = form.get("id") || uid();
  const client = {
    id,
    name: form.get("name").trim(),
    email: form.get("email").trim(),
    phone: form.get("phone").trim(),
    instagram: form.get("instagram").trim(),
    company: form.get("company").trim(),
    rut: form.get("rut").trim(),
    notes: form.get("notes").trim(),
    status: form.get("status"),
    createdAt: appState.clients.find((item) => item.id === id)?.createdAt || todayISO(),
  };
  if (!client.name) {
    toast("El nombre del cliente es obligatorio.", "error");
    return;
  }
  upsert("clients", client);
  appState.editing.client = null;
  renderClients();
  renderDashboard();
  toast("Cliente guardado.");
}

function editClient(id) {
  appState.editing.client = id;
  renderClients();
}

function clearClientForm() {
  appState.editing.client = null;
  renderClients();
}

function deleteClient(id) {
  if (!confirm("¿Eliminar este cliente?")) return;
  appState.clients = appState.clients.filter((client) => client.id !== id);
  saveJson(STORAGE.clients, appState.clients);
  renderClients();
  toast("Cliente eliminado.");
}

function renderPayments() {
  const current = appState.editing.payment ? appState.payments.find((payment) => payment.id === appState.editing.payment) : null;
  const filtered = appState.payments.filter((payment) => {
    const matchStatus = appState.filters.paymentsStatus === "all" || payment.status === appState.filters.paymentsStatus;
    const matchMethod = appState.filters.paymentsMethod === "all" || payment.method === appState.filters.paymentsMethod;
    const q = appState.filters.paymentsSearch.toLowerCase();
    const matchSearch = [payment.clientName, payment.concept, payment.method, payment.amount].some((value) =>
      String(value || "").toLowerCase().includes(q)
    );
    return matchStatus && matchMethod && matchSearch;
  });

  document.getElementById("admin-payments").innerHTML = `
    <div class="admin-grid">
      <article class="admin-card">
        <h2>${current ? "Editar pago" : "Registrar pago manual"}</h2>
        <form id="payment-form" class="panel-form">
          <input type="hidden" name="id" value="${escapeAttr(current?.id || "")}">
          <div class="form-grid">
            <label>Cliente
              <select name="clientId">${clientOptions(current?.clientId)}</select>
            </label>
            <label>Método
              <select name="method">
                ${["Prex", "Mercado Pago", "efectivo", "Abitab", "Redpagos", "transferencia", "otro"].map((m) => option(m, m, current?.method)).join("")}
              </select>
            </label>
            ${field("Monto", "amount", current?.amount, "number", true)}
            ${field("Fecha", "date", current?.date || todayISO(), "date", true)}
            ${field("Concepto", "concept", current?.concept, "text", true)}
            <label>Estado
              <select name="status">
                ${["pendiente", "confirmado", "rechazado"].map((s) => option(s, labelStatus(s), current?.status)).join("")}
              </select>
            </label>
            ${field("Comprobante opcional", "proofUrl", current?.proofUrl)}
            <label class="span-2">Notas
              <textarea name="notes">${escapeHtml(current?.notes || "")}</textarea>
            </label>
          </div>
          <div class="form-actions">
            <button class="btn btn-primary" type="submit">${current ? "Guardar cambios" : "Registrar pago"}</button>
            <button class="btn btn-ghost" type="button" data-action="clear-payment">Limpiar</button>
          </div>
        </form>
      </article>
      <article class="data-panel">
        <div class="toolbar">
          <h2>Pagos</h2>
          <div class="filters">
            <input id="payment-search" type="search" placeholder="Buscar..." value="${escapeAttr(appState.filters.paymentsSearch)}">
            <select id="payment-status-filter">
              ${option("all", "Todos", appState.filters.paymentsStatus)}
              ${["pendiente", "confirmado", "rechazado"].map((s) => option(s, labelStatus(s), appState.filters.paymentsStatus)).join("")}
            </select>
            <select id="payment-method-filter">
              ${option("all", "Métodos", appState.filters.paymentsMethod)}
              ${["Prex", "Mercado Pago", "efectivo", "Abitab", "Redpagos", "transferencia", "otro"].map((m) => option(m, m, appState.filters.paymentsMethod)).join("")}
            </select>
          </div>
        </div>
        ${renderPaymentTable(filtered)}
      </article>
    </div>
  `;
}

function renderPaymentTable(payments) {
  if (!payments.length) return '<p class="empty">No hay pagos para mostrar.</p>';
  return `
    <div class="table-wrap">
      <table>
        <thead><tr><th>Fecha</th><th>Cliente</th><th>Método</th><th>Monto</th><th>Estado</th><th></th></tr></thead>
        <tbody>${payments.map((payment) => `
          <tr>
            <td>${fmtDate(payment.date)}</td>
            <td>${escapeHtml(payment.clientName || "-")}<br><span>${escapeHtml(payment.concept || "")}</span></td>
            <td>${escapeHtml(payment.method)}</td>
            <td><strong>${fmtMoney(payment.amount)}</strong></td>
            <td><span class="status-badge">${labelStatus(payment.status)}</span></td>
            <td><div class="row-actions">
              <button class="mini-btn" type="button" data-action="edit-payment" data-id="${payment.id}">Editar</button>
              <button class="mini-btn danger" type="button" data-action="delete-payment" data-id="${payment.id}">Eliminar</button>
            </div></td>
          </tr>`).join("")}</tbody>
      </table>
    </div>`;
}

function savePayment(form) {
  const id = form.get("id") || uid();
  const client = appState.clients.find((item) => item.id === form.get("clientId"));
  const payment = {
    id,
    clientId: form.get("clientId"),
    clientName: client?.name || "Cliente sin asignar",
    email: client?.email || "",
    method: form.get("method"),
    amount: Number(form.get("amount") || 0),
    date: form.get("date"),
    concept: form.get("concept").trim(),
    status: form.get("status"),
    proofUrl: form.get("proofUrl").trim(),
    notes: form.get("notes").trim(),
    createdAt: appState.payments.find((item) => item.id === id)?.createdAt || new Date().toISOString(),
  };
  if (!payment.amount || !payment.concept) {
    toast("Monto y concepto son obligatorios.", "error");
    return;
  }
  upsert("payments", payment);
  appState.editing.payment = null;
  renderPayments();
  renderDashboard();
  toast("Pago guardado.");
}

function editPayment(id) {
  appState.editing.payment = id;
  renderPayments();
}

function clearPaymentForm() {
  appState.editing.payment = null;
  renderPayments();
}

function deletePayment(id) {
  if (!confirm("¿Eliminar este pago?")) return;
  appState.payments = appState.payments.filter((payment) => payment.id !== id);
  saveJson(STORAGE.payments, appState.payments);
  renderPayments();
  renderDashboard();
  toast("Pago eliminado.");
}

function renderServiceJobs() {
  const current = appState.editing.service ? appState.services.find((service) => service.id === appState.editing.service) : null;
  const q = appState.filters.servicesSearch.toLowerCase();
  const jobs = appState.services.filter((job) =>
    [job.title, job.clientName, job.type, job.description, job.status].some((value) => String(value || "").toLowerCase().includes(q))
  );

  document.getElementById("admin-services").innerHTML = `
    <div class="admin-grid">
      <article class="admin-card">
        <h2>${current ? "Editar servicio" : "Crear trabajo/servicio"}</h2>
        <form id="service-form" class="panel-form">
          <input type="hidden" name="id" value="${escapeAttr(current?.id || "")}">
          <div class="form-grid">
            <label>Cliente
              <select name="clientId">${clientOptions(current?.clientId)}</select>
            </label>
            ${field("Título", "title", current?.title, "text", true)}
            <label>Tipo de servicio
              <select name="type">${SERVICES.map((service) => option(service.title, service.title, current?.type)).join("")}</select>
            </label>
            ${field("Monto presupuestado", "amount", current?.amount, "number")}
            <label>Estado
              <select name="status">
                ${["pendiente", "en proceso", "entregado", "cobrado", "cancelado"].map((s) => option(s, labelStatus(s), current?.status)).join("")}
              </select>
            </label>
            ${field("Fecha de inicio", "startDate", current?.startDate || todayISO(), "date")}
            ${field("Fecha de entrega", "dueDate", current?.dueDate, "date")}
            <label class="span-2">Descripción
              <textarea name="description">${escapeHtml(current?.description || "")}</textarea>
            </label>
            <label class="span-2">Notas internas
              <textarea name="notes">${escapeHtml(current?.notes || "")}</textarea>
            </label>
          </div>
          <div class="form-actions">
            <button class="btn btn-primary" type="submit">${current ? "Guardar cambios" : "Crear servicio"}</button>
            <button class="btn btn-ghost" type="button" data-action="clear-service">Limpiar</button>
          </div>
        </form>
      </article>
      <article class="data-panel">
        <div class="toolbar">
          <h2>Servicios / Trabajos</h2>
          <input id="service-search" type="search" placeholder="Buscar..." value="${escapeAttr(appState.filters.servicesSearch)}">
        </div>
        ${renderServiceTable(jobs)}
      </article>
    </div>
  `;
}

function renderServiceTable(jobs) {
  if (!jobs.length) return '<p class="empty">No hay servicios cargados.</p>';
  return `
    <div class="table-wrap">
      <table>
        <thead><tr><th>Servicio</th><th>Cliente</th><th>Entrega</th><th>Monto</th><th>Estado</th><th></th></tr></thead>
        <tbody>${jobs.map((job) => `
          <tr>
            <td><strong>${escapeHtml(job.title)}</strong><br><span>${escapeHtml(job.type || "")}</span></td>
            <td>${escapeHtml(job.clientName || "-")}</td>
            <td>${fmtDate(job.dueDate)}</td>
            <td>${fmtMoney(job.amount)}</td>
            <td><span class="status-badge">${labelStatus(job.status)}</span></td>
            <td><div class="row-actions">
              <button class="mini-btn" type="button" data-action="edit-service" data-id="${job.id}">Editar</button>
              <button class="mini-btn danger" type="button" data-action="delete-service" data-id="${job.id}">Eliminar</button>
            </div></td>
          </tr>`).join("")}</tbody>
      </table>
    </div>`;
}

function saveServiceJob(form) {
  const id = form.get("id") || uid();
  const client = appState.clients.find((item) => item.id === form.get("clientId"));
  const job = {
    id,
    clientId: form.get("clientId"),
    clientName: client?.name || "Cliente sin asignar",
    title: form.get("title").trim(),
    type: form.get("type"),
    description: form.get("description").trim(),
    amount: Number(form.get("amount") || 0),
    status: form.get("status"),
    startDate: form.get("startDate"),
    dueDate: form.get("dueDate"),
    notes: form.get("notes").trim(),
    createdAt: appState.services.find((item) => item.id === id)?.createdAt || new Date().toISOString(),
  };
  if (!job.title) {
    toast("El título del servicio es obligatorio.", "error");
    return;
  }
  upsert("services", job);
  appState.editing.service = null;
  renderServiceJobs();
  renderDashboard();
  toast("Servicio guardado.");
}

function editServiceJob(id) {
  appState.editing.service = id;
  renderServiceJobs();
}

function clearServiceForm() {
  appState.editing.service = null;
  renderServiceJobs();
}

function deleteServiceJob(id) {
  if (!confirm("¿Eliminar este servicio?")) return;
  appState.services = appState.services.filter((service) => service.id !== id);
  saveJson(STORAGE.services, appState.services);
  renderServiceJobs();
  renderDashboard();
  toast("Servicio eliminado.");
}

function renderInvoices() {
  const current = appState.editing.invoice ? appState.invoices.find((invoice) => invoice.id === appState.editing.invoice) : null;
  const q = appState.filters.invoicesSearch.toLowerCase();
  const invoices = appState.invoices.filter((invoice) =>
    [invoice.invoiceNumber, invoice.clientName, invoice.status, invoice.total].some((value) => String(value || "").toLowerCase().includes(q))
  );
  if (current) appState.invoiceItems = current.items?.length ? current.items : [{ description: "", quantity: 1, price: 0 }];

  document.getElementById("admin-invoices").innerHTML = `
    <div class="admin-grid">
      <article class="admin-card">
        <h2>${current ? `Factura #${escapeHtml(current.invoiceNumber)}` : "Crear factura"}</h2>
        <form id="invoice-form" class="panel-form invoice-builder">
          <input type="hidden" name="id" value="${escapeAttr(current?.id || "")}">
          <div class="form-grid">
            ${field("N° de factura", "invoiceNumber", current?.invoiceNumber || nextInvoiceNumber(), "text", true)}
            ${field("Fecha", "date", current?.date || todayISO(), "date", true)}
            <label>Cliente
              <select id="invoice-client" name="clientId">${clientOptions(current?.clientId)}</select>
            </label>
            <label>Estado
              <select name="status">
                ${["pendiente", "pagada", "anulada"].map((s) => option(s, labelStatus(s), current?.status)).join("")}
              </select>
            </label>
            ${field("Cliente manual", "clientName", current?.clientName)}
            ${field("Correo", "email", current?.email, "email")}
            ${field("Teléfono", "phone", current?.phone, "tel")}
            <label class="span-2">Notas / adenda
              <textarea name="notes">${escapeHtml(current?.notes || "")}</textarea>
            </label>
          </div>
          <div class="invoice-items">
            <h3>Ítems / servicios</h3>
            <div class="items-list" id="invoice-items-list">${renderInvoiceItems()}</div>
            <button class="btn btn-ghost" type="button" data-action="add-invoice-item">Agregar ítem</button>
          </div>
          <div class="invoice-total">
            <span>Total de la factura</span>
            <strong id="invoice-total">${fmtMoney(invoiceTotalFromDom())}</strong>
          </div>
          <div class="form-actions">
            <button class="btn btn-primary" type="submit">${current ? "Guardar cambios" : "Guardar factura"}</button>
            <button class="btn btn-ghost" type="button" data-action="clear-invoice">Nueva factura</button>
            ${current ? `<button class="btn btn-ghost" type="button" data-action="print-invoice">Imprimir</button>` : ""}
            ${current ? `<button class="btn btn-ghost" type="button" data-action="pdf-invoice">Guardar PDF</button>` : ""}
          </div>
        </form>
      </article>
      <article class="data-panel">
        <div class="toolbar">
          <h2>Facturas</h2>
          <div class="filters">
            <input id="invoice-search" type="search" placeholder="Buscar factura..." value="${escapeAttr(appState.filters.invoicesSearch)}">
            <button class="btn btn-ghost" type="button" data-action="export-invoices">Exportar JSON</button>
            <button class="btn btn-ghost" type="button" data-action="trigger-import">Importar JSON</button>
            <input id="invoice-import" type="file" accept=".json,application/json" hidden>
          </div>
        </div>
        ${renderInvoiceTable(invoices)}
        <p class="empty">FacturApp integrado: datos locales compatibles, import/export JSON, impresión y PDF. Para producción, migrar a Supabase usando el schema incluido.</p>
      </article>
    </div>
  `;
  updateInvoiceTotal();
}

function renderInvoiceItems() {
  return appState.invoiceItems.map((item, index) => `
    <div class="item-row" data-item-row="${index}">
      <label>Descripción
        <input name="item-description" value="${escapeAttr(item.description || "")}" placeholder="Ej: Diseño de logo">
      </label>
      <label>Cantidad
        <input name="item-quantity" type="number" min="0" step="1" value="${escapeAttr(item.quantity || 1)}">
      </label>
      <label>Precio
        <input name="item-price" type="number" min="0" step="0.01" value="${escapeAttr(item.price || 0)}">
      </label>
      <button class="mini-btn danger" type="button" data-action="remove-invoice-item" data-index="${index}" aria-label="Eliminar ítem">X</button>
    </div>
  `).join("");
}

function renderInvoiceTable(invoices) {
  if (!invoices.length) return '<p class="empty">No hay facturas todavía.</p>';
  return `
    <div class="table-wrap">
      <table>
        <thead><tr><th>N°</th><th>Cliente</th><th>Fecha</th><th>Total</th><th>Estado</th><th></th></tr></thead>
        <tbody>${[...invoices].reverse().map((invoice) => `
          <tr>
            <td><strong>#${escapeHtml(invoice.invoiceNumber)}</strong></td>
            <td>${escapeHtml(invoice.clientName || "-")}<br><span>${escapeHtml(invoice.email || "")}</span></td>
            <td>${fmtDate(invoice.date)}</td>
            <td><strong>${fmtMoney(invoice.total)}</strong></td>
            <td><span class="status-badge">${labelStatus(invoice.status)}</span></td>
            <td><div class="row-actions">
              <button class="mini-btn" type="button" data-action="edit-invoice" data-id="${invoice.id}">Editar</button>
              <button class="mini-btn" type="button" data-action="print-invoice" data-id="${invoice.id}">Imprimir</button>
              <button class="mini-btn" type="button" data-action="pdf-invoice" data-id="${invoice.id}">PDF</button>
              <button class="mini-btn danger" type="button" data-action="delete-invoice" data-id="${invoice.id}">Eliminar</button>
            </div></td>
          </tr>`).join("")}</tbody>
      </table>
    </div>`;
}

function addInvoiceItem() {
  syncInvoiceItemsFromDom();
  appState.invoiceItems.push({ description: "", quantity: 1, price: 0 });
  renderInvoices();
}

function removeInvoiceItem(index) {
  syncInvoiceItemsFromDom();
  appState.invoiceItems.splice(index, 1);
  if (!appState.invoiceItems.length) appState.invoiceItems.push({ description: "", quantity: 1, price: 0 });
  renderInvoices();
}

function fillInvoiceClient(clientId) {
  const client = appState.clients.find((item) => item.id === clientId);
  if (!client) return;
  const form = document.getElementById("invoice-form");
  form.elements.clientName.value = client.name || "";
  form.elements.email.value = client.email || "";
  form.elements.phone.value = client.phone || "";
}

function saveInvoice(form) {
  const id = form.get("id") || uid();
  const client = appState.clients.find((item) => item.id === form.get("clientId"));
  const items = syncInvoiceItemsFromDom().filter((item) => item.description);
  const invoiceNumber = form.get("invoiceNumber").trim();
  if (!invoiceNumber || !form.get("date") || !items.length) {
    toast("Número, fecha y al menos un ítem son obligatorios.", "error");
    return;
  }
  if (appState.invoices.some((invoice) => invoice.invoiceNumber === invoiceNumber && invoice.id !== id)) {
    toast("Ya existe una factura con ese número.", "error");
    return;
  }
  const total = items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.price || 0), 0);
  const invoice = {
    id,
    clientId: form.get("clientId"),
    clientName: form.get("clientName").trim() || client?.name || "",
    email: form.get("email").trim() || client?.email || "",
    phone: form.get("phone").trim() || client?.phone || "",
    invoiceNumber,
    date: form.get("date"),
    items,
    subtotal: total,
    total,
    status: form.get("status"),
    notes: form.get("notes").trim(),
    createdAt: appState.invoices.find((item) => item.id === id)?.createdAt || new Date().toISOString(),
  };
  upsert("invoices", invoice);
  appState.editing.invoice = invoice.id;
  renderInvoices();
  renderDashboard();
  toast("Factura guardada.");
}

function editInvoice(id) {
  const invoice = appState.invoices.find((item) => item.id === id);
  if (!invoice) return;
  appState.editing.invoice = id;
  appState.invoiceItems = invoice.items?.length ? invoice.items : [{ description: "", quantity: 1, price: 0 }];
  renderInvoices();
}

function clearInvoiceForm() {
  appState.editing.invoice = null;
  appState.invoiceItems = [{ description: "", quantity: 1, price: 0 }];
  renderInvoices();
}

function deleteInvoice(id) {
  if (!confirm("¿Eliminar esta factura?")) return;
  appState.invoices = appState.invoices.filter((invoice) => invoice.id !== id);
  saveJson(STORAGE.invoices, appState.invoices);
  if (appState.editing.invoice === id) clearInvoiceForm();
  renderInvoices();
  renderDashboard();
  toast("Factura eliminada.");
}

function syncInvoiceItemsFromDom() {
  const rows = Array.from(document.querySelectorAll("[data-item-row]"));
  appState.invoiceItems = rows.map((row) => ({
    description: row.querySelector('[name="item-description"]').value.trim(),
    quantity: Number(row.querySelector('[name="item-quantity"]').value || 0),
    price: Number(row.querySelector('[name="item-price"]').value || 0),
  }));
  return appState.invoiceItems;
}

function invoiceTotalFromDom() {
  return Array.from(document.querySelectorAll("[data-item-row]")).reduce((sum, row) => {
    const quantity = Number(row.querySelector('[name="item-quantity"]')?.value || 0);
    const price = Number(row.querySelector('[name="item-price"]')?.value || 0);
    return sum + quantity * price;
  }, 0);
}

function updateInvoiceTotal() {
  const total = document.getElementById("invoice-total");
  if (total) total.textContent = fmtMoney(invoiceTotalFromDom());
}

function printInvoice(id) {
  const invoice = appState.invoices.find((item) => item.id === id);
  if (!invoice) {
    toast("Guardá la factura antes de imprimir.", "error");
    return;
  }
  buildPrintInvoice(invoice);
  window.print();
}

async function downloadInvoicePdf(id) {
  const invoice = appState.invoices.find((item) => item.id === id);
  if (!invoice) {
    toast("Guardá la factura antes de descargar.", "error");
    return;
  }
  buildPrintInvoice(invoice);
  const printRoot = document.getElementById("print-root");
  if (!window.html2canvas || !window.jspdf) {
    toast("PDF listo por diálogo de impresión porque las librerías aún no cargaron.");
    window.print();
    return;
  }
  try {
    toast("Generando PDF...");
    const canvas = await window.html2canvas(printRoot, {
      scale: 2,
      backgroundColor: "#ffffff",
      width: 794,
      windowWidth: 794,
    });
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imageHeight = (canvas.height * pageWidth) / canvas.width;
    const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
    let remaining = imageHeight;
    let offset = 0;
    pdf.addImage(dataUrl, "JPEG", 0, offset, pageWidth, imageHeight);
    remaining -= pageHeight;
    while (remaining > 0) {
      offset -= pageHeight;
      pdf.addPage();
      pdf.addImage(dataUrl, "JPEG", 0, offset, pageWidth, imageHeight);
      remaining -= pageHeight;
    }
    pdf.save(`Factura_${invoice.invoiceNumber}_${safeFileName(invoice.clientName || "59Tech")}.pdf`);
    toast("PDF descargado.");
  } catch (error) {
    toast("No se pudo generar el PDF. Usá imprimir como alternativa.", "error");
  }
}

function buildPrintInvoice(invoice) {
  const rows = invoice.items.map((item, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${escapeHtml(item.description)}</td>
      <td>${Number(item.quantity || 0)}</td>
      <td>${fmtMoney(item.price)}</td>
      <td>${fmtMoney(Number(item.quantity || 0) * Number(item.price || 0))}</td>
    </tr>
  `).join("");
  document.getElementById("print-root").innerHTML = `
    <article class="invoice-print">
      <header>
        <div>
          <h1>59 Tech</h1>
          <p>${escapeHtml(appState.settings.email)} · ${escapeHtml(appState.settings.whatsapp)}</p>
          <p>${escapeHtml(appState.settings.fiscalData || "Datos fiscales pendientes de configuración")}</p>
        </div>
        <div>
          <h2>Factura #${escapeHtml(invoice.invoiceNumber)}</h2>
          <p>${fmtDate(invoice.date)}</p>
          <p>${labelStatus(invoice.status)}</p>
        </div>
      </header>
      <section>
        <h2>Facturado a</h2>
        <p><strong>${escapeHtml(invoice.clientName)}</strong></p>
        <p>${escapeHtml(invoice.email || "")} ${invoice.phone ? `· ${escapeHtml(invoice.phone)}` : ""}</p>
      </section>
      <table>
        <thead><tr><th>#</th><th>Descripción</th><th>Cant.</th><th>Precio</th><th>Subtotal</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <h2 style="text-align:right;margin-top:24px">Total: ${fmtMoney(invoice.total)}</h2>
      ${invoice.notes ? `<section><h2>Adenda</h2><p>${escapeHtml(invoice.notes)}</p></section>` : ""}
    </article>
  `;
}

function exportInvoices() {
  if (!appState.invoices.length) {
    toast("No hay facturas para exportar.", "error");
    return;
  }
  downloadJson(`facturas_59tech_${todayISO()}.json`, appState.invoices);
  toast("Facturas exportadas.");
}

function importInvoices(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!Array.isArray(data)) throw new Error("Formato inválido");
      const existing = new Set(appState.invoices.map((invoice) => invoice.id));
      const normalized = data
        .filter((invoice) => invoice.id && !existing.has(invoice.id))
        .map(normalizeImportedInvoice);
      appState.invoices = [...appState.invoices, ...normalized];
      saveJson(STORAGE.invoices, appState.invoices);
      renderInvoices();
      renderDashboard();
      toast(`${normalized.length} factura(s) importadas.`);
    } catch {
      toast("Archivo inválido.", "error");
    }
  };
  reader.readAsText(file);
}

function normalizeImportedInvoice(invoice) {
  return {
    id: invoice.id || uid(),
    clientId: invoice.clientId || "",
    clientName: invoice.clientName || invoice.client || "",
    email: invoice.email || "",
    phone: invoice.phone || "",
    invoiceNumber: invoice.invoiceNumber || invoice.number || nextInvoiceNumber(),
    date: invoice.date || todayISO(),
    items: (invoice.items || []).map((item) => ({
      description: item.description || item.desc || "",
      quantity: Number(item.quantity || item.qty || 1),
      price: Number(item.price || item.subtotal || 0),
    })),
    subtotal: Number(invoice.subtotal || invoice.total || 0),
    total: Number(invoice.total || invoice.subtotal || 0),
    status: invoice.status || "pendiente",
    notes: invoice.notes || invoice.desc || "",
    createdAt: invoice.createdAt || invoice.savedAt || new Date().toISOString(),
  };
}

function renderSettings() {
  const s = appState.settings;
  document.getElementById("admin-settings").innerHTML = `
    <article class="admin-card">
      <h2>Configuración de marca y pagos</h2>
      <form id="settings-form" class="panel-form">
        <div class="form-grid">
          ${field("Nombre comercial", "businessName", s.businessName, "text", true)}
          ${field("Nombre de contacto", "ownerName", s.ownerName, "text", true)}
          ${field("Correo", "email", s.email, "email", true)}
          ${field("WhatsApp", "whatsapp", s.whatsapp, "tel", true)}
          ${field("Instagram", "instagram", s.instagram)}
          ${field("Cuenta Prex", "prex", s.prex)}
          ${field("Link Mercado Pago", "mercadoPagoLink", s.mercadoPagoLink)}
          ${field("Logo", "logo", s.logo)}
          ${field("QR principal", "qrPrincipal", s.qrPrincipal)}
          ${field("QR Mercado Pago", "qrMercadoPago", s.qrMercadoPago)}
          <label class="span-2">Textos de pago
            <textarea name="paymentText">${escapeHtml(s.paymentText || "")}</textarea>
          </label>
          <label class="span-2">Datos fiscales
            <textarea name="fiscalData">${escapeHtml(s.fiscalData || "")}</textarea>
          </label>
        </div>
        <div class="form-actions">
          <button class="btn btn-primary" type="submit">Guardar configuración</button>
        </div>
      </form>
    </article>
  `;
}

function saveSettings(form) {
  appState.settings = {
    ...appState.settings,
    businessName: form.get("businessName").trim(),
    ownerName: form.get("ownerName").trim(),
    email: form.get("email").trim(),
    whatsapp: form.get("whatsapp").trim(),
    instagram: form.get("instagram").trim(),
    prex: form.get("prex").trim(),
    mercadoPagoLink: form.get("mercadoPagoLink").trim() || "PENDIENTE_LINK_MERCADO_PAGO",
    logo: form.get("logo").trim() || DEFAULT_SETTINGS.logo,
    qrPrincipal: form.get("qrPrincipal").trim() || DEFAULT_SETTINGS.qrPrincipal,
    qrMercadoPago: form.get("qrMercadoPago").trim() || DEFAULT_SETTINGS.qrMercadoPago,
    paymentText: form.get("paymentText").trim(),
    fiscalData: form.get("fiscalData").trim(),
  };
  saveJson(STORAGE.settings, appState.settings);
  applySettingsToPage();
  toast("Configuración guardada.");
}

function applySettingsToPage() {
  const s = appState.settings;
  document.querySelectorAll('img[src$="logo-59tech.svg"], .brand-logo, .admin-brand img').forEach((img) => {
    img.src = s.logo || DEFAULT_SETTINGS.logo;
  });
  const mpLink = document.getElementById("mp-link");
  const mpStatus = document.getElementById("mp-status");
  if (mpLink && mpStatus) {
    const hasLink = s.mercadoPagoLink && !s.mercadoPagoLink.includes("PENDIENTE");
    mpLink.href = hasLink ? s.mercadoPagoLink : "#";
    mpLink.setAttribute("aria-disabled", String(!hasLink));
    mpStatus.textContent = hasLink ? "Link de Mercado Pago configurado." : "Link de Mercado Pago pendiente de configuración.";
  }
  const qrPrincipal = document.getElementById("qr-principal");
  const qrMercado = document.getElementById("qr-mercadopago");
  if (qrPrincipal) qrPrincipal.src = s.qrPrincipal || DEFAULT_SETTINGS.qrPrincipal;
  if (qrMercado) qrMercado.src = s.qrMercadoPago || DEFAULT_SETTINGS.qrMercadoPago;
}

function ensureDemoData() {
  if (!appState.clients.length) {
    appState.clients = [
      {
        id: uid(),
        name: "Cliente Demo",
        email: "cliente.demo@59tech.uy",
        phone: "+598 99 000 000",
        instagram: "@cliente.demo",
        company: "Negocio Demo",
        rut: "",
        notes: "Cliente de prueba para validar el panel.",
        status: "activo",
        createdAt: todayISO(),
      },
    ];
    saveJson(STORAGE.clients, appState.clients);
  }
  if (!appState.services.length) {
    const client = appState.clients[0];
    appState.services = [
      {
        id: uid(),
        clientId: client.id,
        clientName: client.name,
        title: "Landing premium 59 Tech",
        type: "Desarrollo web y apps",
        description: "Servicio demo para validar estados y dashboard.",
        amount: 14500,
        status: "en proceso",
        startDate: todayISO(),
        dueDate: todayISO(),
        notes: "",
        createdAt: new Date().toISOString(),
      },
    ];
    saveJson(STORAGE.services, appState.services);
  }
}

function clientOptions(selected = "") {
  const options = [`<option value="">Sin asignar</option>`];
  options.push(...appState.clients.map((client) => option(client.id, client.name, selected)));
  return options.join("");
}

function upsert(collection, item) {
  const key = STORAGE[collection];
  const list = appState[collection];
  const index = list.findIndex((entry) => entry.id === item.id);
  if (index >= 0) list[index] = item;
  else list.push(item);
  saveJson(key, list);
}

function field(labelText, name, value = "", type = "text", required = false) {
  return `
    <label>${escapeHtml(labelText)}
      <input name="${escapeAttr(name)}" type="${escapeAttr(type)}" value="${escapeAttr(value ?? "")}" ${required ? "required" : ""}>
    </label>
  `;
}

function option(value, labelText, selected) {
  return `<option value="${escapeAttr(value)}" ${String(selected || "") === String(value) ? "selected" : ""}>${escapeHtml(labelText)}</option>`;
}

function nextInvoiceNumber() {
  const numbers = appState.invoices
    .map((invoice) => parseInt(invoice.invoiceNumber, 10))
    .filter((number) => !Number.isNaN(number));
  return numbers.length ? String(Math.max(...numbers) + 1).padStart(3, "0") : "001";
}

function labelStatus(status) {
  const labels = {
    activo: "Activo",
    inactivo: "Inactivo",
    pendiente: "Pendiente",
    confirmado: "Confirmado",
    rechazado: "Rechazado",
    "en proceso": "En proceso",
    entregado: "Entregado",
    cobrado: "Cobrado",
    cancelado: "Cancelado",
    pagada: "Pagada",
    anulada: "Anulada",
  };
  return labels[status] || status || "-";
}

function fmtMoney(value) {
  return `$ ${Number(value || 0).toLocaleString("es-UY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function fmtDate(value) {
  if (!value) return "-";
  const [year, month, day] = value.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function uid() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 9)}`;
}

async function hashPassword(password) {
  const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(password));
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function readJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function safeFileName(value) {
  return String(value || "archivo").replace(/[^\w.-]+/g, "_");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}

function toast(message, type = "success") {
  const root = document.getElementById("toast-root");
  if (!root) return;
  const item = document.createElement("div");
  item.className = `toast ${type}`;
  item.textContent = message;
  root.appendChild(item);
  setTimeout(() => {
    item.style.opacity = "0";
    item.style.transform = "translateY(10px)";
    setTimeout(() => item.remove(), 180);
  }, 3200);
}
