import * as XLSX from 'xlsx';
import { Supplier, AutoPart } from '../types';

export function exportSuppliersToExcel(suppliers: Supplier[], fileNamePrefix = 'Daewoo_Yetkazib_beruvchilar') {
  const exportData = suppliers.map((item) => {
    let tolovSharti = item.paymentCondition as string;
    if (item.paymentCondition === 'kechiktirib to\'lash' && item.delayDays) {
      tolovSharti = `Kechiktirib to'lash (${item.delayDays} kun)`;
    }

    return {
      '№ (Tartib raqam)': item.orderNumber,
      'Sistema vaqti': item.systemTime,
      'Faoliyat turi': item.activityTypes && item.activityTypes.length > 0 ? item.activityTypes.join(' + ') : item.activityType,
      'Nom (Kompaniya / Shaxs)': item.name,
      'Manzil': item.address,
      'Telefon raqam': item.phone,
      'Pul o\'tkazmalari': item.paymentMethod.toUpperCase(),
      'To\'lov sharti': tolovSharti,
      'Sifat barqarorligi': item.qualityStability.toUpperCase(),
      'Shaffoflik darajasi': item.transparencyLevel.toUpperCase(),
      'Javobgarlik': item.responsibility,
      'Intizom darajasi': item.disciplineLevel.toUpperCase(),
      'Qo\'shimchalar': item.extras,
      'Taklif qilinadigan mahsulotlar': item.products && item.products.length > 0 ? item.products.join(', ') : '—',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);

  // Set column widths for neat appearance
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

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Yetkazib beruvchilar');

  const dateStr = new Date().toISOString().split('T')[0];
  const fullFileName = `${fileNamePrefix}_${dateStr}.xlsx`;

  XLSX.writeFile(workbook, fullFileName);
}

export function exportAutoPartsToExcel(parts: AutoPart[], fileNamePrefix = 'Daewoo_Avto_ehtiyot_qismlar') {
  const exportData = parts.map((item) => ({
    '№ (Tartib raqam)': item.orderNumber,
    'Sistema vaqti': item.systemTime,
    'Avto ehtiyot qism nomi': item.partName,
    'Kod': item.code || '',
    'Maxsus belgisi': item.specialMark || '',
    'Mashinada joylashgan joyi': item.carPosition || '',
    'Ishlab chiqarilgan davlati': item.country || '',
    'Brend': item.brand,
    'Yetkazib beruvchi': item.supplierName,
    'Narx ($ / USD)': item.price,
    'Sana': item.date,
    'Ma\'lumot manbaasi': item.source,
    'Izoh': item.comment || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);

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

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Avto ehtiyot qismlar');

  const dateStr = new Date().toISOString().split('T')[0];
  const fullFileName = `${fileNamePrefix}_${dateStr}.xlsx`;

  XLSX.writeFile(workbook, fullFileName);
}

