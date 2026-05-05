# 59 Tech Premium Web

Web premium estática para 59 Tech con experiencia 3D canvas, pagos, login demo/Supabase-ready, panel admin y módulo de facturación integrado desde FacturApp.

## Qué se encontró antes de modificar

- El workspace actual estaba vacío, sin framework, rutas, componentes, estilos ni dependencias previas.
- El ZIP `FacturApp-59-Tech-main (1).zip` contiene un único `index.html`.
- FacturApp original usa HTML/CSS/JS puro, `localStorage`, login validado en frontend, export/import JSON, impresión, PDF con `jsPDF` + `html2canvas` y sincronización JSONBin.
- La integración conserva la lógica útil de facturas, totales, guardado local, import/export, impresión y PDF, pero evita reutilizar el login hardcodeado y la sincronización JSONBin con credenciales en el navegador.

## Ejecutar localmente

```bash
npm run dev
```

Abrí `http://localhost:4173`.

Si tu máquina no tiene npm, podés ejecutar directamente:

```bash
node tools/dev-server.mjs
```

## Build

```bash
npm run build
```

El build queda en `dist/`.

## Publicar en Netlify

1. Subí este proyecto a un repositorio.
2. En Netlify, elegí el repo.
3. Build command: `npm run build`.
4. Publish directory: `dist`.
5. Functions directory: `netlify/functions`.
6. En producción, configurá `config.js` o reemplazalo por un archivo generado en build con tus valores públicos.

## Variables de entorno producción

Estas variables se usan server-side para crear el admin sin exponer claves en frontend:

```bash
SUPABASE_URL=https://TU-PROYECTO.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
ADMIN_EMAIL=santiperez1859@gmail.com
ADMIN_INITIAL_PASSWORD=santiago59
SEED_ADMIN_TOKEN=un-token-largo-privado
```

No pongas `ADMIN_INITIAL_PASSWORD` en `index.html`, `app.js` ni `config.js`.

## Configurar Supabase

1. Creá un proyecto en Supabase.
2. Ejecutá el SQL de `supabase/schema.sql`.
3. En Authentication, habilitá Email/Password.
4. Para Google Login, habilitá Google como provider y cargá Client ID/Secret de Google Cloud.
5. Agregá la URL de Netlify en Redirect URLs, por ejemplo:
   `https://TU-SITIO.netlify.app/**`
6. En `config.js`, completá:

```js
window.FT_CONFIG = {
  supabaseUrl: "https://TU-PROYECTO.supabase.co",
  supabaseAnonKey: "TU_ANON_KEY_PUBLICA",
  mercadoPagoLink: "PENDIENTE_LINK_MERCADO_PAGO",
  enableDemo: false,
};
```

La anon key de Supabase es pública. La service role key nunca va al frontend.

## Crear usuario admin

Con la web desplegada y variables configuradas, llamá la función:

```bash
curl -X POST https://TU-SITIO.netlify.app/.netlify/functions/seed-admin \
  -H "x-seed-token: TU_SEED_ADMIN_TOKEN"
```

Esto crea o actualiza el perfil admin para `santiperez1859@gmail.com`. Después del primer ingreso, cambiá la contraseña desde Supabase Auth o desde un flujo de cambio de contraseña.

## Configurar datos editables

Desde `/admin` > Configuración podés cambiar:

- WhatsApp
- correo
- Instagram
- cuenta Prex
- link Mercado Pago
- QR principal
- QR Mercado Pago
- logo
- datos fiscales
- textos de pago

Los placeholders actuales son:

- Logo: `assets/logo-59tech.svg`
- QR principal: `assets/qr-pago.png`
- QR Mercado Pago: `assets/qr-mercadopago.png`

Cuando tengas los archivos reales, reemplazá esos assets manteniendo las rutas o actualizá las rutas desde Configuración.

## Pagos

La página `/pagar` incluye:

- Prex a Prex con copia al portapapeles.
- Mercado Pago con placeholder editable.
- QR Mercado Pago.
- Pago en efectivo.
- Abitab/Redpagos sujeto al flujo de Mercado Pago.
- Método acordado.
- Envío de comprobante por WhatsApp con mensaje prearmado.

## FacturApp integrado

El módulo `Facturas` del panel admin conserva y mejora:

- crear factura
- seleccionar cliente
- agregar ítems/servicios
- cantidad, precio, subtotal y total
- guardar factura en modo local/demo
- importar/exportar JSON compatible con datos del FacturApp original
- imprimir
- guardar PDF cuando cargan `html2canvas` y `jsPDF`
- numeración automática

Pendiente para producción: conectar CRUD completo a Supabase usando las tablas incluidas. Actualmente el panel opera en modo local/demo para no simular seguridad falsa.

## Modo demo

`config.js` trae `enableDemo: true` para probar localmente. Antes de publicar producción, cambialo a `false` y configurá Supabase.

## Nota sobre assets adjuntos

En el workspace no apareció un logo o imagen de esfera adjunta fuera del ZIP. Por eso se creó un logo placeholder SVG y la esfera principal se construyó como canvas interactivo 3D-inspired. Reemplazá el logo cuando tengas el archivo final.
