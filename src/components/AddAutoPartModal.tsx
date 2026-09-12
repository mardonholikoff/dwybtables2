import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Save,
  AlertCircle,
  Droplet,
  Calendar,
  Building2,
  Tag,
  DollarSign,
  Info,
  FileText,
  History,
  CheckCircle2,
  Sparkles,
  Search,
  Check,
} from 'lucide-react';
import { AutoPart, AutoPartFormData, Supplier } from '../types';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { formatUSD } from '../utils/formatCurrency';

interface AddAutoPartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: AutoPartFormData, editId?: string) => Promise<void> | void;
  currentCount: number;
  initialPart?: AutoPart | null;
  suppliers: Supplier[];
  existingParts?: AutoPart[];
}

export const AddAutoPartModal: React.FC<AddAutoPartModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentCount,
  initialPart,
  suppliers,
  existingParts = [],
}) => {
  const isOnline = useOnlineStatus();
  const isEditMode = Boolean(initialPart);

  const getTodayDate = () => {
    const d = new Date();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
  };

  const [formData, setFormData] = useState<AutoPartFormData>({
    partName: '',
    brand: '',
    supplierName: '',
    price: '',
    date: getTodayDate(),
    source: '',
    comment: '',
  });

  const [selectedTemplatePartId, setSelectedTemplatePartId] = useState<string>('');
  const [templateSearch, setTemplateSearch] = useState<string>('');
  const [autoFilledNotice, setAutoFilledNotice] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Noyob yoki tartiblangan oldingi moylar ro'yxati
  const sortedExistingParts = useMemo(() => {
    return [...existingParts].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [existingParts]);

  // Qidiruv bo'yicha filtrlangan eski moylar
  const filteredExistingParts = useMemo(() => {
    if (!templateSearch.trim()) return sortedExistingParts;
    const query = templateSearch.toLowerCase().trim();
    return sortedExistingParts.filter(
      (p) =>
        p.partName.toLowerCase().includes(query) ||
        p.brand.toLowerCase().includes(query) ||
        p.supplierName.toLowerCase().includes(query)
    );
  }, [sortedExistingParts, templateSearch]);

  useEffect(() => {
    if (isOpen) {
      setSelectedTemplatePartId('');
      setTemplateSearch('');
      setAutoFilledNotice(null);
      if (initialPart) {
        setFormData({
          partName: initialPart.partName,
          brand: initialPart.brand,
          supplierName: initialPart.supplierName,
          price: String(initialPart.price),
          date: initialPart.date || getTodayDate(),
          source: initialPart.source,
          comment: initialPart.comment,
        });
      } else {
        setFormData({
          partName: '',
          brand: '',
          supplierName: suppliers.length > 0 ? suppliers[0].name : '',
          price: '',
          date: getTodayDate(),
          source: '',
          comment: '',
        });
      }
      setErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen, initialPart, suppliers]);

  // Eski moy tanlanganda avtomatik to'ldirish
  const handleSelectExistingPart = (partId: string) => {
    setSelectedTemplatePartId(partId);
    if (!partId) return;

    const chosen = existingParts.find((p) => p.id === partId);
    if (chosen) {
      setFormData({
        partName: chosen.partName,
        brand: chosen.brand,
        supplierName: chosen.supplierName,
        price: String(chosen.price),
        date: getTodayDate(), // yangi yozuv uchun joriy sana qo'yiladi
        source: chosen.source,
        comment: chosen.comment || '',
      });
      setAutoFilledNotice(
        `«${chosen.partName} (${chosen.brand})» moy ma'lumotlari avtomatik to'ldirildi. Qo'shishdan oldin narx yoki boshqa maydonlarni tahrirlashingiz mumkin!`
      );
      setErrors({});
    }
  };

  if (!isOpen) return null;

  const validate = (): boolean => {
    const errs: { [key: string]: string } = {};

    if (!formData.partName.trim()) {
      errs.partName = 'Moy nomi kiritilishi shart (majburiy)';
    }
    if (!formData.brand.trim()) {
      errs.brand = 'Brend kiritilishi shart (majburiy)';
    }
    if (!formData.supplierName.trim()) {
      errs.supplierName = 'Yetkazib beruvchilar ro\'yxatidan tanlanishi shart (majburiy)';
    }
    const rawPriceStr = String(formData.price).replace(/,/g, '.').replace(/\s/g, '');
    const numPrice = parseFloat(rawPriceStr);
    if (!formData.price || isNaN(numPrice) || numPrice <= 0) {
      errs.price = 'To\'g\'ri narx kiritilishi shart (0 dan yuqori son, masalan: 0.02, 1.5, 25)';
    }
    if (!formData.date.trim()) {
      errs.date = 'Sana kiritilishi shart (majburiy)';
    }
    if (!formData.source.trim()) {
      errs.source = 'Ma\'lumot manbaasi kiritilishi shart (majburiy)';
    }
    // Izoh qismi majburiy emas (ixtiyoriy)

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline) {
      alert('Oflayn rejimda yangi yozuv qo\'shish imkoniyati cheklangan!');
      return;
    }
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      await onSave(formData, initialPart ? initialPart.id : undefined);
      onClose();
    } catch (err: any) {
      alert(err?.message || 'Xatolik yuz berdi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentSystemTime = initialPart?.systemTime || new Date().toLocaleString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const searchTrimmed = templateSearch.trim();
  const isSearchActive = searchTrimmed.length >= 3;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-amber-50 border-3 border-amber-500 shadow-2xl my-6 text-black rounded-none">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-yellow-200 border-b-2 border-amber-400">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-400 border border-amber-600 text-black">
              <Droplet className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-black font-heading">
                {isEditMode ? 'Moy ma\'lumotlarini tahrirlash' : 'Yangi moy qo\'shish'}
              </h2>
              <p className="text-[10px] text-stone-700 font-bold">
                Barcha maydonlar to'ldirilishi majburiy
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 bg-amber-300 hover:bg-amber-400 border border-amber-500 text-black cursor-pointer transition"
            title="Yopish"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Offline notification if offline */}
        {!isOnline && (
          <div className="bg-amber-200 border-b-2 border-amber-400 px-4 py-2 text-xs font-black text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
            <span>Oflayn rejimdasiz. Yozuv qo'shish yoki tahrirlash faqat internetga ulanganda mumkin.</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5 max-h-[80vh] overflow-y-auto">
          
          {/* Eski qo'shilgan moylardan tezkor tanlash (Avtomatik to'ldirish va tahrirlash imkoniyati) */}
          {existingParts && existingParts.length > 0 && !isEditMode && (
            <div className="p-3 bg-amber-100/90 border-2 border-amber-400 space-y-2.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <label
                  htmlFor="quick-search-oil"
                  className="text-xs font-black uppercase text-amber-950 flex items-center gap-1.5"
                >
                  <History className="w-4 h-4 text-amber-800" />
                  <span>Eski moylardan tanlash:</span>
                </label>
                <span className="text-[10px] bg-amber-300 px-2 py-0.5 border border-amber-500 font-black text-black">
                  {existingParts.length} ta mavjud moy
                </span>
              </div>

              {/* Qidiruv inputi */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-500 pointer-events-none" />
                <input
                  id="quick-search-oil"
                  type="text"
                  value={templateSearch}
                  onChange={(e) => setTemplateSearch(e.target.value)}
                  placeholder="Moy nomi, brendi yoki yetkazib beruvchini qidiring (kamida 3 ta harf)..."
                  className="w-full pl-8 pr-8 py-2 text-xs border-2 border-amber-500 bg-white text-black font-bold focus:outline-none focus:ring-2 focus:ring-amber-600 rounded-none placeholder:text-stone-400"
                />
                {templateSearch && (
                  <button
                    type="button"
                    onClick={() => setTemplateSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-500 hover:text-black text-sm font-black px-1 cursor-pointer"
                    title="Qidiruvni tozalash"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* 3 ta harf kiritilmagan holatda eslatma */}
              {searchTrimmed.length > 0 && searchTrimmed.length < 3 && (
                <div className="p-2 bg-yellow-200/90 border border-amber-400 text-[11px] font-bold text-amber-950 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-amber-800 shrink-0" />
                  <span>
                    Mos moylarni chiqarish uchun kamida 3 ta harf yozing (hozirda {searchTrimmed.length} ta kiritildi)
                  </span>
                </div>
              )}

              {/* 3 ta harf yozilganda mos moylar ro'yxati */}
              {isSearchActive && (
                <div className="border-2 border-amber-500 bg-white shadow-md">
                  <div className="bg-amber-200 px-3 py-1.5 border-b border-amber-400 flex items-center justify-between text-[11px] font-black text-black">
                    <span>Qidiruv natijalari ({filteredExistingParts.length} ta mos moy):</span>
                    <span className="text-[10px] text-stone-700 italic">Tanlash uchun bosing</span>
                  </div>

                  {filteredExistingParts.length === 0 ? (
                    <div className="p-3 text-center text-xs font-bold text-stone-600 bg-yellow-50/50">
                      «{templateSearch}» bo'yicha hech qanday moy topilmadi
                    </div>
                  ) : (
                    <div className="max-h-48 overflow-y-auto divide-y divide-amber-200">
                      {filteredExistingParts.map((p) => {
                        const isSelected = selectedTemplatePartId === p.id;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handleSelectExistingPart(p.id)}
                            className={`w-full text-left p-2.5 transition flex items-center justify-between gap-2.5 cursor-pointer ${
                              isSelected
                                ? 'bg-amber-200 ring-2 ring-inset ring-amber-600'
                                : 'hover:bg-yellow-100 bg-white'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-black text-xs text-black">{p.partName}</span>
                                <span className="px-1.5 py-0.2 bg-amber-200 border border-amber-400 text-[10px] font-black uppercase text-stone-900">
                                  {p.brand}
                                </span>
                              </div>
                              <div className="text-[11px] text-stone-700 font-semibold mt-0.5 truncate">
                                Yetkazib beruvchi: <span className="text-black font-bold">{p.supplierName}</span>
                                {p.source ? ` • Manba: ${p.source}` : ''}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-xs font-black text-emerald-800">
                                {formatUSD(p.price)} USD
                              </div>
                              <div className="text-[10px] text-stone-500 font-mono">{p.date}</div>
                              <span className="inline-block mt-1 px-2 py-0.5 bg-amber-400 hover:bg-amber-500 border border-amber-600 text-[10px] font-black text-black">
                                Tanlash
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Qo'shimcha to'liq select dropdown */}
              <div className="pt-1">
                <select
                  id="quick-select-part"
                  value={selectedTemplatePartId}
                  onChange={(e) => handleSelectExistingPart(e.target.value)}
                  className="w-full px-3 py-2 text-xs border-2 border-amber-500 bg-white text-black font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-none cursor-pointer"
                >
                  <option value="">
                    {templateSearch
                      ? `-- Mos moylardan birini tanlang (${filteredExistingParts.length} ta) --`
                      : `-- Barcha eski moylar ro'yxatidan tanlang (${existingParts.length} ta) --`}
                  </option>
                  {filteredExistingParts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.partName} | {p.brand} | {p.supplierName} | {formatUSD(p.price)} USD
                    </option>
                  ))}
                </select>
              </div>

              {autoFilledNotice && (
                <div className="flex items-start gap-1.5 p-2 bg-emerald-100 border border-emerald-400 text-emerald-900 text-[11px] font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                  <span>{autoFilledNotice}</span>
                </div>
              )}
            </div>
          )}

          {/* 1 & 2: Avtomatik to'ldiriladigan ustunlar */}
          <div className="grid grid-cols-2 gap-3 p-2.5 bg-yellow-100 border border-amber-300">
            <div>
              <span className="text-[10px] font-black uppercase text-stone-700 block">
                1. Tartib raqami (Avtomatik)
              </span>
              <div className="mt-1 px-3 py-1.5 bg-amber-200 border border-amber-400 font-mono font-black text-sm text-black">
                № {initialPart ? initialPart.orderNumber : currentCount + 1}
              </div>
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-stone-700 block">
                2. Sistema vaqti (Avtomatik)
              </span>
              <div className="mt-1 px-3 py-1.5 bg-amber-200 border border-amber-400 font-mono font-bold text-xs text-black">
                {currentSystemTime}
              </div>
            </div>
          </div>

          {/* 3. Moy nomi */}
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-black block mb-1">
              3. Moy nomi <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              value={formData.partName}
              onChange={(e) => setFormData({ ...formData, partName: e.target.value })}
              placeholder="Masalan: Mannol 5W-30, Shell Helix Ultra 5W-40, ZIC X7 10W-40, Castrol Edge, Total Quartz..."
              className={`w-full px-3 py-2 text-xs border-2 bg-white text-black font-bold focus:outline-none rounded-none ${
                errors.partName ? 'border-rose-600 bg-rose-50' : 'border-amber-400 focus:border-amber-600'
              }`}
            />
            {errors.partName && (
              <p className="mt-1 text-[11px] font-bold text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.partName}
              </p>
            )}
          </div>

          {/* 4. Brend */}
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-black block mb-1">
              4. Brend <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              placeholder="Masalan: Sangsin Hi-Q, Mando, Mann Filter, Bosch, GM Korea..."
              className={`w-full px-3 py-2 text-xs border-2 bg-white text-black font-bold focus:outline-none rounded-none ${
                errors.brand ? 'border-rose-600 bg-rose-50' : 'border-amber-400 focus:border-amber-600'
              }`}
            />
            {errors.brand && (
              <p className="mt-1 text-[11px] font-bold text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.brand}
              </p>
            )}
          </div>

          {/* 5. Yetkazib beruvchi (Faqat yetkazib beruvchilar ro'yxatidan ismi bo'yicha tanlanadi) */}
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-black block mb-1">
              5. Yetkazib beruvchi <span className="text-rose-600">*</span>
            </label>
            {suppliers.length === 0 ? (
              <div className="p-2.5 bg-yellow-100 border-2 border-amber-400 text-xs font-bold text-stone-800">
                Yetkazib beruvchilar ro'yxati hozircha bo'sh. Avval 1-jadvalda yetkazib beruvchi qo'shing.
              </div>
            ) : (
              <select
                value={formData.supplierName}
                onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                className={`w-full px-3 py-2 text-xs border-2 bg-white text-black font-bold focus:outline-none rounded-none ${
                  errors.supplierName ? 'border-rose-600 bg-rose-50' : 'border-amber-400 focus:border-amber-600'
                }`}
              >
                <option value="">-- Yetkazib beruvchini tanlang --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name} ({s.activityType === 'yuridik' ? 'Yuridik' : 'Jismoniy'})
                  </option>
                ))}
              </select>
            )}
            {errors.supplierName && (
              <p className="mt-1 text-[11px] font-bold text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.supplierName}
              </p>
            )}
          </div>

          {/* 6. Narx va 7. Sana */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-black uppercase tracking-wider text-black block mb-1">
                6. Narx ($ / AQSH dollari) <span className="text-rose-600">*</span>
              </label>
              <input
                type="number"
                min="0.0001"
                step="any"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="Masalan: 0.02 yoki 15.50 yoki 120"
                className={`w-full px-3 py-2 text-xs border-2 bg-white text-black font-bold focus:outline-none rounded-none ${
                  errors.price ? 'border-rose-600 bg-rose-50' : 'border-amber-400 focus:border-amber-600'
                }`}
              />
              {formData.price && !isNaN(Number(String(formData.price).replace(',', '.'))) && (
                <span className="text-[10px] font-black text-stone-700 block mt-0.5">
                  {formatUSD(formData.price)} USD
                </span>
              )}
              {errors.price && (
                <p className="mt-1 text-[11px] font-bold text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.price}
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-black uppercase tracking-wider text-black block mb-1">
                7. Sana <span className="text-rose-600">*</span>
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className={`w-full px-3 py-2 text-xs border-2 bg-white text-black font-bold focus:outline-none rounded-none ${
                  errors.date ? 'border-rose-600 bg-rose-50' : 'border-amber-400 focus:border-amber-600'
                }`}
              />
              {errors.date && (
                <p className="mt-1 text-[11px] font-bold text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.date}
                </p>
              )}
            </div>
          </div>

          {/* 8. Ma'lumot manbaasi */}
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-black block mb-1">
              8. Ma'lumot manbaasi <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              placeholder="Masalan: Rasmiy diler, Ulgurji bozor, Do'kon, Koreya import, Telefon orqali..."
              className={`w-full px-3 py-2 text-xs border-2 bg-white text-black font-bold focus:outline-none rounded-none ${
                errors.source ? 'border-rose-600 bg-rose-50' : 'border-amber-400 focus:border-amber-600'
              }`}
            />
            {errors.source && (
              <p className="mt-1 text-[11px] font-bold text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.source}
              </p>
            )}
          </div>

          {/* 9. Izoh (Ixtiyoriy) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-black uppercase tracking-wider text-black block">
                9. Izoh <span className="text-stone-600 text-[10px] font-semibold lowercase">(ixtiyoriy, majburiy emas)</span>
              </label>
            </div>
            <textarea
              rows={2}
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              placeholder="Mahsulot holati, sifati, avtomobil modeli (Cobalt, Gentra, Nexia), kafolat va boshqa eslatmalar (ixtiyoriy)..."
              className="w-full px-3 py-2 text-xs border-2 border-amber-400 focus:border-amber-600 bg-white text-black font-bold focus:outline-none rounded-none resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t-2 border-amber-300">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-black bg-stone-200 hover:bg-stone-300 text-black border border-stone-400 transition cursor-pointer rounded-none"
            >
              Bekor qilish
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !isOnline}
              className={`px-5 py-2 text-xs font-black flex items-center gap-2 border-2 transition rounded-none shadow-sm ${
                !isOnline
                  ? 'bg-stone-300 border-stone-400 text-stone-500 cursor-not-allowed'
                  : 'bg-amber-400 hover:bg-amber-500 border-amber-600 text-black cursor-pointer active:scale-95'
              }`}
              title={!isOnline ? 'Oflayn rejimda saqlab bo\'lmaydi' : 'Saqlash'}
            >
              <Save className="w-4 h-4 stroke-[2.5]" />
              <span>{isSubmitting ? 'Saqlanmoqda...' : isEditMode ? 'O\'zgarishlarni saqlash' : 'Saqlash'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
