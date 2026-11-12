import { ActivityLevel, BMRFormula, Gender, SkinfoldMeasurements, FoodItem, FoodSubstitution } from '../types';

/**
 * Calculates Basal Metabolic Rate (TMB / Taxa Metabólica Basal)
 */
export function calculateBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: Gender,
  formula: BMRFormula = 'mifflin'
): number {
  if (weightKg <= 0 || heightCm <= 0 || age <= 0) return 0;

  if (formula === 'mifflin') {
    // Mifflin-St Jeor:
    // Homens: (10 * peso) + (6.25 * altura) - (5 * idade) + 5
    // Mulheres: (10 * peso) + (6.25 * altura) - (5 * idade) - 161
    const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
    return Math.round(gender === 'Masculino' ? base + 5 : base - 161);
  } else {
    // Harris-Benedict:
    // Homens: 66.5 + (13.75 * peso) + (5.003 * altura) - (6.75 * idade)
    // Mulheres: 655.1 + (9.563 * peso) + (1.850 * altura) - (4.676 * idade)
    if (gender === 'Masculino') {
      return Math.round(66.5 + 13.75 * weightKg + 5.003 * heightCm - 6.75 * age);
    } else {
      return Math.round(655.1 + 9.563 * weightKg + 1.85 * heightCm - 4.676 * age);
    }
  }
}

/**
 * Calculates Total Daily Energy Expenditure (VET / Gasto Energético Total / TDEE)
 */
export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return Math.round(bmr * activityLevel);
}

/**
 * Calculates Jackson & Pollock 7-skinfolds body composition
 * Dobras: Subescapular, Tríceps, Peitoral, Axilar Média, Supra-ilíaca, Abdominal, Coxa
 */
export function calculatePollock7(
  skinfolds: SkinfoldMeasurements,
  age: number,
  gender: Gender,
  weightKg: number
) {
  const sum =
    (skinfolds.subscapular || 0) +
    (skinfolds.triceps || 0) +
    (skinfolds.pectoral || 0) +
    (skinfolds.midaxillary || 0) +
    (skinfolds.suprailiac || 0) +
    (skinfolds.abdominal || 0) +
    (skinfolds.thigh || 0);

  if (sum <= 0 || age <= 0 || weightKg <= 0) {
    return {
      sumSkinfolds: 0,
      bodyDensity: 0,
      bodyFatPercentage: 0,
      fatMassKg: 0,
      leanMassKg: 0,
    };
  }

  let bodyDensity = 0;
  if (gender === 'Masculino') {
    // DC Homens = 1.112 - (0.00043499 * SOMA) + (0.00000055 * (SOMA^2)) - (0.00028826 * idade)
    bodyDensity =
      1.112 -
      0.00043499 * sum +
      0.00000055 * Math.pow(sum, 2) -
      0.00028826 * age;
  } else {
    // DC Mulheres = 1.097 - (0.00046971 * SOMA) + (0.00000056 * (SOMA^2)) - (0.00012828 * idade)
    bodyDensity =
      1.097 -
      0.00046971 * sum +
      0.00000056 * Math.pow(sum, 2) -
      0.00012828 * age;
  }

  // Siri Formula: %BF = ((4.95 / DC) - 4.50) * 100
  let bodyFatPercentage = bodyDensity > 0 ? ((4.95 / bodyDensity) - 4.50) * 100 : 0;
  // Guard realistic range bounds
  bodyFatPercentage = Math.max(3, Math.min(60, bodyFatPercentage));

  const fatMassKg = (weightKg * (bodyFatPercentage / 100));
  const leanMassKg = weightKg - fatMassKg;

  return {
    sumSkinfolds: Number(sum.toFixed(1)),
    bodyDensity: Number(bodyDensity.toFixed(5)),
    bodyFatPercentage: Number(bodyFatPercentage.toFixed(1)),
    fatMassKg: Number(fatMassKg.toFixed(1)),
    leanMassKg: Number(leanMassKg.toFixed(1)),
  };
}

/**
 * Calculates BMI (Índice de Massa Corporal)
 */
export function calculateBMI(weightKg: number, heightCm: number): { value: number; classification: string; color: string } {
  if (weightKg <= 0 || heightCm <= 0) {
    return { value: 0, classification: 'N/A', color: 'text-slate-500' };
  }
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  const rounded = Number(bmi.toFixed(1));

  if (rounded < 18.5) {
    return { value: rounded, classification: 'Abaixo do peso', color: 'text-amber-500' };
  } else if (rounded < 25.0) {
    return { value: rounded, classification: 'Peso adequado (Eutrófico)', color: 'text-emerald-600' };
  } else if (rounded < 30.0) {
    return { value: rounded, classification: 'Sobrepeso', color: 'text-amber-600' };
  } else if (rounded < 35.0) {
    return { value: rounded, classification: 'Obesidade Grau I', color: 'text-orange-600' };
  } else if (rounded < 40.0) {
    return { value: rounded, classification: 'Obesidade Grau II', color: 'text-rose-600' };
  } else {
    return { value: rounded, classification: 'Obesidade Grau III (Grave)', color: 'text-rose-700' };
  }
}

/**
 * Body Fat % Classification (Pollock / ACSM)
 */
