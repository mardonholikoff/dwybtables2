import React, { useState } from 'react';
import {
  Droplet,
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
} from 'lucide-react';
import { AutoPart } from '../types';
import { exportAutoPartsToExcel } from '../utils/excelExport';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { formatUSD } from '../utils/formatCurrency';

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

  const handleExport = () => {
    exportAutoPartsToExcel(parts);
  };

  const confirmDelete = (id: string) => {
    if (!isOnline) {
      alert('Oflayn rejimda yozuvni o\'chirish imkoniyati cheklangan!');
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
  const totalPrice = parts.reduce((acc, curr) => acc + (curr.price || 0), 0);

  return (
    <div id="autoparts-container" className="w-full space-y-3">
      {/* Top action toolbar */}
      <div className="bg-yellow-100/95 border-2 border-amber-400 p-3 sm:p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-black rounded-none">
        
        {/* Title & Count */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="p-2 bg-amber-400 border border-amber-600 text-black shrink-0">
            <Droplet className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-black uppercase tracking-wider text-black font-heading truncate">
                Moylar
              </h1>
              <span className="px-2 py-0.5 bg-amber-300 border border-amber-500 text-xs font-black shrink-0">
                {totalItems} ta yozuv
              </span>
            </div>
            <p className="text-[11px] font-bold text-stone-700">
              Jami qiymat: <span className="text-black font-black">{formatUSD(totalPrice)} USD</span>
            </p>
          </div>
        </div>

        {/* Buttons: Add & Excel Export */}
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          {/* Excel Export */}
          <button
            type="button"
            onClick={handleExport}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-200 hover:bg-amber-300 border-2 border-amber-500 text-black text-xs font-black transition cursor-pointer active:scale-95 shadow-2xs rounded-none"
            title="Moylar jadvalini Excel (.xlsx) formatida yuklab olish"
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
                ? 'Oflayn rejim: Baza faqat ko\'rish uchun ochiq, yangi yozuv qo\'shib bo\'lmaydi'
                : 'Yangi moy qo\'shish'
            }
          >
            {!isOnline ? (
              <WifiOff className="w-4 h-4 text-rose-700 stroke-[2.5]" />
            ) : (
              <Plus className="w-4 h-4 stroke-[3]" />
            )}
            <span>
              {!isOnline ? 'Oflayn' : '+ Yangi moy qo\'shish'}
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

        {/* REJIM A: MOBIL IXCHAM KARTALAR (Ekran bo'yicha 100% sig'adi, chiroyli va ixcham) */}
        {mobileViewMode === 'cards' && (
          <div className="space-y-2.5">
            {parts.length === 0 ? (
              <div className="p-6 text-center bg-yellow-50/70 border-2 border-amber-300 text-black">
                <Droplet className="w-7 h-7 text-amber-500 mx-auto mb-1.5 opacity-60" />
                <p className="font-black text-sm text-stone-800">Hozircha moylar yo'q</p>
                <p className="text-xs text-stone-600 mt-1">
                  Yangi moy qo'shish uchun "+ Yangi moy qo'shish" tugmasini bosing
                </p>
              </div>
            ) : (
              parts.map((item, idx) => (
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

        {/* REJIM B: MOBILDA GORIZONTAL SURILADIGAN JADVAL (Ustunlar siqilmasdan to'liq ko'rinadi) */}
        {mobileViewMode === 'table' && (
          <div className="space-y-1">
            <p className="text-[10px] text-stone-600 font-bold italic px-1">
              ↔ Barcha ustunlarni ko'rish uchun jadvalni chapga/o'ngga suring (swipe)
            </p>
            <div className="border-2 border-amber-400 bg-white shadow-sm overflow-x-auto">
              <table className="min-w-[850px] w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-yellow-200 border-b-2 border-amber-400 text-black text-[10px] font-black uppercase">
                    <th className="p-2 border-r border-amber-300 text-center w-10">№</th>
                    <th className="p-2 border-r border-amber-300 w-28">Vaqt</th>
                    <th className="p-2 border-r border-amber-300 w-36">Moy nomi</th>
                    <th className="p-2 border-r border-amber-300 w-24">Brend</th>
                    <th className="p-2 border-r border-amber-300 w-36">Yetkazib beruvchi</th>
                    <th className="p-2 border-r border-amber-300 text-right w-28">Narx ($)</th>
                    <th className="p-2 border-r border-amber-300 text-center w-24">Sana</th>
                    <th className="p-2 border-r border-amber-300 w-28">Manba</th>
                    <th className="p-2 border-r border-amber-300 w-36">Izoh</th>
                    <th className="p-2 text-center w-24">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-200">
                  {parts.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-6 text-center bg-yellow-50/50">
                        <p className="font-black text-xs text-stone-800">Moylar mavjud emas</p>
                      </td>
                    </tr>
                  ) : (
                    parts.map((item, idx) => (
                      <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-yellow-50/40'}>
                        <td className="p-2 border-r border-amber-200 text-center font-mono font-black">{item.orderNumber || idx + 1}</td>
                        <td className="p-1.5 border-r border-amber-200 font-mono text-[10px] text-stone-700 leading-tight">
                          {(() => {
                            const raw = item.systemTime || '';
                            const p = raw.split(/,\s*|\s+/);
                            const datePart = p[0] || raw;
                            const timePart = p.slice(1).join(' ');
                            return (
                              <div className="flex flex-col">
                                <span className="font-bold text-stone-900 whitespace-nowrap">{datePart}</span>
                                {timePart && <span className="text-[9px] text-stone-500 whitespace-nowrap">{timePart}</span>}
                              </div>
                            );
                          })()}
                        </td>
                        <td className="p-2 border-r border-amber-200 font-black text-black break-words">{item.partName}</td>
                        <td className="p-2 border-r border-amber-200 font-black text-[10px] uppercase text-black">{item.brand}</td>
                        <td className="p-2 border-r border-amber-200 font-bold text-stone-800 break-words">{item.supplierName}</td>
                        <td className="p-2 border-r border-amber-200 text-right font-mono font-black text-black whitespace-nowrap">{formatUSD(item.price)}</td>
                        <td className="p-2 border-r border-amber-200 text-center font-mono text-[11px] text-stone-700 whitespace-nowrap">{item.date}</td>
                        <td className="p-2 border-r border-amber-200 text-stone-700 font-semibold">{item.source}</td>
                        <td className="p-2 border-r border-amber-200 text-stone-600 text-[11px]">{item.comment}</td>
                        <td className="p-2 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => onEditPart(item)}
                              disabled={!isOnline}
                              className="p-1 bg-yellow-200 hover:bg-yellow-300 border border-amber-400 text-black cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3 stroke-[2.5]" />
                            </button>
                            <button
                              type="button"
                              onClick={() => confirmDelete(item.id)}
                              disabled={!isOnline}
                              className="p-1 bg-rose-100 hover:bg-rose-200 border border-rose-400 text-rose-800 cursor-pointer"
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
      {/* 2. DESKTOP VERSIYA (O'zgarishsiz qoldirildi: "desktopsa esa shubday qolaversin") */}
      {/* ========================================================================= */}
      <div className="hidden md:block border-2 border-amber-400 bg-white shadow-sm overflow-hidden rounded-none">
        <div className="w-full overflow-x-auto">
          <table className="w-full table-fixed border-collapse text-left text-xs">
            {/* Column Widths calibrated to prevent horizontal scrolling on standard screens */}
            <colgroup>
              <col style={{ width: '4%' }} />   {/* 1. № */}
              <col style={{ width: '11%' }} />  {/* 2. Sistema vaqti */}
              <col style={{ width: '15%' }} />  {/* 3. Moy nomi */}
              <col style={{ width: '10%' }} />  {/* 4. Brend */}
              <col style={{ width: '16%' }} />  {/* 5. Yetkazib beruvchi */}
              <col style={{ width: '11%' }} />  {/* 6. Narx */}
              <col style={{ width: '9%' }} />   {/* 7. Sana */}
              <col style={{ width: '11%' }} />  {/* 8. Manba */}
              <col style={{ width: '15%' }} />  {/* 9. Izoh */}
              <col style={{ width: '8%' }} />   {/* Amallar */}
            </colgroup>

            {/* Table Header */}
            <thead>
              <tr className="bg-yellow-200 border-b-2 border-amber-400 text-black text-[11px] font-black uppercase font-heading">
                <th className="p-2 border-r border-amber-300 text-center">№</th>
                <th className="p-2 border-r border-amber-300">Vaqt</th>
                <th className="p-2 border-r border-amber-300">Moy nomi</th>
                <th className="p-2 border-r border-amber-300">Brend</th>
                <th className="p-2 border-r border-amber-300">Yetkazib beruvchi</th>
                <th className="p-2 border-r border-amber-300 text-right">Narx ($)</th>
                <th className="p-2 border-r border-amber-300 text-center">Sana</th>
                <th className="p-2 border-r border-amber-300">Manba</th>
                <th className="p-2 border-r border-amber-300">Izoh</th>
                <th className="p-2 text-center">Amallar</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-amber-200">
              {parts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center bg-yellow-50/50">
                    <Droplet className="w-8 h-8 text-amber-500 mx-auto mb-2 opacity-60" />
                    <p className="font-black text-sm text-stone-800">
                      Hozircha moylar kiritilmagan
                    </p>
                    <p className="text-xs text-stone-600 mt-1">
                      {isOnline
                        ? 'Yangi moy qo\'shish uchun "+ Yangi moy qo\'shish" tugmasini bosing.'
                        : 'Oflayn rejimdasiz. Internetga ulangach yangi ma\'lumot kiritishingiz mumkin.'}
                    </p>
                  </td>
                </tr>
              ) : (
                parts.map((item, idx) => (
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

                    {/* 4. Brend */}
                    <td className="p-2 border-r border-amber-200">
                      <span className="inline-block px-1.5 py-0.5 bg-amber-200 border border-amber-400 text-[10px] font-black text-black uppercase">
                        {item.brand}
                      </span>
                    </td>

                    {/* 5. Yetkazib beruvchi */}
                    <td className="p-2 border-r border-amber-200 font-bold text-stone-800 break-words">
                      {item.supplierName}
                    </td>

                    {/* 6. Narx */}
                    <td className="p-2 border-r border-amber-200 text-right font-mono font-black text-black whitespace-nowrap">
                      {formatUSD(item.price)}
                    </td>

                    {/* 7. Sana */}
                    <td className="p-2 border-r border-amber-200 text-center font-mono text-[11px] text-stone-700 whitespace-nowrap">
                      {item.date}
                    </td>

                    {/* 8. Ma'lumot manbaasi */}
                    <td className="p-2 border-r border-amber-200 text-stone-700 font-semibold break-words">
                      {item.source}
                    </td>

                    {/* 9. Izoh */}
                    <td className="p-2 border-r border-amber-200 text-stone-600 text-[11px] break-words">
                      {item.comment}
                    </td>

                    {/* Amallar: Tahrirlash va O'chirish */}
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
                          title={!isOnline ? 'Oflayn rejimda tahrirlab bo\'lmaydi' : 'Tahrirlash'}
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
                          title={!isOnline ? 'Oflayn rejimda o\'chirib bo\'lmaydi' : 'O\'chirish'}
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
              Ushbu moy yozuvini bazadan o'chirishga ishonchingiz komilmi? Bu amalni qaytarib bo'lmaydi.
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
