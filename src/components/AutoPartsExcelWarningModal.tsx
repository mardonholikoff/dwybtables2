import React, { useState } from 'react';
import { AlertTriangle, Download, X, CheckCircle2, ShieldAlert, PlusCircle, HelpCircle } from 'lucide-react';

interface AutoPartsExcelWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDownload: (newRowsCount: number) => void;
  rowCount: number;
}

export const AutoPartsExcelWarningModal: React.FC<AutoPartsExcelWarningModalProps> = ({
  isOpen,
  onClose,
  onConfirmDownload,
  rowCount,
}) => {
  if (!isOpen) return null;

  // Foydalanuvchi tanlagan yangi qatorlar soni (0, 1, 3, 5, 10, 20 yoki ixtiyoriy son)
  const [newRowsCount, setNewRowsCount] = useState<number>(5);

  const presetOptions = [0, 1, 3, 5, 10, 20];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-amber-50 border-3 border-amber-500 max-w-xl w-full shadow-2xl text-black flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 bg-amber-400 border-b-2 border-amber-600 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-amber-200 border border-amber-600">
              <ShieldAlert className="w-5 h-5 text-amber-950 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-black font-heading">
                Jadvalni yuklab tahrirlash va qator qo'shish
              </h2>
              <p className="text-[11px] font-bold text-stone-900">
                2-Jadval: Avto ehtiyot qismlar (Bazada: {rowCount} ta yozuv)
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
            <div className="space-y-1 text-stone-950">
              <p className="font-black text-[13px] leading-snug">
                Faylni yuklab olib Excelda tahrirlaysiz va so'ngra qayta tizimga yuklaysiz.
              </p>
              <p className="text-[11px] font-semibold text-stone-800">
                Agar barcha maydonlar to'g'ri to'ldirilsa, tizim jadvalni tekshirib, o'zgarishlar va yangi qatorlarni bazaga to'liq kiritadi.
              </p>
            </div>
          </div>

          {/* Qator tanlash bo'limi */}
          <div className="p-3.5 bg-white border-2 border-amber-400 space-y-2.5 shadow-2xs">
            <div className="flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-emerald-800 stroke-[2.5]" />
              <label className="font-black text-xs uppercase text-black">
                Yuklanadigan Excel fayliga nechta yangi qator qo'shilsin?
              </label>
            </div>
            <p className="text-[11px] font-semibold text-stone-700">
              Tanlangan miqdorda tepadagi qatorlar bilan bir xil formatda (qora ramkali) bo'sh qatorlar tayyorlanadi.
              Ularning <strong>№ tartib raqami</strong> va <strong>sistema vaqti</strong> avtomatik to'ldirib beriladi.
            </p>

            {/* Tezkor tanlash tugmalari */}
            <div className="flex items-center gap-2 flex-wrap pt-1">
              {presetOptions.map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setNewRowsCount(num)}
                  className={`px-3 py-1.5 border-2 text-xs font-black transition cursor-pointer active:scale-95 ${
                    newRowsCount === num
                      ? 'bg-amber-400 border-black text-black shadow-xs'
                      : 'bg-amber-50 hover:bg-yellow-100 border-amber-300 text-stone-900'
                  }`}
                >
                  {num === 0 ? "Faqat mavjudlar (0 ta)" : `+${num} ta qator`}
                </button>
              ))}

              {/* Qo'lda kiritish */}
              <div className="flex items-center gap-1.5 ml-auto">
                <span className="text-[11px] font-bold text-stone-700">Boshqa son:</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={newRowsCount}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setNewRowsCount(isNaN(val) || val < 0 ? 0 : Math.min(val, 100));
                  }}
                  className="w-16 px-2 py-1 text-xs font-black border-2 border-amber-400 bg-white text-black text-center focus:outline-none focus:border-amber-600"
                />
              </div>
            </div>

            <div className="p-2 bg-emerald-50 border border-emerald-300 text-[11px] font-bold text-emerald-950 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 stroke-[2.5]" />
              <span>
                Faylda jami: <strong>{rowCount} ta mavjud</strong> + <strong>{newRowsCount} ta yangi</strong> = <strong>{rowCount + newRowsCount} ta qator</strong> bo'ladi.
              </span>
            </div>
          </div>

          {/* Rules list */}
          <div className="space-y-2 font-bold text-stone-900">
            <h4 className="text-[11px] uppercase tracking-wider text-amber-950 font-black">
              Qayta yuklaganda bazaga to'g'ri qabul qilinishi uchun talablar:
            </h4>

            <div className="p-2.5 bg-white border border-amber-300 space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5 stroke-[2.5]" />
                <div>
                  <span className="font-black text-black">1. Yangi qatorlarni to'ldirish:</span> Excelda qo'shilgan yangi qatorlarning bo'sh katakchalarini to'ldirasiz. Tartib raqam va sistema vaqtini o'zgartirish shart emas.
                </div>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-700 shrink-0 mt-0.5 stroke-[2.5]" />
                <div>
                  <span className="font-black text-black">2. Yetkazib beruvchi faqat 1-jadvaldan:</span> 2-jadvaldagi yetkazib beruvchi nomi 1-jadvalda mavjud yetkazib beruvchilar ro'yxatida bo'lishi shart! (Faylning 2-varag'ida mavjud yetkazib beruvchilar ro'yxati berilgan). Aks holda qabul qilinmaydi.
                </div>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-rose-700 shrink-0 mt-0.5 stroke-[2.5]" />
                <div>
                  <span className="font-black text-black">3. Majburiy maydonlar to'liq bo'lsin:</span> Qism nomi, Brend, Yetkazib beruvchi, Narx, Sana, Davlat va Manba to'liq to'ldirilgan bo'lishi kerak.
                </div>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5 stroke-[2.5]" />
                <div>
                  <span className="font-black text-black">4. Ustunlar nomini o'zgartirmang:</span> Sarlavha ustunlari ketma-ketligi o'zgarmasligi lozim. Tahrirlab bo'lgach, jadval ostidagi «Tahrirlangan jadvalni yuklash» bo'limiga yuklaysiz.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-3 sm:p-4 bg-yellow-100 border-t-2 border-amber-400 flex items-center justify-between gap-2.5">
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
              onConfirmDownload(newRowsCount);
              onClose();
            }}
            className="px-4 py-2 bg-amber-400 hover:bg-amber-500 border-2 border-amber-600 text-black text-xs font-black flex items-center gap-2 transition cursor-pointer active:scale-95 shadow-xs"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>Roziman (Excel faylni yuklab olish)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
