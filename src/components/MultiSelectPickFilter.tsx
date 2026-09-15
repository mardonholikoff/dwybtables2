import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronDown, Search, X, Check } from 'lucide-react';

interface MultiSelectPickFilterProps {
  id?: string;
  label: string;
  options: string[];
  counts: Record<string, number>;
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  disabledTooltip?: string;
  required?: boolean;
}

export const MultiSelectPickFilter: React.FC<MultiSelectPickFilterProps> = ({
  id,
  label,
  options,
  counts,
  selected,
  onChange,
  placeholder = 'Barchasi',
  disabled = false,
  disabledTooltip = 'Avval qism nomini tanlang',
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const formatDisplayValue = (val: string) => {
    if (val === '') return "(Bo'sh / Kiritilmagan)";
    return val;
  };

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase().trim();
    return options.filter((opt) => {
      const display = formatDisplayValue(opt).toLowerCase();
      return display.includes(q) || opt.toLowerCase().includes(q);
    });
  }, [options, search]);

  const handleToggle = (val: string) => {
    if (disabled) return;
    if (selected.includes(val)) {
      onChange(selected.filter((item) => item !== val));
    } else {
      onChange([...selected, val]);
    }
  };

  const handleSelectAll = () => {
    if (disabled) return;
    onChange([...options]);
  };

  const handleClear = () => {
    if (disabled) return;
    onChange([]);
  };

  const isAllSelected = options.length > 0 && selected.length === options.length;
  const hasSelection = selected.length > 0;

  return (
    <div ref={containerRef} className="relative space-y-1 text-black font-sans" id={id}>
      {/* Label, Required badge, and Top Clear */}
      <div className="flex items-center justify-between text-[10px] font-black uppercase text-stone-800">
        <div className="flex items-center gap-1 truncate mr-1">
          <span className="truncate">{label}</span>
          {required && (
            <span className="px-1 py-0.2 bg-rose-200 border border-rose-400 text-rose-950 text-[9px] font-black shrink-0">
              Majburiy
            </span>
          )}
        </div>
        {hasSelection && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="text-rose-600 hover:text-rose-800 hover:underline text-[9px] font-bold shrink-0 cursor-pointer"
            title="Ushbu filtrni tozalash"
          >
            Tozalash
          </button>
        )}
      </div>

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-1 px-2 py-1.5 text-xs font-bold border-2 transition rounded-none text-left ${
          disabled
            ? 'bg-stone-100 border-stone-300 text-stone-400 cursor-not-allowed'
            : hasSelection
            ? 'bg-amber-100 border-amber-600 text-black shadow-xs font-black cursor-pointer'
            : 'bg-white border-amber-400 text-stone-700 hover:bg-yellow-50 cursor-pointer'
        }`}
        title={
          disabled
            ? disabledTooltip
            : hasSelection
            ? `${selected.length} ta tanlangan: ${selected.map(formatDisplayValue).join(', ')}`
            : placeholder
        }
      >
        <div className="truncate flex items-center gap-1 min-w-0">
          {disabled ? (
            <span className="text-[11px] text-stone-400 italic truncate flex items-center gap-1">
              <span>🔒</span> {placeholder}
            </span>
          ) : hasSelection ? (
            <span className="inline-flex items-center gap-1 min-w-0">
              <span className="px-1.5 py-0.2 bg-amber-400 border border-amber-600 text-black font-black text-[10px] shrink-0">
                {selected.length} ta
              </span>
              <span className="text-[11px] font-black truncate text-stone-900">
                {selected.length === 1
                  ? formatDisplayValue(selected[0])
                  : `${formatDisplayValue(selected[0])} +${selected.length - 1}`}
              </span>
            </span>
          ) : (
            <span className="text-[11px] text-stone-600 font-semibold truncate">
              {placeholder} ({options.length})
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 shrink-0 transition-transform ${
            disabled
              ? 'text-stone-300'
              : isOpen
              ? 'rotate-180 text-amber-900'
              : 'text-stone-700'
          }`}
        />
      </button>

      {/* Popover Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute top-full left-0 z-40 mt-1 w-full min-w-[240px] max-w-[320px] bg-white border-2 border-amber-500 shadow-xl p-2 space-y-2 rounded-none animate-in fade-in zoom-in-95 duration-100">
          {/* Search box inside dropdown */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-stone-500 absolute left-2 top-2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ro'yxatdan qidirish..."
              autoFocus
              className="w-full pl-7 pr-6 py-1 text-xs border border-amber-300 bg-yellow-50/50 text-black font-semibold focus:outline-none focus:border-amber-600 focus:bg-white rounded-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-1.5 top-1.5 text-stone-400 hover:text-stone-700 p-0.5 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Quick Actions (Select All / Clear) */}
          <div className="flex items-center justify-between text-[10px] border-b border-amber-200 pb-1 px-0.5">
            <button
              type="button"
              onClick={handleSelectAll}
              disabled={isAllSelected}
              className={`font-black underline cursor-pointer ${
                isAllSelected ? 'text-stone-400 no-underline cursor-default' : 'text-amber-900 hover:text-black'
              }`}
            >
              Barchasini tanlash
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={!hasSelection}
              className={`font-black underline cursor-pointer ${
                !hasSelection ? 'text-stone-400 no-underline cursor-default' : 'text-rose-700 hover:text-rose-900'
              }`}
            >
              Tozalash
            </button>
          </div>

          {/* Options Checklist */}
          <div className="max-h-48 overflow-y-auto space-y-0.5 divide-y divide-amber-100 pr-1">
            {filteredOptions.length === 0 ? (
              <div className="py-3 text-center text-xs text-stone-500 italic">
                Mos keladigan ma'lumot topilmadi
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isChecked = selected.includes(opt);
                const count = counts[opt] || 0;
                const displayText = formatDisplayValue(opt);
                const isBlank = opt === '';
                return (
                  <label
                    key={opt || '__blank__'}
                    className={`flex items-center gap-2 p-1.5 text-xs font-bold cursor-pointer transition select-none ${
                      isChecked
                        ? 'bg-amber-200/80 text-black font-black'
                        : 'hover:bg-yellow-100/70 text-stone-800'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggle(opt)}
                      className="w-3.5 h-3.5 accent-amber-600 border-amber-400 rounded-none cursor-pointer shrink-0"
                    />
                    <span className={`truncate flex-1 text-[11px] ${isBlank ? 'italic text-stone-500 font-semibold' : ''}`}>
                      {displayText}
                    </span>
                    <span className="text-[10px] font-mono text-stone-600 bg-amber-100 px-1 py-0.2 border border-amber-300 shrink-0">
                      {count}
                    </span>
                  </label>
                );
              })
            )}
          </div>

          {/* Bottom Summary Bar */}
          <div className="pt-1.5 border-t border-amber-200 flex items-center justify-between text-[10px] text-stone-600">
            <span>
              Tanlandi: <strong className="text-black">{selected.length}</strong> / {options.length}
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-2 py-0.5 bg-amber-300 hover:bg-amber-400 border border-amber-500 text-black font-black text-[10px] cursor-pointer"
            >
              Yopish
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
