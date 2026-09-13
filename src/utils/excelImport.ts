import XLSX from 'xlsx-js-style';
import { AutoPart } from '../types';

export interface FieldChange {
  fieldName: string;
  fieldLabel: string;
  oldValue: string;
  newValue: string;
}

export interface RowDiff {
  partId: string;
  orderNumber: number;
  partName: string;
  changes: FieldChange[];
  updatedPart: AutoPart;
}

export interface ParseExcelResult {
  success: boolean;
  error?: string;
  totalRows?: number;
  modifiedCount?: number;
  diffs?: RowDiff[];
  updatedParts?: AutoPart[];
}

const REQUIRED_HEADERS = [
  '№ (Tartib raqam)',
  'Sistema vaqti',
  'Avto ehtiyot qism nomi',
  'Kod',
  'Maxsus belgisi',
  'Mashinada joylashgan joyi',
  'Ishlab chiqarilgan davlati',
  'Brend',
  'Yetkazib beruvchi',
  'Narx ($ / USD)',
  'Sana',
  'Ma\'lumot manbaasi',
  'Izoh',
];

function normalizeHeader(h: any): string {
  return String(h || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function parseExcelDate(val: any): string {
  if (!val) return '';
  if (typeof val === 'number') {
    // Excel serial date to JS Date (25569 = days between 1899-12-30 and 1970-01-01)
    const date = new Date(Math.round((val - 25569) * 86400 * 1000));
    if (!isNaN(date.getTime())) {
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }
  if (val instanceof Date && !isNaN(val.getTime())) {
    const year = val.getFullYear();
    const month = String(val.getMonth() + 1).padStart(2, '0');
    const day = String(val.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return String(val).trim();
}

function parseExcelPrice(val: any, fallback: number = 0): number {
  if (typeof val === 'number') return isNaN(val) ? fallback : Math.round(val * 100) / 100;
  if (!val) return fallback;
  const cleaned = String(val).replace(/[^0-9.,-]/g, '').replace(/,/g, '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? fallback : Math.round(num * 100) / 100;
}

export function parseAndValidateEditedAutoParts(
  fileBuffer: ArrayBuffer,
  currentParts: AutoPart[]
): ParseExcelResult {
  try {
    const workbook = XLSX.read(fileBuffer, { type: 'array', cellDates: false });
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return { success: false, error: 'Excel faylida hech qanday varaq (sheet) topilmadi.' };
    }

    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    if (!worksheet) {
      return { success: false, error: 'Varaq ma\'lumotlarini o\'qib bo\'lmadi.' };
    }

    // Convert to 2D array of rows
    const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    if (!rawRows || rawRows.length === 0) {
      return { success: false, error: 'Yuklangan fayl bo\'sh.' };
    }

    // Find header row (must contain at least parts of expected headers)
    const headerRow = rawRows[0] || [];
    if (headerRow.length < REQUIRED_HEADERS.length) {
      return {
        success: false,
        error: `Jadval ustunlari soni mos kelmadi! Kutilgan ustunlar: kamida ${REQUIRED_HEADERS.length} ta, yuklangan jadvalda: ${headerRow.length} ta ustun mavjud. Asl jadval ustunlarini o'zgartirmasdan yuklang.`,
      };
    }

    // Validate each of the required columns
    for (let i = 0; i < REQUIRED_HEADERS.length; i++) {
      const expected = normalizeHeader(REQUIRED_HEADERS[i]);
      const actual = normalizeHeader(headerRow[i]);

      // Soft comparison: actual header should contain main keywords
      const isMatch =
        actual === expected ||
        (i === 0 && (actual.includes('№') || actual.includes('tartib'))) ||
        (i === 1 && actual.includes('sistema')) ||
        (i === 2 && actual.includes('qism')) ||
        (i === 3 && actual.includes('kod')) ||
        (i === 4 && actual.includes('belgi')) ||
        (i === 5 && actual.includes('joy')) ||
        (i === 6 && (actual.includes('davlat') || actual.includes('ishlab'))) ||
        (i === 7 && actual.includes('brend')) ||
        (i === 8 && actual.includes('yetkazib')) ||
        (i === 9 && (actual.includes('narx') || actual.includes('usd') || actual.includes('$'))) ||
        (i === 10 && actual.includes('sana')) ||
        (i === 11 && actual.includes('manba')) ||
        (i === 12 && actual.includes('izoh'));

      if (!isMatch) {
        return {
          success: false,
          error: `Jadval ustuni mos kelmadi! ${i + 1}-ustun: kutilgan «${REQUIRED_HEADERS[i]}», lekin faylda «${headerRow[i] || 'bo\'sh'}» deb belgilangan. Ustunlar tartibi yoki nomini o'zgartirish taqiqlangan.`,
        };
      }
    }

    // Filter data rows (exclude empty rows at the end)
    const dataRows: any[][] = [];
    for (let r = 1; r < rawRows.length; r++) {
      const row = rawRows[r];
      // If row has at least one non-empty cell
      const hasContent = row && row.some((c: any) => c !== undefined && c !== null && String(c).trim() !== '');
      if (hasContent) {
        dataRows.push(row);
      }
    }

    // Strict row count validation:
    if (dataRows.length !== currentParts.length) {
      return {
        success: false,
        error: `Jadval qatorlari soni mos kelmadi! Hozirgi bazadagi qatorlar soni: ${currentParts.length} ta, yuklangan faylda esa: ${dataRows.length} ta qator topildi. Qatorlar sonini ko'paytirish yoki o'chirish mumkin emas — faqatgina mavjud qatorlarning ichki qiymatlarini o'zgartirishingiz kerak.`,
      };
    }

    // Match rows and detect changes
    const diffs: RowDiff[] = [];
    const updatedParts: AutoPart[] = [];

    // Map parts by ID and by index
    const partsById = new Map<string, AutoPart>();
    currentParts.forEach((p) => partsById.set(p.id, p));

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      // Check if ID exists in column 13 (index 13)
      const possibleId = row[13] ? String(row[13]).trim() : '';
      let existingPart = possibleId ? partsById.get(possibleId) : null;
      if (!existingPart) {
        // Match by index as defined by the strict row order rule
        existingPart = currentParts[i];
      }

      if (!existingPart) {
        return {
          success: false,
          error: `${i + 1}-qatordagi ma'lumotni moslashtirib bo'lmadi. Jadval qatorlari tartibini o'zgartirmang.`,
        };
      }

      // Extract new cell values
      const newPartName = String(row[2] ?? '').trim() || existingPart.partName;
      const newCode = String(row[3] ?? '').trim();
      const newSpecialMark = String(row[4] ?? '').trim();
      const newCarPosition = String(row[5] ?? '').trim();
      const newCountry = String(row[6] ?? '').trim();
      const newBrand = String(row[7] ?? '').trim() || existingPart.brand;
      const newSupplierName = String(row[8] ?? '').trim() || existingPart.supplierName;
      const newPrice = parseExcelPrice(row[9], existingPart.price);
      const newDate = parseExcelDate(row[10]) || existingPart.date;
      const newSource = String(row[11] ?? '').trim() || existingPart.source;
      const newComment = String(row[12] ?? '').trim();

      const changes: FieldChange[] = [];

      if (newPartName !== existingPart.partName) {
        changes.push({
          fieldName: 'partName',
          fieldLabel: 'Qism nomi',
          oldValue: existingPart.partName,
          newValue: newPartName,
        });
      }

      if (newCode !== (existingPart.code || '')) {
        changes.push({
          fieldName: 'code',
          fieldLabel: 'Kod',
          oldValue: existingPart.code || '—',
          newValue: newCode || '—',
        });
      }

      if (newSpecialMark !== (existingPart.specialMark || '')) {
        changes.push({
          fieldName: 'specialMark',
          fieldLabel: 'Maxsus belgisi',
          oldValue: existingPart.specialMark || '—',
          newValue: newSpecialMark || '—',
        });
      }

      if (newCarPosition !== (existingPart.carPosition || '')) {
        changes.push({
          fieldName: 'carPosition',
          fieldLabel: 'Mashinadagi joyi',
          oldValue: existingPart.carPosition || '—',
          newValue: newCarPosition || '—',
        });
      }

      if (newCountry !== (existingPart.country || '')) {
        changes.push({
          fieldName: 'country',
          fieldLabel: 'Ishlab chiqarilgan davlati',
          oldValue: existingPart.country || '—',
          newValue: newCountry || '—',
        });
      }

      if (newBrand !== existingPart.brand) {
        changes.push({
          fieldName: 'brand',
          fieldLabel: 'Brend',
          oldValue: existingPart.brand,
          newValue: newBrand,
        });
      }

      if (newSupplierName !== existingPart.supplierName) {
        changes.push({
          fieldName: 'supplierName',
          fieldLabel: 'Yetkazib beruvchi',
          oldValue: existingPart.supplierName,
          newValue: newSupplierName,
        });
      }

      if (newPrice !== existingPart.price) {
        changes.push({
          fieldName: 'price',
          fieldLabel: 'Narx ($)',
          oldValue: `$${existingPart.price}`,
          newValue: `$${newPrice}`,
        });
      }

      if (newDate !== existingPart.date) {
        changes.push({
          fieldName: 'date',
          fieldLabel: 'Sana',
          oldValue: existingPart.date,
          newValue: newDate,
        });
      }

      if (newSource !== existingPart.source) {
        changes.push({
          fieldName: 'source',
          fieldLabel: 'Ma\'lumot manbaasi',
          oldValue: existingPart.source,
          newValue: newSource,
        });
      }

      if (newComment !== (existingPart.comment || '')) {
        changes.push({
          fieldName: 'comment',
          fieldLabel: 'Izoh',
          oldValue: existingPart.comment || '—',
          newValue: newComment || '—',
        });
      }

      const updatedPart: AutoPart = {
        ...existingPart,
        partName: newPartName,
        code: newCode,
        specialMark: newSpecialMark,
        carPosition: newCarPosition,
        country: newCountry,
        brand: newBrand,
        supplierName: newSupplierName,
        price: newPrice,
        date: newDate,
        source: newSource,
        comment: newComment,
      };

      updatedParts.push(updatedPart);

      if (changes.length > 0) {
        diffs.push({
          partId: existingPart.id,
          orderNumber: existingPart.orderNumber || i + 1,
          partName: existingPart.partName,
          changes,
          updatedPart,
        });
      }
    }

    return {
      success: true,
      totalRows: currentParts.length,
      modifiedCount: diffs.length,
      diffs,
      updatedParts,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Excel faylni o'qishda xatolik yuz berdi: ${err?.message || 'Fayl formati noto\'g\'ri'}`,
    };
  }
}
