import React from 'react';
import { AlertTriangle, Download, X, CheckCircle2, ShieldAlert } from 'lucide-react';

interface AutoPartsExcelWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDownload: () => void;
  rowCount: number;
}

export const AutoPartsExcelWarningModal: React.FC<AutoPartsExcelWarningModalProps> = ({
  isOpen,
  onClose,
  onConfirmDownload,
  rowCount,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-amber-50 border-3 border-amber-500 max-w-xl w-full shadow-2xl text-black flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 bg-amber-400 border-b-2 border-amber-600 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-amber-200 border border-amber-600">
              <ShieldAlert className="w-5 h-5 text-amber-950 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-black font-heading">
                Jadvalni tahrirlash bo'yicha muhim ogohlantirish
              </h2>
              <p className="text-[11px] font-bold text-stone-900">
                2-Jadval: Avto ehtiyot qismlar ({rowCount} ta yozuv)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-black hover:bg-amber-300 border border-amber-600 transition cursor-pointer"
            title="Yopish"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {/* Main warning box */}
          <div className="p-3.5 bg-yellow-100 border-2 border-amber-500 flex items-start gap-3 shadow-2xs">
            <AlertTriangle className="w-6 h-6 text-amber-900 shrink-0 mt-0.5 stroke-[2.5]" />
            <div className="space-y-1.5 text-stone-950">
              <p className="font-black text-[13px] leading-snug">
                Hozir «Roziman» tugmasini bosganingizdan keyin jadvalning ustun va qatorlariga umuman o'zgartirish kiritmasdan, faqatgina ichidagi qiymatlarni o'zgartirishingiz kerak!
              </p>
              <p className="text-[11px] font-semibold text-stone-800">
                Jadval strukturasiga tegilsa (ustun yoki qatorlar o'zgarsa), tizim faylni qabul qilmaydi.
              </p>
            </div>
          </div>

          {/* Rules list */}
          <div className="space-y-2 font-bold text-stone-900">
            <h4 className="text-[11px] uppercase tracking-wider text-amber-950 font-black">
              Qat'iy qoidalar:
            </h4>

            <div className="p-2.5 bg-white border border-amber-300 space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5 stroke-[2.5]" />
                <div>
                  <span className="font-black text-black">1. Ustunlarga tegmang:</span> Sarlavha ustunlari nomi, ketma-ketligi yoki sonini o'zgartirish taqiqlanadi.
                </div>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5 stroke-[2.5]" />
                <div>
                  <span className="font-black text-black">2. Qatorlar soni o'zgarmasligi shart:</span> Yangi qator qo'shish yoki mavjud qatorlarni o'chirish mumkin emas. Yuklanganda qatorlar soni aynan <strong>{rowCount} ta</strong> bo'lishi shart.
                </div>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5 stroke-[2.5]" />
                <div>
                  <span className="font-black text-black">3. Faqat qiymatlarni o'zgartiring:</span> Har bir qatordagi narx, kod, maxsus belgi, brend, joylashuv, sana yoki izoh kataklaridagi ma'lumotlarni erkin tahrirlashingiz mumkin.
                </div>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-700 shrink-0 mt-0.5 stroke-[2.5]" />
                <div>
                  <span className="font-black text-black">4. Chizilgan qora ramkali fayl:</span> Jadval chiroyli qora ramkalar bilan <strong>.xlsx</strong> formatda yuklab beriladi. Tahrirlab bo'lgach, jadval ostidagi «Tahrirlangan jadvalni yuklash» tugmasi orqali yuklaysiz.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-3 sm:p-4 bg-yellow-100 border-t-2 border-amber-400 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-stone-200 hover:bg-stone-300 border-2 border-stone-400 text-black text-xs font-black transition cursor-pointer"
          >
            Bekor qilish
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirmDownload();
              onClose();
            }}
            className="px-4 py-2 bg-amber-400 hover:bg-amber-500 border-2 border-amber-600 text-black text-xs font-black flex items-center gap-2 transition cursor-pointer active:scale-95 shadow-xs"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>Roziman (Yuklab olish)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
