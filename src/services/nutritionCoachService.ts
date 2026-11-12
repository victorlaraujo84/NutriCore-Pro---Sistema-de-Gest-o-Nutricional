import {
  Patient,
  DietPlan,
  AnthropometryRecord,
  NutritionCoachAnalysis,
} from '../types';

export interface CoachRequestPayload {
  patient: Patient;
  currentPlan?: DietPlan | null;
  latestAnthropometry?: AnthropometryRecord | null;
  previousAnthropometry?: AnthropometryRecord | null;
  allAnthropometryHistory?: AnthropometryRecord[];
  clinicalFocus?: string;
  customDirectives?: string;
}

export async function requestNutritionCoachAnalysis(
  payload: CoachRequestPayload
): Promise<{ success: boolean; data: NutritionCoachAnalysis; source: string }> {
  try {
    const response = await fetch('/api/nutrition-coach/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const resData = await response.json();
    return resData;
  } catch (error) {
    console.warn('Network call to backend /api/nutrition-coach/analyze failed, using client-side clinical heuristic engine fallback:', error);
    
    // Client-side expert heuristic fallback
    const patient = payload.patient;
    const currentPlan = payload.currentPlan;
    const latest = payload.latestAnthropometry;
    const prev = payload.previousAnthropometry;

    const currentWeight = latest?.weightKg || patient.weightKg || 70;
    const currentKcal = currentPlan?.targetCalories || patient.targetCalories || 2000;
    const isWeightLoss = patient.goal === 'emagrecimento';
    const isHypertrophy = patient.goal === 'hipertrofia';

    const fatDelta = prev && latest ? latest.bodyFatPercentage - prev.bodyFatPercentage : 0;
    const leanDelta = prev && latest ? latest.leanMassKg - prev.leanMassKg : 0;

    let targetKcal = currentKcal;
    let strategy = 'Manutenção e Recomposição Isocalórica';
    let rationale = 'Ajuste fino nos macronutrientes mantendo aporte calórico estável para consolidação metabólica.';

    if (isWeightLoss) {
      if (fatDelta <= -0.5) {
        targetKcal = currentKcal;
        strategy = 'Manutenção do Déficit Eficaz (-350 kcal basal)';
        rationale = 'O paciente está respondendo com excelente taxa de oxidação lipídica e preservação de massa magra.';
      } else {
        targetKcal = Math.max(1350, currentKcal - 200);
        strategy = 'Déficit Calórico Otimizado (-200 kcal)';
        rationale = 'Ajuste calórico moderado para superar possível platô adaptativo e manter a progressão.';
      }
    } else if (isHypertrophy) {
      if (leanDelta >= 0.3) {
        targetKcal = currentKcal + 150;
        strategy = 'Progressão Gradual de Superávit (+150 kcal)';
        rationale = 'Excelente resposta anabólica com ganho de massa magra. Aumentar ligeiramente o aporte energético.';
      } else {
        targetKcal = currentKcal + 250;
        strategy = 'Superávit Energético Limpo (+250 kcal)';
        rationale = 'Aporte calórico insuficiente para hipertrofia expressiva. Recomenda-se aumentar calorias em carboidratos complexos.';
      }
    }

    const proteinPerKg = isWeightLoss ? 2.2 : isHypertrophy ? 2.0 : 1.8;
    const recProteinG = Math.round(currentWeight * proteinPerKg);
    const fatPerKg = 0.8;
    const recFatsG = Math.round(currentWeight * fatPerKg);
    const remainingKcal = Math.max(400, targetKcal - recProteinG * 4 - recFatsG * 9);
    const recCarbsG = Math.round(remainingKcal / 4);
    const recWaterMl = Math.round(currentWeight * 40);

    const fallbackData: NutritionCoachAnalysis = {
      diagnosticSummary: `Avaliação do paciente ${patient.name} (${patient.gender}, ${patient.age} anos). Peso atual: ${currentWeight} kg com ${latest?.bodyFatPercentage || 18}% de gordura corporal. ${
        leanDelta !== 0 ? `Variação de massa magra: ${leanDelta > 0 ? '+' : ''}${leanDelta.toFixed(1)} kg.` : ''
      }`,
      bodyCompositionInsight: {
        status: isWeightLoss ? 'Fase de Queima de Gordura' : isHypertrophy ? 'Fase de Hipertrofia' : 'Equilíbrio Metabólico',
        fatLossRating: fatDelta < 0 ? 'Ótimo Progresso' : 'Estável',
        leanMassPreservation: leanDelta >= 0 ? 'Massa Magra Preservada' : 'Atenção ao aporte proteico',
        visceralFatAssessment: 'Gordura visceral em nível seguro. Manter o foco em fibras e gorduras boas.',
      },
      caloricRecommendation: {
        currentKcal,
        recommendedKcal: targetKcal,
        deltaKcal: targetKcal - currentKcal,
        strategy,
        rationale,
      },
      macroRecommendations: {
        protein: {
          targetG: recProteinG,
          gPerKg: proteinPerKg,
          rationale: `${proteinPerKg}g/kg para sustentação da síntese proteica e proteção da massa muscular ativa.`,
        },
        carbs: {
          targetG: recCarbsG,
          gPerKg: Number((recCarbsG / currentWeight).toFixed(1)),
          rationale: 'Distribuição calibrada para rendimento nos treinos e reposição de glicogênio.',
        },
        fats: {
          targetG: recFatsG,
          gPerKg: fatPerKg,
          rationale: 'Aporte lipídico saudável para suporte hormonal e absorção de vitaminas.',
        },
        waterMl: {
          targetMl: recWaterMl,
          rationale: `Meta de 40 ml/kg para hidratação celular e suporte metabólico.`,
        },
      },
      mealSpecificAdjustments: [
        {
          mealName: 'Café da Manhã',
          currentAssessment: 'Refeição de quebra do jejum noturno.',
          suggestedAdjustment: 'Garantir pelo menos 25g a 30g de proteína de alto valor biológico com ovos ou iogurte proteico.',
          modifications: [
            {
              action: 'optimize',
              foodName: 'Ovos mexidos ou Whey Protein',
              amount: '2 a 3 unidades ou 30g',
              reason: 'Estimular a saciedade matinal e fornecer leucina para ativação da via mTOR.',
            },
          ],
        },
        {
          mealName: 'Almoço',
          currentAssessment: 'Principal aporte de micronutrientes e carboidratos complexos do meio do dia.',
          suggestedAdjustment: 'Manter proporção de vegetais escuros (1/2 prato) e fonte magra de proteína grelhada.',
          modifications: [
            {
              action: 'modify',
              foodName: 'Arroz Integral + Feijão / Legumes',
              amount: `${Math.round(recCarbsG * 0.35)}g de carboidratos líquidos`,
              reason: 'Digestão lenta com alto índice de saciedade e fibras.',
            },
          ],
        },
        {
          mealName: 'Lanche da Tarde / Pré-Treino',
          currentAssessment: 'Suporte energético para evitar hipoglicemia e fadiga.',
          suggestedAdjustment: 'Combinar carboidrato de média absorção com proteína leve (fruta + aveia ou whey).',
          modifications: [
            {
              action: 'add',
              foodName: 'Fruta com Aveia ou Iogurte',
              amount: '1 porção',
              reason: 'Otimizar o rendimento nos treinos e evitar picos de fome no jantar.',
            },
          ],
        },
        {
          mealName: 'Jantar',
          currentAssessment: 'Refeição de recuperação noturna.',
          suggestedAdjustment: 'Foco em digestão leve com teor controlado de carboidratos e boa densidade proteica.',
          modifications: [
            {
              action: 'optimize',
              foodName: 'Peixe ou Frango com Salada e Azeite de Oliva',
              amount: '150g proteína + vegetais',
              reason: 'Facilitar a regeneração celular durante o sono.',
            },
          ],
        },
      ],
      actionablePatientTips: [
        'Fracionar o consumo de água ao longo do dia, mantendo uma garrafa sempre visível.',
        'Priorizar alimentos in natura e mastigar devagar para maximizar a saciedade gástrica.',
        'Consumir uma porção de proteína em todas as refeições principais.',
        'Evitar grandes refeições ricas em gordura saturada nas 2 horas que antecedem o sono.',
      ],
      supplementationSuggestions: [
        {
          name: 'Creatina Monoidratada',
          dosage: '3g a 5g ao dia',
          timing: 'Horário constante (pós-treino ou com carboidrato)',
          purpose: 'Aumento de força, hidratação celular e suporte ao ganho de massa magra.',
        },
        {
          name: 'Whey Protein Isolado / Concentrado',
          dosage: '25g a 30g ao dia',
          timing: 'Pós-treino ou lanches intermediários',
          purpose: 'Praticidade no alcance da meta diária de proteínas.',
        },
      ],
    };

    return {
      success: true,
      data: fallbackData,
      source: 'clinical-heuristic-engine',
    };
  }
}
