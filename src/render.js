import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { COUNTRY_CODES } from "./config.js";

const PX = 900;

function flagSvg(country) {
  if (country === "Chile") {
    return `
      <rect x="60" y="54" width="84" height="48" fill="#ffffff"/>
      <rect x="60" y="78" width="84" height="24" fill="#d52b1e"/>
      <rect x="60" y="54" width="32" height="24" fill="#0039a6"/>
      <text x="76" y="71" font-size="12" fill="#ffffff">★</text>
    `;
  }
  if (country === "Peru") {
    return `
      <rect x="60" y="54" width="84" height="48" fill="#ffffff"/>
      <rect x="60" y="54" width="28" height="48" fill="#d91023"/>
      <rect x="116" y="54" width="28" height="48" fill="#d91023"/>
    `;
  }
  if (country === "Colombia") {
    return `
      <rect x="60" y="54" width="84" height="48" fill="#fcd116"/>
      <rect x="60" y="78" width="84" height="12" fill="#003893"/>
      <rect x="60" y="90" width="84" height="12" fill="#ce1126"/>
    `;
  }
  return `
    <rect x="60" y="54" width="84" height="48" fill="#ffffff"/>
    <rect x="60" y="54" width="28" height="48" fill="#006847"/>
    <rect x="116" y="54" width="28" height="48" fill="#ce1126"/>
  `;
}

function vennSvg(entry) {
  const { country, totals, regions } = entry;
  return `
  <svg width="${PX}" height="${PX}" viewBox="0 0 ${PX} ${PX}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${PX}" height="${PX}" rx="26" fill="#ffffff"/>
    <rect x="1" y="1" width="${PX - 2}" height="${PX - 2}" rx="26" fill="none" stroke="#e7edf4"/>
    <g filter="drop-shadow(0 16px 26px rgba(6,18,36,0.08))">
      <rect x="26" y="26" width="${PX - 52}" height="${PX - 52}" rx="24" fill="#ffffff"/>
    </g>
    ${flagSvg(country)}
    <circle cx="325" cy="368" r="184" fill="rgba(99,163,255,0.12)" stroke="#0b2e63" stroke-width="2"/>
    <circle cx="575" cy="368" r="184" fill="rgba(164,210,116,0.12)" stroke="#0b2e63" stroke-width="2"/>
    <circle cx="450" cy="556" r="184" fill="rgba(255,198,89,0.12)" stroke="#0b2e63" stroke-width="2"/>

    <text x="228" y="233" font-family="Arial" font-size="29" fill="#061224" font-weight="700">eCommerce</text>
    <text x="272" y="265" font-family="Arial" font-size="22" fill="#6b7b90">Total ${totals.ecommerce}</text>
    <text x="575" y="233" font-family="Arial" font-size="28" fill="#061224" font-weight="700" text-anchor="middle">Justo Delivery</text>
    <text x="575" y="265" font-family="Arial" font-size="22" fill="#6b7b90" text-anchor="middle">Total ${totals.delivery}</text>
    <text x="450" y="709" font-family="Arial" font-size="29" fill="#061224" font-weight="700" text-anchor="middle">Punto de Venta</text>
    <text x="450" y="741" font-family="Arial" font-size="22" fill="#6b7b90" text-anchor="middle">Total ${totals.pos}</text>

    <text x="214" y="406" font-family="Arial" font-size="56" fill="#061224" font-weight="700">${regions.eOnly}</text>
    <text x="644" y="406" font-family="Arial" font-size="56" fill="#061224" font-weight="700">${regions.dOnly}</text>
    <text x="450" y="664" font-family="Arial" font-size="56" fill="#061224" font-weight="700" text-anchor="middle">${regions.pOnly}</text>
    <text x="450" y="366" font-family="Arial" font-size="58" fill="#061224" font-weight="700" text-anchor="middle">${regions.edOnly}</text>
    <text x="330" y="505" font-family="Arial" font-size="50" fill="#061224" font-weight="700">${regions.epOnly}</text>
    <text x="555" y="505" font-family="Arial" font-size="50" fill="#061224" font-weight="700">${regions.dpOnly}</text>
    <text x="450" y="455" font-family="Arial" font-size="58" fill="#061224" font-weight="700" text-anchor="middle">${regions.all}</text>
  </svg>`;
}

export async function renderCountryImages(dataset, outputDir) {
  await fs.mkdir(outputDir, { recursive: true });
  const paths = {};

  for (const entry of Object.values(dataset)) {
    const svg = vennSvg(entry);
    const filename = `${COUNTRY_CODES[entry.country].toLowerCase()}-venn.png`;
    const filepath = path.join(outputDir, filename);
    await sharp(Buffer.from(svg)).png().toFile(filepath);
    paths[entry.country] = filepath;
  }

  return paths;
}
