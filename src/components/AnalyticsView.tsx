import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Calendar,
  Droplet,
  Wrench,
  Tag,
  Building2,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  CheckCircle2,
  Info,
  Clock,
  Layers,
  FileSpreadsheet,
  Eye,
  EyeOff,
  Phone,
  MapPin,
  ShieldCheck,
  Award,
  Zap,
  History,
  AlertCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { AutoPart, Supplier } from '../types';
import * as XLSX from 'xlsx';
import { formatUSD } from '../utils/formatCurrency';

interface AnalyticsViewProps {
  parts: AutoPart[];
  suppliers?: Supplier[];
}

// 10 ta yetkazib beruvchi uchun aniq ajralib turuvchi yuqori kontrastli ranglar palitrasi
const SUPPLIER_COLORS = [
  '#b45309', // Amber-700
  '#2563eb', // Blue-600
  '#059669', // Emerald-600
  '#dc2626', // Red-600
  '#7c3aed', // Purple-600
  '#db2777', // Pink-600
  '#0891b2', // Cyan-600
  '#ea580c', // Orange-600
  '#4f46e5', // Indigo-600
  '#16a34a', // Green-600
];

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ parts, suppliers = [] }) => {
  // 1-BOSQICH: Sana oralig'i (Boshlanish va tugash sanasi)
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // 2-BOSQICH: Ehtiyot qism turi/nomi (Bazadagi mavjud turlar)
  const [selectedPartName, setSelectedPartName] = useState<string>('');

  // 3-BOSQICH: Brend tanlash (Tanlangan qismga mos brendlar)
  const [selectedBrand, setSelectedBrand] = useState<string>('ALL');

  // Grafik sozlamalari: "natural" (egrisimon oval) default qilib qo'yildi
  const [curveType, setCurveType] = useState<'natural' | 'monotone' | 'linear'>('natural');
  const [showDataLabels, setShowDataLabels] = useState<boolean>(false);
  const [hiddenSuppliers, setHiddenSuppliers] = useState<Set<string>>(new Set());

  // Yetkazib beruvchilar profil ma'lumotlari map'i (nomi bo'yicha)
  const suppliersMap = useMemo(() => {
    const map = new Map<string, Supplier>();
    suppliers.forEach((s) => {
      if (s.name) {
        map.set(s.name.trim().toLowerCase(), s);
      }
    });
    return map;
  }, [suppliers]);

  // 1. Bazadagi barcha unikal ehtiyot qism nomlari (Har bir nom ro'yxatda faqat bir marta chiqadi)
  const uniquePartNames = useMemo(() => {
    const map = new Map<string, number>();
    parts.forEach((p) => {
      const name = p.partName?.trim();
      if (name) {
        map.set(name, (map.get(name) || 0) + 1);
      }
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [parts]);

  // Agar ehtiyot qism hali tanlanmagan bo'lsa, birinchisini avtomatik tanlaymiz
  const activePartName = useMemo(() => {
    if (selectedPartName && uniquePartNames.some((p) => p.name === selectedPartName)) {
      return selectedPartName;
    }
    return uniquePartNames.length > 0 ? uniquePartNames[0].name : '';
  }, [selectedPartName, uniquePartNames]);

  // 2. Tanlangan ehtiyot qismga tegishli mavjud brendlar ro'yxati
  const availableBrands = useMemo(() => {
    if (!activePartName) return [];
    const brandSet = new Set<string>();
    parts.forEach((p) => {
      if (p.partName?.trim().toLowerCase() === activePartName.trim().toLowerCase()) {
        if (p.brand && p.brand.trim()) {
          brandSet.add(p.brand.trim());
        }
      }
    });
    return Array.from(brandSet).sort();
  }, [parts, activePartName]);

  // Sana bo'yicha tezkor filtrlar
  const handleQuickDateFilter = (type: 'all' | '30d' | '3m' | '6m' | 'year') => {
    const today = new Date();
    const endStr = today.toISOString().split('T')[0];

    if (type === 'all') {
      setStartDate('');
      setEndDate('');
      return;
    }

    const start = new Date();
    if (type === '30d') {
      start.setDate(today.getDate() - 30);
    } else if (type === '3m') {
      start.setMonth(today.getMonth() - 3);
    } else if (type === '6m') {
      start.setMonth(today.getMonth() - 6);
    } else if (type === 'year') {
      start.setFullYear(today.getFullYear(), 0, 1);
    }

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(endStr);
  };

  // 3. Tanlangan muddat, ehtiyot qism va brend bo'yicha filtrlangan yozuvlar
  const filteredData = useMemo(() => {
    if (!activePartName) return [];

    return parts.filter((item) => {
      // Qism nomi mosligi
      const partMatches =
        item.partName?.trim().toLowerCase() === activePartName.trim().toLowerCase();
      if (!partMatches) return false;

      // Brend mosligi
      if (selectedBrand !== 'ALL') {
        if (item.brand?.trim().toLowerCase() !== selectedBrand.trim().toLowerCase()) {
          return false;
        }
      }

      // Sana oralig'i mosligi
      const itemDate = item.date || '';
      if (startDate && itemDate < startDate) return false;
      if (endDate && itemDate > endDate) return false;

      return true;
    });
  }, [parts, activePartName, selectedBrand, startDate, endDate]);

  // Xronologik tartibda saralash (eng avvalgi sanadan oxirgisiga qarab)
  const sortedRecords = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      const dateA = a.date || '';
      const dateB = b.date || '';
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      return (a.createdAt || 0) - (b.createdAt || 0);
    });
  }, [filteredData]);

  // Ushbu filtrda ishtirok etayotgan unikal yetkazib beruvchilar
  const involvedSuppliers = useMemo(() => {
    const set = new Set<string>();
    sortedRecords.forEach((item) => {
      if (item.supplierName && item.supplierName.trim()) {
        set.add(item.supplierName.trim());
      }
    });
    return Array.from(set);
  }, [sortedRecords]);

  // Har bir yetkazib beruvchi uchun alohida chiziq rangi
  const supplierColorMap = useMemo(() => {
    const map = new Map<string, string>();
    involvedSuppliers.forEach((name, idx) => {
      map.set(name, SUPPLIER_COLORS[idx % SUPPLIER_COLORS.length]);
    });
    return map;
  }, [involvedSuppliers]);

  // Har bir yetkazib beruvchining yozuvlar soni
  const supplierCounts = useMemo(() => {
    const map = new Map<string, number>();
    sortedRecords.forEach((item) => {
      const name = item.supplierName?.trim();
      if (name) {
        map.set(name, (map.get(name) || 0) + 1);
      }
    });
    return map;
  }, [sortedRecords]);

  // Chiziqni yashirish / ko'rsatishni boshqarish
  const toggleSupplierLine = (supplier: string) => {
    setHiddenSuppliers((prev) => {
      const next = new Set(prev);
      if (next.has(supplier)) {
        next.delete(supplier);
      } else {
        next.add(supplier);
      }
      return next;
    });
  };

  const showAllLines = () => {
    setHiddenSuppliers(new Set());
  };

  // =========================================================================
  // BUGUNGI KUNGA ENG ARZONINI ANIQLASH VA TAHLIL QILISH
  // Har bir yetkazib beruvchining eng oxirgi (joriy) narxi olinadi
  // =========================================================================
  const currentSupplierQuotes = useMemo(() => {
    const map = new Map<string, AutoPart>();
    // sortedRecords xronologik o'sish tartibida bo'lgani uchun oxirgi qiymat - eng yangisi bo'ladi
    sortedRecords.forEach((item) => {
      if (item.supplierName) {
        map.set(item.supplierName.trim(), item);
      }
    });
    return Array.from(map.values());
  }, [sortedRecords]);

  // Bugungi kunga / joriy eng arzon narx
  const cheapestCurrentPrice = useMemo(() => {
    if (currentSupplierQuotes.length === 0) return 0;
    return Math.min(...currentSupplierQuotes.map((q) => Number(q.price) || 0));
  }, [currentSupplierQuotes]);

  // Eng arzon narxni taklif qilgan barcha yetkazib beruvchilar ro'yxati
  const cheapestSuppliersList = useMemo(() => {
    if (!cheapestCurrentPrice || currentSupplierQuotes.length === 0) return [];
    return currentSupplierQuotes.filter((q) => Number(q.price) === cheapestCurrentPrice);
  }, [currentSupplierQuotes, cheapestCurrentPrice]);

  // Joriy o'rtacha narx
  const currentAvgPrice = useMemo(() => {
    if (currentSupplierQuotes.length === 0) return 0;
    const sum = currentSupplierQuotes.reduce((acc, q) => acc + (Number(q.price) || 0), 0);
    return Number((sum / currentSupplierQuotes.length).toFixed(4));
  }, [currentSupplierQuotes]);

  // Tahliliy chizmalar uchun ma'lumotlarni tayyorlash:
  // Har bir sana bitta X o'qi nuqtasi, har bir yetkazib beruvchi o'sha sanadagi narx chizmasiga ega bo'ladi
  const chartData = useMemo(() => {
    if (sortedRecords.length === 0) return [];

    const dateMap = new Map<string, any>();

    sortedRecords.forEach((item) => {
      const dateKey = item.date;
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, {
          date: dateKey,
        });
      }
      const entry = dateMap.get(dateKey);
      entry[item.supplierName] = item.price;

      if (!entry._details) entry._details = {};
      entry._details[item.supplierName] = {
        price: item.price,
        brand: item.brand,
        source: item.source,
        comment: item.comment,
        systemTime: item.systemTime,
      };
    });

    return Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [sortedRecords]);

  // Narxlar statistikasi
  const stats = useMemo(() => {
    if (sortedRecords.length === 0) return null;

    let minPrice = Infinity;
    let minItem: AutoPart | null = null;
    let maxPrice = -Infinity;
    let maxItem: AutoPart | null = null;
    let totalPrice = 0;

    sortedRecords.forEach((item) => {
      const p = Number(item.price) || 0;
      totalPrice += p;
      if (p < minPrice) {
        minPrice = p;
        minItem = item;
      }
      if (p > maxPrice) {
        maxPrice = p;
        maxItem = item;
      }
    });

    const avgPrice = Number((totalPrice / sortedRecords.length).toFixed(4));
    const firstPrice = sortedRecords[0]?.price || 0;
    const lastPrice = sortedRecords[sortedRecords.length - 1]?.price || 0;
    const priceDiff = lastPrice - firstPrice;
    const priceDiffPercent = firstPrice > 0 ? ((priceDiff / firstPrice) * 100).toFixed(1) : '0';

    return {
      minPrice,
      minItem,
      maxPrice,
      maxItem,
      avgPrice,
      firstPrice,
      lastPrice,
      priceDiff,
      priceDiffPercent,
      totalEntries: sortedRecords.length,
    };
  }, [sortedRecords]);

  // Yetkazib beruvchilar bo'yicha qiyosiy ko'rsatkichlar
  const supplierSummary = useMemo(() => {
    const map = new Map<
      string,
      {
        count: number;
        minPrice: number;
        maxPrice: number;
        latestPrice: number;
        latestDate: string;
        allPrices: number[];
      }
    >();

    sortedRecords.forEach((item) => {
      const name = item.supplierName;
      if (!map.has(name)) {
        map.set(name, {
          count: 0,
          minPrice: Infinity,
          maxPrice: -Infinity,
          latestPrice: item.price,
          latestDate: item.date,
          allPrices: [],
        });
      }
      const data = map.get(name)!;
      data.count += 1;
      data.allPrices.push(item.price);
      if (item.price < data.minPrice) data.minPrice = item.price;
      if (item.price > data.maxPrice) data.maxPrice = item.price;
      data.latestPrice = item.price;
      data.latestDate = item.date;
    });

    return Array.from(map.entries()).map(([supplier, d]) => {
      const avg = Number((d.allPrices.reduce((a, b) => a + b, 0) / d.allPrices.length).toFixed(4));
      return {
        supplier,
        count: d.count,
        minPrice: d.minPrice,
        maxPrice: d.maxPrice,
        latestPrice: d.latestPrice,
        latestDate: d.latestDate,
        avgPrice: avg,
        color: supplierColorMap.get(supplier) || '#000',
      };
    });
  }, [sortedRecords, supplierColorMap]);

  // =========================================================================
  // FOIZ O'ZGARISHI XRONOLOGIYASI MA'LUMOTLARI
  // Har bir qadamda oldingi narxga va boshlang'ich narxga nisbatan % hisoblanadi
  // =========================================================================
  const priceChangeTimeline = useMemo(() => {
    if (sortedRecords.length === 0) return [];

    const initialPrice = Number(sortedRecords[0]?.price) || 0;

    return sortedRecords.map((item, idx) => {
      const currentPrice = Number(item.price) || 0;
      const prevItem = idx > 0 ? sortedRecords[idx - 1] : null;
      const prevPrice = prevItem ? Number(prevItem.price) || 0 : currentPrice;

      // Oldingi narxga nisbatan
      const stepDiff = currentPrice - prevPrice;
      const stepPercent = prevPrice > 0 ? ((stepDiff / prevPrice) * 100).toFixed(1) : '0';

      // Boshlang'ich narxga nisbatan umumiy
      const totalDiff = currentPrice - initialPrice;
      const totalPercent = initialPrice > 0 ? ((totalDiff / initialPrice) * 100).toFixed(1) : '0';

      return {
        idx: idx + 1,
        item,
        currentPrice,
        prevPrice,
        stepDiff,
        stepPercent: Number(stepPercent),
        totalDiff,
        totalPercent: Number(totalPercent),
        isFirst: idx === 0,
      };
    });
  }, [sortedRecords]);

  // Excel eksport
  const handleExportAnalytics = () => {
    if (sortedRecords.length === 0) {
      alert("Eksport qilish uchun ma'lumotlar mavjud emas");
      return;
    }

    const dataToExport = sortedRecords.map((item, idx) => ({
      '№': idx + 1,
      'Sana': item.date,
      'Vaqt': item.systemTime,
      'Moy nomi': item.partName,
      'Brend': item.brand,
      'Yetkazib beruvchi': item.supplierName,
      'Narxi ($ / USD)': item.price,
      'Manba': item.source,
      'Izoh': item.comment,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Narxlar tahlili');

    const fileName = `Daewoo_Tahlil_${activePartName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // Tooltip komponenti (hech qanday "(Line)" so'zlarisiz)
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-yellow-50 border-2 border-amber-500 p-2.5 sm:p-3 shadow-xl text-black text-xs font-sans max-w-xs sm:max-w-sm rounded-none">
          <div className="flex items-center gap-1.5 border-b border-amber-300 pb-1.5 mb-2 font-mono font-black text-stone-800">
            <Calendar className="w-3.5 h-3.5 text-amber-700" />
            <span>Sana: {label}</span>
          </div>

          <div className="text-[10px] sm:text-[11px] font-bold text-stone-600 mb-1.5">
            Yetkazib beruvchilar narxlari:
          </div>

          <div className="space-y-1.5 max-h-56 overflow-y-auto">
            {payload.map((entry: any, index: number) => {
              const supplier = entry.name;
              const price = entry.value;
              const color = entry.color;
              return (
                <div
                  key={`item-${index}`}
                  className="p-1.5 bg-white border border-amber-200 text-[11px] flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="w-3 h-1 shrink-0 inline-block border border-black/30"
                      style={{ backgroundColor: color }}
                    />
                    <span className="font-bold text-stone-900 truncate">{supplier}</span>
                  </div>
                  <span className="font-mono font-black text-amber-900 whitespace-nowrap">
                    {formatUSD(price)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      id="analytics-container"
      className="w-full max-w-full min-w-0 overflow-hidden space-y-3 sm:space-y-4 text-black text-xs sm:text-sm"
    >
      {/* 1. Header Toolbar (Mobilga moslashtirilgan, ixcham) */}
      <div className="bg-yellow-100/95 border-2 border-amber-400 p-2.5 sm:p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 rounded-none">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="p-1.5 sm:p-2 bg-amber-400 border border-amber-600 text-black shrink-0">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <h1 className="text-sm sm:text-base md:text-lg font-black uppercase tracking-wider text-black font-heading truncate">
                Moylar Narxlari Tahlili
              </h1>
              <span className="px-1.5 py-0.5 bg-amber-300 border border-amber-500 text-[10px] sm:text-xs font-black shrink-0">
                {uniquePartNames.length} xil mahsulot
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] font-bold text-stone-700 truncate">
              Tanlangan muddatda moy narxining o'zgarishi — har bir yetkazib beruvchi alohida chiziq sifatida
            </p>
          </div>
        </div>

        {/* Excel Export tugmasi */}
        {sortedRecords.length > 0 && (
          <button
            type="button"
            onClick={handleExportAnalytics}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 sm:py-2 bg-amber-200 hover:bg-amber-300 border-2 border-amber-500 text-black text-xs font-black transition cursor-pointer active:scale-95 shadow-2xs rounded-none shrink-0"
            title="Tahlil natijalarini Excel formatida yuklab olish"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-800 stroke-[2.5]" />
            <span>Excelga yuklash</span>
          </button>
        )}
      </div>

      {/* 2. IYERARXIK FILTRLAR PANELI:
          1-qadam: Sana muddati
          2-qadam: Moy turi/nomi
          3-qadam: Brend tanlash
      */}
      <div className="bg-white border-2 border-amber-400 p-2.5 sm:p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-3.5">
          {/* 1-QADAM: SANA MUDDATI */}
          <div className="bg-yellow-50/70 border border-amber-300 p-2 sm:p-2.5 flex flex-col justify-between space-y-2">
            <div>
              <div className="flex items-center gap-1 text-black font-black text-[11px] sm:text-xs uppercase mb-1">
                <Calendar className="w-3.5 h-3.5 text-amber-700 stroke-[2.5]" />
                <span>1-Qadam: Sana muddati</span>
              </div>
              <p className="text-[10px] text-stone-600 font-bold">
                Tahlil qilinadigan sana oralig'i:
              </p>
            </div>

            {/* Sana inputlari */}
            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <span className="text-[9px] uppercase font-bold text-stone-600 block">Dan:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-1.5 py-1 text-[11px] border border-amber-400 bg-white font-bold text-black focus:outline-none rounded-none"
                />
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-stone-600 block">Gacha:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-1.5 py-1 text-[11px] border border-amber-400 bg-white font-bold text-black focus:outline-none rounded-none"
                />
              </div>
            </div>

            {/* Tezkor oraliq tugmalari */}
            <div className="flex items-center gap-1 flex-wrap pt-1 border-t border-amber-200">
              <button
                type="button"
                onClick={() => handleQuickDateFilter('all')}
                className={`px-1.5 py-0.5 text-[10px] font-black border transition cursor-pointer ${
                  !startDate && !endDate
                    ? 'bg-amber-400 border-amber-600 text-black'
                    : 'bg-white hover:bg-yellow-200 border-amber-300 text-stone-700'
                }`}
              >
                Barchasi
              </button>
              <button
                type="button"
                onClick={() => handleQuickDateFilter('30d')}
                className="px-1.5 py-0.5 text-[10px] font-black bg-white hover:bg-yellow-200 border border-amber-300 text-stone-700 cursor-pointer"
              >
                30 kun
              </button>
              <button
                type="button"
                onClick={() => handleQuickDateFilter('3m')}
                className="px-1.5 py-0.5 text-[10px] font-black bg-white hover:bg-yellow-200 border border-amber-300 text-stone-700 cursor-pointer"
              >
                3 oy
              </button>
              <button
                type="button"
                onClick={() => handleQuickDateFilter('year')}
                className="px-1.5 py-0.5 text-[10px] font-black bg-white hover:bg-yellow-200 border border-amber-300 text-stone-700 cursor-pointer"
              >
                Joriy yil
              </button>
            </div>
          </div>

          {/* 2-QADAM: MOY TURI */}
          <div className="bg-yellow-50/70 border border-amber-300 p-2 sm:p-2.5 flex flex-col justify-between space-y-2">
            <div>
              <div className="flex items-center gap-1 text-black font-black text-[11px] sm:text-xs uppercase mb-1">
                <Droplet className="w-3.5 h-3.5 text-amber-700 stroke-[2.5]" />
                <span>2-Qadam: Moy turi</span>
              </div>
              <p className="text-[10px] text-stone-600 font-bold">
                Mavjud unikal moylardan tanlang:
              </p>
            </div>

            <div>
              {uniquePartNames.length === 0 ? (
                <div className="p-2 bg-yellow-100 border border-amber-300 text-xs font-bold text-stone-700">
                  Bazaga hali moy kiritilmagan
                </div>
              ) : (
                <select
                  value={activePartName}
                  onChange={(e) => {
                    setSelectedPartName(e.target.value);
                    setSelectedBrand('ALL');
                  }}
                  className="w-full px-2 py-1.5 text-xs border-2 border-amber-400 bg-white font-black text-black focus:outline-none rounded-none truncate"
                >
                  {uniquePartNames.map((item) => (
                    <option key={item.name} value={item.name}>
                      {item.name} ({item.count} ta qayd)
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="text-[10px] sm:text-[11px] font-bold text-stone-700 flex items-center justify-between border-t border-amber-200 pt-1">
              <span>Tanlangan:</span>
              <span className="font-black text-black truncate max-w-[170px]">
                {activePartName || 'Tanlanmagan'}
              </span>
            </div>
          </div>

          {/* 3-QADAM: BREND TANLASH */}
          <div className="bg-yellow-50/70 border border-amber-300 p-2 sm:p-2.5 flex flex-col justify-between space-y-2">
            <div>
              <div className="flex items-center gap-1 text-black font-black text-[11px] sm:text-xs uppercase mb-1">
                <Tag className="w-3.5 h-3.5 text-amber-700 stroke-[2.5]" />
                <span>3-Qadam: Brend tanlash</span>
              </div>
              <p className="text-[10px] text-stone-600 font-bold">
                «{activePartName || 'Mahsulot'}» uchun brend:
              </p>
            </div>

            <div>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                disabled={availableBrands.length === 0}
                className="w-full px-2 py-1.5 text-xs border-2 border-amber-400 bg-white font-black text-black focus:outline-none rounded-none disabled:bg-stone-100 disabled:text-stone-400 truncate"
              >
                <option value="ALL">-- Barcha brendlar ({availableBrands.length} ta) --</option>
                {availableBrands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1 flex-wrap border-t border-amber-200 pt-1 overflow-x-auto max-h-12">
              <button
                type="button"
                onClick={() => setSelectedBrand('ALL')}
                className={`px-1.5 py-0.5 text-[10px] font-black border transition cursor-pointer ${
                  selectedBrand === 'ALL'
                    ? 'bg-amber-400 border-amber-600 text-black'
                    : 'bg-white hover:bg-yellow-200 border-amber-300 text-stone-700'
                }`}
              >
                Barchasi
              </button>
              {availableBrands.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setSelectedBrand(b)}
                  className={`px-1.5 py-0.5 text-[10px] font-black border transition cursor-pointer ${
                    selectedBrand === b
                      ? 'bg-amber-400 border-amber-600 text-black'
                      : 'bg-white hover:bg-yellow-200 border-amber-300 text-stone-700'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3 TA QADAMNING PASTIDA: BUGUNGI KUNGA ENG ARZONINI KO'RSATISH VA BIR NECHTA
          YETKAZIB BERUVCHIDA BIR XIL BO'LSA, HAR BIRINI TAHLILIY KO'RSATISH */}
      {/* ========================================================================= */}
      {activePartName && cheapestSuppliersList.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-50 via-yellow-50 to-emerald-50 border-2 border-emerald-600 p-3 sm:p-4 shadow-sm space-y-3">
          {/* Header xabari */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b-2 border-emerald-300 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-600 text-white shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-black text-xs sm:text-sm uppercase tracking-wide text-emerald-950 font-heading">
                    Bugungi kunga eng arzon taklif
                  </h3>
                  {cheapestSuppliersList.length > 1 ? (
                    <span className="px-2 py-0.5 bg-amber-300 border border-amber-600 text-black text-[10px] font-black uppercase">
                      {cheapestSuppliersList.length} ta yetkazib beruvchida bir xil narx!
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-emerald-200 border border-emerald-600 text-emerald-950 text-[10px] font-black uppercase">
                      1 ta yetkazib beruvchi
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-bold text-stone-700">
                  Mahsulot: <span className="text-black font-black font-heading">{activePartName}</span>{' '}
                  {selectedBrand !== 'ALL' && <span className="text-amber-800">({selectedBrand})</span>}
                </p>
              </div>
            </div>

            {/* Narx ko'rsatkichi */}
            <div className="flex items-center gap-2 shrink-0 bg-white border-2 border-emerald-600 px-3 py-1.5 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-stone-500">Eng past narx:</span>
              <span className="font-mono font-black text-sm sm:text-base text-emerald-900">
                {formatUSD(cheapestCurrentPrice)}
              </span>
              {currentAvgPrice > cheapestCurrentPrice && (
                <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-1 py-0.5 border border-emerald-400">
                  -{formatUSD(currentAvgPrice - cheapestCurrentPrice)} arzon
                </span>
              )}
            </div>
          </div>

          {/* Agar bir nechta yetkazib beruvchida narx bir xil bo'lsa yoki bitta bo'lsa,
              har birining to'liq tahliliy ma'lumotlari kartochkalari */}
          <div
            className={`grid grid-cols-1 ${
              cheapestSuppliersList.length === 1
                ? 'md:grid-cols-1'
                : cheapestSuppliersList.length === 2
                ? 'md:grid-cols-2'
                : 'md:grid-cols-2 lg:grid-cols-3'
            } gap-3`}
          >
            {cheapestSuppliersList.map((quoteItem, qIdx) => {
              const supplierProfile = suppliersMap.get(quoteItem.supplierName.trim().toLowerCase());
              const supplierColor = supplierColorMap.get(quoteItem.supplierName.trim()) || '#059669';

              return (
                <div
                  key={`${quoteItem.supplierName}-${qIdx}`}
                  className="bg-white border-2 border-emerald-500 p-3 shadow-xs space-y-2.5 text-black flex flex-col justify-between"
                >
                  {/* Yetkazib beruvchi nomi va unvoni */}
                  <div className="space-y-1.5 border-b border-emerald-200 pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className="w-3.5 h-3.5 inline-block shrink-0 border border-black/30"
                          style={{ backgroundColor: supplierColor }}
                        />
                        <h4 className="font-black text-xs sm:text-sm text-black break-words font-heading">
                          {quoteItem.supplierName}
                        </h4>
                      </div>
                      <span className="px-1.5 py-0.5 bg-emerald-100 border border-emerald-400 font-mono font-black text-[10px] text-emerald-900 shrink-0">
                        №{qIdx + 1}
                      </span>
                    </div>

                    {/* Faoliyat turi va aloqa */}
                    <div className="flex items-center gap-2 flex-wrap text-[10px]">
                      {supplierProfile?.activityType && (
                        <span className="px-1.5 py-0.5 bg-yellow-200 border border-amber-400 font-bold uppercase text-black">
                          Faoliyat: {supplierProfile.activityType}
                        </span>
                      )}
                      {quoteItem.brand && (
                        <span className="px-1.5 py-0.5 bg-amber-100 border border-amber-400 font-black uppercase text-amber-900">
                          Brend: {quoteItem.brand}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tahliliy ko'rsatkichlar to'plami */}
                  <div className="space-y-1.5 text-[11px]">
                    {/* Telefon raqami */}
                    {supplierProfile?.phone ? (
                      <div className="flex items-center gap-1.5 text-stone-800 bg-yellow-50/70 p-1 border border-amber-200">
                        <Phone className="w-3 h-3 text-amber-800 shrink-0" />
                        <span className="text-stone-500 text-[10px]">Aloqa:</span>
                        <a
                          href={`tel:${supplierProfile.phone.replace(/[^0-9+]/g, '')}`}
                          className="font-mono font-black text-blue-800 hover:underline"
                        >
                          {supplierProfile.phone}
                        </a>
                      </div>
                    ) : null}

                    {/* Manzili */}
                    {supplierProfile?.address ? (
                      <div className="flex items-start gap-1.5 text-stone-700">
                        <MapPin className="w-3 h-3 text-amber-800 shrink-0 mt-0.5" />
                        <span className="text-[10px] line-clamp-1" title={supplierProfile.address}>
                          {supplierProfile.address}
                        </span>
                      </div>
                    ) : null}

                    {/* To'lov va Yetkazib berish shartlari */}
                    <div className="grid grid-cols-2 gap-1.5 bg-yellow-50/80 p-1.5 border border-amber-200 text-[10px]">
                      <div>
                        <span className="text-stone-500 block uppercase font-bold text-[9px]">To'lov sharti:</span>
                        <span className="font-bold text-black">
                          {supplierProfile?.paymentCondition || 'Belgilanmagan'}
                          {supplierProfile?.delayDays ? ` (${supplierProfile.delayDays} kun)` : ''}
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-500 block uppercase font-bold text-[9px]">Yetkazib berish:</span>
                        <span className="font-bold text-black">
                          {supplierProfile?.extras || 'Mavjud'}
                        </span>
                      </div>
                    </div>

                    {/* Sifat, Shaffoflik va Intizom darajasi */}
                    {supplierProfile && (
                      <div className="grid grid-cols-3 gap-1 text-[9px] font-bold text-center">
                        <div className="p-1 bg-white border border-amber-200">
                          <span className="text-stone-500 block">Sifat:</span>
                          <span className="text-emerald-800 font-black">{supplierProfile.qualityStability}</span>
                        </div>
                        <div className="p-1 bg-white border border-amber-200">
                          <span className="text-stone-500 block">Shaffoflik:</span>
                          <span className="text-stone-800 font-black">{supplierProfile.transparencyLevel}</span>
                        </div>
                        <div className="p-1 bg-white border border-amber-200">
                          <span className="text-stone-500 block">Intizom:</span>
                          <span className="text-stone-800 font-black">{supplierProfile.disciplineLevel}</span>
                        </div>
                      </div>
                    )}

                    {/* Qayd vaqti, Manba va Izoh */}
                    <div className="border-t border-emerald-200 pt-1 text-[10px] text-stone-600 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span>Oxirgi qayd:</span>
                        <span className="font-mono font-bold text-black">{quoteItem.date} {quoteItem.systemTime}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Manba:</span>
                        <span className="font-bold text-black">{quoteItem.source || '—'}</span>
                      </div>
                      {quoteItem.comment && (
                        <div className="text-[10px] text-stone-700 italic border-l-2 border-emerald-400 pl-1.5 mt-1">
                          «{quoteItem.comment}»
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pastki qism: Afzallik xulosasi */}
                  <div className="pt-1.5 border-t border-emerald-200 flex items-center justify-between text-[10px]">
                    <span className="font-mono font-black text-emerald-900">
                      {formatUSD(quoteItem.price)}
                    </span>
                    <span className="inline-flex items-center gap-1 font-black text-emerald-800">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Eng yaxshi narx
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. ASOSIY TAHLIL VA GRAFIK QISMI */}
      {sortedRecords.length === 0 ? (
        <div className="p-6 sm:p-8 text-center bg-yellow-50 border-2 border-amber-300 text-black space-y-2">
          <Info className="w-7 h-7 sm:w-8 sm:h-8 text-amber-600 mx-auto opacity-75" />
          <h3 className="font-black text-xs sm:text-sm uppercase">Tanlangan parametrlar bo'yicha ma'lumot topilmadi</h3>
          <p className="text-[11px] sm:text-xs text-stone-600 max-w-md mx-auto">
            Belgilangan sana oralig'ida yoki brend bo'yicha yozuvlar mavjud emas. Sana oralig'ini kengaytirib ko'ring yoki «Barcha brendlar» variantini tanlang.
          </p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {/* STATISTIKA BLOKLARI (Summary Cards) */}
          {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
              {/* Eng arzon narx */}
              <div className="bg-white border-2 border-amber-400 p-2.5 sm:p-3 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-xs font-black text-emerald-800">
                  <span className="uppercase text-[10px]">Eng arzon narx</span>
                  <ArrowDownRight className="w-4 h-4 stroke-[3]" />
                </div>
                <p className="text-base sm:text-lg font-mono font-black text-black">
                  {formatUSD(stats.minPrice)}
                </p>
                <div className="text-[10px] text-stone-700 font-bold truncate">
                  <span className="text-stone-500">Yetkazib beruvchi:</span>{' '}
                  <span className="text-black font-black">{stats.minItem?.supplierName}</span>
                </div>
                <div className="text-[9px] text-stone-500 font-mono truncate">
                  Sana: {stats.minItem?.date} ({stats.minItem?.brand})
                </div>
              </div>

              {/* Eng yuqori narx */}
              <div className="bg-white border-2 border-amber-400 p-2.5 sm:p-3 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-xs font-black text-rose-800">
                  <span className="uppercase text-[10px]">Eng yuqori narx</span>
                  <ArrowUpRight className="w-4 h-4 stroke-[3]" />
                </div>
                <p className="text-base sm:text-lg font-mono font-black text-black">
                  {formatUSD(stats.maxPrice)}
                </p>
                <div className="text-[10px] text-stone-700 font-bold truncate">
                  <span className="text-stone-500">Yetkazib beruvchi:</span>{' '}
                  <span className="text-black font-black">{stats.maxItem?.supplierName}</span>
                </div>
                <div className="text-[9px] text-stone-500 font-mono truncate">
                  Sana: {stats.maxItem?.date} ({stats.maxItem?.brand})
                </div>
              </div>

              {/* O'rtacha narx */}
              <div className="bg-white border-2 border-amber-400 p-2.5 sm:p-3 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-xs font-black text-stone-800">
                  <span className="uppercase text-[10px]">O'rtacha narx</span>
                  <DollarSign className="w-4 h-4 stroke-[2.5]" />
                </div>
                <p className="text-base sm:text-lg font-mono font-black text-black">
                  {formatUSD(stats.avgPrice)}
                </p>
                <div className="text-[10px] text-stone-700 font-bold">
                  <span>Jami:</span>{' '}
                  <span className="text-black font-black">{stats.totalEntries} ta qayd</span>
                </div>
                <div className="text-[9px] text-stone-500">
                  {involvedSuppliers.length} ta yetkazib beruvchi bo'yicha
                </div>
              </div>

              {/* Oxirgi narx va o'zgarish farqi */}
              <div className="bg-white border-2 border-amber-400 p-2.5 sm:p-3 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-xs font-black text-stone-800">
                  <span className="uppercase text-[10px]">Oxirgi narx dinamikasi</span>
                  {stats.priceDiff > 0 ? (
                    <span className="flex items-center text-rose-700 font-black text-xs">
                      <ArrowUpRight className="w-3.5 h-3.5" /> +{stats.priceDiffPercent}%
                    </span>
                  ) : stats.priceDiff < 0 ? (
                    <span className="flex items-center text-emerald-700 font-black text-xs">
                      <ArrowDownRight className="w-3.5 h-3.5" /> {stats.priceDiffPercent}%
                    </span>
                  ) : (
                    <span className="flex items-center text-stone-600 font-black text-xs">
                      <Minus className="w-3.5 h-3.5" /> Barqaror
                    </span>
                  )}
                </div>
                <p className="text-base sm:text-lg font-mono font-black text-black">
                  {formatUSD(stats.lastPrice)}
                </p>
                <div className="text-[10px] text-stone-700 font-bold truncate">
                  Farq:{' '}
                  <span className="text-black font-black">
                    {stats.priceDiff > 0
                      ? `+${formatUSD(stats.priceDiff)}`
                      : formatUSD(stats.priceDiff)}
                  </span>
                </div>
                <div className="text-[9px] text-stone-500 font-mono truncate">
                  Boshlang'ich: {formatUSD(stats.firstPrice)}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAHLILIY CHIZMALAR: HAR BIR CHIZIQ BITTA YETKAZIB BERUVCHI
              (Oval egrisimon natural chiziqlar) */}
          {/* ========================================================================= */}
          <div className="bg-white border-2 border-amber-400 p-2.5 sm:p-4 md:p-5 shadow-sm space-y-3 w-full max-w-full overflow-hidden">
            {/* Sarlavha va boshqaruv */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 border-b-2 border-amber-300 pb-2.5">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="px-2 py-0.5 bg-amber-400 border border-amber-600 text-black text-[10px] sm:text-[11px] font-black uppercase tracking-wider">
                    Tahliliy chizmalar
                  </span>
                  <h2 className="font-black text-xs sm:text-sm md:text-base uppercase tracking-wider text-black font-heading truncate">
                    {activePartName} — Narxlar Tahliliy Chizmalari
                  </h2>
                </div>
                <p className="text-[10px] sm:text-[11px] text-stone-700 font-bold mt-0.5">
                  Har bir chiziq bitta yetkazib beruvchining muddat davomidagi narx o'zgarishini ifodalaydi
                </p>
              </div>

              {/* Chizma shaklini o'zgartirish va yorliqlar */}
              <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    if (curveType === 'natural') setCurveType('monotone');
                    else if (curveType === 'monotone') setCurveType('linear');
                    else setCurveType('natural');
                  }}
                  className="px-2 py-1 bg-yellow-100 hover:bg-yellow-200 border border-amber-400 text-[11px] font-black text-black cursor-pointer transition"
                  title="Chiziq shaklini o'zgartirish (Oval, Silliq, To'g'ri)"
                >
                  {curveType === 'natural'
                    ? 'Chizma: Egrisimon oval'
                    : curveType === 'monotone'
                    ? 'Chizma: Silliq'
                    : "Chizma: To'g'ri"}
                </button>

                <button
                  type="button"
                  onClick={() => setShowDataLabels(!showDataLabels)}
                  className={`px-2 py-1 text-[11px] font-black border transition cursor-pointer ${
                    showDataLabels
                      ? 'bg-amber-400 border-amber-600 text-black'
                      : 'bg-yellow-100 hover:bg-yellow-200 border-amber-400 text-black'
                  }`}
                  title="Nuqtalarda narx qiymatini ko'rsatish"
                >
                  {showDataLabels ? 'Yorliqlar: Yoniq' : "Yorliqlar: O'chiq"}
                </button>

                {hiddenSuppliers.size > 0 && (
                  <button
                    type="button"
                    onClick={showAllLines}
                    className="px-2 py-1 bg-amber-300 hover:bg-amber-400 border border-amber-600 text-[11px] font-black text-black cursor-pointer transition"
                  >
                    Barchasini yoqish
                  </button>
                )}
              </div>
            </div>

            {/* HAR BIR CHIZIQ UCHUN INTERAKTIV YETKAZIB BERUVCHI LEGENDA PANELI */}
            <div className="bg-yellow-50/80 p-2 sm:p-2.5 border border-amber-300 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-black text-stone-800">
                <span className="uppercase flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-amber-700" />
                  Chiziqlar (Har bir yetkazib beruvchi alohida):
                </span>
                <span className="text-[9px] sm:text-[10px] text-stone-500">
                  (O'chirish/yoqish uchun bosing)
                </span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {involvedSuppliers.map((supp) => {
                  const color = supplierColorMap.get(supp) || '#b45309';
                  const isHidden = hiddenSuppliers.has(supp);
                  const count = supplierCounts.get(supp) || 0;

                  return (
                    <button
                      key={supp}
                      type="button"
                      onClick={() => toggleSupplierLine(supp)}
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 sm:py-1 border text-[11px] font-black transition cursor-pointer rounded-none ${
                        isHidden
                          ? 'bg-stone-100 border-stone-300 text-stone-400 opacity-60'
                          : 'bg-white hover:bg-yellow-100 border-amber-400 text-black shadow-2xs'
                      }`}
                      title={isHidden ? "Chiziqni ko'rsatish" : 'Chiziqni yashirish'}
                    >
                      <span
                        className="w-3.5 h-1 inline-block shrink-0 rounded-full"
                        style={{ backgroundColor: isHidden ? '#a8a29e' : color }}
                      />
                      <span className="truncate max-w-[140px] sm:max-w-[180px]">{supp}</span>
                      <span
                        className="px-1 text-[9px] font-mono rounded-none"
                        style={{
                          backgroundColor: isHidden ? '#e7e5e4' : `${color}20`,
                          color: isHidden ? '#78716c' : color,
                        }}
                      >
                        {count}
                      </span>
                      {isHidden ? (
                        <EyeOff className="w-2.5 h-2.5 text-stone-400 shrink-0" />
                      ) : (
                        <Eye className="w-2.5 h-2.5 text-stone-700 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* RECHARTS CHIZMALAR GRAFIGI (OVAL / NATURAL CURVE) */}
            <div className="w-full min-w-0 h-64 sm:h-80 md:h-96 pt-1 overflow-hidden">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 15, right: 15, left: -10, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#fde68a" vertical={false} />

                  {/* X o'qi: Sanalar */}
                  <XAxis
                    dataKey="date"
                    stroke="#44403c"
                    tick={{ fontSize: 10, fontWeight: 700 }}
                    dy={5}
                  />

                  {/* Y o'qi: Narxi ($ / USD) */}
                  <YAxis
                    width={56}
                    stroke="#44403c"
                    tick={{ fontSize: 10, fontWeight: 700 }}
                    tickFormatter={(val) => {
                      if (val >= 1000) return `$${(val / 1000).toFixed(1)}k`;
                      return `$${val}`;
                    }}
                    domain={['auto', 'auto']}
                    dx={-2}
                  />

                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="top"
                    height={32}
                    wrapperStyle={{ fontSize: 10, fontWeight: 800, paddingBottom: 6 }}
                  />

                  {/* HAR BIR YETKAZIB BERUVCHI UCHUN BITTA CHIZIQ (Egrisimon oval: type="natural") */}
                  {involvedSuppliers.map((supplier) => {
                    if (hiddenSuppliers.has(supplier)) return null;

                    const color = supplierColorMap.get(supplier) || '#b45309';

                    return (
                      <Line
                        key={supplier}
                        type={curveType}
                        dataKey={supplier}
                        name={supplier}
                        stroke={color}
                        strokeWidth={3.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        dot={{
                          r: 5,
                          strokeWidth: 2,
                          fill: '#ffffff',
                          stroke: color,
                        }}
                        activeDot={{
                          r: 7,
                          strokeWidth: 2.5,
                          fill: color,
                          stroke: '#000000',
                        }}
                        connectNulls={true}
                        label={
                          showDataLabels
                            ? {
                                position: 'top',
                                formatter: (v: any) =>
                                  v ? `${(Number(v) / 1000).toFixed(0)}k` : '',
                                style: {
                                  fontSize: 9,
                                  fontWeight: 800,
                                  fill: color,
                                },
                              }
                            : false
                        }
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* YETKAZIB BERUVCHILAR BO'YICHA TAQQOSLAMA JADVALI */}
          {/* ========================================================================= */}
          <div className="bg-white border-2 border-amber-400 shadow-sm overflow-hidden w-full max-w-full">
            <div className="p-2.5 sm:p-3 bg-yellow-200 border-b-2 border-amber-400 flex items-center justify-between">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black stroke-[2.5] shrink-0" />
                <h3 className="font-black text-[11px] sm:text-xs uppercase tracking-wider text-black font-heading truncate">
                  Yetkazib beruvchilar bo'yicha qiyosiy ko'rsatkichlar
                </h3>
              </div>
              <span className="text-[10px] sm:text-[11px] font-black text-stone-800 shrink-0">
                {supplierSummary.length} ta yetkazib beruvchi
              </span>
            </div>

            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[620px] sm:min-w-[700px] border-collapse text-left text-[11px] sm:text-xs">
                <thead>
                  <tr className="bg-yellow-100 border-b border-amber-300 text-black text-[9px] sm:text-[10px] font-black uppercase">
                    <th className="p-2 border-r border-amber-200">Yetkazib beruvchi (Chiziq rangi)</th>
                    <th className="p-2 border-r border-amber-200 text-right">Oxirgi narxi</th>
                    <th className="p-2 border-r border-amber-200 text-right">Eng arzon</th>
                    <th className="p-2 border-r border-amber-200 text-right">Eng yuqori</th>
                    <th className="p-2 border-r border-amber-200 text-right">O'rtacha</th>
                    <th className="p-2 border-r border-amber-200 text-center">Qaydlar</th>
                    <th className="p-2 border-r border-amber-200 text-center">Oxirgi sana</th>
                    <th className="p-2 text-center">Holat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-200">
                  {supplierSummary.map((item, idx) => {
                    const isCheapest = stats && item.minPrice === stats.minPrice;
                    return (
                      <tr
                        key={item.supplier}
                        className={idx % 2 === 0 ? 'bg-white' : 'bg-yellow-50/40'}
                      >
                        <td className="p-2 border-r border-amber-200 font-bold text-black flex items-center gap-2">
                          <span
                            className="w-3.5 h-1.5 inline-block border border-black/30 shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="break-words">{item.supplier}</span>
                        </td>
                        <td className="p-2 border-r border-amber-200 text-right font-mono font-black text-black whitespace-nowrap">
                          {formatUSD(item.latestPrice)}
                        </td>
                        <td className="p-2 border-r border-amber-200 text-right font-mono font-black text-emerald-800 whitespace-nowrap">
                          {formatUSD(item.minPrice)}
                        </td>
                        <td className="p-2 border-r border-amber-200 text-right font-mono font-black text-rose-800 whitespace-nowrap">
                          {formatUSD(item.maxPrice)}
                        </td>
                        <td className="p-2 border-r border-amber-200 text-right font-mono font-black text-stone-800 whitespace-nowrap">
                          {formatUSD(item.avgPrice)}
                        </td>
                        <td className="p-2 border-r border-amber-200 text-center font-mono font-black">
                          {item.count}
                        </td>
                        <td className="p-2 border-r border-amber-200 text-center font-mono text-[10px] sm:text-[11px] text-stone-700 whitespace-nowrap">
                          {item.latestDate}
                        </td>
                        <td className="p-2 text-center whitespace-nowrap">
                          {isCheapest ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-100 border border-emerald-500 text-emerald-900 font-black text-[9px] sm:text-[10px]">
                              <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-700" />
                              Eng arzon
                            </span>
                          ) : (
                            <span className="text-[10px] text-stone-600 font-bold">Standard</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* XRONOLOGIK O'ZGARISHLAR TARIXI RO'YXATI */}
          {/* ========================================================================= */}
          <div className="bg-white border-2 border-amber-400 shadow-sm overflow-hidden w-full max-w-full">
            <div className="p-2.5 sm:p-3 bg-yellow-100 border-b-2 border-amber-300 flex items-center justify-between">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black stroke-[2.5]" />
                <h3 className="font-black text-[11px] sm:text-xs uppercase tracking-wider text-black font-heading truncate">
                  Narxlar kiritilishi tarixi
                </h3>
              </div>
              <span className="text-[10px] sm:text-[11px] font-black text-stone-800">
                {sortedRecords.length} ta qayd
              </span>
            </div>

            <div className="w-full overflow-x-auto max-h-64 sm:max-h-72">
              <table className="w-full min-w-[650px] border-collapse text-left text-[11px] sm:text-xs">
                <thead className="sticky top-0 z-10 bg-yellow-200 border-b border-amber-400 text-black text-[9px] sm:text-[10px] font-black uppercase">
                  <tr>
                    <th className="p-1.5 border-r border-amber-300 text-center w-8">№</th>
                    <th className="p-1.5 border-r border-amber-300 w-24 text-center">Sana</th>
                    <th className="p-1.5 border-r border-amber-300 w-24">Vaqt</th>
                    <th className="p-1.5 border-r border-amber-300 w-20">Brend</th>
                    <th className="p-1.5 border-r border-amber-300">Yetkazib beruvchi</th>
                    <th className="p-1.5 border-r border-amber-300 text-right w-24">Narx ($)</th>
                    <th className="p-1.5 border-r border-amber-300 w-28">Manba</th>
                    <th className="p-1.5">Izoh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-200">
                  {sortedRecords.map((item, idx) => (
                    <tr
                      key={item.id}
                      className={idx % 2 === 0 ? 'bg-white' : 'bg-yellow-50/40'}
                    >
                      <td className="p-1.5 border-r border-amber-200 text-center font-mono font-black">{idx + 1}</td>
                      <td className="p-1.5 border-r border-amber-200 text-center font-mono font-bold text-black whitespace-nowrap">{item.date}</td>
                      <td className="p-1.5 border-r border-amber-200 font-mono text-[9px] sm:text-[10px] text-stone-600 whitespace-nowrap">{item.systemTime}</td>
                      <td className="p-1.5 border-r border-amber-200 font-bold text-[10px] uppercase text-black">{item.brand}</td>
                      <td className="p-1.5 border-r border-amber-200 font-bold text-stone-900">{item.supplierName}</td>
                      <td className="p-1.5 border-r border-amber-200 text-right font-mono font-black text-black whitespace-nowrap">
                        {formatUSD(item.price)}
                      </td>
                      <td className="p-1.5 border-r border-amber-200 text-stone-700 text-[10px] sm:text-[11px]">{item.source}</td>
                      <td className="p-1.5 text-stone-600 text-[10px] sm:text-[11px]">{item.comment}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* ENG PASTDA: MAHSULOT NARX O'ZGARISHI FOIZ XRONOLOGIYASI
              (Qancha foizga oshganini ko'rsatuvchi xronologiya) */}
          {/* ========================================================================= */}
          <div className="bg-white border-2 border-amber-500 shadow-sm p-3 sm:p-4 space-y-3 w-full max-w-full">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b-2 border-amber-300 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-400 border border-amber-600 text-black shrink-0">
                  <History className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-black text-xs sm:text-sm uppercase tracking-wide text-black font-heading">
                    Narx O'zgarishi Foiz Xronologiyasi
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-stone-600 font-bold">
                    «{activePartName}» mahsulotining har bir qayd bo'yicha narx o'sishi / pasayishi dinamikasi
                  </p>
                </div>
              </div>

              {/* Xulosa foizi */}
              {stats && (
                <div className="flex items-center gap-2 bg-yellow-100 border border-amber-400 px-2.5 py-1 text-xs shrink-0">
                  <span className="text-[10px] uppercase font-bold text-stone-600">Umumiy o'zgarish:</span>
                  {stats.priceDiff > 0 ? (
                    <span className="inline-flex items-center gap-0.5 font-mono font-black text-rose-700">
                      <ArrowUpRight className="w-3.5 h-3.5 stroke-[3]" />
                      +{stats.priceDiffPercent}% ga oshgan
                    </span>
                  ) : stats.priceDiff < 0 ? (
                    <span className="inline-flex items-center gap-0.5 font-mono font-black text-emerald-700">
                      <ArrowDownRight className="w-3.5 h-3.5 stroke-[3]" />
                      {stats.priceDiffPercent}% ga pasaygan
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 font-mono font-black text-stone-700">
                      <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                      0.0% (O'zgarishsiz)
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Xronologik qadamlar ketma-ketligi */}
            <div className="space-y-2">
              {priceChangeTimeline.map((step) => {
                const isPositive = step.stepDiff > 0;
                const isNegative = step.stepDiff < 0;
                const isZero = step.stepDiff === 0;

                const isTotalPositive = step.totalDiff > 0;
                const isTotalNegative = step.totalDiff < 0;

                return (
                  <div
                    key={`timeline-${step.idx}-${step.item.id}`}
                    className={`p-2.5 border-2 transition ${
                      step.isFirst
                        ? 'bg-yellow-50/80 border-amber-400'
                        : isPositive
                        ? 'bg-rose-50/50 border-rose-300'
                        : isNegative
                        ? 'bg-emerald-50/50 border-emerald-300'
                        : 'bg-stone-50 border-stone-300'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      {/* Qadam raqami, sana va yetkazib beruvchi */}
                      <div className="flex items-start sm:items-center gap-2 min-w-0">
                        <span className="px-1.5 py-0.5 bg-amber-400 border border-amber-600 font-mono font-black text-[10px] text-black shrink-0">
                          №{step.idx}
                        </span>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono font-bold text-xs text-black flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-amber-700" />
                              {step.item.date}
                            </span>
                            <span className="text-[10px] text-stone-500 font-mono">
                              {step.item.systemTime}
                            </span>
                            <span className="px-1.5 py-0.2 bg-amber-200 border border-amber-400 text-[10px] font-bold text-black uppercase">
                              {step.item.brand}
                            </span>
                          </div>
                          <p className="text-xs font-black text-stone-900 truncate">
                            {step.item.supplierName}
                          </p>
                        </div>
                      </div>

                      {/* Narx va foiz o'zgarishi ko'rsatkichlari */}
                      <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-between sm:justify-end shrink-0 border-t sm:border-t-0 border-amber-200 pt-1.5 sm:pt-0">
                        {/* Joriy narx */}
                        <div className="text-right">
                          <span className="text-[9px] uppercase font-bold text-stone-500 block">Narxi:</span>
                          <span className="font-mono font-black text-xs sm:text-sm text-black">
                            {formatUSD(step.currentPrice)}
                          </span>
                        </div>

                        {/* Oldingi narxga nisbatan qadam foizi */}
                        <div className="text-right">
                          <span className="text-[9px] uppercase font-bold text-stone-500 block">
                            Oldingiga nisbatan:
                          </span>
                          {step.isFirst ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 bg-amber-200 border border-amber-400 text-black font-black text-[10px]">
                              Boshlang'ich qayd
                            </span>
                          ) : isPositive ? (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-rose-100 border border-rose-400 text-rose-800 font-mono font-black text-[10px]">
                              <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />
                              +{step.stepPercent}% (+{formatUSD(step.stepDiff)})
                            </span>
                          ) : isNegative ? (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-100 border border-emerald-400 text-emerald-800 font-mono font-black text-[10px]">
                              <ArrowDownRight className="w-3 h-3 stroke-[2.5]" />
                              {step.stepPercent}% ({formatUSD(step.stepDiff)})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-stone-100 border border-stone-300 text-stone-700 font-mono font-bold text-[10px]">
                              <Minus className="w-3 h-3" />
                              0% o'zgarmadi
                            </span>
                          )}
                        </div>

                        {/* Boshlang'ich narxga nisbatan foiz */}
                        {!step.isFirst && (
                          <div className="text-right hidden md:block">
                            <span className="text-[9px] uppercase font-bold text-stone-500 block">
                              Boshlang'ichdan:
                            </span>
                            <span
                              className={`font-mono font-bold text-[10px] ${
                                isTotalPositive
                                  ? 'text-rose-700'
                                  : isTotalNegative
                                  ? 'text-emerald-700'
                                  : 'text-stone-700'
                              }`}
                            >
                              {isTotalPositive ? `+${step.totalPercent}%` : `${step.totalPercent}%`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Izoh yoki manba mavjud bo'lsa */}
                    {(step.item.source || step.item.comment) && (
                      <div className="mt-1.5 pt-1 border-t border-amber-200/60 text-[10px] text-stone-600 flex items-center gap-3 flex-wrap">
                        {step.item.source && (
                          <span>
                            <strong className="text-stone-700">Manba:</strong> {step.item.source}
                          </span>
                        )}
                        {step.item.comment && (
                          <span>
                            <strong className="text-stone-700">Izoh:</strong> {step.item.comment}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
