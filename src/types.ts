export type Gender = 'Masculino' | 'Feminino';

export type ActivityLevel = 1.2 | 1.375 | 1.55 | 1.725 | 1.9;

export type BMRFormula = 'mifflin' | 'harris';

export type NutritionGoal = 'emagrecimento' | 'hipertrofia' | 'manutencao' | 'saude_geral';

export type UserRole = 'super-admin' | 'admin' | 'nutritionist' | 'patient';

export interface AuthUserPermissions {
  canDeleteAllDatabase: boolean;
  canDeleteAllNutritionists: boolean;
  canDeleteAllPatients: boolean;
  canManageClinic: boolean;
  canAccessBilling: boolean;
}

export interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  isSuperAdmin: boolean;
  permissions: AuthUserPermissions;
}

export interface NutritionistUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  crn: string;
  specialty?: string;
  specialties?: string[];
  avatarUrl?: string;
  status: 'ativo' | 'inativo';
  role?: 'nutritionist' | 'admin';
  bio?: string;
  assignedPatientCount?: number;
  colorTheme?: string;
  createdAt: string;
}

export interface Patient {
  id: string;
  nutritionistId?: string; // Vínculo com o nutricionista responsável
  name: string;
  email: string;
  phone: string;
  birthDate: string; // YYYY-MM-DD
  age: number;
  gender: Gender;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  bmrFormula: BMRFormula;
  goal: NutritionGoal;
  targetCalories: number;
  targetProteinG: number;
  targetCarbsG: number;
  targetFatsG: number;
  targetFiberG?: number;
  targetWaterMl: number;
  notes?: string;
  avatarUrl?: string;
  createdAt: string;
  lastConsultationDate?: string;
  nextConsultationDate?: string;
}

export interface SkinfoldMeasurements {
  subscapular: number; // Subescapular (mm)
  triceps: number;      // Tríceps (mm)
  pectoral: number;     // Peitoral (mm)
  midaxillary: number;  // Axilar Média (mm)
  suprailiac: number;   // Supra-ilíaca (mm)
  abdominal: number;    // Abdominal (mm)
  thigh: number;        // Coxa (mm)
}

export interface CircumferenceMeasurements {
  neck?: number;        // Pescoço (cm)
  chest?: number;       // Tórax / Peitoral (cm)
  waist: number;        // Cintura (cm)
  abdomen: number;      // Abdômen (cm)
  hip: number;          // Quadril (cm)
  rightArmRelaxed: number; // Braço D Relaxado (cm)
  rightArmContracted: number; // Braço D Contraído (cm)
  leftArmRelaxed?: number;
  rightThigh: number;   // Coxa D (cm)
  leftThigh?: number;
  rightCalf: number;    // Panturrilha D (cm)
}

export interface BioimpedanceData {
  method?: 'inbody' | 'omron' | 'tanita' | 'manual_bioimpedance';
  rawPdfFileName?: string;
  bodyWaterLiters?: number;       // Água Corporal Total (L)
  dryLeanMassKg?: number;         // Massa Livre de Gordura / Proteínas (kg)
  mineralKg?: number;             // Minerais ósseos (kg)
  visceralFatLevel?: number;      // Nível de Gordura Visceral (1-20)
  basalMetabolicRateKcal?: number;// TMB medida pelo aparelho (kcal)
  skeletalMuscleMassKg?: number;  // Massa Muscular Esquelética (MME em kg)
  ecwRatio?: number;              // Relação Água Extracelular / Água Total (ECW/TBW)
  segmentalFatRightArmKg?: number;
  segmentalFatLeftArmKg?: number;
  segmentalFatTrunkKg?: number;
  segmentalFatRightLegKg?: number;
  segmentalFatLeftLegKg?: number;
  segmentalLeanRightArmKg?: number;
  segmentalLeanLeftArmKg?: number;
  segmentalLeanTrunkKg?: number;
  segmentalLeanRightLegKg?: number;
  segmentalLeanLeftLegKg?: number;
  impedanceOhms?: number;
  inbodyScore?: number;           // Pontuação InBody (ex: 80/100)
}

