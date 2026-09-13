import React, { useState, useMemo } from 'react';
import {
  Wrench,
  Plus,
  FileSpreadsheet,
  Edit2,
  Trash2,
  Calendar,
  Building2,
  Tag,
  WifiOff,
  AlertTriangle,
  LayoutList,
  Table as TableIcon,
  Clock,
  Info,
  Filter,
  RotateCcw,
  X,
  Globe,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { AutoPart } from '../types';
import { exportAutoPartsToExcel } from '../utils/excelExport';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { formatUSD } from '../utils/formatCurrency';
import { MultiSelectPickFilter } from './MultiSelectPickFilter';

interface AutoPartsTableProps {
  parts: AutoPart[];
  onOpenAddModal: () => void;
  onEditPart: (part: AutoPart) => void;
  onDeletePart: (id: string) => void;
}

export const AutoPartsTable: React.FC<AutoPartsTableProps> = ({
  parts,
  onOpenAddModal,
  onEditPart,
  onDeletePart,
}) => {
  const isOnline = useOnlineStatus();
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  
  // Mobilda ko'rinish rejimi: 'cards' (ixcham kartalar) yoki 'table' (gorizontal suriladigan jadval)
  const [mobileViewMode, setMobileViewMode] = useState<'cards' | 'table'>('cards');
  
  // Filtrlar paneli ochilgan/yopilganligi
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(true);

  // 8 ta ustun bo'yicha ko'p tanlovli (multi-select pick filter) holatlari
  const [filterPartNames, setFilterPartNames] = useState<string[]>([]);
  const [filterBrands, setFilterBrands] = useState<string[]>([]);
  const [filterSuppliers, setFilterSuppliers] = useState<string[]>([]);
  const [filterSources, setFilterSources] = useState<string[]>([]);
  const [filterCodes, setFilterCodes] = useState<string[]>([]);
  const [filterSpecialMarks, setFilterSpecialMarks] = useState<string[]>([]);
  const [filterCarPositions, setFilterCarPositions] = useState<string[]>([]);
  const [filterCountries, setFilterCountries] = useState<string[]>([]);

  // 2 ta ustun bo'yicha oraliq (range) filtrlari: Narx va Sana
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // 1. Qism nomlari va ularning soni
  const { uniquePartNames, partNameCounts } = useMemo(() => {
    const counts: Record<string, number> = {};
    parts.forEach((p) => {
      const val = p.partName?.trim();
      if (val) counts[val] = (counts[val] || 0) + 1;
    });
    return {
      uniquePartNames: Object.keys(counts).sort((a, b) => a.localeCompare(b, 'uz')),
      partNameCounts: counts,
    };
  }, [parts]);

  // 2. Brendlar va ularning soni
  const { uniqueBrands, brandCounts } = useMemo(() => {
    const counts: Record<string, number> = {};
    parts.forEach((p) => {
      const val = p.brand?.trim();
      if (val) counts[val] = (counts[val] || 0) + 1;
    });
    return {
      uniqueBrands: Object.keys(counts).sort((a, b) => a.localeCompare(b, 'uz')),
      brandCounts: counts,
    };
  }, [parts]);

  // 3. Yetkazib beruvchilar va ularning soni
  const { uniqueSuppliers, supplierCounts } = useMemo(() => {
    const counts: Record<string, number> = {};
    parts.forEach((p) => {
      const val = p.supplierName?.trim();
      if (val) counts[val] = (counts[val] || 0) + 1;
    });
    return {
      uniqueSuppliers: Object.keys(counts).sort((a, b) => a.localeCompare(b, 'uz')),
      supplierCounts: counts,
    };
  }, [parts]);

  // 4. Manbaalar va ularning soni
  const { uniqueSources, sourceCounts } = useMemo(() => {
    const counts: Record<string, number> = {};
    parts.forEach((p) => {
      const val = p.source?.trim();
      if (val) counts[val] = (counts[val] || 0) + 1;
    });
    return {
      uniqueSources: Object.keys(counts).sort((a, b) => a.localeCompare(b, 'uz')),
      sourceCounts: counts,
    };
  }, [parts]);

  // 5. Kodlar va ularning soni
  const { uniqueCodes, codeCounts } = useMemo(() => {
    const counts: Record<string, number> = {};
    parts.forEach((p) => {
      const val = p.code?.trim();
      if (val) counts[val] = (counts[val] || 0) + 1;
    });
    return {
      uniqueCodes: Object.keys(counts).sort((a, b) => a.localeCompare(b, 'uz')),
      codeCounts: counts,
    };
  }, [parts]);

  // 6. Maxsus belgilar va ularning soni
  const { uniqueSpecialMarks, specialMarkCounts } = useMemo(() => {
    const counts: Record<string, number> = {};
    parts.forEach((p) => {
      const val = p.specialMark?.trim();
      if (val) counts[val] = (counts[val] || 0) + 1;
    });
    return {
      uniqueSpecialMarks: Object.keys(counts).sort((a, b) => a.localeCompare(b, 'uz')),
      specialMarkCounts: counts,
    };
  }, [parts]);

  // 7. Mashinadagi joylar va ularning soni
  const { uniqueCarPositions, carPositionCounts } = useMemo(() => {
    const counts: Record<string, number> = {};
    parts.forEach((p) => {
      const val = p.carPosition?.trim();
      if (val) counts[val] = (counts[val] || 0) + 1;
    });
    return {
      uniqueCarPositions: Object.keys(counts).sort((a, b) => a.localeCompare(b, 'uz')),
      carPositionCounts: counts,
    };
  }, [parts]);

  // 8. Davlatlar va ularning soni
  const { uniqueCountries, countryCounts } = useMemo(() => {
    const counts: Record<string, number> = {};
    parts.forEach((p) => {
      const val = p.country?.trim();
      if (val) counts[val] = (counts[val] || 0) + 1;
    });
    return {
      uniqueCountries: Object.keys(counts).sort((a, b) => a.localeCompare(b, 'uz')),
      countryCounts: counts,
    };
  }, [parts]);

  // Filtrlangan ma'lumotlar ro'yxati
  const filteredParts = useMemo(() => {
    return parts.filter((item) => {
      // 1. Qism nomlari (Pick filter - bir nechta tanlash)
      if (filterPartNames.length > 0 && !filterPartNames.includes(item.partName || '')) {
        return false;
      }

      // 2. Brendlar (Pick filter)
      if (filterBrands.length > 0 && !filterBrands.includes(item.brand || '')) {
        return false;
      }

      // 3. Yetkazib beruvchilar (Pick filter)
      if (filterSuppliers.length > 0 && !filterSuppliers.includes(item.supplierName || '')) {
        return false;
      }

      // 4. Manbaa (Pick filter)
      if (filterSources.length > 0 && !filterSources.includes(item.source || '')) {
        return false;
      }

      // 5. Kod (Pick filter)
      if (filterCodes.length > 0 && !filterCodes.includes(item.code || '')) {
        return false;
      }

      // 6. Maxsus belgisi (Pick filter)
      if (filterSpecialMarks.length > 0 && !filterSpecialMarks.includes(item.specialMark || '')) {
        return false;
      }

      // 7. Mashinada joylashgan joyi (Pick filter)
      if (filterCarPositions.length > 0 && !filterCarPositions.includes(item.carPosition || '')) {
        return false;
      }

      // 8. Davlat (Pick filter)
      if (filterCountries.length > 0 && !filterCountries.includes(item.country || '')) {
        return false;
      }

      // 9. Narx oralig'i (Min - Max oralig'i)
      const priceNum = Number(item.price);
      if (minPrice !== '' && !isNaN(Number(minPrice))) {
        if (isNaN(priceNum) || priceNum < Number(minPrice)) {
          return false;
        }
      }
      if (maxPrice !== '' && !isNaN(Number(maxPrice))) {
        if (isNaN(priceNum) || priceNum > Number(maxPrice)) {
          return false;
        }
      }

      // 10. Sana oralig'i (Boshlanish - Tugash sanalari)
      if (startDate && item.date && item.date < startDate) {
        return false;
      }
      if (endDate && item.date && item.date > endDate) {
        return false;
      }

      return true;
    });
  }, [
    parts,
    filterPartNames,
    filterBrands,
    filterSuppliers,
    filterSources,
    filterCodes,
    filterSpecialMarks,
    filterCarPositions,
    filterCountries,
    minPrice,
    maxPrice,
    startDate,
    endDate,
  ]);

  // Faol filtrlar ro'yxati (Badge / chip holatida ko'rsatish uchun)
  const activeFilters = useMemo(() => {
    const list: { id: string; label: string; value: string; clear: () => void }[] = [];

    if (filterPartNames.length > 0) {
      list.push({
        id: 'partNames',
        label: 'Qism nomi',
        value: `${filterPartNames.length} ta (${filterPartNames.slice(0, 2).join(', ')}${
          filterPartNames.length > 2 ? '...' : ''
        })`,
        clear: () => setFilterPartNames([]),
      });
    }

    if (filterBrands.length > 0) {
      list.push({
        id: 'brands',
        label: 'Brend',
        value: `${filterBrands.length} ta (${filterBrands.slice(0, 2).join(', ')}${
          filterBrands.length > 2 ? '...' : ''
        })`,
        clear: () => setFilterBrands([]),
      });
    }

    if (filterSuppliers.length > 0) {
      list.push({
        id: 'suppliers',
        label: 'Yetkazib beruvchi',
        value: `${filterSuppliers.length} ta (${filterSuppliers.slice(0, 2).join(', ')}${
          filterSuppliers.length > 2 ? '...' : ''
        })`,
        clear: () => setFilterSuppliers([]),
      });
    }

    if (filterSources.length > 0) {
      list.push({
        id: 'sources',
        label: 'Manbaa',
        value: `${filterSources.length} ta (${filterSources.slice(0, 2).join(', ')}${
          filterSources.length > 2 ? '...' : ''
        })`,
        clear: () => setFilterSources([]),
      });
    }

    if (filterCodes.length > 0) {
      list.push({
        id: 'codes',
        label: 'Kod',
        value: `${filterCodes.length} ta`,
        clear: () => setFilterCodes([]),
      });
    }

    if (filterSpecialMarks.length > 0) {
      list.push({
        id: 'specialMarks',
        label: 'Maxsus belgisi',
        value: `${filterSpecialMarks.length} ta`,
        clear: () => setFilterSpecialMarks([]),
      });
    }

    if (filterCarPositions.length > 0) {
      list.push({
        id: 'carPositions',
        label: 'Mashinadagi joyi',
        value: `${filterCarPositions.length} ta`,
        clear: () => setFilterCarPositions([]),
      });
    }

    if (filterCountries.length > 0) {
      list.push({
        id: 'countries',
        label: 'Davlati',
        value: `${filterCountries.length} ta (${filterCountries.slice(0, 2).join(', ')}${
          filterCountries.length > 2 ? '...' : ''
        })`,
        clear: () => setFilterCountries([]),
      });
    }

    if (minPrice !== '' || maxPrice !== '') {
      list.push({
        id: 'priceRange',
        label: 'Narx oralig\'i',
        value: `${minPrice ? `$${minPrice}` : '$0'} — ${maxPrice ? `$${maxPrice}` : '∞'}`,
        clear: () => {
          setMinPrice('');
          setMaxPrice('');
        },
      });
    }

    if (startDate || endDate) {
      list.push({
        id: 'dateRange',
        label: 'Sana oralig\'i',
        value: `${startDate || '...'} → ${endDate || '...'}`,
        clear: () => {
          setStartDate('');
          setEndDate('');
        },
      });
    }

    return list;
  }, [
    filterPartNames,
    filterBrands,
    filterSuppliers,
    filterSources,
    filterCodes,
    filterSpecialMarks,
    filterCarPositions,
    filterCountries,
    minPrice,
    maxPrice,
    startDate,
    endDate,
  ]);

  const resetAllFilters = () => {
    setFilterPartNames([]);
    setFilterBrands([]);
    setFilterSuppliers([]);
    setFilterSources([]);
    setFilterCodes([]);
    setFilterSpecialMarks([]);
    setFilterCarPositions([]);
    setFilterCountries([]);
    setMinPrice('');
    setMaxPrice('');
    setStartDate('');
    setEndDate('');
  };

  const handleExport = () => {
    exportAutoPartsToExcel(filteredParts);
  };

  const confirmDelete = (id: string) => {
    if (!isOnline) {
      alert("Oflayn rejimda yozuvni o'chirish imkoniyati cheklangan!");
      return;
    }
    setDeleteTargetId(id);
  };

  const executeDelete = () => {
    if (deleteTargetId) {
      onDeletePart(deleteTargetId);
      setDeleteTargetId(null);
    }
  };

  // Hisoblangan umumiy statistika
  const totalItems = parts.length;
  const filteredCount = filteredParts.length;

  return (
    <div id="autoparts-container" className="w-full space-y-3">
      {/* Top action toolbar */}
      <div className="bg-yellow-100/95 border-2 border-amber-400 p-3 sm:p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-black rounded-none">
        {/* Title & Count */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="p-2 bg-amber-400 border border-amber-600 text-black shrink-0">
            <Wrench className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-black uppercase tracking-wider text-black font-heading truncate">
                Avto ehtiyot qismlar
              </h1>
              <span className="px-2 py-0.5 bg-amber-300 border border-amber-500 text-xs font-black shrink-0">
                {activeFilters.length > 0 ? `${filteredCount} / ${totalItems} ta yozuv` : `${totalItems} ta yozuv`}
              </span>
            </div>
          </div>
        </div>

        {/* Buttons: Add & Excel Export */}
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          {/* Excel Export */}
          <button
            type="button"
            onClick={handleExport}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-200 hover:bg-amber-300 border-2 border-amber-500 text-black text-xs font-black transition cursor-pointer active:scale-95 shadow-2xs rounded-none"
            title="Avto ehtiyot qismlar jadvalini Excel (.xlsx) formatida yuklab olish"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-800 stroke-[2.5]" />
            <span>Excel (.xlsx)</span>
          </button>

          {/* Add Part (Disabled when offline) */}
          <button
            type="button"
            onClick={onOpenAddModal}
            disabled={!isOnline}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 border-2 text-xs font-black transition rounded-none shadow-sm ${
              !isOnline
                ? 'bg-stone-200 border-stone-400 text-stone-500 cursor-not-allowed'
                : 'bg-amber-400 hover:bg-amber-500 border-amber-600 text-black cursor-pointer active:scale-95'
            }`}
            title={
              !isOnline
                ? "Oflayn rejim: Baza faqat ko'rish uchun ochiq, yangi yozuv qo'shib bo'lmaydi"
                : "Yangi avto ehtiyot qism qo'shish"
            }
          >
            {!isOnline ? (
              <WifiOff className="w-4 h-4 text-rose-700 stroke-[2.5]" />
            ) : (
              <Plus className="w-4 h-4 stroke-[3]" />
            )}
            <span>
              {!isOnline ? 'Oflayn' : "+ Yangi avto ehtiyot qism qo'shish"}
            </span>
          </button>
        </div>
      </div>

      {/* Offline banner notification if disconnected */}
      {!isOnline && (
        <div className="bg-amber-200 border-2 border-amber-400 p-2.5 text-xs font-black text-stone-900 flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-rose-700 shrink-0" />
            <span className="text-[11px] sm:text-xs">
              Oflayn rejim: Ma'lumotlar to'liq ko'rinmoqda, ammo yangi yozuv qo'shish yoki o'chirish taqiqlangan.
            </span>
          </div>
          <span className="px-2 py-0.5 bg-yellow-100 border border-amber-500 text-[10px] uppercase font-black shrink-0">
            Faqat ko'rish
          </span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 10 TA USTUN BO'YICHA FILTRLASH PANELI                                      */}
      {/* 8 ta ko'p tanlovli (pick) filter + 2 ta oraliq (narx va sana) filtrlari   */}
      {/* ========================================================================= */}
      <div className="bg-yellow-50/95 border-2 border-amber-400 shadow-sm rounded-none">
        {/* Panel Header */}
        <div className="p-2.5 sm:p-3 bg-amber-200/90 border-b-2 border-amber-400 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-amber-400 border border-amber-600 text-black">
              <Filter className="w-4 h-4" />
            </div>
            <span className="text-xs font-black uppercase tracking-wider text-black font-heading">
              Ustunlar bo'yicha saralash va filtrlash
            </span>
            {activeFilters.length > 0 && (
              <span className="px-2 py-0.5 bg-amber-400 border border-amber-600 font-mono font-black text-[11px] text-black">
                {activeFilters.length} ta faol filtr
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {activeFilters.length > 0 && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="flex items-center gap-1 px-2.5 py-1 bg-rose-100 hover:bg-rose-200 border border-rose-400 text-rose-900 text-xs font-black transition cursor-pointer"
                title="Barcha filtrlarni bekor qilish"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Barchasini tozalash</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
              className="flex items-center gap-1 px-2 py-1 bg-amber-300 hover:bg-amber-400 border border-amber-500 text-black text-xs font-black transition cursor-pointer"
            >
              <span>{isFilterPanelOpen ? "Panelni yashirish" : "Filtrlarni ochish"}</span>
              {isFilterPanelOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Faol filtrlar chip-belgilari */}
        {activeFilters.length > 0 && (
          <div className="p-2 bg-yellow-100 border-b border-amber-300 flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-black uppercase text-stone-700 mr-1">Faol:</span>
            {activeFilters.map((af) => (
              <span
                key={af.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-300 border border-amber-500 text-[11px] font-black text-black"
              >
                <span>{af.label}:</span>
                <span className="text-amber-950 font-bold">{af.value}</span>
                <button
                  type="button"
                  onClick={af.clear}
                  className="p-0.5 hover:bg-amber-400 rounded-none cursor-pointer"
                  title="O'chirish"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Filtr formalar to'ri (faqat asosiy pick va oralig'i komponentlari, ostida ortiqcha maydonlar yo'q) */}
        {isFilterPanelOpen && (
          <div className="p-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 text-black">
            {/* 1. Qism nomlari */}
            <MultiSelectPickFilter
              label="1. Qism nomi"
              options={uniquePartNames}
              counts={partNameCounts}
              selected={filterPartNames}
              onChange={setFilterPartNames}
              placeholder="Barchasi"
            />

            {/* 2. Brend */}
            <MultiSelectPickFilter
              label="2. Brend"
              options={uniqueBrands}
              counts={brandCounts}
              selected={filterBrands}
              onChange={setFilterBrands}
              placeholder="Barcha brendlar"
            />

            {/* 3. Yetkazib beruvchi */}
            <MultiSelectPickFilter
              label="3. Yetkazib beruvchi"
              options={uniqueSuppliers}
              counts={supplierCounts}
              selected={filterSuppliers}
              onChange={setFilterSuppliers}
              placeholder="Barcha ta'minotchilar"
            />

            {/* 4. Narx oralig'i (Min - Max) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] font-black uppercase text-stone-800">
                <span>4. Narx ($) oralig'i</span>
                {(minPrice || maxPrice) && (
                  <button
                    type="button"
                    onClick={() => {
                      setMinPrice('');
                      setMaxPrice('');
                    }}
                    className="text-rose-600 hover:text-rose-800 hover:underline text-[9px] font-bold cursor-pointer"
                    title="Narx oralig'ini tozalash"
                  >
                    Tozalash
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="Min ($)"
                  className={`w-1/2 px-2 py-1.5 text-xs font-bold border-2 bg-white text-black focus:outline-none rounded-none ${
                    minPrice ? 'border-amber-600 bg-amber-50 font-black' : 'border-amber-400'
                  }`}
                />
                <span className="text-stone-500 font-black text-xs">—</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="Max ($)"
                  className={`w-1/2 px-2 py-1.5 text-xs font-bold border-2 bg-white text-black focus:outline-none rounded-none ${
                    maxPrice ? 'border-amber-600 bg-amber-50 font-black' : 'border-amber-400'
                  }`}
                />
              </div>
            </div>

            {/* 5. Sana oralig'i (Boshlanish - Tugash) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] font-black uppercase text-stone-800">
                <span>5. Sana oralig'i</span>
                {(startDate || endDate) && (
                  <button
                    type="button"
                    onClick={() => {
                      setStartDate('');
                      setEndDate('');
                    }}
                    className="text-rose-600 hover:text-rose-800 hover:underline text-[9px] font-bold cursor-pointer"
                    title="Sana oralig'ini tozalash"
                  >
                    Tozalash
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  title="Boshlanish sanasi"
                  className={`w-1/2 px-1.5 py-1 text-[11px] font-bold border-2 bg-white text-black focus:outline-none rounded-none ${
                    startDate ? 'border-amber-600 bg-amber-50 font-black' : 'border-amber-400'
                  }`}
                />
                <span className="text-stone-500 font-black text-xs">→</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  title="Tugash sanasi"
                  className={`w-1/2 px-1.5 py-1 text-[11px] font-bold border-2 bg-white text-black focus:outline-none rounded-none ${
                    endDate ? 'border-amber-600 bg-amber-50 font-black' : 'border-amber-400'
                  }`}
                />
              </div>
            </div>

            {/* 6. Manbaa */}
            <MultiSelectPickFilter
              label="6. Manbaa"
              options={uniqueSources}
              counts={sourceCounts}
              selected={filterSources}
              onChange={setFilterSources}
              placeholder="Barcha manbaalar"
            />

            {/* 7. Kod */}
            <MultiSelectPickFilter
              label="7. Kod"
              options={uniqueCodes}
              counts={codeCounts}
              selected={filterCodes}
              onChange={setFilterCodes}
              placeholder="Barcha kodlar"
            />

            {/* 8. Maxsus belgisi */}
            <MultiSelectPickFilter
              label="8. Maxsus belgisi"
              options={uniqueSpecialMarks}
              counts={specialMarkCounts}
              selected={filterSpecialMarks}
              onChange={setFilterSpecialMarks}
              placeholder="Barcha belgilar"
            />

            {/* 9. Mashinadagi joyi */}
            <MultiSelectPickFilter
              label="9. Mashinadagi joyi"
              options={uniqueCarPositions}
              counts={carPositionCounts}
              selected={filterCarPositions}
              onChange={setFilterCarPositions}
              placeholder="Barcha joylar"
            />

            {/* 10. Ishlab chiqarilgan davlati */}
            <MultiSelectPickFilter
              label="10. Davlati"
              options={uniqueCountries}
              counts={countryCounts}
              selected={filterCountries}
              onChange={setFilterCountries}
              placeholder="Barcha davlatlar"
            />
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 1. MOBIL VERSIYA (Faqat md ekrangacha ko'rinadi, ixcham va moslashuvchan)  */}
      {/* ========================================================================= */}
      <div className="block md:hidden space-y-2.5">
        {/* Mobil ko'rinish almashtirgichi (Kartalar yoki Gorizontal jadval) */}
        <div className="flex items-center justify-between gap-2 bg-yellow-100 border-2 border-amber-400 p-2 text-xs font-black shadow-2xs">
          <div className="flex items-center gap-1.5 text-[11px] text-stone-800">
            <Info className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span>Mobil ko'rinish:</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setMobileViewMode('cards')}
              className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-black border transition cursor-pointer ${
                mobileViewMode === 'cards'
                  ? 'bg-amber-400 border-amber-600 text-black shadow-xs'
                  : 'bg-yellow-200/60 hover:bg-yellow-200 border-amber-300 text-stone-700'
              }`}
            >
              <LayoutList className="w-3 h-3" />
              <span>Ixcham kartalar</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileViewMode('table')}
              className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-black border transition cursor-pointer ${
                mobileViewMode === 'table'
                  ? 'bg-amber-400 border-amber-600 text-black shadow-xs'
                  : 'bg-yellow-200/60 hover:bg-yellow-200 border-amber-300 text-stone-700'
              }`}
            >
              <TableIcon className="w-3 h-3" />
              <span>Jadval</span>
            </button>
          </div>
        </div>

        {/* REJIM A: MOBIL IXCHAM KARTALAR */}
        {mobileViewMode === 'cards' && (
          <div className="space-y-2.5">
            {filteredParts.length === 0 ? (
              <div className="p-6 text-center bg-yellow-50/70 border-2 border-amber-300 text-black">
                <Wrench className="w-7 h-7 text-amber-500 mx-auto mb-1.5 opacity-60" />
                <p className="font-black text-sm text-stone-800">
                  {activeFilters.length > 0 ? "Filtr bo'yicha ehtiyot qism topilmadi" : "Hozircha avto ehtiyot qismlar yo'q"}
                </p>
                <p className="text-xs text-stone-600 mt-1">
                  {activeFilters.length > 0
                    ? "Barcha yozuvlarni ko'rish uchun filtrlarni tozalang."
                    : 'Yangi avto ehtiyot qism qo\'shish uchun "+ Yangi avto ehtiyot qism qo\'shish" tugmasini bosing.'}
                </p>
                {activeFilters.length > 0 && (
                  <button
                    type="button"
                    onClick={resetAllFilters}
                    className="mt-3 px-3 py-1.5 bg-amber-400 hover:bg-amber-500 border border-amber-600 text-black font-black text-xs cursor-pointer"
                  >
                    Filtrlarni tozalash
                  </button>
                )}
              </div>
            ) : (
              filteredParts.map((item, idx) => (
                <div
                  key={item.id}
                  className="bg-white border-2 border-amber-400 p-3 shadow-xs space-y-2.5 text-black"
                >
                  {/* Yuqori satr: Tartib raqam, Qism nomi va Narx */}
                  <div className="flex items-start justify-between gap-2 border-b border-amber-200 pb-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <span className="px-1.5 py-0.5 bg-amber-400 border border-amber-600 font-mono font-black text-xs text-black shrink-0">
                        №{item.orderNumber || idx + 1}
                      </span>
                      <div className="min-w-0">
                        <h2 className="font-black text-sm text-black leading-snug break-words">
                          {item.partName}
                        </h2>
                        <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                          <span className="px-1.5 py-0.5 bg-amber-200 border border-amber-400 text-[10px] font-black uppercase text-black">
                            {item.brand}
                          </span>
                          {item.country && (
                            <span className="px-1.5 py-0.5 bg-emerald-100 border border-emerald-400 text-[10px] font-black text-emerald-900 flex items-center gap-1">
                              <Globe className="w-2.5 h-2.5" />
                              {item.country}
                            </span>
                          )}
                          <span className="text-[10px] font-mono text-stone-600 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5 text-stone-500" />
                            {item.systemTime}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Narx */}
                    <div className="text-right shrink-0">
                      <div className="px-2 py-1 bg-yellow-200 border border-amber-500 font-mono font-black text-xs text-black shadow-2xs whitespace-nowrap">
                        {formatUSD(item.price)}
                      </div>
                    </div>
                  </div>

                  {/* Maydonlar: Kod, Maxsus belgisi, Joylashgan joyi */}
                  {(item.code || item.specialMark || item.carPosition) && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 bg-yellow-50/80 p-2 border border-amber-200 text-xs">
                      {item.code && (
                        <div>
                          <span className="text-[9px] uppercase font-bold text-stone-500 block">Kod:</span>
                          <span className="font-mono font-black text-black">{item.code}</span>
                        </div>
                      )}
                      {item.specialMark && (
                        <div>
                          <span className="text-[9px] uppercase font-bold text-stone-500 block">Maxsus belgisi:</span>
                          <span className="font-bold text-stone-900">{item.specialMark}</span>
                        </div>
                      )}
                      {item.carPosition && (
                        <div>
                          <span className="text-[9px] uppercase font-bold text-stone-500 block">Mashinadagi joyi:</span>
                          <span className="font-bold text-stone-900">{item.carPosition}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Detallar to'ri */}
                  <div className="grid grid-cols-1 gap-1.5 text-xs">
                    {/* Yetkazib beruvchi */}
                    <div className="flex items-start gap-1.5 text-stone-800">
                      <Building2 className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="text-[10px] uppercase font-bold text-stone-500 block">Yetkazib beruvchi:</span>
                        <span className="font-black text-stone-900 break-words">{item.supplierName}</span>
                      </div>
                    </div>

                    {/* Sana & Manba */}
                    <div className="grid grid-cols-2 gap-2 bg-yellow-50/80 p-2 border border-amber-200 text-[11px]">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-stone-500 block">Sana:</span>
                        <span className="font-mono font-bold text-black flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-amber-700" />
                          {item.date}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-stone-500 block">Ma'lumot manbaasi:</span>
                        <span className="font-bold text-stone-900 break-words flex items-center gap-1">
                          <Tag className="w-3 h-3 text-amber-700 shrink-0" />
                          {item.source}
                        </span>
                      </div>
                    </div>

                    {/* Izoh */}
                    {item.comment && (
                      <div className="bg-stone-50 p-2 border border-stone-200 text-[11px] text-stone-700 break-words">
                        <span className="text-[9px] uppercase font-black text-stone-500 block">Izoh:</span>
                        <p className="italic">{item.comment}</p>
                      </div>
                    )}
                  </div>

                  {/* Pastki qism: Tahrirlash va O'chirish tugmalari */}
                  <div className="flex items-center justify-end gap-2 border-t border-amber-200 pt-2">
                    <button
                      type="button"
                      onClick={() => onEditPart(item)}
                      disabled={!isOnline}
                      className={`flex items-center gap-1 px-3 py-1.5 border text-xs font-black transition cursor-pointer ${
                        !isOnline
                          ? 'bg-stone-100 border-stone-300 text-stone-400 cursor-not-allowed'
                          : 'bg-yellow-200 hover:bg-yellow-300 border-amber-400 text-black active:scale-95'
                      }`}
                    >
                      <Edit2 className="w-3 h-3 stroke-[2.5]" />
                      <span>Tahrirlash</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => confirmDelete(item.id)}
                      disabled={!isOnline}
                      className={`flex items-center gap-1 px-3 py-1.5 border text-xs font-black transition cursor-pointer ${
                        !isOnline
                          ? 'bg-stone-100 border-stone-300 text-stone-400 cursor-not-allowed'
                          : 'bg-rose-100 hover:bg-rose-200 border-rose-400 text-rose-800 active:scale-95'
                      }`}
                    >
                      <Trash2 className="w-3 h-3 stroke-[2.5]" />
                      <span>O'chirish</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* REJIM B: MOBILDA GORIZONTAL SURILADIGAN JADVAL (Barcha ustunlar bilan, sarlavha ostida ortiqcha maydonlarsiz) */}
        {mobileViewMode === 'table' && (
          <div className="space-y-1">
            <p className="text-[10px] text-stone-600 font-bold italic px-1">
              ↔ Barcha ustunlarni ko'rish uchun jadvalni chapga/o'ngga suring (swipe)
            </p>
            <div className="border-2 border-amber-400 bg-white shadow-sm overflow-x-auto">
              <table className="min-w-[1300px] w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-yellow-200 border-b-2 border-amber-400 text-black text-[10px] font-black uppercase">
                    <th className="p-2 border-r border-amber-300 text-center w-10">№</th>
                    <th className="p-2 border-r border-amber-300 w-28">Vaqt</th>
                    <th className="p-2 border-r border-amber-300 w-36">Avto ehtiyot qism nomi</th>
                    <th className="p-2 border-r border-amber-300 w-24">Kod</th>
                    <th className="p-2 border-r border-amber-300 w-28">Maxsus belgisi</th>
                    <th className="p-2 border-r border-amber-300 w-28">Mashinadagi joyi</th>
                    <th className="p-2 border-r border-amber-300 w-28">Davlati</th>
                    <th className="p-2 border-r border-amber-300 w-24">Brend</th>
                    <th className="p-2 border-r border-amber-300 w-36">Yetkazib beruvchi</th>
                    <th className="p-2 border-r border-amber-300 text-right w-24">Narx ($)</th>
                    <th className="p-2 border-r border-amber-300 text-center w-24">Sana</th>
                    <th className="p-2 border-r border-amber-300 w-28">Manbaa</th>
                    <th className="p-2 border-r border-amber-300 w-36">Izoh</th>
                    <th className="p-2 text-center w-24">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-200">
                  {filteredParts.length === 0 ? (
                    <tr>
                      <td colSpan={14} className="p-6 text-center bg-yellow-50/50">
                        <p className="font-black text-xs text-stone-800">
                          {activeFilters.length > 0 ? "Filtr bo'yicha ehtiyot qism topilmadi" : "Avto ehtiyot qismlar mavjud emas"}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredParts.map((item, idx) => (
                      <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-yellow-50/40'}>
                        <td className="p-2 border-r border-amber-200 text-center font-mono font-black">{item.orderNumber || idx + 1}</td>
                        <td className="p-1.5 border-r border-amber-200 font-mono text-[10px] text-stone-700 leading-tight">
                          {item.systemTime}
                        </td>
                        <td className="p-2 border-r border-amber-200 font-black text-black break-words">{item.partName}</td>
                        <td className="p-2 border-r border-amber-200 font-mono text-stone-800 text-[11px] font-bold">{item.code || '—'}</td>
                        <td className="p-2 border-r border-amber-200 text-stone-800 text-[11px] font-bold">{item.specialMark || '—'}</td>
                        <td className="p-2 border-r border-amber-200 text-stone-800 text-[11px]">{item.carPosition || '—'}</td>
                        <td className="p-2 border-r border-amber-200 font-bold text-stone-900">{item.country || '—'}</td>
                        <td className="p-2 border-r border-amber-200 font-black text-[10px] uppercase text-black">{item.brand}</td>
                        <td className="p-2 border-r border-amber-200 font-bold text-stone-800 break-words">{item.supplierName}</td>
                        <td className="p-2 border-r border-amber-200 text-right font-mono font-black text-black whitespace-nowrap">{formatUSD(item.price)}</td>
                        <td className="p-2 border-r border-amber-200 text-center font-mono text-[11px] text-stone-700 whitespace-nowrap">{item.date}</td>
                        <td className="p-2 border-r border-amber-200 text-stone-700 font-semibold">{item.source}</td>
                        <td className="p-2 border-r border-amber-200 text-stone-600 text-[11px]">{item.comment || '—'}</td>
                        <td className="p-2 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => onEditPart(item)}
                              disabled={!isOnline}
                              className="p-1 bg-yellow-200 hover:bg-yellow-300 border border-amber-400 text-black cursor-pointer"
                              title="Tahrirlash"
                            >
                              <Edit2 className="w-3 h-3 stroke-[2.5]" />
                            </button>
                            <button
                              type="button"
                              onClick={() => confirmDelete(item.id)}
                              disabled={!isOnline}
                              className="p-1 bg-rose-100 hover:bg-rose-200 border border-rose-400 text-rose-800 cursor-pointer"
                              title="O'chirish"
                            >
                              <Trash2 className="w-3 h-3 stroke-[2.5]" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. DESKTOP VERSIYA (Barcha yangi ustunlar bilan toza sarlavha,              */}
      {/*    sarlavha ostidagi barcha ortiqcha maydonlar olib tashlandi)             */}
      {/* ========================================================================= */}
      <div className="hidden md:block border-2 border-amber-400 bg-white shadow-sm overflow-hidden rounded-none">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[1350px] table-fixed border-collapse text-left text-xs">
            {/* Ustun kengliklari */}
            <colgroup>
              <col style={{ width: '4%' }} />   {/* 1. № */}
              <col style={{ width: '9%' }} />   {/* 2. Vaqt */}
              <col style={{ width: '13%' }} />  {/* 3. Avto ehtiyot qism nomi */}
              <col style={{ width: '8%' }} />   {/* 4. Kod */}
              <col style={{ width: '8%' }} />   {/* 5. Maxsus belgisi */}
              <col style={{ width: '9%' }} />   {/* 6. Mashinada joylashgan joyi */}
              <col style={{ width: '8%' }} />   {/* 7. Ishlab chiqarilgan davlati */}
              <col style={{ width: '8%' }} />   {/* 8. Brend */}
              <col style={{ width: '11%' }} />  {/* 9. Yetkazib beruvchi */}
              <col style={{ width: '7%' }} />   {/* 10. Narx */}
              <col style={{ width: '7%' }} />   {/* 11. Sana */}
              <col style={{ width: '8%' }} />   {/* 12. Manbaa */}
              <col style={{ width: '9%' }} />   {/* 13. Izoh */}
              <col style={{ width: '6%' }} />   {/* 14. Amallar */}
            </colgroup>

            {/* Table Header: Toza va tartibli sarlavha (ostida hech qanday maydonlarsiz) */}
            <thead>
              <tr className="bg-yellow-200 border-b-2 border-amber-400 text-black text-[11px] font-black uppercase font-heading">
                <th className="p-2 border-r border-amber-300 text-center">№</th>
                <th className="p-2 border-r border-amber-300">Vaqt</th>
                <th className="p-2 border-r border-amber-300">Avto ehtiyot qism nomi</th>
                <th className="p-2 border-r border-amber-300">Kod</th>
                <th className="p-2 border-r border-amber-300">Maxsus belgisi</th>
                <th className="p-2 border-r border-amber-300">Mashinadagi joyi</th>
                <th className="p-2 border-r border-amber-300">Davlati</th>
                <th className="p-2 border-r border-amber-300">Brend</th>
                <th className="p-2 border-r border-amber-300">Yetkazib beruvchi</th>
                <th className="p-2 border-r border-amber-300 text-right">Narx ($)</th>
                <th className="p-2 border-r border-amber-300 text-center">Sana</th>
                <th className="p-2 border-r border-amber-300">Manbaa</th>
                <th className="p-2 border-r border-amber-300">Izoh</th>
                <th className="p-2 text-center">Amallar</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-amber-200">
              {filteredParts.length === 0 ? (
                <tr>
                  <td colSpan={14} className="p-8 text-center bg-yellow-50/50">
                    <Wrench className="w-8 h-8 text-amber-500 mx-auto mb-2 opacity-60" />
                    <p className="font-black text-sm text-stone-800">
                      {activeFilters.length > 0 ? "Filtr shartlariga mos avto ehtiyot qism topilmadi" : "Hozircha avto ehtiyot qismlar kiritilmagan"}
                    </p>
                    <p className="text-xs text-stone-600 mt-1">
                      {activeFilters.length > 0
                        ? "Barcha yozuvlarni ko'rish uchun yuqoridagi filtrlarni tozalang."
                        : isOnline
                        ? 'Yangi avto ehtiyot qism qo\'shish uchun "+ Yangi avto ehtiyot qism qo\'shish" tugmasini bosing.'
                        : "Oflayn rejimdasiz. Internetga ulangach yangi ma'lumot kiritishingiz mumkin."}
                    </p>
                    {activeFilters.length > 0 && (
                      <button
                        type="button"
                        onClick={resetAllFilters}
                        className="mt-3 px-3 py-1.5 bg-amber-400 hover:bg-amber-500 border border-amber-600 text-black font-black text-xs cursor-pointer"
                      >
                        Filtrlarni tozalash
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredParts.map((item, idx) => (
                  <tr
                    key={item.id}
                    className={`transition-colors hover:bg-yellow-100/60 text-stone-900 ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-yellow-50/40'
                    }`}
                  >
                    {/* 1. Tartib raqam */}
                    <td className="p-2 border-r border-amber-200 text-center font-mono font-black text-black">
                      {item.orderNumber || idx + 1}
                    </td>

                    {/* 2. Sistema vaqti */}
                    <td className="p-2 border-r border-amber-200 font-mono text-[10px] text-stone-700 whitespace-nowrap">
                      {item.systemTime}
                    </td>

                    {/* 3. Avto ehtiyot qism nomi */}
                    <td className="p-2 border-r border-amber-200 font-black text-black break-words">
                      {item.partName}
                    </td>

                    {/* 4. Kod */}
                    <td className="p-2 border-r border-amber-200 font-mono text-stone-800 text-[11px] font-bold">
                      {item.code ? (
                        <span className="px-1.5 py-0.5 bg-stone-100 border border-stone-300 font-mono text-[10px] text-black">
                          {item.code}
                        </span>
                      ) : (
                        <span className="text-stone-400">—</span>
                      )}
                    </td>

                    {/* 5. Maxsus belgisi */}
                    <td className="p-2 border-r border-amber-200 text-stone-800 text-[11px] font-bold">
                      {item.specialMark ? (
                        <span className="px-1.5 py-0.5 bg-amber-100 border border-amber-300 text-[10px] text-stone-900">
                          {item.specialMark}
                        </span>
                      ) : (
                        <span className="text-stone-400">—</span>
                      )}
                    </td>

                    {/* 6. Mashinada joylashgan joyi */}
                    <td className="p-2 border-r border-amber-200 text-stone-800 text-[11px]">
                      {item.carPosition ? (
                        <span className="text-stone-800 font-semibold">{item.carPosition}</span>
                      ) : (
                        <span className="text-stone-400">—</span>
                      )}
                    </td>

                    {/* 7. Ishlab chiqarilgan davlati */}
                    <td className="p-2 border-r border-amber-200">
                      {item.country ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-100 border border-emerald-400 text-[10px] font-black text-emerald-950">
                          <Globe className="w-2.5 h-2.5" />
                          {item.country}
                        </span>
                      ) : (
                        <span className="text-stone-400">—</span>
                      )}
                    </td>

                    {/* 8. Brend */}
                    <td className="p-2 border-r border-amber-200">
                      <span className="inline-block px-1.5 py-0.5 bg-amber-200 border border-amber-400 text-[10px] font-black text-black uppercase">
                        {item.brand}
                      </span>
                    </td>

                    {/* 9. Yetkazib beruvchi */}
                    <td className="p-2 border-r border-amber-200 font-bold text-stone-800 break-words">
                      {item.supplierName}
                    </td>

                    {/* 10. Narx */}
                    <td className="p-2 border-r border-amber-200 text-right font-mono font-black text-black whitespace-nowrap">
                      {formatUSD(item.price)}
                    </td>

                    {/* 11. Sana */}
                    <td className="p-2 border-r border-amber-200 text-center font-mono text-[11px] text-stone-700 whitespace-nowrap">
                      {item.date}
                    </td>

                    {/* 12. Ma'lumot manbaasi */}
                    <td className="p-2 border-r border-amber-200 text-stone-700 font-semibold break-words">
                      {item.source}
                    </td>

                    {/* 13. Izoh */}
                    <td className="p-2 border-r border-amber-200 text-stone-600 text-[11px] break-words">
                      {item.comment || <span className="text-stone-400 italic">—</span>}
                    </td>

                    {/* 14. Amallar: Tahrirlash va O'chirish */}
                    <td className="p-2 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => onEditPart(item)}
                          disabled={!isOnline}
                          className={`p-1 border transition ${
                            !isOnline
                              ? 'bg-stone-100 border-stone-300 text-stone-400 cursor-not-allowed'
                              : 'bg-yellow-200 hover:bg-yellow-300 border-amber-400 text-black cursor-pointer'
                          }`}
                          title={!isOnline ? "Oflayn rejimda tahrirlab bo'lmaydi" : 'Tahrirlash'}
                        >
                          <Edit2 className="w-3.5 h-3.5 stroke-[2.5]" />
                        </button>
                        <button
                          type="button"
                          onClick={() => confirmDelete(item.id)}
                          disabled={!isOnline}
                          className={`p-1 border transition ${
                            !isOnline
                              ? 'bg-stone-100 border-stone-300 text-stone-400 cursor-not-allowed'
                              : 'bg-rose-100 hover:bg-rose-200 border-rose-400 text-rose-800 cursor-pointer'
                          }`}
                          title={!isOnline ? "Oflayn rejimda o'chirib bo'lmaydi" : "O'chirish"}
                        >
                          <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-amber-50 border-3 border-amber-500 p-5 max-w-sm w-full shadow-2xl text-black">
            <div className="flex items-center gap-2.5 mb-3 text-rose-700">
              <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
              <h3 className="font-black text-sm uppercase">O'chirishni tasdiqlang</h3>
            </div>
            <p className="text-xs font-bold text-stone-700 mb-4">
              Ushbu avto ehtiyot qism yozuvini bazadan o'chirishga ishonchingiz komilmi? Bu amalni qaytarib bo'lmaydi.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTargetId(null)}
                className="px-3 py-1.5 bg-stone-200 hover:bg-stone-300 text-black text-xs font-black border border-stone-400 cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={executeDelete}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black border border-rose-800 cursor-pointer"
              >
                Ha, o'chirilsin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
