import XLSX from 'xlsx-js-style';
import { Supplier, AutoPart } from '../types';

export const AUTO_PARTS_EXCEL_HEADERS = [
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
  'ID (Tizim kodi - o\'zgartirilmasin)',
];

const blackBorder = {
  top: { style: 'thin', color: { rgb: '000000' } },
  bottom: { style: 'thin', color: { rgb: '000000' } },
  left: { style: 'thin', color: { rgb: '000000' } },
  right: { style: 'thin', color: { rgb: '000000' } },
};

const headerStyle = {
  font: { bold: true, color: { rgb: '000000' }, sz: 10, name: 'Calibri' },
  fill: { fgColor: { rgb: 'FDE68A' } }, // Amber-200
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  border: blackBorder,
};

const cellStyleLeft = {
  font: { sz: 10, name: 'Calibri', color: { rgb: '000000' } },
  alignment: { horizontal: 'left', vertical: 'center' },
  border: blackBorder,
};

const cellStyleCenter = {
  font: { sz: 10, name: 'Calibri', color: { rgb: '000000' } },
  alignment: { horizontal: 'center', vertical: 'center' },
  border: blackBorder,
};

const cellStyleRight = {
  font: { sz: 10, name: 'Calibri', color: { rgb: '000000' } },
  alignment: { horizontal: 'right', vertical: 'center' },
  border: blackBorder,
};

function applyBlackBordersToSheet(worksheet: XLSX.WorkSheet, rowCount: number, colCount: number, centerCols: number[] = [], rightCols: number[] = []) {
  for (let R = 0; R < rowCount; ++R) {
    for (let C = 0; C < colCount; ++C) {
      const addr = XLSX.utils.encode_cell({ r: R, c: C });
      if (!worksheet[addr]) {
        worksheet[addr] = { t: 's', v: '' };
      }
      if (R === 0) {
        worksheet[addr].s = headerStyle;
      } else {
        if (rightCols.includes(C)) {
          worksheet[addr].s = cellStyleRight;
        } else if (centerCols.includes(C)) {
          worksheet[addr].s = cellStyleCenter;
        } else {
          worksheet[addr].s = cellStyleLeft;
        }
      }
    }
  }
}

