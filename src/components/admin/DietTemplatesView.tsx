import React, { useState } from 'react';
import { useNutrition } from '../../context/NutritionContext';
import { DietTemplate, DietMeal, DietMealItem } from '../../types';
import { generateSmartSubstitutions } from '../../utils/nutritionCalculations';
import { FoodSubstitutionGroupsManager } from './FoodSubstitutionGroupsManager';
import {
  BookOpen,
  Plus,
  Flame,
  Dumbbell,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  Search,
  Filter,
  Copy,
  Trash2,
  Clock,
  Apple,
  FileText,
  Users,
  ArrowRightLeft,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Check,
  AlertCircle
} from 'lucide-react';

export const DietTemplatesView: React.FC = () => {
  const {
    dietTemplates,
    addDietTemplate,
    updateDietTemplate,
    deleteDietTemplate,
    applyDietTemplate,
    foodSubstitutionGroups,
    patients,
    activePatientId,
    setActivePatientId,
    setSelectedPatientForDetail,
    setCurrentView,
    setActivePatientTab,
    foods,
  } = useNutrition();

  const [activeSubTab, setActiveSubTab] = useState<'templates' | 'substitutions'>('templates');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTemplateId, setActiveTemplateId] = useState<string>(dietTemplates[0]?.id || '');
  const [selectedPatientToApply, setSelectedPatientToApply] = useState<string>(activePatientId);
  const [scaleProportionally, setScaleProportionally] = useState<boolean>(true);
  const [isApplySuccess, setIsApplySuccess] = useState<boolean>(false);
  const [isNewTemplateModalOpen, setIsNewTemplateModalOpen] = useState<boolean>(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [autoGenSuccessMessage, setAutoGenSuccessMessage] = useState<string | null>(null);

  // Active template derived from dietTemplates by ID (ensures live updates)
  const activeTemplate = dietTemplates.find((t) => t.id === activeTemplateId) || dietTemplates[0];

  // Form state for creating a new template
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<DietTemplate['category']>('Hipertrofia & Ganho Muscular');
  const [newDescription, setNewDescription] = useState('');
  const [newCalories, setNewCalories] = useState<number>(2200);
  const [newProtein, setNewProtein] = useState<number>(150);
  const [newCarbs, setNewCarbs] = useState<number>(250);
  const [newFats, setNewFats] = useState<number>(65);
  const [newGuidelines, setNewGuidelines] = useState('');

  const categories: { label: string; value: string }[] = [
    { label: 'Todos os Modelos', value: 'all' },
    { label: 'Hipertrofia', value: 'Hipertrofia & Ganho Muscular' },
    { label: 'Cutting & Emagrecimento', value: 'Emagrecimento & Cutting' },
    { label: 'Low Carb & Cetogênica', value: 'Low Carb & Cetogênica' },
    { label: 'Dieta Mediterrânea', value: 'Dieta Mediterrânea' },
    { label: 'Vegetariana & Vegana', value: 'Vegetariana & Vegana' },
    { label: 'Clínica & Condutas', value: 'Clínica & Condutas' },
  ];

  const filteredTemplates = dietTemplates.filter((tpl) => {
    const matchesCat = selectedCategory === 'all' || tpl.category === selectedCategory;
    const matchesSearch =
      tpl.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tpl.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const toggleExpandItem = (itemId: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const handleGenerateSingleItemSubstitutions = (mealId: string, item: DietMealItem) => {
    if (!activeTemplate) return;
    const foodObj = foods.find((f) => f.id === item.foodId) || {
      id: item.foodId || 'food-custom',
      name: item.foodName,
      category: item.foodName.toLowerCase().includes('ovo') ? 'Proteínas' : 'Carboidratos & Grãos',
      calories: item.amountG > 0 ? Math.round((item.calories / item.amountG) * 100) : item.calories,
      protein: item.amountG > 0 ? Number(((item.protein / item.amountG) * 100).toFixed(1)) : item.protein,
      carbs: item.amountG > 0 ? Number(((item.carbs / item.amountG) * 100).toFixed(1)) : item.carbs,
      fats: item.amountG > 0 ? Number(((item.fats / item.amountG) * 100).toFixed(1)) : item.fats,
      fiber: item.fiber || 0,
      householdMeasure: item.measureLabel || `${item.amountG}g`,
      sodiumMg: 0
    };

    const subs = generateSmartSubstitutions(foodObj, item.amountG, foods);
    if (subs.length > 0) {
      const updatedMeals = activeTemplate.meals.map((m) => {
        if (m.id !== mealId) return m;
        return {
          ...m,
          items: m.items.map((it) => {
            if (it.id !== item.id) return it;
            return { ...it, possibleSubstitutions: subs };
          }),
        };
      });

      updateDietTemplate(activeTemplate.id, { meals: updatedMeals });
      setExpandedItems((prev) => ({ ...prev, [item.id]: true }));
      setAutoGenSuccessMessage(`Substituições inteligentes calculadas e salvas para "${item.foodName}"!`);
      setTimeout(() => setAutoGenSuccessMessage(null), 3000);
    }
  };

  const handleAutoGenerateAllSubstitutions = () => {
    if (!activeTemplate) return;
    let countUpdated = 0;
    const updatedMeals = activeTemplate.meals.map((m) => ({
      ...m,
      items: m.items.map((it) => {
        const foodObj = foods.find((f) => f.id === it.foodId) || {
          id: it.foodId || 'food-custom',
          name: it.foodName,
          category: it.foodName.toLowerCase().includes('ovo') ? 'Proteínas' : 'Carboidratos & Grãos',
          calories: it.amountG > 0 ? Math.round((it.calories / it.amountG) * 100) : it.calories,
          protein: it.amountG > 0 ? Number(((it.protein / it.amountG) * 100).toFixed(1)) : it.protein,
          carbs: it.amountG > 0 ? Number(((it.carbs / it.amountG) * 100).toFixed(1)) : it.carbs,
          fats: it.amountG > 0 ? Number(((it.fats / it.amountG) * 100).toFixed(1)) : it.fats,
          fiber: it.fiber || 0,
          householdMeasure: it.measureLabel || `${it.amountG}g`,
          sodiumMg: 0
        };

        const subs = generateSmartSubstitutions(foodObj, it.amountG, foods);
        if (subs.length > 0) {
          countUpdated++;
          return { ...it, possibleSubstitutions: subs };
        }
        return it;
      }),
    }));

    updateDietTemplate(activeTemplate.id, { meals: updatedMeals });
    setAutoGenSuccessMessage(`Substituições equivalentes atualizadas para ${countUpdated} alimentos do modelo "${activeTemplate.title}"!`);
    setTimeout(() => setAutoGenSuccessMessage(null), 4000);
  };

  const handleApplyToPatient = () => {
    if (!selectedPatientToApply || !activeTemplate) return;
    try {
      applyDietTemplate(selectedPatientToApply, activeTemplate.id, scaleProportionally);
      setIsApplySuccess(true);
      setTimeout(() => {
        setIsApplySuccess(false);
      }, 3000);
    } catch (e: any) {
      alert(e.message || 'Erro ao aplicar modelo');
    }
  };

  const handleApplyAndOpenPatient = () => {
    if (!selectedPatientToApply || !activeTemplate) return;
    applyDietTemplate(selectedPatientToApply, activeTemplate.id, scaleProportionally);
    const pat = patients.find((p) => p.id === selectedPatientToApply);
    if (pat) {
      setActivePatientId(pat.id);
      setSelectedPatientForDetail(pat);
      setActivePatientTab('diet_planner');
      setCurrentView('admin');
    }
  };

  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    // Use default meal structure with smart substitutions for eggs, bread, chicken, rice
    const defaultMeals: DietMeal[] = [
      {
        id: `tpl-m-${Date.now()}-1`,
        name: 'Café da Manhã',
        time: '07:30',
        instructions: 'Consumir com café ou chá sem açúcar. Caso não coma ovo, utilize Queijo Minas Frescal, Frango desfiado ou Tofu grelhado.',
        items: [
          {
            id: `item-${Date.now()}-1`,
            foodId: 'food-prot-02',
            foodName: 'Ovo de Galinha cozido/mexido',
            amountG: 100,
            measureLabel: '2 unidades',
            calories: 146,
            protein: 13.3,
            carbs: 0.6,
            fats: 9.5,
            fiber: 0,
            possibleSubstitutions: [
              {
                foodId: 'food-dairy-05',
                name: 'Queijo Minas Frescal',
                amountG: 80,
                measureLabel: '80g (~2 fatias médias)',
                calories: 211,
                protein: 13.9,
                carbs: 2.6,
                fats: 16.1,
                tip: 'Excelente alternativa láctea sem ovos rica em caseína e cálcio'
              },
              {
                foodId: 'food-prot-01',
                name: 'Peito de Frango desfiado / grelhado',
                amountG: 60,
                measureLabel: '60g (~2 colheres de sopa cheias)',
                calories: 95,
                protein: 19.2,
                carbs: 0.0,
                fats: 1.5,
                tip: 'Opção proteica magra salgada sem ovo'
              },
              {
                foodId: 'food-prot-09',
                name: 'Tofu firme grelhado com cúrcuma',
                amountG: 140,
                measureLabel: '140g (~2 fatias grossas)',
                calories: 106,
                protein: 11.3,
                carbs: 2.7,
                fats: 6.7,
                tip: 'Alternativa 100% vegetal / vegana para substituir ovos mexidos'
              },
              {
                foodId: 'food-prot-07',
                name: 'Atum sólido ao natural (em água)',
                amountG: 70,
                measureLabel: '70g (~1/2 lata)',
                calories: 81,
                protein: 18.3,
                carbs: 0.0,
                fats: 0.5,
                tip: 'Prático, sem ovos e rico em ômega-3'
              }
            ]
          },
          {
            id: `item-${Date.now()}-2`,
            foodId: 'food-carb-09',
            foodName: 'Pão de Forma Integral',
            amountG: 50,
            measureLabel: '2 fatias',
            calories: 126,
            protein: 5.0,
            carbs: 22.5,
            fats: 1.7,
            fiber: 3.4,
            possibleSubstitutions: [
              {
                foodId: 'food-carb-11',
                name: 'Goma de Tapioca hidratada',
                amountG: 50,
                measureLabel: '50g (~2 colheres de sopa e meia)',
                calories: 120,
                protein: 0.0,
                carbs: 30.0,
                fats: 0.0,
                tip: 'Opção sem glúten para variar o desjejum'
              },
              {
                foodId: 'food-carb-08',
                name: 'Aveia em Flocos',
                amountG: 40,
                measureLabel: '40g (~2 colheres de sopa cheias)',
                calories: 157,
                protein: 5.6,
                carbs: 26.6,
                fats: 3.3,
                tip: 'Rica em betaglucanas e fibras saciantes'
              }
            ]
          }
        ]
      },
      {
        id: `tpl-m-${Date.now()}-2`,
        name: 'Almoço',
        time: '12:30',
        instructions: 'Acompanhar com salada de folhas verdes à vontade.',
        items: [
          {
            id: `item-${Date.now()}-3`,
            foodId: 'food-prot-01',
            foodName: 'Peito de Frango grelhado',
            amountG: 150,
            measureLabel: '1 filé e meio',
            calories: 238,
            protein: 48.0,
            carbs: 0,
            fats: 3.8,
            fiber: 0,
            possibleSubstitutions: [
              {
                foodId: 'food-prot-05',
                name: 'Filé de Tilápia grelhado',
                amountG: 180,
                measureLabel: '180g (~1 filé e meio)',
                calories: 230,
                protein: 46.8,
                carbs: 0.0,
                fats: 4.8,
                tip: 'Opção de peixe branco leve e magro'
              },
              {
                foodId: 'food-prot-04',
                name: 'Carne Bovina Patinho moído / grelhado',
                amountG: 130,
                measureLabel: '130g (~4 colheres de sopa)',
                calories: 284,
                protein: 46.6,
                carbs: 0.0,
                fats: 9.5,
                tip: 'Rico em ferro heme, zinco e creatina'
              }
            ]
          },
          {
            id: `item-${Date.now()}-4`,
            foodId: 'food-carb-01',
            foodName: 'Arroz Branco cozido',
            amountG: 150,
            measureLabel: '4 colheres de sopa',
            calories: 195,
            protein: 3.8,
            carbs: 42.0,
            fats: 0.4,
            fiber: 2.4,
            possibleSubstitutions: [
              {
                foodId: 'food-carb-02',
                name: 'Arroz Integral cozido',
                amountG: 150,
                measureLabel: '150g (~4 colheres de sopa)',
                calories: 186,
                protein: 3.9,
                carbs: 38.7,
                fats: 1.5,
                tip: 'Maior densidade de fibras'
              },
              {
                foodId: 'food-carb-05',
                name: 'Batata Doce cozida',
                amountG: 180,
                measureLabel: '180g (~1 unidade média)',
                calories: 139,
                protein: 1.1,
                carbs: 33.1,
                fats: 0.2,
                tip: 'Carboidrato de liberação gradual'
              }
            ]
          }
        ]
      }
    ];

    const created = addDietTemplate({
      title: newTitle,
      category: newCategory,
      description: newDescription || 'Protocolo personalizado desenvolvido para objetivos clínicos específicos.',
      targetCalories: Number(newCalories),
      targetProteinG: Number(newProtein),
      targetCarbsG: Number(newCarbs),
      targetFatsG: Number(newFats),
      waterGoalMl: Math.round(Number(newCalories) * 1.5),
      generalGuidelines: newGuidelines || 'Seguir os horários e manter boa hidratação ao longo do dia. Utilizar as opções de substituição equivalentes para manter a adesão.',
      meals: defaultMeals
    });

    setActiveTemplateId(created.id);
    setIsNewTemplateModalOpen(false);
    setNewTitle('');
    setNewDescription('');
    setNewGuidelines('');
  };

  const targetPatient = patients.find((p) => p.id === selectedPatientToApply);

  return (
    <div className="space-y-6">
      {/* Top Navigation Tabs: Templates vs Substitution Groups */}
      <div className="flex items-center justify-between bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('templates')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'templates'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Biblioteca de Modelos ({dietTemplates.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('substitutions')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'substitutions'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Grupos de Substituição Clínica</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeSubTab === 'substitutions'
                  ? 'bg-white/20 text-white'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {foodSubstitutionGroups?.length || 0}
            </span>
          </button>
        </div>
      </div>

      {activeSubTab === 'substitutions' ? (
        <FoodSubstitutionGroupsManager />
      ) : (
        <>
          {/* Header Banner */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
              <BookOpen className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-800">Biblioteca de Modelos de Cardápio</h2>
          </div>
          <p className="text-sm text-slate-500">
            Modelos de dietas validados e estruturados por protocolo clínico. Aplique com 1 clique para qualquer paciente com ajuste calórico automático.
          </p>
        </div>

        <button
          onClick={() => setIsNewTemplateModalOpen(true)}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-lg flex items-center gap-2 shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Criar Novo Modelo</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar modelo por nome, objetivo ou protocolo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <Filter className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block" />
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                selectedCategory === cat.value
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Template List + Template Detail/Apply Box */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Template Cards List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
            Modelos Disponíveis ({filteredTemplates.length})
          </div>

          <div className="space-y-3 max-h-[680px] overflow-y-auto pr-1">
            {filteredTemplates.map((template) => {
              const isSelected = activeTemplate?.id === template.id;
              return (
                <div
                  key={template.id}
                  onClick={() => setActiveTemplateId(template.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50/70 border-emerald-500 shadow-xs ring-1 ring-emerald-500'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                      {template.category}
                    </span>
                    {template.isCustom && (
                      <span className="text-[10px] bg-slate-100 text-slate-600 font-medium px-1.5 py-0.5 rounded">
                        Customizado
                      </span>
                    )}
                  </div>

                  <h3 className="font-semibold text-slate-900 text-sm mb-1 leading-snug">
                    {template.title}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                    {template.description}
                  </p>

                  {/* Macro Summary Chips */}
                  <div className="grid grid-cols-4 gap-1.5 text-center bg-slate-50 p-2 rounded-lg border border-slate-100 text-xs">
                    <div>
                      <span className="block text-[10px] text-slate-400 font-medium">Calorias</span>
                      <span className="font-bold text-slate-800">{template.targetCalories} <span className="text-[9px] font-normal">kcal</span></span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 font-medium">Proteína</span>
                      <span className="font-bold text-emerald-700">{template.targetProteinG}g</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 font-medium">Carboidrato</span>
                      <span className="font-bold text-amber-700">{template.targetCarbsG}g</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 font-medium">Gorduras</span>
                      <span className="font-bold text-rose-700">{template.targetFatsG}g</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredTemplates.length === 0 && (
              <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-sm">
                Nenhum modelo encontrado para este filtro.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Selected Template Preview & 1-Click Apply */}
        <div className="lg:col-span-7">
          {activeTemplate ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs divide-y divide-slate-100">
              {/* Card Header */}
              <div className="p-6">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      {activeTemplate.category}
                    </span>
                    <h2 className="text-xl font-bold text-slate-900 mt-2">
                      {activeTemplate.title}
                    </h2>
                  </div>
                  {activeTemplate.isCustom && (
                    <button
                      onClick={() => deleteDietTemplate(activeTemplate.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Excluir este modelo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <p className="text-sm text-slate-600 leading-relaxed">
                  {activeTemplate.description}
                </p>

                {/* Macro Target Big Bar */}
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                      <Flame className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-500 font-medium">VET Diário</div>
                      <div className="text-base font-bold text-slate-900">{activeTemplate.targetCalories} kcal</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                      <Dumbbell className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-500 font-medium">Proteínas</div>
                      <div className="text-base font-bold text-emerald-700">{activeTemplate.targetProteinG}g</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                      <Apple className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-500 font-medium">Carboidratos</div>
                      <div className="text-base font-bold text-amber-700">{activeTemplate.targetCarbsG}g</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-700 shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-500 font-medium">Lipídios / Gorduras</div>
                      <div className="text-base font-bold text-rose-700">{activeTemplate.targetFatsG}g</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 1-Click Apply Action Box */}
              <div className="p-6 bg-gradient-to-br from-emerald-50/60 to-slate-50">
                <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  Aplicação Imediata no Paciente
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-6">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Selecione o Paciente:
                    </label>
                    <div className="relative">
                      <Users className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <select
                        value={selectedPatientToApply}
                        onChange={(e) => setSelectedPatientToApply(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                      >
                        {patients.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.targetCalories} kcal - {p.goal})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="sm:col-span-6 flex flex-col gap-2">
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={scaleProportionally}
                        onChange={(e) => setScaleProportionally(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                      />
                      <span>Ajustar gramagens proporcionalmente à meta do paciente ({targetPatient?.targetCalories} kcal)</span>
                    </label>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleApplyToPatient}
                        className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Aplicar no Prontuário</span>
                      </button>

                      <button
                        onClick={handleApplyAndOpenPatient}
                        className="py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-1 transition-colors"
                        title="Aplicar e abrir editor do plano"
                      >
                        <span>Aplicar & Editar</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {isApplySuccess && (
                  <div className="mt-3 p-3 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-lg text-xs font-medium flex items-center gap-2 animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Cardápio aplicado com sucesso para <strong>{targetPatient?.name}</strong>! O plano foi atualizado e ativado.</span>
                  </div>
                )}
              </div>

              {/* Meals Preview with Substitutions */}
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Estrutura de Refeições & Exemplos ({activeTemplate.meals.length} refeições)
                    </h4>
                    <span className="text-[11px] bg-emerald-50 text-emerald-800 font-semibold px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                      <ArrowRightLeft className="w-3 h-3 text-emerald-600" />
                      Substituições Clínicas
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleAutoGenerateAllSubstitutions}
                    className="text-xs font-medium text-emerald-800 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
                    title="Calcular automaticamente opções equivalentes pela tabela TACO para todos os alimentos deste modelo"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Auto-Calcular Substituições TACO</span>
                  </button>
                </div>

                {autoGenSuccessMessage && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg text-xs font-medium flex items-center gap-2 animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{autoGenSuccessMessage}</span>
                  </div>
                )}

                {activeTemplate.meals.length > 0 ? (
                  <div className="space-y-4">
                    {activeTemplate.meals.map((meal) => (
                      <div key={meal.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200/90 shadow-2xs space-y-3">
                        <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200/70">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-emerald-700" />
                            <span className="font-bold text-sm text-slate-900">{meal.name}</span>
                          </div>
                          <span className="text-xs font-mono font-semibold text-slate-600 bg-white px-2.5 py-0.5 rounded-md border border-slate-200">
                            {meal.time}
                          </span>
                        </div>

                        {meal.instructions && (
                          <div className="p-2 bg-emerald-50/60 border border-emerald-100 rounded-lg text-xs text-emerald-900 flex items-start gap-1.5">
                            <span className="shrink-0 font-bold">💡 Orientação:</span>
                            <span className="italic">{meal.instructions}</span>
                          </div>
                        )}

                        <div className="space-y-2">
                          {(meal.items || []).map((it) => {
                            const hasSubstitutions = it.possibleSubstitutions && it.possibleSubstitutions.length > 0;
                            const isExpanded = !!expandedItems[it.id];
                            const isEggItem = it.foodName.toLowerCase().includes('ovo') || it.foodName.toLowerCase().includes('clara');

                            return (
                              <div
                                key={it.id}
                                className="rounded-lg border border-slate-200 bg-white overflow-hidden transition-all shadow-2xs"
                              >
                                <div className="flex items-center justify-between text-xs py-2 px-3 gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="font-semibold text-slate-900 truncate">
                                      {it.foodName}
                                    </span>
                                    {isEggItem && (
                                      <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded font-semibold shrink-0">
                                        🥚 Contém Ovo
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    <div className="hidden sm:flex items-center gap-2 text-slate-500 font-mono text-[11px]">
                                      <span className="text-slate-900 font-semibold">{it.amountG}g ({it.measureLabel})</span>
                                      <span className="text-emerald-700 font-semibold">{it.calories} kcal</span>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => toggleExpandItem(it.id)}
                                      className={`px-2 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-colors ${
                                        hasSubstitutions
                                          ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
                                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                                      }`}
                                      title="Clique para ver ou ocultar as opções de substituição para este item"
                                    >
                                      <ArrowRightLeft className="w-3 h-3 text-emerald-600" />
                                      <span>
                                        {hasSubstitutions ? `${it.possibleSubstitutions!.length} substituições` : 'Sem opções'}
                                      </span>
                                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleGenerateSingleItemSubstitutions(meal.id, it)}
                                      className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                                      title="Calcular/atualizar substituições equivalentes via TACO"
                                    >
                                      <Sparkles className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                {/* Expanded substitutions panel */}
                                {isExpanded && (
                                  <div className="bg-slate-50/80 border-t border-slate-200/80 p-3 space-y-2.5">
                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                      <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                                        <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-600" />
                                        Substituições Clínicas Equivalentes ({it.amountG}g de {it.foodName}):
                                      </span>
                                      {isEggItem && (
                                        <span className="text-[10px] text-emerald-800 bg-emerald-100/90 font-semibold px-2 py-0.5 rounded">
                                          Opções sem ovos: Queijo Minas, Peito de Frango, Tofu, Atum
                                        </span>
                                      )}
                                    </div>

                                    {hasSubstitutions ? (
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {it.possibleSubstitutions!.map((sub, sIdx) => (
                                          <div key={sIdx} className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs space-y-1 hover:border-emerald-400 transition-colors shadow-2xs">
                                            <div className="flex items-center justify-between gap-1 font-bold text-slate-900">
                                              <span className="truncate">{sub.name}</span>
                                              <span className="text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] font-mono shrink-0">
                                                {sub.amountG}g
                                              </span>
                                            </div>
                                            <div className="flex items-center justify-between text-[11px] text-slate-600">
                                              <span>{sub.measureLabel}</span>
                                              <span className="font-semibold text-slate-800">{sub.calories} kcal</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono pt-0.5">
                                              <span className="text-blue-700">P: {sub.protein}g</span>
                                              <span>•</span>
                                              <span className="text-amber-700">C: {sub.carbs}g</span>
                                              <span>•</span>
                                              <span className="text-rose-700">G: {sub.fats}g</span>
                                            </div>
                                            {sub.tip && (
                                              <div className="text-[10px] text-emerald-900 bg-emerald-50/90 px-2 py-1 rounded border border-emerald-200/80 mt-1 font-medium">
                                                💡 {sub.tip}
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="text-center py-3 bg-white rounded-lg border border-dashed border-slate-200 text-xs text-slate-500">
                                        <p className="mb-2">Nenhuma opção de substituição cadastrada para este item.</p>
                                        <button
                                          type="button"
                                          onClick={() => handleGenerateSingleItemSubstitutions(meal.id, it)}
                                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-lg inline-flex items-center gap-1.5 transition-colors"
                                        >
                                          <Sparkles className="w-3.5 h-3.5" />
                                          <span>Calcular Substituições Automaticamente</span>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-lg">
                    Este modelo fornece a distribuição de macronutrientes e diretrizes clínicas. Você pode adicionar alimentos específicos ao aplicar no paciente.
                  </div>
                )}

                {activeTemplate.generalGuidelines && (
                  <div className="mt-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1.5">
                    <span className="font-bold text-slate-900 block">Orientações Gerais do Protocolo:</span>
                    <p className="whitespace-pre-line leading-relaxed text-slate-600">{activeTemplate.generalGuidelines}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-400">
              Selecione um modelo à esquerda para visualizar os detalhes e aplicá-lo.
            </div>
          )}
        </div>
      </div>

      {/* Create New Template Modal */}
      {isNewTemplateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-6 animate-fadeIn">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                Cadastrar Novo Modelo de Cardápio
              </h3>
              <button
                onClick={() => setIsNewTemplateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTemplate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Título do Modelo:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Hipertrofia Intermediária (2.600 kcal)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Categoria / Protocolo:
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="Hipertrofia & Ganho Muscular">Hipertrofia</option>
                    <option value="Emagrecimento & Cutting">Cutting & Emagrecimento</option>
                    <option value="Low Carb & Cetogênica">Low Carb</option>
                    <option value="Dieta Mediterrânea">Mediterrânea</option>
                    <option value="Vegetariana & Vegana">Vegetariana / Vegana</option>
                    <option value="Clínica & Condutas">Clínica & Condutas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Meta Calórica (kcal):
                  </label>
                  <input
                    type="number"
                    required
                    value={newCalories}
                    onChange={(e) => setNewCalories(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Proteínas (g):
                  </label>
                  <input
                    type="number"
                    value={newProtein}
                    onChange={(e) => setNewProtein(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Carboidratos (g):
                  </label>
                  <input
                    type="number"
                    value={newCarbs}
                    onChange={(e) => setNewCarbs(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Gorduras (g):
                  </label>
                  <input
                    type="number"
                    value={newFats}
                    onChange={(e) => setNewFats(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descrição & Indicação Clínica:
                </label>
                <textarea
                  rows={2}
                  placeholder="Descreva para qual perfil de paciente este modelo é ideal..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewTemplateModalOpen(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  Salvar Modelo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};
