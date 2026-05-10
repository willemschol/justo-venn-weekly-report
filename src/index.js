import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchWeeklyVennDataset } from "./compute.js";
import { upsertSlideImages, appendHistoryRows } from "./google.js";
import { renderCountryImages } from "./render.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function chileNow() {
  return new Date(
    new Intl.DateTimeFormat("sv-SE", {
      timeZone: "America/Santiago",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(new Date()).replace(" ", "T"),
  );
}

function shouldRunScheduledJob() {
  if (process.env.FORCE_RUN === "true") return true;
  const now = chileNow();
  const day = now.getDay();
  const hour = now.getHours();
  return day === 1 && hour === 10;
}

async function main() {
  if (!shouldRunScheduledJob()) {
    console.log("Skipping run because current Chile time is outside Monday 10:00.");
    return;
  }

  const dataset = await fetchWeeklyVennDataset();
  const timestamp = new Date().toISOString().slice(0, 10);
  const outputDir = path.resolve(__dirname, "..", "artifacts", timestamp);
  await fs.mkdir(outputDir, { recursive: true });

  const imagePaths = await renderCountryImages(dataset, outputDir);
  await upsertSlideImages(imagePaths);
  await appendHistoryRows(dataset);

  console.log(
    JSON.stringify(
      {
        ok: true,
        generatedAt: Object.values(dataset)[0].generatedAt,
        outputDir,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
