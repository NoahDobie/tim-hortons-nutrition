import React, { useState, useMemo } from 'react';
import {
  Trash2,
  Info,
  Coffee,
  ShoppingBasket,
  Sparkles,
} from 'lucide-react';
import type { MenuItem, MealEntry, SelectedExtra } from './types';
import { ItemSelector } from './components/ItemSelector';
import { NutritionLabel } from './components/NutritionLabel';
import { ExtrasModal } from './components/ExtrasModal';
import { aggregateMeal, entryNutrition } from './lib/nutritionUtils';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [entries, setEntries] = useState<MealEntry[]>([]);
  const [pendingItem, setPendingItem] = useState<MenuItem | null>(null);

  const handleSelectItem = (item: MenuItem) => {
    if (item.customizable) {
      setPendingItem(item);
    } else {
      setEntries((prev) => [
        ...prev,
        { item, extras: [], timestamp: Date.now() },
      ]);
    }
  };

  const handleConfirmExtras = (item: MenuItem, extras: SelectedExtra[]) => {
    setEntries((prev) => [
      ...prev,
      { item, extras, timestamp: Date.now() + Math.random() },
    ]);
    setPendingItem(null);
  };

  const handleRemoveEntry = (timestamp: number) => {
    setEntries((prev) => prev.filter((e) => e.timestamp !== timestamp));
  };

  const handleClearAll = () => setEntries([]);

  const mealNutrition = useMemo(() => aggregateMeal(entries), [entries]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFCFB] text-slate-900 font-sans selection:bg-red-100 selection:text-red-900">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-lg sm:text-xl font-black italic tracking-tighter text-red-700 shrink-0">
              Tim Hortons
            </h1>
            <span className="hidden sm:inline-block bg-slate-100 text-slate-500 text-[10px] px-1.5 py-0.5 rounded font-mono uppercase tracking-wider ml-1 truncate">
              Nutrition Calculator by Noah Dobie
            </span>
            <span className="sm:hidden text-slate-500 text-[10px] font-mono uppercase tracking-wider truncate">
              Nutrition Calculator
            </span>
          </div>


        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12 items-start">
          <div className="lg:col-span-5 flex flex-col h-[70vh] min-h-105 max-h-160 lg:h-200 lg:max-h-none">
            <ItemSelector onSelectItem={handleSelectItem} />
          </div>

          <div className="lg:col-span-7 space-y-6 sm:space-y-8">
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl shadow-slate-200 border border-slate-100">
              <div className="flex items-center justify-between mb-4 sm:mb-6 gap-2">
                <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2 min-w-0">
                  <ShoppingBasket className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 shrink-0" />
                  <span className="truncate">Your Meal</span>
                </h2>
                {entries.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="text-slate-400 hover:text-red-600 flex items-center gap-1.5 text-sm font-medium transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear All
                  </button>
                )}
              </div>

              <div className="min-h-25 max-h-70 sm:max-h-85 overflow-y-auto pr-1 sm:pr-2 space-y-2 mb-4 sm:mb-6 scrollbar-thin">
                <AnimatePresence mode="popLayout" initial={false}>
                  {entries.map((entry) => {
                    const total = entryNutrition(entry);
                    return (
                      <motion.div
                        key={entry.timestamp}
                        layout
                        initial={{ opacity: 0, scale: 0.95, x: -16 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95, x: 16 }}
                        className="p-3 bg-slate-50 border border-slate-100 rounded-xl group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-slate-800 truncate">
                              {entry.item.name}
                            </span>
                            <span className="text-xs text-slate-500">
                              {Math.round(total.calories)} cal total
                              {entry.extras.length > 0 && (
                                <span className="ml-1 text-red-600 font-semibold">
                                  · {entry.extras.length} extra
                                  {entry.extras.length === 1 ? '' : 's'}
                                </span>
                              )}
                            </span>
                          </div>
                          <button
                            onClick={() => handleRemoveEntry(entry.timestamp)}
                            className="p-2 text-slate-400 opacity-0 group-hover:opacity-100 hover:text-red-600 hover:bg-white rounded-lg transition-all"
                            aria-label="Remove"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        {entry.extras.length > 0 && (
                          <ul className="mt-2 pt-2 border-t border-slate-200/70 space-y-0.5">
                            {entry.extras.map((ex) => (
                              <li
                                key={ex.option.id}
                                className="flex items-center gap-1.5 text-[11px] text-slate-600"
                              >
                                <Sparkles className="w-2.5 h-2.5 text-red-500 shrink-0" />
                                <span className="font-medium">{ex.qty}×</span>
                                <span className="truncate">
                                  {ex.option.name}
                                </span>
                                <span className="ml-auto text-slate-400">
                                  +{ex.option.calories * ex.qty} cal
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {entries.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl">
                    <p className="text-center italic px-4">
                      Select items from the menu to calculate your meal's
                      nutrition. Beverages can be customized with cream, milk,
                      sugar, and syrups.
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-4 gap-2 sm:gap-4 p-3 sm:p-4 bg-slate-900 rounded-2xl text-white">
                <div className="text-center min-w-0">
                  <p className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-black tracking-wider sm:tracking-widest leading-none mb-1">
                    Calories
                  </p>
                  <p className="text-lg sm:text-xl font-bold tabular-nums">
                    {Math.round(mealNutrition.calories)}
                  </p>
                </div>
                <div className="text-center border-l border-slate-700 min-w-0">
                  <p className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-black tracking-wider sm:tracking-widest leading-none mb-1">
                    Fat (g)
                  </p>
                  <p className="text-lg sm:text-xl font-bold tabular-nums">
                    {mealNutrition.fat.toFixed(1)}
                  </p>
                </div>
                <div className="text-center border-l border-slate-700 min-w-0">
                  <p className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-black tracking-wider sm:tracking-widest leading-none mb-1">
                    Carbs (g)
                  </p>
                  <p className="text-lg sm:text-xl font-bold tabular-nums">
                    {mealNutrition.carbohydrates.toFixed(1)}
                  </p>
                </div>
                <div className="text-center border-l border-slate-700 min-w-0">
                  <p className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-black tracking-wider sm:tracking-widest leading-none mb-1">
                    Protein (g)
                  </p>
                  <p className="text-lg sm:text-xl font-bold tabular-nums">
                    {mealNutrition.protein.toFixed(1)}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 p-1">
              <div className="space-y-4 order-2 md:order-1">
                <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                  <Info className="w-5 h-5 text-red-600 shrink-0" />
                  Nutrition Facts
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Add items from the menu and see the combined nutrition for your whole meal — including any extras or customizations you've added.
                </p>
                <div className="p-3 sm:p-4 bg-pink-50 border border-pink-100 rounded-2xl text-xs text-pink-900 flex gap-3">
                  <Info className="w-6 h-6 sm:w-8 sm:h-8 shrink-0 text-pink-500" />
                  <p>
                    Heads up — numbers are based on standard recipes and might not be spot-on. Actual nutrition can vary by location, substitutions, or how your order is made.
                  </p>
                </div>
              </div>

              <div className="flex justify-center md:justify-end order-1 md:order-2">
                <NutritionLabel
                  data={mealNutrition}
                  servingSizeLabel={
                    entries.length > 0
                      ? `${entries.length} item${entries.length === 1 ? '' : 's'} total`
                      : 'Select an item'
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-8 sm:mt-12 py-8 sm:py-12 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-300 text-[10px] max-w-2xl mx-auto leading-tight">
            Made by Noah Dobie to help people get a rough idea of what they're eating at Tim Hortons. This tool is not affiliated with or endorsed by Tim Hortons. Nutrition data is based on publicly available standard formulations and may not be 100% accurate — always check in-store or on the official website for the most up-to-date info.
          </p>
        </div>
      </footer>

      <ExtrasModal
        item={pendingItem}
        onCancel={() => setPendingItem(null)}
        onConfirm={handleConfirmExtras}
      />
    </div>
  );
}
