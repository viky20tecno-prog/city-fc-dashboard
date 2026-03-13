const { google } = require('googleapis');

// Config
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID || '1LuqQipb1_MD7WoVy0064mZ1vwWgWCg9ikBRUN_-F0-A';

// Auth con service account
let sheets;

function initSheets() {
  if (sheets) return sheets;
  
  const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY || './service-account.json',
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  sheets = google.sheets({ version: 'v4', auth });
  return sheets;
}

/**
 * Lee rango de hoja, retorna array de objetos
 * @param {string} sheetName - nombre de la hoja (ej: JUGADORES)
 * @param {string} club_id - filtro opcional
 */
async function getSheetData(sheetName, club_id = null) {
  const sheets_api = initSheets();
  
  try {
    const response = await sheets_api.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:Z`,
    });

    const rows = response.data.values || [];
    if (rows.length === 0) return [];

    const headers = rows[0];
    const data = rows.slice(1).map(row => {
      const obj = {};
      headers.forEach((header, idx) => {
        obj[header] = row[idx] || null;
      });
      return obj;
    });

    // Filtrar por club_id si aplica
    if (club_id) {
      return data.filter(row => row.club_id === club_id);
    }

    return data;
  } catch (err) {
    console.error(`Error reading ${sheetName}:`, err.message);
    throw err;
  }
}

/**
 * Agrega fila a hoja
 */
async function appendSheetData(sheetName, values) {
  const sheets_api = initSheets();
  
  try {
    const response = await sheets_api.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A1`,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [values],
      },
    });
    return response.data;
  } catch (err) {
    console.error(`Error appending to ${sheetName}:`, err.message);
    throw err;
  }
}

/**
 * Actualiza celda específica
 */
async function updateSheetData(sheetName, range, values) {
  const sheets_api = initSheets();
  
  try {
    const response = await sheets_api.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!${range}`,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [values],
      },
    });
    return response.data;
  } catch (err) {
    console.error(`Error updating ${sheetName}:`, err.message);
    throw err;
  }
}

module.exports = {
  getSheetData,
  appendSheetData,
  updateSheetData,
};
