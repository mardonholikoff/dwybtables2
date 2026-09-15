import React from 'react';
import { Check, X, AlertCircle, ArrowRight, Save, Layers } from 'lucide-react';
import { RowDiff } from '../utils/excelImport';

interface AutoPartsExcelImportDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  diffs: RowDiff[];
  totalRows: number;
  onConfirmSave: () => Promise<void>;
  isSaving: boolean;
}

export const AutoPartsExcelImportDiffModal: React.FC<AutoPartsExcelImportDiffModalProps> = ({
  isOpen,
  onClose,
  diffs,
  totalRows,
  onConfirmSave,
  isSaving,
}) => {
  if (!isOpen) return null;

  const totalFieldsChanged = diffs.reduce((acc, curr) => acc + curr.changes.length, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-amber-50 border-3 border-amber-500 max-w-3xl w-full shadow-2xl text-black flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 bg-amber-400 border-b-2 border-amber-600 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-amber-200 border border-amber-600">
              <Layers className="w-5 h-5 text-amber-950 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-black font-heading">
                Tahrirlangan jadval tekshiruvi
              </h2>
              <p className="text-[11px] font-bold text-stone-900">
                Jami {totalRows} ta qatordan {diffs.length} tasida o'zgartirish aniqlandi ({totalFieldsChanged} ta katakcha)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="p-1 text-black hover:bg-amber-300 border border-amber-600 transition cursor-pointer"
            title="Yopish"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {diffs.length === 0 ? (
            <div className="p-4 bg-yellow-100 border-2 border-amber-400 flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-amber-800 shrink-0" />
              <div>
                <p className="font-black text-sm">Faylda hech qanday o'zgarish topilmadi!</p>
                <p className="text-stone-700 font-medium">
                  Yuklangan jadvaldagi barcha qiymatlar hozirgi bazadagi ma'lumotlar bilan aynan bir xil.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="p-3 bg-emerald-100 border-2 border-emerald-500 text-emerald-950 font-bold flex flex-wrap items-center justify-between gap-2">
                <span>
                  ✓ Jadval muvaffaqiyatli tekshirildi. Quyidagi o'zgarishlar va yangi qatorlar bazaga kiritiladi:
                </span>
                <div className="flex items-center gap-2">
                  {diffs.some((d) => d.isNewRow) && (
                    <span className="px-2 py-0.5 bg-emerald-300 border border-emerald-700 font-mono font-black text-xs text-emerald-950">
                      +{diffs.filter((d) => d.isNewRow).length} ta yangi qator
                    </span>
                  )}
                  <span className="px-2 py-0.5 bg-amber-200 border border-amber-600 font-mono font-black text-xs shrink-0">
                    Jami: {diffs.length} ta yozuv
                  </span>
                </div>
              </div>

              {/* Diffs List */}
              <div className="space-y-3">
                {diffs.map((diff, index) => (
                  <div
                    key={diff.partId || index}
                    className={`p-3 border-2 shadow-2xs space-y-2 ${
                      diff.isNewRow ? 'bg-emerald-50/70 border-emerald-500' : 'bg-white border-amber-300'
                    }`}
                  >
                    {/* Row title */}
                    <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-amber-200">
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 border font-mono font-black text-[11px] ${
                          diff.isNewRow
                            ? 'bg-emerald-300 border-emerald-600 text-emerald-950'
                            : 'bg-amber-300 border-amber-500 text-black'
                        }`}>
                          № {diff.orderNumber}
                        </span>
                        <span className="font-black text-xs text-black">
                          {diff.partName}
                        </span>
                        {diff.isNewRow && (
                          <span className="px-1.5 py-0.5 bg-emerald-600 text-white font-black text-[10px] uppercase">
                            Yangi qator
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-stone-600">
                        {diff.isNewRow ? 'Avtomatik tizim ID va vaqti berilgan' : `${diff.changes.length} ta maydon o'zgardi`}
                      </span>
                    </div>

                    {/* Changes list in this row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {diff.changes.map((change, cIdx) => (
                        <div
                          key={cIdx}
                          className="p-2 bg-yellow-50/80 border border-amber-200 text-[11px] flex flex-col gap-1"
                        >
                          <span className="font-black text-amber-950 uppercase text-[10px]">
                            {change.fieldLabel}:
                          </span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-1.5 py-0.5 bg-rose-100 border border-rose-300 text-rose-900 line-through text-[11px]">
                              {change.oldValue || '—'}
                            </span>
                            <ArrowRight className="w-3 h-3 text-stone-500 shrink-0" />
                            <span className="px-1.5 py-0.5 bg-emerald-100 border border-emerald-400 font-black text-emerald-950 text-[11px]">
                              {change.newValue || '—'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Modal Actions */}
        <div className="p-3 sm:p-4 bg-yellow-100 border-t-2 border-amber-400 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 bg-stone-200 hover:bg-stone-300 border-2 border-stone-400 text-black text-xs font-black transition cursor-pointer"
          >
            Bekor qilish
          </button>
          {diffs.length > 0 && (
            <button
              type="button"
              onClick={onConfirmSave}
              disabled={isSaving}
              className={`px-4 py-2 border-2 text-xs font-black flex items-center gap-2 transition shadow-xs ${
                isSaving
                  ? 'bg-amber-200 border-amber-400 text-stone-500 cursor-not-allowed'
                  : 'bg-emerald-500 hover:bg-emerald-600 border-emerald-700 text-white cursor-pointer active:scale-95'
              }`}
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-stone-600 border-t-transparent animate-spin rounded-full" />
                  <span>Bazaga saqlanmoqda...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 stroke-[2.5]" />
                  <span>O'zgarishlarni bazaga saqlash ({diffs.length} ta)</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
