import React, { useState, useMemo } from 'react';
import { useNutrition } from '../../context/NutritionContext';
import { FoodItem } from '../../types';
import {
  Search,
  Plus,
  Database,
  SlidersHorizontal,
  Flame,
  CheckCircle2,
  X,
  Sparkles
} from 'lucide-react';

export const FoodDatabaseView: React.FC = () => {
  const { foods, addCustomFood } = useNutrition();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  // New Food Form State
  const [name, setName] = useState<string>('');
  const [category, setCategory] = useState<string>('Proteínas');
  const [calories, setCalories] = useState<number>(150);
  const [protein, setProtein] = useState<number>(20);
  const [carbs, setCarbs] = useState<number>(5);
  const [fats, setFats] = useState<number>(3);
  const [fiber, setFiber] = useState<number>(1);
  const [sodiumMg, setSodiumMg] = useState<number>(50);
  const [householdMeasure, setHouseholdMeasure] = useState<string>('1 filé médio (100g)');
  const [showToast, setShowToast] = useState<boolean>(false);

  const categories = useMemo(() => {
    const set = new Set(foods.map((f) => f.category));
    return ['all', ...Array.from(set)];
  }, [foods]);

  const filteredFoods = useMemo(() => {
    return foods.filter((food) => {
      const matchSearch =
        food.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        food.householdMeasure.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = selectedCategory === 'all' || food.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [foods, searchQuery, selectedCategory]);

  const handleCreateFood = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addCustomFood({
      name,
      category,
      calories,
      protein,
      carbs,
      fats,
      fiber,
      sodiumMg,
      baseWeightG: 100,
      householdMeasure: householdMeasure || '1 porção (100g)',
    });

    setIsAddModalOpen(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);

    // Reset Form
    setName('');
    setCalories(150);
    setProtein(20);
    setCarbs(5);
    setFats(3);
    setFiber(1);
    setSodiumMg(50);
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center space-x-2 border border-emerald-500/50">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-semibold">
            Alimento personalizado cadastrado na tabela com sucesso!
          </span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <Database className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Tabela de Composição de Alimentos (TACO / IBGE)
              </h2>
              <p className="text-xs text-slate-500">
                {foods.length} alimentos cadastrados com valores de referência por 100g
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center space-x-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Novo Alimento</span>
        </button>
      </div>

      {/* Search & Categories Tabs */}
      <div className="space-y-3">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar alimento por nome ou medida..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white"
          />
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto text-xs pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-semibold transition-colors ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat === 'all' ? `Todos (${foods.length})` : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Foods Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <th className="py-3 px-4">Alimento</th>
                <th className="py-3 px-3">Categoria</th>
                <th className="py-3 px-3">Medida Caseira</th>
                <th className="py-3 px-3">Kcal (100g)</th>
                <th className="py-3 px-3">Proteína (g)</th>
                <th className="py-3 px-3">Carboidrato (g)</th>
                <th className="py-3 px-3">Gordura (g)</th>
                <th className="py-3 px-3">Fibras (g)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFoods.map((food) => (
                <tr key={food.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">{food.name}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium">
                      {food.category}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-600">{food.householdMeasure}</td>
                  <td className="py-3 px-3 font-extrabold text-slate-900">{food.calories} kcal</td>
                  <td className="py-3 px-3 font-semibold text-blue-600">{food.protein}g</td>
                  <td className="py-3 px-3 font-semibold text-amber-600">{food.carbs}g</td>
                  <td className="py-3 px-3 font-semibold text-rose-600">{food.fats}g</td>
                  <td className="py-3 px-3 text-emerald-600 font-medium">{food.fiber}g</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD CUSTOM FOOD MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Plus className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Cadastrar Alimento na Tabela TACO
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateFood} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="font-semibold text-slate-700 block mb-1">
                    Nome do Alimento *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Iogurte Grego Tradicional"
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Categoria</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-semibold"
                  >
                    <option value="Proteínas">Proteínas</option>
                    <option value="Carboidratos & Grãos">Carboidratos & Grãos</option>
                    <option value="Frutas">Frutas</option>
                    <option value="Verduras & Legumes">Verduras & Legumes</option>
                    <option value="Laticínios">Laticínios</option>
                    <option value="Gorduras & Oleaginosas">Gorduras & Oleaginosas</option>
                    <option value="Suplementos">Suplementos</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Medida Caseira Típica
                  </label>
                  <input
                    type="text"
                    value={householdMeasure}
                    onChange={(e) => setHouseholdMeasure(e.target.value)}
                    placeholder="1 pote (100g)"
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Macros per 100g */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 block">
                  Informação Nutricional por 100g
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-600 block">Kcal</label>
                    <input
                      type="number"
                      step="1"
                      value={calories}
                      onChange={(e) => setCalories(parseFloat(e.target.value) || 0)}
                      className="w-full p-1.5 border border-slate-200 rounded-lg font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-600 block">Proteína (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={protein}
                      onChange={(e) => setProtein(parseFloat(e.target.value) || 0)}
                      className="w-full p-1.5 border border-slate-200 rounded-lg text-blue-600 font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-600 block">Carboidrato (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={carbs}
                      onChange={(e) => setCarbs(parseFloat(e.target.value) || 0)}
                      className="w-full p-1.5 border border-slate-200 rounded-lg text-amber-600 font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-600 block">Gorduras (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={fats}
                      onChange={(e) => setFats(parseFloat(e.target.value) || 0)}
                      className="w-full p-1.5 border border-slate-200 rounded-lg text-rose-600 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[10px] text-slate-600 block">Fibras (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={fiber}
                      onChange={(e) => setFiber(parseFloat(e.target.value) || 0)}
                      className="w-full p-1.5 border border-slate-200 rounded-lg text-emerald-600 font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-600 block">Sódio (mg)</label>
                    <input
                      type="number"
                      step="1"
                      value={sodiumMg}
                      onChange={(e) => setSodiumMg(parseFloat(e.target.value) || 0)}
                      className="w-full p-1.5 border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-xs transition-colors"
                >
                  Salvar Alimento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