export interface AnthropometryRecord {
  id: string;
  patientId: string;
  date: string; // YYYY-MM-DD
  consultationNumber?: number; // Ex: 1ª Consulta, 2ª Consulta (Retorno)...
  assessmentType: 'dobras_pollock' | 'bioimpedancia' | 'combinado';
  weightKg: number;
  heightCm: number;
  skinfolds: SkinfoldMeasurements;
  circumferences?: CircumferenceMeasurements;
  sumSkinfolds: number;
  bodyDensity: number;
  bodyFatPercentage: number;
  fatMassKg: number;
  leanMassKg: number;
  boneResidualMassKg?: number;
  bmi: number;
  bioimpedance?: BioimpedanceData;
  notes?: string;
  registeredBy?: 'nutritionist' | 'patient';
}

export type ShoppingListFrequency = 'semanal' | 'quinzenal' | 'mensal';

export interface ShoppingListItem {
  id: string;
  foodName: string;
  category: 'Proteínas & Carnes' | 'Hortifrúti & Frutas' | 'Grãos & Carboidratos' | 'Laticínios & Ovos' | 'Gorduras, Sementes & Castanhas' | 'Suplementos & Bebidas' | 'Mercearia & Temperos';
  baseWeeklyAmountG: number;
  adjustedAmountG: number;
  prepLossFactorPercent: number; // Ex: 20% de perda por cocção/limpeza
  unitLabel: string;
  dailyG: number;
  frequency: ShoppingListFrequency;
}

export interface FoodItem {
  id: string;
  name: string;
  category: 'Proteínas' | 'Carboidratos & Grãos' | 'Frutas' | 'Verduras & Legumes' | 'Laticínios' | 'Gorduras & Oleaginosas' | 'Bebidas & Outros' | 'Suplementos';
  servingBaseG: number; // usually 100g
  householdMeasure: string; // e.g. "1 colher de sopa (20g)"
  calories: number; // kcal per 100g
  protein: number;  // g per 100g
  carbs: number;    // g per 100g
  fats: number;     // g per 100g
  fiber: number;    // g per 100g
  sodiumMg?: number;
}

export interface FoodSubstitution {
  foodId: string;
  name: string;
  amountG: number;
  measureLabel: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  tip?: string;
  portionMultiplier?: number;
}

export interface FoodSubstitutionOption {
  id?: string;
  foodId?: string;
  name: string;
  amountG: number;
  measureLabel: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber?: number;
  tip?: string;
  portionMultiplier?: number;
}

export interface FoodSubstitutionGroup {
  id: string;
  name: string; // Ex: "Proteínas do Desjejum (Substitutos do Ovo)", "Fontes de Carboidrato Cozido"
  category: 'Proteínas' | 'Carboidratos & Grãos' | 'Laticínios & Ovos' | 'Gorduras & Castanhas' | 'Frutas & Vegetais' | 'Geral';
  description: string; // Ex: "Regra clínica de troca: 1 ovo médio (~50g) equivale a 1 fatia de tofu ou 35g de queijo minas"
  referenceFood: {
    foodId?: string;
    name: string; // Ex: "Ovo de galinha inteiro cozido / mexido"
    amountG: number; // Ex: 50
    measureLabel: string; // Ex: "1 unidade média (50g)"
    calories: number; // 72
    protein: number;  // 6.7
    carbs: number;    // 0.3
    fats: number;     // 4.8
  };
  substitutions: FoodSubstitutionOption[];
  applicableKeywords?: string[]; // Ex: ['ovo', 'clara', 'omelete']
  createdAt?: string;
  updatedAt?: string;
  authorNutritionistName?: string;
}

export interface DietMealItem {
  id: string;
  foodId: string;
  foodName: string;
  amountG: number;
  measureLabel: string;
  portionDescription?: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  customNotes?: string;
  substitutionGroupId?: string;
  substitutionGroupName?: string;
  substitutionRuleNote?: string;
  possibleSubstitutions?: FoodSubstitution[];
}

export interface DietMealOption {
  id: string;
  optionTitle: string; // Ex: "Opção 2 - Salmão com Quinoa e Legumes", "Opção 3 - Omelete Rápido"
  items: DietMealItem[];
  instructions?: string;
}

export interface DietMeal {
  id: string;
  name: string; // e.g. "Café da Manhã", "Almoço", etc.
  time: string; // "08:00"
  dayOfWeek?: 'todos' | 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' | 'sabado' | 'domingo' | 'treino' | 'descanso' | string;
  days?: string[]; // Ex: ['segunda', 'quarta', 'sexta']
  items: DietMealItem[];
  instructions?: string;
  options?: DietMealOption[]; // Opções de substituição para a refeição completa
}

