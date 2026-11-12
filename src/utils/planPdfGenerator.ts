import jsPDF from 'jspdf';
import {
  Patient,
  DietPlan,
  ClinicConfig,
  AnthropometryRecord
} from '../types';
import { calculateBMI, calculateBMR, calculateTDEE } from './nutritionCalculations';

export interface PlanPdfOptions {
  clinicConfig?: ClinicConfig;
  anthroRecord?: AnthropometryRecord;
  filename?: string;
  action?: 'download' | 'print' | 'blob' | 'dataurl';
  includeSubstitutions?: boolean;
  includeGuidelines?: boolean;
  includeAnthroSummary?: boolean;
}

export interface PlanPdfResult {
  doc: jsPDF;
  filename: string;
  blob?: Blob;
  blobUrl?: string;
}

/**
 * Generates a clean, professional, printable PDF summary for the patient's current plan,
 * including profile data, metabolic calculations, caloric target, and macronutrient breakdown.
 */
export const generatePatientPlanPDF = (
  patient: Patient,
  plan?: DietPlan | null,
  options: PlanPdfOptions = {}
): PlanPdfResult => {
  const {
    clinicConfig,
    anthroRecord,
    filename,
    action = 'download',
    includeSubstitutions = true,
    includeGuidelines = true,
    includeAnthroSummary = true,
  } = options;

  // Initialize jsPDF A4 portrait (210 x 297 mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2;
  let currentY = 14;

  // Calculate profile metrics
  const bmr = calculateBMR(
    patient.weightKg,
    patient.heightCm,
    patient.age,
    patient.gender,
    patient.bmrFormula || 'mifflin'
  );
  const tdee = calculateTDEE(bmr, patient.activityLevel);
  const bmi = calculateBMI(patient.weightKg, patient.heightCm);

  // Targets: either from active plan or from patient profile
  const targetCalories = plan?.targetCalories ?? patient.targetCalories ?? 2000;
  const targetProteinG = plan?.targetProteinG ?? patient.targetProteinG ?? 140;
  const targetCarbsG = plan?.targetCarbsG ?? patient.targetCarbsG ?? 220;
  const targetFatsG = plan?.targetFatsG ?? patient.targetFatsG ?? 60;
  const targetWaterMl = plan?.waterGoalMl ?? patient.targetWaterMl ?? 2500;

  // Grams per kg
  const proteinGPerKg = patient.weightKg ? (targetProteinG / patient.weightKg).toFixed(1) : '-';
  const carbsGPerKg = patient.weightKg ? (targetCarbsG / patient.weightKg).toFixed(1) : '-';
  const fatsGPerKg = patient.weightKg ? (targetFatsG / patient.weightKg).toFixed(1) : '-';

  // Calories and percentages
  const proteinKcal = targetProteinG * 4;
  const carbsKcal = targetCarbsG * 4;
  const fatsKcal = targetFatsG * 9;
  const totalMacroKcal = proteinKcal + carbsKcal + fatsKcal || targetCalories;

  const proteinPct = Math.round((proteinKcal / totalMacroKcal) * 100);
  const carbsPct = Math.round((carbsKcal / totalMacroKcal) * 100);
  const fatsPct = Math.round((fatsKcal / totalMacroKcal) * 100);

  // Clinic metadata defaults
  const clinicName = clinicConfig?.name || 'NutriCore Pro - Clínica Nutricional';
  const nutritionistName = clinicConfig?.nutritionistName || 'Dr. Ricardo Silva';
  const crn = clinicConfig?.crn || 'CRN-3 48.912/SP';
  const clinicPhone = clinicConfig?.phone || '(11) 98765-4321';
  const clinicEmail = clinicConfig?.email || 'contato@nutricorepro.com.br';
  const clinicAddress = clinicConfig?.address || 'Av. Paulista, 1500 - São Paulo / SP';

  // Helper for checking if page break is needed
  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - 20) {
      doc.addPage();
      currentY = 16;
      renderHeader(false);
    }
  };

  // Helper: Draw header on each page
  const renderHeader = (isFirstPage: boolean) => {
    // Top decorative bar
    doc.setFillColor(5, 150, 105); // Emerald-600
    doc.rect(0, 0, pageWidth, 4, 'F');

    if (isFirstPage) {
      // Clinic Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(6, 95, 70); // Emerald-800
      doc.text(clinicName, marginX, currentY + 4);

      // Clinic Subtitle
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139); // Slate-500
      doc.text(
        'Prescrição Nutricional Individualizada & Planejamento Clínico-Funcional',
        marginX,
        currentY + 8.5
      );

      // Nutritionist & Date info on top right
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42); // Slate-900
      doc.text(nutritionistName, pageWidth - marginX, currentY + 4, { align: 'right' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(5, 150, 105);
      doc.text(crn, pageWidth - marginX, currentY + 8, { align: 'right' });

      doc.setTextColor(148, 163, 184);
      const dateStr = new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
      doc.text(`Data: ${dateStr}`, pageWidth - marginX, currentY + 12, { align: 'right' });

      // Divider line
      currentY += 15;
      doc.setDrawColor(226, 232, 240); // Slate-200
      doc.setLineWidth(0.4);
      doc.line(marginX, currentY, pageWidth - marginX, currentY);
      currentY += 4;
    } else {
      // Compact header for subsequent pages
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`${clinicName} • Paciente: ${patient.name}`, marginX, currentY);
      doc.text(`${nutritionistName} (${crn})`, pageWidth - marginX, currentY, { align: 'right' });

      currentY += 3;
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(marginX, currentY, pageWidth - marginX, currentY);
      currentY += 5;
    }
  };

  // 1. Initial Page Header
  renderHeader(true);

  // 2. Patient Profile Box
  const profileBoxHeight = 27;
  doc.setFillColor(248, 250, 252); // Slate-50
  doc.setDrawColor(226, 232, 240); // Slate-200
  doc.roundedRect(marginX, currentY, contentWidth, profileBoxHeight, 2, 2, 'FD');

  // Accent vertical pill
  doc.setFillColor(5, 150, 105);
  doc.rect(marginX, currentY, 2.5, profileBoxHeight, 'F');

  // Profile data columns
  const col1X = marginX + 6;
  const col2X = marginX + 54;
  const col3X = marginX + 104;
  const col4X = marginX + 144;

  // Row 1
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('PACIENTE', col1X, currentY + 6);
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(patient.name, col1X, currentY + 11);

  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('DADOS BIOMÉTRICOS', col2X, currentY + 6);
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text(
    `${patient.gender} • ${patient.age} anos • ${patient.weightKg} kg • ${patient.heightCm} cm`,
    col2X,
    currentY + 11
  );

  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('IMC CLÍNICO (OMS)', col3X, currentY + 6);
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text(`${bmi.value} kg/m² (${bmi.classification.split(' ')[0]})`, col3X, currentY + 11);

  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('OBJETIVO PRINCIPAL', col4X, currentY + 6);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(5, 150, 105);
  const goalFormatted =
    patient.goal === 'emagrecimento'
      ? 'Emagrecimento'
      : patient.goal === 'hipertrofia'
      ? 'Hipertrofia Muscular'
      : 'Saúde & Manutenção';
  doc.text(goalFormatted, col4X, currentY + 11);

  // Row 2 (Metabolism)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Metabolismo Basal (TMB): ${bmr} kcal | Gasto Energético Total (VET): ${tdee} kcal | Nível de Atividade: ${patient.activityLevel}x FA`,
    col1X,
    currentY + 20
  );

  // Deficit / Surplus calculation
  const diffCal = targetCalories - tdee;
  const diffCalLabel =
    diffCal > 0 ? `+${diffCal} kcal (Superávit)` : diffCal < 0 ? `${diffCal} kcal (Déficit)` : 'Normocalórica';
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(diffCal < 0 ? 180 : 5, diffCal < 0 ? 83 : 150, diffCal < 0 ? 9 : 105);
  doc.text(`Conduta: ${diffCalLabel}`, col4X, currentY + 20);

  currentY += profileBoxHeight + 5;

  // 3. Macronutrient & Caloric Targets Card (Prominent Section)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('METAS CALÓRICAS & DISTRIBUIÇÃO DE MACRONUTRIENTES', marginX, currentY + 3);

  currentY += 6;
  const targetCardHeight = 28;
  doc.setFillColor(236, 253, 245); // Emerald-50
  doc.setDrawColor(167, 243, 208); // Emerald-200
  doc.roundedRect(marginX, currentY, contentWidth, targetCardHeight, 2, 2, 'FD');

  // Box 1: Caloric Target
  const targetBoxWidth = contentWidth / 5;

  // Box 1: Total Calories
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(marginX + 2, currentY + 2, targetBoxWidth - 3, targetCardHeight - 4, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(5, 150, 105);
  doc.text('META CALÓRICA', marginX + 4, currentY + 7);
  doc.setFontSize(14);
  doc.setTextColor(6, 95, 70);
  doc.text(`${targetCalories}`, marginX + 4, currentY + 16);
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('kcal / dia', marginX + 4, currentY + 21);

  // Box 2: Protein
  const pBoxX = marginX + targetBoxWidth + 1;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(pBoxX, currentY + 2, targetBoxWidth - 3, targetCardHeight - 4, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(37, 99, 235); // Blue-600
  doc.text('PROTEÍNAS', pBoxX + 3, currentY + 7);
  doc.setFontSize(13);
  doc.setTextColor(30, 58, 138); // Blue-900
  doc.text(`${targetProteinG}g`, pBoxX + 3, currentY + 16);
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`${proteinGPerKg} g/kg • ${proteinPct}% (${proteinKcal} kcal)`, pBoxX + 3, currentY + 21);

  // Box 3: Carbs
  const cBoxX = marginX + targetBoxWidth * 2;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(cBoxX, currentY + 2, targetBoxWidth - 3, targetCardHeight - 4, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(217, 119, 6); // Amber-600
  doc.text('CARBOIDRATOS', cBoxX + 3, currentY + 7);
  doc.setFontSize(13);
  doc.setTextColor(120, 53, 15); // Amber-900
  doc.text(`${targetCarbsG}g`, cBoxX + 3, currentY + 16);
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`${carbsGPerKg} g/kg • ${carbsPct}% (${carbsKcal} kcal)`, cBoxX + 3, currentY + 21);

  // Box 4: Fats
  const fBoxX = marginX + targetBoxWidth * 3 - 1;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(fBoxX, currentY + 2, targetBoxWidth - 3, targetCardHeight - 4, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(225, 29, 72); // Rose-600
  doc.text('GORDURAS / LIPÍDIOS', fBoxX + 3, currentY + 7);
  doc.setFontSize(13);
  doc.setTextColor(136, 19, 55); // Rose-900
  doc.text(`${targetFatsG}g`, fBoxX + 3, currentY + 16);
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`${fatsGPerKg} g/kg • ${fatsPct}% (${fatsKcal} kcal)`, fBoxX + 3, currentY + 21);

  // Box 5: Water Goal
  const wBoxX = marginX + targetBoxWidth * 4 - 2;
  const wBoxWidth = contentWidth - (wBoxX - marginX) - 2;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(wBoxX, currentY + 2, wBoxWidth, targetCardHeight - 4, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(13, 148, 136); // Teal-600
  doc.text('HIDRATAÇÃO DIÁRIA', wBoxX + 3, currentY + 7);
  doc.setFontSize(13);
  doc.setTextColor(17, 94, 89); // Teal-800
  doc.text(`${targetWaterMl}ml`, wBoxX + 3, currentY + 16);
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  const waterMlPerKg = patient.weightKg ? Math.round(targetWaterMl / patient.weightKg) : 35;
  doc.text(`~${waterMlPerKg} ml/kg/dia`, wBoxX + 3, currentY + 21);

  currentY += targetCardHeight + 5;

  // 4. Anthropometric Snapshot (if record available and toggled)
  if (includeAnthroSummary && anthroRecord) {
    checkPageBreak(18);
    doc.setFillColor(241, 245, 249); // Slate-100
    doc.roundedRect(marginX, currentY, contentWidth, 14, 1.5, 1.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text('AVALIAÇÃO ANTROPOMÉTRICA ATUAL:', marginX + 4, currentY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    const anthroDate = anthroRecord.date || 'Recente';
    const anthroType =
      anthroRecord.assessmentType === 'bioimpedancia' ? 'Bioimpedância InBody' : 'Pollock 7 Dobras';
    const bf = anthroRecord.bodyFatPercentage;
    const lean = anthroRecord.leanMassKg || (anthroRecord.weightKg * (100 - bf)) / 100;
    const fat = anthroRecord.fatMassKg || (anthroRecord.weightKg * bf) / 100;
    const skeletal = anthroRecord.bioimpedance?.skeletalMuscleMassKg;

    let anthroSummaryStr = `Data: ${anthroDate} (${anthroType}) • Gordura Corporal: ${bf.toFixed(1)}% • Massa Magra: ${lean.toFixed(1)}kg • Massa Gorda: ${fat.toFixed(1)}kg`;
    if (skeletal) {
      anthroSummaryStr += ` • MME: ${skeletal.toFixed(1)}kg`;
    }
    doc.text(anthroSummaryStr, marginX + 4, currentY + 10);

    currentY += 18;
  }

  // 5. Prescribed Meals Plan Breakdown
  const meals = plan?.meals && plan.meals.length > 0 ? plan.meals : [];

  checkPageBreak(12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(
    `PRESCRIÇÃO DIETÉTICA - ESTRUTURA DAS REFEIÇÕES (${meals.length} REFEIÇÕES)`,
    marginX,
    currentY + 2
  );
  currentY += 6;

  if (meals.length === 0) {
    checkPageBreak(15);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('Nenhuma refeição cadastrada no plano atual.', marginX, currentY + 5);
    currentY += 10;
  } else {
    meals.forEach((meal, mealIdx) => {
      // Calculate total calories for meal
      const mealCalories = meal.items.reduce((acc, item) => acc + (item.calories || 0), 0);
      const mealProtein = meal.items.reduce((acc, item) => acc + (item.protein || 0), 0);
      const mealCarbs = meal.items.reduce((acc, item) => acc + (item.carbs || 0), 0);
      const mealFats = meal.items.reduce((acc, item) => acc + (item.fats || 0), 0);

      // Estimate full height needed for this meal block
      const headerH = 7.5;
      const itemsH = meal.items.length * 5;
      let subsH = 0;
      if (includeSubstitutions) {
        meal.items.forEach((item) => {
          if (item.possibleSubstitutions && item.possibleSubstitutions.length > 0) {
            subsH += Math.min(2, item.possibleSubstitutions.length) * 3.5;
          }
        });
      }
      const instructionsH = meal.instructions ? 5 : 0;
      const totalMealHeight = headerH + itemsH + subsH + instructionsH + 4;

      // If the entire meal cannot fit on the current page, and it's reasonably sized (< 110mm), break before starting
      if (totalMealHeight <= 110) {
        checkPageBreak(totalMealHeight);
      } else {
        // If it's very large, at least ensure header and first item fit
        checkPageBreak(headerH + 12);
      }

      // Meal Header Strip
      doc.setFillColor(241, 245, 249); // Slate-100
      doc.roundedRect(marginX, currentY, contentWidth, 6.5, 1, 1, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(
        `${mealIdx + 1}. ${meal.name}  [${meal.time || '--:--'}]`,
        marginX + 3,
        currentY + 4.5
      );

      // Meal macro badge on right
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text(
        `Total: ${mealCalories} kcal  (P: ${mealProtein.toFixed(0)}g | C: ${mealCarbs.toFixed(0)}g | G: ${mealFats.toFixed(0)}g)`,
        pageWidth - marginX - 3,
        currentY + 4.5,
        { align: 'right' }
      );

      currentY += 8;

      // Meal Food Items
      meal.items.forEach((item) => {
        checkPageBreak(7);

        // Bullet and Food Name
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(30, 41, 59);
        const itemLine = `• ${item.foodName}: ${item.amountG}g (${item.measureLabel || `${item.amountG}g`})`;
        doc.text(itemLine, marginX + 4, currentY);

        // Item macros on right
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        const macroStr = `${item.calories} kcal  |  P: ${item.protein}g  C: ${item.carbs}g  G: ${item.fats}g`;
        doc.text(macroStr, pageWidth - marginX - 4, currentY, { align: 'right' });

        currentY += 4.5;

        // Substitutions if present
        if (includeSubstitutions && item.possibleSubstitutions && item.possibleSubstitutions.length > 0) {
          const subsToShow = item.possibleSubstitutions.slice(0, 2);
          subsToShow.forEach((sub) => {
            checkPageBreak(5);
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(7);
            doc.setTextColor(5, 150, 105); // Emerald-600
            const subText = `   ↳ Opção de troca: ${sub.name} - ${sub.amountG}g (${sub.measureLabel}) [${sub.calories} kcal]`;
            doc.text(subText, marginX + 4, currentY);
            currentY += 3.5;
          });
        }
      });

      // Meal Instructions if present
      if (meal.instructions) {
        checkPageBreak(5);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(`   Obs: ${meal.instructions}`, marginX + 4, currentY);
        currentY += 4;
      }

      currentY += 2;
    });
  }

  // 6. Clinical Guidelines & General Instructions (if available and toggled)
  if (includeGuidelines && plan?.generalGuidelines) {
    checkPageBreak(25);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('ORIENTAÇÕES CLÍNICAS & CONDUTA NUTRICIONAL', marginX, currentY + 3);
    currentY += 6;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    const guidelinesText = plan.generalGuidelines;
    const splitGuidelines = doc.splitTextToSize(guidelinesText, contentWidth - 8);
    const boxH = Math.max(14, splitGuidelines.length * 3.5 + 6);

    checkPageBreak(boxH);
    doc.roundedRect(marginX, currentY, contentWidth, boxH, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(splitGuidelines, marginX + 4, currentY + 5);

    currentY += boxH + 6;
  }

  // 7. Signature & Footer Block
  checkPageBreak(26);
  currentY = Math.max(currentY + 4, pageHeight - 32);

  // Signature line
  const signLineWidth = 65;
  const signLineX = pageWidth / 2 - signLineWidth / 2;
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.3);
  doc.line(signLineX, currentY + 6, signLineX + signLineWidth, currentY + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(nutritionistName, pageWidth / 2, currentY + 10, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(5, 150, 105);
  doc.text(crn, pageWidth / 2, currentY + 14, { align: 'center' });

  // Clinic contact footer
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `${clinicAddress} • Tel: ${clinicPhone} • E-mail: ${clinicEmail}`,
    pageWidth / 2,
    currentY + 19,
    { align: 'center' }
  );

  // 8. Page numbering across all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - marginX, pageHeight - 5, { align: 'right' });
    doc.text(
      'Documento gerado eletronicamente por NutriCore Pro • Válido para orientação clínica',
      marginX,
      pageHeight - 5
    );
  }

  const generatedFilename =
    filename ||
    `Plano_Nutricional_${patient.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;

  let blob: Blob | undefined;
  let blobUrl: string | undefined;

  // Execute requested action
  if (action === 'download') {
    doc.save(generatedFilename);
  } else if (action === 'print') {
    blob = doc.output('blob');
    blobUrl = URL.createObjectURL(blob);
    // Open printable iframe or popup
    const printWindow = window.open(blobUrl, '_blank');
    if (printWindow) {
      printWindow.focus();
    } else {
      // Fallback: create invisible iframe to trigger print
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.src = blobUrl;
      document.body.appendChild(iframe);
      iframe.onload = () => {
        try {
          iframe.contentWindow?.print();
        } catch (e) {
          console.warn('Iframe print fallback error:', e);
          doc.save(generatedFilename);
        }
      };
    }
  } else if (action === 'blob') {
    blob = doc.output('blob');
    blobUrl = URL.createObjectURL(blob);
  }

  return {
    doc,
    filename: generatedFilename,
    blob,
    blobUrl,
  };
};

/**
 * Convenience helper to directly print the patient's plan summary.
 */
export const printPatientPlanSummary = (
  patient: Patient,
  plan?: DietPlan | null,
  options: Omit<PlanPdfOptions, 'action'> = {}
): PlanPdfResult => {
  return generatePatientPlanPDF(patient, plan, { ...options, action: 'print' });
};
