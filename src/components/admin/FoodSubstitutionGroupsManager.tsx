import React, { useState, useMemo } from 'react';
import { useNutrition } from '../../context/NutritionContext';
import { FoodSubstitutionGroup, FoodSubstitutionOption, FoodItem } from '../../types';
import {
  ArrowRightLeft,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit3,
  CheckCircle2,
  Sparkles,
  Info,
  Scale,
  Utensils,
  ChevronDown,
  ChevronUp,
  X,
  BookOpen,
  Copy,
  Check,
  Zap,
  Tag,
  Users
} from 'lucide-react';

export const FoodSubstitutionGroupsManager: React.FC = () => {
  const {
    foodSubstitutionGroups,
    addFoodSubstitutionGroup,
    updateFoodSubstitutionGroup,
    deleteFoodSubstitutionGroup,
    autoLinkSubstitutionGroupsToPlan,
    activeDietPlan,
    activePatient,
    foods,
    currentNutritionist,
    clinicConfig,
  } = useNutrition();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  // Group Form state
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<FoodSubstitutionGroup['category']>('Proteínas');
  const [formDescription, setFormDescription] = useState('');
  const [formKeywords, setFormKeywords] = useState('');

  // Reference Food Form state
  const [refFoodName, setRefFoodName] = useState('');
  const [refAmountG, setRefAmountG] = useState<number>(50);
  const [refMeasureLabel, setRefMeasureLabel] = useState('1 unidade média');
  const [refCalories, setRefCalories] = useState<number>(75);
  const [refProtein, setRefProtein] = useState<number>(6.5);
  const [refCarbs, setRefCarbs] = useState<number>(0.5);
  const [refFats, setRefFats] = useState<number>(5.2);

  // Substitutions in currently edited group
  const [currentSubstitutions, setCurrentSubstitutions] = useState<FoodSubstitutionOption[]>([]);

  // Sub-builder: Add single substitution with TACO calculator
  const [tacoSearch, setTacoSearch] = useState('');
  const [selectedTacoFood, setSelectedTacoFood] = useState<FoodItem | null>(null);
  const [calcStrategy, setCalcStrategy] = useState<'protein' | 'calories' | 'carbs' | 'manual'>('protein');
  const [subAmountG, setSubAmountG] = useState<number>(70);
  const [subMeasureLabel, setSubMeasureLabel] = useState('1 fatia média (~70g)');
  const [subTip, setSubTip] = useState('');

  const categories = [
    { label: 'Todas as Categorias', value: 'all' },
    { label: 'Proteínas', value: 'Proteínas' },
    { label: 'Carboidratos & Grãos', value: 'Carboidratos & Grãos' },
    { label: 'Laticínios & Ovos', value: 'Laticínios & Ovos' },
    { label: 'Gorduras & Castanhas', value: 'Gorduras & Castanhas' },
    { label: 'Frutas & Vegetais', value: 'Frutas & Vegetais' },
    { label: 'Outros', value: 'Outros' },
  ];

  const filteredGroups = useMemo(() => {
    return foodSubstitutionGroups.filter((group) => {
      const matchesCategory = selectedCategory === 'all' || group.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesCategory;

      const matchesName = group.name.toLowerCase().includes(q);
      const matchesDesc = group.description.toLowerCase().includes(q);
      const matchesRef = group.referenceFood.name.toLowerCase().includes(q);
      const matchesKeyword = group.applicableKeywords?.some((k) => k.toLowerCase().includes(q));
      const matchesSub = group.substitutions.some((s) => s.name.toLowerCase().includes(q));

      return matchesCategory && (matchesName || matchesDesc || matchesRef || matchesKeyword || matchesSub);
    });
  }, [foodSubstitutionGroups, selectedCategory, searchQuery]);

  const toggleExpandCard = (id: string) => {
    setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOpenCreateModal = () => {
    setEditingGroupId(null);
    setFormName('');
    setFormCategory('Proteínas');
    setFormDescription('Regra de equivalência clínica para substituição autônoma e segura pelo paciente.');
    setFormKeywords('ovo, ovos, mexido, cozido, omelete');

    setRefFoodName('1 Ovo de galinha inteiro (cozido/mexido)');
    setRefAmountG(50);
    setRefMeasureLabel('1 unidade média');
    setRefCalories(75);
    setRefProtein(6.5);
    setRefCarbs(0.5);
    setRefFats(5.2);

    setCurrentSubstitutions([
      {
        foodId: 'food-tofu-1',
        name: 'Tofu firme grelhado',
        amountG: 70,
        measureLabel: '1 fatia média (~70g)',
        calories: 60,
        protein: 6.2,
        carbs: 1.4,
        fats: 3.5,
        tip: 'Opção 100% vegetal com aporte equivalente de aminoácidos essenciais.',
      },
      {
        foodId: 'food-queijo-1',
        name: 'Queijo minas frescal light',
        amountG: 35,
        measureLabel: '1 fatia média (~35g)',
        calories: 68,
        protein: 6.0,
        carbs: 1.0,
        fats: 4.2,
        tip: 'Rico em cálcio e caseína de digestão moderada.',
      },
      {
        foodId: 'food-frango-1',
        name: 'Peito de frango desfiado',
        amountG: 30,
        measureLabel: '2 colheres de sopa cheias (~30g)',
        calories: 48,
        protein: 9.3,
        carbs: 0.0,
        fats: 1.0,
        tip: 'Excelente substituição magra e sacietógena.',
      },
    ]);

    setSelectedTacoFood(null);
    setTacoSearch('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (group: FoodSubstitutionGroup) => {
    setEditingGroupId(group.id);
    setFormName(group.name);
    setFormCategory(group.category);
    setFormDescription(group.description);
    setFormKeywords(group.applicableKeywords?.join(', ') || '');

    setRefFoodName(group.referenceFood.name);
    setRefAmountG(group.referenceFood.amountG);
    setRefMeasureLabel(group.referenceFood.measureLabel);
    setRefCalories(group.referenceFood.calories);
    setRefProtein(group.referenceFood.protein);
    setRefCarbs(group.referenceFood.carbs);
    setRefFats(group.referenceFood.fats);

    setCurrentSubstitutions([...group.substitutions]);
    setSelectedTacoFood(null);
    setTacoSearch('');
    setIsModalOpen(true);
  };

  const handleDuplicateGroup = (group: FoodSubstitutionGroup) => {
    const duplicated = addFoodSubstitutionGroup({
      name: `${group.name} (Cópia)`,
      category: group.category,
      description: group.description,
      applicableKeywords: group.applicableKeywords,
      referenceFood: { ...group.referenceFood },
      substitutions: [...group.substitutions],
      authorNutritionistName: currentNutritionist?.name || clinicConfig.nutritionistName,
    });
    setFeedbackMessage(`Grupo "${duplicated.name}" duplicado com sucesso!`);
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  const handleDeleteGroup = (group: FoodSubstitutionGroup) => {
    if (window.confirm(`Deseja realmente remover o grupo de substituição "${group.name}"?`)) {
      deleteFoodSubstitutionGroup(group.id);
      setFeedbackMessage(`Grupo "${group.name}" removido.`);
      setTimeout(() => setFeedbackMessage(null), 3000);
    }
  };

  // Helper for selecting TACO food and computing equivalence
  const handleSelectTacoFood = (food: FoodItem) => {
    setSelectedTacoFood(food);
    recalculateTacoEquivalence(food, calcStrategy);
  };

  const recalculateTacoEquivalence = (food: FoodItem, strategy: 'protein' | 'calories' | 'carbs' | 'manual') => {
    let calculatedG = 100;

    if (strategy === 'protein') {
      if (food.protein > 0.1 && refProtein > 0) {
        calculatedG = Math.round((refProtein / food.protein) * 100);
      } else {
        calculatedG = 100;
      }
    } else if (strategy === 'calories') {
      if (food.calories > 1 && refCalories > 0) {
        calculatedG = Math.round((refCalories / food.calories) * 100);
      } else {
        calculatedG = 100;
      }
    } else if (strategy === 'carbs') {
      if (food.carbs > 0.1 && refCarbs > 0) {
        calculatedG = Math.round((refCarbs / food.carbs) * 100);
      } else {
        calculatedG = 100;
      }
    } else {
      calculatedG = 100;
    }

    setSubAmountG(Math.max(5, calculatedG));
    setSubMeasureLabel(`${calculatedG}g (${food.householdMeasure || 'porção'})`);
    setSubTip(`Opção calculada com equivalência ${strategy === 'protein' ? 'isoproteica' : strategy === 'calories' ? 'isocalórica' : 'isoglicídica'}.`);
  };

  const handleAddTacoSubstitutionOption = () => {
    if (!selectedTacoFood) return;

    const ratio = subAmountG / 100;
    const newOption: FoodSubstitutionOption = {
      foodId: selectedTacoFood.id,
      name: selectedTacoFood.name,
      amountG: subAmountG,
      measureLabel: subMeasureLabel || `${subAmountG}g`,
      calories: Math.round(selectedTacoFood.calories * ratio),
      protein: Number((selectedTacoFood.protein * ratio).toFixed(1)),
      carbs: Number((selectedTacoFood.carbs * ratio).toFixed(1)),
      fats: Number((selectedTacoFood.fats * ratio).toFixed(1)),
      tip: subTip || undefined,
    };

    setCurrentSubstitutions((prev) => [...prev, newOption]);
    setSelectedTacoFood(null);
    setTacoSearch('');
    setSubTip('');
  };

  const handleRemoveSubstitutionOption = (index: number) => {
    setCurrentSubstitutions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveGroupModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('Por favor, informe o nome do grupo.');
      return;
    }

    const keywordsArray = formKeywords
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);

    const groupPayload = {
      name: formName.trim(),
      category: formCategory,
      description: formDescription.trim(),
      applicableKeywords: keywordsArray,
      referenceFood: {
        name: refFoodName.trim(),
        amountG: refAmountG,
        measureLabel: refMeasureLabel.trim(),
        calories: refCalories,
        protein: refProtein,
        carbs: refCarbs,
        fats: refFats,
      },
      substitutions: currentSubstitutions,
      authorNutritionistName: currentNutritionist?.name || clinicConfig.nutritionistName,
    };

    if (editingGroupId) {
      updateFoodSubstitutionGroup(editingGroupId, groupPayload);
      setFeedbackMessage(`Grupo de substituição "${formName}" atualizado com sucesso!`);
    } else {
      addFoodSubstitutionGroup(groupPayload);
      setFeedbackMessage(`Novo grupo de substituição "${formName}" criado com sucesso!`);
    }

    setIsModalOpen(false);
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  const handleAutoLinkToActivePlan = () => {
    if (!activeDietPlan) {
      alert('Nenhum plano alimentar ativo selecionado no momento.');
      return;
    }
    const count = autoLinkSubstitutionGroupsToPlan(activeDietPlan.id);
    setFeedbackMessage(
      count > 0
        ? `Sucesso! ${count} itens do cardápio foram vinculados às regras clínicas de substituição.`
        : 'Nenhum item pendente necessitava de novas regras ou os itens já estavam vinculados.'
    );
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  // TACO Food quick filter for the selector
  const tacoSuggestions = useMemo(() => {
    if (!tacoSearch.trim()) return foods.slice(0, 8);
    const q = tacoSearch.toLowerCase();
    return foods.filter((f) => f.name.toLowerCase().includes(q) || f.category.toLowerCase().includes(q)).slice(0, 10);
  }, [foods, tacoSearch]);

  const totalSubstitutionsCount = foodSubstitutionGroups.reduce(
    (acc, g) => acc + (g.substitutions?.length || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Toast Feedback Notification */}
      {feedbackMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center space-x-2.5 border border-emerald-500/50 animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{feedbackMessage}</span>
        </div>
      )}

      {/* HEADER HERO BOX */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                <ArrowRightLeft className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                Grupos de Substituição & Regras Clínicas de Equivalência
              </h2>
            </div>
            <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
              Cadastre e gerencie regras padronizadas de trocas alimentares (ex.: 1 ovo equivale a 1 fatia de tofu ou 30g de frango).
              As regras são salvas no banco de dados e refletidas diretamente no aplicativo do paciente para permitir substituições autônomas e nutricionalmente equivalentes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {activeDietPlan && (
              <button
                type="button"
                onClick={handleAutoLinkToActivePlan}
                className="px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors flex items-center space-x-1.5 cursor-pointer"
                title="Vincular regras aos alimentos do cardápio do paciente ativo"
              >
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Vincular ao Cardápio Ativo</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Grupo de Substituição</span>
            </button>
          </div>
        </div>

        {/* METRICS STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
            <span className="text-[11px] text-slate-500 block">Grupos Cadastrados</span>
            <span className="text-base font-bold text-slate-900">{foodSubstitutionGroups.length} regras</span>
          </div>
          <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
            <span className="text-[11px] text-slate-500 block">Total de Opções Equivalentes</span>
            <span className="text-base font-bold text-emerald-700">{totalSubstitutionsCount} alternativas</span>
          </div>
          <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
            <span className="text-[11px] text-slate-500 block">Paciente Selecionado</span>
            <span className="text-xs font-bold text-slate-800 truncate block">
              {activePatient?.name || 'Nenhum selecionado'}
            </span>
          </div>
          <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
            <span className="text-[11px] text-slate-500 block">Sincronização com o App</span>
            <span className="text-xs font-bold text-emerald-600 flex items-center space-x-1 mt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Ativa no App do Paciente</span>
            </span>
          </div>
        </div>
      </div>

      {/* FILTER AND SEARCH BAR */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por grupo, alimento ou palavra-chave..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-800 font-medium"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-1 hidden sm:block" />
          {categories.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat.value
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* GROUPS LIST / CARDS */}
      {filteredGroups.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 space-y-3 shadow-xs">
          <ArrowRightLeft className="w-10 h-10 mx-auto text-slate-300" />
          <p className="text-sm font-semibold text-slate-700">Nenhum grupo de substituição encontrado</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Ajuste a pesquisa ou crie uma nova regra de equivalência clínica com o botão acima.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredGroups.map((group) => {
            const isExpanded = expandedCards[group.id] !== false; // expanded by default

            return (
              <div
                key={group.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between overflow-hidden"
              >
                {/* Card Header */}
                <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wider border border-emerald-200">
                          {group.category}
                        </span>
                        {group.authorNutritionistName && (
                          <span className="text-[10px] text-slate-500">
                            por {group.authorNutritionistName}
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 leading-snug">
                        {group.name}
                      </h3>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleDuplicateGroup(group)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
                        title="Duplicar regra"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(group)}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Editar regra"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteGroup(group)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Excluir grupo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {group.description}
                  </p>

                  {/* Keywords Tag Pill */}
                  {group.applicableKeywords && group.applicableKeywords.length > 0 && (
                    <div className="flex items-center space-x-1.5 pt-1 overflow-x-auto">
                      <Tag className="w-3 h-3 text-slate-400 shrink-0" />
                      {group.applicableKeywords.map((kw, i) => (
                        <span
                          key={i}
                          className="px-1.5 py-0.5 bg-slate-200/70 text-slate-700 text-[10px] rounded-md font-medium whitespace-nowrap"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-4 sm:p-5 space-y-4">
                  {/* Reference Food Hero Box */}
                  <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide flex items-center space-x-1">
                        <Scale className="w-3 h-3 text-emerald-600" />
                        <span>Alimento Base de Referência</span>
                      </span>
                      <span className="font-bold text-emerald-900">
                        {group.referenceFood.amountG}g
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs">
                        {group.referenceFood.name}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        ({group.referenceFood.measureLabel})
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 text-[10px] text-slate-600 font-medium pt-0.5">
                      <span className="font-bold text-slate-800">{group.referenceFood.calories} kcal</span>
                      <span>•</span>
                      <span className="text-blue-700 font-semibold">P: {group.referenceFood.protein}g</span>
                      <span>•</span>
                      <span className="text-amber-700 font-semibold">C: {group.referenceFood.carbs}g</span>
                      <span>•</span>
                      <span className="text-rose-700 font-semibold">G: {group.referenceFood.fats}g</span>
                    </div>
                  </div>

                  {/* Substitutions List */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 text-[11px]">
                        Opções Clínicas Equivalentes ({group.substitutions.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleExpandCard(group.id)}
                        className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center space-x-1"
                      >
                        <span>{isExpanded ? 'Recolher' : 'Expandir'}</span>
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="space-y-2">
                        {group.substitutions.map((sub, sIdx) => (
                          <div
                            key={sIdx}
                            className="p-2.5 bg-slate-50/70 hover:bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1 transition-colors"
                          >
                            <div className="flex items-center justify-between font-bold text-slate-900">
                              <span className="truncate pr-2">{sub.name}</span>
                              <span className="text-emerald-700 bg-emerald-100/70 px-1.5 py-0.2 rounded text-[11px] shrink-0 font-bold">
                                {sub.amountG}g
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-slate-500">
                              <span className="truncate pr-2">{sub.measureLabel}</span>
                              <span className="font-semibold text-slate-700 shrink-0">
                                {sub.calories} kcal (P: {sub.protein}g | C: {sub.carbs}g | G: {sub.fats}g)
                              </span>
                            </div>

                            {sub.tip && (
                              <div className="text-[10px] text-emerald-800 italic pt-0.5">
                                💡 {sub.tip}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">
                    ID: <code className="text-slate-500 font-mono text-[10px]">{group.id}</code>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(group)}
                    className="text-emerald-700 hover:text-emerald-800 font-bold hover:underline"
                  >
                    Gerenciar Alimentos
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT SUBSTITUTION GROUP MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    {editingGroupId ? 'Editar Grupo de Substituição' : 'Novo Grupo de Substituição'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Regra de equivalência clínica sincronizada com a tabela TACO e o app do paciente.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Scrollable Body */}
            <form onSubmit={handleSaveGroupModal} className="p-5 overflow-y-auto space-y-6">
              {/* Group Core Metadata */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  1. Identificação do Grupo
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">
                      Nome do Grupo / Regra: *
                    </label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Ex: Proteínas do Café da Manhã (Substitutos do Ovo)"
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">
                      Categoria Clínica:
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as any)}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium bg-white"
                    >
                      <option value="Proteínas">Proteínas</option>
                      <option value="Carboidratos & Grãos">Carboidratos & Grãos</option>
                      <option value="Laticínios & Ovos">Laticínios & Ovos</option>
                      <option value="Gorduras & Castanhas">Gorduras & Castanhas</option>
                      <option value="Frutas & Vegetais">Frutas & Vegetais</option>
                      <option value="Outros">Outros</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    Orientação Clínica / Racional da Regra:
                  </label>
                  <textarea
                    rows={2}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Ex: Equivalência isoproteica (~6g a 7g de proteína de alto valor biológico). Indicado para dias em que o paciente não quiser ovos ou para opções veganas."
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    Palavras-Chave de Associação Automática (separadas por vírgula):
                  </label>
                  <input
                    type="text"
                    value={formKeywords}
                    onChange={(e) => setFormKeywords(e.target.value)}
                    placeholder="Ex: ovo, ovos, omelete, mexido, clara"
                    className="w-full text-xs p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-700"
                  />
                  <span className="text-[10px] text-slate-400 block">
                    Quando você adicionar um alimento com esses termos na dieta, esta regra de substituição poderá ser vinculada automaticamente.
                  </span>
                </div>
              </div>

              {/* Reference Food Configuration */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    2. Alimento Base de Referência
                  </h4>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Serve de base proporcional para as contas
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">
                      Nome do Alimento de Referência:
                    </label>
                    <input
                      type="text"
                      required
                      value={refFoodName}
                      onChange={(e) => setRefFoodName(e.target.value)}
                      placeholder="Ex: 1 Ovo de galinha inteiro (cozido)"
                      className="w-full text-xs p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">
                      Porção de Referência (g):
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={refAmountG}
                      onChange={(e) => setRefAmountG(parseFloat(e.target.value) || 0)}
                      className="w-full text-xs p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                  <div className="col-span-2 sm:col-span-1 space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 block">Medida Caseira:</label>
                    <input
                      type="text"
                      value={refMeasureLabel}
                      onChange={(e) => setRefMeasureLabel(e.target.value)}
                      placeholder="1 unid. média"
                      className="w-full text-xs p-1.5 border border-slate-200 rounded-lg"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 block">Kcal:</label>
                    <input
                      type="number"
                      value={refCalories}
                      onChange={(e) => setRefCalories(parseFloat(e.target.value) || 0)}
                      className="w-full text-xs p-1.5 border border-slate-200 rounded-lg font-bold text-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-blue-700 block">Proteína (g):</label>
                    <input
                      type="number"
                      step="0.1"
                      value={refProtein}
                      onChange={(e) => setRefProtein(parseFloat(e.target.value) || 0)}
                      className="w-full text-xs p-1.5 border border-slate-200 rounded-lg text-blue-700 font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-amber-700 block">Carb (g):</label>
                    <input
                      type="number"
                      step="0.1"
                      value={refCarbs}
                      onChange={(e) => setRefCarbs(parseFloat(e.target.value) || 0)}
                      className="w-full text-xs p-1.5 border border-slate-200 rounded-lg text-amber-700 font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-rose-700 block">Gord (g):</label>
                    <input
                      type="number"
                      step="0.1"
                      value={refFats}
                      onChange={(e) => setRefFats(parseFloat(e.target.value) || 0)}
                      className="w-full text-xs p-1.5 border border-slate-200 rounded-lg text-rose-700 font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Substitutions Options List */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    3. Alimentos Substitutos Cadastrados ({currentSubstitutions.length})
                  </h4>
                  <span className="text-[10px] text-slate-400">
                    O paciente poderá escolher qualquer uma destas opções
                  </span>
                </div>

                {currentSubstitutions.length === 0 ? (
                  <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400">
                    Nenhuma opção cadastrada ainda. Utilize o assistente TACO abaixo para adicionar equivalentes.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {currentSubstitutions.map((sub, index) => (
                      <div
                        key={index}
                        className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900">{sub.name}</span>
                            <span className="text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded font-bold text-[10px]">
                              {sub.amountG}g
                            </span>
                            <span className="text-slate-500 text-[11px]">({sub.measureLabel})</span>
                          </div>
                          <div className="text-[11px] text-slate-600">
                            {sub.calories} kcal • P: {sub.protein}g • C: {sub.carbs}g • G: {sub.fats}g
                          </div>
                          {sub.tip && (
                            <p className="text-[10px] text-emerald-800 italic">💡 {sub.tip}</p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveSubstitutionOption(index)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          title="Remover opção"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* TACO Equivalence Calculator Box */}
                <div className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-200 space-y-3">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-emerald-950">
                      Calculadora TACO de Equivalência Nutricional
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={tacoSearch}
                        onChange={(e) => setTacoSearch(e.target.value)}
                        placeholder="Buscar alimento na tabela TACO (ex: Tofu, Queijo, Peito de Frango, Iogurte)..."
                        className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-800"
                      />
                    </div>

                    {/* Suggestions list */}
                    {!selectedTacoFood && tacoSuggestions.length > 0 && (
                      <div className="max-h-36 overflow-y-auto bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs shadow-xs">
                        {tacoSuggestions.map((f) => (
                          <div
                            key={f.id}
                            onClick={() => handleSelectTacoFood(f)}
                            className="p-2 hover:bg-emerald-50 cursor-pointer flex items-center justify-between transition-colors"
                          >
                            <div>
                              <span className="font-semibold text-slate-800 block text-xs">{f.name}</span>
                              <span className="text-[10px] text-slate-400">
                                {f.category} • 100g: {f.calories} kcal (P: {f.protein}g | C: {f.carbs}g | G: {f.fats}g)
                              </span>
                            </div>
                            <span className="text-[10px] text-emerald-700 font-bold px-2 py-0.5 bg-emerald-50 rounded">
                              Selecionar
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Selected Food Calculator Form */}
                    {selectedTacoFood && (
                      <div className="p-3 bg-white border border-emerald-300 rounded-xl space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <div>
                            <span className="text-[10px] text-emerald-700 font-bold uppercase block">Alimento Selecionado:</span>
                            <span className="font-bold text-slate-900 text-xs">{selectedTacoFood.name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedTacoFood(null)}
                            className="text-[11px] text-slate-400 hover:text-slate-600 underline"
                          >
                            Trocar
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-600 block">Critério de Troca:</label>
                            <select
                              value={calcStrategy}
                              onChange={(e) => {
                                const newStrat = e.target.value as any;
                                setCalcStrategy(newStrat);
                                recalculateTacoEquivalence(selectedTacoFood, newStrat);
                              }}
                              className="w-full text-xs p-1.5 border border-slate-200 rounded-lg bg-white font-medium"
                            >
                              <option value="protein">Isoproteica (Mesma Proteína)</option>
                              <option value="calories">Isocalórica (Mesmas Calorias)</option>
                              <option value="carbs">Isoglicídica (Mesmos Carboidratos)</option>
                              <option value="manual">Manual</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-600 block">Quantidade (g):</label>
                            <input
                              type="number"
                              min="1"
                              value={subAmountG}
                              onChange={(e) => {
                                const g = parseFloat(e.target.value) || 0;
                                setSubAmountG(g);
                              }}
                              className="w-full text-xs p-1.5 border border-slate-200 rounded-lg font-bold text-slate-900"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-600 block">Medida Caseira:</label>
                            <input
                              type="text"
                              value={subMeasureLabel}
                              onChange={(e) => setSubMeasureLabel(e.target.value)}
                              placeholder="Ex: 1 fatia média (~70g)"
                              className="w-full text-xs p-1.5 border border-slate-200 rounded-lg"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-600 block">Dica Clínica para o Paciente:</label>
                          <input
                            type="text"
                            value={subTip}
                            onChange={(e) => setSubTip(e.target.value)}
                            placeholder="Ex: Opção vegetal rica em ferro e aminoácidos essenciais."
                            className="w-full text-xs p-1.5 border border-slate-200 rounded-lg text-slate-700"
                          />
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <div className="text-[10px] text-slate-500">
                            Equivale a: <strong>{Math.round((selectedTacoFood.calories * subAmountG) / 100)} kcal</strong> • P: {Number(((selectedTacoFood.protein * subAmountG) / 100).toFixed(1))}g • C: {Number(((selectedTacoFood.carbs * subAmountG) / 100).toFixed(1))}g
                          </div>

                          <button
                            type="button"
                            onClick={handleAddTacoSubstitutionOption}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center space-x-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Adicionar à Lista</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingGroupId ? 'Salvar Alterações' : 'Criar Grupo de Substituição'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