export interface DietDayMenu {
  dayId: string; // 'segunda', 'terca', 'treino', etc.
  dayLabel: string; // "Segunda-feira", "Dias de Treino", etc.
  meals: DietMeal[];
  notes?: string;
}

export interface DietPlan {
  id: string;
  patientId: string;
  title: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  targetCalories: number;
  targetProteinG: number;
  targetCarbsG: number;
  targetFatsG: number;
  meals: DietMeal[];
  dayMenus?: DietDayMenu[]; // Variações por dia da semana
  generalGuidelines: string;
  waterGoalMl: number;
}

export interface DietTemplate {
  id: string;
  title: string;
  category: 'Hipertrofia & Ganho Muscular' | 'Emagrecimento & Cutting' | 'Low Carb & Cetogênica' | 'Dieta Mediterrânea' | 'Vegetariana & Vegana' | 'Saúde Geral & Longevidade' | 'Clínica & Condutas';
  description: string;
  targetCalories: number;
  targetProteinG: number;
  targetCarbsG: number;
  targetFatsG: number;
  waterGoalMl: number;
  meals: DietMeal[];
  generalGuidelines: string;
  authorNutritionistName?: string;
  isCustom?: boolean;
}

export interface LabExamItem {
  id: string;
  name: string;
  category: 'Glicemia & Insulina' | 'Perfil Lipídico' | 'Vitaminas & Minerais' | 'Tireoide & Hormônios' | 'Função Renal & Hepática' | 'Hemograma & Inflamatórios';
  value: number;
  unit: string;
  minReference: number;
  maxReference: number;
  optimalMin?: number;
  optimalMax?: number;
  status: 'baixo' | 'normal' | 'otimo' | 'elevado' | 'critico';
  notes?: string;
}

export interface LabExamRecord {
  id: string;
  patientId: string;
  date: string; // YYYY-MM-DD
  title: string; // Ex: "Perfil Bioquímico Completo - Consulta Inicial"
  examName?: string; // alias
  laboratoryName?: string;
  requestingProfessional?: string;
  consultationNumber?: number;
  items: LabExamItem[];
  markers?: LabExamItem[]; // alias for compatibility
  clinicalObservations?: string;
  notes?: string; // alias
  registeredBy?: 'nutritionist' | 'patient';
  fileName?: string;
  fileUrl?: string;
  createdAt: string;
}

export interface PrescriptionItem {
  id: string;
  name: string;
  dosage: string;
  timing?: string;
  instructions: string;
  durationDays?: number;
  form?: string;
  purpose?: string;
  category: 'Suplemento Esportivo' | 'Fitoterápico & Adaptógeno' | 'Vitaminas & Minerais' | 'Fórmula Magistral (Manipulado)' | 'Probiótico & Saúde Intestinal' | 'Suplemento Nutricional' | 'Nutracêutico' | 'Mineral Quelato' | 'Fitoterápico';
}

export interface SupplementPrescription {
  id: string;
  patientId: string;
  title: string;
  date: string; // YYYY-MM-DD
  nutritionistName: string;
  crn: string;
  validityDays: number;
  items: PrescriptionItem[];
  generalGuidelines?: string;
  pharmacyNotes?: string;
  notes?: string;
  createdAt: string;
}

export interface Anamnesis {
  id: string;
  patientId: string;
  updatedAt: string;
  mainObjective: string;
  clinicalHistory: string;
  foodAllergies: string;
  foodAversions: string;
  foodPreferences: string;
  bowelFunction: string;
  sleepHours: number;
  waterIntakeCurrentLiters: number;
  medicationsSupplements: string;
  twentyFourHourRecall?: string;
  routineNotes?: string;
}

export interface DailyAdherence {
  id: string;
  patientId: string;
  date: string; // YYYY-MM-DD
  completedMealIds: string[]; // meal IDs marked as done
  waterDrankMl: number;
  trained: boolean;
  workoutNotes?: string;
  dailyNotes?: string;
  energyLevel?: number; // 1-5
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  nutritionistId?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  durationMinutes?: number; // default 60
  type: 'Primeira Consulta' | 'Retorno' | 'Avaliação Física' | 'Ajuste de Plano' | 'Sessão de Programa Contínuo';
  status: 'Agendado' | 'Concluído' | 'Cancelado';
  modality?: 'presencial' | 'online_meet' | 'online_chat';
  meetLink?: string;
  googleChatSpaceUrl?: string;
  notes?: string;
  googleEventId?: string;
  googleEventLink?: string;
  consultationFee?: number; // Valor informado pelo nutricionista para controle interno
  internalPaymentStatus?: 'pago' | 'pendente' | 'isento' | 'incluso_no_programa';
  internalPaymentMethod?: 'pix' | 'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'transferencia' | 'outro';
  isProgramSession?: boolean;
  programEnrollmentId?: string;
  programTitle?: string;
  programSessionNumber?: number;
}