export function getBodyFatClassification(bf: number, gender: Gender): { label: string; color: string } {
  if (gender === 'Masculino') {
    if (bf < 6) return { label: 'Essencial / Atleta Extremo', color: 'text-blue-600' };
    if (bf <= 13) return { label: 'Excelente / Atleta', color: 'text-emerald-600' };
    if (bf <= 17) return { label: 'Bom / Fitness', color: 'text-emerald-500' };
    if (bf <= 24) return { label: 'Média Aceitável', color: 'text-amber-500' };
    return { label: 'Elevado / Obesidade', color: 'text-rose-600' };
  } else {
    if (bf < 14) return { label: 'Essencial / Atleta Extremo', color: 'text-blue-600' };
    if (bf <= 20) return { label: 'Excelente / Atleta', color: 'text-emerald-600' };
    if (bf <= 24) return { label: 'Bom / Fitness', color: 'text-emerald-500' };
    if (bf <= 31) return { label: 'Média Aceitável', color: 'text-amber-500' };
    return { label: 'Elevado / Obesidade', color: 'text-rose-600' };
  }
}

/**
 * Calculates intelligent macro and equivalent substitution for any given food item
 * Provides clinical equivalences for common items (especially eggs, poultry, bread, dairy)
 */
export function generateSmartSubstitutions(
  targetFood: FoodItem,
  targetAmountG: number,
  allFoods: FoodItem[]
): FoodSubstitution[] {
  const targetCals = (targetFood.calories * targetAmountG) / 100;
  const targetProt = (targetFood.protein * targetAmountG) / 100;
  const targetCarb = (targetFood.carbs * targetAmountG) / 100;
  const targetFat = (targetFood.fats * targetAmountG) / 100;

  const foodNameLower = targetFood.name.toLowerCase();
  const substitutions: FoodSubstitution[] = [];

  // Helper to calculate equivalent grams matching primary macro or calories
  const computeEquivalent = (candidate: FoodItem, tip?: string): FoodSubstitution | null => {
    let eqG = targetAmountG;
    if (targetFood.category === 'Carboidratos & Grãos' && candidate.carbs > 0) {
      eqG = Math.round((targetCarb / candidate.carbs) * 100);
    } else if ((targetFood.category === 'Proteínas' || targetProt > 8) && candidate.protein > 0) {
      eqG = Math.round((targetProt / candidate.protein) * 100);
    } else if (targetFood.category === 'Gorduras & Oleaginosas' && candidate.fats > 0) {
      eqG = Math.round((targetFat / candidate.fats) * 100);
    } else if (candidate.calories > 0) {
      eqG = Math.round((targetCals / candidate.calories) * 100);
    }

    if (eqG <= 0) return null;

    const calcCals = Math.round((candidate.calories * eqG) / 100);
    const calcProt = Number(((candidate.protein * eqG) / 100).toFixed(1));
    const calcCarb = Number(((candidate.carbs * eqG) / 100).toFixed(1));
    const calcFat = Number(((candidate.fats * eqG) / 100).toFixed(1));

    return {
      foodId: candidate.id,
      name: candidate.name,
      amountG: eqG,
      measureLabel: `${eqG}g (~${candidate.householdMeasure})`,
      calories: calcCals,
      protein: calcProt,
      carbs: calcCarb,
      fats: calcFat,
      tip: tip || `Substituição equivalente com mesmo perfil de ${targetFood.category.toLowerCase()}`,
    };
  };

  // 1. Specialized clinical substitutes for EGGS (Ovos de Galinha / Claras)
  if (foodNameLower.includes('ovo') || foodNameLower.includes('clara')) {
    const eggCandidates: { search: string; tip: string }[] = [
      { search: 'queijo minas frescal', tip: 'Alternativa láctea sem ovos rica em cálcio e caseína' },
      { search: 'queijo cottage', tip: 'Altíssima saciedade com baixo teor de gordura' },
      { search: 'peito de frango', tip: 'Proteína magra salgada de alto valor biológico' },
      { search: 'tofu firme', tip: 'Opção 100% vegetal / vegana para substituir ovos mexidos' },
      { search: 'atum sólido', tip: 'Opção prática, sem ovos e rica em ômega-3' },
    ];

    for (const ec of eggCandidates) {
      const match = allFoods.find((f) => f.name.toLowerCase().includes(ec.search) && f.id !== targetFood.id);
      if (match) {
        const sub = computeEquivalent(match, ec.tip);
        if (sub && !substitutions.some((s) => s.foodId === sub.foodId)) {
          substitutions.push(sub);
        }
      }
    }
  }

  // 2. Specialized substitutes for BREADS and BREAKFAST CARBS
  else if (foodNameLower.includes('pão') || foodNameLower.includes('torrada')) {
    const breadCandidates: { search: string; tip: string }[] = [
      { search: 'goma de tapioca', tip: 'Excelente opção sem glúten para o café da manhã' },
      { search: 'aveia em flocos', tip: 'Rica em fibras solúveis betaglucanas para a saciedade' },
      { search: 'batata doce', tip: 'Carboidrato complexo com absorção gradual' },
      { search: 'arroz integral', tip: 'Opção de digestão limpa e rica em fibras' },
    ];

    for (const bc of breadCandidates) {
      const match = allFoods.find((f) => f.name.toLowerCase().includes(bc.search) && f.id !== targetFood.id);
      if (match) {
        const sub = computeEquivalent(match, bc.tip);
        if (sub && !substitutions.some((s) => s.foodId === sub.foodId)) {
          substitutions.push(sub);
        }
      }
    }
  }

  // 3. General category candidates fallback
  const sameCategoryFoods = allFoods.filter(
    (f) => f.id !== targetFood.id && f.category === targetFood.category
  );

  for (const candidate of sameCategoryFoods) {
    if (substitutions.length >= 4) break;
    if (substitutions.some((s) => s.foodId === candidate.id)) continue;

    const sub = computeEquivalent(candidate);
    if (sub) {
      substitutions.push(sub);
    }
  }

  return substitutions;
}
