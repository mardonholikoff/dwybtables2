import React, { useState, useMemo } from 'react';
import {
  X,
  Plus,
  Save,
  Download,
  AlertTriangle,
  FileSpreadsheet,
  Trash2,
  CheckCircle2,
  Calendar,
  Layers,
} from 'lucide-react';
import { AutoPart, Supplier } from '../types';
import { exportAutoPartsForEditing } from '../utils/excelExport';

interface AutoPartsLiveTableEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  parts: AutoPart[];
  suppliers: Supplier[];
  onSaveParts: (updatedParts: AutoPart[]) => Promise<void>;
  isOnline: boolean;
}

interface EditableRow extends AutoPart {
  isNew?: boolean;
  hasError?: boolean;
  errorMessage?: string;
}

export const AutoPartsLiveTableEditorModal: React.FC<AutoPartsLiveTableEditorModalProps> = ({
  isOpen,
  onClose,
  parts,
  suppliers,
  onSaveParts,
  isOnline,
}) => {
  if (!isOpen) return null;

  // Clone parts into editable state
  const [rows, setRows] = useState<EditableRow[]>(() => {
    return parts.map((p) => ({ ...p, isNew: false }));
  });

  const [validationError, setValidationError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');

  // Valid supplier names map (case-insensitive)
  const validSupplierNamesSet = useMemo(() => {
    const set = new Set<string>();
    suppliers.forEach((s) => {
      if (s.name && s.name.trim()) {
        set.add(s.name.trim().toLowerCase());
      }
    });
    return set;
  }, [suppliers]);

  const uniqueSupplierNamesList = useMemo(() => {
    return suppliers
      .map((s) => s.name?.trim())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, 'uz'));
  }, [suppliers]);

  // Handle cell edits
  const handleCellChange = (
    index: number,
    field: keyof AutoPart,
    value: any
  ) => {
    setValidationError(null);
    setSuccessNotice(null);
    setRows((prev) => {
      const next = [...prev];
      const target = { ...next[index] };
      if (field === 'price') {
        const num = parseFloat(String(value).replace(/[^0-9.]/g, ''));
        target.price = isNaN(num) ? 0 : num;
      } else {
        (target as any)[field] = value;
      }
      next[index] = target;
      return next;
    });
  };

  // Add new row formatted identically with black borders, auto-assigned order, time, and ID
  const handleAddNewRow = () => {
    setValidationError(null);
    setSuccessNotice(null);

    const maxOrder = rows.reduce((max, r) => Math.max(max, r.orderNumber || 0), 0);
    const now = new Date();
    const currentSystemTime = now.toLocaleString('uz-UZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const todayStr = now.toISOString().split('T')[0];
    const newId = `part_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newRow: EditableRow = {
      id: newId,
      orderNumber: maxOrder + 1,
      systemTime: currentSystemTime,
      createdAt: Date.now(),
      partName: '',
      code: '',
      specialMark: '',
      carPosition: '',
      country: 'O\'zbekiston',
      brand: '',
      supplierName: uniqueSupplierNamesList.length > 0 ? uniqueSupplierNamesList[0] : '',
      price: 0,
      date: todayStr,
      source: 'Katalog',
      comment: '',
      isNew: true,
    };

    setRows((prev) => [...prev, newRow]);

    // Scroll to bottom smoothly
    setTimeout(() => {
      const container = document.getElementById('live-editor-table-scroll');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 50);
  };

  // Delete row from draft
  const handleDeleteDraftRow = (index: number) => {
    setValidationError(null);
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  // Save all rows with strict validation
  const handleValidateAndSave = async () => {
    setValidationError(null);
    setSuccessNotice(null);

    if (!isOnline) {
      setValidationError('Oflayn rejimda bazaga saqlash imkoniyati cheklangan!');
      return;
    }

    if (rows.length === 0) {
      setValidationError('Jadvalda hech qanday qator mavjud emas!');
      return;
    }

    // 1. Check mandatory fields on each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = row.orderNumber || i + 1;
      const missing: string[] = [];

      if (!row.partName || !row.partName.trim()) missing.push('Qism nomi');
      if (!row.brand || !row.brand.trim()) missing.push('Brend');
      if (!row.supplierName || !row.supplierName.trim()) missing.push('Yetkazib beruvchi');
      if (row.price === undefined || row.price === null || row.price < 0 || isNaN(row.price)) {
        missing.push('Narx ($)');
      }
      if (!row.date || !row.date.trim()) missing.push('Sana');
      if (!row.country || !row.country.trim()) missing.push('Ishlab chiqarilgan davlati');
      if (!row.source || !row.source.trim()) missing.push('Ma\'lumot manbaasi');

      if (missing.length > 0) {
        setValidationError(
          `Ogohlantirish: ${i + 1}-qatorda (Tartib raqami: №${rowNum}) majburiy maydonlar bo'sh qolgan: [${missing.join(
            ', '
          )}]. Barcha majburiy joylarni to'ldirib, qayta saqlang.`
        );
        return;
      }

      // 2. Strict Supplier check:
      // "2-jadvlada jadval asosida tahrirlashda yetkazib beruvchi mavjudlari orasidan biri bo'lsin va agar bunday bo'lmasa unda jadval baza kirishga qabul qilinmasin"
      const supplierKey = row.supplierName.trim().toLowerCase();
      if (validSupplierNamesSet.size > 0 && !validSupplierNamesSet.has(supplierKey)) {
        const availableShort = Array.from(validSupplierNamesSet).slice(0, 8).join(', ');
        setValidationError(
          `Jadval bazaga qabul qilinmadi! ${i + 1}-qatordagi «${row.supplierName}» yetkazib beruvchisi 1-jadvaldagi mavjud yetkazib beruvchilar ro'yxatida topilmadi! 2-jadvalda yetkazib beruvchi faqat 1-jadvalda mavjudlari orasidan biri bo'lishi shart. (Mavjud: ${availableShort}...). Qayta tahrirlang.`
        );
        return;
      }
    }

    // All valid -> save
    setIsSaving(true);
    try {
      // Clean up helper props
      const cleanedParts: AutoPart[] = rows.map(({ isNew, hasError, errorMessage, ...rest }) => ({
        ...rest,
        partName: rest.partName.trim(),
        code: (rest.code || '').trim(),
        specialMark: (rest.specialMark || '').trim(),
        carPosition: (rest.carPosition || '').trim(),
        country: rest.country.trim(),
        brand: rest.brand.trim(),
        supplierName: rest.supplierName.trim(),
        price: typeof rest.price === 'number' ? rest.price : parseFloat(String(rest.price)) || 0,
        date: rest.date.trim(),
        source: rest.source.trim(),
        comment: (rest.comment || '').trim(),
      }));

      await onSaveParts(cleanedParts);
      setSuccessNotice(`Muvaffaqiyatli saqlandi! Jadvaldagi jami ${cleanedParts.length} ta yozuv bazaga kiritildi.`);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setValidationError(err?.message || 'Bazaga saqlashda xatolik yuz berdi.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadExcel = () => {
    exportAutoPartsForEditing(rows, suppliers);
  };

  // Filtered rows for viewing
  const visibleRows = useMemo(() => {
    if (!filterQuery.trim()) return rows;
    const q = filterQuery.toLowerCase();
    return rows.filter((r) => {
      return (
        r.partName.toLowerCase().includes(q) ||
        (r.code && r.code.toLowerCase().includes(q)) ||
        r.brand.toLowerCase().includes(q) ||
        r.supplierName.toLowerCase().includes(q)
      );
    });
  }, [rows, filterQuery]);

  const newRowsCount = rows.filter((r) => r.isNew).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-yellow-50 border-3 border-amber-500 w-full max-w-[96vw] xl:max-w-[1500px] h-[92vh] shadow-2xl text-black flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-3 sm:p-4 bg-amber-400 border-b-2 border-amber-600 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-200 border border-amber-600">
              <Layers className="w-5 h-5 text-black stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-black font-heading">
                  2-Jadvalni tahrirlash va qator qo'shish
                </h2>
                <span className="px-2 py-0.5 bg-amber-200 border border-amber-600 font-mono font-black text-xs">
                  {rows.length} ta qator {newRowsCount > 0 && `(+${newRowsCount} ta yangi)`}
                </span>
              </div>
              <p className="text-[11px] font-bold text-stone-900">
                Excel formati kabi to'liq interaktiv muharrir. Tepadagi format bilan yangi qatorlar qo'shishingiz va saqlashingiz mumkin.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="p-1.5 text-black hover:bg-amber-300 border border-amber-600 transition cursor-pointer"
              title="Yopish"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="p-2.5 sm:p-3 bg-amber-200/90 border-b border-amber-400 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            {/* + Yangi qator qo'shish */}
            <button
              type="button"
              onClick={handleAddNewRow}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-500 border-2 border-amber-700 text-black text-xs font-black transition cursor-pointer active:scale-95 shadow-xs"
              title="Tepadagi qator bilan bir xil formatda yangi qator qo'shadi (ID, tartib raqam, sistema vaqti avtomatik beriladi)"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Yangi qator qo'shish</span>
            </button>

            {/* Excel yuklab olish */}
            <button
              type="button"
              onClick={handleDownloadExcel}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-yellow-100 border border-amber-500 text-black text-xs font-bold transition cursor-pointer active:scale-95"
              title="Hozirgi jadvalni qora ramkali Excel (.xlsx) formatida yuklab olish"
            >
              <Download className="w-3.5 h-3.5 text-emerald-800" />
              <span>Excel (.xlsx) yuklab olish</span>
            </button>

            {/* Filter input */}
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Jadval ichidan qidirish..."
              className="px-2.5 py-1 text-xs font-bold border border-amber-400 bg-white text-black placeholder:text-stone-400 focus:outline-none focus:border-amber-600 min-w-[180px]"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleValidateAndSave}
              disabled={isSaving || !isOnline}
              className={`flex items-center gap-2 px-4 py-1.5 border-2 text-xs font-black transition shadow-xs ${
                isSaving || !isOnline
                  ? 'bg-stone-300 border-stone-400 text-stone-500 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 border-emerald-800 text-white cursor-pointer active:scale-95'
              }`}
            >
              <Save className="w-4 h-4 stroke-[2.5]" />
              <span>{isSaving ? 'Bazaga saqlanmoqda...' : 'O\'zgartirishlarni bazaga saqlash'}</span>
            </button>
          </div>
        </div>

        {/* Alerts: Validation Error or Success */}
        {validationError && (
          <div className="p-3 bg-rose-100 border-b-2 border-rose-500 flex items-start gap-2.5 text-rose-950 font-bold text-xs shrink-0 animate-pulse">
            <AlertTriangle className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-black block text-rose-900 uppercase">Qabul qilinmadi:</span>
              {validationError}
            </div>
            <button
              type="button"
              onClick={() => setValidationError(null)}
              className="text-rose-700 hover:text-rose-900 cursor-pointer p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {successNotice && (
          <div className="p-3 bg-emerald-100 border-b-2 border-emerald-500 flex items-center gap-2 text-emerald-950 font-bold text-xs shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* Spreadsheet Table Scroll Container */}
        <div id="live-editor-table-scroll" className="flex-1 overflow-auto bg-stone-100 p-2 sm:p-3">
          <table className="w-full border-collapse border-2 border-black text-xs text-black bg-white">
            <thead>
              <tr className="bg-amber-300 border-b-2 border-black sticky top-0 z-20 font-heading">
                <th className="border border-black p-1.5 text-center w-12 font-black">№</th>
                <th className="border border-black p-1.5 text-left w-36 font-black">Sistema vaqti</th>
                <th className="border border-black p-1.5 text-left min-w-[200px] font-black">
                  Avto ehtiyot qism nomi <span className="text-rose-600">*</span>
                </th>
                <th className="border border-black p-1.5 text-left w-28 font-black">Kod</th>
                <th className="border border-black p-1.5 text-left w-28 font-black">Maxsus belgi</th>
                <th className="border border-black p-1.5 text-left w-32 font-black">Mashinada joyi</th>
                <th className="border border-black p-1.5 text-left w-32 font-black">
                  Davlati <span className="text-rose-600">*</span>
                </th>
                <th className="border border-black p-1.5 text-left w-32 font-black">
                  Brend <span className="text-rose-600">*</span>
                </th>
                <th className="border border-black p-1.5 text-left min-w-[180px] font-black bg-amber-400">
                  Yetkazib beruvchi <span className="text-rose-600">*</span> (1-jadvaldan)
                </th>
                <th className="border border-black p-1.5 text-right w-24 font-black">
                  Narx ($) <span className="text-rose-600">*</span>
                </th>
                <th className="border border-black p-1.5 text-center w-32 font-black">
                  Sana <span className="text-rose-600">*</span>
                </th>
                <th className="border border-black p-1.5 text-left w-32 font-black">
                  Manba <span className="text-rose-600">*</span>
                </th>
                <th className="border border-black p-1.5 text-left min-w-[140px] font-black">Izoh</th>
                <th className="border border-black p-1.5 text-center w-12 font-black">Amal</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row, idx) => {
                const originalIndex = rows.findIndex((r) => r.id === row.id);
                const isSupplierValid =
                  !row.supplierName ||
                  validSupplierNamesSet.size === 0 ||
                  validSupplierNamesSet.has(row.supplierName.trim().toLowerCase());

                return (
                  <tr
                    key={row.id}
                    className={`border-b border-black transition hover:bg-yellow-50/70 ${
                      row.isNew ? 'bg-emerald-50/80 font-medium' : idx % 2 === 0 ? 'bg-white' : 'bg-stone-50'
                    }`}
                  >
                    {/* 1. № */}
                    <td className="border border-black p-1 text-center font-mono font-black text-[11px] bg-amber-50">
                      {row.orderNumber || idx + 1}
                      {row.isNew && (
                        <span className="block text-[8px] font-bold text-emerald-700 uppercase">Yangi</span>
                      )}
                    </td>

                    {/* 2. Sistema vaqti */}
                    <td className="border border-black p-1 font-mono text-[10px] text-stone-700 whitespace-nowrap bg-stone-50">
                      {row.systemTime || '—'}
                    </td>

                    {/* 3. Avto ehtiyot qism nomi (Majburiy) */}
                    <td className="border border-black p-0.5">
                      <input
                        type="text"
                        value={row.partName}
                        onChange={(e) => handleCellChange(originalIndex, 'partName', e.target.value)}
                        placeholder="Qism nomini kiriting..."
                        className={`w-full px-1.5 py-1 text-xs font-bold text-black bg-transparent focus:bg-amber-100 focus:outline-none ${
                          !row.partName ? 'border border-rose-400 bg-rose-50' : ''
                        }`}
                      />
                    </td>

                    {/* 4. Kod */}
                    <td className="border border-black p-0.5">
                      <input
                        type="text"
                        value={row.code || ''}
                        onChange={(e) => handleCellChange(originalIndex, 'code', e.target.value)}
                        placeholder="Kod"
                        className="w-full px-1.5 py-1 text-xs text-black bg-transparent focus:bg-amber-100 focus:outline-none font-mono"
                      />
                    </td>

                    {/* 5. Maxsus belgisi */}
                    <td className="border border-black p-0.5">
                      <input
                        type="text"
                        value={row.specialMark || ''}
                        onChange={(e) => handleCellChange(originalIndex, 'specialMark', e.target.value)}
                        placeholder="Belgi"
                        className="w-full px-1.5 py-1 text-xs text-black bg-transparent focus:bg-amber-100 focus:outline-none"
                      />
                    </td>

                    {/* 6. Mashinada joylashgan joyi */}
                    <td className="border border-black p-0.5">
                      <input
                        type="text"
                        value={row.carPosition || ''}
                        onChange={(e) => handleCellChange(originalIndex, 'carPosition', e.target.value)}
                        placeholder="Joyi"
                        className="w-full px-1.5 py-1 text-xs text-black bg-transparent focus:bg-amber-100 focus:outline-none"
                      />
                    </td>

                    {/* 7. Ishlab chiqarilgan davlati */}
                    <td className="border border-black p-0.5">
                      <input
                        type="text"
                        value={row.country || ''}
                        onChange={(e) => handleCellChange(originalIndex, 'country', e.target.value)}
                        placeholder="Davlat"
                        className={`w-full px-1.5 py-1 text-xs text-black bg-transparent focus:bg-amber-100 focus:outline-none ${
                          !row.country ? 'border border-rose-400 bg-rose-50' : ''
                        }`}
                      />
                    </td>

                    {/* 8. Brend (Majburiy) */}
                    <td className="border border-black p-0.5">
                      <input
                        type="text"
                        value={row.brand || ''}
                        onChange={(e) => handleCellChange(originalIndex, 'brand', e.target.value)}
                        placeholder="Brend"
                        className={`w-full px-1.5 py-1 text-xs font-bold text-black bg-transparent focus:bg-amber-100 focus:outline-none ${
                          !row.brand ? 'border border-rose-400 bg-rose-50' : ''
                        }`}
                      />
                    </td>

                    {/* 9. Yetkazib beruvchi (MAJBURIIY VA FAQAT MAVJUDLARIDAN BIRI!) */}
                    <td
                      className={`border border-black p-0.5 ${
                        !isSupplierValid || !row.supplierName ? 'bg-rose-100' : 'bg-amber-50/50'
                      }`}
                    >
                      <select
                        value={row.supplierName || ''}
                        onChange={(e) => handleCellChange(originalIndex, 'supplierName', e.target.value)}
                        className={`w-full px-1.5 py-1 text-xs font-black focus:outline-none bg-transparent cursor-pointer ${
                          !isSupplierValid || !row.supplierName ? 'text-rose-900' : 'text-black'
                        }`}
                      >
                        <option value="">— Yetkazib beruvchini tanlang —</option>
                        {uniqueSupplierNamesList.map((sup) => (
                          <option key={sup} value={sup}>
                            {sup}
                          </option>
                        ))}
                      </select>
                      {!isSupplierValid && (
                        <span className="block text-[9px] font-black text-rose-700 px-1">
                          ⚠️ 1-jadvalda yo'q!
                        </span>
                      )}
                    </td>

                    {/* 10. Narx ($) (Majburiy) */}
                    <td className="border border-black p-0.5">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={row.price ?? 0}
                        onChange={(e) => handleCellChange(originalIndex, 'price', e.target.value)}
                        className={`w-full px-1.5 py-1 text-xs font-black text-right text-black bg-transparent focus:bg-amber-100 focus:outline-none ${
                          row.price < 0 || isNaN(row.price) ? 'border border-rose-400 bg-rose-50' : ''
                        }`}
                      />
                    </td>

                    {/* 11. Sana (Majburiy) */}
                    <td className="border border-black p-0.5">
                      <input
                        type="date"
                        value={row.date || ''}
                        onChange={(e) => handleCellChange(originalIndex, 'date', e.target.value)}
                        className={`w-full px-1 py-1 text-xs font-bold text-center text-black bg-transparent focus:bg-amber-100 focus:outline-none ${
                          !row.date ? 'border border-rose-400 bg-rose-50' : ''
                        }`}
                      />
                    </td>

                    {/* 12. Ma'lumot manbaasi */}
                    <td className="border border-black p-0.5">
                      <input
                        type="text"
                        value={row.source || ''}
                        onChange={(e) => handleCellChange(originalIndex, 'source', e.target.value)}
                        placeholder="Manba"
                        className={`w-full px-1.5 py-1 text-xs text-black bg-transparent focus:bg-amber-100 focus:outline-none ${
                          !row.source ? 'border border-rose-400 bg-rose-50' : ''
                        }`}
                      />
                    </td>

                    {/* 13. Izoh */}
                    <td className="border border-black p-0.5">
                      <input
                        type="text"
                        value={row.comment || ''}
                        onChange={(e) => handleCellChange(originalIndex, 'comment', e.target.value)}
                        placeholder="Izoh..."
                        className="w-full px-1.5 py-1 text-xs text-black bg-transparent focus:bg-amber-100 focus:outline-none"
                      />
                    </td>

                    {/* 14. Amal */}
                    <td className="border border-black p-1 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteDraftRow(originalIndex)}
                        className="p-1 text-stone-600 hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer"
                        title="Ushbu qatorni o'chirish"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-3 bg-amber-100 border-t-2 border-amber-500 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 text-xs font-bold text-stone-800">
            <span className="w-2.5 h-2.5 bg-emerald-600"></span>
            <span>
              Yangi qatorlar avtomatik tartib raqam va sistema vaqti bilan tepadagi kabi qora ramkada saqlanadi.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-white hover:bg-yellow-200 border border-amber-600 text-black text-xs font-bold transition cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              type="button"
              onClick={handleValidateAndSave}
              disabled={isSaving || !isOnline}
              className={`flex items-center gap-1.5 px-4 py-1.5 border-2 text-xs font-black transition ${
                isSaving || !isOnline
                  ? 'bg-stone-300 border-stone-400 text-stone-500 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 border-emerald-800 text-white cursor-pointer active:scale-95'
              }`}
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saqlanmoqda...' : 'O\'zgartirishlarni saqlash'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
