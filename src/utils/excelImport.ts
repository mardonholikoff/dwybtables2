import XLSX from 'xlsx-js-style';
import { AutoPart, Supplier } from '../types';

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
  isNewRow?: boolean;
  changes: FieldChange[];
  updatedPart: AutoPart;
}

export interface ParseExcelResult {
  success: boolean;
  error?: string;
  totalRows?: number;
  modifiedCount?: number;
  newRowCount?: number;
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

function parseExcelPrice(val: any, fallback: number = -1): number {
  if (typeof val === 'number') return isNaN(val) ? fallback : Math.round(val * 100) / 100;
  if (!val && val !== 0) return fallback;
  const cleaned = String(val).replace(/[^0-9.,-]/g, '').replace(/,/g, '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? fallback : Math.round(num * 100) / 100;
}

function getCurrentSystemTime(): string {
  return new Date().toLocaleString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function parseAndValidateEditedAutoParts(
  fileBuffer: ArrayBuffer,
  currentParts: AutoPart[],
  existingSuppliers: Supplier[] = []
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

    // Valid supplier names map (case-insensitive and trimmed)
    const validSupplierMap = new Map<string, string>();
    existingSuppliers.forEach((s) => {
      if (s.name && s.name.trim()) {
        validSupplierMap.set(s.name.trim().toLowerCase(), s.name.trim());
      }
    });

    // Map parts by ID
    const partsById = new Map<string, AutoPart>();
    currentParts.forEach((p) => partsById.set(p.id, p));

    // Determine current max order number
    let maxOrderNumber = currentParts.reduce(
      (max, p) => Math.max(max, p.orderNumber || 0),
      0
    );

    // Filter data rows (exclude empty rows where all cells are empty or whitespace)
    const validDataRows: { rowIndex: number; row: any[] }[] = [];
    for (let r = 1; r < rawRows.length; r++) {
      const row = rawRows[r];
      if (!row) continue;
      const hasMeaningfulContent = row.some((c: any, colIdx: number) => {
        if (c === undefined || c === null) return false;
        const s = String(c).trim();
        // Ignore automatic template placeholders like NEW_ROW in id column
        if (colIdx === 13 && s.startsWith('TEMPLATE_')) return false;
        return s !== '';
      });
      if (hasMeaningfulContent) {
        validDataRows.push({ rowIndex: r + 1, row });
      }
    }

    if (validDataRows.length === 0) {
      return { success: false, error: 'Jadvalda hech qanday ma\'lumot qatori topilmadi.' };
    }

    const diffs: RowDiff[] = [];
    const updatedParts: AutoPart[] = [];
    let newRowCount = 0;

    for (let idx = 0; idx < validDataRows.length; idx++) {
      const { rowIndex, row } = validDataRows[idx];

      // Read raw cell values
      const rawOrder = row[0];
      const rawSystemTime = String(row[1] ?? '').trim();
      const rawPartName = String(row[2] ?? '').trim();
      const rawCode = String(row[3] ?? '').trim();
      const rawSpecialMark = String(row[4] ?? '').trim();
      const rawCarPosition = String(row[5] ?? '').trim();
      const rawCountry = String(row[6] ?? '').trim();
      const rawBrand = String(row[7] ?? '').trim();
      const rawSupplierName = String(row[8] ?? '').trim();
      const rawPrice = parseExcelPrice(row[9], -1);
      const rawDate = parseExcelDate(row[10]);
      const rawSource = String(row[11] ?? '').trim();
      const rawComment = String(row[12] ?? '').trim();
      const rawId = String(row[13] ?? '').trim();

      // 1. MANDATORY FIELDS VALIDATION (Strict)
      // "agar bosh joylar majburiy qolgan bolsa ogohlantirish berib tushirmaydi va qayta tahrilrashga togi keladi"
      const missingMandatory: string[] = [];
      if (!rawPartName) missingMandatory.push('Qism nomi (3-ustun)');
      if (!rawBrand) missingMandatory.push('Brend (8-ustun)');
      if (!rawSupplierName) missingMandatory.push('Yetkazib beruvchi (9-ustun)');
      if (rawPrice < 0 || isNaN(rawPrice)) missingMandatory.push('Narx (10-ustun)');
      if (!rawDate) missingMandatory.push('Sana (11-ustun)');
      if (!rawCountry) missingMandatory.push('Ishlab chiqarilgan davlati (7-ustun)');
      if (!rawSource) missingMandatory.push('Ma\'lumot manbaasi (12-ustun)');

      if (missingMandatory.length > 0) {
        return {
          success: false,
          error: `Jadval bazaga qabul qilinmadi! Excel faylning ${rowIndex}-qatorida majburiy maydonlar bo'sh qolgan: [${missingMandatory.join(
            ', '
          )}]. Barcha majburiy katakchalarni to'ldirib, qayta yuklang.`,
        };
      }

      // 2. SUPPLIER VALIDATION (Strict)
      // "2-jadvlada jadval asosida tahrirlashda yetkazib beruvchi mavjudlari orasidan biri bo'lsin va agar bunday bo'lmasa unda jadval baza kirishga qabul qilinmasin"
      let canonicalSupplierName = rawSupplierName;
      if (validSupplierMap.size > 0) {
        const found = validSupplierMap.get(rawSupplierName.toLowerCase());
        if (!found) {
          const availableList = Array.from(validSupplierMap.values()).slice(0, 10).join(', ');
          return {
            success: false,
            error: `Jadval bazaga qabul qilinmadi! ${rowIndex}-qatordagi «${rawSupplierName}» yetkazib beruvchisi 1-jadvaldagi mavjud yetkazib beruvchilar ro'yxatida topilmadi! 2-jadvalda yetkazib beruvchi faqat 1-jadvalda mavjudlari orasidan biri bo'lishi shart. (Mavjudlar: ${availableList}${
              validSupplierMap.size > 10 ? '...' : ''
            }). Yetkazib beruvchi nomini to'g'irlab qayta yuklang.`,
          };
        }
        canonicalSupplierName = found;
      }

      // Determine if this row corresponds to an existing part or is a newly added row
      let existingPart: AutoPart | null = null;
      if (rawId && partsById.has(rawId)) {
        existingPart = partsById.get(rawId)!;
      } else if (!rawId && idx < currentParts.length && !partsById.has(rawId)) {
        existingPart = currentParts[idx];
      }

      if (existingPart) {
        // EXISTING ROW: Check for field changes
        const changes: FieldChange[] = [];

        if (rawPartName !== existingPart.partName) {
          changes.push({
            fieldName: 'partName',
            fieldLabel: 'Qism nomi',
            oldValue: existingPart.partName,
            newValue: rawPartName,
          });
        }

        if (rawCode !== (existingPart.code || '')) {
          changes.push({
            fieldName: 'code',
            fieldLabel: 'Kod',
            oldValue: existingPart.code || '—',
            newValue: rawCode || '—',
          });
        }

        if (rawSpecialMark !== (existingPart.specialMark || '')) {
          changes.push({
            fieldName: 'specialMark',
            fieldLabel: 'Maxsus belgisi',
            oldValue: existingPart.specialMark || '—',
            newValue: rawSpecialMark || '—',
          });
        }

        if (rawCarPosition !== (existingPart.carPosition || '')) {
          changes.push({
            fieldName: 'carPosition',
            fieldLabel: 'Mashinadagi joyi',
            oldValue: existingPart.carPosition || '—',
            newValue: rawCarPosition || '—',
          });
        }

        if (rawCountry !== (existingPart.country || '')) {
          changes.push({
            fieldName: 'country',
            fieldLabel: 'Ishlab chiqarilgan davlati',
            oldValue: existingPart.country || '—',
            newValue: rawCountry || '—',
          });
        }

        if (rawBrand !== existingPart.brand) {
          changes.push({
            fieldName: 'brand',
            fieldLabel: 'Brend',
            oldValue: existingPart.brand,
            newValue: rawBrand,
          });
        }

        if (canonicalSupplierName !== existingPart.supplierName) {
          changes.push({
            fieldName: 'supplierName',
            fieldLabel: 'Yetkazib beruvchi',
            oldValue: existingPart.supplierName,
            newValue: canonicalSupplierName,
          });
        }

        if (rawPrice !== existingPart.price) {
          changes.push({
            fieldName: 'price',
            fieldLabel: 'Narx ($)',
            oldValue: `$${existingPart.price}`,
            newValue: `$${rawPrice}`,
          });
        }

        if (rawDate !== existingPart.date) {
          changes.push({
            fieldName: 'date',
            fieldLabel: 'Sana',
            oldValue: existingPart.date,
            newValue: rawDate,
          });
        }

        if (rawSource !== existingPart.source) {
          changes.push({
            fieldName: 'source',
            fieldLabel: 'Ma\'lumot manbaasi',
            oldValue: existingPart.source,
            newValue: rawSource,
          });
        }

        if (rawComment !== (existingPart.comment || '')) {
          changes.push({
            fieldName: 'comment',
            fieldLabel: 'Izoh',
            oldValue: existingPart.comment || '—',
            newValue: rawComment || '—',
          });
        }

        const updatedPart: AutoPart = {
          ...existingPart,
          partName: rawPartName,
          code: rawCode,
          specialMark: rawSpecialMark,
          carPosition: rawCarPosition,
          country: rawCountry,
          brand: rawBrand,
          supplierName: canonicalSupplierName,
          price: rawPrice,
          date: rawDate,
          source: rawSource,
          comment: rawComment,
        };

        updatedParts.push(updatedPart);

        if (changes.length > 0) {
          diffs.push({
            partId: existingPart.id,
            orderNumber: existingPart.orderNumber || idx + 1,
            partName: existingPart.partName,
            isNewRow: false,
            changes,
            updatedPart,
          });
        }
      } else {
        // NEW ROW ADDED BY USER!
        // "yuklangan excel faylda qator qo'shish tugmasi b'lsin va u tepadagi qator bilanbir xil formatda qator q'ssin bosilganda,
        // bunda tizim id, tartib raqam, sistema vaqti avtoamtik assign boalversin"
        newRowCount++;
        maxOrderNumber++;
        const parsedOrder = parseInt(String(rawOrder), 10);
        const assignedOrder = !isNaN(parsedOrder) && parsedOrder > 0 ? parsedOrder : maxOrderNumber;
        const assignedTime = rawSystemTime || getCurrentSystemTime();
        const newId = `part_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${newRowCount}`;

        const newPart: AutoPart = {
          id: newId,
          orderNumber: assignedOrder,
          systemTime: assignedTime,
          createdAt: Date.now(),
          partName: rawPartName,
          code: rawCode,
          specialMark: rawSpecialMark,
          carPosition: rawCarPosition,
          country: rawCountry,
          brand: rawBrand,
          supplierName: canonicalSupplierName,
          price: rawPrice,
          date: rawDate,
          source: rawSource,
          comment: rawComment,
        };

        updatedParts.push(newPart);

        diffs.push({
          partId: newId,
          orderNumber: assignedOrder,
          partName: rawPartName,
          isNewRow: true,
          changes: [
            {
              fieldName: 'isNew',
              fieldLabel: 'Yangi qator',
              oldValue: '—',
              newValue: `Qo'shildi: ${rawPartName} (${rawBrand}, ${canonicalSupplierName}, $${rawPrice})`,
            },
          ],
          updatedPart: newPart,
        });
      }
    }

    return {
      success: true,
      totalRows: validDataRows.length,
      modifiedCount: diffs.filter((d) => !d.isNewRow).length,
      newRowCount,
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

