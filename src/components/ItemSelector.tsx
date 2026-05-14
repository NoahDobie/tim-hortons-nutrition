import React, { useState, useMemo } from 'react';
import { Search, Plus, Sparkles, Calculator } from 'lucide-react';
import { Icon } from '@iconify/react';
import { MENU_DATA, ALL_ITEMS } from '../data/menuData';
import type { MenuItem } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import {
  categoryIcon,
  categoryShortName,
  iconForItem,
} from '../lib/emoji';
import { useHorizontalWheel } from '../lib/useHorizontalWheel';

interface ItemSelectorProps {
  onSelectItem: (item: MenuItem) => void;
}

export const ItemSelector: React.FC<ItemSelectorProps> = ({ onSelectItem }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>(
    MENU_DATA[0]?.name ?? '',
  );
  const [activeSubcategory, setActiveSubcategory] = useState<string>('All');

  const categoryRowRef = useHorizontalWheel<HTMLDivElement>();
  const subcategoryRowRef = useHorizontalWheel<HTMLDivElement>();

  const currentCategory = useMemo(
    () => MENU_DATA.find((c) => c.name === activeCategory),
    [activeCategory],
  );

  const subcategoryChips = useMemo(() => {
    if (!currentCategory) return [];
    return ['All', ...currentCategory.subcategories.map((s) => s.name)];
  }, [currentCategory]);

  const filteredItems: MenuItem[] = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (q) {
      return ALL_ITEMS.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.subcategory.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q),
      );
    }
    if (!currentCategory) return [];
    if (activeSubcategory === 'All') {
      return currentCategory.subcategories.flatMap((s) => s.items);
    }
    return (
      currentCategory.subcategories.find((s) => s.name === activeSubcategory)
        ?.items ?? []
    );
  }, [searchTerm, currentCategory, activeSubcategory]);

  const grouped = useMemo(() => {
    if (searchTerm.trim() || activeSubcategory !== 'All') {
      return [{ name: '', items: filteredItems }];
    }
    return (
      currentCategory?.subcategories.map((s) => ({
        name: s.name,
        items: s.items,
      })) ?? []
    );
  }, [filteredItems, currentCategory, searchTerm, activeSubcategory]);

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-100 shadow-xl shadow-slate-200">
      <div className="p-4 sm:p-6 pb-3 sm:pb-4 bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Calculator className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
            Add Items
          </h2>
        </div>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder={`Search ${ALL_ITEMS.length} menu items...`}
            className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-red-500 transition-all outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {!searchTerm && (
          <>
            <div
              ref={categoryRowRef}
              className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none"
            >
              {MENU_DATA.map((cat) => {
                const active = activeCategory === cat.name;
                return (
                  <button
                    key={cat.name}
                    onClick={() => {
                      setActiveCategory(cat.name);
                      setActiveSubcategory('All');
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap text-xs font-semibold transition-all shrink-0 ${
                      active
                        ? 'bg-red-600 text-white shadow-md shadow-red-200'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Icon
                      icon={categoryIcon(cat.name)}
                      className="w-3.5 h-3.5"
                    />
                    <span>{categoryShortName(cat.name)}</span>
                    <span
                      className={`text-[10px] tabular-nums ${active ? 'text-red-100' : 'text-slate-400'}`}
                    >
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div
              ref={subcategoryRowRef}
              className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1 mt-1"
            >
              {subcategoryChips.map((sub) => {
                const active = activeSubcategory === sub;
                return (
                  <button
                    key={sub}
                    onClick={() => setActiveSubcategory(sub)}
                    className={`px-2.5 py-1 rounded-full whitespace-nowrap text-[11px] font-medium transition-all shrink-0 ${
                      active
                        ? 'bg-slate-900 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-400'
                    }`}
                  >
                    {sub}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 sm:px-4 pb-4 space-y-4 scrollbar-thin">
        {grouped.map((group) => (
          <div key={group.name || 'search'} className="space-y-2">
            {group.name && (
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 sticky top-0 z-10 bg-slate-50 -mx-4 px-4 py-2">
                {group.name}
              </h3>
            )}
            <AnimatePresence mode="popLayout">
              {group.items.map((item) => (
                <motion.div
                  layout
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="group flex items-center justify-between p-3 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-xl transition-all duration-150 cursor-pointer shadow-sm hover:shadow-md"
                  onClick={() => onSelectItem(item)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 shrink-0 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-red-100 group-hover:text-red-700 transition-colors">
                      <Icon icon={iconForItem(item)} className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-slate-900 leading-tight text-sm flex items-baseline min-w-0">
                        <span className="truncate">{item.baseName ?? item.name}</span>
                        {item.size && (
                          <span className="ml-1 mr-2 text-slate-500 font-normal shrink-0">
                            ({item.size})
                          </span>
                        )}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <span className="truncate">{item.subcategory}</span>
                        {item.customizable && (
                          <span className="inline-flex items-center gap-0.5 text-red-600 font-semibold shrink-0">
                            <Sparkles className="w-2.5 h-2.5" />
                            Customizable
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="font-bold text-slate-900 text-sm leading-none">
                        {item.calories}
                      </p>
                      <p className="text-[10px] text-slate-400 leading-none">
                        cal
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-all">
                      <Plus className="w-4 h-4" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ))}

        {filteredItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Search className="w-12 h-12 mb-2 opacity-20" />
            <p>No items match your search</p>
          </div>
        )}
      </div>
    </div>
  );
};
