import React, { useState, useMemo } from 'react';
import { useNutrition } from '../../context/NutritionContext';
import {
  ShoppingCart,
  Calendar,
  Layers,
  Sparkles,
  Printer,
  Copy,
  CheckCircle2,
  Filter,
  CheckSquare,
  Square,
  Utensils,
  ChevronDown,
  Info
} from 'lucide-react';
import { generateShoppingList } from '../../utils/shoppingListCalculator';
import { ShoppingListFrequency, ShoppingListItem } from '../../types';

interface ShoppingListViewProps {
  onBackToDietPlanner?: () => void;
}

export const ShoppingListView: React.FC<ShoppingListViewProps> = () => {
  const { activeDietPlan, selectedPatientForDetail, activePatient } = useNutrition();
  const patient = selectedPatientForDetail || activePatient;
  const dietPlan = activeDietPlan;

  const [frequency, setFrequency] = useState<ShoppingListFrequency>('semanal');
  const [prepFactorPercent, setPrepFactorPercent] = useState<number>(20); // 15% to 30%
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [copiedToast, setCopiedToast] = useState<boolean>(false);

  const shoppingItems = useMemo(() => {
    if (!dietPlan) return [];
    return generateShoppingList(dietPlan, frequency, prepFactorPercent);
  }, [dietPlan, frequency, prepFactorPercent]);

  const toggleCheckItem = (id: string) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Group items by supermarket aisle / category
  const categories = useMemo(() => {
    const cats: Record<string, ShoppingListItem[]> = {};
    shoppingItems.forEach((item) => {
      if (!cats[item.category]) cats[item.category] = [];
      cats[item.category].push(item);
    });
    return cats;
  }, [shoppingItems]);

  const filteredCategories = useMemo(() => {
    if (selectedCategoryFilter === 'all') return categories;
    return {
      [selectedCategoryFilter]: categories[selectedCategoryFilter] || [],
    };
  }, [categories, selectedCategoryFilter]);

  const periodDays = frequency === 'semanal' ? 7 : frequency === 'quinzenal' ? 15 : 30;

  const handleCopyClipboard = () => {
    let text = `🛒 LISTA DE COMPRAS - ${patient?.name || 'Paciente'}\n`;
    text += `Período: ${frequency.toUpperCase()} (${periodDays} dias) | Margem de perda/cocção: +${prepFactorPercent}%\n\n`;

    (Object.entries(categories) as [string, ShoppingListItem[]][]).forEach(([category, items]) => {
      text += `📍 ${category.toUpperCase()}\n`;
      items.forEach((item) => {
        text += `• ${item.foodName}: ${item.unitLabel} (consumo diário: ${item.dailyG}g)\n`;
      });
      text += '\n';
    });

    navigator.clipboard.writeText(text);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!dietPlan || !dietPlan.meals || dietPlan.meals.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
        <ShoppingCart className="w-10 h-10 text-slate-300 mx-auto" />
        <h3 className="text-sm font-bold text-slate-800">
          Nenhum plano alimentar ativo com alimentos cadastrados.
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Monte primeiro as refeições na aba "Plano Alimentar" para gerar a lista de compras automática com cálculo de perdas e porções periódicas.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {copiedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center space-x-2 border border-emerald-500/50 animate-in fade-in zoom-in-95">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-semibold">
            Lista de compras copiada para a área de transferência!
          </span>
        </div>
      )}

      {/* Top Banner Control Panel */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Lista de Compras Inteligente
            </h2>
            <p className="text-xs text-slate-500">
              Consolidada a partir do cardápio de {patient?.name} com margem de preparo e perdas
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopyClipboard}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copiar Texto</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-colors shadow-xs"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-400" />
            <span>Imprimir Lista</span>
          </button>
        </div>
      </div>

      {/* Settings Grid: Frequency (Semanal, Quinzenal, Mensal) & Prep Loss Margin (15% a 30%) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Frequency Selector */}
          <div className="md:col-span-6 space-y-2">
            <label className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>Periodicidade das Compras</span>
            </label>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFrequency('semanal')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center ${
                  frequency === 'semanal'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>Semanal</span>
                <span className={`text-[10px] font-normal ${frequency === 'semanal' ? 'text-emerald-100' : 'text-slate-400'}`}>
                  7 dias
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFrequency('quinzenal')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center ${
                  frequency === 'quinzenal'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>Quinzenal</span>
                <span className={`text-[10px] font-normal ${frequency === 'quinzenal' ? 'text-emerald-100' : 'text-slate-400'}`}>
                  15 dias
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFrequency('mensal')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center ${
                  frequency === 'mensal'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>Mensal</span>
                <span className={`text-[10px] font-normal ${frequency === 'mensal' ? 'text-emerald-100' : 'text-slate-400'}`}>
                  30 dias
                </span>
              </button>
            </div>
          </div>

          {/* Prep Loss Factor Slider (15% a 30%) */}
          <div className="md:col-span-6 space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Margem de Perda / Fator de Cocção</span>
              </label>
              <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg">
                +{prepFactorPercent}% (Peso Bruto)
              </span>
            </div>

            <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                <span>15% (Mínimo sugerido)</span>
                <span className="font-bold text-slate-700">Recomendado: 20-25%</span>
                <span>30% (Máximo)</span>
              </div>
              <input
                type="range"
                min="15"
                max="30"
                step="5"
                value={prepFactorPercent}
                onChange={(e) => setPrepFactorPercent(parseInt(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <p className="text-[10px] text-slate-400 italic">
                Compensa a perda de água na grelha/forno de carnes e cascas/talos de vegetais.
              </p>
            </div>
          </div>
        </div>

        {/* Category Filters Bar */}
        <div className="pt-3 border-t border-slate-100 flex items-center space-x-2 overflow-x-auto pb-1">
          <span className="text-xs font-bold text-slate-500 flex items-center space-x-1 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            <span>Filtrar Corredor:</span>
          </span>

          <button
            onClick={() => setSelectedCategoryFilter('all')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg shrink-0 transition-colors ${
              selectedCategoryFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({shoppingItems.length} itens)
          </button>

          {Object.keys(categories).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategoryFilter(cat)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg shrink-0 transition-colors ${
                selectedCategoryFilter === cat
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat} ({categories[cat]?.length || 0})
            </button>
          ))}
        </div>
      </div>

      {/* Shopping List Items by Category */}
      <div className="space-y-4">
        {(Object.entries(filteredCategories) as [string, ShoppingListItem[]][]).map(([categoryName, items]) => {
          if (!items || items.length === 0) return null;

          return (
            <div
              key={categoryName}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                    {categoryName}
                  </h3>
                </div>
                <span className="text-xs text-slate-400 font-medium">
                  {items.length} {items.length === 1 ? 'item' : 'itens'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map((item) => {
                  const isChecked = !!checkedItems[item.id];
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleCheckItem(item.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start space-x-3 ${
                        isChecked
                          ? 'bg-slate-50 border-slate-200 opacity-60'
                          : 'bg-white border-slate-200 hover:border-emerald-500 hover:shadow-2xs'
                      }`}
                    >
                      <button
                        type="button"
                        className="mt-0.5 text-emerald-600 hover:text-emerald-700 shrink-0"
                      >
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline gap-2">
                          <span
                            className={`text-xs font-bold truncate ${
                              isChecked ? 'line-through text-slate-400' : 'text-slate-900'
                            }`}
                          >
                            {item.foodName}
                          </span>
                        </div>

                        <div className="mt-1 flex items-center justify-between">
                          <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                            {item.unitLabel}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {item.dailyG}g/dia
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