export function exportSuppliersToExcel(suppliers: Supplier[], fileNamePrefix = 'Daewoo_Yetkazib_beruvchilar') {
  const headers = [
    '№ (Tartib raqam)',
    'Sistema vaqti',
    'Faoliyat turi',
    'Nom (Kompaniya / Shaxs)',
    'Manzil',
    'Telefon raqam',
    'Pul o\'tkazmalari',
    'To\'lov sharti',
    'Sifat barqarorligi',
    'Shaffoflik darajasi',
    'Javobgarlik',
    'Intizom darajasi',
    'Qo\'shimchalar',
    'Taklif qilinadigan mahsulotlar',
  ];

  const rows: any[][] = [headers];

  suppliers.forEach((item) => {
    let tolovSharti = item.paymentCondition as string;
    if (item.paymentCondition === 'kechiktirib to\'lash' && item.delayDays) {
      tolovSharti = `Kechiktirib to'lash (${item.delayDays} kun)`;
    }

    rows.push([
      item.orderNumber,
      item.systemTime,
      item.activityTypes && item.activityTypes.length > 0 ? item.activityTypes.join(' + ') : item.activityType,
      item.name,
      item.address,
      item.phone,
      item.paymentMethod.toUpperCase(),
      tolovSharti,
      item.qualityStability.toUpperCase(),
      item.transparencyLevel.toUpperCase(),
      item.responsibility,
      item.disciplineLevel.toUpperCase(),
      item.extras,
      item.products && item.products.length > 0 ? item.products.join(', ') : '—',
    ]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(rows);

  worksheet['!cols'] = [
    { wch: 8 },  // №
    { wch: 22 }, // Sistema vaqti
    { wch: 18 }, // Faoliyat turi
    { wch: 28 }, // Nom
    { wch: 32 }, // Manzil
    { wch: 20 }, // Telefon raqam
    { wch: 22 }, // Pul o'tkazmalari
    { wch: 26 }, // To'lov sharti
    { wch: 20 }, // Sifat barqarorligi
    { wch: 20 }, // Shaffoflik darajasi
    { wch: 36 }, // Javobgarlik
    { wch: 18 }, // Intizom darajasi
    { wch: 26 }, // Qo'shimchalar
    { wch: 34 }, // Taklif qilinadigan mahsulotlar
  ];

  applyBlackBordersToSheet(worksheet, rows.length, headers.length, [0, 1, 6, 8, 9, 11]);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Yetkazib beruvchilar');

  const dateStr = new Date().toISOString().split('T')[0];
  const fullFileName = `${fileNamePrefix}_${dateStr}.xlsx`;

  XLSX.writeFile(workbook, fullFileName);
}

export function exportAutoPartsToExcel(parts: AutoPart[], fileNamePrefix = 'Daewoo_Avto_ehtiyot_qismlar') {
  const headers = [
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

  const rows: any[][] = [headers];

  parts.forEach((item) => {
    rows.push([
      item.orderNumber,
      item.systemTime,
      item.partName,
      item.code || '',
      item.specialMark || '',
      item.carPosition || '',
      item.country || '',
      item.brand,
      item.supplierName,
      item.price,
      item.date,
      item.source,
      item.comment || '',
    ]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(rows);

  worksheet['!cols'] = [
    { wch: 8 },  // №
    { wch: 22 }, // Sistema vaqti
    { wch: 28 }, // Avto ehtiyot qism nomi
    { wch: 16 }, // Kod
    { wch: 18 }, // Maxsus belgisi
    { wch: 24 }, // Mashinada joylashgan joyi
    { wch: 22 }, // Ishlab chiqarilgan davlati
    { wch: 18 }, // Brend
    { wch: 26 }, // Yetkazib beruvchi
    { wch: 18 }, // Narx
    { wch: 16 }, // Sana
    { wch: 22 }, // Ma'lumot manbaasi
    { wch: 35 }, // Izoh
  ];

  applyBlackBordersToSheet(worksheet, rows.length, headers.length, [0, 1, 3, 6, 7, 10], [9]);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Avto ehtiyot qismlar');

  const dateStr = new Date().toISOString().split('T')[0];
  const fullFileName = `${fileNamePrefix}_${dateStr}.xlsx`;

  XLSX.writeFile(workbook, fullFileName);
}

// 2-jadvalni tahrirlash uchun maxsus yuklab berish funksiyasi
// Chiroyli, qora ramkalar bilan chizilgan, to'liq ustunlar va qatorlar bilan .xlsx formatda
export function exportAutoPartsForEditing(parts: AutoPart[], fileNamePrefix = 'Daewoo_2-Jadval_Tahrirlash_Uchun') {
  const headers = [...AUTO_PARTS_EXCEL_HEADERS];
  const rows: any[][] = [headers];

  parts.forEach((item, idx) => {
    rows.push([
      item.orderNumber || idx + 1,
      item.systemTime || '',
      item.partName || '',
      item.code || '',
      item.specialMark || '',
      item.carPosition || '',
      item.country || '',
      item.brand || '',
      item.supplierName || '',
      item.price ?? 0,
      item.date || '',
      item.source || '',
      item.comment || '',
      item.id || '', // ID tizim kodi
    ]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(rows);

  // Ustunlar kengligi
  worksheet['!cols'] = [
    { wch: 8 },  // № (Tartib raqam)
    { wch: 22 }, // Sistema vaqti
    { wch: 28 }, // Avto ehtiyot qism nomi
    { wch: 16 }, // Kod
    { wch: 18 }, // Maxsus belgisi
    { wch: 24 }, // Mashinada joylashgan joyi
    { wch: 22 }, // Ishlab chiqarilgan davlati
    { wch: 18 }, // Brend
    { wch: 26 }, // Yetkazib beruvchi
    { wch: 18 }, // Narx ($ / USD)
    { wch: 16 }, // Sana
    { wch: 22 }, // Ma'lumot manbaasi
    { wch: 35 }, // Izoh
    { wch: 26 }, // ID (Tizim kodi - o'zgartirilmasin)
  ];

  // Qatorlar balandligi
  worksheet['!rows'] = [
    { hpt: 26 }, // sarlavha qatori balandroq
    ...parts.map(() => ({ hpt: 20 })),
  ];

  // Har bir katakka qora chizilgan ramkalarni qo'llash
  applyBlackBordersToSheet(worksheet, rows.length, headers.length, [0, 1, 3, 6, 7, 10, 13], [9]);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '2-Jadval Ehtiyot qismlar');

  const dateStr = new Date().toISOString().split('T')[0];
  const fullFileName = `${fileNamePrefix}_${dateStr}.xlsx`;

  XLSX.writeFile(workbook, fullFileName);
}
