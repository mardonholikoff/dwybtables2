import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Plus,
  FileSpreadsheet,
  Trash2,
  Edit,
  Phone,
  MapPin,
  Clock,
  Building2,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Truck,
  LayoutGrid,
  Table as TableIcon,
  RotateCcw,
  ArrowDownAZ,
  ArrowUpZA,
  ArrowUpDown,
  Filter,
  ChevronDown,
  ChevronUp,
  Package,
  MoveHorizontal,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  CheckSquare,
  Square,
  CheckCheck,
  Search,
  X,
  Check,
} from 'lucide-react';
import { Supplier } from '../types';
import { exportSuppliersToExcel } from '../utils/excelExport';

interface SupplierTableProps {
  suppliers: Supplier[];
  onOpenAddModal: () => void;
  onEditSupplier: (supplier: Supplier) => void;
  onDeleteSupplier: (id: string) => void;
}

type SortField = 'orderNumber' | 'systemTime' | 'name' | 'address' | null;
type SortOrder = 'asc' | 'desc' | null;

export const SupplierTable: React.FC<SupplierTableProps> = ({
  suppliers,
  onOpenAddModal,
  onEditSupplier,
  onDeleteSupplier,
}) => {
  // Desktopda jadval bo'yicha birlamchi ochiladi, mobile/tabletda esa ixcham
  const [viewMode, setViewMode] = useState<'table' | 'compact'>(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      return 'table';
    }
    return 'compact';
  });

  // Jadval zichligi (Ixcham vs Kengaytirilgan - swipe orqali kengayadi)
  const [isExpandedTable, setIsExpandedTable] = useState(false);

  // Qator bo'yicha batafsil ochish (Accordion expand)
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // Ustunlar pastidagi filtrlash holatlari (Variable filters)
  const [filterName, setFilterName] = useState('');
  const [filterAddress, setFilterAddress] = useState('');
  const [filterPhone, setFilterPhone] = useState('');
  const [filterActivity, setFilterActivity] = useState<string>('all');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>('all');
  const [filterPaymentCondition, setFilterPaymentCondition] = useState<string>('all');
  const [filterQuality, setFilterQuality] = useState<string>('all');
  const [filterTransparency, setFilterTransparency] = useState<string>('all');
  const [filterDiscipline, setFilterDiscipline] = useState<string>('all');
  const [filterExtras, setFilterExtras] = useState<string>('all');
  const [filterResponsibility, setFilterResponsibility] = useState<string>('all');

  // Bir nechta sifatlarni tick qilib tanlash (Multi-select checkbox filtrlari)
  const [filterActivityList, setFilterActivityList] = useState<string[]>([]);
  const [filterQualityList, setFilterQualityList] = useState<string[]>([]);
  const [filterTransparencyList, setFilterTransparencyList] = useState<string[]>([]);
  const [filterResponsibilityList, setFilterResponsibilityList] = useState<string[]>([]);
  const [filterDisciplineList, setFilterDisciplineList] = useState<string[]>([]);
  const [filterExtrasList, setFilterExtrasList] = useState<string[]>([]);
  const [filterPaymentMethodsList, setFilterPaymentMethodsList] = useState<string[]>([]);
  const [filterPaymentConditionsList, setFilterPaymentConditionsList] = useState<string[]>([]);
  const [filterScoresList, setFilterScoresList] = useState<number[]>([]);
  const [openColumnFilter, setOpenColumnFilter] = useState<string | null>(null);

  const [filterProducts, setFilterProducts] = useState<string[]>([]);
  const [filterProductSearch, setFilterProductSearch] = useState<string>('');
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const productDropdownRef = useRef<HTMLDivElement>(null);
  const filterPopoverRef = useRef<HTMLDivElement>(null);

  // Tartiblash holatlari
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);

  // Mobil/planshet uchun qo'shimcha filtr panelini ochish/yopish
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [isMobileProductOpen, setIsMobileProductOpen] = useState(false);

  // Dropdown tashqarisiga bosilganda mahsulotlar popoverini yopish
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        productDropdownRef.current &&
        !productDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProductDropdownOpen(false);
      }
      if (
        filterPopoverRef.current &&
        !filterPopoverRef.current.contains(event.target as Node)
      ) {
        setOpenColumnFilter(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Swipe / Drag-to-Scroll ref va holatlari
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Scroll holatini kuzatish
  const updateScrollProgress = () => {
    if (!tableContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = tableContainerRef.current;
    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll > 0) {
      const percentage = Math.min(100, Math.max(0, Math.round((scrollLeft / maxScroll) * 100)));
      setScrollProgress(percentage);
    } else {
      setScrollProgress(0);
    }
  };

  useEffect(() => {
    const el = tableContainerRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollProgress, { passive: true });
    updateScrollProgress();
    return () => {
      el.removeEventListener('scroll', updateScrollProgress);
    };
  }, [viewMode, isExpandedTable]);

  // Desktopda sichqoncha bilan swipe / drag qilish
  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // Input, button, select va link bosilganda drag ishga tushmasin
    if (
      target.closest('button') ||
      target.closest('input') ||
      target.closest('select') ||
      target.closest('a')
    ) {
      return;
    }
    if (!tableContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - tableContainerRef.current.offsetLeft);
    setScrollLeftState(tableContainerRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !tableContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - tableContainerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    tableContainerRef.current.scrollLeft = scrollLeftState - walk;
    // Foydalanuvchi sursa, avtomatik kengaytirilgan ko'rinishga moslashish
    if (Math.abs(walk) > 15 && !isExpandedTable) {
      setIsExpandedTable(true);
    }
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  // Tugmalar orqali jadvalni surish (Swipe buttons)
  const scrollTable = (direction: 'left' | 'right' | 'start' | 'end') => {
    if (!tableContainerRef.current) return;
    const { clientWidth } = tableContainerRef.current;
    const shift = clientWidth * 0.45;

    if (direction === 'start') {
      tableContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    } else if (direction === 'end') {
      tableContainerRef.current.scrollTo({
        left: tableContainerRef.current.scrollWidth,
        behavior: 'smooth',
      });
    } else if (direction === 'left') {
      tableContainerRef.current.scrollBy({ left: -shift, behavior: 'smooth' });
    } else {
      tableContainerRef.current.scrollBy({ left: shift, behavior: 'smooth' });
    }
  };

  // Barcha mavjud mahsulotlar ro'yxati (filtrlash tanlovi uchun)
  const allUniqueProducts = useMemo(() => {
    const set = new Set<string>();
    suppliers.forEach((s) => {
      if (s.products && Array.isArray(s.products)) {
        s.products.forEach((p) => {
          if (p.trim()) set.add(p.trim());
        });
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'uz'));
  }, [suppliers]);

  // Har bir mahsulot bo'yicha yetkazib beruvchilar soni
  const productCounts = useMemo(() => {
    const map: { [key: string]: number } = {};
    suppliers.forEach((s) => {
      s.products?.forEach((p) => {
        const trimmed = p.trim();
        if (trimmed) {
          map[trimmed] = (map[trimmed] || 0) + 1;
        }
      });
    });
    return map;
  }, [suppliers]);

  // Checkbox orqali mahsulot filtrini tanlash / bekor qilish
  const handleToggleProductFilter = (prodName: string) => {
    setFilterProducts((prev) =>
      prev.includes(prodName)
        ? prev.filter((p) => p !== prodName)
        : [...prev, prodName]
    );
  };

  // Barcha mahsulotlarni filtr sifatida belgilash
  const handleSelectAllProducts = () => {
    setFilterProducts([...allUniqueProducts]);
  };

  // Mahsulot filtrlarini tozalash
  const handleClearProductFilters = () => {
    setFilterProducts([]);
  };

  // Faol filtrlar soni
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filterName.trim()) count++;
    if (filterAddress.trim()) count++;
    if (filterPhone.trim()) count++;
    if (filterActivity !== 'all') count++;
    if (filterActivityList.length > 0) count++;
    if (filterPaymentMethod !== 'all') count++;
    if (filterPaymentCondition !== 'all') count++;
    if (filterQuality !== 'all') count++;
    if (filterTransparency !== 'all') count++;
    if (filterDiscipline !== 'all') count++;
    if (filterExtras !== 'all') count++;
    if (filterResponsibility !== 'all') count++;
    if (filterQualityList.length > 0) count++;
    if (filterTransparencyList.length > 0) count++;
    if (filterResponsibilityList.length > 0) count++;
    if (filterDisciplineList.length > 0) count++;
    if (filterExtrasList.length > 0) count++;
    if (filterPaymentMethodsList.length > 0) count++;
    if (filterPaymentConditionsList.length > 0) count++;
    if (filterScoresList.length > 0) count++;
    if (filterProducts.length > 0 || filterProductSearch.trim()) count++;
    if (sortField) count++;
    return count;
  }, [
    filterName,
    filterAddress,
    filterPhone,
    filterActivity,
    filterActivityList,
    filterPaymentMethod,
    filterPaymentCondition,
    filterQuality,
    filterTransparency,
    filterDiscipline,
    filterExtras,
    filterResponsibility,
    filterQualityList,
    filterTransparencyList,
    filterResponsibilityList,
    filterDisciplineList,
    filterExtrasList,
    filterPaymentMethodsList,
    filterPaymentConditionsList,
    filterScoresList,
    filterProducts,
    filterProductSearch,
    sortField,
  ]);

  // Barcha filtrlarni tozalash (Reset)
  const resetAllFilters = () => {
    setFilterName('');
    setFilterAddress('');
    setFilterPhone('');
    setFilterActivity('all');
    setFilterActivityList([]);
    setFilterPaymentMethod('all');
    setFilterPaymentCondition('all');
    setFilterQuality('all');
    setFilterTransparency('all');
    setFilterDiscipline('all');
    setFilterExtras('all');
    setFilterResponsibility('all');
    setFilterQualityList([]);
    setFilterTransparencyList([]);
    setFilterResponsibilityList([]);
    setFilterDisciplineList([]);
    setFilterExtrasList([]);
    setFilterPaymentMethodsList([]);
    setFilterPaymentConditionsList([]);
    setFilterScoresList([]);
    setFilterProducts([]);
    setFilterProductSearch('');
    setSortField(null);
    setSortOrder(null);
  };

  // Alfavit / Tartib o'zgartirish helperi
  const toggleSort = (field: SortField) => {
    if (sortField !== field) {
      setSortField(field);
      setSortOrder('asc');
    } else if (sortOrder === 'asc') {
      setSortOrder('desc');
    } else {
      setSortField(null);
      setSortOrder(null);
    }
  };

  // Filtrlash va saralash mantiqi
  const filteredAndSortedSuppliers = useMemo(() => {
    let result = suppliers.filter((item) => {
      // 4. Nom
      if (filterName.trim() && !item.name.toLowerCase().includes(filterName.toLowerCase().trim())) {
        return false;
      }
      // 5. Manzil
      if (filterAddress.trim() && !item.address.toLowerCase().includes(filterAddress.toLowerCase().trim())) {
        return false;
      }
      // 6. Telefon
      if (filterPhone.trim() && !item.phone.toLowerCase().includes(filterPhone.toLowerCase().trim())) {
        return false;
      }
      // 3. Faoliyat turi (select filtri)
      if (filterActivity !== 'all') {
        const itemActs = item.activityTypes && item.activityTypes.length > 0
          ? item.activityTypes
          : typeof item.activityType === 'string'
            ? item.activityType.split(',').map((s) => s.trim()).filter(Boolean)
            : [item.activityType];
        if (!itemActs.includes(filterActivity as any)) return false;
      }
      // 3. Faoliyat turi (bir nechta tick orqali)
      if (filterActivityList.length > 0) {
        const itemActs = item.activityTypes && item.activityTypes.length > 0
          ? item.activityTypes
          : typeof item.activityType === 'string'
            ? item.activityType.split(',').map((s) => s.trim()).filter(Boolean)
            : [item.activityType];
        const hasMatch = filterActivityList.some((act) => itemActs.includes(act as any));
        if (!hasMatch) return false;
      }
      // 7. Pul o'tkazmalari (select filtri)
      if (filterPaymentMethod !== 'all') {
        const methods = item.paymentMethods && item.paymentMethods.length > 0 ? item.paymentMethods : [item.paymentMethod];
        if (!methods.includes(filterPaymentMethod)) return false;
      }
      // 7. Pul o'tkazmalari (bir nechta tick orqali ko'p tanlovli filtr)
      if (filterPaymentMethodsList.length > 0) {
        const methods = item.paymentMethods && item.paymentMethods.length > 0 ? item.paymentMethods : [item.paymentMethod];
        if (!methods.some((m) => filterPaymentMethodsList.includes(m))) return false;
      }
      // 8. To'lov sharti (select filtri)
      if (filterPaymentCondition !== 'all') {
        const conditions = item.paymentConditions && item.paymentConditions.length > 0 ? item.paymentConditions : [item.paymentCondition];
        if (!conditions.some((c) => c.includes(filterPaymentCondition) || filterPaymentCondition.includes(c))) return false;
      }
      // 8. To'lov shartlari (bir nechta tick orqali ko'p tanlovli filtr)
      if (filterPaymentConditionsList.length > 0) {
        const conditions = item.paymentConditions && item.paymentConditions.length > 0 ? item.paymentConditions : [item.paymentCondition];
        if (!conditions.some((c) => filterPaymentConditionsList.some((fc) => c.includes(fc) || fc.includes(c)))) return false;
      }
      // 9. Sifat barqarorligi (select filtri)
      if (filterQuality !== 'all' && item.qualityStability !== filterQuality) {
        return false;
      }
      // 9. Sifat barqarorligi (bir nechta tick orqali)
      if (filterQualityList.length > 0 && !filterQualityList.includes(item.qualityStability)) {
        return false;
      }
      // 10. Shaffoflik darajasi (select filtri)
      if (filterTransparency !== 'all' && item.transparencyLevel !== filterTransparency) {
        return false;
      }
      // 10. Shaffoflik darajasi (bir nechta tick orqali)
      if (filterTransparencyList.length > 0 && !filterTransparencyList.includes(item.transparencyLevel)) {
        return false;
      }
      // 12. Intizom darajasi (select filtri)
      if (filterDiscipline !== 'all' && item.disciplineLevel !== filterDiscipline) {
        return false;
      }
      // 12. Intizom darajasi (bir nechta tick orqali)
      if (filterDisciplineList.length > 0 && !filterDisciplineList.includes(item.disciplineLevel)) {
        return false;
      }
      // 13. Qo'shimchalar (select filtri)
      if (filterExtras !== 'all' && !item.extras.includes(filterExtras)) {
        return false;
      }
      // 13. Qo'shimchalar (bir nechta tick orqali)
      if (filterExtrasList.length > 0 && !filterExtrasList.some((ex) => item.extras.includes(ex))) {
        return false;
      }
      // 11. Javobgarlik (select filtri)
      if (filterResponsibility !== 'all') {
        if (filterResponsibility === 'javob beradi' && item.responsibility !== 'mahsulot sifatiga javob beradi') {
          return false;
        }
        if (filterResponsibility === "ba'zida" && item.responsibility !== "mahsulot sifatiga ba'zida javob beradi") {
          return false;
        }
        if (filterResponsibility === 'javob bermaydi' && item.responsibility !== 'mahsulot sifatiga javob bermaydi') {
          return false;
        }
      }
      // 11. Javobgarlik (bir nechta tick orqali)
      if (filterResponsibilityList.length > 0 && !filterResponsibilityList.includes(item.responsibility)) {
        return false;
      }

      // Baholar bo'yicha tick filtri (agar 1-5 ballik baholar tick qilingan bo'lsa - yetkazib berish bahosiz)
      if (filterScoresList.length > 0) {
        const itemScores = [
          item.qualityScore || 4,
          item.transparencyScore || 4,
          item.responsibilityScore || 4,
          item.disciplineScore || 4,
        ];
        if (!itemScores.some((sc) => filterScoresList.includes(sc))) {
          return false;
        }
      }

      // 14. Taklif qilinadigan mahsulotlar filtri (Checkbox orqali 1 tadan ko'pini tanlash mumkin)
      if (filterProducts.length > 0) {
        if (
          !item.products ||
          !item.products.some((p) =>
            filterProducts.some((fp) => fp.toLowerCase() === p.toLowerCase())
          )
        ) {
          return false;
        }
      }
      if (filterProductSearch.trim()) {
        const q = filterProductSearch.toLowerCase().trim();
        if (!item.products || !item.products.some((p) => p.toLowerCase().includes(q))) {
          return false;
        }
      }

      return true;
    });

    // Saralash
    if (sortField && sortOrder) {
      result = [...result].sort((a, b) => {
        if (sortField === 'name') {
          const res = a.name.localeCompare(b.name, 'uz');
          return sortOrder === 'asc' ? res : -res;
        }
        if (sortField === 'address') {
          const res = a.address.localeCompare(b.address, 'uz');
          return sortOrder === 'asc' ? res : -res;
        }
        if (sortField === 'orderNumber') {
          return sortOrder === 'asc' ? a.orderNumber - b.orderNumber : b.orderNumber - a.orderNumber;
        }
        if (sortField === 'systemTime') {
          const res = a.systemTime.localeCompare(b.systemTime);
          return sortOrder === 'asc' ? res : -res;
        }
        return 0;
      });
    }

    return result;
  }, [
    suppliers,
    filterName,
    filterAddress,
    filterPhone,
    filterActivity,
    filterActivityList,
    filterPaymentMethod,
    filterPaymentCondition,
    filterQuality,
    filterTransparency,
    filterDiscipline,
    filterExtras,
    filterResponsibility,
    filterQualityList,
    filterTransparencyList,
    filterResponsibilityList,
    filterDisciplineList,
    filterExtrasList,
    filterPaymentMethodsList,
    filterPaymentConditionsList,
    filterScoresList,
    filterProducts,
    filterProductSearch,
    sortField,
    sortOrder,
  ]);

  const handleExport = () => {
    if (filteredAndSortedSuppliers.length === 0) {
      alert("Eksport qilish uchun mos ma'lumot topilmadi!");
      return;
    }
    exportSuppliersToExcel(filteredAndSortedSuppliers);
  };

  // Bir nechta sifat va to'lov shartlarini tick qilib tanlash popoveri
  const renderMultiFilterDropdown = (
    id: string,
    label: string,
    selectedList: string[],
    options: { value: string; label: string }[],
    onToggle: (val: string) => void,
    onSelectAll: () => void,
    onClear: () => void
  ) => {
    const isOpen = openColumnFilter === id;
    const isFiltered = selectedList.length > 0;

    return (
      <div className="relative" ref={isOpen ? filterPopoverRef : undefined}>
        <button
          type="button"
          onClick={() => setOpenColumnFilter(isOpen ? null : id)}
          className={`w-full px-1 py-0.5 text-[9px] font-black border flex items-center justify-between gap-0.5 transition cursor-pointer rounded-none text-left h-[24px] ${
            isFiltered
              ? 'bg-amber-400 border-amber-600 text-black shadow-xs ring-1 ring-amber-500'
              : 'bg-white hover:bg-yellow-100 border-amber-300 text-black'
          }`}
          title={`${label} filtri (Checkbox orqali tanlash)`}
        >
          <span className="truncate">
            {selectedList.length === 0 ? 'Barchasi' : `${selectedList.length} ta ✓`}
          </span>
          <ChevronDown
            className={`w-2.5 h-2.5 shrink-0 transition-transform ${
              isOpen ? 'rotate-180 text-black' : 'text-stone-700'
            }`}
          />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 z-50 mt-1 w-52 bg-amber-50 border-2 border-amber-500 shadow-2xl p-2 text-black rounded-none animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between border-b border-amber-300 pb-1 mb-1.5">
              <span className="text-[10px] font-black uppercase text-black font-heading">
                {label} (Tick)
              </span>
              <button
                type="button"
                onClick={() => setOpenColumnFilter(null)}
                className="text-stone-600 hover:text-black p-0.5 cursor-pointer"
                title="Yopish"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            {/* Barchasi va Tozalash */}
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <button
                type="button"
                onClick={onSelectAll}
                className="px-1.5 py-0.5 bg-yellow-200 hover:bg-yellow-300 text-black border border-amber-400 text-[9px] font-black cursor-pointer rounded-none"
              >
                Barchasi
              </button>
              <button
                type="button"
                onClick={onClear}
                className="px-1.5 py-0.5 bg-yellow-200 hover:bg-rose-200 text-black hover:text-rose-800 border border-amber-400 text-[9px] font-black cursor-pointer rounded-none"
              >
                Tozalash
              </button>
            </div>

            {/* Checkbox ro'yxati */}
            <div className="max-h-40 overflow-y-auto space-y-1 p-1 bg-white border border-amber-300">
              {options.map((opt) => {
                const isChecked = selectedList.includes(opt.value);
                return (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => onToggle(opt.value)}
                    className={`w-full flex items-center gap-1.5 px-1.5 py-1 text-[9px] font-bold border transition select-none cursor-pointer text-left rounded-none active:scale-[0.98] ${
                      isChecked
                        ? 'bg-amber-300 border-amber-500 text-black'
                        : 'hover:bg-yellow-50 border-transparent text-stone-800'
                    }`}
                  >
                    <div
                      className={`w-3.5 h-3.5 border flex items-center justify-center shrink-0 rounded-none transition-colors ${
                        isChecked ? 'bg-amber-600 border-amber-700 text-white' : 'bg-white border-stone-400'
                      }`}
                    >
                      {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                    <span className="truncate flex-1">{opt.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Pastki qism */}
            <div className="flex items-center justify-between pt-1.5 mt-1.5 border-t border-amber-300 text-[9px]">
              <span className="font-bold text-stone-700">
                {selectedList.length > 0 ? `${selectedList.length} ta tanlandi` : 'Hammasi'}
              </span>
              <button
                type="button"
                onClick={() => setOpenColumnFilter(null)}
                className="px-2 py-0.5 bg-amber-400 hover:bg-amber-500 text-black font-black border border-amber-600 cursor-pointer rounded-none shadow-xs"
              >
                Tayyor
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // 5 ta yulduz ma'nolari (Foydalanuvchi talabi asosida)
  // Sifat barqarorligi: 1-2 yomon, 3 o'rtacha, 4-5 yaxshi
  const getQualityScoreInfo = (score: number) => {
    if (score <= 2) {
      return { text: 'yomon', color: 'bg-rose-100 text-rose-950 border-rose-500', explanation: "1-2★: yomon" };
    }
    if (score === 3) {
      return { text: "o'rtacha", color: 'bg-yellow-200 text-amber-950 border-amber-500', explanation: "3★: o'rtacha" };
    }
    return { text: 'yaxshi', color: 'bg-emerald-100 text-emerald-950 border-emerald-600', explanation: "4-5★: yaxshi" };
  };

  // Shaffoflik darajasi: 1-3 shubhali, 4-5 shaffof
  const getTransparencyScoreInfo = (score: number) => {
    if (score <= 3) {
      return { text: 'shubhali', color: 'bg-rose-100 text-rose-950 border-rose-500', explanation: "1-3★: shubhali" };
    }
    return { text: 'shaffof', color: 'bg-blue-100 text-blue-950 border-blue-600', explanation: "4-5★: shaffof" };
  };

  // Javobgarlik: 1-2 javob bermaydi, 3 ba'zida javob beradi, 4-5 javob beradi
  const getResponsibilityScoreInfo = (score: number) => {
    if (score <= 2) {
      return { text: 'javob bermaydi', color: 'bg-rose-100 text-rose-950 border-rose-500', explanation: "1-2★: javob bermaydi" };
    }
    if (score === 3) {
      return { text: "ba'zida", color: 'bg-yellow-200 text-amber-950 border-amber-500', explanation: "3★: ba'zida javob beradi" };
    }
    return { text: 'javob beradi', color: 'bg-emerald-100 text-emerald-950 border-emerald-600', explanation: "4-5★: javob beradi" };
  };

  // Intizom darajasi: 1-2 kechikadi, 3 o'rtacha, 4-5 vaqtida
  const getDisciplineScoreInfo = (score: number) => {
    if (score <= 2) {
      return { text: 'kechikadi', color: 'bg-rose-100 text-rose-950 border-rose-500', explanation: "1-2★: kechikadi" };
    }
    if (score === 3) {
      return { text: "o'rtacha", color: 'bg-yellow-200 text-amber-950 border-amber-500', explanation: "3★: o'rtacha" };
    }
    return { text: 'vaqtida', color: 'bg-emerald-100 text-emerald-950 border-emerald-600', explanation: "4-5★: vaqtida" };
  };

  // Badge yordamchilari
  const renderQualityBadge = (quality: string) => {
    switch (quality) {
      case 'yaxshi':
        return (
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-black bg-emerald-100 text-black border border-emerald-600 rounded-none whitespace-nowrap">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-700 stroke-[2.5]" /> yaxshi
          </span>
        );
      case 'yomon':
        return (
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-black bg-rose-100 text-black border border-rose-600 rounded-none whitespace-nowrap">
            <XCircle className="w-2.5 h-2.5 text-rose-700 stroke-[2.5]" /> yomon
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-black bg-yellow-200 text-black border border-amber-500 rounded-none whitespace-nowrap">
            <AlertTriangle className="w-2.5 h-2.5 text-amber-800 stroke-[2.5]" /> o'rtacha
          </span>
        );
    }
  };

  const renderTransparencyBadge = (transparency: string) => {
    if (transparency === 'shaffof') {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-black bg-blue-100 text-black border border-blue-500 rounded-none whitespace-nowrap">
          shaffof
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-black bg-rose-100 text-black border border-rose-500 rounded-none whitespace-nowrap">
        shubhali
      </span>
    );
  };

  const renderDisciplineBadge = (discipline: string) => {
    switch (discipline) {
      case 'vaqtida':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-black bg-emerald-100 text-black border border-emerald-500 rounded-none whitespace-nowrap">
            vaqtida
          </span>
        );
      case 'kechikadi':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-black bg-rose-100 text-black border border-rose-500 rounded-none whitespace-nowrap">
            kechikadi
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-black bg-yellow-200 text-black border border-amber-500 rounded-none whitespace-nowrap">
            o'rtacha
          </span>
        );
    }
  };

  return (
    <section className="space-y-3 text-black">
      {/* Top action header: "Yetkazib beruvchilar ro'yxati" va uning oldida kiritish tugmasi */}
      <div className="bg-yellow-100/95 p-3 sm:p-4 border-2 border-amber-400 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3 rounded-none">
        
        {/* Title & Add Button side-by-side as requested */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <button
            id="add-supplier-top-btn"
            onClick={onOpenAddModal}
            className="flex items-center gap-2 px-3.5 py-2 bg-amber-400 hover:bg-amber-500 text-black font-black text-xs sm:text-sm border-2 border-amber-500 shadow-sm active:scale-95 transition cursor-pointer rounded-none"
            title="Yangi yetkazib beruvchi qo'shish"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Yozuv kiritish</span>
          </button>

          <div className="flex items-center gap-2">
            <h1
              id="suppliers-section-title"
              className="text-base sm:text-lg font-black text-black tracking-tight font-heading"
            >
              Yetkazib beruvchilar ro'yxati
            </h1>
            <span
              id="suppliers-total-count"
              className="text-xs font-black px-2 py-0.5 bg-yellow-200 text-black border border-amber-400 rounded-none"
            >
              {filteredAndSortedSuppliers.length} / {suppliers.length} ta
            </span>
          </div>

          {/* Faol filtrlar holati ko'rsatkichi */}
          {activeFiltersCount > 0 && (
            <button
              onClick={resetAllFilters}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-black bg-amber-200 hover:bg-amber-300 text-black border border-amber-500 shadow-2xs transition cursor-pointer rounded-none"
              title="Filtrlarni tozalash"
            >
              <RotateCcw className="w-3 h-3 stroke-[2.5]" />
              <span>Filtrlar faol ({activeFiltersCount}) — Tozalash</span>
            </button>
          )}
        </div>

        {/* Right side tools: Mobile filter button, View Mode Switch, Excel Export */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          
          {/* Mobile filter toggle button */}
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className={`lg:hidden flex items-center gap-1 px-2.5 py-1.5 text-xs font-black border-2 transition cursor-pointer rounded-none ${
              activeFiltersCount > 0 || showMobileFilters
                ? 'bg-amber-400 border-amber-500 text-black'
                : 'bg-yellow-200 border-amber-400 text-black'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filtrlar {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ''}</span>
          </button>

          {/* View Mode Toggle: Table vs Compact */}
          <div className="inline-flex border-2 border-amber-400 bg-yellow-200 p-0.5 rounded-none shadow-xs">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-black transition cursor-pointer rounded-none ${
                viewMode === 'table'
                  ? 'bg-amber-400 text-black border border-amber-600 shadow-xs'
                  : 'text-stone-700 hover:text-black hover:bg-yellow-300'
              }`}
              title="Jadval ko'rinishi (Swipe orqali kengayadi)"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Jadval</span>
            </button>

            <button
              onClick={() => setViewMode('compact')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-black transition cursor-pointer rounded-none ${
                viewMode === 'compact'
                  ? 'bg-amber-400 text-black border border-amber-600 shadow-xs'
                  : 'text-stone-700 hover:text-black hover:bg-yellow-300'
              }`}
              title="Ixcham kartochkalar"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Ixcham</span>
            </button>
          </div>

          {/* Excel Export Button */}
          <button
            id="export-excel-btn"
            onClick={handleExport}
            disabled={filteredAndSortedSuppliers.length === 0}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black border-2 transition rounded-none shadow-xs ${
              filteredAndSortedSuppliers.length === 0
                ? 'bg-stone-200 text-stone-400 border-stone-300 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700 active:scale-95 cursor-pointer'
            }`}
            title="Excel formatida yuklab olish"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel</span>
          </button>
        </div>
      </div>

      {/* MOBIL & TABLET UCHUN QO'SHIMChA FILTRLAR PANELI */}
      {showMobileFilters && (
        <div className="lg:hidden bg-yellow-200/90 border-2 border-amber-400 p-3 text-xs space-y-3 rounded-none shadow-sm">
          <div className="flex items-center justify-between border-b border-amber-400 pb-2">
            <span className="font-black text-black flex items-center gap-1 text-xs font-heading">
              <Filter className="w-3.5 h-3.5" /> Filtrlash & Saralash
            </span>
            <button
              onClick={resetAllFilters}
              className="text-[11px] font-black text-stone-700 hover:text-black underline cursor-pointer"
            >
              Barchasini tozalash
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* 14. Taklif qilinadigan mahsulot bo'yicha (IXCHAM VA OCHILADIGAN) */}
            <div className="sm:col-span-2 bg-yellow-100 p-2.5 border border-amber-400">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <label className="text-[10px] font-black uppercase text-stone-800">
                    14. Mahsulotlar filtri:
                  </label>
                  <span className="px-1.5 py-0.5 bg-amber-300 border border-amber-500 text-[10px] font-black">
                    {filterProducts.length > 0 ? `${filterProducts.length} ta tanlandi` : 'Barchasi'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {filterProducts.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearProductFilters}
                      className="px-2 py-0.5 bg-rose-100 hover:bg-rose-200 text-rose-900 border border-rose-400 text-[10px] font-black cursor-pointer"
                    >
                      Tozalash
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsMobileProductOpen((prev) => !prev)}
                    className="px-2.5 py-0.5 bg-amber-300 hover:bg-amber-400 text-black border border-amber-500 text-[10px] font-black cursor-pointer flex items-center gap-1"
                  >
                    <span>{isMobileProductOpen ? 'Yopish' : 'Tanlash'}</span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${isMobileProductOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>

              {isMobileProductOpen && (
                <div className="mt-2 pt-2 border-t border-amber-300 space-y-1.5">
                  <input
                    type="text"
                    value={filterProductSearch}
                    onChange={(e) => setFilterProductSearch(e.target.value)}
                    placeholder="Mahsulot nomi bo'yicha qidiruv..."
                    className="w-full px-2 py-1 border border-amber-400 bg-white text-xs font-bold rounded-none"
                  />
                  <div className="flex items-center justify-between text-[10px]">
                    <button
                      type="button"
                      onClick={handleSelectAllProducts}
                      className="underline font-bold text-amber-900 cursor-pointer"
                    >
                      Barchasini belgilash
                    </button>
                    <button
                      type="button"
                      onClick={handleClearProductFilters}
                      className="underline font-bold text-stone-600 cursor-pointer"
                    >
                      Tozalash
                    </button>
                  </div>
                  {allUniqueProducts.length === 0 ? (
                    <p className="text-[11px] text-stone-600 italic py-1">Bazada mahsulotlar yo'q</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 max-h-36 overflow-y-auto p-1 bg-white border border-amber-300">
                      {allUniqueProducts.map((prod) => {
                        const isChecked = filterProducts.includes(prod);
                        const count = productCounts[prod] || 0;
                        return (
                          <label
                            key={prod}
                            className={`flex items-center gap-1.5 p-1 border transition select-none cursor-pointer rounded-none text-xs font-bold ${
                              isChecked
                                ? 'bg-amber-300 border-amber-600 text-black'
                                : 'bg-yellow-50 hover:bg-amber-100 border-amber-200 text-stone-800'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleProductFilter(prod)}
                              className="w-3.5 h-3.5 accent-amber-600 border-amber-400 rounded-none cursor-pointer"
                            />
                            <span className="truncate text-[10px] flex-1">{prod}</span>
                            <span className="text-[9px] text-stone-600 font-semibold shrink-0">({count})</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Nom & Alfavit */}
            <div>
              <label className="text-[10px] font-black uppercase text-stone-700 block mb-1">
                4. Nom (Alfavit bo'yicha)
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  placeholder="Nom bo'yicha..."
                  className="flex-1 px-2.5 py-1.5 border border-amber-400 bg-white text-xs font-bold rounded-none"
                />
                <button
                  onClick={() => toggleSort('name')}
                  className={`px-2 py-1 border text-xs font-black flex items-center gap-1 rounded-none ${
                    sortField === 'name' ? 'bg-amber-400 border-amber-600' : 'bg-yellow-200 border-amber-400'
                  }`}
                  title="Alfavit tartibi"
                >
                  {sortField === 'name' && sortOrder === 'desc' ? <ArrowUpZA className="w-3.5 h-3.5" /> : <ArrowDownAZ className="w-3.5 h-3.5" />}
                  <span>{sortField === 'name' ? (sortOrder === 'asc' ? 'A→Z' : 'Z→A') : 'A-Z'}</span>
                </button>
              </div>
            </div>

            {/* Manzil & Alfavit */}
            <div>
              <label className="text-[10px] font-black uppercase text-stone-700 block mb-1">
                5. Manzil (Alfavit bo'yicha)
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={filterAddress}
                  onChange={(e) => setFilterAddress(e.target.value)}
                  placeholder="Manzil bo'yicha..."
                  className="flex-1 px-2.5 py-1.5 border border-amber-400 bg-white text-xs font-bold rounded-none"
                />
                <button
                  onClick={() => toggleSort('address')}
                  className={`px-2 py-1 border text-xs font-black flex items-center gap-1 rounded-none ${
                    sortField === 'address' ? 'bg-amber-400 border-amber-600' : 'bg-yellow-200 border-amber-400'
                  }`}
                  title="Manzil alfavit tartibi"
                >
                  {sortField === 'address' && sortOrder === 'desc' ? <ArrowUpZA className="w-3.5 h-3.5" /> : <ArrowDownAZ className="w-3.5 h-3.5" />}
                  <span>{sortField === 'address' ? (sortOrder === 'asc' ? 'A→Z' : 'Z→A') : 'A-Z'}</span>
                </button>
              </div>
            </div>

            {/* 6. Telefon */}
            <div>
              <label className="text-[10px] font-black uppercase text-stone-700 block mb-1">
                6. Telefon
              </label>
              <input
                type="text"
                value={filterPhone}
                onChange={(e) => setFilterPhone(e.target.value)}
                placeholder="Telefon bo'yicha..."
                className="w-full px-2.5 py-1.5 border border-amber-400 bg-white text-xs font-bold rounded-none"
              />
            </div>

            {/* 3. Faoliyat turi (Tick orqali tanlash) */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-black uppercase text-stone-700">
                  3. Faoliyat turi (Tick)
                </label>
                {filterActivityList.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setFilterActivityList([])}
                    className="text-[9px] underline font-bold text-stone-600 cursor-pointer"
                  >
                    Tozalash
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 p-1 bg-white border border-amber-300">
                {[
                  { value: 'jismoniy', label: 'jismoniy shaxs' },
                  { value: 'yuridik', label: 'yuridik shaxs' },
                ].map((act) => {
                  const isChecked = filterActivityList.includes(act.value);
                  return (
                    <label
                      key={act.value}
                      className={`flex items-center gap-1.5 px-2 py-1 border text-xs font-bold transition select-none cursor-pointer rounded-none ${
                        isChecked
                          ? 'bg-amber-300 border-amber-600 text-black'
                          : 'bg-yellow-50 hover:bg-amber-100 border-amber-200 text-stone-800'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() =>
                          setFilterActivityList((prev) =>
                            prev.includes(act.value)
                              ? prev.filter((x) => x !== act.value)
                              : [...prev, act.value]
                          )
                        }
                        className="w-3.5 h-3.5 accent-amber-600 border-amber-400 rounded-none cursor-pointer"
                      />
                      <span>{act.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* 7. Pul o'tkazmalari (Tick orqali bir nechtasini tanlash) */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-black uppercase text-stone-700">
                  7. Pul o'tkazmalari (Tick)
                </label>
                {filterPaymentMethodsList.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setFilterPaymentMethodsList([])}
                    className="text-[9px] underline font-bold text-stone-600 cursor-pointer"
                  >
                    Tozalash
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 p-1 bg-white border border-amber-300">
                {[
                  { value: 'naqd', label: 'naqd' },
                  { value: 'bank orqali', label: 'bank orqali' },
                  { value: 'bank kartalari orqali', label: 'bank kartalari' },
                ].map((pm) => {
                  const isChecked = filterPaymentMethodsList.includes(pm.value);
                  return (
                    <button
                      type="button"
                      key={pm.value}
                      onClick={() =>
                        setFilterPaymentMethodsList((prev) =>
                          prev.includes(pm.value)
                            ? prev.filter((x) => x !== pm.value)
                            : [...prev, pm.value]
                        )
                      }
                      className={`flex items-center gap-1.5 px-2.5 py-1 border text-xs font-bold transition select-none cursor-pointer rounded-none active:scale-[0.98] ${
                        isChecked
                          ? 'bg-amber-300 border-amber-600 text-black'
                          : 'bg-yellow-50 hover:bg-amber-100 border-amber-200 text-stone-800'
                      }`}
                    >
                      <div
                        className={`w-3.5 h-3.5 border flex items-center justify-center shrink-0 rounded-none transition-colors ${
                          isChecked ? 'bg-amber-600 border-amber-700 text-white' : 'bg-white border-stone-400'
                        }`}
                      >
                        {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                      <span>{pm.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 8. To'lov shartlari (Tick orqali bir nechtasini tanlash) */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-black uppercase text-stone-700">
                  8. To'lov shartlari (Tick)
                </label>
                {filterPaymentConditionsList.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setFilterPaymentConditionsList([])}
                    className="text-[9px] underline font-bold text-stone-600 cursor-pointer"
                  >
                    Tozalash
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 p-1 bg-white border border-amber-300">
                {[
                  { value: 'naqd joyida', label: 'naqd joyida' },
                  { value: "kechiktirib to'lash", label: "kechiktirib to'lash" },
                  { value: "oldindan to'lov (avans)", label: "oldindan to'lov" },
                  { value: "bo'lib-bo'lib to'lash", label: "bo'lib-bo'lib" },
                ].map((pc) => {
                  const isChecked = filterPaymentConditionsList.includes(pc.value);
                  return (
                    <button
                      type="button"
                      key={pc.value}
                      onClick={() =>
                        setFilterPaymentConditionsList((prev) =>
                          prev.includes(pc.value)
                            ? prev.filter((x) => x !== pc.value)
                            : [...prev, pc.value]
                        )
                      }
                      className={`flex items-center gap-1.5 px-2.5 py-1 border text-xs font-bold transition select-none cursor-pointer rounded-none active:scale-[0.98] ${
                        isChecked
                          ? 'bg-amber-300 border-amber-600 text-black'
                          : 'bg-yellow-50 hover:bg-amber-100 border-amber-200 text-stone-800'
                      }`}
                    >
                      <div
                        className={`w-3.5 h-3.5 border flex items-center justify-center shrink-0 rounded-none transition-colors ${
                          isChecked ? 'bg-amber-600 border-amber-700 text-white' : 'bg-white border-stone-400'
                        }`}
                      >
                        {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                      <span>{pc.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 9. Sifat barqarorligi (Tick) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-black uppercase text-stone-700">
                  9. Sifat (Tick)
                </label>
                {filterQualityList.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setFilterQualityList([])}
                    className="text-[9px] underline font-bold text-stone-600 cursor-pointer"
                  >
                    Tozalash
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-1 p-1 bg-white border border-amber-300">
                {[
                  { value: 'yaxshi', label: 'yaxshi' },
                  { value: "o'rtacha", label: "o'rtacha" },
                  { value: 'yomon', label: 'yomon' },
                ].map((q) => {
                  const isChecked = filterQualityList.includes(q.value);
                  return (
                    <label
                      key={q.value}
                      className={`flex items-center gap-1.5 px-2 py-0.5 border text-xs font-bold transition select-none cursor-pointer rounded-none ${
                        isChecked
                          ? 'bg-amber-300 border-amber-600 text-black'
                          : 'bg-yellow-50 hover:bg-amber-100 border-amber-200 text-stone-800'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() =>
                          setFilterQualityList((prev) =>
                            prev.includes(q.value)
                              ? prev.filter((x) => x !== q.value)
                              : [...prev, q.value]
                          )
                        }
                        className="w-3.5 h-3.5 accent-amber-600 border-amber-400 rounded-none cursor-pointer"
                      />
                      <span>{q.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* 10. Shaffoflik darajasi (Tick) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-black uppercase text-stone-700">
                  10. Shaffoflik (Tick)
                </label>
                {filterTransparencyList.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setFilterTransparencyList([])}
                    className="text-[9px] underline font-bold text-stone-600 cursor-pointer"
                  >
                    Tozalash
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-1 p-1 bg-white border border-amber-300">
                {[
                  { value: 'shaffof', label: 'shaffof' },
                  { value: 'shubhali', label: 'shubhali' },
                ].map((t) => {
                  const isChecked = filterTransparencyList.includes(t.value);
                  return (
                    <label
                      key={t.value}
                      className={`flex items-center gap-1.5 px-2 py-0.5 border text-xs font-bold transition select-none cursor-pointer rounded-none ${
                        isChecked
                          ? 'bg-amber-300 border-amber-600 text-black'
                          : 'bg-yellow-50 hover:bg-amber-100 border-amber-200 text-stone-800'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() =>
                          setFilterTransparencyList((prev) =>
                            prev.includes(t.value)
                              ? prev.filter((x) => x !== t.value)
                              : [...prev, t.value]
                          )
                        }
                        className="w-3.5 h-3.5 accent-amber-600 border-amber-400 rounded-none cursor-pointer"
                      />
                      <span>{t.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* 11. Javobgarlik (Tick) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-black uppercase text-stone-700">
                  11. Javobgarlik (Tick)
                </label>
                {filterResponsibilityList.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setFilterResponsibilityList([])}
                    className="text-[9px] underline font-bold text-stone-600 cursor-pointer"
                  >
                    Tozalash
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-1 p-1 bg-white border border-amber-300">
                {[
                  { value: 'mahsulot sifatiga javob beradi', label: 'javob beradi' },
                  { value: "mahsulot sifatiga ba'zida javob beradi", label: "ba'zida javob beradi" },
                  { value: 'mahsulot sifatiga javob bermaydi', label: 'javob bermaydi' },
                ].map((r) => {
                  const isChecked = filterResponsibilityList.includes(r.value);
                  return (
                    <label
                      key={r.value}
                      className={`flex items-center gap-1.5 px-2 py-0.5 border text-xs font-bold transition select-none cursor-pointer rounded-none ${
                        isChecked
                          ? 'bg-amber-300 border-amber-600 text-black'
                          : 'bg-yellow-50 hover:bg-amber-100 border-amber-200 text-stone-800'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() =>
                          setFilterResponsibilityList((prev) =>
                            prev.includes(r.value)
                              ? prev.filter((x) => x !== r.value)
                              : [...prev, r.value]
                          )
                        }
                        className="w-3.5 h-3.5 accent-amber-600 border-amber-400 rounded-none cursor-pointer"
                      />
                      <span>{r.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* 12. Intizom darajasi (Tick) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-black uppercase text-stone-700">
                  12. Intizom (Tick)
                </label>
                {filterDisciplineList.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setFilterDisciplineList([])}
                    className="text-[9px] underline font-bold text-stone-600 cursor-pointer"
                  >
                    Tozalash
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-1 p-1 bg-white border border-amber-300">
                {[
                  { value: 'vaqtida', label: 'vaqtida' },
                  { value: "o'rtacha", label: "o'rtacha" },
                  { value: 'kechikadi', label: 'kechikadi' },
                ].map((d) => {
                  const isChecked = filterDisciplineList.includes(d.value);
                  return (
                    <label
                      key={d.value}
                      className={`flex items-center gap-1.5 px-2 py-0.5 border text-xs font-bold transition select-none cursor-pointer rounded-none ${
                        isChecked
                          ? 'bg-amber-300 border-amber-600 text-black'
                          : 'bg-yellow-50 hover:bg-amber-100 border-amber-200 text-stone-800'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() =>
                          setFilterDisciplineList((prev) =>
                            prev.includes(d.value)
                              ? prev.filter((x) => x !== d.value)
                              : [...prev, d.value]
                          )
                        }
                        className="w-3.5 h-3.5 accent-amber-600 border-amber-400 rounded-none cursor-pointer"
                      />
                      <span>{d.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* 13. Qo'shimchalar (Tick) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-black uppercase text-stone-700">
                  13. Qo'shimchalar (Tick)
                </label>
                {filterExtrasList.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setFilterExtrasList([])}
                    className="text-[9px] underline font-bold text-stone-600 cursor-pointer"
                  >
                    Tozalash
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-1 p-1 bg-white border border-amber-300">
                {[
                  { value: 'bepul', label: 'yetkazib berish (bepul)' },
                  { value: 'pulli', label: 'yetkazib berish (pulli)' },
                ].map((ex) => {
                  const isChecked = filterExtrasList.includes(ex.value);
                  return (
                    <label
                      key={ex.value}
                      className={`flex items-center gap-1.5 px-2 py-0.5 border text-xs font-bold transition select-none cursor-pointer rounded-none ${
                        isChecked
                          ? 'bg-amber-300 border-amber-600 text-black'
                          : 'bg-yellow-50 hover:bg-amber-100 border-amber-200 text-stone-800'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() =>
                          setFilterExtrasList((prev) =>
                            prev.includes(ex.value)
                              ? prev.filter((x) => x !== ex.value)
                              : [...prev, ex.value]
                          )
                        }
                        className="w-3.5 h-3.5 accent-amber-600 border-amber-400 rounded-none cursor-pointer"
                      />
                      <span>{ex.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Sifatlar baholari (1-5★ Tick filtri) */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-black uppercase text-stone-700">
                  Baholar (1 dan 5 gacha baholangan sifatlar)
                </label>
                {filterScoresList.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setFilterScoresList([])}
                    className="text-[9px] underline font-bold text-stone-600 cursor-pointer"
                  >
                    Tozalash
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 p-1 bg-white border border-amber-300">
                {[5, 4, 3, 2, 1].map((score) => {
                  const isChecked = filterScoresList.includes(score);
                  return (
                    <label
                      key={score}
                      className={`flex items-center gap-1.5 px-2.5 py-1 border text-xs font-black transition select-none cursor-pointer rounded-none ${
                        isChecked
                          ? 'bg-amber-300 border-amber-600 text-black shadow-2xs'
                          : 'bg-yellow-50 hover:bg-amber-100 border-amber-200 text-stone-800'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() =>
                          setFilterScoresList((prev) =>
                            prev.includes(score) ? prev.filter((x) => x !== score) : [...prev, score]
                          )
                        }
                        className="w-3.5 h-3.5 accent-amber-600 border-amber-400 rounded-none cursor-pointer"
                      />
                      <span>{score} ★</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SWIPE / GESTURE NAVIGATION BAR (Jadval rejimi uchun swipe boshqaruvi) */}
      {viewMode === 'table' && suppliers.length > 0 && (
        <div className="bg-yellow-200/90 border border-amber-400 px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs font-bold select-none rounded-none shadow-2xs">
          {/* Swipe Ko'rsatkich va Navigatsiya */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => scrollTable('left')}
              className="p-1 bg-white hover:bg-amber-300 border border-amber-400 text-black active:scale-95 transition cursor-pointer rounded-none"
              title="Chapga surish (Swipe left)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-yellow-100 border border-amber-300 text-[11px] text-stone-800">
              <MoveHorizontal className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span>
                Ustunlarni suring (Swipe): <strong className="text-black">{scrollProgress}%</strong>
              </span>
            </div>

            <button
              onClick={() => scrollTable('right')}
              className="p-1 bg-white hover:bg-amber-300 border border-amber-400 text-black active:scale-95 transition cursor-pointer rounded-none"
              title="O'ngga surish (Swipe right)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Swipe tezkor sakrash va Kengaytirish rejimi */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1 text-[10px] text-stone-600">
              <button
                onClick={() => scrollTable('start')}
                className="px-1.5 py-0.5 bg-white hover:bg-amber-100 border border-amber-300 rounded-none cursor-pointer"
              >
                Boshiga
              </button>
              <button
                onClick={() => scrollTable('end')}
                className="px-1.5 py-0.5 bg-white hover:bg-amber-100 border border-amber-300 rounded-none cursor-pointer"
              >
                Oxiriga
              </button>
            </div>

            {/* Kengaytirish / Ixchamlashtirish toggle */}
            <button
              onClick={() => setIsExpandedTable(!isExpandedTable)}
              className={`flex items-center gap-1 px-2 py-0.5 text-[11px] font-black border transition cursor-pointer rounded-none ${
                isExpandedTable
                  ? 'bg-amber-400 border-amber-600 text-black shadow-xs'
                  : 'bg-white hover:bg-yellow-100 border-amber-400 text-stone-800'
              }`}
              title="Jadval kengligini o'zgartirish"
            >
              {isExpandedTable ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
              <span>{isExpandedTable ? 'Ixcham holat' : 'Kengaytirilgan'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content: Bo'sh holat, Jadval (Swipe bilan kengayadigan) yoki Ixcham ko'rinish */}
      {suppliers.length === 0 ? (
        /* Empty State */
        <div id="empty-suppliers-state" className="p-12 text-center space-y-4 bg-yellow-100/70 border-2 border-amber-400 rounded-none">
          <div className="w-16 h-16 mx-auto bg-yellow-200 border-2 border-amber-400 flex items-center justify-center text-black shadow-sm rounded-none">
            <Building2 className="w-8 h-8 stroke-[2.5]" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-black text-black font-heading">
              Hozircha jadval bo'sh
            </h3>
            <p className="text-xs text-stone-800 font-semibold mt-1">
              Yetkazib beruvchilar hali kiritilmagan. Yuqoridagi «Yozuv kiritish» tugmasi orqali yangi yetkazib beruvchi qo'shishingiz mumkin.
            </p>
          </div>
          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-400 hover:bg-amber-500 text-black text-xs font-black border-2 border-amber-500 shadow-sm transition active:scale-95 cursor-pointer rounded-none"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Birinchi yozuvni kiritish</span>
          </button>
        </div>
      ) : filteredAndSortedSuppliers.length === 0 ? (
        /* Filtered empty state */
        <div className="p-8 text-center space-y-3 text-black font-bold text-xs bg-yellow-100/70 border-2 border-amber-400 rounded-none">
          <p>Filtr parametrlariga mos yetkazib beruvchi topilmadi.</p>
          <button
            onClick={resetAllFilters}
            className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-500 text-black text-xs font-black border border-amber-600 transition cursor-pointer rounded-none"
          >
            Filtrlarni tozalash
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* JADVAL REJIMI: QO'SHIMCHA KO'RISH TUGMASISIZ, SWIPE VA DRAG BILAN KENgAYADIGAN */
        <div
          ref={tableContainerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          className={`bg-yellow-100/85 border-2 border-amber-400 shadow-sm overflow-x-auto text-black rounded-none transition-all duration-200 ${
            isDragging ? 'cursor-grabbing select-none' : 'cursor-grab'
          }`}
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <table
            className={`border-collapse text-[11px] leading-tight select-text transition-all ${
              isExpandedTable ? 'w-[1600px] table-fixed' : 'w-full min-w-[1240px] table-fixed'
            }`}
          >
            {/* Ustun kengliklari */}
            <colgroup>
              <col className="w-[36px]" />  {/* 1. № (Sticky pinned) */}
              <col className={isExpandedTable ? 'w-[125px]' : 'w-[105px]'} />  {/* 2. Vaqt (Ixcham) */}
              <col className={isExpandedTable ? 'w-[100px]' : 'w-[85px]'} />  {/* 3. Faoliyat */}
              <col className={isExpandedTable ? 'w-[160px]' : 'w-[130px]'} /> {/* 4. Nom (Sticky pinned) */}
              <col className={isExpandedTable ? 'w-[150px]' : 'w-[120px]'} /> {/* 5. Manzil */}
              <col className={isExpandedTable ? 'w-[130px]' : 'w-[110px]'} /> {/* 6. Telefon */}
              <col className={isExpandedTable ? 'w-[105px]' : 'w-[90px]'} />  {/* 7. Pul o'tkazma */}
              <col className={isExpandedTable ? 'w-[120px]' : 'w-[100px]'} /> {/* 8. To'lov sharti */}
              <col className={isExpandedTable ? 'w-[95px]' : 'w-[80px]'} />   {/* 9. Sifat */}
              <col className={isExpandedTable ? 'w-[90px]' : 'w-[75px]'} />   {/* 10. Shaffoflik */}
              <col className={isExpandedTable ? 'w-[130px]' : 'w-[110px]'} /> {/* 11. Javobgarlik */}
              <col className={isExpandedTable ? 'w-[95px]' : 'w-[80px]'} />   {/* 12. Intizom */}
              <col className={isExpandedTable ? 'w-[110px]' : 'w-[90px]'} />  {/* 13. Qo'shimchalar */}
              <col className={isExpandedTable ? 'w-[170px]' : 'w-[130px]'} /> {/* 14. Mahsulotlar */}
              <col className="w-[70px]" />  {/* Amallar */}
            </colgroup>

            <thead>
              {/* 1-QATOR: Ustun Sarlavhalari */}
              <tr className="bg-amber-300 text-black border-b border-amber-400 text-[10px] font-black uppercase tracking-wider">
                
                {/* 1. № (Sticky pinned left-0) */}
                <th className="p-1.5 text-center border-r border-amber-400 sticky left-0 z-20 bg-amber-300 shadow-[1px_0_0_0_#fbbf24]">
                  <button
                    onClick={() => toggleSort('orderNumber')}
                    className="inline-flex items-center justify-center gap-0.5 w-full hover:text-stone-700 cursor-pointer"
                    title="№ bo'yicha saralash"
                  >
                    <span>1. №</span>
                    <ArrowUpDown className="w-2.5 h-2.5" />
                  </button>
                </th>

                {/* 2. Vaqt */}
                <th className="p-1.5 text-left border-r border-amber-400">
                  <button
                    onClick={() => toggleSort('systemTime')}
                    className="inline-flex items-center gap-0.5 hover:text-stone-700 cursor-pointer"
                    title="Vaqt bo'yicha saralash"
                  >
                    <span>2. Vaqt</span>
                    <ArrowUpDown className="w-2.5 h-2.5" />
                  </button>
                </th>

                {/* 3. Faoliyat */}
                <th className="p-1.5 text-left border-r border-amber-400">
                  <span>3. Faoliyat</span>
                </th>

                {/* 4. Nom (Sticky pinned left-[36px]) */}
                <th className="p-1.5 text-left border-r border-amber-400 font-heading sticky left-[36px] z-20 bg-amber-300 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.1)]">
                  <button
                    onClick={() => toggleSort('name')}
                    className="inline-flex items-center justify-between w-full hover:text-stone-700 cursor-pointer"
                    title="Nomni alfavit bo'yicha saralash"
                  >
                    <span>4. Nom</span>
                    {sortField === 'name' ? (
                      sortOrder === 'asc' ? <ArrowDownAZ className="w-3 h-3 text-black stroke-[2.5]" /> : <ArrowUpZA className="w-3 h-3 text-black stroke-[2.5]" />
                    ) : (
                      <ArrowDownAZ className="w-2.5 h-2.5 text-stone-600" />
                    )}
                  </button>
                </th>

                {/* 5. Manzil */}
                <th className="p-1.5 text-left border-r border-amber-400">
                  <button
                    onClick={() => toggleSort('address')}
                    className="inline-flex items-center justify-between w-full hover:text-stone-700 cursor-pointer"
                    title="Manzilni alfavit bo'yicha saralash"
                  >
                    <span>5. Manzil</span>
                    {sortField === 'address' ? (
                      sortOrder === 'asc' ? <ArrowDownAZ className="w-3 h-3 text-black stroke-[2.5]" /> : <ArrowUpZA className="w-3 h-3 text-black stroke-[2.5]" />
                    ) : (
                      <ArrowDownAZ className="w-2.5 h-2.5 text-stone-600" />
                    )}
                  </button>
                </th>

                {/* 6. Telefon */}
                <th className="p-1.5 text-left border-r border-amber-400">
                  <span>6. Telefon</span>
                </th>

                <th className="p-1.5 text-left border-r border-amber-400">7. O'tkazma</th>
                <th className="p-1.5 text-left border-r border-amber-400">8. To'lov sharti</th>
                <th
                  className="p-1.5 text-left border-r border-amber-400"
                  title="Sifat barqarorligi: 1-2★ yomon, 3★ o'rtacha, 4-5★ yaxshi"
                >
                  <div className="flex items-center justify-between gap-0.5">
                    <span>9. Sifat</span>
                    <span className="text-[8px] font-black bg-yellow-200 text-stone-900 px-1 border border-amber-500 rounded-none whitespace-nowrap">
                      1-5★
                    </span>
                  </div>
                </th>
                <th
                  className="p-1.5 text-left border-r border-amber-400"
                  title="Shaffoflik darajasi: 1-3★ shubhali, 4-5★ shaffof"
                >
                  <div className="flex items-center justify-between gap-0.5">
                    <span>10. Shaffof</span>
                    <span className="text-[8px] font-black bg-yellow-200 text-stone-900 px-1 border border-amber-500 rounded-none whitespace-nowrap">
                      1-5★
                    </span>
                  </div>
                </th>
                <th
                  className="p-1.5 text-left border-r border-amber-400"
                  title="Javobgarlik: 1-2★ javob bermaydi, 3★ ba'zida javob beradi, 4-5★ javob beradi"
                >
                  <div className="flex items-center justify-between gap-0.5">
                    <span>11. Javobgar</span>
                    <span className="text-[8px] font-black bg-yellow-200 text-stone-900 px-1 border border-amber-500 rounded-none whitespace-nowrap">
                      1-5★
                    </span>
                  </div>
                </th>
                <th
                  className="p-1.5 text-left border-r border-amber-400"
                  title="Intizom darajasi: 1-2★ kechikadi, 3★ o'rtacha, 4-5★ vaqtida"
                >
                  <div className="flex items-center justify-between gap-0.5">
                    <span>12. Intizom</span>
                    <span className="text-[8px] font-black bg-yellow-200 text-stone-900 px-1 border border-amber-500 rounded-none whitespace-nowrap">
                      1-5★
                    </span>
                  </div>
                </th>
                <th
                  className="p-1.5 text-left border-r border-amber-400"
                  title="Yetkazib berish sharti (baho berilmaydi)"
                >
                  <span>13. Yetkazish</span>
                </th>
                
                {/* 14. Taklif qilinadigan mahsulotlar ro'yxati */}
                <th className="p-1.5 text-left border-r border-amber-400 font-heading">
                  <span className="flex items-center gap-1">
                    <Package className="w-3 h-3" />
                    14. Mahsulotlar
                  </span>
                </th>

                <th className="p-1.5 text-center">Amal</th>
              </tr>

              {/* 2-QATOR: Ustunlar Pastidagi Variablelar Orqali Filtrlash */}
              <tr className="bg-yellow-200 border-b-2 border-amber-400 text-[10px]">
                {/* 1. № (Sticky pinned) */}
                <td className="p-1 text-center border-r border-amber-300 sticky left-0 z-20 bg-yellow-200 shadow-[1px_0_0_0_#fcd34d]">
                  <span className="text-[9px] font-black text-stone-600">
                    {sortField === 'orderNumber' ? (sortOrder === 'asc' ? '1→9' : '9→1') : '—'}
                  </span>
                </td>

                {/* 2. Vaqt */}
                <td className="p-1 border-r border-amber-300">
                  <button
                    onClick={() => toggleSort('systemTime')}
                    className={`w-full py-0.5 px-1 border text-[9px] font-black truncate rounded-none cursor-pointer ${
                      sortField === 'systemTime' ? 'bg-amber-400 border-amber-600' : 'bg-white border-amber-300'
                    }`}
                  >
                    {sortField === 'systemTime' ? (sortOrder === 'asc' ? 'Eski' : 'Yangi') : 'Tartib'}
                  </button>
                </td>

                {/* 3. Faoliyat turi filtri (Tick orqali bir nechtasini tanlash) */}
                <td className="p-1 border-r border-amber-300">
                  {renderMultiFilterDropdown(
                    'activity_type',
                    '3. Faoliyat',
                    filterActivityList,
                    [
                      { value: 'jismoniy', label: 'jismoniy' },
                      { value: 'yuridik', label: 'yuridik' },
                    ],
                    (val) =>
                      setFilterActivityList((prev) =>
                        prev.includes(val) ? prev.filter((x) => x !== val) : [...prev, val]
                      ),
                    () => setFilterActivityList(['jismoniy', 'yuridik']),
                    () => setFilterActivityList([])
                  )}
                </td>

                {/* 4. Nom filtri (Sticky pinned) */}
                <td className="p-1 border-r border-amber-300 sticky left-[36px] z-20 bg-yellow-200 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.1)]">
                  <div className="flex gap-0.5">
                    <input
                      type="text"
                      value={filterName}
                      onChange={(e) => setFilterName(e.target.value)}
                      placeholder="Nom..."
                      className="w-full px-1 py-0.5 bg-white border border-amber-300 text-[10px] font-bold rounded-none focus:outline-none focus:border-amber-500 placeholder-stone-400"
                    />
                    <button
                      onClick={() => toggleSort('name')}
                      className={`px-1 py-0.5 border text-[9px] font-black rounded-none shrink-0 cursor-pointer ${
                        sortField === 'name' ? 'bg-amber-400 border-amber-600' : 'bg-yellow-100 border-amber-300'
                      }`}
                      title="Alfavit tartibi A-Z / Z-A"
                    >
                      {sortField === 'name' ? (sortOrder === 'asc' ? 'A→Z' : 'Z→A') : 'A-Z'}
                    </button>
                  </div>
                </td>

                {/* 5. Manzil filtri */}
                <td className="p-1 border-r border-amber-300">
                  <div className="flex gap-0.5">
                    <input
                      type="text"
                      value={filterAddress}
                      onChange={(e) => setFilterAddress(e.target.value)}
                      placeholder="Manzil..."
                      className="w-full px-1 py-0.5 bg-white border border-amber-300 text-[10px] font-bold rounded-none focus:outline-none focus:border-amber-500 placeholder-stone-400"
                    />
                    <button
                      onClick={() => toggleSort('address')}
                      className={`px-1 py-0.5 border text-[9px] font-black rounded-none shrink-0 cursor-pointer ${
                        sortField === 'address' ? 'bg-amber-400 border-amber-600' : 'bg-yellow-100 border-amber-300'
                      }`}
                      title="Manzil alfavit tartibi"
                    >
                      {sortField === 'address' ? (sortOrder === 'asc' ? 'A→Z' : 'Z→A') : 'A-Z'}
                    </button>
                  </div>
                </td>

                {/* 6. Telefon filtri */}
                <td className="p-1 border-r border-amber-300">
                  <input
                    type="text"
                    value={filterPhone}
                    onChange={(e) => setFilterPhone(e.target.value)}
                    placeholder="Tel..."
                    className="w-full px-1 py-0.5 bg-white border border-amber-300 text-[10px] font-bold rounded-none focus:outline-none focus:border-amber-500 placeholder-stone-400"
                  />
                </td>

                {/* 7. Pul o'tkazmalari filtri (Tick orqali bir nechtasini tanlash) */}
                <td className="p-1 border-r border-amber-300">
                  {renderMultiFilterDropdown(
                    'payment_method',
                    "7. O'tkazma",
                    filterPaymentMethodsList,
                    [
                      { value: 'naqd', label: 'naqd' },
                      { value: 'bank orqali', label: 'bank orqali' },
                      { value: 'bank kartalari orqali', label: 'bank kartalari' },
                    ],
                    (val) =>
                      setFilterPaymentMethodsList((prev) =>
                        prev.includes(val) ? prev.filter((x) => x !== val) : [...prev, val]
                      ),
                    () =>
                      setFilterPaymentMethodsList(['naqd', 'bank orqali', 'bank kartalari orqali']),
                    () => setFilterPaymentMethodsList([])
                  )}
                </td>

                {/* 8. To'lov sharti filtri (Tick orqali bir nechtasini tanlash) */}
                <td className="p-1 border-r border-amber-300">
                  {renderMultiFilterDropdown(
                    'payment_condition',
                    "8. To'lov sharti",
                    filterPaymentConditionsList,
                    [
                      { value: 'naqd joyida', label: 'naqd joyida' },
                      { value: "kechiktirib to'lash", label: "kechiktirib to'lash" },
                      { value: "oldindan to'lov (avans)", label: "oldindan to'lov" },
                      { value: "bo'lib-bo'lib to'lash", label: "bo'lib-bo'lib" },
                    ],
                    (val) =>
                      setFilterPaymentConditionsList((prev) =>
                        prev.includes(val) ? prev.filter((x) => x !== val) : [...prev, val]
                      ),
                    () =>
                      setFilterPaymentConditionsList([
                        'naqd joyida',
                        "kechiktirib to'lash",
                        "oldindan to'lov (avans)",
                        "bo'lib-bo'lib to'lash",
                      ]),
                    () => setFilterPaymentConditionsList([])
                  )}
                </td>

                {/* 9. Sifat barqarorligi filtri (Tick orqali bir nechtasini tanlash) */}
                <td className="p-1 border-r border-amber-300">
                  {renderMultiFilterDropdown(
                    'quality',
                    '9. Sifat',
                    filterQualityList,
                    [
                      { value: 'yaxshi', label: 'yaxshi (4-5★)' },
                      { value: "o'rtacha", label: "o'rtacha (3★)" },
                      { value: 'yomon', label: 'yomon (1-2★)' },
                    ],
                    (val) =>
                      setFilterQualityList((prev) =>
                        prev.includes(val) ? prev.filter((x) => x !== val) : [...prev, val]
                      ),
                    () => setFilterQualityList(['yaxshi', "o'rtacha", 'yomon']),
                    () => setFilterQualityList([])
                  )}
                </td>

                {/* 10. Shaffoflik darajasi filtri (Tick orqali bir nechtasini tanlash) */}
                <td className="p-1 border-r border-amber-300">
                  {renderMultiFilterDropdown(
                    'transparency',
                    '10. Shaffoflik',
                    filterTransparencyList,
                    [
                      { value: 'shaffof', label: 'shaffof (4-5★)' },
                      { value: 'shubhali', label: 'shubhali (1-3★)' },
                    ],
                    (val) =>
                      setFilterTransparencyList((prev) =>
                        prev.includes(val) ? prev.filter((x) => x !== val) : [...prev, val]
                      ),
                    () => setFilterTransparencyList(['shaffof', 'shubhali']),
                    () => setFilterTransparencyList([])
                  )}
                </td>

                {/* 11. Javobgarlik filtri (Tick orqali bir nechtasini tanlash) */}
                <td className="p-1 border-r border-amber-300">
                  {renderMultiFilterDropdown(
                    'responsibility',
                    '11. Javobgarlik',
                    filterResponsibilityList,
                    [
                      { value: 'mahsulot sifatiga javob beradi', label: 'javob beradi (4-5★)' },
                      { value: "mahsulot sifatiga ba'zida javob beradi", label: "ba'zida javob beradi (3★)" },
                      { value: 'mahsulot sifatiga javob bermaydi', label: 'javob bermaydi (1-2★)' },
                    ],
                    (val) =>
                      setFilterResponsibilityList((prev) =>
                        prev.includes(val) ? prev.filter((x) => x !== val) : [...prev, val]
                      ),
                    () =>
                      setFilterResponsibilityList([
                        'mahsulot sifatiga javob beradi',
                        "mahsulot sifatiga ba'zida javob beradi",
                        'mahsulot sifatiga javob bermaydi',
                      ]),
                    () => setFilterResponsibilityList([])
                  )}
                </td>

                {/* 12. Intizom darajasi filtri (Tick orqali bir nechtasini tanlash) */}
                <td className="p-1 border-r border-amber-300">
                  {renderMultiFilterDropdown(
                    'discipline',
                    '12. Intizom',
                    filterDisciplineList,
                    [
                      { value: 'vaqtida', label: 'vaqtida (4-5★)' },
                      { value: "o'rtacha", label: "o'rtacha (3★)" },
                      { value: 'kechikadi', label: 'kechikadi (1-2★)' },
                    ],
                    (val) =>
                      setFilterDisciplineList((prev) =>
                        prev.includes(val) ? prev.filter((x) => x !== val) : [...prev, val]
                      ),
                    () => setFilterDisciplineList(['vaqtida', "o'rtacha", 'kechikadi']),
                    () => setFilterDisciplineList([])
                  )}
                </td>

                {/* 13. Qo'shimchalar filtri (Tick orqali bir nechtasini tanlash) */}
                <td className="p-1 border-r border-amber-300">
                  {renderMultiFilterDropdown(
                    'extras',
                    "13. Qo'shimcha",
                    filterExtrasList,
                    [
                      { value: 'bepul', label: 'bepul yetkazish' },
                      { value: 'pulli', label: 'pulli yetkazish' },
                    ],
                    (val) =>
                      setFilterExtrasList((prev) =>
                        prev.includes(val) ? prev.filter((x) => x !== val) : [...prev, val]
                      ),
                    () => setFilterExtrasList(['bepul', 'pulli']),
                    () => setFilterExtrasList([])
                  )}
                </td>

                {/* 14. Taklif qilinadigan mahsulotlar filtri (IXCHAM CHECKBOX VA POPOVER) */}
                <td className="p-1 border-r border-amber-300 relative" ref={productDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsProductDropdownOpen((prev) => !prev)}
                    className={`w-full px-1.5 py-0.5 text-[9px] font-black border flex items-center justify-between gap-1 transition cursor-pointer rounded-none text-left h-[26px] ${
                      filterProducts.length > 0 || filterProductSearch.trim()
                        ? 'bg-amber-400 border-amber-600 text-black shadow-xs ring-1 ring-amber-500'
                        : 'bg-white hover:bg-yellow-100 border-amber-300 text-black'
                    }`}
                    title="14. Mahsulotlar filtri (Checkbox orqali 1 tadan ko'p tanlash)"
                  >
                    <span className="truncate">
                      {filterProducts.length === 0
                        ? filterProductSearch.trim() ? `Qidiruv: ${filterProductSearch}` : 'Barchasi'
                        : `${filterProducts.length} ta tanlandi`}
                    </span>
                    <ChevronDown className={`w-3 h-3 shrink-0 transition-transform ${isProductDropdownOpen ? 'rotate-180 text-black' : 'text-stone-700'}`} />
                  </button>

                  {/* Dropdown Popover Menyu */}
                  {isProductDropdownOpen && (
                    <div className="absolute top-full right-0 z-50 mt-1 w-72 bg-amber-50 border-2 border-amber-500 shadow-2xl p-2.5 space-y-2 text-black rounded-none animate-in fade-in zoom-in-95 duration-100">
                      <div className="flex items-center justify-between border-b border-amber-300 pb-1.5">
                        <div>
                          <span className="text-[10px] font-black uppercase text-black block font-heading">
                            14. Mahsulotlar filtri
                          </span>
                          <span className="text-[9px] text-stone-700 font-semibold">
                            Checkbox orqali 1 tadan ko'p tanlash
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsProductDropdownOpen(false)}
                          className="text-stone-600 hover:text-black p-0.5 cursor-pointer"
                          title="Yopish"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Tezkor qidiruv inputi popover ichida */}
                      <input
                        type="text"
                        value={filterProductSearch}
                        onChange={(e) => setFilterProductSearch(e.target.value)}
                        placeholder="Mahsulot nomi bo'yicha qidirish..."
                        className="w-full px-2 py-1 bg-white border border-amber-400 text-xs font-bold rounded-none focus:outline-none focus:border-amber-600 placeholder-stone-400"
                        autoFocus
                      />

                      {/* Tezkor boshqaruv tugmalari */}
                      <div className="flex items-center justify-between gap-1">
                        <button
                          type="button"
                          onClick={handleSelectAllProducts}
                          className="px-2 py-0.5 bg-yellow-200 hover:bg-yellow-300 text-black border border-amber-400 text-[10px] font-black cursor-pointer rounded-none flex items-center gap-1"
                        >
                          <CheckCheck className="w-2.5 h-2.5 text-amber-900" />
                          <span>Barchasi</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleClearProductFilters}
                          className="px-2 py-0.5 bg-yellow-200 hover:bg-rose-200 text-black hover:text-rose-800 border border-amber-400 text-[10px] font-black cursor-pointer rounded-none flex items-center gap-1"
                        >
                          <RotateCcw className="w-2.5 h-2.5" />
                          <span>Tozalash</span>
                        </button>
                      </div>

                      {/* Checkboxlar ro'yxati */}
                      {allUniqueProducts.length === 0 ? (
                        <p className="text-[10px] text-stone-600 italic py-2 text-center">
                          Mahsulotlar mavjud emas
                        </p>
                      ) : (
                        <div className="max-h-44 overflow-y-auto space-y-1 p-1 bg-white border border-amber-300">
                          {allUniqueProducts.map((prod) => {
                            const isChecked = filterProducts.includes(prod);
                            const count = productCounts[prod] || 0;
                            return (
                              <label
                                key={prod}
                                className={`flex items-center gap-2 px-1.5 py-1 text-[10px] font-bold border transition select-none cursor-pointer rounded-none ${
                                  isChecked
                                    ? 'bg-amber-300 border-amber-500 text-black'
                                    : 'hover:bg-yellow-50 border-transparent text-stone-800'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleToggleProductFilter(prod)}
                                  className="w-3.5 h-3.5 accent-amber-600 border-amber-400 rounded-none cursor-pointer"
                                />
                                <span className="truncate flex-1">{prod}</span>
                                <span className="text-[9px] text-stone-600 font-semibold shrink-0">
                                  ({count})
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      )}

                      {/* Pastki qism: Tayyor tugmasi */}
                      <div className="flex items-center justify-between pt-1.5 border-t border-amber-300 text-[10px]">
                        <span className="font-bold text-stone-700">
                          {filterProducts.length > 0 ? `${filterProducts.length} ta tanlandi` : 'Hammasi ko\'rinadi'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsProductDropdownOpen(false)}
                          className="px-3 py-1 bg-amber-400 hover:bg-amber-500 text-black font-black border border-amber-600 cursor-pointer rounded-none shadow-xs"
                        >
                          Tayyor
                        </button>
                      </div>
                    </div>
                  )}
                </td>

                {/* Amal (Filtrlarni tozalash) */}
                <td className="p-1 text-center">
                  <button
                    onClick={resetAllFilters}
                    className="p-1 hover:bg-amber-300 text-black transition cursor-pointer rounded-none"
                    title="Barcha filtrlarni tozalash"
                  >
                    <RotateCcw className="w-3 h-3 mx-auto stroke-[2.5]" />
                  </button>
                </td>
              </tr>
            </thead>

            <tbody className="divide-y divide-amber-200 text-black font-medium">
              {filteredAndSortedSuppliers.map((item, index) => {
                const isDelay = item.paymentCondition === "kechiktirib to'lash";
                const isRowExpanded = expandedRowId === item.id;
                const rowBg = index % 2 === 0 ? 'bg-yellow-50' : 'bg-yellow-100/50';

                return (
                  <React.Fragment key={item.id}>
                    <tr className={`hover:bg-amber-200/80 transition ${rowBg}`}>
                      
                      {/* 1. Tartib raqam (Sticky pinned) */}
                      <td
                        className={`p-1.5 text-center font-black text-black border-r border-amber-300 sticky left-0 z-10 ${rowBg} shadow-[1px_0_0_0_#fcd34d]`}
                      >
                        #{item.orderNumber}
                      </td>

                      {/* 2. Sistema vaqti (Ixcham 2 qatorda: sana va vaqt) */}
                      <td className="p-1 sm:p-1.5 border-r border-amber-300 text-[10px] leading-tight">
                        {(() => {
                          const raw = item.systemTime || '';
                          const parts = raw.split(/,\s*|\s+/);
                          const datePart = parts[0] || raw;
                          const timePart = parts.slice(1).join(' ');
                          return (
                            <div className="flex flex-col font-mono text-stone-900">
                              <span className="font-bold text-[10px] whitespace-nowrap">{datePart}</span>
                              {timePart && (
                                <span className="text-[9px] text-stone-600 flex items-center gap-0.5 whitespace-nowrap">
                                  <Clock className="w-2.5 h-2.5 text-stone-500 shrink-0" />
                                  <span>{timePart}</span>
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </td>

                      {/* 3. Faoliyat turi (To'g'ridan-to'g'ri ko'rinadi) */}
                      <td className="p-1.5 border-r border-amber-300">
                        <div className="flex flex-wrap gap-1">
                          {(item.activityTypes && item.activityTypes.length > 0
                            ? item.activityTypes
                            : typeof item.activityType === 'string'
                              ? item.activityType.split(',').map((s) => s.trim()).filter(Boolean)
                              : [item.activityType || 'jismoniy']
                          ).map((act) => (
                            <span
                              key={act}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-black uppercase bg-yellow-200 text-black border border-amber-400 rounded-none whitespace-nowrap"
                            >
                              {act === 'jismoniy' ? (
                                <UserCheck className="w-2.5 h-2.5 text-stone-800" />
                              ) : (
                                <Building2 className="w-2.5 h-2.5 text-stone-800" />
                              )}
                              <span>{act}</span>
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* 4. Nom (Sticky pinned) */}
                      <td
                        className={`p-1.5 font-black text-black border-r border-amber-300 font-heading break-words sticky left-[36px] z-10 ${rowBg} shadow-[2px_0_4px_-1px_rgba(0,0,0,0.1)]`}
                      >
                        <span className="line-clamp-2" title={item.name}>
                          {item.name}
                        </span>
                      </td>

                      {/* 5. Manzil */}
                      <td className="p-1.5 text-black border-r border-amber-300 break-words text-[10px] leading-snug">
                        <div className="flex items-start gap-1">
                          <MapPin className="w-2.5 h-2.5 text-stone-700 shrink-0 mt-0.5" />
                          <span className="line-clamp-2" title={item.address}>
                            {item.address}
                          </span>
                        </div>
                      </td>

                      {/* 6. Telefon raqam (To'g'ridan-to'g'ri ko'rinadi) */}
                      <td className="p-1.5 whitespace-nowrap font-bold text-black border-r border-amber-300 text-[10px]">
                        <a
                          href={`tel:${item.phone.replace(/[^0-9+]/g, '')}`}
                          className="hover:underline flex items-center gap-1 font-black text-black"
                          title="Qo'ng'iroq qilish"
                        >
                          <Phone className="w-2.5 h-2.5 text-stone-700 shrink-0" />
                          <span>{item.phone}</span>
                        </a>
                      </td>

                      {/* 7. Pul o'tkazmalari */}
                      <td className="p-1.5 border-r border-amber-300">
                        <div className="flex flex-wrap gap-0.5">
                          {(item.paymentMethods && item.paymentMethods.length > 0
                            ? item.paymentMethods
                            : [item.paymentMethod]
                          ).map((pm, pmIdx) => (
                            <span
                              key={pmIdx}
                              className="px-1 py-0.5 text-[9px] font-black bg-yellow-200 border border-amber-400 rounded-none inline-block whitespace-nowrap"
                            >
                              {pm}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* 8. To'lov sharti */}
                      <td className="p-1.5 border-r border-amber-300 text-[10px]">
                        <div className="flex flex-wrap gap-0.5">
                          {item.paymentConditions && item.paymentConditions.length > 0 ? (
                            item.paymentConditions.map((pc, pcIdx) => (
                              <span
                                key={pcIdx}
                                className={`px-1 py-0.5 font-black border text-[9px] rounded-none inline-block leading-tight whitespace-nowrap ${
                                  pc.includes('kechiktirib')
                                    ? 'bg-amber-200 border-amber-500'
                                    : 'bg-yellow-200 border-amber-400'
                                }`}
                              >
                                {pc}
                                {pc.includes('kechiktirib') && item.delayDays ? ` (${item.delayDays}k)` : ''}
                              </span>
                            ))
                          ) : isDelay ? (
                            <span className="px-1 py-0.5 font-black bg-amber-200 border border-amber-500 rounded-none inline-block leading-tight">
                              kechiktirib ({item.delayDays || 0}k)
                            </span>
                          ) : (
                            <span className="px-1 py-0.5 font-black bg-yellow-200 border border-amber-400 rounded-none inline-block">
                              naqd joyida
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 9. Sifat barqarorligi */}
                      <td className="p-1.5 border-r border-amber-300">
                        <div className="flex items-center gap-1 flex-wrap">
                          {renderQualityBadge(item.qualityStability)}
                          {item.qualityScore && (() => {
                            const info = getQualityScoreInfo(item.qualityScore);
                            return (
                              <span
                                className={`text-[9px] font-black px-1 py-0.5 border rounded-none flex items-center gap-0.5 ${info.color}`}
                                title={`Sifat: ${item.qualityScore}★ (${info.text}) — ${info.explanation}`}
                              >
                                <span>{item.qualityScore}★</span>
                                <span className="text-[8px] uppercase">({info.text})</span>
                              </span>
                            );
                          })()}
                        </div>
                      </td>

                      {/* 10. Shaffoflik darajasi */}
                      <td className="p-1.5 border-r border-amber-300">
                        <div className="flex items-center gap-1 flex-wrap">
                          {renderTransparencyBadge(item.transparencyLevel)}
                          {item.transparencyScore && (() => {
                            const info = getTransparencyScoreInfo(item.transparencyScore);
                            return (
                              <span
                                className={`text-[9px] font-black px-1 py-0.5 border rounded-none flex items-center gap-0.5 ${info.color}`}
                                title={`Shaffoflik: ${item.transparencyScore}★ (${info.text}) — ${info.explanation}`}
                              >
                                <span>{item.transparencyScore}★</span>
                                <span className="text-[8px] uppercase">({info.text})</span>
                              </span>
                            );
                          })()}
                        </div>
                      </td>

                      {/* 11. Javobgarlik */}
                      <td className="p-1.5 text-black border-r border-amber-300 break-words text-[10px] leading-tight font-medium">
                        <div className="space-y-0.5">
                          <span className="line-clamp-2" title={item.responsibility}>
                            {item.responsibility}
                          </span>
                          {item.responsibilityScore && (() => {
                            const info = getResponsibilityScoreInfo(item.responsibilityScore);
                            return (
                              <span
                                className={`inline-flex items-center gap-0.5 text-[9px] font-black px-1 py-0.5 border rounded-none ${info.color}`}
                                title={`Javobgarlik: ${item.responsibilityScore}★ (${info.text}) — ${info.explanation}`}
                              >
                                <span>{item.responsibilityScore}★</span>
                                <span className="text-[8px] uppercase">({info.text})</span>
                              </span>
                            );
                          })()}
                        </div>
                      </td>

                      {/* 12. Intizom darajasi */}
                      <td className="p-1.5 border-r border-amber-300">
                        <div className="flex items-center gap-1 flex-wrap">
                          {renderDisciplineBadge(item.disciplineLevel)}
                          {item.disciplineScore && (() => {
                            const info = getDisciplineScoreInfo(item.disciplineScore);
                            return (
                              <span
                                className={`text-[9px] font-black px-1 py-0.5 border rounded-none flex items-center gap-0.5 ${info.color}`}
                                title={`Intizom: ${item.disciplineScore}★ (${info.text}) — ${info.explanation}`}
                              >
                                <span>{item.disciplineScore}★</span>
                                <span className="text-[8px] uppercase">({info.text})</span>
                              </span>
                            );
                          })()}
                        </div>
                      </td>

                      {/* 13. Qo'shimchalar (Yetkazib berishda baho bo'lmasin) */}
                      <td className="p-1.5 border-r border-amber-300">
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-black bg-yellow-200 border border-amber-400 rounded-none whitespace-nowrap">
                          <Truck className="w-2.5 h-2.5 text-stone-800 shrink-0" />
                          {item.extras.replace('yetkazib berish ', '')}
                        </span>
                      </td>

                      {/* 14. Taklif qilinadigan mahsulotlar */}
                      <td className="p-1.5 border-r border-amber-300">
                        {item.products && item.products.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                            {item.products.map((prod, pIdx) => (
                              <span
                                key={pIdx}
                                className="inline-block px-1.5 py-0.5 text-[9px] font-black bg-amber-200 text-black border border-amber-500 rounded-none leading-none shadow-2xs"
                              >
                                {prod}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-stone-400 font-bold text-center block">—</span>
                        )}
                      </td>

                      {/* Amallar: Tahrirlash, O'chirish & Qatorni kengaytirish */}
                      <td className="p-1.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-0.5">
                          <button
                            onClick={() =>
                              setExpandedRowId(isRowExpanded ? null : item.id)
                            }
                            className={`p-1 border transition cursor-pointer rounded-none ${
                              isRowExpanded
                                ? 'bg-amber-400 border-amber-600 text-black'
                                : 'hover:bg-amber-300 border-transparent text-stone-700'
                            }`}
                            title={isRowExpanded ? 'Yopish' : 'Qator tafsilotlarini ochish'}
                          >
                            {isRowExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5 stroke-[2.5]" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
                            )}
                          </button>
                          <button
                            onClick={() => onEditSupplier(item)}
                            className="p-1 text-black hover:text-amber-800 hover:bg-amber-300 transition cursor-pointer rounded-none"
                            title="Yetkazib beruvchini tahrirlash"
                          >
                            <Edit className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Haqiqatan ham "${item.name}" yetkazib beruvchisini o'chirmoqchimisiz?`)) {
                                onDeleteSupplier(item.id);
                              }
                            }}
                            className="p-1 text-black hover:text-rose-700 hover:bg-rose-200 transition cursor-pointer rounded-none"
                            title="Yozuvni o'chirish"
                          >
                            <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>
                        </div>
                      </td>

                    </tr>

                    {/* Qator ochilganda to'liq ma'lumotlar ko'rinishi (Accordion) */}
                    {isRowExpanded && (
                      <tr className="bg-yellow-200/95 border-b-2 border-amber-400">
                        <td colSpan={15} className="p-3 text-xs">
                          <div className="bg-white/80 border border-amber-400 p-3 space-y-2">
                            <div className="flex items-center justify-between border-b border-amber-300 pb-1.5">
                              <span className="font-black text-black text-sm font-heading">
                                #{item.orderNumber} — {item.name}
                              </span>
                              <span className="text-[11px] font-bold text-stone-600 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-stone-500" />
                                {item.systemTime}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                              <div>
                                <span className="text-stone-500 block text-[9px] font-black uppercase">Faoliyat:</span>
                                <span className="font-bold uppercase">{item.activityType}</span>
                              </div>
                              <div>
                                <span className="text-stone-500 block text-[9px] font-black uppercase">Telefon:</span>
                                <a href={`tel:${item.phone.replace(/[^0-9+]/g, '')}`} className="font-black underline">
                                  {item.phone}
                                </a>
                              </div>
                              <div>
                                <span className="text-stone-500 block text-[9px] font-black uppercase">O'tkazma:</span>
                                <span className="font-bold">{item.paymentMethod}</span>
                              </div>
                              <div>
                                <span className="text-stone-500 block text-[9px] font-black uppercase">To'lov sharti:</span>
                                <span className="font-bold">{item.paymentCondition} {isDelay ? `(${item.delayDays} kun)` : ''}</span>
                              </div>
                              <div>
                                <span className="text-stone-500 block text-[9px] font-black uppercase">Sifat:</span>
                                <div className="flex items-center gap-1 mt-0.5">
                                  {renderQualityBadge(item.qualityStability)}
                                  {item.qualityScore && (() => {
                                    const info = getQualityScoreInfo(item.qualityScore);
                                    return (
                                      <span className={`text-[9px] font-black px-1 py-0.5 border rounded-none ${info.color}`}>
                                        {item.qualityScore}★ ({info.text})
                                      </span>
                                    );
                                  })()}
                                </div>
                              </div>
                              <div>
                                <span className="text-stone-500 block text-[9px] font-black uppercase">Shaffoflik:</span>
                                <div className="flex items-center gap-1 mt-0.5">
                                  {renderTransparencyBadge(item.transparencyLevel)}
                                  {item.transparencyScore && (() => {
                                    const info = getTransparencyScoreInfo(item.transparencyScore);
                                    return (
                                      <span className={`text-[9px] font-black px-1 py-0.5 border rounded-none ${info.color}`}>
                                        {item.transparencyScore}★ ({info.text})
                                      </span>
                                    );
                                  })()}
                                </div>
                              </div>
                              <div>
                                <span className="text-stone-500 block text-[9px] font-black uppercase">Intizom:</span>
                                <div className="flex items-center gap-1 mt-0.5">
                                  {renderDisciplineBadge(item.disciplineLevel)}
                                  {item.disciplineScore && (() => {
                                    const info = getDisciplineScoreInfo(item.disciplineScore);
                                    return (
                                      <span className={`text-[9px] font-black px-1 py-0.5 border rounded-none ${info.color}`}>
                                        {item.disciplineScore}★ ({info.text})
                                      </span>
                                    );
                                  })()}
                                </div>
                              </div>
                              <div>
                                <span className="text-stone-500 block text-[9px] font-black uppercase">Qo'shimcha:</span>
                                <span className="font-bold">{item.extras}</span>
                              </div>
                            </div>

                            <div>
                              <span className="text-stone-500 block text-[9px] font-black uppercase">Manzil:</span>
                              <span className="font-semibold text-black">{item.address}</span>
                            </div>

                            <div>
                              <span className="text-stone-500 block text-[9px] font-black uppercase">Javobgarlik:</span>
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-semibold text-black">{item.responsibility}</span>
                                {item.responsibilityScore && (() => {
                                  const info = getResponsibilityScoreInfo(item.responsibilityScore);
                                  return (
                                    <span className={`text-[9px] font-black px-1.5 py-0.5 border rounded-none ${info.color}`}>
                                      {item.responsibilityScore}★ ({info.text})
                                    </span>
                                  );
                                })()}
                              </div>
                            </div>

                            <div>
                              <span className="text-stone-500 block text-[9px] font-black uppercase mb-1">
                                Taklif qilinadigan mahsulotlar:
                              </span>
                              {item.products && item.products.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {item.products.map((p, pI) => (
                                    <span key={pI} className="px-2 py-0.5 bg-amber-300 border border-amber-600 font-black text-black text-[10px]">
                                      {p}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-stone-400 italic">Kiritilmagan</span>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* MOBIL & TABLET UCHUN IXCHAM KARTALAR REJIMI (TO'G'RIDAN-TO'G'RI OCHIQ, KO'RISH TUGMASISIZ) */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filteredAndSortedSuppliers.map((item) => {
            const isDelay = item.paymentCondition === "kechiktirib to'lash";

            return (
              <article
                key={item.id}
                className="bg-yellow-100/90 border-2 border-amber-400 p-3 space-y-2.5 shadow-xs hover:border-amber-600 transition text-black rounded-none flex flex-col justify-between"
              >
                {/* Header: Tartib raqam, Nom, Tahrirlash, O'chirish */}
                <div className="border-b-2 border-amber-300 pb-2 flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <span className="px-2 py-0.5 bg-amber-400 border border-amber-600 text-xs font-black text-black shrink-0 rounded-none">
                      #{item.orderNumber}
                    </span>
                    <div>
                      <h2 className="font-heading font-black text-sm text-black leading-snug">
                        {item.name}
                      </h2>
                      
                      {/* Faoliyat turi (To'g'ridan-to'g'ri ko'rinadi) */}
                      <div className="mt-1 flex flex-wrap gap-1">
                        {(item.activityTypes && item.activityTypes.length > 0
                          ? item.activityTypes
                          : typeof item.activityType === 'string'
                            ? item.activityType.split(',').map((s) => s.trim()).filter(Boolean)
                            : [item.activityType || 'jismoniy']
                        ).map((act) => (
                          <span
                            key={act}
                            className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-stone-800 bg-yellow-200 px-1.5 py-0.5 border border-amber-400"
                          >
                            {act === 'jismoniy' ? <UserCheck className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
                            {act}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Edit and Delete action buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => onEditSupplier(item)}
                      className="p-1.5 bg-yellow-200 hover:bg-amber-300 border border-amber-400 text-black transition cursor-pointer rounded-none"
                      title="Tahrirlash"
                    >
                      <Edit className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Haqiqatan ham "${item.name}" yetkazib beruvchisini o'chirmoqchimisiz?`)) {
                          onDeleteSupplier(item.id);
                        }
                      }}
                      className="p-1.5 bg-yellow-200 hover:bg-rose-200 border border-amber-400 hover:border-rose-400 text-black hover:text-rose-800 transition cursor-pointer rounded-none"
                      title="Yozuvni o'chirish"
                    >
                      <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                  </div>
                </div>

                {/* 14 Ta Ustunning barcha ma'lumotlari to'g'ridan-to'g'ri ixcham 2 ustunli to'r ichida */}
                <div className="grid grid-cols-2 gap-x-2.5 gap-y-2 text-xs">
                  
                  {/* 2. Sistema vaqti (To'g'ridan-to'g'ri ko'rinadi) */}
                  <div>
                    <span className="text-[9px] font-bold text-stone-600 block">2. Vaqt:</span>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-black">
                      <Clock className="w-3 h-3 text-stone-700 shrink-0" />
                      <span>{item.systemTime}</span>
                    </div>
                  </div>

                  {/* 6. Telefon (To'g'ridan-to'g'ri ko'rinadi) */}
                  <div>
                    <span className="text-[9px] font-bold text-stone-600 block">6. Telefon:</span>
                    <a
                      href={`tel:${item.phone.replace(/[^0-9+]/g, '')}`}
                      className="font-black text-black hover:underline flex items-center gap-1 text-[11px]"
                    >
                      <Phone className="w-3 h-3 text-stone-700 shrink-0" />
                      <span>{item.phone}</span>
                    </a>
                  </div>

                  {/* 5. Manzil */}
                  <div className="col-span-2">
                    <span className="text-[9px] font-bold text-stone-600 block">5. Manzil:</span>
                    <div className="flex items-start gap-1 font-semibold text-black text-xs">
                      <MapPin className="w-3 h-3 text-stone-700 shrink-0 mt-0.5" />
                      <span>{item.address}</span>
                    </div>
                  </div>

                  {/* 7. Pul o'tkazmalari */}
                  <div>
                    <span className="text-[9px] font-bold text-stone-600 block">7. O'tkazma:</span>
                    <span className="px-1.5 py-0.5 text-[10px] font-black bg-yellow-200 border border-amber-400 inline-block">
                      {item.paymentMethod}
                    </span>
                  </div>

                  {/* 8. To'lov sharti */}
                  <div>
                    <span className="text-[9px] font-bold text-stone-600 block">8. To'lov sharti:</span>
                    {isDelay ? (
                      <span className="px-1.5 py-0.5 text-[10px] font-black bg-amber-200 border border-amber-500 inline-block">
                        kechiktirib ({item.delayDays || 0} kun)
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 text-[10px] font-black bg-yellow-200 border border-amber-400 inline-block">
                        naqd joyida
                      </span>
                    )}
                  </div>

                  {/* 9. Sifat */}
                  <div>
                    <span className="text-[9px] font-bold text-stone-600 block">9. Sifat:</span>
                    <div className="flex items-center gap-1 flex-wrap mt-0.5">
                      {renderQualityBadge(item.qualityStability)}
                      {item.qualityScore && (() => {
                        const info = getQualityScoreInfo(item.qualityScore);
                        return (
                          <span
                            className={`text-[9px] font-black px-1 py-0.5 border rounded-none flex items-center gap-0.5 ${info.color}`}
                            title={`Sifat: ${item.qualityScore}★ — ${info.explanation}`}
                          >
                            <span>{item.qualityScore}★</span>
                            <span className="text-[8px] uppercase">({info.text})</span>
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  {/* 10. Shaffoflik */}
                  <div>
                    <span className="text-[9px] font-bold text-stone-600 block">10. Shaffoflik:</span>
                    <div className="flex items-center gap-1 flex-wrap mt-0.5">
                      {renderTransparencyBadge(item.transparencyLevel)}
                      {item.transparencyScore && (() => {
                        const info = getTransparencyScoreInfo(item.transparencyScore);
                        return (
                          <span
                            className={`text-[9px] font-black px-1 py-0.5 border rounded-none flex items-center gap-0.5 ${info.color}`}
                            title={`Shaffoflik: ${item.transparencyScore}★ — ${info.explanation}`}
                          >
                            <span>{item.transparencyScore}★</span>
                            <span className="text-[8px] uppercase">({info.text})</span>
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  {/* 12. Intizom */}
                  <div>
                    <span className="text-[9px] font-bold text-stone-600 block">12. Intizom:</span>
                    <div className="flex items-center gap-1 flex-wrap mt-0.5">
                      {renderDisciplineBadge(item.disciplineLevel)}
                      {item.disciplineScore && (() => {
                        const info = getDisciplineScoreInfo(item.disciplineScore);
                        return (
                          <span
                            className={`text-[9px] font-black px-1 py-0.5 border rounded-none flex items-center gap-0.5 ${info.color}`}
                            title={`Intizom: ${item.disciplineScore}★ — ${info.explanation}`}
                          >
                            <span>{item.disciplineScore}★</span>
                            <span className="text-[8px] uppercase">({info.text})</span>
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  {/* 13. Qo'shimcha (Yetkazib berishda baho bo'lmasin) */}
                  <div>
                    <span className="text-[9px] font-bold text-stone-600 block">13. Qo'shimcha:</span>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-black bg-yellow-200 border border-amber-400 mt-0.5">
                      <Truck className="w-3 h-3 text-stone-800" />
                      {item.extras.replace('yetkazib berish ', '')}
                    </span>
                  </div>

                  {/* 11. Javobgarlik */}
                  <div className="col-span-2">
                    <span className="text-[9px] font-bold text-stone-600 block">11. Javobgarlik:</span>
                    <div className="flex items-center justify-between gap-2 bg-yellow-200/50 p-1.5 border border-amber-300 mt-0.5">
                      <span className="font-semibold text-black text-xs">
                        {item.responsibility}
                      </span>
                      {item.responsibilityScore && (() => {
                        const info = getResponsibilityScoreInfo(item.responsibilityScore);
                        return (
                          <span
                            className={`shrink-0 inline-flex items-center gap-0.5 text-[9px] font-black px-1.5 py-0.5 border rounded-none ${info.color}`}
                            title={`Javobgarlik: ${item.responsibilityScore}★ — ${info.explanation}`}
                          >
                            <span>{item.responsibilityScore}★</span>
                            <span className="text-[8px] uppercase">({info.text})</span>
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  {/* 14. Taklif qilinadigan mahsulotlar ro'yxati */}
                  <div className="col-span-2 bg-yellow-200/60 p-2 border border-amber-300">
                    <span className="text-[9px] font-black uppercase text-stone-800 block mb-1 flex items-center gap-1">
                      <Package className="w-3 h-3" />
                      14. Taklif qilinadigan mahsulotlar:
                    </span>
                    {item.products && item.products.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {item.products.map((prod, pIdx) => (
                          <span
                            key={pIdx}
                            className="inline-block px-1.5 py-0.5 text-[10px] font-black bg-amber-300 text-black border border-amber-600 rounded-none shadow-2xs"
                          >
                            {prod}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-stone-500 italic text-[11px]">Mahsulot kiritilmagan (bo'sh)</span>
                    )}
                  </div>

                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
