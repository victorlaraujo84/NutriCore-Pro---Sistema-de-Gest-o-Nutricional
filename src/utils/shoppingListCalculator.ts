import { ShoppingListItem, ShoppingListFrequency, DietPlan } from '../types';

/**
 * Correction / Preparation Loss Factors (Fator de Correção e Perda por Cocção/Limpeza)
 * Alimentos como carnes perdem água na cocção (ex: 20-30% de perda de peso),
 * hortaliças e frutas perdem cascas/talos (ex: 15-25%),
 * grãos expandem na água ou necessitam de margem de reserva.
 */
export const CATEGORY_PREP_FACTORS: Record<string, number> = {
  'Proteínas & Carnes': 25, // +25% de margem para peso cru vs cozido e limpeza
  'Hortifrúti & Frutas': 20, // +20% para cascas, aparas e perdas no manuseio
  'Grãos & Carboidratos': 15, // +15% para variação no cozimento e porções
  'Laticínios & Ovos': 15, // +15% para validade e consumo complementar
  'Gorduras, Sementes & Castanhas': 15, // +15%
  'Suplementos & Bebidas': 15, // +15%
  'Mercearia & Temperos': 20, // +20%
};

/**
 * Automatically classifies TACO food into an intuitive supermarket section
 */
export function mapFoodCategoryToMarketSection(
  foodName: string
): ShoppingListItem['category'] {
  const lower = foodName.toLowerCase();

  if (
    lower.includes('frango') ||
    lower.includes('peito') ||
    lower.includes('carne') ||
    lower.includes('patinho') ||
    lower.includes('alcatra') ||
    lower.includes('peixe') ||
    lower.includes('tilápia') ||
    lower.includes('salmão') ||
    lower.includes('atum') ||
    lower.includes('ovo') ||
    lower.includes('clara') ||
    lower.includes('bife') ||
    lower.includes('whey') ||
    lower.includes('tofu')
  ) {
    if (lower.includes('whey')) return 'Suplementos & Bebidas';
    if (lower.includes('ovo') || lower.includes('clara')) return 'Laticínios & Ovos';
    return 'Proteínas & Carnes';
  }

  if (
    lower.includes('banana') ||
    lower.includes('maçã') ||
    lower.includes('manga') ||
    lower.includes('laranja') ||
    lower.includes('limão') ||
    lower.includes('morango') ||
    lower.includes('abacaxi') ||
    lower.includes('alface') ||
    lower.includes('rúcula') ||
    lower.includes('tomate') ||
    lower.includes('brócolis') ||
    lower.includes('cenoura') ||
    lower.includes('abobrinha') ||
    lower.includes('couve') ||
    lower.includes('espinafre') ||
    lower.includes('beterraba') ||
    lower.includes('salada')
  ) {
    return 'Hortifrúti & Frutas';
  }

  if (
    lower.includes('arroz') ||
    lower.includes('feijão') ||
    lower.includes('aveia') ||
    lower.includes('batata') ||
    lower.includes('mandioca') ||
    lower.includes('macarrão') ||
    lower.includes('pão') ||
    lower.includes('tapioca') ||
    lower.includes('cuscuz') ||
    lower.includes('lentilha') ||
    lower.includes('grão') ||
    lower.includes('milho') ||
    lower.includes('quinoa')
  ) {
    return 'Grãos & Carboidratos';
  }

  if (
    lower.includes('leite') ||
    lower.includes('iogurte') ||
    lower.includes('queijo') ||
    lower.includes('requeijão') ||
    lower.includes('cottage') ||
    lower.includes('manteiga')
  ) {
    return 'Laticínios & Ovos';
  }

  if (
    lower.includes('azeite') ||
    lower.includes('óleo') ||
    lower.includes('castanha') ||
    lower.includes('nozes') ||
    lower.includes('amendoim') ||
    lower.includes('pasta de amendoim') ||
    lower.includes('chia') ||
    lower.includes('linhaça') ||
    lower.includes('abacate')
  ) {
    return 'Gorduras, Sementes & Castanhas';
  }

  return 'Mercearia & Temperos';
}

/**
 * Calculates raw shopping list from a Diet Plan with 15-30% loss/prep factor
 * Multipliers:
 * Semanal: 7 dias
 * Quinzenal: 15 dias
 * Mensal: 30 dias
 */
export function generateShoppingList(
  dietPlan: DietPlan,
  frequency: ShoppingListFrequency = 'semanal',
  customPrepFactorPercent: number = 20 // Default 20% (between 15% and 30%)
): ShoppingListItem[] {
  if (!dietPlan || !dietPlan.meals) return [];

  const daysMultiplier = frequency === 'semanal' ? 7 : frequency === 'quinzenal' ? 15 : 30;

  // Aggregate total daily grams per food item
  const foodDailyGrams: Record<string, { foodName: string; grams: number; category: ShoppingListItem['category'] }> = {};

  dietPlan.meals.forEach((meal) => {
    meal.items.forEach((item) => {
      const key = item.foodName.trim().toLowerCase();
      if (!foodDailyGrams[key]) {
        foodDailyGrams[key] = {
          foodName: item.foodName,
          grams: 0,
          category: mapFoodCategoryToMarketSection(item.foodName),
        };
      }
      foodDailyGrams[key].grams += item.amountG;
    });
  });

  const result: ShoppingListItem[] = Object.values(foodDailyGrams).map((entry, index) => {
    const dailyG = entry.grams;
    const basePeriodG = dailyG * daysMultiplier;
    
    // Category-specific factor or user-adjusted (defaults to between 15% and 30%)
    const prepFactor = customPrepFactorPercent > 0 
      ? customPrepFactorPercent 
      : (CATEGORY_PREP_FACTORS[entry.category] || 20);

    const adjustedAmountG = Math.round(basePeriodG * (1 + prepFactor / 100));

    // Friendly unit label formatting
    let unitLabel = '';
    const lower = entry.foodName.toLowerCase();

    if (lower.includes('ovo') || lower.includes('ovos')) {
      const unitsPerDay = Math.ceil(dailyG / 50); // ~50g por ovo
      const totalUnits = unitsPerDay * daysMultiplier;
      const adjustedUnits = Math.ceil(totalUnits * (1 + prepFactor / 100));
      const dozens = Math.ceil(adjustedUnits / 12);
      unitLabel = `${adjustedUnits} unidades (~${dozens} cartela${dozens > 1 ? 's' : ''} de 12 ou ${Math.ceil(adjustedUnits / 30)} bandeja(s) de 30)`;
    } else if (adjustedAmountG >= 1000) {
      unitLabel = `${(adjustedAmountG / 1000).toFixed(2)} kg (bruto para compra)`;
    } else {
      unitLabel = `${adjustedAmountG} g`;
    }

    return {
      id: `shop-item-${index + 1}`,
      foodName: entry.foodName,
      category: entry.category,
      baseWeeklyAmountG: basePeriodG,
      adjustedAmountG,
      prepLossFactorPercent: prepFactor,
      unitLabel,
      dailyG,
      frequency,
    };
  });

  return result.sort((a, b) => a.category.localeCompare(b.category));
}
