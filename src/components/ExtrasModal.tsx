import React, { useMemo, useState, useEffect } from 'react';
import { X, Minus, Plus, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { ExtraOption, MenuItem, SelectedExtra } from '../types';
import { getApplicableExtras, formatSize } from '../data/menuData';
import { entryNutrition } from '../lib/nutritionUtils';

interface ExtrasModalProps {
  item: MenuItem | null;
  onCancel: () => void;
  onConfirm: (item: MenuItem, extras: SelectedExtra[]) => void;
}

interface ExtraState {
  cream: number;
  milk: number;
  sugar: number;
  syrups: Record<string, { option: ExtraOption; qty: number }>;
}

const emptyState = (): ExtraState => ({
  cream: 0,
  milk: 0,
  sugar: 0,
  syrups: {},
});

export const ExtrasModal: React.FC<ExtrasModalProps> = ({
  item,
  onCancel,
  onConfirm,
}) => {
  const [state, setState] = useState<ExtraState>(emptyState());

  useEffect(() => {
    setState(emptyState());
  }, [item?.id]);

  const applicable = useMemo(
    () => (item ? getApplicableExtras(item) : null),
    [item],
  );

  if (!item || !applicable) return null;

  const toList = (): SelectedExtra[] => {
    const out: SelectedExtra[] = [];
    if (applicable.cream && state.cream > 0)
      out.push({ option: applicable.cream, qty: state.cream });
    if (applicable.milk && state.milk > 0)
      out.push({ option: applicable.milk, qty: state.milk });
    if (applicable.sugar && state.sugar > 0)
      out.push({ option: applicable.sugar, qty: state.sugar });
    for (const s of Object.values(state.syrups) as Array<{
      option: ExtraOption;
      qty: number;
    }>) {
      if (s.qty > 0) out.push({ option: s.option, qty: s.qty });
    }
    return out;
  };

  const previewNutrition = entryNutrition({
    timestamp: 0,
    item,
    extras: toList(),
  });

  const setBasic = (key: 'cream' | 'milk' | 'sugar', delta: number) => {
    setState((s) => ({ ...s, [key]: Math.max(0, Math.min(10, s[key] + delta)) }));
  };

  const setSyrup = (opt: ExtraOption, delta: number) => {
    setState((s) => {
      const current = s.syrups[opt.id]?.qty ?? 0;
      const next = Math.max(0, Math.min(10, current + delta));
      const syrups = { ...s.syrups };
      if (next === 0) delete syrups[opt.id];
      else syrups[opt.id] = { option: opt, qty: next };
      return { ...s, syrups };
    });
  };

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.95, y: 16, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 16, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
            className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <Sparkles className="w-4 h-4 text-red-600" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-red-600">
                    Customize
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 leading-tight">
                  {item.name}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Base: {item.calories} cal · {item.subcategory}
                </p>
              </div>
              <button
                onClick={onCancel}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 py-4 max-h-[60vh] overflow-y-auto scrollbar-thin space-y-5">
              {(applicable.cream || applicable.milk || applicable.sugar) && (
                <Section title="Dairy & Sugar">
                  {applicable.cream && (
                    <ExtraRow
                      label={`Cream${applicable.cream.size ? ` (${formatSize(applicable.cream.size)})` : ''}`}
                      sub={`+${applicable.cream.calories} cal each`}
                      qty={state.cream}
                      onDelta={(d) => setBasic('cream', d)}
                    />
                  )}
                  {applicable.milk && (
                    <ExtraRow
                      label={`2% Milk${applicable.milk.size ? ` (${formatSize(applicable.milk.size)})` : ''}`}
                      sub={`+${applicable.milk.calories} cal each`}
                      qty={state.milk}
                      onDelta={(d) => setBasic('milk', d)}
                    />
                  )}
                  {applicable.sugar && (
                    <ExtraRow
                      label={`Sugar${applicable.sugar.size ? ` (${formatSize(applicable.sugar.size)})` : ''}`}
                      sub={`+${applicable.sugar.calories} cal each`}
                      qty={state.sugar}
                      onDelta={(d) => setBasic('sugar', d)}
                    />
                  )}
                </Section>
              )}

              {applicable.syrups.length > 0 && (
                <Section title="Flavoured Syrups (per pump)">
                  {applicable.syrups.map((syrup) => (
                    <ExtraRow
                      key={syrup.id}
                      label={syrup.name.replace(' Flavoured Syrup', '').replace(' Syrup', '')}
                      sub={`+${syrup.calories} cal/pump`}
                      qty={state.syrups[syrup.id]?.qty ?? 0}
                      onDelta={(d) => setSyrup(syrup, d)}
                    />
                  ))}
                </Section>
              )}
            </div>

            <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
              <div className="text-sm">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-0.5">
                  Total
                </div>
                <div className="font-bold text-slate-900">
                  {Math.round(previewNutrition.calories)} cal
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={onCancel}
                  className="px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => onConfirm(item, toList())}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold shadow-md shadow-red-200 transition-colors"
                >
                  Add to Meal
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div>
    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
      {title}
    </h3>
    <div className="space-y-1.5">{children}</div>
  </div>
);

interface ExtraRowProps {
  label: string;
  sub: string;
  qty: number;
  onDelta: (delta: number) => void;
}

const ExtraRow: React.FC<ExtraRowProps> = ({ label, sub, qty, onDelta }) => {
  return (
    <div
      className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors ${
        qty > 0
          ? 'bg-red-50 border-red-200'
          : 'bg-white border-slate-100 hover:border-slate-200'
      }`}
    >
      <div className="min-w-0">
        <div className="text-sm font-semibold text-slate-800 leading-tight truncate">
          {label}
        </div>
        <div className="text-[10px] text-slate-500">{sub}</div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => onDelta(-1)}
          disabled={qty === 0}
          className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-red-600 hover:border-red-300 disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Decrease"
        >
          <Minus className="w-3 h-3" />
        </button>
        <span className="w-5 text-center text-sm font-bold tabular-nums">
          {qty}
        </span>
        <button
          onClick={() => onDelta(1)}
          className="w-7 h-7 rounded-lg bg-red-600 text-white flex items-center justify-center hover:bg-red-700"
          aria-label="Increase"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
