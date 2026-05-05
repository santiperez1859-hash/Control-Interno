import fs from "node:fs";
import zlib from "node:zlib";

function crc32(buffer) {
  let crc = -1;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function makeQrPng(path, seed) {
  const size = 512;
  const raw = Buffer.alloc((size * 4 + 1) * size);
  let offset = 0;
  const pad = 40;
  const grid = 31;
  const cell = (size - pad * 2) / grid;

  function finder(mx, my, ox, oy) {
    const x = mx - ox;
    const y = my - oy;
    if (x < 0 || y < 0 || x > 6 || y > 6) return false;
    return x === 0 || y === 0 || x === 6 || y === 6 || (x >= 2 && x <= 4 && y >= 2 && y <= 4);
  }

  function moduleOn(mx, my) {
    if (finder(mx, my, 0, 0) || finder(mx, my, 24, 0) || finder(mx, my, 0, 24)) return true;
    return (mx * 13 + my * 17 + seed) % 11 === 0 || (mx * mx + my * 7 + seed) % 19 === 0;
  }

  for (let y = 0; y < size; y += 1) {
    raw[offset++] = 0;
    for (let x = 0; x < size; x += 1) {
      let r = 255;
      let g = 255;
      let b = 255;
      if (x > pad && x < size - pad && y > pad && y < size - pad) {
        const mx = Math.floor((x - pad) / cell);
        const my = Math.floor((y - pad) / cell);
        if (moduleOn(mx, my)) {
          r = 18;
          g = 17;
          b = 17;
        }
        if ((mx + my + seed) % 23 === 0) {
          r = 235;
          g = 15;
          b = 15;
        }
      }
      raw[offset++] = r;
      raw[offset++] = g;
      raw[offset++] = b;
      raw[offset++] = 255;
    }
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
  fs.writeFileSync(path, png);
}

makeQrPng(new URL("../assets/qr-pago.png", import.meta.url), 59);
makeQrPng(new URL("../assets/qr-mercadopago.png", import.meta.url), 91);