export interface GoogleAuthState {
  isConnected: boolean;
  accessToken: string | null;
  userEmail: string | null;
  userName: string | null;
  userAvatar: string | null;
  lastSyncedAt: string | null;
}

export interface ClinicPixConfig {
  keyType: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
  key: string;
  receiverName: string;
  city: string;
  bankName?: string;
}

export interface ClinicConfig {
  name: string;
  nutritionistName: string;
  crn: string;
  email: string;
  phone: string;
  address: string;
  pixConfig?: ClinicPixConfig;
}

export interface MasterAdminUser {
  id: string;
  name: string;
  email: string;
  role: 'super-admin' | 'admin';
  title: string;
  avatarUrl: string;
  canDeleteAllNutritionists: boolean;
  canDeleteAllPatients: boolean;
  canDeleteAllDatabase: boolean;
}

export interface BackupDataPackage {
  version: string;
  exportedAt: string;
  system: string;
  clinicConfig: ClinicConfig;
  nutritionists: NutritionistUser[];
  patients: Patient[];
  anthropometryRecords: AnthropometryRecord[];
  dietPlans: DietPlan[];
  dietTemplates: DietTemplate[];
  labExams: LabExamRecord[];
  prescriptions: SupplementPrescription[];
  anamnesisMap: Record<string, Anamnesis>;
  adherenceRecords: DailyAdherence[];
  appointments: Appointment[];
  foods: FoodItem[];
  foodSubstitutionGroups?: FoodSubstitutionGroup[];
}

export interface MealModificationItem {
  action: 'add' | 'modify' | 'replace' | 'optimize';
  foodName: string;
  amount: string;
  reason: string;
}

export interface MealSpecificAdjustment {
  mealName: string;
  currentAssessment?: string;
  suggestedAdjustment: string;
  modifications?: MealModificationItem[];
}

export interface SupplementSuggestion {
  name: string;
  dosage: string;
  timing: string;
  purpose: string;
}

export interface NutritionCoachAnalysis {
  diagnosticSummary: string;
  bodyCompositionInsight: {
    status: string;
    fatLossRating: string;
    leanMassPreservation: string;
    visceralFatAssessment?: string;
  };
  caloricRecommendation: {
    currentKcal: number;
    recommendedKcal: number;
    deltaKcal: number;
    strategy: string;
    rationale: string;
  };
  macroRecommendations: {
    protein: {
      targetG: number;
      gPerKg: number;
      rationale: string;
    };
    carbs: {
      targetG: number;
      gPerKg: number;
      rationale: string;
    };
    fats: {
      targetG: number;
      gPerKg: number;
      rationale: string;
    };
    waterMl: {
      targetMl: number;
      rationale: string;
    };
  };
  mealSpecificAdjustments: MealSpecificAdjustment[];
  actionablePatientTips: string[];
  supplementationSuggestions?: SupplementSuggestion[];
}

export type PaymentMethod = 'pix' | 'credit_card' | 'boleto' | 'dinheiro' | 'transferencia' | 'cartao_debito' | 'outro';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'cortesia';

export interface PaymentTransaction {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail?: string;
  patientPhone?: string;
  appointmentId?: string;
  programEnrollmentId?: string;
  dietPlanId?: string;
  entryType?: 'consulta_avulsa' | 'programa_acompanhamento' | 'avulso_outro';
  amount: number; // in BRL, e.g. 250.00
  currency: 'BRL';
  title: string;
  description: string;
  method: PaymentMethod;
  status: PaymentStatus;
  pixQrCodeUrl?: string;
  pixCopyPasteCode?: string;
  pixExpirationMinutes?: number;
  installments?: number;
  cardLast4?: string;
  cardBrand?: string;
  receiptNumber?: string;
  createdAt: string;
  paidAt?: string;
  paymentGateway?: 'mercadopago' | 'stripe' | 'pix_instant' | 'sandbox' | 'manual_internal';
  notes?: string;
}

