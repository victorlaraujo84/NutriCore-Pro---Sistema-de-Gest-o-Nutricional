import React, { useState, useMemo } from 'react';
import {
  ShoppingCart,
  Calendar,
  Sparkles,
  CheckSquare,
  Square,
  X,
  Share2,
  CheckCircle2
} from 'lucide-react';
import { DietPlan, ShoppingListFrequency, ShoppingListItem } from '../../types';
import { generateShoppingList } from '../../utils/shoppingListCalculator';

interface PatientShoppingListModalProps {
  isOpen: boolean;
  onClose: () => void;
  dietPlan: DietPlan | null;
  patientName: string;
}

export const PatientShoppingListModal: React.FC<PatientShoppingListModalProps> = ({
  isOpen,
  onClose,
  dietPlan,
  patientName,
}) => {
  const [frequency, setFrequency] = useState<ShoppingListFrequency>('semanal');
  const [prepFactorPercent, setPrepFactorPercent] = useState<number>(20);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [copiedToast, setCopiedToast] = useState<boolean>(false);

  const shoppingItems = useMemo(() => {
    if (!dietPlan) return [];
    return generateShoppingList(dietPlan, frequency, prepFactorPercent);
  }, [dietPlan, frequency, prepFactorPercent]);

  const categories = useMemo(() => {
    const cats: Record<string, ShoppingListItem[]> = {};
    shoppingItems.forEach((item) => {
      if (!cats[item.category]) cats[item.category] = [];
      cats[item.category].push(item);
    });
    return cats;
  }, [shoppingItems]);

  const toggleCheck = (id: string) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const periodDays = frequency === 'semanal' ? 7 : frequency === 'quinzenal' ? 15 : 30;

  const handleCopy = () => {
    let text = `🛒 MINHA LISTA DE COMPRAS - ${patientName}\n`;
    text += `Período: ${frequency.toUpperCase()} (${periodDays} dias) | Margem de preparo: +${prepFactorPercent}%\n\n`;

    (Object.entries(categories) as [string, ShoppingListItem[]][]).forEach(([category, items]) => {
      text += `📍 ${category.toUpperCase()}\n`;
      items.forEach((item) => {
        text += `• ${item.foodName}: ${item.unitLabel}\n`;
      });
      text += '\n';
    });

    navigator.clipboard.writeText(text);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="p-4 bg-emerald-700 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <ShoppingCart className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Minha Lista de Supermercado</h3>
              <p className="text-[11px] text-emerald-100">
                Calculada com margem de preparo & perdas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast */}
        {copiedToast && (
          <div className="bg-slate-900 text-white p-2.5 text-xs text-center flex items-center justify-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Lista de compras copiada! Pronta para colar no WhatsApp.</span>
          </div>
        )}

        {/* Frequency & Buffer Selectors */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>Duração das Compras:</span>
            </span>

            <div className="flex space-x-1 bg-white p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setFrequency('semanal')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                  frequency === 'semanal'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                7 dias
              </button>
              <button
                onClick={() => setFrequency('quinzenal')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                  frequency === 'quinzenal'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                15 dias
              </button>
              <button
                onClick={() => setFrequency('mensal')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                  frequency === 'mensal'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                30 dias
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
            <span className="text-[11px] text-slate-500 flex items-center space-x-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Margem de cocção e perdas:</span>
            </span>
            <div className="flex items-center space-x-1.5">
              {[15, 20, 25, 30].map((perc) => (
                <button
                  key={perc}
                  onClick={() => setPrepFactorPercent(perc)}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${
                    prepFactorPercent === perc
                      ? 'bg-emerald-100 border-emerald-400 text-emerald-800'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  +{perc}%
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {(Object.entries(categories) as [string, ShoppingListItem[]][]).map(([category, items]) => (
            <div key={category} className="space-y-2">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
                {category}
              </span>

              <div className="space-y-1.5">
                {items.map((item) => {
                  const isChecked = !!checkedItems[item.id];
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleCheck(item.id)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isChecked
                          ? 'bg-slate-50 border-slate-200 opacity-60'
                          : 'bg-white border-slate-200 hover:border-emerald-500 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <button type="button" className="text-emerald-600 shrink-0">
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300" />
                          )}
                        </button>
                        <span
                          className={`text-xs font-semibold truncate ${
                            isChecked ? 'line-through text-slate-400' : 'text-slate-900'
                          }`}
                        >
                          {item.foodName}
                        </span>
                      </div>

                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg shrink-0 ml-2">
                        {item.unitLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex space-x-2">
          <button
            onClick={handleCopy}
            className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-1.5"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Copiar / Compartilhar Lista</span>
          </button>
        </div>
      </div>
    </div>
  );
};
