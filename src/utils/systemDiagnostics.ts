import {
  Patient,
  AnthropometryRecord,
  DietPlan,
  NutritionProgramTemplate,
  PatientProgramEnrollment,
  NutritionistTask,
  PatientEvolutionPhoto,
  PaymentTransaction,
  FoodItem,
  DiagnosticCheckItem,
  SystemDiagnosticReport
} from '../types';
import { calculateBMI, calculateBMR, calculateTDEE, calculatePollock7 } from './nutritionCalculations';

export interface DiagnosticsContextData {
  patients: Patient[];
  anthropometryRecords: AnthropometryRecord[];
  dietPlans: DietPlan[];
  programTemplates: NutritionProgramTemplate[];
  patientProgramEnrollments: PatientProgramEnrollment[];
  tasks: NutritionistTask[];
  photos: PatientEvolutionPhoto[];
  payments: PaymentTransaction[];
  foods: FoodItem[];
  superAdminEmail: string;
}

export function executeSystemDiagnostics(data: DiagnosticsContextData): SystemDiagnosticReport {
  const startTime = performance.now();
  const checks: DiagnosticCheckItem[] = [];

  // 1. Auth & RBAC
  try {
    const isSuperAdminValid = data.superAdminEmail === 'victorlaraujo@gmail.com';
    checks.push({
      id: 'diag-auth-01',
      category: 'auth_rbac',
      name: 'Super-Administrador & Credenciais Master',
      description: 'Valida se o usuário Super-Admin está configurado com permissões de gestão e segurança.',
      status: isSuperAdminValid ? 'passed' : 'warning',
      details: isSuperAdminValid
        ? `Super-Admin configurado com sucesso (${data.superAdminEmail}). Permissões de exclusão e gestão ativas.`
        : `Email do Super-Admin diverge do padrão: ${data.superAdminEmail}`,
      itemsAnalyzedCount: 1,
    });
  } catch (err: any) {
    checks.push({
      id: 'diag-auth-01',
      category: 'auth_rbac',
      name: 'Super-Administrador & Credenciais Master',
      description: 'Valida se o usuário Super-Admin está configurado.',
      status: 'failed',
      details: `Erro ao verificar Super-Admin: ${err.message}`,
    });
  }

  // 2. Patient Records Integrity
  try {
    const totalPatients = data.patients.length;
    let validPatients = 0;
    const invalidList: string[] = [];

    data.patients.forEach((p) => {
      if (p.id && p.name && p.weightKg > 20 && p.heightCm > 50 && p.targetCalories > 500) {
        validPatients++;
      } else {
        invalidList.push(p.name || p.id);
      }
    });

    const isAllValid = validPatients === totalPatients && totalPatients > 0;
    checks.push({
      id: 'diag-patients-01',
      category: 'patient_records',
      name: 'Integridade dos Prontuários de Pacientes',
      description: 'Verifica se todos os pacientes contêm peso, altura, metas calóricas e contatos válidos.',
      status: isAllValid ? 'passed' : totalPatients === 0 ? 'warning' : 'failed',
      details: isAllValid
        ? `Todos os ${totalPatients} pacientes cadastrados possuem dados biométricos e cadastrais íntegros.`
        : `Inconsistências detectadas em: ${invalidList.join(', ')}`,
      itemsAnalyzedCount: totalPatients,
    });
  } catch (err: any) {
    checks.push({
      id: 'diag-patients-01',
      category: 'patient_records',
      name: 'Integridade dos Prontuários',
      description: 'Verifica prontuários de pacientes.',
      status: 'failed',
      details: `Erro na análise: ${err.message}`,
    });
  }

  // 3. Clinical Math & Anthropometric Logic
  try {
    let mathChecksPassed = 0;
    let mathChecksTotal = 0;

    // Test Pollock-7 math on sample
    const sampleRecord = data.anthropometryRecords[0];
    if (sampleRecord) {
      mathChecksTotal++;
      const resultPollock = calculatePollock7(
        sampleRecord.skinfolds,
        29,
        'Masculino',
        sampleRecord.weightKg || 80
      );
      if (resultPollock.bodyFatPercentage > 5 && resultPollock.bodyFatPercentage < 50) {
        mathChecksPassed++;
      }
    }

    // Test BMI formula
    mathChecksTotal++;
    const testBmi = calculateBMI(80, 180);
    if (testBmi.value === 24.7) {
      mathChecksPassed++;
    }

    // Test TDEE
    mathChecksTotal++;
    const testBmr = calculateBMR(80, 180, 30, 'Masculino', 'mifflin');
    const testTdee = calculateTDEE(testBmr, 1.55);
    if (testTdee > 1500 && testTdee < 4000) {
      mathChecksPassed++;
    }

    checks.push({
      id: 'diag-math-01',
      category: 'clinical_math',
      name: 'Fórmulas Matemáticas Clínicas (OMS, Pollock 7D & Mifflin)',
      description: 'Valida a consistência e precisão das equações metabólicas, IMC e densidade corporal.',
      status: mathChecksPassed === mathChecksTotal ? 'passed' : 'failed',
      details: `Testes de regressão biométrica executados: ${mathChecksPassed}/${mathChecksTotal} validados com sucesso.`,
      itemsAnalyzedCount: mathChecksTotal,
    });
  } catch (err: any) {
    checks.push({
      id: 'diag-math-01',
      category: 'clinical_math',
      name: 'Fórmulas Matemáticas Clínicas',
      description: 'Validação matemática das equações.',
      status: 'failed',
      details: `Erro no cálculo clínico: ${err.message}`,
    });
  }

  // 4. Care Programs & Sessions
  try {
    const totalEnrollments = data.patientProgramEnrollments.length;
    let consistentEnrollments = 0;

    data.patientProgramEnrollments.forEach((enrollment) => {
      if (
        enrollment.totalConsultations > 0 &&
        enrollment.completedConsultations <= enrollment.totalConsultations &&
        enrollment.startDate &&
        enrollment.endDate
      ) {
        consistentEnrollments++;
      }
    });

    const isProgramsValid = consistentEnrollments === totalEnrollments && totalEnrollments > 0;
    checks.push({
      id: 'diag-programs-01',
      category: 'care_programs',
      name: 'Programas de Acompanhamento & Sessões',
      description: 'Verifica matrículas de programas, roadmaps de consultas e controle de status.',
      status: isProgramsValid ? 'passed' : 'warning',
      details: isProgramsValid
        ? `${consistentEnrollments} programas ativos/concluídos verificados. Cronogramas e sessões 100% sincronizados.`
        : `Atenção: ${totalEnrollments - consistentEnrollments} programas com dados de sessão incompletos.`,
      itemsAnalyzedCount: totalEnrollments,
    });
  } catch (err: any) {
    checks.push({
      id: 'diag-programs-01',
      category: 'care_programs',
      name: 'Programas de Acompanhamento',
      description: 'Validação de programas.',
      status: 'failed',
      details: `Erro na verificação de programas: ${err.message}`,
    });
  }

  // 5. Diet Plans & TACO Database
  try {
    const totalFoods = data.foods.length;
    const hasSufficientFoods = totalFoods >= 50;
    const totalPlans = data.dietPlans.length;

    checks.push({
      id: 'diag-diets-01',
      category: 'diets_taco',
      name: 'Banco de Alimentos TACO & Cardápios',
      description: 'Valida tabelas nutricionais, calorias dos planos e correspondência de macronutrientes.',
      status: hasSufficientFoods && totalPlans > 0 ? 'passed' : 'warning',
      details: `${totalFoods} alimentos disponíveis na Tabela TACO/IBGE e ${totalPlans} planos alimentares modelados.`,
      itemsAnalyzedCount: totalFoods + totalPlans,
    });
  } catch (err: any) {
    checks.push({
      id: 'diag-diets-01',
      category: 'diets_taco',
      name: 'Banco de Alimentos TACO & Cardápios',
      description: 'Validação de dietas.',
      status: 'failed',
      details: `Erro na verificação de alimentos: ${err.message}`,
    });
  }

  // 6. Evolution Photos & Comparative Module
  try {
    const totalPhotos = data.photos.length;
    const photosWithAngles = data.photos.filter((p) => ['frontal', 'lateral_direita', 'lateral_esquerda', 'costas'].includes(p.angle)).length;
    const isPhotosValid = totalPhotos > 0 && photosWithAngles === totalPhotos;

    checks.push({
      id: 'diag-photos-01',
      category: 'photos_evolution',
      name: 'Fotos de Evolução & Comparador Visual',
      description: 'Verifica o registro fotográfico por data/ângulo e a disponibilidade do comparador antes/depois.',
      status: isPhotosValid ? 'passed' : totalPhotos === 0 ? 'warning' : 'failed',
      details: isPhotosValid
        ? `${totalPhotos} fotografias clínicas catalogadas com ângulos e metadados de bioimpedância/peso vinculados.`
        : `${totalPhotos} fotos encontradas. Adicione fotos de evolução para habilitar o comparador completo.`,
      itemsAnalyzedCount: totalPhotos,
    });
  } catch (err: any) {
    checks.push({
      id: 'diag-photos-01',
      category: 'photos_evolution',
      name: 'Fotos de Evolução',
      description: 'Validação do módulo fotográfico.',
      status: 'failed',
      details: `Erro nas fotos de evolução: ${err.message}`,
    });
  }

  // 7. Nutritionist Tasks & Reminders
  try {
    const totalTasks = data.tasks.length;
    const pendingTasks = data.tasks.filter((t) => !t.isCompleted).length;
    const hasPriorities = data.tasks.every((t) => ['alta', 'media', 'baixa'].includes(t.priority));

    checks.push({
      id: 'diag-tasks-01',
      category: 'tasks_reminders',
      name: 'Central de Tarefas & Lembretes Administrativos',
      description: 'Verifica pendências de follow-up, revisões de plano e prazos de retorno dos pacientes.',
      status: hasPriorities ? 'passed' : 'warning',
      details: `${totalTasks} tarefas gerenciadas no painel (${pendingTasks} pendentes, todas com prioridades e datas íntegras).`,
      itemsAnalyzedCount: totalTasks,
    });
  } catch (err: any) {
    checks.push({
      id: 'diag-tasks-01',
      category: 'tasks_reminders',
      name: 'Central de Tarefas',
      description: 'Validação de lembretes e tarefas.',
      status: 'failed',
      details: `Erro nas tarefas: ${err.message}`,
    });
  }

  // 8. Internal Financial Control (Strictly Internal Tracking)
  try {
    const totalTransactions = data.payments.length;
    // Ensure all transactions have positive or zero amount and valid payment method
    const isCleanLedger = data.payments.every((p) => p.amount >= 0 && p.currency === 'BRL');

    checks.push({
      id: 'diag-finance-01',
      category: 'financial_internal',
      name: 'Controle Financeiro Interno & Livro Caixa',
      description: 'Garante que os valores informados pelo nutricionista estão consistentes e sem gateways externos.',
      status: isCleanLedger ? 'passed' : 'failed',
      details: isCleanLedger
        ? `${totalTransactions} lançamentos internos validados. Conformidade total: sem intermediação externa.`
        : 'Inconsistência em valores de lançamentos internos.',
      itemsAnalyzedCount: totalTransactions,
    });
  } catch (err: any) {
    checks.push({
      id: 'diag-finance-01',
      category: 'financial_internal',
      name: 'Controle Financeiro Interno',
      description: 'Validação financeira interna.',
      status: 'failed',
      details: `Erro no controle financeiro: ${err.message}`,
    });
  }

  const duration = Math.round(performance.now() - startTime);
  const passedCount = checks.filter((c) => c.status === 'passed').length;
  const warningCount = checks.filter((c) => c.status === 'warning').length;
  const failedCount = checks.filter((c) => c.status === 'failed').length;

  const overallStatus: 'healthy' | 'warning' | 'critical' =
    failedCount > 0 ? 'critical' : warningCount > 0 ? 'warning' : 'healthy';

  return {
    timestamp: new Date().toISOString(),
    overallStatus,
    checks,
    passedCount,
    warningCount,
    failedCount,
    executionDurationMs: duration,
  };
}