export interface NutritionProgramTemplate {
  id: string;
  title: string;
  description: string;
  durationMonths: number;
  durationDays?: number;
  totalConsultations: number;
  suggestedFrequency: string; // Ex: 'Semanal', 'Quinzenal', 'Mensal'
  suggestedPrice: number; // Preço sugerido para controle interno (R$)
  includedFeatures: string[];
  targetGoal?: NutritionGoal | 'todos';
  isActive: boolean;
  createdAt: string;
}

export interface ProgramConsultationSession {
  id: string;
  sessionNumber: number; // 1, 2, 3...
  date: string; // YYYY-MM-DD
  status: 'agendada' | 'realizada' | 'cancelada';
  appointmentId?: string;
  anthropometryRecordId?: string;
  notes?: string;
  registeredAt?: string;
}

export interface PatientProgramEnrollment {
  id: string;
  patientId: string;
  patientName: string;
  programTemplateId?: string;
  title: string;
  description?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  durationMonths: number;
  totalConsultations: number;
  completedConsultations: number;
  status: 'ativo' | 'concluido' | 'pausado' | 'cancelado';
  internalFinance: {
    totalValue: number; // Valor informado pelo nutricionista
    paymentStatus: 'pago' | 'pendente' | 'parcial' | 'cortesia';
    paymentMethod: 'pix' | 'cartao_credito' | 'cartao_debito' | 'dinheiro' | 'transferencia' | 'parcelado_interno';
    paidAmount: number;
    installments?: number;
    paymentDate?: string;
    paymentNotes?: string;
  };
  sessions: ProgramConsultationSession[];
  clinicalObjectives?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type TaskCategory = 'follow_up' | 'administrative' | 'plan_review' | 'exam_check' | 'custom';
export type TaskPriority = 'alta' | 'media' | 'baixa';

export interface NutritionistTask {
  id: string;
  title: string;
  description?: string;
  category: TaskCategory;
  priority: TaskPriority;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  patientId?: string;
  patientName?: string;
  isCompleted: boolean;
  completedAt?: string;
  createdAt: string;
  autoGenerated?: boolean;
  reminderNoticeDays?: number;
}
export type PhotoAngle = 'frontal' | 'lateral_direita' | 'lateral_esquerda' | 'costas';

export interface PatientEvolutionPhoto {
  id: string;
  patientId: string;
  date: string; // YYYY-MM-DD
  angle: PhotoAngle;
  photoUrl: string; // Data URL or secure storage URL
  caption?: string;
  weightKgAtTime?: number;
  bodyFatPercentAtTime?: number;
  consultationSessionNumber?: number;
  tags?: string[];
  createdAt: string;
}

export interface ProgramProgressReport {
  id: string;
  patientId: string;
  patientName: string;
  programEnrollmentId: string;
  programTitle: string;
  generatedDate: string; // YYYY-MM-DD
  period: {
    startDate: string;
    endDate: string;
    totalConsultations: number;
    completedConsultations: number;
  };
  metricsDelta: {
    initialWeightKg: number;
    finalWeightKg: number;
    deltaWeightKg: number;
    initialBodyFatPercent: number;
    finalBodyFatPercent: number;
    deltaBodyFatPercent: number;
    initialLeanMassKg: number;
    finalLeanMassKg: number;
    deltaLeanMassKg: number;
    initialWaistCm?: number;
    finalWaistCm?: number;
    deltaWaistCm?: number;
  };
  beforePhoto?: PatientEvolutionPhoto;
  afterPhoto?: PatientEvolutionPhoto;
  clinicalSummary: string;
  lifestyleImprovements: string[];
  nextStepsAdvice: string;
  nutritionistName: string;
  crn: string;
  sentToPatientPortal: boolean;
  sentAt?: string;
}

export interface DiagnosticCheckItem {
  id: string;
  category: 'auth_rbac' | 'patient_records' | 'clinical_math' | 'care_programs' | 'diets_taco' | 'photos_evolution' | 'tasks_reminders' | 'financial_internal';
  name: string;
  description: string;
  status: 'passed' | 'warning' | 'failed' | 'running';
  details: string;
  executionTimeMs?: number;
  itemsAnalyzedCount?: number;
}

export interface SystemDiagnosticReport {
  timestamp: string;
  overallStatus: 'healthy' | 'warning' | 'critical';
  checks: DiagnosticCheckItem[];
  passedCount: number;
  warningCount: number;
  failedCount: number;
  executionDurationMs: number;
}
