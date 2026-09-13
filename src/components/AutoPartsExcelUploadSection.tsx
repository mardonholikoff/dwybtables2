import React, { useRef, useState } from 'react';
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle, WifiOff, FileCheck2 } from 'lucide-react';
import { AutoPart } from '../types';
import { parseAndValidateEditedAutoParts, RowDiff } from '../utils/excelImport';
import { AutoPartsExcelImportDiffModal } from './AutoPartsExcelImportDiffModal';

interface AutoPartsExcelUploadSectionProps {
  parts: AutoPart[];
  isOnline: boolean;
  onBulkUpdateParts: (updatedParts: AutoPart[]) => Promise<void>;
}

export const AutoPartsExcelUploadSection: React.FC<AutoPartsExcelUploadSectionProps> = ({
  parts,
  isOnline,
  onBulkUpdateParts,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);
  const [diffs, setDiffs] = useState<RowDiff[]>([]);
  const [pendingUpdatedParts, setPendingUpdatedParts] = useState<AutoPart[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileProcess = async (file: File) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!file) return;

    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      setErrorMessage('Faqat Excel (.xlsx yoki .xls) fayllari qabul qilinadi!');
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const result = parseAndValidateEditedAutoParts(buffer, parts);

      if (!result.success) {
        setErrorMessage(result.error || 'Faylni tekshirishda xatolik yuz berdi.');
        return;
      }

      if (result.diffs && result.diffs.length === 0) {
        setSuccessMessage('Fayl tekshirildi: Barcha ma\'lumotlar to\'liq mos, ammo yangi o\'zgarishlar kiritilmagan.');
        return;
      }

      setDiffs(result.diffs || []);
      setPendingUpdatedParts(result.updatedParts || []);
      setIsDiffModalOpen(true);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Faylni o\'qishda kutilmagan xatolik yuz berdi.');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isOnline) return;
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!isOnline) return;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleConfirmSave = async () => {
    if (!isOnline) {
      alert('Oflayn rejimda o\'zgartirishlarni saqlash imkoniyati cheklangan!');
      return;
    }

    setIsSaving(true);
    try {
      await onBulkUpdateParts(pendingUpdatedParts);
      setIsDiffModalOpen(false);
      setSuccessMessage(`Muvaffaqiyatli saqlandi! Jadvaldagi ${diffs.length} ta yozuv bazada yangilandi.`);
      setDiffs([]);
      setPendingUpdatedParts([]);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Bazaga saqlashda xatolik yuz berdi.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-yellow-100/90 border-2 border-amber-400 p-3 sm:p-4 shadow-sm text-black space-y-3 rounded-none">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx, .xls"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-amber-300">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-400 border border-amber-600">
            <FileSpreadsheet className="w-4 h-4 text-emerald-950 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-black font-heading">
              Tahrirlangan jadvalni yuklash (Excel import)
            </h3>
            <p className="text-[11px] font-bold text-stone-700">
              Faqatgina jadvlaga mos qator ({parts.length} ta) va ustunlari bo'lgan faylni qabul qiladi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-amber-300 border border-amber-500 font-mono font-black text-[11px] text-black">
            Bazada: {parts.length} ta qator
          </span>
        </div>
      </div>

      {/* Error alert banner */}
      {errorMessage && (
        <div className="p-3 bg-rose-100 border-2 border-rose-500 text-rose-950 font-bold text-xs flex items-start justify-between gap-2 shadow-2xs">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-700 shrink-0 mt-0.5 stroke-[2.5]" />
            <div>
              <p className="font-black">Yuklash rad etildi:</p>
              <p className="text-[11px] font-semibold">{errorMessage}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-700 hover:text-rose-950 font-black text-sm px-1.5 py-0.5 border border-rose-300 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Success alert banner */}
      {successMessage && (
        <div className="p-3 bg-emerald-100 border-2 border-emerald-500 text-emerald-950 font-bold text-xs flex items-start justify-between gap-2 shadow-2xs">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5 stroke-[2.5]" />
            <div>
              <p className="font-black">Muvaffaqiyatli:</p>
              <p className="text-[11px] font-semibold">{successMessage}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-950 font-black text-sm px-1.5 py-0.5 border border-emerald-300 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Upload Drop Zone / Button */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`p-4 sm:p-5 border-2 border-dashed transition flex flex-col sm:flex-row items-center justify-between gap-4 ${
          !isOnline
            ? 'bg-stone-100 border-stone-300 cursor-not-allowed'
            : isDragging
            ? 'bg-amber-200 border-amber-600 scale-[1.005]'
            : 'bg-yellow-50/90 hover:bg-yellow-50 border-amber-400'
        }`}
      >
        <div className="flex items-center gap-3 text-left">
          <div className="p-2.5 bg-amber-300 border border-amber-500 shrink-0">
            <Upload className="w-6 h-6 text-black stroke-[2.5]" />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-black text-black">
              Tahrirlangan Excel (.xlsx) faylini bu yerga tortib olib keling yoki tugmani bosing
            </p>
            <p className="text-[11px] font-semibold text-stone-700">
              Qatorlar soni aynan <strong>{parts.length} ta</strong> bo'lishi va ustunlar o'zgartirilmagan bo'lishi shart.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={!isOnline}
          className={`px-4 py-2.5 border-2 text-xs font-black flex items-center justify-center gap-2 shrink-0 transition cursor-pointer active:scale-95 shadow-xs w-full sm:w-auto ${
            !isOnline
              ? 'bg-stone-200 border-stone-400 text-stone-500 cursor-not-allowed'
              : 'bg-emerald-500 hover:bg-emerald-600 border-emerald-700 text-white'
          }`}
          title={!isOnline ? "Oflayn rejimda fayl yuklab bo'lmaydi" : "Tahrirlangan jadvalni yuklash"}
        >
          {!isOnline ? (
            <WifiOff className="w-4 h-4 text-rose-700 stroke-[2.5]" />
          ) : (
            <FileCheck2 className="w-4 h-4 stroke-[2.5]" />
          )}
          <span>
            {!isOnline ? 'Oflayn (Cheklangan)' : 'Tahrirlangan jadvalni yuklash (.xlsx)'}
          </span>
        </button>
      </div>

      {/* Difference Review Modal */}
      <AutoPartsExcelImportDiffModal
        isOpen={isDiffModalOpen}
        onClose={() => setIsDiffModalOpen(false)}
        diffs={diffs}
        totalRows={parts.length}
        onConfirmSave={handleConfirmSave}
        isSaving={isSaving}
      />
    </div>
  );
};
