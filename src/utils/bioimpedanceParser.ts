import { BioimpedanceData, AnthropometryRecord, SkinfoldMeasurements, CircumferenceMeasurements } from '../types';

export interface BioimpedanceParseResult {
  success: boolean;
  message: string;
  data?: Partial<BioimpedanceData>;
  extractedWeightKg?: number;
  extractedHeightCm?: number;
  extractedBodyFatPercentage?: number;
  extractedLeanMassKg?: number;
  extractedFatMassKg?: number;
  extractedBmi?: number;
  detectedBrand?: 'InBody' | 'Tanita' | 'Omron' | 'Genérica';
}

/**
 * Intelligent parser that extracts bioimpedance parameters from PDF text / raw text
 * Compatible with InBody (270, 370, 570, 770), Tanita (RD-545, MC-780), Omron and clinic reports.
 */
export function parseBioimpedanceText(rawText: string): BioimpedanceParseResult {
  if (!rawText || rawText.trim().length === 0) {
    return {
      success: false,
      message: 'Nenhum texto extraído do laudo.',
    };
  }

  const text = rawText.replace(/\r\n/g, '\n');
  const normalized = text.toLowerCase();

  let detectedBrand: 'InBody' | 'Tanita' | 'Omron' | 'Genérica' = 'Genérica';
  if (normalized.includes('inbody') || normalized.includes('in body') || normalized.includes('biospace')) {
    detectedBrand = 'InBody';
  } else if (normalized.includes('tanita')) {
    detectedBrand = 'Tanita';
  } else if (normalized.includes('omron')) {
    detectedBrand = 'Omron';
  }

  // Regex extractors with multiple fallback formats
  const extractNumber = (patterns: RegExp[]): number | undefined => {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const val = parseFloat(match[1].replace(',', '.'));
        if (!isNaN(val) && val > 0) return val;
      }
    }
    return undefined;
  };

  // Weight (kg)
  const weightKg = extractNumber([
    /peso\s*[:=]?\s*([0-9]+[.,]?[0-9]*)\s*kg/i,
    /weight\s*[:=]?\s*([0-9]+[.,]?[0-9]*)\s*kg/i,
    /peso\s*corporal\s*[:=]?\s*([0-9]+[.,]?[0-9]*)/i,
    /([0-9]+[.,]?[0-9]*)\s*kg\s*(?:\(peso\)|peso)/i,
  ]);

  // Height (cm)
  const heightCm = extractNumber([
    /altura\s*[:=]?\s*([0-9]+[.,]?[0-9]*)\s*cm/i,
    /estatura\s*[:=]?\s*([0-9]+[.,]?[0-9]*)\s*cm/i,
    /height\s*[:=]?\s*([0-9]+[.,]?[0-9]*)\s*cm/i,
    /altura\s*[:=]?\s*([0-9]+[.,]?[0-9]*)/i,
  ]);

  // Body Fat Percentage (% ou PGC)
  const bodyFatPercentage = extractNumber([
    /(?:percentual|porcentagem|%)\s*(?:de\s*)?gordura\s*(?:corporal)?\s*[:=]?\s*([0-9]+[.,]?[0-9]*)\s*%/i,
    /pgc\s*[:=]?\s*([0-9]+[.,]?[0-9]*)\s*%/i,
    /body\s*fat\s*(?:percent|%|percentage)?\s*[:=]?\s*([0-9]+[.,]?[0-9]*)/i,
    /gordura\s*\(%\)\s*[:=]?\s*([0-9]+[.,]?[0-9]*)/i,
    /([0-9]+[.,]?[0-9]*)\s*%\s*(?:gordura|pgc)/i,
  ]);

  // Skeletal Muscle Mass (MME em kg)
  const skeletalMuscleMassKg = extractNumber([
    /massa\s*muscular\s*(?:esquelética|esqueletica|mme)?\s*[:=]?\s*([0-9]+[.,]?[0-9]*)\s*kg/i,
    /mme\s*[:=]?\s*([0-9]+[.,]?[0-9]*)\s*kg/i,
    /skeletal\s*muscle\s*mass\s*[:=]?\s*([0-9]+[.,]?[0-9]*)/i,
    /massa\s*muscular\s*[:=]?\s*([0-9]+[.,]?[0-9]*)/i,
  ]);

  // Lean Mass / Massa Livre de Gordura (MLG em kg)
  const dryLeanMassKg = extractNumber([
    /massa\s*livre\s*de\s*gordura\s*[:=]?\s*([0-9]+[.,]?[0-9]*)\s*kg/i,
    /mlg\s*[:=]?\s*([0-9]+[.,]?[0-9]*)\s*kg/i,
    /fat\s*free\s*mass\s*[:=]?\s*([0-9]+[.,]?[0-9]*)/i,
    /massa\s*magra\s*[:=]?\s*([0-9]+[.,]?[0-9]*)\s*kg/i,
  ]);

  // Fat Mass (Gordura absoluta em kg)
  const fatMassKg = extractNumber([
    /massa\s*de\s*gordura\s*[:=]?\s*([0-9]+[.,]?[0-9]*)\s*kg/i,
    /gordura\s*corporal\s*[:=]?\s*([0-9]+[.,]?[0-9]*)\s*kg/i,
    /fat\s*mass\s*[:=]?\s*([0-9]+[.,]?[0-9]*)/i,
    /gordura\s*\(kg\)\s*[:=]?\s*([0-9]+[.,]?[0-9]*)/i,
  ]);

  // Total Body Water (Água Corporal Total em L ou kg)
  const bodyWaterLiters = extractNumber([
    /água\s*corporal\s*(?:total)?\s*[:=]?\s*([0-9]+[.,]?[0-9]*)\s*(?:l|litros|kg)/i,
    /act\s*[:=]?\s*([0-9]+[.,]?[0-9]*)\s*(?:l|kg)/i,
    /total\s*body\s*water\s*[:=]?\s*([0-9]+[.,]?[0-9]*)/i,
    /água\s*[:=]?\s*([0-9]+[.,]?[0-9]*)\s*l/i,
  ]);

  // Visceral Fat Level (1 a 20)
  const visceralFatLevel = extractNumber([
    /(?:nível|nivel)\s*(?:de\s*)?gordura\s*visceral\s*[:=]?\s*([0-9]+[.,]?[0-9]*)/i,
    /gordura\s*visceral\s*[:=]?\s*([0-9]+[.,]?[0-9]*)/i,
    /visceral\s*fat\s*level\s*[:=]?\s*([0-9]+[.,]?[0-9]*)/i,
  ]);

  // Basal Metabolic Rate (TMB da bioimpedância)
  const basalMetabolicRateKcal = extractNumber([
    /taxa\s*metabólica\s*basal\s*[:=]?\s*([0-9]+[.,]?[0-9]*)\s*(?:kcal)?/i,
    /tmb\s*[:=]?\s*([0-9]+[.,]?[0-9]*)\s*(?:kcal)?/i,
    /bmr\s*[:=]?\s*([0-9]+[.,]?[0-9]*)\s*(?:kcal)?/i,
    /metabolismo\s*basal\s*[:=]?\s*([0-9]+[.,]?[0-9]*)/i,
  ]);

  // Extracellular Water Ratio (ECW / TBW)
  const ecwRatio = extractNumber([
    /(?:relação|proporção|relação)\s*ecw\s*\/\s*tbw\s*[:=]?\s*([0-9]+[.,]?[0-9]*)/i,
    /ecw\s*ratio\s*[:=]?\s*([0-9]+[.,]?[0-9]*)/i,
    /relação\s*aec\s*\/\s*act\s*[:=]?\s*([0-9]+[.,]?[0-9]*)/i,
  ]);

  // InBody Score (Pontuação)
  const inbodyScore = extractNumber([
    /pontuação\s*inbody\s*[:=]?\s*([0-9]+[.,]?[0-9]*)/i,
    /inbody\s*score\s*[:=]?\s*([0-9]+[.,]?[0-9]*)/i,
    /pontos\s*inbody\s*[:=]?\s*([0-9]+[.,]?[0-9]*)/i,
  ]);

  // Mineral Mass (kg)
  const mineralKg = extractNumber([
    /minerais\s*[:=]?\s*([0-9]+[.,]?[0-9]*)\s*kg/i,
    /mineral\s*mass\s*[:=]?\s*([0-9]+[.,]?[0-9]*)/i,
  ]);

  // Segmental Lean
  const segmentalLeanRightArmKg = extractNumber([/braço\s*direito\s*[:=]?\s*([0-9]+[.,]?[0-9]*)\s*kg/i, /right\s*arm\s*[:=]?\s*([0-9]+[.,]?[0-9]*)/i]);
  const segmentalLeanLeftArmKg = extractNumber([/braço\s*esquerdo\s*[:=]?\s*([0-9]+[.,]?[0-9]*)\s*kg/i, /left\s*arm\s*[:=]?\s*([0-9]+[.,]?[0-9]*)/i]);
  const segmentalLeanTrunkKg = extractNumber([/tronco\s*[:=]?\s*([0-9]+[.,]?[0-9]*)\s*kg/i, /trunk\s*[:=]?\s*([0-9]+[.,]?[0-9]*)/i]);
  const segmentalLeanRightLegKg = extractNumber([/perna\s*direita\s*[:=]?\s*([0-9]+[.,]?[0-9]*)\s*kg/i, /right\s*leg\s*[:=]?\s*([0-9]+[.,]?[0-9]*)/i]);
  const segmentalLeanLeftLegKg = extractNumber([/perna\s*esquerda\s*[:=]?\s*([0-9]+[.,]?[0-9]*)\s*kg/i, /left\s*leg\s*[:=]?\s*([0-9]+[.,]?[0-9]*)/i]);

  // Compute calculated lean / fat mass if missing
  let computedLeanKg = dryLeanMassKg;
  let computedFatKg = fatMassKg;

  if (weightKg && bodyFatPercentage) {
    if (!computedFatKg) {
      computedFatKg = Number(((weightKg * bodyFatPercentage) / 100).toFixed(1));
    }
    if (!computedLeanKg) {
      computedLeanKg = Number((weightKg - computedFatKg).toFixed(1));
    }
  }

  // Calculated BMI
  let calculatedBmi: number | undefined = undefined;
  if (weightKg && heightCm) {
    const hM = heightCm / 100;
    calculatedBmi = Number((weightKg / (hM * hM)).toFixed(1));
  }

  const bioData: Partial<BioimpedanceData> = {
    method: detectedBrand === 'InBody' ? 'inbody' : detectedBrand === 'Tanita' ? 'tanita' : detectedBrand === 'Omron' ? 'omron' : 'manual_bioimpedance',
    bodyWaterLiters,
    dryLeanMassKg: computedLeanKg,
    mineralKg,
    visceralFatLevel,
    basalMetabolicRateKcal,
    skeletalMuscleMassKg,
    ecwRatio,
    inbodyScore,
    segmentalLeanRightArmKg,
    segmentalLeanLeftArmKg,
    segmentalLeanTrunkKg,
    segmentalLeanRightLegKg,
    segmentalLeanLeftLegKg,
  };

  return {
    success: true,
    message: `Dados extraídos com sucesso do laudo ${detectedBrand}!`,
    detectedBrand,
    data: bioData,
    extractedWeightKg: weightKg,
    extractedHeightCm: heightCm,
    extractedBodyFatPercentage: bodyFatPercentage,
    extractedLeanMassKg: computedLeanKg,
    extractedFatMassKg: computedFatKg,
    extractedBmi: calculatedBmi,
  };
}
