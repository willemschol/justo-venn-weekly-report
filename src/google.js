import fs from "node:fs";
import path from "node:path";
import { google } from "googleapis";
import { CONFIG } from "./config.js";

function getGoogleCredentials() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error("Falta GOOGLE_SERVICE_ACCOUNT_JSON para escribir en Slides y Sheets.");
  }
  return JSON.parse(raw);
}

async function getClients() {
  const auth = new google.auth.GoogleAuth({
    credentials: getGoogleCredentials(),
    scopes: [
      "https://www.googleapis.com/auth/presentations",
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive",
    ],
  });
  return {
    drive: google.drive({ version: "v3", auth }),
    slides: google.slides({ version: "v1", auth }),
    sheets: google.sheets({ version: "v4", auth }),
  };
}

async function uploadImageForSlides(drive, filePath) {
  const fileName = path.basename(filePath);
  const created = await drive.files.create({
    requestBody: {
      name: fileName,
      mimeType: "image/png",
    },
    media: {
      mimeType: "image/png",
      body: fs.createReadStream(filePath),
    },
    fields: "id",
  });

  const fileId = created.data.id;
  if (!fileId) {
    throw new Error(`No se pudo crear archivo temporal en Drive para ${fileName}.`);
  }

  await drive.permissions.create({
    fileId,
    requestBody: {
      role: "reader",
      type: "anyone",
    },
  });

  return {
    fileId,
    url: `https://drive.google.com/uc?id=${fileId}`,
  };
}

export async function upsertSlideImages(imagePaths) {
  const { drive, slides } = await getClients();
  const uploaded = {};
  for (const [country, filePath] of Object.entries(imagePaths)) {
    uploaded[country] = await uploadImageForSlides(drive, filePath);
  }

  const requests = [];

  for (const [country, slot] of Object.entries(CONFIG.presentations.slots)) {
    const objectId = `weekly_${country.toLowerCase()}_venn`;
    requests.push({ deleteObject: { objectId } });
    requests.push({
      createImage: {
        objectId,
        url: uploaded[country].url,
        elementProperties: {
          pageObjectId: CONFIG.presentations.slide26ObjectId,
          size: {
            width: { magnitude: slot.size, unit: "EMU" },
            height: { magnitude: slot.size, unit: "EMU" },
          },
          transform: {
            scaleX: 1,
            scaleY: 1,
            translateX: slot.x,
            translateY: slot.y,
            unit: "EMU",
          },
        },
      },
    });
  }

  const filtered = requests.filter(
    (request) => !(request.deleteObject && request.deleteObject.objectId === undefined),
  );

  await slides.presentations.batchUpdate({
    presentationId: CONFIG.presentations.id,
    requestBody: { requests: filtered },
  });

  await Promise.all(
    Object.values(uploaded).map(({ fileId }) =>
      drive.files.delete({ fileId }).catch(() => undefined),
    ),
  );
}

export async function appendHistoryRows(dataset) {
  const { sheets } = await getClients();
  const sample = Object.values(dataset)[0];
  const runDate = sample.generatedAt.slice(0, 10);
  const weekLabel = new Intl.DateTimeFormat("es-CL", {
    timeZone: CONFIG.timezone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(sample.generatedAt));

  const values = Object.values(dataset).map((entry) => [
    runDate,
    weekLabel,
    entry.country,
    entry.totals.ecommerce,
    entry.totals.delivery,
    entry.totals.pos,
    entry.regions.eOnly,
    entry.regions.dOnly,
    entry.regions.pOnly,
    entry.regions.edOnly,
    entry.regions.epOnly,
    entry.regions.dpOnly,
    entry.regions.all,
  ]);

  await sheets.spreadsheets.values.append({
    spreadsheetId: CONFIG.spreadsheet.id,
    range: `${CONFIG.spreadsheet.historySheetName}!A:M`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values },
  });
}
