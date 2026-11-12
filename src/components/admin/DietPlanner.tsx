import React, { useState, useMemo } from 'react';
import { useNutrition } from '../../context/NutritionContext';
import {
  DietPlan,
  DietMeal,
  DietMealItem,
  FoodItem,
  FoodSubstitution
} from '../../types';
import {
  calculateBMR,
  calculateTDEE,
  generateSmartSubstitutions
} from '../../utils/nutritionCalculations';
import {
  Plus,
  Trash2,
  Search,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  Smartphone,
  Save,
  CheckCircle2,
  RefreshCw,
  Sliders,
  Utensils,
  ArrowRightLeft,
  X,
  Bot,
  Printer,
  Download
} from 'lucide-react';
import { generatePatientPlanPDF, printPatientPlanSummary } from '../../utils/planPdfGenerator';
import { NutritionCoachModal } from './NutritionCoachModal';

export const DietPlanner: React.FC = () => {
  const {
    selectedPatientForDetail,
    activePatient,
    activeDietPlan,
    saveDietPlan,
    foods,
    foodSubstitutionGroups,
    applySubstitutionGroupToItem,
    autoLinkSubstitutionGroupsToPlan,
    updatePatient,
    setCurrentView,
    setActivePatientId,
    setExportPlanModalOpen,
    clinicConfig,
    patientAnthropometry,
  } = useNutrition();

  const patient = selectedPatientForDetail || activePatient;

  // Local state for current active plan being edited
  const [currentPlan, setCurrentPlan] = useState<DietPlan>(() => {
    if (activeDietPlan && activeDietPlan.patientId === patient?.id) {
      return activeDietPlan;
    }
    // Default draft plan
    const bmr = calculateBMR(patient?.weightKg || 70, patient?.heightCm || 170, patient?.age || 30, patient?.gender || 'Masculino', patient?.bmrFormula || 'mifflin');
    const tdee = calculateTDEE(bmr, patient?.activityLevel || 1.55);

    return {
      id: `diet-plan-${patient?.id || 'draft'}-${Date.now()}`,
      patientId: patient?.id || '',
      title: `Plano Alimentar Personalizado - ${patient?.name || ''}`,
      isActive: true,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      targetCalories: patient?.targetCalories || tdee,
      targetProteinG: patient?.targetProteinG || Math.round((patient?.weightKg || 70) * 2),
      targetCarbsG: patient?.targetCarbsG || Math.round((tdee * 0.45) / 4),
      targetFatsG: patient?.targetFatsG || Math.round((tdee * 0.25) / 9),
      waterGoalMl: patient?.targetWaterMl || Math.round((patient?.weightKg || 70) * 35),
      generalGuidelines: '• Mastigar devagar e beber água entre as refeições.\n• Manter a hidratação diária constante.\n• Fazer uso dos alimentos equivalentes caso necessite variar o cardápio.',
      meals: [
        {
          id: 'meal-draft-1',
          name: 'Café da Manhã',
          time: '07:30',
          items: [],
        },
        {
          id: 'meal-draft-2',
          name: 'Almoço',
          time: '12:30',
          items: [],
        },
        {
          id: 'meal-draft-3',
          name: 'Lanche da Tarde',
          time: '16:30',
          items: [],
        },
        {
          id: 'meal-draft-4',
          name: 'Jantar',
          time: '20:00',
          items: [],
        }
      ]
    };
  });

  // Food Search Modal / Drawer state
  const [activeMealIdForAdd, setActiveMealIdForAdd] = useState<string | null>(null);
  const [foodSearchQuery, setFoodSearchQuery] = useState<string>('');
  const [selectedFoodCategory, setSelectedFoodCategory] = useState<string>('all');
  const [selectedFoodToAdd, setSelectedFoodToAdd] = useState<FoodItem | null>(null);
  const [foodAmountInputG, setFoodAmountInputG] = useState<number>(100);
  const [substitutionModalItem, setSubstitutionModalItem] = useState<{ mealId: string; item: DietMealItem } | null>(null);

  // Calorie & Macro adjustments drawer
  const [showMacroCalculator, setShowMacroCalculator] = useState<boolean>(false);
  const [calorieAdjustmentMode, setCalorieAdjustmentMode] = useState<number>(0); // -400 for deficit, +300 for surplus
  const [isCoachModalOpen, setIsCoachModalOpen] = useState<boolean>(false);

  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [substitutionNotice, setSubstitutionNotice] = useState<string | null>(null);

  const handleAutoLinkSubstitutions = () => {
    saveDietPlan(currentPlan);
    const linked = autoLinkSubstitutionGroupsToPlan(currentPlan.id);
    setSubstitutionNotice(
      linked > 0
        ? `${linked} alimento(s) vinculados a grupos de substituição clínica com sucesso!`
        : 'Nenhum novo alimento correspondente aos termos dos grupos de substituição cadastrados.'
    );
    setTimeout(() => setSubstitutionNotice(null), 3500);
  };

  const handleSelectSubstitutionGroup = (groupId: string) => {
    if (!substitutionModalItem) return;
    const selectedGroup = foodSubstitutionGroups.find((g) => g.id === groupId);
    if (!selectedGroup) return;

    const refAmount = selectedGroup.referenceFood.amountG > 0 ? selectedGroup.referenceFood.amountG : 50;
    const scaleRatio = substitutionModalItem.item.amountG > 0 ? substitutionModalItem.item.amountG / refAmount : 1;

    const scaledSubstitutions: FoodSubstitution[] = selectedGroup.substitutions.map((sub) => {
      const scaledGrams = Math.round(sub.amountG * scaleRatio);
      const subRatio = sub.amountG > 0 ? scaledGrams / sub.amountG : 1;
      const formattedMeasure = scaleRatio === 1
        ? sub.measureLabel
        : `${scaledGrams}g (${scaleRatio % 1 === 0 ? scaleRatio : scaleRatio.toFixed(1)}x de ${sub.measureLabel})`;

      return {
        foodId: sub.foodId || `sub-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        name: sub.name,
        amountG: scaledGrams,
        measureLabel: formattedMeasure,
        calories: Math.round(sub.calories * subRatio),
        protein: Number((sub.protein * subRatio).toFixed(1)),
        carbs: Number((sub.carbs * subRatio).toFixed(1)),
        fats: Number((sub.fats * subRatio).toFixed(1)),
        tip: sub.tip,
        portionMultiplier: scaleRatio,
      };
    });

    const updatedMeals = currentPlan.meals.map((meal) => {
      if (meal.id !== substitutionModalItem.mealId) return meal;
      return {
        ...meal,
        items: meal.items.map((it) => {
          if (it.id !== substitutionModalItem.item.id) return it;
          return {
            ...it,
            substitutionGroupId: selectedGroup.id,
            substitutionGroupName: selectedGroup.name,
            substitutionRuleNote: selectedGroup.description,
            possibleSubstitutions: scaledSubstitutions,
          };
        }),
      };
    });

    const updatedPlan = { ...currentPlan, meals: updatedMeals };
    setCurrentPlan(updatedPlan);
    saveDietPlan(updatedPlan);

    setSubstitutionModalItem({
      mealId: substitutionModalItem.mealId,
      item: {
        ...substitutionModalItem.item,
        substitutionGroupId: selectedGroup.id,
        substitutionGroupName: selectedGroup.name,
        substitutionRuleNote: selectedGroup.description,
        possibleSubstitutions: scaledSubstitutions,
      },
    });

    setSubstitutionNotice(`Regra "${selectedGroup.name}" vinculada com sucesso!`);
    setTimeout(() => setSubstitutionNotice(null), 3000);
  };

  const handleResetToAutoSubstitutions = () => {
    if (!substitutionModalItem) return;
    const item = substitutionModalItem.item;
    const targetFood = foods.find((f) => f.id === item.foodId) || {
      id: item.foodId,
      name: item.foodName,
      category: 'Proteínas' as const,
      calories: item.amountG > 0 ? (item.calories / item.amountG) * 100 : 100,
      protein: item.amountG > 0 ? (item.protein / item.amountG) * 100 : 10,
      carbs: item.amountG > 0 ? (item.carbs / item.amountG) * 100 : 10,
      fats: item.amountG > 0 ? (item.fats / item.amountG) * 100 : 5,
      fiber: item.amountG > 0 ? (item.fiber / item.amountG) * 100 : 1,
      householdMeasure: item.measureLabel,
      portionG: 100,
    };
    const autoSubs = generateSmartSubstitutions(targetFood, item.amountG, foods);

    const updatedMeals = currentPlan.meals.map((meal) => {
      if (meal.id !== substitutionModalItem.mealId) return meal;
      return {
        ...meal,
        items: meal.items.map((it) => {
          if (it.id !== substitutionModalItem.item.id) return it;
          return {
            ...it,
            substitutionGroupId: undefined,
            substitutionGroupName: undefined,
            substitutionRuleNote: undefined,
            possibleSubstitutions: autoSubs,
          };
        }),
      };
    });

    const updatedPlan = { ...currentPlan, meals: updatedMeals };
    setCurrentPlan(updatedPlan);
    saveDietPlan(updatedPlan);

    setSubstitutionModalItem({
      mealId: substitutionModalItem.mealId,
      item: {
        ...substitutionModalItem.item,
        substitutionGroupId: undefined,
        substitutionGroupName: undefined,
        substitutionRuleNote: undefined,
        possibleSubstitutions: autoSubs,
      },
    });

    setSubstitutionNotice('Substituições restauradas para o cálculo padrão.');
    setTimeout(() => setSubstitutionNotice(null), 2500);
  };

  // Synchronize when patient changes
  React.useEffect(() => {
    if (activeDietPlan && activeDietPlan.patientId === patient?.id) {
      setCurrentPlan(activeDietPlan);
    }
  }, [activeDietPlan, patient?.id]);

  if (!patient) {
    return (
      <div className="p-8 text-center text-slate-500">
        Nenhum paciente selecionado para montagem do plano alimentar.
      </div>
    );
  }

  // Calculate TMB & VET / TDEE dynamically
  const calculatedBMR = calculateBMR(
    patient.weightKg,
    patient.heightCm,
    patient.age,
    patient.gender,
    patient.bmrFormula
  );
  const calculatedTDEE = calculateTDEE(calculatedBMR, patient.activityLevel);

  // Compute Total Consumed Macros & Calories across all meals
  const consumedTotals = useMemo(() => {
    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fats = 0;
    let fiber = 0;

    currentPlan.meals.forEach((meal) => {
      meal.items.forEach((item) => {
        calories += item.calories;
        protein += item.protein;
        carbs += item.carbs;
        fats += item.fats;
        fiber += item.fiber;
      });
    });

    return {
      calories: Math.round(calories),
      protein: Number(protein.toFixed(1)),
      carbs: Number(carbs.toFixed(1)),
      fats: Number(fats.toFixed(1)),
      fiber: Number(fiber.toFixed(1)),
    };
  }, [currentPlan]);

  const calorieDiff = currentPlan.targetCalories - consumedTotals.calories;
  const isOverCalorie = consumedTotals.calories > currentPlan.targetCalories;
  const caloriePercent = currentPlan.targetCalories > 0
    ? Math.min(100, Math.round((consumedTotals.calories / currentPlan.targetCalories) * 100))
    : 0;

  // Filter food database for search
  const filteredFoods = useMemo(() => {
    return foods.filter((food) => {
      const matchQuery = food.name.toLowerCase().includes(foodSearchQuery.toLowerCase());
      const matchCat = selectedFoodCategory === 'all' || food.category === selectedFoodCategory;
      return matchQuery && matchCat;
    });
  }, [foods, foodSearchQuery, selectedFoodCategory]);

  // Food addition handler
  const handleConfirmAddFood = () => {
    if (!selectedFoodToAdd || !activeMealIdForAdd) return;

    const g = Math.max(1, foodAmountInputG);
    const cal = Math.round((selectedFoodToAdd.calories * g) / 100);
    const prot = Number(((selectedFoodToAdd.protein * g) / 100).toFixed(1));
    const carb = Number(((selectedFoodToAdd.carbs * g) / 100).toFixed(1));
    const fat = Number(((selectedFoodToAdd.fats * g) / 100).toFixed(1));
    const fib = Number(((selectedFoodToAdd.fiber * g) / 100).toFixed(1));

    // Auto generate 2-3 smart substitutions
    const autoSubs = generateSmartSubstitutions(selectedFoodToAdd, g, foods);

    const newItem: DietMealItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      foodId: selectedFoodToAdd.id,
      foodName: selectedFoodToAdd.name,
      amountG: g,
      measureLabel: `${g}g (~${selectedFoodToAdd.householdMeasure})`,
      calories: cal,
      protein: prot,
      carbs: carb,
      fats: fat,
      fiber: fib,
      possibleSubstitutions: autoSubs,
    };

    setCurrentPlan((prev) => ({
      ...prev,
      meals: prev.meals.map((meal) =>
        meal.id === activeMealIdForAdd
          ? { ...meal, items: [...meal.items, newItem] }
          : meal
      ),
    }));

    // Reset picker
    setSelectedFoodToAdd(null);
    setActiveMealIdForAdd(null);
    setFoodSearchQuery('');
  };

  // Update item gram weight in-place
  const handleUpdateItemGram = (mealId: string, itemId: string, newGram: number) => {
    const g = Math.max(1, newGram);
    setCurrentPlan((prev) => ({
      ...prev,
      meals: prev.meals.map((meal) => {
        if (meal.id !== mealId) return meal;
        return {
          ...meal,
          items: meal.items.map((item) => {
            if (item.id !== itemId) return item;
            const originalFood = foods.find((f) => f.id === item.foodId);
            if (!originalFood) {
              return { ...item, amountG: g };
            }
            const cal = Math.round((originalFood.calories * g) / 100);
            const prot = Number(((originalFood.protein * g) / 100).toFixed(1));
            const carb = Number(((originalFood.carbs * g) / 100).toFixed(1));
            const fat = Number(((originalFood.fats * g) / 100).toFixed(1));
            const fib = Number(((originalFood.fiber * g) / 100).toFixed(1));
            const autoSubs = generateSmartSubstitutions(originalFood, g, foods);

            return {
              ...item,
              amountG: g,
              measureLabel: `${g}g`,
              calories: cal,
              protein: prot,
              carbs: carb,
              fats: fat,
              fiber: fib,
              possibleSubstitutions: autoSubs,
            };
          }),
        };
      }),
    }));
  };

  // Remove item
  const handleRemoveItem = (mealId: string, itemId: string) => {
    setCurrentPlan((prev) => ({
      ...prev,
      meals: prev.meals.map((meal) =>
        meal.id === mealId
          ? { ...meal, items: meal.items.filter((it) => it.id !== itemId) }
          : meal
      ),
    }));
  };

  // Add new meal section
  const handleAddNewMealSection = () => {
    const newMeal: DietMeal = {
      id: `meal-${Date.now()}`,
      name: 'Nova Refeição',
      time: '15:00',
      items: [],
    };
    setCurrentPlan((prev) => ({
      ...prev,
      meals: [...prev.meals, newMeal],
    }));
  };

  // Remove meal section
  const handleRemoveMealSection = (mealId: string) => {
    if (window.confirm('Deseja excluir esta refeição inteira?')) {
      setCurrentPlan((prev) => ({
        ...prev,
        meals: prev.meals.filter((m) => m.id !== mealId),
      }));
    }
  };

  // Update meal title / time
  const handleUpdateMealHeader = (mealId: string, updates: Partial<DietMeal>) => {
    setCurrentPlan((prev) => ({
      ...prev,
      meals: prev.meals.map((m) => (m.id === mealId ? { ...m, ...updates } : m)),
    }));
  };

  // Save Plan
  const handleSavePlan = () => {
    saveDietPlan(currentPlan);
    updatePatient(patient.id, {
      targetCalories: currentPlan.targetCalories,
      targetProteinG: currentPlan.targetProteinG,
      targetCarbsG: currentPlan.targetCarbsG,
      targetFatsG: currentPlan.targetFatsG,
      targetWaterMl: currentPlan.waterGoalMl,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Apply macro calculation preset
  const handleApplyCalculatedMacros = (customCalorieTarget?: number) => {
    const targetCals = customCalorieTarget || (calculatedTDEE + calorieAdjustmentMode);
    let protG = Math.round(patient.weightKg * (patient.goal === 'hipertrofia' ? 2.2 : patient.goal === 'emagrecimento' ? 2.0 : 1.8));
    let fatG = Math.round((targetCals * 0.25) / 9);
    let remainingCals = targetCals - (protG * 4 + fatG * 9);
    let carbG = Math.max(50, Math.round(remainingCals / 4));

    setCurrentPlan((prev) => ({
      ...prev,
      targetCalories: targetCals,
      targetProteinG: protG,
      targetCarbsG: carbG,
      targetFatsG: fatG,
    }));
    setShowMacroCalculator(false);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {savedSuccess && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center space-x-2 border border-emerald-500/50">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-semibold">
            Plano Alimentar salvo e sincronizado com sucesso!
          </span>
        </div>
      )}

      {/* TOP CONTROL PANEL: Goal Kcal vs Consumed vs Difference with Sparkline progress */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                <Utensils className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Painel de Controle Nutricional (Metas vs Cardápio)
                </h2>
                <p className="text-xs text-slate-500">
                  Paciente: <span className="font-semibold text-slate-800">{patient.name}</span> • TMB: <strong>{calculatedBMR} kcal</strong> • VET/TDEE: <strong>{calculatedTDEE} kcal</strong>
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleAutoLinkSubstitutions}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition-colors flex items-center space-x-1.5 cursor-pointer"
              title="Vincular regras clínicas de substituição automaticamente aos alimentos do cardápio"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-600" />
              <span>Auto-Vincular Substituições</span>
            </button>

            <button
              onClick={() => setIsCoachModalOpen(true)}
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer"
              title="Ajustar plano com IA orientada por dados antropométricos"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>AI Coach Pro</span>
            </button>

            <button
              onClick={() => setShowMacroCalculator(!showMacroCalculator)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors flex items-center space-x-1.5"
            >
              <Sliders className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ajustar Metas / Fórmulas</span>
            </button>

            <button
              onClick={() => {
                if (!patient) return;
                const latestAnthro = patientAnthropometry.filter((a) => a.patientId === patient.id).slice(-1)[0];
                printPatientPlanSummary(patient, currentPlan, {
                  clinicConfig,
                  anthroRecord: latestAnthro,
                });
              }}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors flex items-center space-x-1.5 cursor-pointer"
              title="Imprimir resumo do plano com metas calóricas e macros"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Imprimir Resumo</span>
            </button>

            <button
              onClick={() => {
                if (!patient) return;
                const latestAnthro = patientAnthropometry.filter((a) => a.patientId === patient.id).slice(-1)[0];
                generatePatientPlanPDF(patient, currentPlan, {
                  clinicConfig,
                  anthroRecord: latestAnthro,
                  action: 'download',
                });
              }}
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
              title="Baixar resumo do plano em PDF vetorial de alta definição"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar PDF</span>
            </button>

            <button
              onClick={() => setExportPlanModalOpen(true)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
              title="Personalizar relatório clínico completo com lista de compras"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>Personalizar Relatório</span>
            </button>

            <button
              onClick={handleSavePlan}
              className="px-4 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors flex items-center space-x-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Salvar Plano</span>
            </button>
          </div>
        </div>

        {/* Macro Calculator Drawer if opened */}
        {showMacroCalculator && (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">
                Calculadora Integrada de Gasto Energético & Metas
              </span>
              <button
                onClick={() => setShowMacroCalculator(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 block">Fórmula de TMB</span>
                <span className="font-bold text-slate-800">
                  {patient.bmrFormula === 'mifflin' ? 'Mifflin-St Jeor' : 'Harris-Benedict'}
                </span>
                <span className="text-[11px] text-emerald-600 font-bold block mt-1">
                  {calculatedBMR} kcal basal
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 block">Fator Atividade</span>
                <span className="font-bold text-slate-800">
                  {patient.activityLevel}x ({patient.activityLevel === 1.2 ? 'Sedentário' : patient.activityLevel === 1.55 ? 'Moderado' : 'Intenso'})
                </span>
                <span className="text-[11px] text-slate-700 font-bold block mt-1">
                  VET: {calculatedTDEE} kcal
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <label className="text-[11px] text-slate-500 block">Estratégia</label>
                <select
                  value={calorieAdjustmentMode}
                  onChange={(e) => setCalorieAdjustmentMode(parseInt(e.target.value))}
                  className="w-full mt-1 p-1 text-xs border border-slate-200 rounded font-semibold"
                >
                  <option value={-500}>Déficit Agressivo (-500 kcal)</option>
                  <option value={-300}>Déficit Moderado (-300 kcal)</option>
                  <option value={0}>Manutenção / Eucalórica (0 kcal)</option>
                  <option value={300}>Superávit Leve (+300 kcal)</option>
                  <option value={500}>Superávit Hipertrofia (+500 kcal)</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => handleApplyCalculatedMacros()}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors"
                >
                  Aplicar {calculatedTDEE + calorieAdjustmentMode} kcal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 4 Cards: Meta Kcal, Consumido, Diferença + Visual Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Meta Diária (Alvo)
            </span>
            <div className="flex items-baseline space-x-2 mt-1">
              <input
                type="number"
                step="10"
                value={currentPlan.targetCalories}
                onChange={(e) =>
                  setCurrentPlan({ ...currentPlan, targetCalories: parseInt(e.target.value) || 0 })
                }
                className="text-2xl font-black text-slate-900 bg-white border border-slate-200 rounded px-2 py-0.5 w-28 focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-xs text-slate-500 font-medium">kcal</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Ajustado para {patient.goal}
            </span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Total Montado no Cardápio
            </span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span
                className={`text-2xl font-black ${
                  isOverCalorie ? 'text-rose-600' : 'text-emerald-700'
                }`}
              >
                {consumedTotals.calories}
              </span>
              <span className="text-xs text-slate-500 font-medium">kcal</span>
              <span className="text-xs font-bold text-slate-600">({caloriePercent}%)</span>
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Soma de todas as refeições
            </span>
          </div>

          <div
            className={`p-3.5 rounded-xl border ${
              isOverCalorie
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}
          >
            <span className="text-[11px] font-semibold uppercase tracking-wider block opacity-80">
              Diferença (Saldo)
            </span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-black">
                {calorieDiff > 0 ? `Faltam ${calorieDiff}` : calorieDiff < 0 ? `+${Math.abs(calorieDiff)} acima` : '0 (Meta Exata)'}
              </span>
              <span className="text-xs opacity-75">kcal</span>
            </div>
            <span className="text-[11px] opacity-80 mt-1 block">
              {isOverCalorie
                ? '⚠️ Ultrapassou a meta planejada'
                : '✓ Dentro da meta calórica prescrita'}
            </span>
          </div>
        </div>

        {/* Visual Progress Bar (The Sparkline / Progress Indicator) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
            <span>Progresso Calórico Total</span>
            <span className={isOverCalorie ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}>
              {consumedTotals.calories} / {currentPlan.targetCalories} kcal ({caloriePercent}%)
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden p-0.5 border border-slate-200">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isOverCalorie
                  ? 'bg-rose-500 animate-pulse'
                  : caloriePercent >= 90
                  ? 'bg-emerald-500'
                  : 'bg-teal-500'
              }`}
              style={{ width: `${Math.min(100, (consumedTotals.calories / (currentPlan.targetCalories || 1)) * 100)}%` }}
            />
          </div>
        </div>

        {/* Macronutrient Distribution Bar Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          {/* Protein */}
          <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
            <div className="flex items-center justify-between text-[11px] font-semibold text-blue-900">
              <span>Proteínas</span>
              <span>
                {consumedTotals.protein} / {currentPlan.targetProteinG}g
              </span>
            </div>
            <div className="w-full bg-blue-100 rounded-full h-2 mt-2 overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (consumedTotals.protein / (currentPlan.targetProteinG || 1)) * 100)}%`,
                }}
              />
            </div>
            <span className="text-[10px] text-blue-700 font-medium block mt-1">
              {Number((consumedTotals.protein / (patient.weightKg || 1)).toFixed(2))} g/kg peso
            </span>
          </div>

          {/* Carbs */}
          <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100">
            <div className="flex items-center justify-between text-[11px] font-semibold text-amber-900">
              <span>Carboidratos</span>
              <span>
                {consumedTotals.carbs} / {currentPlan.targetCarbsG}g
              </span>
            </div>
            <div className="w-full bg-amber-100 rounded-full h-2 mt-2 overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (consumedTotals.carbs / (currentPlan.targetCarbsG || 1)) * 100)}%`,
                }}
              />
            </div>
            <span className="text-[10px] text-amber-700 font-medium block mt-1">
              {Math.round((consumedTotals.carbs * 4 * 100) / (consumedTotals.calories || 1))}% do total
            </span>
          </div>

          {/* Fats */}
          <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100">
            <div className="flex items-center justify-between text-[11px] font-semibold text-rose-900">
              <span>Gorduras Totais</span>
              <span>
                {consumedTotals.fats} / {currentPlan.targetFatsG}g
              </span>
            </div>
            <div className="w-full bg-rose-100 rounded-full h-2 mt-2 overflow-hidden">
              <div
                className="bg-rose-500 h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (consumedTotals.fats / (currentPlan.targetFatsG || 1)) * 100)}%`,
                }}
              />
            </div>
            <span className="text-[10px] text-rose-700 font-medium block mt-1">
              {Math.round((consumedTotals.fats * 9 * 100) / (consumedTotals.calories || 1))}% do total
            </span>
          </div>

          {/* Fiber & Water */}
          <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
            <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-900">
              <span>Fibras & Água</span>
              <span>{consumedTotals.fiber}g fibras</span>
            </div>
            <div className="text-[11px] font-bold text-emerald-800 mt-2">
              Meta Água: {currentPlan.waterGoalMl} ml/dia
            </div>
            <span className="text-[10px] text-emerald-700 font-medium block mt-0.5">
              ~{Math.round(currentPlan.waterGoalMl / 250)} copos de 250ml
            </span>
          </div>
        </div>
      </div>

      {/* MEALS LIST BUILDER */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">
            Refeições do Cardápio ({currentPlan.meals.length})
          </h3>
          <button
            onClick={handleAddNewMealSection}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded-lg text-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar Refeição</span>
          </button>
        </div>

        {currentPlan.meals.map((meal, mealIndex) => {
          const mealCals = Math.round(meal.items.reduce((acc, it) => acc + it.calories, 0));
          const mealProt = Number(meal.items.reduce((acc, it) => acc + it.protein, 0).toFixed(1));
          const mealCarb = Number(meal.items.reduce((acc, it) => acc + it.carbs, 0).toFixed(1));
          const mealFat = Number(meal.items.reduce((acc, it) => acc + it.fats, 0).toFixed(1));

          return (
            <div
              key={meal.id}
              className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden"
            >
              {/* Meal Header */}
              <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                    {mealIndex + 1}
                  </div>
                  <input
                    type="text"
                    value={meal.name}
                    onChange={(e) => handleUpdateMealHeader(meal.id, { name: e.target.value })}
                    className="font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 focus:bg-white px-1 py-0.5 rounded text-sm sm:text-base focus:outline-none"
                  />
                  <div className="flex items-center space-x-1 text-slate-500 text-xs bg-white px-2 py-1 rounded-md border border-slate-200">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <input
                      type="text"
                      value={meal.time}
                      onChange={(e) => handleUpdateMealHeader(meal.id, { time: e.target.value })}
                      placeholder="08:00"
                      className="w-12 text-xs font-semibold text-slate-700 bg-transparent focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-xs">
                  <div className="flex items-center space-x-2 font-medium text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                    <span className="font-bold text-slate-900">{mealCals} kcal</span>
                    <span>•</span>
                    <span className="text-blue-600">{mealProt}g P</span>
                    <span>•</span>
                    <span className="text-amber-600">{mealCarb}g C</span>
                    <span>•</span>
                    <span className="text-rose-600">{mealFat}g G</span>
                  </div>

                  <button
                    onClick={() => handleRemoveMealSection(meal.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors"
                    title="Excluir refeição"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Meal Items Table */}
              <div className="p-4 space-y-3">
                {meal.items.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 font-medium">
                          <th className="py-2 px-2">Alimento (TACO/IBGE)</th>
                          <th className="py-2 px-2 w-28">Quantidade (g/ml)</th>
                          <th className="py-2 px-2">Kcal</th>
                          <th className="py-2 px-2">Prot (g)</th>
                          <th className="py-2 px-2">Carb (g)</th>
                          <th className="py-2 px-2">Gord (g)</th>
                          <th className="py-2 px-2 text-center">Substituições</th>
                          <th className="py-2 px-2 text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(meal.items || []).map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/80">
                            <td className="py-2.5 px-2 font-medium text-slate-900">
                              <div>{item.foodName}</div>
                              <div className="text-[11px] text-slate-400 font-normal">
                                {item.measureLabel}
                              </div>
                            </td>
                            <td className="py-2.5 px-2">
                              <div className="flex items-center space-x-1">
                                <input
                                  type="number"
                                  min="1"
                                  step="5"
                                  value={item.amountG}
                                  onChange={(e) =>
                                    handleUpdateItemGram(
                                      meal.id,
                                      item.id,
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  className="w-16 p-1 border border-slate-200 rounded text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                                />
                                <span className="text-slate-400">g</span>
                              </div>
                            </td>
                            <td className="py-2.5 px-2 font-bold text-slate-800">
                              {item.calories}
                            </td>
                            <td className="py-2.5 px-2 text-blue-700 font-medium">{item.protein}</td>
                            <td className="py-2.5 px-2 text-amber-700 font-medium">{item.carbs}</td>
                            <td className="py-2.5 px-2 text-rose-700 font-medium">{item.fats}</td>
                            <td className="py-2.5 px-2 text-center">
                              <button
                                onClick={() => setSubstitutionModalItem({ mealId: meal.id, item })}
                                className="inline-flex items-center space-x-1 px-2 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 rounded-md font-medium text-[11px] transition-colors"
                              >
                                <ArrowRightLeft className="w-3 h-3 text-emerald-600" />
                                <span>
                                  {item.possibleSubstitutions?.length || 0} opções
                                </span>
                              </button>
                              {item.substitutionGroupName && (
                                <div
                                  className="text-[10px] text-emerald-700 font-bold truncate max-w-[130px] mx-auto mt-1 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200"
                                  title={`Regra: ${item.substitutionGroupName}`}
                                >
                                  🔄 {item.substitutionGroupName}
                                </div>
                              )}
                            </td>
                            <td className="py-2.5 px-2 text-right">
                              <button
                                onClick={() => handleRemoveItem(meal.id, item.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                                title="Remover item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
                    Nenhum alimento adicionado nesta refeição. Clique no botão abaixo para buscar na tabela TACO/IBGE.
                  </div>
                )}

                {/* Add Food Button */}
                <div className="pt-2 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setActiveMealIdForAdd(meal.id);
                      setSelectedFoodToAdd(null);
                      setFoodAmountInputG(100);
                    }}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 font-semibold rounded-lg text-xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-600" />
                    <span>+ Adicionar Alimento (Busca TACO)</span>
                  </button>

                  <input
                    type="text"
                    value={meal.instructions || ''}
                    onChange={(e) =>
                      handleUpdateMealHeader(meal.id, { instructions: e.target.value })
                    }
                    placeholder="Instruções da refeição (ex: com salada à vontade, chá sem açúcar...)"
                    className="text-xs text-slate-600 italic bg-transparent border-b border-dashed border-slate-200 hover:border-slate-400 focus:border-emerald-500 w-1/2 px-1 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* General Guidelines & Hydration Notes */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900">
          Orientações Gerais & Prescrição Clínica para o Paciente
        </h3>
        <textarea
          value={currentPlan.generalGuidelines}
          onChange={(e) => setCurrentPlan({ ...currentPlan, generalGuidelines: e.target.value })}
          rows={4}
          placeholder="Orientações sobre mastigação, hidratação, suplementação..."
          className="w-full text-xs p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* MODAL: FOOD SEARCH IN TACO/IBGE */}
      {activeMealIdForAdd && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <Search className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Banco de Alimentos TACO / IBGE
                </h3>
              </div>
              <button
                onClick={() => setActiveMealIdForAdd(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input & Categories */}
            <div className="p-4 border-b border-slate-100 space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  value={foodSearchQuery}
                  onChange={(e) => setFoodSearchQuery(e.target.value)}
                  placeholder="Buscar por arroz, frango, ovo, aveia, queijo, banana..."
                  className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
                  autoFocus
                />
              </div>

              <div className="flex items-center space-x-2 overflow-x-auto text-[11px] pb-1 scrollbar-none">
                <button
                  onClick={() => setSelectedFoodCategory('all')}
                  className={`px-2.5 py-1 rounded-full whitespace-nowrap font-medium transition-colors ${
                    selectedFoodCategory === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Todos ({foods.length})
                </button>
                {['Proteínas', 'Carboidratos & Grãos', 'Frutas', 'Verduras & Legumes', 'Laticínios', 'Gorduras & Oleaginosas', 'Suplementos'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedFoodCategory(cat)}
                    className={`px-2.5 py-1 rounded-full whitespace-nowrap font-medium transition-colors ${
                      selectedFoodCategory === cat
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Results List */}
            <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100 max-h-64">
              {filteredFoods.map((food) => {
                const isSelected = selectedFoodToAdd?.id === food.id;
                return (
                  <div
                    key={food.id}
                    onClick={() => setSelectedFoodToAdd(food)}
                    className={`p-2.5 rounded-lg cursor-pointer transition-colors flex items-center justify-between ${
                      isSelected
                        ? 'bg-emerald-50 border border-emerald-200'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900">{food.name}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Porção base: {food.householdMeasure} • Categoria: {food.category}
                      </div>
                    </div>

                    <div className="text-right text-xs">
                      <span className="font-bold text-slate-900">{food.calories} kcal</span>
                      <div className="text-[10px] text-slate-500 space-x-1.5 mt-0.5">
                        <span className="text-blue-600 font-medium">P: {food.protein}g</span>
                        <span className="text-amber-600 font-medium">C: {food.carbs}g</span>
                        <span className="text-rose-600 font-medium">G: {food.fats}g</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quantity Selector & Confirm Footer */}
            {selectedFoodToAdd && (
              <div className="p-4 bg-emerald-50/60 border-t border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div>
                    <label className="text-[11px] font-semibold text-emerald-950 block">
                      Peso / Quantidade (g ou ml):
                    </label>
                    <div className="flex items-center space-x-1.5 mt-1">
                      <input
                        type="number"
                        min="1"
                        step="5"
                        value={foodAmountInputG}
                        onChange={(e) => setFoodAmountInputG(parseFloat(e.target.value) || 0)}
                        className="w-20 p-1.5 text-xs font-bold bg-white border border-emerald-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500"
                      />
                      <span className="text-xs text-slate-600 font-medium">gramas</span>
                    </div>
                  </div>

                  <div className="text-xs text-emerald-900 pl-3 border-l border-emerald-200">
                    <span className="font-bold">
                      {Math.round((selectedFoodToAdd.calories * foodAmountInputG) / 100)} kcal
                    </span>
                    <div className="text-[10px] text-emerald-700">
                      P: {Number(((selectedFoodToAdd.protein * foodAmountInputG) / 100).toFixed(1))}g | C: {Number(((selectedFoodToAdd.carbs * foodAmountInputG) / 100).toFixed(1))}g | G: {Number(((selectedFoodToAdd.fats * foodAmountInputG) / 100).toFixed(1))}g
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleConfirmAddFood}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                >
                  Confirmar Inserção
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: VIEW & EDIT SUBSTITUTIONS FOR AN ITEM */}
      {substitutionModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <ArrowRightLeft className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Substituições Equivalentes ({substitutionModalItem.item.foodName})
                </h3>
              </div>
              <button
                onClick={() => setSubstitutionModalItem(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="text-[11px] text-slate-500 block">Alimento Original Prescrito:</span>
              <span className="font-bold text-slate-900">
                {substitutionModalItem.item.amountG}g de {substitutionModalItem.item.foodName}
              </span>
              <div className="text-[11px] text-slate-600 mt-1">
                {substitutionModalItem.item.calories} kcal • {substitutionModalItem.item.protein}g Prot • {substitutionModalItem.item.carbs}g Carb • {substitutionModalItem.item.fats}g Gord
              </div>
            </div>

            {/* Link to Clinical Substitution Group */}
            <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200 text-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Vincular Regra Clínica de Equivalência</span>
                </span>
                {substitutionModalItem.item.substitutionGroupId && (
                  <button
                    type="button"
                    onClick={handleResetToAutoSubstitutions}
                    className="text-[10px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
                  >
                    Restaurar padrão
                  </button>
                )}
              </div>

              <select
                value={substitutionModalItem.item.substitutionGroupId || ''}
                onChange={(e) => {
                  if (e.target.value) {
                    handleSelectSubstitutionGroup(e.target.value);
                  } else {
                    handleResetToAutoSubstitutions();
                  }
                }}
                className="w-full text-xs p-2 bg-white border border-emerald-300 rounded-lg font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="">-- Selecione uma regra clínica (ex: Ovos, Carnes, Carboidratos...) --</option>
                {foodSubstitutionGroups.map((grp) => (
                  <option key={grp.id} value={grp.id}>
                    {grp.name} ({grp.category} • {grp.substitutions.length} opções)
                  </option>
                ))}
              </select>

              {substitutionModalItem.item.substitutionGroupName ? (
                <div className="p-2.5 bg-white/90 rounded-lg border border-emerald-200 text-[11px] text-emerald-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Regra Vinculada: {substitutionModalItem.item.substitutionGroupName}</span>
                  </div>
                  {substitutionModalItem.item.substitutionRuleNote && (
                    <p className="text-[10px] text-slate-600 italic">
                      Orientação clínica: {substitutionModalItem.item.substitutionRuleNote}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-[10px] text-slate-500">
                  Você pode selecionar um grupo clínico pré-definido pelo nutricionista ou deixar o sistema calcular com base na tabela TACO.
                </p>
              )}
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto">
              <span className="text-xs font-bold text-slate-800 block">
                {substitutionModalItem.item.substitutionGroupName
                  ? `Opções Equivalentes Proporcionais (${substitutionModalItem.item.amountG}g):`
                  : 'Opções Equivalentes Calculadas Automaticamente:'}
              </span>
              {substitutionModalItem.item.possibleSubstitutions?.map((sub, idx) => (
                <div
                  key={idx}
                  className="p-2.5 bg-white border border-slate-200 rounded-lg text-xs space-y-1 hover:border-emerald-300 transition-colors"
                >
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>{sub.name}</span>
                    <span className="text-emerald-600">{sub.amountG}g</span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center justify-between">
                    <span>{sub.measureLabel}</span>
                    <span>
                      {sub.calories} kcal (P: {sub.protein}g | C: {sub.carbs}g | G: {sub.fats}g)
                    </span>
                  </div>
                  {sub.tip && (
                    <div className="text-[10px] text-emerald-700 italic">
                      💡 {sub.tip}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSubstitutionModalItem(null)}
                className="px-4 py-2 bg-slate-900 text-white font-semibold text-xs rounded-xl"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Nutrition Coach Pro Modal */}
      <NutritionCoachModal
        isOpen={isCoachModalOpen}
        onClose={() => setIsCoachModalOpen(false)}
        onAppliedToDietPlan={() => {
          setIsCoachModalOpen(false);
        }}
      />
    </div>
  );
};
