import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Plus,
  Save,
  AlertCircle,
  Calendar,
  Package,
  Search,
  RotateCcw,
  Check,
  UserCheck,
  Building2,
} from 'lucide-react';
import {
  Supplier,
  SupplierFormData,
  ActivityType,
  PaymentMethod,
  PaymentConditionType,
  QualityStability,
  TransparencyLevel,
  ResponsibilityType,
  DisciplineLevel,
  ExtrasType,
} from '../types';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface AddSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: SupplierFormData, editId?: string) => void | Promise<void>;
  currentCount: number;
  initialSupplier?: Supplier | null;
  availableProducts?: string[];
}

// 5 ta yulduz ma'nolari bo'yicha bog'lanishlar:
export const getQualityFromScore = (score: number): QualityStability => {
  if (score <= 2) return 'yomon';
  if (score === 3) return "o'rtacha";
  return 'yaxshi';
};

export const getScoreFromQuality = (quality: QualityStability): number => {
  if (quality === 'yomon') return 2;
  if (quality === "o'rtacha") return 3;
  return 5;
};

export const getTransparencyFromScore = (score: number): TransparencyLevel => {
  if (score <= 3) return 'shubhali';
  return 'shaffof';
};

export const getScoreFromTransparency = (transparency: TransparencyLevel): number => {
  if (transparency === 'shubhali') return 2;
  return 5;
};

export const getResponsibilityFromScore = (score: number): ResponsibilityType => {
  if (score <= 2) return 'mahsulot sifatiga javob bermaydi';
  if (score === 3) return "mahsulot sifatiga ba'zida javob beradi";
  return 'mahsulot sifatiga javob beradi';
};

export const getScoreFromResponsibility = (resp: ResponsibilityType): number => {
  if (resp === 'mahsulot sifatiga javob bermaydi') return 2;
  if (resp === "mahsulot sifatiga ba'zida javob beradi") return 3;
  return 5;
};

export const getDisciplineFromScore = (score: number): DisciplineLevel => {
  if (score <= 2) return 'kechikadi';
  if (score === 3) return "o'rtacha";
  return 'vaqtida';
};

export const getScoreFromDiscipline = (disc: DisciplineLevel): number => {
  if (disc === 'kechikadi') return 2;
  if (disc === "o'rtacha") return 3;
  return 5;
};

const DEFAULT_FORM_STATE: SupplierFormData = {
  activityType: 'jismoniy', // 3: default jismoniy
  activityTypes: ['jismoniy'],
  name: '', // 4: majburiy
  address: '', // 5: majburiy
  phone: '', // 6: majburiy
  paymentMethod: 'naqd', // 7: default naqd
  paymentMethods: ['naqd'],
  paymentCondition: 'naqd joyida', // 8: default naqd joyida
  paymentConditions: ['naqd joyida'],
  delayDays: '30', // agar kechiktirib to'lash bo'lsa kun
  qualityStability: 'yaxshi', // 9: default yaxshi
  qualityScore: 5, // 1-2 yomon, 3 o'rtacha, 4-5 yaxshi
  transparencyLevel: 'shaffof', // 10: default shaffof
  transparencyScore: 5, // 1-3 shubhali, 4-5 shaffof
  responsibility: 'mahsulot sifatiga javob beradi', // 11: default
  responsibilityScore: 5, // 1-2 javob bermaydi, 3 ba'zida, 4-5 javob beradi
  disciplineLevel: 'vaqtida', // 12: default vaqtida
  disciplineScore: 5, // 1-2 kechikadi, 3 o'rtacha, 4-5 vaqtida
  extras: 'yetkazib berish (pulli)', // 13: default yetkazib berish (pulli) — baho bo'lmaydi
  extrasScore: 0, // yetkazib berishda baho bo'lmaydi
  products: [], // 14: ixtiyoriy mahsulotlar ro'yxati
};

