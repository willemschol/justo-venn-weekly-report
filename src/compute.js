import { CONFIG, COUNTRY_MAP } from "./config.js";
import { runTeamCliJson } from "./teamCli.js";

function emptyCountrySets() {
  return Object.fromEntries(
    CONFIG.countries.map((country) => [
      country,
      { ecommerce: new Set(), delivery: new Set(), pos: new Set() },
    ]),
  );
}

function computeRegions(sets) {
  let eOnly = 0;
  let dOnly = 0;
  let pOnly = 0;
  let edOnly = 0;
  let epOnly = 0;
  let dpOnly = 0;
  let all = 0;

  const ids = new Set([...sets.ecommerce, ...sets.delivery, ...sets.pos]);
  for (const id of ids) {
    const e = sets.ecommerce.has(id);
    const d = sets.delivery.has(id);
    const p = sets.pos.has(id);
    if (e && d && p) all += 1;
    else if (e && d) edOnly += 1;
    else if (e && p) epOnly += 1;
    else if (d && p) dpOnly += 1;
    else if (e) eOnly += 1;
    else if (d) dOnly += 1;
    else if (p) pOnly += 1;
  }

  return {
    eOnly,
    dOnly,
    pOnly,
    edOnly,
    epOnly,
    dpOnly,
    all,
  };
}

export async function fetchWeeklyVennDataset() {
  const websites = await runTeamCliJson([
    "data",
    "queries",
    "run",
    CONFIG.queryIds.websites,
    "--limit",
    "10000",
  ]);
  const biSnapshots = await runTeamCliJson([
    "data",
    "queries",
    "run",
    CONFIG.queryIds.biSnapshots,
    "--limit",
    "10000",
  ]);
  const orderChannels = await runTeamCliJson([
    "data",
    "queries",
    "run",
    CONFIG.queryIds.orderChannels,
    "--limit",
    "10000",
  ]);

  const brands = new Map();
  for (const row of websites) {
    const websiteId = row["Website ID"];
    if (!websiteId) continue;
    const country = COUNTRY_MAP[row.Pais] ?? row.Pais;
    if (!CONFIG.countries.includes(country)) continue;
    if (!brands.has(websiteId)) {
      brands.set(websiteId, { websiteId, country });
    }
  }

  const biByWebsite = new Map(
    biSnapshots
      .filter((row) => row["Website ID"])
      .map((row) => [row["Website ID"], row]),
  );
  const ordersByWebsite = new Map(
    orderChannels
      .filter((row) => row["Website ID"])
      .map((row) => [row["Website ID"], row]),
  );

  const countrySets = emptyCountrySets();
  for (const [websiteId, brand] of brands) {
    const biRow = biByWebsite.get(websiteId) ?? {};
    const ordersRow = ordersByWebsite.get(websiteId) ?? {};
    const sets = countrySets[brand.country];
    const ecommerceCount = Number(
      ordersRow.ecommerceOrdersExcludingAppAndEmbedded30d ?? 0,
    );
    if (ecommerceCount > 0) sets.ecommerce.add(websiteId);
    if (Boolean(biRow["Usa Justo Delivery"])) sets.delivery.add(websiteId);
    if (Boolean(biRow["Usa Punto de Venta"])) sets.pos.add(websiteId);
  }

  const generatedAt = new Date().toISOString();
  return Object.fromEntries(
    CONFIG.countries.map((country) => {
      const sets = countrySets[country];
      return [
        country,
        {
          country,
          generatedAt,
          totals: {
            ecommerce: sets.ecommerce.size,
            delivery: sets.delivery.size,
            pos: sets.pos.size,
          },
          regions: computeRegions(sets),
        },
      ];
    }),
  );
}