export const AddSupplierModal: React.FC<AddSupplierModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentCount,
  initialSupplier,
  availableProducts = [],
}) => {
  const isOnline = useOnlineStatus();
  const isEditMode = Boolean(initialSupplier);

  const [formData, setFormData] = useState<SupplierFormData>(DEFAULT_FORM_STATE);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [customProductCatalog, setCustomProductCatalog] = useState<string[]>([]);
  const [newProductInput, setNewProductInput] = useState('');
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Reset or initialize when modal opens
  useEffect(() => {
    if (isOpen) {
      setProductSearchQuery('');
      if (initialSupplier) {
        const initProds = initialSupplier.products && initialSupplier.products.length > 0 ? [...initialSupplier.products] : [];
        const initPayMethods = initialSupplier.paymentMethods && initialSupplier.paymentMethods.length > 0
          ? initialSupplier.paymentMethods
          : [initialSupplier.paymentMethod || 'naqd'];
        const initPayConditions = initialSupplier.paymentConditions && initialSupplier.paymentConditions.length > 0
          ? initialSupplier.paymentConditions
          : [initialSupplier.paymentCondition || 'naqd joyida'];

        const initActs: ActivityType[] = initialSupplier.activityTypes && initialSupplier.activityTypes.length > 0
          ? (initialSupplier.activityTypes as ActivityType[])
          : typeof initialSupplier.activityType === 'string'
            ? (initialSupplier.activityType.split(',').map((s) => s.trim()).filter(Boolean) as ActivityType[])
            : [initialSupplier.activityType || 'jismoniy'];

        setFormData({
          activityType: initialSupplier.activityType || 'jismoniy',
          activityTypes: initActs.length > 0 ? initActs : ['jismoniy'],
          name: initialSupplier.name,
          address: initialSupplier.address,
          phone: initialSupplier.phone,
          paymentMethod: initialSupplier.paymentMethod,
          paymentMethods: initPayMethods,
          paymentCondition: initialSupplier.paymentCondition,
          paymentConditions: initPayConditions,
          delayDays: initialSupplier.delayDays ? String(initialSupplier.delayDays) : '30',
          qualityStability: initialSupplier.qualityStability,
          qualityScore: initialSupplier.qualityScore || getScoreFromQuality(initialSupplier.qualityStability),
          transparencyLevel: initialSupplier.transparencyLevel,
          transparencyScore: initialSupplier.transparencyScore || getScoreFromTransparency(initialSupplier.transparencyLevel),
          responsibility: initialSupplier.responsibility,
          responsibilityScore: initialSupplier.responsibilityScore || getScoreFromResponsibility(initialSupplier.responsibility),
          disciplineLevel: initialSupplier.disciplineLevel,
          disciplineScore: initialSupplier.disciplineScore || getScoreFromDiscipline(initialSupplier.disciplineLevel),
          extras: initialSupplier.extras,
          extrasScore: 0,
          products: initProds,
        });
        setSelectedProducts(initProds);
      } else {
        setFormData(DEFAULT_FORM_STATE);
        setSelectedProducts([]);
      }
      setNewProductInput('');
      setErrors({});
    }
  }, [isOpen, initialSupplier]);

  // Boshqa yetkazib beruvchilar yetkazib berayotgan mahsulotlar + foydalanuvchi yangi qo'shgan mahsulotlar
  const allCatalogProducts = useMemo(() => {
    const set = new Set<string>();
    if (availableProducts && availableProducts.length > 0) {
      availableProducts.forEach((p) => {
        if (p && p.trim()) set.add(p.trim());
      });
    }
    customProductCatalog.forEach((p) => {
      if (p && p.trim()) set.add(p.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'uz'));
  }, [availableProducts, customProductCatalog]);

  // Qidiruv bo'yicha filtrlangan katalog
  const filteredCatalogProducts = useMemo(() => {
    if (!productSearchQuery.trim()) return allCatalogProducts;
    const query = productSearchQuery.toLowerCase().trim();
    return allCatalogProducts.filter((p) => p.toLowerCase().includes(query));
  }, [allCatalogProducts, productSearchQuery]);

  if (!isOpen) return null;

  // Mahsulotni tick / untick qilish (Boshqa yetkazib beruvchilar mahsulotlaridan tanlash)
  const handleToggleProduct = (productName: string) => {
    const trimmed = productName.trim();
    if (!trimmed) return;
    setSelectedProducts((prev) =>
      prev.includes(trimmed)
        ? prev.filter((p) => p !== trimmed)
        : [...prev, trimmed]
    );
  };

  // Yangi mahsulot qo'shish (matn inputidan kiritilganda darhol tanlanadi va ro'yxatga variant sifatida qo'shiladi)
  const handleAddProductByName = (productName: string) => {
    const trimmed = productName.trim();
    if (!trimmed) return;

    if (!selectedProducts.includes(trimmed)) {
      setSelectedProducts((prev) => [...prev, trimmed]);
    }
    if (!customProductCatalog.includes(trimmed)) {
      setCustomProductCatalog((prev) => [...prev, trimmed]);
    }
    setNewProductInput('');
  };

  // Mahsulotni ro'yxatdan olib tashlash
  const handleRemoveProduct = (productName: string) => {
    setSelectedProducts((prev) => prev.filter((p) => p !== productName));
  };

  // Faoliyat turi ko'p tanlovi (Tick qilib jismoniy, yuridik yoki ikkalasini tanlash)
  const handleToggleActivityType = (type: ActivityType) => {
    setFormData((prev) => {
      const current = (prev.activityTypes && prev.activityTypes.length > 0)
        ? prev.activityTypes
        : [prev.activityType as ActivityType];
      const updated = current.includes(type)
        ? current.filter((t) => t !== type)
        : [...current, type];

      const finalActs = updated.length === 0 ? [type] : updated;
      return {
        ...prev,
        activityTypes: finalActs,
        activityType: finalActs.join(', '),
      };
    });
  };

  // Pul o'tkazmalari ko'p tanlovi (Smooth Toggle - doimiy silliq va birinchi bosishdayoq ishlaydi)
  const handleTogglePaymentMethod = (method: string) => {
    setFormData((prev) => {
      const current = prev.paymentMethods || [];
      const updated = current.includes(method)
        ? current.filter((m) => m !== method)
        : [...current, method];
      return {
        ...prev,
        paymentMethods: updated,
        paymentMethod: updated.length > 0 ? updated.join(', ') : '',
      };
    });
  };

  // To'lov shartlari ko'p tanlovi (Smooth Toggle - doimiy silliq va birinchi bosishdayoq ishlaydi)
  const handleTogglePaymentCondition = (cond: string) => {
    setFormData((prev) => {
      const current = prev.paymentConditions || [];
      const updated = current.includes(cond)
        ? current.filter((c) => c !== cond)
        : [...current, cond];
      return {
        ...prev,
        paymentConditions: updated,
        paymentCondition: updated.length > 0 ? updated.join(', ') : '',
      };
    });
  };

  // 9. Sifat bahosi o'zgarganda matn ham moslashadi
  const handleQualityScoreChange = (score: number) => {
    const correspondingQuality = getQualityFromScore(score);
    setFormData({
      ...formData,
      qualityScore: score,
      qualityStability: correspondingQuality,
    });
  };

  const handleQualityTextChange = (quality: QualityStability) => {
    const correspondingScore = getScoreFromQuality(quality);
    setFormData({
      ...formData,
      qualityStability: quality,
      qualityScore: correspondingScore,
    });
  };

  // 10. Shaffoflik bahosi o'zgarganda matn ham moslashadi
  const handleTransparencyScoreChange = (score: number) => {
    const corresponding = getTransparencyFromScore(score);
    setFormData({
      ...formData,
      transparencyScore: score,
      transparencyLevel: corresponding,
    });
  };

  const handleTransparencyTextChange = (level: TransparencyLevel) => {
    const score = getScoreFromTransparency(level);
    setFormData({
      ...formData,
      transparencyLevel: level,
      transparencyScore: score,
    });
  };

  // 11. Javobgarlik bahosi o'zgarganda matn ham moslashadi
  const handleResponsibilityScoreChange = (score: number) => {
    const corresponding = getResponsibilityFromScore(score);
    setFormData({
      ...formData,
      responsibilityScore: score,
      responsibility: corresponding,
    });
  };

  const handleResponsibilityTextChange = (resp: ResponsibilityType) => {
    const score = getScoreFromResponsibility(resp);
    setFormData({
      ...formData,
      responsibility: resp,
      responsibilityScore: score,
    });
  };

  // 12. Intizom bahosi o'zgarganda matn ham moslashadi
  const handleDisciplineScoreChange = (score: number) => {
    const corresponding = getDisciplineFromScore(score);
    setFormData({
      ...formData,
      disciplineScore: score,
      disciplineLevel: corresponding,
    });
  };

  const handleDisciplineTextChange = (disc: DisciplineLevel) => {
    const score = getScoreFromDiscipline(disc);
    setFormData({
      ...formData,
      disciplineLevel: disc,
      disciplineScore: score,
    });
  };

  const validate = (): boolean => {
    const errs: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      errs.name = 'Yetkazib beruvchi nomi majburiy!';
    }
    if (!formData.address.trim()) {
      errs.address = 'Manzil majburiy!';
    }
    if (!formData.phone.trim()) {
      errs.phone = 'Telefon raqam majburiy!';
    }
    const hasDelayedPayment =
      formData.paymentCondition === 'kechiktirib to\'lash' ||
      (formData.paymentConditions && formData.paymentConditions.includes('kechiktirib to\'lash'));

    if (hasDelayedPayment) {
      const days = parseInt(formData.delayDays, 10);
      if (!formData.delayDays || isNaN(days) || days <= 0) {
        errs.delayDays = 'Kechiktirib to\'lash muddati (kunlar soni) ni kiriting!';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline) {
      alert('Oflayn rejimda yangi yozuv qo\'shish yoki tahrirlash imkoniyati cheklangan!');
      return;
    }
    if (!validate()) return;

    // Filter out empty product items
    const cleanProducts = selectedProducts
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    const acts = (formData.activityTypes && formData.activityTypes.length > 0)
      ? formData.activityTypes
      : [formData.activityType as ActivityType];

    const submissionData: SupplierFormData = {
      ...formData,
      activityTypes: acts,
      activityType: acts.join(', '),
      extrasScore: 0, // yetkazib berishda baho bo'lmaydi
      products: cleanProducts,
    };

    onSave(submissionData, initialSupplier?.id);
    onClose();
  };

  const nextOrderNumber = isEditMode && initialSupplier ? initialSupplier.orderNumber : currentCount + 1;
  const currentTime = isEditMode && initialSupplier
    ? initialSupplier.systemTime
    : new Date().toLocaleString('uz-UZ', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-2xs overflow-y-auto rounded-none">
      <div className="w-full max-w-2xl bg-amber-50 shadow-2xl border-4 border-amber-400 my-8 overflow-hidden text-black rounded-none">
        
        {/* Modal Header */}
        <div className="bg-yellow-200 text-black px-6 py-4 flex items-center justify-between border-b-2 border-amber-400 rounded-none">
          <div>
            <h2 className="text-lg font-black tracking-wide flex items-center gap-2 text-black font-heading">
              <span className="w-2.5 h-2.5 bg-amber-500 rounded-none" />
              {isEditMode ? "Yetkazib beruvchi ma'lumotlarini tahrirlash" : "Yangi yetkazib beruvchi qo'shish"}
            </h2>
            <p className="text-xs text-stone-800 font-semibold mt-0.5">
              {isEditMode ? `№${initialSupplier?.orderNumber} — ${initialSupplier?.name}` : "14 ta ustun bo'yicha ma'lumotlarni to'ldirish"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-black hover:bg-yellow-300 p-1.5 transition cursor-pointer rounded-none"
            aria-label="Yopish"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Automatic System Fields Notice (1-Tartib raqam, 2-Sistema vaqti) */}
          <div className="bg-yellow-100 border-2 border-amber-400 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs text-black rounded-none">
            <div className="flex items-center gap-2">
              <span className="font-black text-sm bg-amber-400 border border-amber-500 text-black w-6 h-6 inline-flex items-center justify-center shadow-2xs rounded-none">
                №
              </span>
              <div>
                <span className="text-stone-700 block text-[10px] uppercase font-bold">1-Tartib raqam:</span>
                <span className="font-black text-black text-sm">#{nextOrderNumber} {isEditMode ? "(mavjud)" : "(avtomatik)"}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-800 stroke-[2.5]" />
              <div>
                <span className="text-stone-700 block text-[10px] uppercase font-bold">2-Sistema vaqti:</span>
                <span className="font-black text-black">{currentTime} {isEditMode ? "(kiritilgan vaqti)" : "(avtomatik)"}</span>
              </div>
            </div>
          </div>

          {/* Section: Majburiy Asosiy Ma'lumotlar (4, 5, 6) */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-black border-b-2 border-amber-400 pb-1 font-heading">
              Asosiy majburiy ma'lumotlar
            </h3>

            {/* 4-Nom */}
            <div className="space-y-1">
              <label htmlFor="supplier-name" className="block text-xs font-black text-black">
                4. Nomi (Kompaniya yoki shaxs) <span className="text-rose-600">*</span>
              </label>
              <input
                id="supplier-name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Masalan: 'Artel MChJ' yoki 'Ali Valiyev'"
                className={`w-full px-3.5 py-2 text-sm border-2 bg-white text-black font-semibold placeholder-stone-400 focus:outline-none focus:ring-2 transition rounded-none ${
                  errors.name
                    ? 'border-rose-500 focus:ring-rose-500'
                    : 'border-amber-400 focus:ring-amber-500 focus:border-amber-500'
                }`}
                autoFocus
              />
              {errors.name && (
                <p className="text-[11px] text-rose-600 font-bold flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* 5-Manzil & 6-Telefon raqam */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="supplier-address" className="block text-xs font-black text-black">
                  5. Manzil <span className="text-rose-600">*</span>
                </label>
                <input
                  id="supplier-address"
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Toshkent sh., Chilonzor tumani"
                  className={`w-full px-3.5 py-2 text-sm border-2 bg-white text-black font-semibold placeholder-stone-400 focus:outline-none focus:ring-2 transition rounded-none ${
                    errors.address
                      ? 'border-rose-500 focus:ring-rose-500'
                      : 'border-amber-400 focus:ring-amber-500 focus:border-amber-500'
                  }`}
                />
                {errors.address && (
                  <p className="text-[11px] text-rose-600 font-bold flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.address}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor="supplier-phone" className="block text-xs font-black text-black">
                  6. Telefon raqami <span className="text-rose-600">*</span>
                </label>
                <input
                  id="supplier-phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+998 90 123 45 67"
                  className={`w-full px-3.5 py-2 text-sm border-2 bg-white text-black font-semibold placeholder-stone-400 focus:outline-none focus:ring-2 transition rounded-none ${
                    errors.phone
                      ? 'border-rose-500 focus:ring-rose-500'
                      : 'border-amber-400 focus:ring-amber-500 focus:border-amber-500'
                  }`}
                />
                {errors.phone && (
                  <p className="text-[11px] text-rose-600 font-bold flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.phone}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section: 14. Taklif qilinadigan mahsulotlar (Input va teglash orqali, checkboxlarsiz) */}
          <div className="space-y-3 bg-yellow-100/80 border-2 border-amber-300 p-4 rounded-none">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-300 pb-2.5">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-800" />
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-black font-heading flex items-center gap-1.5">
                    <span>14. Taklif qilinadigan mahsulotlar</span>
                    <span className="px-1.5 py-0.2 bg-amber-300 border border-amber-500 text-[10px] font-black">
                      {selectedProducts.length} ta kiritildi
                    </span>
                  </h3>
                  <p className="text-[11px] text-stone-700 font-semibold">
                    Mahsulot nomini yozib «Qo'shish»ni bosing yoki quyidagi tavsiyalardan birini bosing (ixtiyoriy)
                  </p>
                </div>
              </div>

              {selectedProducts.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedProducts([])}
                  className="px-2 py-1 bg-yellow-200 hover:bg-rose-200 text-black hover:text-rose-800 border border-amber-400 hover:border-rose-400 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition rounded-none shrink-0"
                  title="Barcha tanlangan mahsulotlarni tozalash"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Barchasini tozalash</span>
                </button>
              )}
            </div>

            {/* Yangi mahsulot kiritish maydoni (ro'yxatga ham variant sifatida qo'shiladi) */}
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-stone-700 block">
                Yangi mahsulot kiritish (ro'yxatga ham qo'shiladi):
              </span>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={newProductInput}
                    onChange={(e) => setNewProductInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddProductByName(newProductInput);
                      }
                    }}
                    placeholder="Yangi mahsulot nomini yozing (masalan: Motor moyi, Filtr, Akkumulyator...)"
                    className="w-full px-3 py-2 text-xs border-2 border-amber-400 bg-white text-black font-bold focus:outline-none focus:border-amber-600 rounded-none placeholder:text-stone-400"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleAddProductByName(newProductInput)}
                  disabled={!newProductInput.trim()}
                  className={`px-4 py-2 text-xs font-black flex items-center gap-1.5 border-2 transition rounded-none ${
                    newProductInput.trim()
                      ? 'bg-amber-400 hover:bg-amber-500 text-black border-amber-600 cursor-pointer active:scale-95 shadow-2xs'
                      : 'bg-stone-200 text-stone-400 border-stone-300 cursor-not-allowed'
                  }`}
                  title="Yangi mahsulotni qo'shish va belgilash"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Qo'shish</span>
                </button>
              </div>
            </div>

            {/* Qo'shilgan mahsulotlar ro'yxati (Tags/Chips) */}
            {selectedProducts.length > 0 && (
              <div className="bg-white p-2.5 border border-amber-300 space-y-1">
                <span className="text-[10px] font-black uppercase text-stone-600 block">
                  Belgilangan mahsulotlar ({selectedProducts.length} ta):
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                  {selectedProducts.map((p) => (
                    <span
                      key={p}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-300 text-black font-bold text-xs border border-amber-500 shadow-2xs rounded-none"
                    >
                      <span>{p}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveProduct(p)}
                        className="text-stone-800 hover:text-rose-700 hover:scale-125 cursor-pointer ml-1 transition"
                        title="Olib tashlash"
                      >
                        <X className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Boshqa yetkazib beruvchilar yetkazib berayotgan mahsulotlar ro'yxati (TICK qilib tanlash) */}
            <div className="space-y-2 pt-1 border-t border-amber-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5">
                <span className="text-[11px] font-black uppercase text-amber-950 flex items-center gap-1">
                  <span>Boshqa yetkazib beruvchilar mahsulotlaridan tanlash (tick qiling):</span>
                  <span className="bg-amber-200 text-black px-1.5 py-0.5 border border-amber-400 text-[10px] font-bold">
                    {allCatalogProducts.length} ta mavjud
                  </span>
                </span>
                {allCatalogProducts.length > 5 && (
                  <div className="relative w-full sm:w-48">
                    <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-stone-500 pointer-events-none" />
                    <input
                      type="text"
                      value={productSearchQuery}
                      onChange={(e) => setProductSearchQuery(e.target.value)}
                      placeholder="Mahsulot qidirish..."
                      className="w-full pl-6 pr-2 py-1 text-[11px] border border-amber-400 bg-white text-black font-semibold rounded-none focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                )}
              </div>

              {allCatalogProducts.length === 0 ? (
                <div className="p-3 bg-amber-100/70 border border-dashed border-amber-300 text-xs text-stone-700 font-medium leading-relaxed">
                  Bazada boshqa yetkazib beruvchilar mahsulotlari hozircha mavjud emas. Yuqoridagi maydonga yangi mahsulot nomini yozib <b>«Qo'shish»</b> tugmasini bosing — u avtomatik ravishda tanlanadi va keyinchalik barcha yetkazib beruvchilar uchun tick qilib tanlanadigan ro'yxatga qo'shiladi!
                </div>
              ) : filteredCatalogProducts.length === 0 ? (
                <div className="p-2.5 bg-yellow-100 border border-amber-300 text-xs text-stone-700 font-semibold text-center">
                  «{productSearchQuery}» bo'yicha mahsulot topilmadi. Yuqoridagi maydonga yozib yangi mahsulot sifatida qo'shishingiz mumkin.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5 max-h-48 overflow-y-auto p-2 bg-white border border-amber-300">
                  {filteredCatalogProducts.map((prod) => {
                    const isChecked = selectedProducts.includes(prod);
                    return (
                      <button
                        type="button"
                        key={prod}
                        onClick={() => handleToggleProduct(prod)}
                        className={`flex items-center gap-2 p-2 border-2 cursor-pointer transition select-none text-left rounded-none active:scale-[0.98] ${
                          isChecked
                            ? 'bg-amber-300 border-amber-600 text-black font-black shadow-2xs'
                            : 'bg-white hover:bg-amber-50 border-amber-200 text-stone-800 font-semibold'
                        }`}
                        title={isChecked ? `${prod} ni yechish (untick)` : `${prod} ni belgilash (tick)`}
                      >
                        <div
                          className={`w-4 h-4 border-2 flex items-center justify-center shrink-0 rounded-none transition-colors ${
                            isChecked
                              ? 'bg-amber-600 border-amber-700 text-white'
                              : 'bg-white border-stone-400'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className="text-xs truncate font-bold">{prod}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Section: Tanlovlar (Faoliyat turi, Pul o'tkazmalari va To'lov shartlari) */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-black border-b-2 border-amber-400 pb-1 font-heading">
              Faoliyat va to'lov shartlari (bir nechta turlarini tanlash mumkin)
            </h3>

            {/* 3-Faoliyat turi (Tick orqali birdaniga ikkalasini ham tanlash imkoni) */}
            <div className="space-y-1.5 p-2.5 bg-yellow-50/70 border-2 border-amber-300">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black text-black">
                  3. Faoliyat turi <span className="text-stone-700 text-[10px] font-semibold">(birdaniga ikkalasini ham tanlash mumkin)</span>
                </label>
                <span className="text-[10px] font-bold text-amber-950 bg-amber-200 px-1.5 py-0.5 border border-amber-400">
                  {((formData.activityTypes && formData.activityTypes.length > 0)
                    ? formData.activityTypes
                    : [formData.activityType]
                  ).join(' + ')}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(['jismoniy', 'yuridik'] as ActivityType[]).map((type) => {
                  const currentActs = (formData.activityTypes && formData.activityTypes.length > 0)
                    ? formData.activityTypes
                    : [formData.activityType as ActivityType];
                  const isChecked = currentActs.includes(type);

                  return (
                    <button
                      type="button"
                      key={type}
                      onClick={() => handleToggleActivityType(type)}
                      className={`flex items-center gap-2 p-2.5 border-2 cursor-pointer transition select-none text-left rounded-none active:scale-[0.98] ${
                        isChecked
                          ? 'bg-amber-300 border-amber-600 text-black font-black shadow-2xs'
                          : 'bg-white hover:bg-yellow-50 border-amber-300 text-stone-700 font-semibold'
                      }`}
                      title={isChecked ? `${type} ni bekor qilish` : `${type} ni tanlash`}
                    >
                      <div
                        className={`w-4 h-4 border-2 flex items-center justify-center shrink-0 rounded-none transition-colors ${
                          isChecked
                            ? 'bg-amber-600 border-amber-700 text-white'
                            : 'bg-white border-stone-400'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <div className="flex items-center gap-1.5 min-w-0">
                        {type === 'jismoniy' ? (
                          <UserCheck className="w-4 h-4 text-stone-800 shrink-0" />
                        ) : (
                          <Building2 className="w-4 h-4 text-stone-800 shrink-0" />
                        )}
                        <span className="text-xs uppercase font-bold tracking-wide truncate">{type}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 7-Pul o'tkazmalari (Bir nechta turlarini tanlash mumkin - SMOOTH TOGGLE) */}
            <div className="space-y-1.5 p-3 bg-yellow-100/70 border-2 border-amber-300">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black text-black">
                  7. Pul o'tkazmalari turlari <span className="text-stone-700 text-[10px] font-semibold">(bir nechtasini belgilashingiz mumkin)</span>
                </label>
                <span className="text-[10px] bg-amber-300 px-1.5 py-0.5 border border-amber-500 font-bold text-black">
                  {formData.paymentMethods?.length || 0} ta tanlangan
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                {(['naqd', 'bank orqali', 'bank kartalari orqali'] as const).map((method) => {
                  const isChecked = formData.paymentMethods?.includes(method);
                  return (
                    <button
                      type="button"
                      key={method}
                      onClick={() => handleTogglePaymentMethod(method)}
                      className={`flex items-center gap-2 p-2.5 border-2 cursor-pointer transition select-none text-left rounded-none active:scale-[0.98] ${
                        isChecked
                          ? 'bg-amber-300 border-amber-600 text-black font-black shadow-2xs'
                          : 'bg-white hover:bg-amber-50 border-amber-300 text-stone-700 font-semibold'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 border-2 flex items-center justify-center shrink-0 rounded-none transition-colors ${
                          isChecked ? 'bg-amber-600 border-amber-700 text-white' : 'bg-white border-stone-400'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className="text-xs uppercase font-bold">{method}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 8-To'lov shartlari (Bir nechta shartlarni tanlash mumkin - SMOOTH TOGGLE) */}
            <div className="space-y-1.5 p-3 bg-yellow-100/70 border-2 border-amber-300">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black text-black">
                  8. To'lov shartlari <span className="text-stone-700 text-[10px] font-semibold">(bir nechtasini belgilashingiz mumkin)</span>
                </label>
                <span className="text-[10px] bg-amber-300 px-1.5 py-0.5 border border-amber-500 font-bold text-black">
                  {formData.paymentConditions?.length || 0} ta tanlangan
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {([
                  'naqd joyida',
                  'kechiktirib to\'lash',
                  'oldindan to\'lov (avans)',
                  'bo\'lib-bo\'lib to\'lash',
                ] as const).map((cond) => {
                  const isChecked = formData.paymentConditions?.includes(cond);
                  return (
                    <button
                      type="button"
                      key={cond}
                      onClick={() => handleTogglePaymentCondition(cond)}
                      className={`flex items-center gap-2 p-2.5 border-2 cursor-pointer transition select-none text-left rounded-none active:scale-[0.98] ${
                        isChecked
                          ? 'bg-amber-300 border-amber-600 text-black font-black shadow-2xs'
                          : 'bg-white hover:bg-amber-50 border-amber-300 text-stone-700 font-semibold'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 border-2 flex items-center justify-center shrink-0 rounded-none transition-colors ${
                          isChecked ? 'bg-amber-600 border-amber-700 text-white' : 'bg-white border-stone-400'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className="text-xs font-bold">{cond}</span>
                    </button>
                  );
                })}
              </div>

              {/* Kechiktirib to'lash bo'lsa kun kiritish */}
              {formData.paymentConditions?.includes('kechiktirib to\'lash') && (
                <div className="mt-2 p-2.5 bg-yellow-200 border-2 border-amber-500 space-y-1">
                  <label htmlFor="supplier-delay-days" className="block text-xs font-black text-amber-950">
                    Kechiktirish muddati (kun) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="supplier-delay-days"
                    type="number"
                    min="1"
                    max="365"
                    value={formData.delayDays}
                    onChange={(e) => setFormData({ ...formData, delayDays: e.target.value })}
                    placeholder="Masalan: 30"
                    className="w-full px-3 py-1.5 text-xs border-2 border-amber-600 bg-white text-black font-bold focus:outline-none focus:ring-2 focus:ring-amber-600 rounded-none"
                  />
                  {errors.delayDays && (
                    <p className="text-[11px] text-rose-600 font-bold flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.delayDays}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Section: Sifatlar, Shaffoflik, Javobgarlik, Intizom va Qo'shimchalar */}
          <div className="space-y-4">
            <div className="border-b-2 border-amber-400 pb-1">
              <h3 className="text-xs font-black uppercase tracking-wider text-black font-heading">
                Sifat, Shaffoflik, Javobgarlik, Intizom va Qo'shimchalar
              </h3>
              <p className="text-[11px] text-stone-700 font-semibold mt-0.5">
                Har bir sifat bo'yicha 1 dan 5 gacha bahoni belgilang (yetkazib berishda baho bo'lmaydi)
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* 9. Sifat barqarorligi (1-2 yomon, 3 o'rtacha, 4-5 yaxshi) */}
              <div className="p-3 bg-yellow-50 border-2 border-amber-300 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black text-black">
                    9. Sifat barqarorligi
                  </label>
                  <span className="text-[10px] font-bold text-amber-900 bg-amber-200 px-1 border border-amber-400">
                    {formData.qualityScore <= 2 ? 'Yomon' : formData.qualityScore === 3 ? "O'rtacha" : 'Yaxshi'}
                  </span>
                </div>
                <select
                  value={formData.qualityStability}
                  onChange={(e) => handleQualityTextChange(e.target.value as QualityStability)}
                  className="w-full px-3 py-1.5 text-xs border-2 border-amber-400 bg-white text-black font-bold focus:outline-none rounded-none"
                >
                  <option value="yaxshi">yaxshi (4-5★)</option>
                  <option value="o'rtacha">o'rtacha (3★)</option>
                  <option value="yomon">yomon (1-2★)</option>
                </select>
                <div className="space-y-1 pt-1 border-t border-amber-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-stone-800">Sifat bahosi:</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((score) => (
                        <button
                          key={score}
                          type="button"
                          onClick={() => handleQualityScoreChange(score)}
                          className={`w-7 h-7 flex items-center justify-center text-xs font-black border cursor-pointer transition ${
                            formData.qualityScore === score
                              ? 'bg-amber-400 border-amber-600 text-black shadow-xs ring-2 ring-amber-500 scale-105'
                              : score <= (formData.qualityScore || 5)
                              ? 'bg-amber-200 border-amber-400 text-amber-950 hover:bg-amber-300'
                              : 'bg-white hover:bg-stone-100 border-stone-300 text-stone-400'
                          }`}
                          title={`Sifat: ${score}★ (${score <= 2 ? 'yomon' : score === 3 ? "o'rtacha" : 'yaxshi'})`}
                        >
                          {score}★
                        </button>
                      ))}
                      <span className="ml-1 px-1.5 py-0.5 bg-amber-300 border border-amber-500 font-black text-[11px] text-black">
                        {formData.qualityScore || 5}/5
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] text-stone-600 font-semibold italic text-right">
                    1-2★: yomon | 3★: o'rtacha | 4-5★: yaxshi
                  </p>
                </div>
              </div>

              {/* 10. Shaffoflik darajasi (1-3 shubhali, 4-5 shaffof) */}
              <div className="p-3 bg-yellow-50 border-2 border-amber-300 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black text-black">
                    10. Shaffoflik darajasi
                  </label>
                  <span className="text-[10px] font-bold text-amber-900 bg-amber-200 px-1 border border-amber-400">
                    {formData.transparencyScore <= 3 ? 'Shubhali' : 'Shaffof'}
                  </span>
                </div>
                <select
                  value={formData.transparencyLevel}
                  onChange={(e) => handleTransparencyTextChange(e.target.value as TransparencyLevel)}
                  className="w-full px-3 py-1.5 text-xs border-2 border-amber-400 bg-white text-black font-bold focus:outline-none rounded-none"
                >
                  <option value="shaffof">shaffof (4-5★)</option>
                  <option value="shubhali">shubhali (1-3★)</option>
                </select>
                <div className="space-y-1 pt-1 border-t border-amber-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-stone-800">Shaffoflik bahosi:</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((score) => (
                        <button
                          key={score}
                          type="button"
                          onClick={() => handleTransparencyScoreChange(score)}
                          className={`w-7 h-7 flex items-center justify-center text-xs font-black border cursor-pointer transition ${
                            formData.transparencyScore === score
                              ? 'bg-amber-400 border-amber-600 text-black shadow-xs ring-2 ring-amber-500 scale-105'
                              : score <= (formData.transparencyScore || 5)
                              ? 'bg-amber-200 border-amber-400 text-amber-950 hover:bg-amber-300'
                              : 'bg-white hover:bg-stone-100 border-stone-300 text-stone-400'
                          }`}
                          title={`Shaffoflik: ${score}★ (${score <= 3 ? 'shubhali' : 'shaffof'})`}
                        >
                          {score}★
                        </button>
                      ))}
                      <span className="ml-1 px-1.5 py-0.5 bg-amber-300 border border-amber-500 font-black text-[11px] text-black">
                        {formData.transparencyScore || 5}/5
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] text-stone-600 font-semibold italic text-right">
                    1-3★: shubhali | 4-5★: shaffof
                  </p>
                </div>
              </div>

              {/* 11. Javobgarlik (1-2 javob bermaydi, 3 ba'zida, 4-5 javob beradi) */}
              <div className="p-3 bg-yellow-50 border-2 border-amber-300 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black text-black">
                    11. Javobgarlik
                  </label>
                  <span className="text-[10px] font-bold text-amber-900 bg-amber-200 px-1 border border-amber-400 truncate max-w-[150px]">
                    {formData.responsibilityScore <= 2 ? 'Javob bermaydi' : formData.responsibilityScore === 3 ? "Ba'zida" : 'Javob beradi'}
                  </span>
                </div>
                <select
                  value={formData.responsibility}
                  onChange={(e) => handleResponsibilityTextChange(e.target.value as ResponsibilityType)}
                  className="w-full px-3 py-1.5 text-xs border-2 border-amber-400 bg-white text-black font-bold focus:outline-none rounded-none"
                >
                  <option value="mahsulot sifatiga javob beradi">mahsulot sifatiga javob beradi (4-5★)</option>
                  <option value="mahsulot sifatiga ba'zida javob beradi">mahsulot sifatiga ba'zida javob beradi (3★)</option>
                  <option value="mahsulot sifatiga javob bermaydi">mahsulot sifatiga javob bermaydi (1-2★)</option>
                </select>
                <div className="space-y-1 pt-1 border-t border-amber-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-stone-800">Javobgarlik bahosi:</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((score) => (
                        <button
                          key={score}
                          type="button"
                          onClick={() => handleResponsibilityScoreChange(score)}
                          className={`w-7 h-7 flex items-center justify-center text-xs font-black border cursor-pointer transition ${
                            formData.responsibilityScore === score
                              ? 'bg-amber-400 border-amber-600 text-black shadow-xs ring-2 ring-amber-500 scale-105'
                              : score <= (formData.responsibilityScore || 5)
                              ? 'bg-amber-200 border-amber-400 text-amber-950 hover:bg-amber-300'
                              : 'bg-white hover:bg-stone-100 border-stone-300 text-stone-400'
                          }`}
                          title={`Javobgarlik: ${score}★`}
                        >
                          {score}★
                        </button>
                      ))}
                      <span className="ml-1 px-1.5 py-0.5 bg-amber-300 border border-amber-500 font-black text-[11px] text-black">
                        {formData.responsibilityScore || 5}/5
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] text-stone-600 font-semibold italic text-right">
                    1-2★: javob bermaydi | 3★: ba'zida javob beradi | 4-5★: javob beradi
                  </p>
                </div>
              </div>

              {/* 12. Intizom darajasi (1-2 kechikadi, 3 o'rtacha, 4-5 vaqtida) */}
              <div className="p-3 bg-yellow-50 border-2 border-amber-300 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black text-black">
                    12. Intizom darajasi
                  </label>
                  <span className="text-[10px] font-bold text-amber-900 bg-amber-200 px-1 border border-amber-400">
                    {formData.disciplineScore <= 2 ? 'Kechikadi' : formData.disciplineScore === 3 ? "O'rtacha" : 'Vaqtida'}
                  </span>
                </div>
                <select
                  value={formData.disciplineLevel}
                  onChange={(e) => handleDisciplineTextChange(e.target.value as DisciplineLevel)}
                  className="w-full px-3 py-1.5 text-xs border-2 border-amber-400 bg-white text-black font-bold focus:outline-none rounded-none"
                >
                  <option value="vaqtida">vaqtida (4-5★)</option>
                  <option value="o'rtacha">o'rtacha (3★)</option>
                  <option value="kechikadi">kechikadi (1-2★)</option>
                </select>
                <div className="space-y-1 pt-1 border-t border-amber-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-stone-800">Intizom bahosi:</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((score) => (
                        <button
                          key={score}
                          type="button"
                          onClick={() => handleDisciplineScoreChange(score)}
                          className={`w-7 h-7 flex items-center justify-center text-xs font-black border cursor-pointer transition ${
                            formData.disciplineScore === score
                              ? 'bg-amber-400 border-amber-600 text-black shadow-xs ring-2 ring-amber-500 scale-105'
                              : score <= (formData.disciplineScore || 5)
                              ? 'bg-amber-200 border-amber-400 text-amber-950 hover:bg-amber-300'
                              : 'bg-white hover:bg-stone-100 border-stone-300 text-stone-400'
                          }`}
                          title={`Intizom: ${score}★`}
                        >
                          {score}★
                        </button>
                      ))}
                      <span className="ml-1 px-1.5 py-0.5 bg-amber-300 border border-amber-500 font-black text-[11px] text-black">
                        {formData.disciplineScore || 5}/5
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] text-stone-600 font-semibold italic text-right">
                    1-2★: kechikadi | 3★: o'rtacha | 4-5★: vaqtida
                  </p>
                </div>
              </div>

              {/* 13. Qo'shimchalar (Yetkazib berish) — BAHOSIZ! Foydalanuvchi talabi: yetkazib berishda baho bo'lmasin */}
              <div className="p-3 bg-yellow-50 border-2 border-amber-300 space-y-2 md:col-span-2">
                <label className="block text-xs font-black text-black">
                  13. Qo'shimchalar (Yetkazib berish turi) <span className="text-stone-600 text-[10px] font-semibold">(Bahosiz)</span>
                </label>
                <select
                  value={formData.extras}
                  onChange={(e) => setFormData({ ...formData, extras: e.target.value as ExtrasType })}
                  className="w-full px-3.5 py-2 text-xs border-2 border-amber-400 bg-white text-black font-bold focus:outline-none rounded-none"
                >
                  <option value="yetkazib berish (bepul)">yetkazib berish (bepul)</option>
                  <option value="yetkazib berish (pulli)">yetkazib berish (pulli)</option>
                </select>
                <p className="text-[11px] text-stone-600 font-medium">
                  Yetkazib berish sharti bo'yicha bepul yoki pulli yetkazib berish tanlanadi.
                </p>
              </div>

            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t-2 border-amber-400 flex items-center justify-end gap-3 rounded-none">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-black border-2 border-amber-400 bg-yellow-100 hover:bg-yellow-200 text-black transition cursor-pointer rounded-none"
            >
              Bekor qilish
            </button>
            <button
              id="submit-supplier-form-btn"
              type="submit"
              disabled={!isOnline}
              className={`px-5 py-2 text-sm font-black border-2 shadow-sm flex items-center gap-2 transition rounded-none ${
                !isOnline
                  ? 'bg-stone-300 border-stone-400 text-stone-500 cursor-not-allowed'
                  : 'bg-amber-400 hover:bg-amber-500 text-black border-amber-500 cursor-pointer active:scale-95'
              }`}
              title={!isOnline ? 'Oflayn rejimda yozuv qo\'shib bo\'lmaydi' : isEditMode ? 'O\'zgarishlarni saqlash' : 'Jadvalga qo\'shish'}
            >
              {isEditMode ? (
                <>
                  <Save className="w-4 h-4 stroke-[3]" />
                  <span>O'zgarishlarni saqlash</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Jadvalga qo'shish</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
