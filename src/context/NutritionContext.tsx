import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Patient,
  AnthropometryRecord,
  DietPlan,
  DietTemplate,
  LabExamRecord,
  SupplementPrescription,
  FoodItem,
  Anamnesis,
  DailyAdherence,
  Appointment,
  DietMeal,
  DietMealItem,
  ClinicConfig,
  GoogleAuthState,
  NutritionistUser,
  UserRole,
  BackupDataPackage,
  PaymentTransaction,
  PaymentStatus,
  MasterAdminUser,
  ClinicPixConfig,
  AuthUser,
  FoodSubstitutionGroup,
  NutritionProgramTemplate,
  PatientProgramEnrollment,
  ProgramConsultationSession,
  NutritionistTask,
  PatientEvolutionPhoto,
  ProgramProgressReport,
  SystemDiagnosticReport,
  DiagnosticCheckItem
} from '../types';
import {
  INITIAL_NUTRITIONISTS,
  INITIAL_PATIENTS,
  INITIAL_ANTHROPOMETRY,
  INITIAL_DIET_PLANS,
  INITIAL_DIET_TEMPLATES,
  INITIAL_LAB_EXAMS,
  INITIAL_PRESCRIPTIONS,
  INITIAL_ANAMNESIS,
  INITIAL_ADHERENCE,
  INITIAL_APPOINTMENTS,
  INITIAL_PAYMENTS
} from '../data/initialData';
import {
  INITIAL_PROGRAM_TEMPLATES,
  INITIAL_PATIENT_ENROLLMENTS
} from '../data/initialPrograms';
import { INITIAL_EVOLUTION_PHOTOS } from '../data/initialPhotos';
import { INITIAL_NUTRITIONIST_TASKS } from '../data/initialTasks';
import { INITIAL_FOOD_SUBSTITUTION_GROUPS } from '../data/initialSubstitutionGroups';
import { TACO_FOOD_DATABASE } from '../data/tacoDatabase';
import { calculateBMR, calculateTDEE } from '../utils/nutritionCalculations';
import { GoogleCalendarService } from '../services/googleCalendarService';
import { executeSystemDiagnostics } from '../utils/systemDiagnostics';
import {
  SUPER_ADMIN_EMAIL,
  isSuperAdminEmail,
  canDeleteAllNutritionists,
  canDeleteAllPatients,
  canDeleteAllDatabase,
  buildAuthUser
} from '../utils/permissions';
import { wipeFirestoreDatabase } from '../services/firebase';

export { SUPER_ADMIN_EMAIL };
export const MASTER_ADMIN_EMAIL = SUPER_ADMIN_EMAIL;

export const MASTER_ADMIN_USER: MasterAdminUser = {
  id: 'usr-super-admin-victor',
  name: 'Victor L. Araújo',
  email: SUPER_ADMIN_EMAIL,
  role: 'super-admin',
  title: 'Super-Administrador Master Supremo',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  canDeleteAllNutritionists: true,
  canDeleteAllPatients: true,
  canDeleteAllDatabase: true
};

export const DEFAULT_CLINIC_CONFIG: ClinicConfig = {
  name: 'Clínica NutriCore Pro',
  nutritionistName: 'Dr. Ricardo Silva',
  crn: 'CRN-3 48.912/SP',
  email: 'contato@nutricorepro.com.br',
  phone: '(11) 98765-4321',
  address: 'Av. Paulista, 1500 - Cj 82, Bela Vista - São Paulo / SP',
  pixConfig: {
    keyType: 'email',
    key: MASTER_ADMIN_EMAIL,
    receiverName: 'Victor L. Araújo - NutriCore Pro',
    city: 'São Paulo',
    bankName: 'Nubank / Inter'
  }
};

interface NutritionContextType {
  // Navigation & RBAC
  currentView: 'admin' | 'patient';
  setCurrentView: (view: 'admin' | 'patient') => void;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  currentNutritionistId: string;
  setCurrentNutritionistId: (id: string) => void;
  activeAdminTab: 'dashboard' | 'patients' | 'programs' | 'billing' | 'templates' | 'calculators' | 'foods' | 'system_admin';
  setActiveAdminTab: (tab: 'dashboard' | 'patients' | 'programs' | 'billing' | 'templates' | 'calculators' | 'foods' | 'system_admin') => void;
  activePatientTab: 'overview' | 'programs' | 'weight_trends' | 'body_evolution' | 'evolution_photos' | 'anthropometry' | 'diet_planner' | 'shopping_list' | 'anamnesis' | 'adherence' | 'lab_exams' | 'prescriptions';
  setActivePatientTab: (tab: 'overview' | 'programs' | 'weight_trends' | 'body_evolution' | 'evolution_photos' | 'anthropometry' | 'diet_planner' | 'shopping_list' | 'anamnesis' | 'adherence' | 'lab_exams' | 'prescriptions') => void;
  mobileDeviceFrame: boolean;
  setMobileDeviceFrame: (enabled: boolean) => void;
  exportPlanModalOpen: boolean;
  isExportPlanModalOpen: boolean;
  setExportPlanModalOpen: (open: boolean) => void;

  // Authentication & Super-Admin (victorlaraujo@gmail.com)
  authUser: AuthUser;
  masterAdminEmail: string;
  isMasterAdmin: boolean;
  isSuperAdmin: boolean;
  canDeleteAllDatabase: boolean;
  masterAdminUser: MasterAdminUser;
  switchAuthEmail: (email: string, name?: string) => void;
  deleteAllNutritionists: () => void;
  deleteAllPatients: () => void;
  deleteAllDatabase: () => Promise<{ success: boolean; message: string }>;

  // Clinic
  clinicConfig: ClinicConfig;
  setClinicConfig: React.Dispatch<React.SetStateAction<ClinicConfig>>;
  clinicPixConfig: ClinicPixConfig;
  updateClinicPixConfig: (config: Partial<ClinicPixConfig>) => void;

  // Nutritionists (Admin level management)
  nutritionists: NutritionistUser[];
  currentNutritionist: NutritionistUser | undefined;
  addNutritionist: (nutriData: Omit<NutritionistUser, 'id' | 'createdAt'>) => NutritionistUser;
  updateNutritionist: (id: string, updates: Partial<NutritionistUser>) => void;
  deleteNutritionist: (id: string) => void;

  // Patients
  patients: Patient[];
  filteredPatients: Patient[];
  activePatientId: string;
  activePatient: Patient | undefined;
  setActivePatientId: (id: string) => void;
  selectedPatientForDetail: Patient | null;
  setSelectedPatientForDetail: (patient: Patient | null) => void;
  addPatient: (patientData: Omit<Patient, 'id' | 'createdAt'>) => Patient;
  updatePatient: (id: string, updates: Partial<Patient>) => void;
  deletePatient: (id: string) => void;
  
  // Patient Modal (Create / Edit)
  isPatientModalOpen: boolean;
  patientModalMode: 'create' | 'edit';
  patientToEdit: Patient | null;
  openNewPatientModal: () => void;
  openEditPatientModal: (patient: Patient) => void;
  closePatientModal: () => void;

  // Anthropometry
  anthropometryRecords: AnthropometryRecord[];
  patientAnthropometry: AnthropometryRecord[];
  addAnthropometryRecord: (record: Omit<AnthropometryRecord, 'id'>) => AnthropometryRecord;
  deleteAnthropometryRecord: (id: string) => void;

  // Diet Plans
  dietPlans: DietPlan[];
  activeDietPlan: DietPlan | undefined;
  saveDietPlan: (plan: DietPlan) => void;
  addMealToPlan: (planId: string, meal: Omit<DietMeal, 'id'>) => void;
  updateMeal: (planId: string, mealId: string, updates: Partial<DietMeal>) => void;
  deleteMeal: (planId: string, mealId: string) => void;
  addItemToMeal: (planId: string, mealId: string, item: Omit<DietMealItem, 'id'>) => void;
  removeItemFromMeal: (planId: string, mealId: string, itemId: string) => void;
  updateItemInMeal: (planId: string, mealId: string, itemId: string, updates: Partial<DietMealItem>) => void;

  // Diet Templates
  dietTemplates: DietTemplate[];
  addDietTemplate: (tpl: Omit<DietTemplate, 'id'>) => DietTemplate;
  updateDietTemplate: (id: string, updates: Partial<DietTemplate>) => void;
  deleteDietTemplate: (id: string) => void;
  applyDietTemplate: (patientId: string, templateId: string, scaleToTarget?: boolean) => DietPlan;
  saveCurrentPlanAsTemplate: (planId: string, title: string, category: DietTemplate['category'], description: string) => DietTemplate;

  // Food Substitution Groups & Equivalence Rules
  foodSubstitutionGroups: FoodSubstitutionGroup[];
  addFoodSubstitutionGroup: (group: Omit<FoodSubstitutionGroup, 'id' | 'createdAt' | 'updatedAt'>) => FoodSubstitutionGroup;
  updateFoodSubstitutionGroup: (id: string, updates: Partial<FoodSubstitutionGroup>) => void;
  deleteFoodSubstitutionGroup: (id: string) => void;
  applySubstitutionGroupToItem: (planId: string, mealId: string, itemId: string, groupId: string) => void;
  autoLinkSubstitutionGroupsToPlan: (planId: string) => number;

  // Lab Exams
  labExams: LabExamRecord[];
  patientLabExams: LabExamRecord[];
  addLabExam: (record: Omit<LabExamRecord, 'id' | 'createdAt'>) => LabExamRecord;
  updateLabExam: (id: string, updates: Partial<LabExamRecord>) => void;
  deleteLabExam: (id: string) => void;

  // Prescriptions
  prescriptions: SupplementPrescription[];
  patientPrescriptions: SupplementPrescription[];
  addPrescription: (presc: Omit<SupplementPrescription, 'id' | 'createdAt'>) => SupplementPrescription;
  updatePrescription: (id: string, updates: Partial<SupplementPrescription>) => void;
  deletePrescription: (id: string) => void;

  // Food Database
  foods: FoodItem[];
  addCustomFood: (food: Omit<FoodItem, 'id'>) => FoodItem;

  // Anamnesis
  anamnesisMap: Record<string, Anamnesis>;
  saveAnamnesis: (patientId: string, data: Partial<Anamnesis>) => void;

  // Adherence
  adherenceRecords: DailyAdherence[];
  todayAdherence: DailyAdherence | undefined;
  toggleMealCheck: (patientId: string, date: string, mealId: string) => void;
  logWater: (patientId: string, date: string, amountMl: number) => void;
  setWaterTotal: (patientId: string, date: string, totalMl: number) => void;
  toggleWorkout: (patientId: string, date: string, notes?: string) => void;
  toggleMealCompleted: (mealId: string) => void;
  logWaterIntake: (totalMl: number) => void;
  logWorkout: (trained?: boolean, notes?: string) => void;

  // Appointments & Teleconsultations
  appointments: Appointment[];
  addAppointment: (appointment: Omit<Appointment, 'id'>, syncToGoogle?: boolean) => Promise<Appointment>;
  updateAppointment: (id: string, updates: Partial<Appointment>, syncToGoogle?: boolean) => Promise<void>;
  updateAppointmentStatus: (id: string, status: Appointment['status'], syncToGoogle?: boolean) => Promise<void>;
  deleteAppointment: (id: string, syncToGoogle?: boolean) => Promise<void>;
  generateGoogleMeetLink: (patientName: string) => string;
  generateGoogleChatLink: (patientName: string) => string;

  // Google Calendar Integration
  googleAuth: GoogleAuthState;
  isSyncingCalendar: boolean;
  googleClientId: string;
  setGoogleClientId: (clientId: string) => void;
  connectGoogleAccount: (customClientId?: string) => Promise<void>;
  connectDemoGoogleAccount: () => void;
  disconnectGoogleAccount: () => void;
  syncAppointmentsWithGoogle: () => Promise<{ imported: number; exported: number }>;

  // Backup & Restore
  exportBackupData: () => string;
  importBackupData: (jsonString: string) => { success: boolean; message: string; counts?: any };

  // Online Payments & Billing
  payments: PaymentTransaction[];
  patientPayments: (patientId?: string) => PaymentTransaction[];
  activePaymentModal: {
    isOpen: boolean;
    patientId?: string;
    patientName?: string;
    amount?: number;
    title?: string;
    description?: string;
    appointmentId?: string;
    dietPlanId?: string;
  } | null;
  openPaymentModal: (options?: {
    patientId?: string;
    patientName?: string;
    amount?: number;
    title?: string;
    description?: string;
    appointmentId?: string;
    dietPlanId?: string;
  }) => void;
  closePaymentModal: () => void;
  createPixCharge: (data: {
    patientId: string;
    patientName?: string;
    amount: number;
    title?: string;
    description?: string;
    appointmentId?: string;
    dietPlanId?: string;
  }) => Promise<PaymentTransaction>;
  processCardPayment: (data: {
    patientId: string;
    patientName?: string;
    amount: number;
    title?: string;
    description?: string;
    cardHolder: string;
    cardNumber: string;
    installments?: number;
    appointmentId?: string;
    dietPlanId?: string;
  }) => Promise<PaymentTransaction>;
  confirmPixPayment: (transactionId: string) => Promise<PaymentTransaction>;
  updatePaymentStatus: (transactionId: string, status: PaymentStatus) => void;
  deletePayment: (transactionId: string) => void;
  addPayment: (payment: Omit<PaymentTransaction, 'id' | 'createdAt'>) => PaymentTransaction;

  // Programas de Acompanhamento Nutricional (Continuous Care Programs)
  programTemplates: NutritionProgramTemplate[];
  patientProgramEnrollments: PatientProgramEnrollment[];
  addProgramTemplate: (template: Omit<NutritionProgramTemplate, 'id' | 'createdAt'>) => NutritionProgramTemplate;
  updateProgramTemplate: (id: string, updates: Partial<NutritionProgramTemplate>) => void;
  deleteProgramTemplate: (id: string) => void;
  enrollPatientInProgram: (data: {
    patientId: string;
    programTemplateId?: string;
    title: string;
    description?: string;
    startDate: string;
    durationMonths: number;
    totalConsultations: number;
    totalValue: number;
    paymentStatus: 'pago' | 'pendente' | 'parcial' | 'cortesia';
    paymentMethod: any;
    installments?: number;
    clinicalObjectives?: string;
    notes?: string;
  }) => PatientProgramEnrollment;
  updatePatientEnrollment: (id: string, updates: Partial<PatientProgramEnrollment>) => void;
  deletePatientEnrollment: (id: string) => void;
  registerProgramSession: (enrollmentId: string, sessionData: {
    date: string;
    notes?: string;
    appointmentId?: string;
  }) => void;
  recordConsultationPayment: (data: {
    patientId: string;
    appointmentId?: string;
    programEnrollmentId?: string;
    amount: number;
    title: string;
    paymentMethod: any;
    status: 'pago' | 'pendente' | 'cortesia';
    notes?: string;
    entryType?: 'consulta_avulsa' | 'programa_acompanhamento';
  }) => PaymentTransaction;

  // Nutritionist Task Reminders & Administrative Deadlines
  tasks: NutritionistTask[];
  addTask: (task: Omit<NutritionistTask, 'id' | 'createdAt' | 'isCompleted'>) => NutritionistTask;
  updateTask: (id: string, updates: Partial<NutritionistTask>) => void;
  toggleTaskCompleted: (id: string) => void;
  deleteTask: (id: string) => void;

  // Patient Evolution Photos & Visual Progress
  patientEvolutionPhotos: PatientEvolutionPhoto[];
  addEvolutionPhoto: (photo: Omit<PatientEvolutionPhoto, 'id' | 'createdAt'>) => PatientEvolutionPhoto;
  deleteEvolutionPhoto: (id: string) => void;
  getPatientPhotos: (patientId: string) => PatientEvolutionPhoto[];

  // Program Progress Reports & Patient Notifications
  programProgressReports: ProgramProgressReport[];
  generateAndSendProgramReport: (enrollmentId: string, customObservations?: string) => ProgramProgressReport;
  activeReportModal: {
    isOpen: boolean;
    report?: ProgramProgressReport;
    enrollment?: PatientProgramEnrollment;
  } | null;
  openReportModal: (report?: ProgramProgressReport, enrollment?: PatientProgramEnrollment) => void;
  closeReportModal: () => void;

  // System Diagnostics & Data Integrity
  isDiagnosticsModalOpen: boolean;
  openDiagnosticsModal: () => void;
  closeDiagnosticsModal: () => void;
  runSystemDiagnostics: () => Promise<SystemDiagnosticReport>;
  latestDiagnosticReport: SystemDiagnosticReport | null;

  // Reset demo data
  resetAllData: () => void;
}

const NutritionContext = createContext<NutritionContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'nutricore_pro_v2_store';

export const NutritionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Authenticated user state (defaults to victorlaraujo@gmail.com as super-admin)
  const [authUser, setAuthUser] = useState<AuthUser>(() => {
    try {
      const savedEmail = localStorage.getItem(`${LOCAL_STORAGE_KEY}_auth_email`);
      const email = savedEmail || SUPER_ADMIN_EMAIL;
      return buildAuthUser(email);
    } catch {
      return buildAuthUser(SUPER_ADMIN_EMAIL);
    }
  });

  // Navigation & Role State
  const [currentView, setCurrentView] = useState<'admin' | 'patient'>('admin');
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    try {
      const savedEmail = localStorage.getItem(`${LOCAL_STORAGE_KEY}_auth_email`);
      if (savedEmail && !isSuperAdminEmail(savedEmail)) {
        return 'nutritionist';
      }
    } catch {}
    return 'super-admin';
  });
  const [currentNutritionistId, setCurrentNutritionistId] = useState<string>('nutri-01');
  const [activeAdminTab, setActiveAdminTab] = useState<'dashboard' | 'patients' | 'programs' | 'billing' | 'templates' | 'calculators' | 'foods' | 'system_admin'>('dashboard');
  const [activePatientTab, setActivePatientTab] = useState<'overview' | 'programs' | 'weight_trends' | 'body_evolution' | 'evolution_photos' | 'anthropometry' | 'diet_planner' | 'shopping_list' | 'anamnesis' | 'adherence' | 'lab_exams' | 'prescriptions'>('overview');
  const [mobileDeviceFrame, setMobileDeviceFrame] = useState<boolean>(false);
  const [exportPlanModalOpen, setExportPlanModalOpen] = useState<boolean>(false);

  // Nutrition Care Programs (Templates & Patient Enrollments)
  const [programTemplates, setProgramTemplates] = useState<NutritionProgramTemplate[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_program_templates`);
      return saved ? JSON.parse(saved) : INITIAL_PROGRAM_TEMPLATES;
    } catch {
      return INITIAL_PROGRAM_TEMPLATES;
    }
  });

  const [patientProgramEnrollments, setPatientProgramEnrollments] = useState<PatientProgramEnrollment[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_patient_enrollments`);
      return saved ? JSON.parse(saved) : INITIAL_PATIENT_ENROLLMENTS;
    } catch {
      return INITIAL_PATIENT_ENROLLMENTS;
    }
  });

  const [tasks, setTasks] = useState<NutritionistTask[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_tasks`);
      return saved ? JSON.parse(saved) : INITIAL_NUTRITIONIST_TASKS;
    } catch {
      return INITIAL_NUTRITIONIST_TASKS;
    }
  });

  // Patient Evolution Photos & Visual Timeline
  const [patientEvolutionPhotos, setPatientEvolutionPhotos] = useState<PatientEvolutionPhoto[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_photos`);
      return saved ? JSON.parse(saved) : INITIAL_EVOLUTION_PHOTOS;
    } catch {
      return INITIAL_EVOLUTION_PHOTOS;
    }
  });

  // Program Progress Reports & End-of-Program Summaries
  const [programProgressReports, setProgramProgressReports] = useState<ProgramProgressReport[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_progress_reports`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeReportModal, setActiveReportModal] = useState<{
    isOpen: boolean;
    report?: ProgramProgressReport;
    enrollment?: PatientProgramEnrollment;
  } | null>(null);

  // Interactive System Diagnostics Inspector Modal State
  const [isDiagnosticsModalOpen, setIsDiagnosticsModalOpen] = useState<boolean>(false);
  const [latestDiagnosticReport, setLatestDiagnosticReport] = useState<SystemDiagnosticReport | null>(null);

  // Clinic
  const [clinicConfig, setClinicConfig] = useState<ClinicConfig>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_clinic`);
      return saved ? JSON.parse(saved) : DEFAULT_CLINIC_CONFIG;
    } catch {
      return DEFAULT_CLINIC_CONFIG;
    }
  });

  // Nutritionists
  const [nutritionists, setNutritionists] = useState<NutritionistUser[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_nutritionists`);
      return saved ? JSON.parse(saved) : INITIAL_NUTRITIONISTS;
    } catch {
      return INITIAL_NUTRITIONISTS;
    }
  });

  // Patients
  const [patients, setPatients] = useState<Patient[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_patients`);
      return saved ? JSON.parse(saved) : INITIAL_PATIENTS;
    } catch {
      return INITIAL_PATIENTS;
    }
  });

  const [activePatientId, setActivePatientId] = useState<string>(() => {
    return patients[0]?.id || 'pat-01';
  });

  const [selectedPatientForDetail, setSelectedPatientForDetail] = useState<Patient | null>(() => {
    return patients[0] || null;
  });

  // Patient Modal (New / Edit) State
  const [isPatientModalOpen, setIsPatientModalOpen] = useState<boolean>(false);
  const [patientModalMode, setPatientModalMode] = useState<'create' | 'edit'>('create');
  const [patientToEdit, setPatientToEdit] = useState<Patient | null>(null);

  const openNewPatientModal = () => {
    setPatientModalMode('create');
    setPatientToEdit(null);
    setIsPatientModalOpen(true);
  };

  const openEditPatientModal = (patient: Patient) => {
    setPatientModalMode('edit');
    setPatientToEdit(patient);
    setIsPatientModalOpen(true);
  };

  const closePatientModal = () => {
    setIsPatientModalOpen(false);
    setPatientToEdit(null);
  };

  // Anthropometry
  const [anthropometryRecords, setAnthropometryRecords] = useState<AnthropometryRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_anthropometry`);
      return saved ? JSON.parse(saved) : INITIAL_ANTHROPOMETRY;
    } catch {
      return INITIAL_ANTHROPOMETRY;
    }
  });

  // Diet Plans
  const [dietPlans, setDietPlans] = useState<DietPlan[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_diet_plans`);
      return saved ? JSON.parse(saved) : INITIAL_DIET_PLANS;
    } catch {
      return INITIAL_DIET_PLANS;
    }
  });

  // Diet Templates
  const [dietTemplates, setDietTemplates] = useState<DietTemplate[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_diet_templates`);
      return saved ? JSON.parse(saved) : INITIAL_DIET_TEMPLATES;
    } catch {
      return INITIAL_DIET_TEMPLATES;
    }
  });

  // Food Substitution Groups & Equivalence Rules
  const [foodSubstitutionGroups, setFoodSubstitutionGroups] = useState<FoodSubstitutionGroup[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_substitution_groups`);
      return saved ? JSON.parse(saved) : INITIAL_FOOD_SUBSTITUTION_GROUPS;
    } catch {
      return INITIAL_FOOD_SUBSTITUTION_GROUPS;
    }
  });

  // Lab Exams
  const [labExams, setLabExams] = useState<LabExamRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_lab_exams`);
      return saved ? JSON.parse(saved) : INITIAL_LAB_EXAMS;
    } catch {
      return INITIAL_LAB_EXAMS;
    }
  });

  // Prescriptions
  const [prescriptions, setPrescriptions] = useState<SupplementPrescription[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_prescriptions`);
      return saved ? JSON.parse(saved) : INITIAL_PRESCRIPTIONS;
    } catch {
      return INITIAL_PRESCRIPTIONS;
    }
  });

  // Food Database
  const [foods, setFoods] = useState<FoodItem[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_foods`);
      return saved ? JSON.parse(saved) : TACO_FOOD_DATABASE;
    } catch {
      return TACO_FOOD_DATABASE;
    }
  });

  // Anamnesis
  const [anamnesisMap, setAnamnesisMap] = useState<Record<string, Anamnesis>>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_anamnesis`);
      return saved ? JSON.parse(saved) : INITIAL_ANAMNESIS;
    } catch {
      return INITIAL_ANAMNESIS;
    }
  });

  // Adherence
  const [adherenceRecords, setAdherenceRecords] = useState<DailyAdherence[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_adherence`);
      return saved ? JSON.parse(saved) : INITIAL_ADHERENCE;
    } catch {
      return INITIAL_ADHERENCE;
    }
  });

  // Appointments
  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_appointments`);
      return saved ? JSON.parse(saved) : INITIAL_APPOINTMENTS;
    } catch {
      return INITIAL_APPOINTMENTS;
    }
  });

  // Online Payments & Billing
  const [payments, setPayments] = useState<PaymentTransaction[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_payments`);
      return saved ? JSON.parse(saved) : INITIAL_PAYMENTS;
    } catch {
      return INITIAL_PAYMENTS;
    }
  });

  const [activePaymentModal, setActivePaymentModal] = useState<{
    isOpen: boolean;
    patientId?: string;
    patientName?: string;
    amount?: number;
    title?: string;
    description?: string;
    appointmentId?: string;
    dietPlanId?: string;
  } | null>(null);

  // Google OAuth & Calendar State
  const [googleClientId, setGoogleClientIdState] = useState<string>(() => {
    const stored = localStorage.getItem('nutricore_google_client_id');
    if (stored && !stored.includes('aistudio.apps.googleusercontent.com')) {
      return stored;
    }
    return '914241741628-g6t2cpsinibcks79c6nanj2i031mmvi5.apps.googleusercontent.com';
  });

  const [googleAuth, setGoogleAuth] = useState<GoogleAuthState>(() => {
    const token = GoogleCalendarService.getStoredToken();
    const profile = GoogleCalendarService.getStoredProfile();
    return {
      isConnected: !!token,
      accessToken: token,
      userEmail: profile?.email || null,
      userName: profile?.name || null,
      userAvatar: profile?.picture || null,
      lastSyncedAt: localStorage.getItem('nutricore_last_calendar_sync') || null,
    };
  });

  const [isSyncingCalendar, setIsSyncingCalendar] = useState<boolean>(false);

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_clinic`, JSON.stringify(clinicConfig));
  }, [clinicConfig]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_nutritionists`, JSON.stringify(nutritionists));
  }, [nutritionists]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_patients`, JSON.stringify(patients));
  }, [patients]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_anthropometry`, JSON.stringify(anthropometryRecords));
  }, [anthropometryRecords]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_diet_plans`, JSON.stringify(dietPlans));
  }, [dietPlans]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_diet_templates`, JSON.stringify(dietTemplates));
  }, [dietTemplates]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_substitution_groups`, JSON.stringify(foodSubstitutionGroups));
  }, [foodSubstitutionGroups]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_lab_exams`, JSON.stringify(labExams));
  }, [labExams]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_prescriptions`, JSON.stringify(prescriptions));
  }, [prescriptions]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_foods`, JSON.stringify(foods));
  }, [foods]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_anamnesis`, JSON.stringify(anamnesisMap));
  }, [anamnesisMap]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_adherence`, JSON.stringify(adherenceRecords));
  }, [adherenceRecords]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_appointments`, JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_payments`, JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_program_templates`, JSON.stringify(programTemplates));
  }, [programTemplates]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_patient_enrollments`, JSON.stringify(patientProgramEnrollments));
  }, [patientProgramEnrollments]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_tasks`, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_photos`, JSON.stringify(patientEvolutionPhotos));
  }, [patientEvolutionPhotos]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_progress_reports`, JSON.stringify(programProgressReports));
  }, [programProgressReports]);

  // Derived values
  const currentNutritionist = nutritionists.find((n) => n.id === currentNutritionistId) || nutritionists[0];

  const isSuperAdmin = authUser.isSuperAdmin || isSuperAdminEmail(authUser.email) || currentRole === 'super-admin';
  const isMasterAdmin = isSuperAdmin || currentRole === 'admin';

  const filteredPatients = (currentRole === 'admin' || currentRole === 'super-admin')
    ? patients
    : currentRole === 'nutritionist'
    ? patients.filter((p) => !p.nutritionistId || p.nutritionistId === currentNutritionistId)
    : patients.filter((p) => p.id === activePatientId);

  const activePatient = patients.find((p) => p.id === activePatientId) || patients[0];

  const currentPatientTargetId = currentView === 'patient'
    ? activePatientId
    : (selectedPatientForDetail?.id || activePatientId);

  const patientAnthropometry = anthropometryRecords
    .filter((a) => a.patientId === currentPatientTargetId)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const activeDietPlan = dietPlans.find(
    (plan) => plan.patientId === currentPatientTargetId && plan.isActive
  ) || dietPlans.find(
    (plan) => plan.patientId === currentPatientTargetId
  );

  const patientLabExams = labExams
    .filter((e) => e.patientId === currentPatientTargetId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const patientPrescriptions = prescriptions
    .filter((p) => p.patientId === currentPatientTargetId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAdherence = adherenceRecords.find(
    (a) => a.patientId === activePatientId && a.date === todayStr
  );

  // Authentication Switcher for Testing/Demonstration
  const switchAuthEmail = (email: string, name?: string) => {
    const updatedUser = buildAuthUser(email, name);
    setAuthUser(updatedUser);
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_auth_email`, email);
    } catch {}
    if (updatedUser.isSuperAdmin) {
      setCurrentRole('super-admin');
    } else {
      setCurrentRole('nutritionist');
    }
  };

  // Nutritionist Actions
  const addNutritionist = (nutriData: Omit<NutritionistUser, 'id' | 'createdAt'>): NutritionistUser => {
    const newNutri: NutritionistUser = {
      ...nutriData,
      id: `nutri-${Date.now()}`,
      createdAt: todayStr,
      avatarUrl: nutriData.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(nutriData.name)}`
    };
    setNutritionists((prev) => [...prev, newNutri]);
    return newNutri;
  };

  const updateNutritionist = (id: string, updates: Partial<NutritionistUser>) => {
    setNutritionists((prev) => prev.map((n) => (n.id === id ? { ...n, ...updates } : n)));
  };

  const deleteNutritionist = (id: string) => {
    setNutritionists((prev) => prev.filter((n) => n.id !== id));
    if (currentNutritionistId === id) {
      const remaining = nutritionists.filter((n) => n.id !== id);
      setCurrentNutritionistId(remaining[0]?.id || '');
    }
  };

  // Privileged Super-Admin Operations (victorlaraujo@gmail.com)
  const deleteAllNutritionists = () => {
    if (!canDeleteAllNutritionists(authUser.email, authUser.role)) {
      alert(`Acesso Negado: O e-mail "${authUser.email}" não possui privilégios de 'super-admin'. Somente ${SUPER_ADMIN_EMAIL} pode excluir todos os nutricionistas.`);
      throw new Error(`Acesso Negado: Apenas ${SUPER_ADMIN_EMAIL} possui permissão para excluir todos os nutricionistas.`);
    }
    setNutritionists([]);
    setCurrentNutritionistId('');
  };

  const deleteAllPatients = () => {
    if (!canDeleteAllPatients(authUser.email, authUser.role)) {
      alert(`Acesso Negado: O e-mail "${authUser.email}" não possui privilégios de 'super-admin'. Somente ${SUPER_ADMIN_EMAIL} pode excluir todos os pacientes.`);
      throw new Error(`Acesso Negado: Apenas ${SUPER_ADMIN_EMAIL} possui permissão para excluir todos os pacientes.`);
    }
    setPatients([]);
    setSelectedPatientForDetail(null);
    setActivePatientId('');
    setAnthropometryRecords([]);
    setDietPlans([]);
    setAdherenceRecords([]);
    setAppointments([]);
    setLabExams([]);
    setPrescriptions([]);
    setAnamnesisMap({});
  };

  const deleteAllDatabase = async (): Promise<{ success: boolean; message: string }> => {
    if (!canDeleteAllDatabase(authUser.email, authUser.role)) {
      alert(`Acesso Negado: Privilégios totais de exclusão na base de dados reservados exclusivamente para o super-admin (${SUPER_ADMIN_EMAIL}).`);
      throw new Error(`Acesso Negado: Privilégios totais de exclusão na base de dados reservados para ${SUPER_ADMIN_EMAIL}.`);
    }

    setNutritionists([]);
    setCurrentNutritionistId('');
    setPatients([]);
    setSelectedPatientForDetail(null);
    setActivePatientId('');
    setAnthropometryRecords([]);
    setDietPlans([]);
    setDietTemplates([]);
    setLabExams([]);
    setPrescriptions([]);
    setAnamnesisMap({});
    setAdherenceRecords([]);
    setAppointments([]);
    setPayments([]);

    // Clear local storage entries
    try {
      localStorage.removeItem(`${LOCAL_STORAGE_KEY}_nutritionists`);
      localStorage.removeItem(`${LOCAL_STORAGE_KEY}_patients`);
      localStorage.removeItem(`${LOCAL_STORAGE_KEY}_anthropometry`);
      localStorage.removeItem(`${LOCAL_STORAGE_KEY}_dietPlans`);
      localStorage.removeItem(`${LOCAL_STORAGE_KEY}_dietTemplates`);
      localStorage.removeItem(`${LOCAL_STORAGE_KEY}_labExams`);
      localStorage.removeItem(`${LOCAL_STORAGE_KEY}_prescriptions`);
      localStorage.removeItem(`${LOCAL_STORAGE_KEY}_anamnesis`);
      localStorage.removeItem(`${LOCAL_STORAGE_KEY}_adherence`);
      localStorage.removeItem(`${LOCAL_STORAGE_KEY}_appointments`);
      localStorage.removeItem(`${LOCAL_STORAGE_KEY}_payments`);
    } catch {}

    // Wipe from Firestore
    try {
      const res = await wipeFirestoreDatabase(authUser.email);
      return res;
    } catch (err: any) {
      return {
        success: true,
        message: `Base de dados local zerada com sucesso (${err?.message || 'Firestore sincronizado'}).`
      };
    }
  };

  // Patient Actions
  const addPatient = (patientData: Omit<Patient, 'id' | 'createdAt'>): Patient => {
    const bmr = calculateBMR(patientData.weightKg, patientData.heightCm, patientData.age, patientData.gender, patientData.bmrFormula);
    const tdee = calculateTDEE(bmr, patientData.activityLevel);

    const newPatient: Patient = {
      ...patientData,
      id: `pat-${Date.now()}`,
      nutritionistId: patientData.nutritionistId || currentNutritionistId,
      targetCalories: patientData.targetCalories || tdee,
      targetProteinG: patientData.targetProteinG || Math.round(patientData.weightKg * 2),
      targetCarbsG: patientData.targetCarbsG || Math.round((tdee * 0.45) / 4),
      targetFatsG: patientData.targetFatsG || Math.round((tdee * 0.25) / 9),
      targetWaterMl: patientData.targetWaterMl || Math.round(patientData.weightKg * 35),
      createdAt: todayStr,
      avatarUrl: patientData.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(patientData.name)}`
    };

    setPatients((prev) => [newPatient, ...prev]);
    setSelectedPatientForDetail(newPatient);
    setActivePatientId(newPatient.id);
    return newPatient;
  };

  const updatePatient = (id: string, updates: Partial<Patient>) => {
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const updated = { ...p, ...updates };
          if (selectedPatientForDetail?.id === id) {
            setSelectedPatientForDetail(updated);
          }
          return updated;
        }
        return p;
      })
    );
  };

  const deletePatient = (id: string) => {
    setPatients((prev) => prev.filter((p) => p.id !== id));
    if (selectedPatientForDetail?.id === id) {
      const remaining = patients.filter((p) => p.id !== id);
      setSelectedPatientForDetail(remaining[0] || null);
    }
    if (activePatientId === id) {
      const remaining = patients.filter((p) => p.id !== id);
      setActivePatientId(remaining[0]?.id || '');
    }
  };

  // Anthropometry Actions
  const addAnthropometryRecord = (recordData: Omit<AnthropometryRecord, 'id'>): AnthropometryRecord => {
    const newRecord: AnthropometryRecord = {
      ...recordData,
      id: `anthro-${Date.now()}`,
    };
    setAnthropometryRecords((prev) => [...prev, newRecord]);

    if (recordData.patientId && recordData.weightKg > 0) {
      updatePatient(recordData.patientId, {
        weightKg: recordData.weightKg,
        lastConsultationDate: recordData.date,
      });
    }

    return newRecord;
  };

  const deleteAnthropometryRecord = (id: string) => {
    setAnthropometryRecords((prev) => prev.filter((r) => r.id !== id));
  };

  // Diet Plan Actions
  const saveDietPlan = (plan: DietPlan) => {
    setDietPlans((prev) => {
      const exists = prev.some((p) => p.id === plan.id);
      if (exists) {
        return prev.map((p) => (p.id === plan.id ? { ...plan, updatedAt: todayStr } : p));
      } else {
        return [{ ...plan, updatedAt: todayStr }, ...prev];
      }
    });
  };

  const addMealToPlan = (planId: string, meal: Omit<DietMeal, 'id'>) => {
    const newMeal: DietMeal = {
      ...meal,
      id: `meal-${Date.now()}`,
    };

    setDietPlans((prev) =>
      prev.map((plan) => {
        if (plan.id === planId) {
          return {
            ...plan,
            meals: [...plan.meals, newMeal],
            updatedAt: todayStr,
          };
        }
        return plan;
      })
    );
  };

  const updateMeal = (planId: string, mealId: string, updates: Partial<DietMeal>) => {
    setDietPlans((prev) =>
      prev.map((plan) => {
        if (plan.id === planId) {
          return {
            ...plan,
            meals: plan.meals.map((m) => (m.id === mealId ? { ...m, ...updates } : m)),
            updatedAt: todayStr,
          };
        }
        return plan;
      })
    );
  };

  const deleteMeal = (planId: string, mealId: string) => {
    setDietPlans((prev) =>
      prev.map((plan) => {
        if (plan.id === planId) {
          return {
            ...plan,
            meals: plan.meals.filter((m) => m.id !== mealId),
            updatedAt: todayStr,
          };
        }
        return plan;
      })
    );
  };

  const addItemToMeal = (planId: string, mealId: string, item: Omit<DietMealItem, 'id'>) => {
    const newItem: DietMealItem = {
      ...item,
      id: `item-${Date.now()}`,
    };

    setDietPlans((prev) =>
      prev.map((plan) => {
        if (plan.id === planId) {
          return {
            ...plan,
            meals: plan.meals.map((meal) => {
              if (meal.id === mealId) {
                return {
                  ...meal,
                  items: [...meal.items, newItem],
                };
              }
              return meal;
            }),
            updatedAt: todayStr,
          };
        }
        return plan;
      })
    );
  };

  const removeItemFromMeal = (planId: string, mealId: string, itemId: string) => {
    setDietPlans((prev) =>
      prev.map((plan) => {
        if (plan.id === planId) {
          return {
            ...plan,
            meals: plan.meals.map((meal) => {
              if (meal.id === mealId) {
                return {
                  ...meal,
                  items: meal.items.filter((item) => item.id !== itemId),
                };
              }
              return meal;
            }),
            updatedAt: todayStr,
          };
        }
        return plan;
      })
    );
  };

  const updateItemInMeal = (planId: string, mealId: string, itemId: string, updates: Partial<DietMealItem>) => {
    setDietPlans((prev) =>
      prev.map((plan) => {
        if (plan.id === planId) {
          return {
            ...plan,
            meals: plan.meals.map((meal) => {
              if (meal.id === mealId) {
                return {
                  ...meal,
                  items: meal.items.map((it) => (it.id === itemId ? { ...it, ...updates } : it)),
                };
              }
              return meal;
            }),
            updatedAt: todayStr,
          };
        }
        return plan;
      })
    );
  };

  // Diet Templates Actions
  const addDietTemplate = (tplData: Omit<DietTemplate, 'id'>): DietTemplate => {
    const newTpl: DietTemplate = {
      ...tplData,
      id: `tpl-${Date.now()}`,
      isCustom: true,
      authorNutritionistName: currentNutritionist?.name || clinicConfig.nutritionistName
    };
    setDietTemplates((prev) => [newTpl, ...prev]);
    return newTpl;
  };

  const updateDietTemplate = (id: string, updates: Partial<DietTemplate>) => {
    setDietTemplates((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  const deleteDietTemplate = (id: string) => {
    setDietTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  const applyDietTemplate = (patientId: string, templateId: string, scaleToTarget: boolean = false): DietPlan => {
    const template = dietTemplates.find((t) => t.id === templateId);
    const targetPatient = patients.find((p) => p.id === patientId);

    if (!template) throw new Error('Modelo de cardápio não encontrado');

    const scaleFactor = (scaleToTarget && targetPatient && template.targetCalories > 0)
      ? targetPatient.targetCalories / template.targetCalories
      : 1.0;

    const scaledMeals: DietMeal[] = template.meals.map((meal, mIdx) => ({
      id: `meal-${Date.now()}-${mIdx}`,
      name: meal.name,
      time: meal.time,
      instructions: meal.instructions,
      items: meal.items.map((item, iIdx) => {
        const amount = Math.round(item.amountG * scaleFactor);
        const ratio = item.amountG > 0 ? amount / item.amountG : 1;
        return {
          id: `item-${Date.now()}-${mIdx}-${iIdx}`,
          foodId: item.foodId,
          foodName: item.foodName,
          amountG: amount,
          measureLabel: item.measureLabel,
          calories: Math.round(item.calories * ratio),
          protein: Number((item.protein * ratio).toFixed(1)),
          carbs: Number((item.carbs * ratio).toFixed(1)),
          fats: Number((item.fats * ratio).toFixed(1)),
          fiber: Number((item.fiber * ratio).toFixed(1)),
          customNotes: item.customNotes,
          possibleSubstitutions: item.possibleSubstitutions?.map(sub => {
            const subAmount = Math.round(sub.amountG * ratio);
            const subRatio = sub.amountG > 0 ? subAmount / sub.amountG : 1;
            return {
              ...sub,
              amountG: subAmount,
              measureLabel: sub.measureLabel.includes('~')
                ? `${subAmount}g (~${sub.measureLabel.split('~')[1] || ''}`
                : `${subAmount}g`,
              calories: Math.round(sub.calories * subRatio),
              protein: Number((sub.protein * subRatio).toFixed(1)),
              carbs: Number((sub.carbs * subRatio).toFixed(1)),
              fats: Number((sub.fats * subRatio).toFixed(1)),
            };
          })
        };
      })
    }));

    const newPlan: DietPlan = {
      id: `diet-plan-${patientId}-${Date.now()}`,
      patientId,
      title: `Plano Base: ${template.title}`,
      isActive: true,
      createdAt: todayStr,
      updatedAt: todayStr,
      targetCalories: targetPatient?.targetCalories || Math.round(template.targetCalories * scaleFactor),
      targetProteinG: targetPatient?.targetProteinG || Math.round(template.targetProteinG * scaleFactor),
      targetCarbsG: targetPatient?.targetCarbsG || Math.round(template.targetCarbsG * scaleFactor),
      targetFatsG: targetPatient?.targetFatsG || Math.round(template.targetFatsG * scaleFactor),
      waterGoalMl: targetPatient?.targetWaterMl || template.waterGoalMl || 3000,
      generalGuidelines: template.generalGuidelines || 'Siga as orientações e horários estabelecidos.',
      meals: scaledMeals
    };

    // Desativa outros planos do paciente e ativa este novo
    setDietPlans((prev) => [
      newPlan,
      ...prev.map((p) => (p.patientId === patientId ? { ...p, isActive: false } : p))
    ]);

    return newPlan;
  };

  const saveCurrentPlanAsTemplate = (
    planId: string,
    title: string,
    category: DietTemplate['category'],
    description: string
  ): DietTemplate => {
    const plan = dietPlans.find((p) => p.id === planId);
    if (!plan) throw new Error('Plano alimentar não encontrado');

    const newTemplate: DietTemplate = {
      id: `tpl-${Date.now()}`,
      title,
      category,
      description,
      targetCalories: plan.targetCalories,
      targetProteinG: plan.targetProteinG,
      targetCarbsG: plan.targetCarbsG,
      targetFatsG: plan.targetFatsG,
      waterGoalMl: plan.waterGoalMl,
      generalGuidelines: plan.generalGuidelines,
      authorNutritionistName: currentNutritionist?.name || clinicConfig.nutritionistName,
      isCustom: true,
      meals: plan.meals.map((m) => ({
        ...m,
        id: `tpl-m-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        items: m.items.map((it) => ({
          ...it,
          id: `tpl-it-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
        }))
      }))
    };

    setDietTemplates((prev) => [newTemplate, ...prev]);
    return newTemplate;
  };

  // Food Substitution Groups Actions
  const addFoodSubstitutionGroup = (
    groupData: Omit<FoodSubstitutionGroup, 'id' | 'createdAt' | 'updatedAt'>
  ): FoodSubstitutionGroup => {
    const newGroup: FoodSubstitutionGroup = {
      ...groupData,
      id: `subgrp-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      authorNutritionistName: groupData.authorNutritionistName || currentNutritionist?.name || clinicConfig.nutritionistName
    };
    setFoodSubstitutionGroups((prev) => [newGroup, ...prev]);
    return newGroup;
  };

  const updateFoodSubstitutionGroup = (id: string, updates: Partial<FoodSubstitutionGroup>) => {
    setFoodSubstitutionGroups((prev) =>
      prev.map((g) =>
        g.id === id
          ? { ...g, ...updates, updatedAt: new Date().toISOString() }
          : g
      )
    );
  };

  const deleteFoodSubstitutionGroup = (id: string) => {
    setFoodSubstitutionGroups((prev) => prev.filter((g) => g.id !== id));
  };

  const applySubstitutionGroupToItem = (
    planId: string,
    mealId: string,
    itemId: string,
    groupId: string
  ) => {
    const group = foodSubstitutionGroups.find((g) => g.id === groupId);
    if (!group) return;

    setDietPlans((prev) =>
      prev.map((plan) => {
        if (plan.id !== planId) return plan;
        return {
          ...plan,
          updatedAt: todayStr,
          meals: plan.meals.map((meal) => {
            if (meal.id !== mealId) return meal;
            return {
              ...meal,
              items: meal.items.map((item) => {
                if (item.id !== itemId) return item;
                const refAmount = group.referenceFood.amountG > 0 ? group.referenceFood.amountG : 50;
                const scaleRatio = item.amountG > 0 ? item.amountG / refAmount : 1;

                const scaledSubstitutions = group.substitutions.map((sub) => {
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
                    portionMultiplier: scaleRatio
                  };
                });

                return {
                  ...item,
                  substitutionGroupId: group.id,
                  substitutionGroupName: group.name,
                  substitutionRuleNote: group.description,
                  possibleSubstitutions: scaledSubstitutions
                };
              })
            };
          })
        };
      })
    );
  };

  const autoLinkSubstitutionGroupsToPlan = (planId: string): number => {
    let linkedCount = 0;
    setDietPlans((prev) =>
      prev.map((plan) => {
        if (plan.id !== planId) return plan;
        return {
          ...plan,
          updatedAt: todayStr,
          meals: plan.meals.map((meal) => ({
            ...meal,
            items: meal.items.map((item) => {
              const nameLower = item.foodName.toLowerCase();
              const matchingGroup = foodSubstitutionGroups.find((g) => {
                if (g.applicableKeywords && g.applicableKeywords.some((k) => nameLower.includes(k.toLowerCase()))) {
                  return true;
                }
                const refLower = g.referenceFood.name.toLowerCase();
                return nameLower.includes(refLower) || refLower.includes(nameLower);
              });

              if (matchingGroup) {
                linkedCount++;
                const refAmount = matchingGroup.referenceFood.amountG > 0 ? matchingGroup.referenceFood.amountG : 50;
                const scaleRatio = item.amountG > 0 ? item.amountG / refAmount : 1;

                const scaledSubstitutions = matchingGroup.substitutions.map((sub) => {
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
                    portionMultiplier: scaleRatio
                  };
                });

                return {
                  ...item,
                  substitutionGroupId: matchingGroup.id,
                  substitutionGroupName: matchingGroup.name,
                  substitutionRuleNote: matchingGroup.description,
                  possibleSubstitutions: scaledSubstitutions
                };
              }
              return item;
            })
          }))
        };
      })
    );
    return linkedCount;
  };

  // Lab Exams Actions
  const addLabExam = (recordData: Omit<LabExamRecord, 'id' | 'createdAt'>): LabExamRecord => {
    const newRecord: LabExamRecord = {
      ...recordData,
      id: `exam-${Date.now()}`,
      createdAt: todayStr,
    };
    setLabExams((prev) => [newRecord, ...prev]);
    return newRecord;
  };

  const updateLabExam = (id: string, updates: Partial<LabExamRecord>) => {
    setLabExams((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
  };

  const deleteLabExam = (id: string) => {
    setLabExams((prev) => prev.filter((e) => e.id !== id));
  };

  // Prescriptions Actions
  const addPrescription = (prescData: Omit<SupplementPrescription, 'id' | 'createdAt'>): SupplementPrescription => {
    const newPresc: SupplementPrescription = {
      ...prescData,
      id: `presc-${Date.now()}`,
      createdAt: todayStr,
      nutritionistName: prescData.nutritionistName || currentNutritionist?.name || clinicConfig.nutritionistName,
      crn: prescData.crn || currentNutritionist?.crn || clinicConfig.crn
    };
    setPrescriptions((prev) => [newPresc, ...prev]);
    return newPresc;
  };

  const updatePrescription = (id: string, updates: Partial<SupplementPrescription>) => {
    setPrescriptions((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const deletePrescription = (id: string) => {
    setPrescriptions((prev) => prev.filter((p) => p.id !== id));
  };

  // Food Database Actions
  const addCustomFood = (foodData: Omit<FoodItem, 'id'>): FoodItem => {
    const newFood: FoodItem = {
      ...foodData,
      id: `food-custom-${Date.now()}`,
    };
    setFoods((prev) => [newFood, ...prev]);
    return newFood;
  };

  // Anamnesis Actions
  const saveAnamnesis = (patientId: string, data: Partial<Anamnesis>) => {
    setAnamnesisMap((prev) => {
      const existing = prev[patientId] || {
        id: `anam-${patientId}`,
        patientId,
        updatedAt: todayStr,
        mainObjective: '',
        clinicalHistory: '',
        foodAllergies: '',
        foodAversions: '',
        foodPreferences: '',
        bowelFunction: 'Regular',
        sleepHours: 8,
        waterIntakeCurrentLiters: 2,
        medicationsSupplements: '',
      };

      return {
        ...prev,
        [patientId]: {
          ...existing,
          ...data,
          updatedAt: todayStr,
        },
      };
    });
  };

  // Adherence Actions
  const toggleMealCheck = (patientId: string, date: string, mealId: string) => {
    setAdherenceRecords((prev) => {
      const existing = prev.find((a) => a.patientId === patientId && a.date === date);
      if (existing) {
        const completed = existing.completedMealIds.includes(mealId)
          ? existing.completedMealIds.filter((id) => id !== mealId)
          : [...existing.completedMealIds, mealId];
        return prev.map((a) => (a.id === existing.id ? { ...a, completedMealIds: completed } : a));
      } else {
        const newRecord: DailyAdherence = {
          id: `adh-${Date.now()}`,
          patientId,
          date,
          completedMealIds: [mealId],
          waterDrankMl: 0,
          trained: false,
        };
        return [newRecord, ...prev];
      }
    });
  };

  const logWater = (patientId: string, date: string, amountMl: number) => {
    setAdherenceRecords((prev) => {
      const existing = prev.find((a) => a.patientId === patientId && a.date === date);
      if (existing) {
        const newWater = Math.max(0, (existing.waterDrankMl || 0) + amountMl);
        return prev.map((a) => (a.id === existing.id ? { ...a, waterDrankMl: newWater } : a));
      } else {
        const newRecord: DailyAdherence = {
          id: `adh-${Date.now()}`,
          patientId,
          date,
          completedMealIds: [],
          waterDrankMl: Math.max(0, amountMl),
          trained: false,
        };
        return [newRecord, ...prev];
      }
    });
  };

  const setWaterTotal = (patientId: string, date: string, totalMl: number) => {
    setAdherenceRecords((prev) => {
      const existing = prev.find((a) => a.patientId === patientId && a.date === date);
      if (existing) {
        return prev.map((a) => (a.id === existing.id ? { ...a, waterDrankMl: totalMl } : a));
      } else {
        const newRecord: DailyAdherence = {
          id: `adh-${Date.now()}`,
          patientId,
          date,
          completedMealIds: [],
          waterDrankMl: totalMl,
          trained: false,
        };
        return [newRecord, ...prev];
      }
    });
  };

  const toggleWorkout = (patientId: string, date: string, notes?: string) => {
    setAdherenceRecords((prev) => {
      const existing = prev.find((a) => a.patientId === patientId && a.date === date);
      if (existing) {
        return prev.map((a) =>
          a.id === existing.id
            ? {
                ...a,
                trained: !a.trained,
                workoutNotes: notes !== undefined ? notes : a.workoutNotes,
              }
            : a
        );
      } else {
        const newRecord: DailyAdherence = {
          id: `adh-${Date.now()}`,
          patientId,
          date,
          completedMealIds: [],
          waterDrankMl: 0,
          trained: true,
          workoutNotes: notes || 'Treino concluído',
        };
        return [newRecord, ...prev];
      }
    });
  };

  const toggleMealCompleted = (mealId: string) => {
    toggleMealCheck(currentPatientTargetId, todayStr, mealId);
  };

  const logWaterIntake = (totalMl: number) => {
    setWaterTotal(currentPatientTargetId, todayStr, totalMl);
  };

  const logWorkout = (trained?: boolean, notes?: string) => {
    setAdherenceRecords((prev) => {
      const existing = prev.find((a) => a.patientId === currentPatientTargetId && a.date === todayStr);
      if (existing) {
        return prev.map((a) =>
          a.id === existing.id
            ? {
                ...a,
                trained: trained !== undefined ? trained : !a.trained,
                workoutNotes: notes !== undefined ? notes : a.workoutNotes,
              }
            : a
        );
      } else {
        const newRecord: DailyAdherence = {
          id: `adh-${Date.now()}`,
          patientId: currentPatientTargetId,
          date: todayStr,
          completedMealIds: [],
          waterDrankMl: 0,
          trained: trained !== undefined ? trained : true,
          workoutNotes: notes || 'Treino concluído',
        };
        return [newRecord, ...prev];
      }
    });
  };

  // Google Meet / Chat Link Generators
  const generateGoogleMeetLink = (patientName: string): string => {
    const slug = patientName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-');
    return `https://meet.google.com/nutri-${slug}-${Date.now().toString(36).slice(-4)}`;
  };

  const generateGoogleChatLink = (patientName: string): string => {
    const slug = patientName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-');
    return `https://chat.google.com/room/nutricore-${slug}`;
  };

  // Appointment Actions with Google Calendar & Meet sync
  const addAppointment = async (
    appointmentData: Omit<Appointment, 'id'>,
    syncToGoogle: boolean = true
  ): Promise<Appointment> => {
    let googleEventId: string | undefined = undefined;
    let googleEventLink: string | undefined = undefined;

    const meetLink = appointmentData.meetLink || (
      appointmentData.modality === 'online_meet' ? generateGoogleMeetLink(appointmentData.patientName) : undefined
    );
    const chatLink = appointmentData.googleChatSpaceUrl || generateGoogleChatLink(appointmentData.patientName);

    if (syncToGoogle && googleAuth.accessToken) {
      try {
        const duration = appointmentData.durationMinutes || 60;
        const [hour, min] = appointmentData.time.split(':').map((v) => parseInt(v) || 0);
        const startDate = new Date(`${appointmentData.date}T${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}:00`);
        const endDate = new Date(startDate.getTime() + duration * 60 * 1000);

        const created = await GoogleCalendarService.createEvent(googleAuth.accessToken, {
          summary: `Nutrição: ${appointmentData.patientName} (${appointmentData.type})`,
          description: `Consulta nutricional com ${appointmentData.patientName}.\nModalidade: ${appointmentData.modality || 'Presencial'}\nLink Google Meet: ${meetLink || 'N/A'}\nGoogle Chat: ${chatLink || 'N/A'}\nObservações: ${appointmentData.notes || 'Nenhuma'}\nNutriCore Pro - Prontuário Clínico.`,
          location: appointmentData.modality === 'online_meet' ? (meetLink || 'Google Meet') : clinicConfig.address,
          start: { dateTime: startDate.toISOString() },
          end: { dateTime: endDate.toISOString() },
        });
        googleEventId = created.id;
        googleEventLink = created.htmlLink;
      } catch (err) {
        console.warn('Could not sync created appointment to Google Calendar', err);
      }
    }

    const newAppointment: Appointment = {
      ...appointmentData,
      id: `app-${Date.now()}`,
      nutritionistId: appointmentData.nutritionistId || currentNutritionistId,
      meetLink,
      googleChatSpaceUrl: chatLink,
      googleEventId,
      googleEventLink,
    };
    setAppointments((prev) => [...prev, newAppointment]);
    return newAppointment;
  };

  const updateAppointment = async (
    id: string,
    updates: Partial<Appointment>,
    syncToGoogle: boolean = true
  ): Promise<void> => {
    const existing = appointments.find((a) => a.id === id);
    if (!existing) return;

    const merged: Appointment = { ...existing, ...updates };

    if (syncToGoogle && googleAuth.accessToken && merged.googleEventId) {
      try {
        const duration = merged.durationMinutes || 60;
        const [hour, min] = merged.time.split(':').map((v) => parseInt(v) || 0);
        const startDate = new Date(`${merged.date}T${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}:00`);
        const endDate = new Date(startDate.getTime() + duration * 60 * 1000);

        await GoogleCalendarService.updateEvent(googleAuth.accessToken, merged.googleEventId, {
          summary: `Nutrição: ${merged.patientName} (${merged.type}) - ${merged.status}`,
          description: `Consulta com ${merged.patientName}.\nStatus: ${merged.status}\nModalidade: ${merged.modality || 'Presencial'}\nGoogle Meet: ${merged.meetLink || 'N/A'}\nNutriCore Pro.`,
          location: merged.modality === 'online_meet' ? (merged.meetLink || 'Google Meet') : clinicConfig.address,
          start: { dateTime: startDate.toISOString() },
          end: { dateTime: endDate.toISOString() },
        });
      } catch (err) {
        console.warn('Could not sync updated appointment to Google Calendar', err);
      }
    }

    setAppointments((prev) => prev.map((a) => (a.id === id ? merged : a)));
  };

  const updateAppointmentStatus = async (
    id: string,
    status: Appointment['status'],
    syncToGoogle: boolean = true
  ): Promise<void> => {
    await updateAppointment(id, { status }, syncToGoogle);
  };

  const deleteAppointment = async (id: string, syncToGoogle: boolean = true): Promise<void> => {
    const existing = appointments.find((a) => a.id === id);
    if (existing?.googleEventId && syncToGoogle && googleAuth.accessToken) {
      try {
        await GoogleCalendarService.deleteEvent(googleAuth.accessToken, existing.googleEventId);
      } catch (err) {
        console.warn('Could not delete event from Google Calendar', err);
      }
    }
    setAppointments((prev) => prev.filter((a) => a.id !== id));
  };

  // Google Calendar Integration
  const setGoogleClientId = (id: string) => {
    setGoogleClientIdState(id);
    localStorage.setItem('nutricore_google_client_id', id);
  };

  const connectGoogleAccount = async (customClientId?: string) => {
    const cid = customClientId || googleClientId;
    if (customClientId) {
      setGoogleClientId(customClientId);
    }
    try {
      const { token, profile } = await GoogleCalendarService.requestGoogleAuth(cid);
      setGoogleAuth({
        isConnected: true,
        accessToken: token,
        userEmail: profile?.email || null,
        userName: profile?.name || null,
        userAvatar: profile?.picture || null,
        lastSyncedAt: new Date().toISOString(),
      });
      localStorage.setItem('nutricore_last_calendar_sync', new Date().toISOString());
    } catch (err: any) {
      const isPopupClosed =
        err?.type === 'popup_closed' ||
        err?.isPopupClosed ||
        err?.message?.includes('fechada') ||
        err?.message?.includes('Popup window closed');

      // Do not log user cancellation / closed popup as a console error
      if (!isPopupClosed) {
        console.warn('Google Calendar Auth warning:', err?.message || err);
      }
      throw err;
    }
  };

  const connectDemoGoogleAccount = () => {
    const demoToken = `demo_gcal_${Date.now()}`;
    const demoProfile = {
      id: 'demo_user_dr',
      name: 'Dra. Mariana Rios (Nutricionista)',
      email: 'mariana.nutri@clinica.com.br',
      picture: 'https://images.unsplash.com/photo-1594824813511-49fa53147d32?w=150&auto=format&fit=crop&q=80',
    };
    GoogleCalendarService.saveToken(demoToken);
    GoogleCalendarService.saveProfile(demoProfile);
    const syncTime = new Date().toISOString();
    setGoogleAuth({
      isConnected: true,
      accessToken: demoToken,
      userEmail: demoProfile.email,
      userName: demoProfile.name,
      userAvatar: demoProfile.picture,
      lastSyncedAt: syncTime,
    });
    localStorage.setItem('nutricore_last_calendar_sync', syncTime);
  };

  const disconnectGoogleAccount = () => {
    GoogleCalendarService.clearStoredAuth();
    setGoogleAuth({
      isConnected: false,
      accessToken: null,
      userEmail: null,
      userName: null,
      userAvatar: null,
      lastSyncedAt: null,
    });
  };

  const syncAppointmentsWithGoogle = async (): Promise<{ imported: number; exported: number }> => {
    if (!googleAuth.accessToken) {
      throw new Error('Google Calendar não está conectado.');
    }

    setIsSyncingCalendar(true);
    let importedCount = 0;
    let exportedCount = 0;

    try {
      for (const app of appointments) {
        if (!app.googleEventId) {
          try {
            const duration = app.durationMinutes || 60;
            const [hour, min] = app.time.split(':').map((v) => parseInt(v) || 0);
            const startDate = new Date(`${app.date}T${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}:00`);
            const endDate = new Date(startDate.getTime() + duration * 60 * 1000);

            const created = await GoogleCalendarService.createEvent(googleAuth.accessToken, {
              summary: `Nutrição: ${app.patientName} (${app.type})`,
              description: `Consulta nutricional com ${app.patientName}.\nObservações: ${app.notes || 'Nenhuma'}\nNutriCore Pro.`,
              location: app.modality === 'online_meet' ? (app.meetLink || 'Google Meet') : clinicConfig.address,
              start: { dateTime: startDate.toISOString() },
              end: { dateTime: endDate.toISOString() },
            });

            setAppointments((prev) =>
              prev.map((a) => (a.id === app.id ? { ...a, googleEventId: created.id, googleEventLink: created.htmlLink } : a))
            );
            exportedCount++;
          } catch (e) {
            console.warn('Failed exporting single appointment:', e);
          }
        }
      }

      const syncTime = new Date().toISOString();
      setGoogleAuth((prev) => ({ ...prev, lastSyncedAt: syncTime }));
      localStorage.setItem('nutricore_last_calendar_sync', syncTime);

      return { imported: importedCount, exported: exportedCount };
    } finally {
      setIsSyncingCalendar(false);
    }
  };

  // Backup & Restore
  // Online Payments & Billing Methods
  const patientPayments = (patientId?: string): PaymentTransaction[] => {
    const targetId = patientId || currentPatientTargetId;
    return payments.filter((p) => p.patientId === targetId);
  };

  const openPaymentModal = (options?: {
    patientId?: string;
    patientName?: string;
    amount?: number;
    title?: string;
    description?: string;
    appointmentId?: string;
    dietPlanId?: string;
  }) => {
    const targetPatient = options?.patientId
      ? patients.find((p) => p.id === options.patientId)
      : selectedPatientForDetail || activePatient;

    setActivePaymentModal({
      isOpen: true,
      patientId: targetPatient?.id,
      patientName: targetPatient?.name,
      amount: options?.amount || 250,
      title: options?.title || 'Consulta Nutricional + Plano Alimentar',
      description: options?.description || 'Atendimento nutricional completo com plano alimentar e acompanhamento.',
      appointmentId: options?.appointmentId,
      dietPlanId: options?.dietPlanId,
    });
  };

  const closePaymentModal = () => {
    setActivePaymentModal(null);
  };

  const createPixCharge = async (data: {
    patientId: string;
    patientName?: string;
    amount: number;
    title?: string;
    description?: string;
    appointmentId?: string;
    dietPlanId?: string;
  }): Promise<PaymentTransaction> => {
    const targetPatient = patients.find((p) => p.id === data.patientId);

    try {
      const response = await fetch('/api/payments/create-pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: data.patientId,
          patientName: data.patientName || targetPatient?.name || 'Paciente',
          patientEmail: targetPatient?.email,
          patientPhone: targetPatient?.phone,
          amount: data.amount,
          title: data.title,
          description: data.description,
          appointmentId: data.appointmentId,
          dietPlanId: data.dietPlanId,
        }),
      });

      if (response.ok) {
        const json = await response.json();
        const tx: PaymentTransaction = json.transaction;
        setPayments((prev) => [tx, ...prev.filter((p) => p.id !== tx.id)]);
        return tx;
      }
    } catch (err) {
      console.warn('Backend create-pix failed, falling back to local generation:', err);
    }

    // Local Fallback
    const txId = `PIX-${Date.now()}`;
    const cleanAmount = Number(data.amount).toFixed(2);
    const activePixKey = clinicConfig?.pixConfig?.key || MASTER_ADMIN_EMAIL;
    const activeReceiver = (clinicConfig?.pixConfig?.receiverName || 'Victor L. Araújo').toUpperCase().slice(0, 25);
    const activeCity = (clinicConfig?.pixConfig?.city || 'SAO PAULO').toUpperCase().slice(0, 15);
    const brCode = `00020126580014br.gov.bcb.pix01${activePixKey.length}${activePixKey}520400005303986540${cleanAmount.length}${cleanAmount}5802BR59${activeReceiver.length}${activeReceiver}60${activeCity.length}${activeCity}62070503***6304`;
    const qrCodeSvgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(brCode)}&color=064e3b&bgcolor=f0fdf4&qzone=2`;

    const fallbackTx: PaymentTransaction = {
      id: txId,
      patientId: data.patientId,
      patientName: data.patientName || targetPatient?.name || 'Paciente',
      patientEmail: targetPatient?.email,
      patientPhone: targetPatient?.phone,
      amount: data.amount,
      currency: 'BRL',
      title: data.title || 'Consulta Nutricional',
      description: data.description || 'Pagamento via PIX instantâneo',
      method: 'pix',
      status: 'pending',
      pixQrCodeUrl: qrCodeSvgUrl,
      pixCopyPasteCode: brCode,
      pixExpirationMinutes: 30,
      createdAt: new Date().toISOString(),
      paymentGateway: 'pix_instant',
    };

    setPayments((prev) => [fallbackTx, ...prev]);
    return fallbackTx;
  };

  const processCardPayment = async (data: {
    patientId: string;
    patientName?: string;
    amount: number;
    title?: string;
    description?: string;
    cardHolder: string;
    cardNumber: string;
    installments?: number;
    appointmentId?: string;
    dietPlanId?: string;
  }): Promise<PaymentTransaction> => {
    const targetPatient = patients.find((p) => p.id === data.patientId);

    try {
      const response = await fetch('/api/payments/create-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: data.patientId,
          patientName: data.patientName || targetPatient?.name || 'Paciente',
          patientEmail: targetPatient?.email,
          patientPhone: targetPatient?.phone,
          amount: data.amount,
          title: data.title,
          description: data.description,
          cardHolder: data.cardHolder,
          cardNumber: data.cardNumber,
          installments: data.installments || 1,
          appointmentId: data.appointmentId,
          dietPlanId: data.dietPlanId,
        }),
      });

      if (response.ok) {
        const json = await response.json();
        const tx: PaymentTransaction = json.transaction;
        setPayments((prev) => [tx, ...prev.filter((p) => p.id !== tx.id)]);
        return tx;
      }
    } catch (err) {
      console.warn('Backend create-card failed, falling back to local generation:', err);
    }

    const cleanCard = (data.cardNumber || '').replace(/\D/g, '');
    const last4 = cleanCard.length >= 4 ? cleanCard.slice(-4) : '4242';
    const txId = `CARD-${Date.now()}`;
    const receiptNum = `REC-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const fallbackCardTx: PaymentTransaction = {
      id: txId,
      patientId: data.patientId,
      patientName: data.patientName || targetPatient?.name || 'Paciente',
      amount: data.amount,
      currency: 'BRL',
      title: data.title || 'Consulta Nutricional',
      description: data.description || `Cartão de Crédito (${data.installments || 1}x)`,
      method: 'credit_card',
      status: 'completed',
      installments: data.installments || 1,
      cardLast4: last4,
      cardBrand: 'Mastercard',
      receiptNumber: receiptNum,
      createdAt: new Date().toISOString(),
      paidAt: new Date().toISOString(),
      paymentGateway: 'mercadopago',
    };

    setPayments((prev) => [fallbackCardTx, ...prev]);
    return fallbackCardTx;
  };

  const confirmPixPayment = async (transactionId: string): Promise<PaymentTransaction> => {
    try {
      const res = await fetch(`/api/payments/confirm/${transactionId}`, { method: 'POST' });
      if (res.ok) {
        const json = await res.json();
        const updated = json.transaction;
        setPayments((prev) => prev.map((p) => (p.id === transactionId ? { ...p, ...updated } : p)));
        return updated;
      }
    } catch (err) {
      console.warn('Backend confirm error:', err);
    }

    const now = new Date().toISOString();
    const receipt = `REC-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    let updatedTx: PaymentTransaction | null = null;

    setPayments((prev) =>
      prev.map((p) => {
        if (p.id === transactionId) {
          updatedTx = { ...p, status: 'completed', paidAt: now, receiptNumber: receipt };
          return updatedTx;
        }
        return p;
      })
    );

    return updatedTx || {
      id: transactionId,
      patientId: '',
      patientName: '',
      amount: 0,
      currency: 'BRL',
      title: '',
      description: '',
      method: 'pix',
      status: 'completed',
      paidAt: now,
      receiptNumber: receipt,
      createdAt: now,
      paymentGateway: 'pix_instant',
    };
  };

  const updatePaymentStatus = (transactionId: string, status: PaymentStatus) => {
    setPayments((prev) =>
      prev.map((p) =>
        p.id === transactionId
          ? {
              ...p,
              status,
              paidAt: status === 'completed' ? new Date().toISOString() : p.paidAt,
              receiptNumber:
                status === 'completed' && !p.receiptNumber
                  ? `REC-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`
                  : p.receiptNumber,
            }
          : p
      )
    );
  };

  const deletePayment = (transactionId: string) => {
    setPayments((prev) => prev.filter((p) => p.id !== transactionId));
  };

  const addPayment = (paymentData: Omit<PaymentTransaction, 'id' | 'createdAt'>): PaymentTransaction => {
    const newPayment: PaymentTransaction = {
      ...paymentData,
      id: `pay-${Date.now()}`,
      createdAt: new Date().toISOString(),
      currency: 'BRL',
      paymentGateway: paymentData.paymentGateway || 'pix_instant',
      status: paymentData.status || 'pending',
    };
    setPayments((prev) => [newPayment, ...prev]);
    return newPayment;
  };

  // Program Templates CRUD
  const addProgramTemplate = (templateData: Omit<NutritionProgramTemplate, 'id' | 'createdAt'>): NutritionProgramTemplate => {
    const newTemplate: NutritionProgramTemplate = {
      ...templateData,
      id: `prog-tpl-${Date.now()}`,
      createdAt: todayStr,
    };
    setProgramTemplates((prev) => [newTemplate, ...prev]);
    return newTemplate;
  };

  const updateProgramTemplate = (id: string, updates: Partial<NutritionProgramTemplate>) => {
    setProgramTemplates((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  const deleteProgramTemplate = (id: string) => {
    setProgramTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  // Patient Program Enrollment & Sessions
  const enrollPatientInProgram = (data: {
    patientId: string;
    programTemplateId?: string;
    title: string;
    description?: string;
    startDate: string;
    durationMonths: number;
    totalConsultations: number;
    totalValue: number;
    paymentStatus: 'pago' | 'pendente' | 'parcial' | 'cortesia';
    paymentMethod: any;
    installments?: number;
    clinicalObjectives?: string;
    notes?: string;
  }): PatientProgramEnrollment => {
    const targetPatient = patients.find((p) => p.id === data.patientId);
    const start = new Date(data.startDate);
    const end = new Date(start);
    end.setMonth(end.getMonth() + (data.durationMonths || 3));
    const endDateStr = end.toISOString().split('T')[0];

    const enrollmentId = `enr-${Date.now()}`;
    const newEnrollment: PatientProgramEnrollment = {
      id: enrollmentId,
      patientId: data.patientId,
      patientName: targetPatient?.name || 'Paciente',
      programTemplateId: data.programTemplateId,
      title: data.title,
      description: data.description,
      startDate: data.startDate,
      endDate: endDateStr,
      durationMonths: data.durationMonths,
      totalConsultations: data.totalConsultations,
      completedConsultations: 0,
      status: 'ativo',
      internalFinance: {
        totalValue: data.totalValue,
        paymentStatus: data.paymentStatus,
        paymentMethod: data.paymentMethod,
        paidAmount: data.paymentStatus === 'pago' ? data.totalValue : 0,
        installments: data.installments || 1,
        paymentDate: todayStr,
        paymentNotes: `Programa de acompanhamento registrado internamente (${data.installments || 1}x ${data.paymentMethod}).`
      },
      sessions: [],
      clinicalObjectives: data.clinicalObjectives,
      notes: data.notes,
      createdAt: todayStr,
      updatedAt: todayStr,
    };

    setPatientProgramEnrollments((prev) => [newEnrollment, ...prev]);

    // Also register an internal financial transaction for bookkeeping
    const financialTx: PaymentTransaction = {
      id: `TX-PROG-${Date.now()}`,
      patientId: data.patientId,
      patientName: targetPatient?.name || 'Paciente',
      patientEmail: targetPatient?.email,
      patientPhone: targetPatient?.phone,
      programEnrollmentId: enrollmentId,
      entryType: 'programa_acompanhamento',
      amount: data.totalValue,
      currency: 'BRL',
      title: `Programa: ${data.title}`,
      description: `Acompanhamento contínuo de ${data.durationMonths} meses (${data.totalConsultations} consultas).`,
      method: data.paymentMethod || 'pix',
      status: data.paymentStatus === 'pago' ? 'completed' : data.paymentStatus === 'cortesia' ? 'cortesia' : 'pending',
      installments: data.installments,
      receiptNumber: `REC-PROG-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
      createdAt: new Date().toISOString(),
      paidAt: data.paymentStatus === 'pago' ? new Date().toISOString() : undefined,
      paymentGateway: 'manual_internal',
    };
    setPayments((prev) => [financialTx, ...prev]);

    return newEnrollment;
  };

  const updatePatientEnrollment = (id: string, updates: Partial<PatientProgramEnrollment>) => {
    setPatientProgramEnrollments((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates, updatedAt: todayStr } : e))
    );
  };

  const deletePatientEnrollment = (id: string) => {
    setPatientProgramEnrollments((prev) => prev.filter((e) => e.id !== id));
  };

  const registerProgramSession = (
    enrollmentId: string,
    sessionData: { date: string; notes?: string; appointmentId?: string }
  ) => {
    setPatientProgramEnrollments((prev) =>
      prev.map((enrollment) => {
        if (enrollment.id !== enrollmentId) return enrollment;
        const newSessionNumber = enrollment.sessions.length + 1;
        const newSession: ProgramConsultationSession = {
          id: `sess-${Date.now()}`,
          sessionNumber: newSessionNumber,
          date: sessionData.date,
          status: 'realizada',
          appointmentId: sessionData.appointmentId,
          notes: sessionData.notes,
          registeredAt: new Date().toISOString(),
        };
        const updatedSessions = [...enrollment.sessions, newSession];
        const updatedCompleted = enrollment.completedConsultations + 1;
        const isFinished = updatedCompleted >= enrollment.totalConsultations;

        return {
          ...enrollment,
          sessions: updatedSessions,
          completedConsultations: updatedCompleted,
          status: isFinished ? 'concluido' : enrollment.status,
          updatedAt: todayStr,
        };
      })
    );
  };

  const recordConsultationPayment = (data: {
    patientId: string;
    appointmentId?: string;
    programEnrollmentId?: string;
    amount: number;
    title: string;
    paymentMethod: any;
    status: 'pago' | 'pendente' | 'cortesia';
    notes?: string;
    entryType?: 'consulta_avulsa' | 'programa_acompanhamento';
  }): PaymentTransaction => {
    const targetPatient = patients.find((p) => p.id === data.patientId);
    const newTx: PaymentTransaction = {
      id: `TX-INT-${Date.now()}`,
      patientId: data.patientId,
      patientName: targetPatient?.name || 'Paciente',
      patientEmail: targetPatient?.email,
      patientPhone: targetPatient?.phone,
      appointmentId: data.appointmentId,
      programEnrollmentId: data.programEnrollmentId,
      entryType: data.entryType || 'consulta_avulsa',
      amount: data.amount,
      currency: 'BRL',
      title: data.title,
      description: data.notes || 'Lançamento financeiro interno registrado pelo nutricionista.',
      method: data.paymentMethod || 'pix',
      status: data.status === 'pago' ? 'completed' : data.status === 'cortesia' ? 'cortesia' : 'pending',
      receiptNumber: `REC-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
      createdAt: new Date().toISOString(),
      paidAt: data.status === 'pago' ? new Date().toISOString() : undefined,
      paymentGateway: 'manual_internal',
      notes: data.notes,
    };

    setPayments((prev) => [newTx, ...prev]);

    // If linked to an appointment, update appointment's internal fields
    if (data.appointmentId) {
      setAppointments((prev) =>
        prev.map((app) =>
          app.id === data.appointmentId
            ? {
                ...app,
                consultationFee: data.amount,
                internalPaymentStatus: data.status,
                internalPaymentMethod: data.paymentMethod,
              }
            : app
        )
      );
    }

    return newTx;
  };

  // Nutritionist Task Reminders & Administrative Deadlines Handlers
  const addTask = (taskData: Omit<NutritionistTask, 'id' | 'createdAt' | 'isCompleted'>): NutritionistTask => {
    const newTask: NutritionistTask = {
      ...taskData,
      id: `task-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      isCompleted: false,
    };
    setTasks((prev) => [newTask, ...prev]);
    return newTask;
  };

  const updateTask = (id: string, updates: Partial<NutritionistTask>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  const toggleTaskCompleted = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextCompleted = !t.isCompleted;
          return {
            ...t,
            isCompleted: nextCompleted,
            completedAt: nextCompleted ? new Date().toISOString() : undefined,
          };
        }
        return t;
      })
    );
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const clinicPixConfig: ClinicPixConfig = clinicConfig.pixConfig || DEFAULT_CLINIC_CONFIG.pixConfig!;

  const updateClinicPixConfig = (config: Partial<ClinicPixConfig>) => {
    setClinicConfig((prev) => ({
      ...prev,
      pixConfig: {
        ...(prev.pixConfig || DEFAULT_CLINIC_CONFIG.pixConfig!),
        ...config,
      },
    }));
  };

  const exportBackupData = (): string => {
    const backupPkg: BackupDataPackage = {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      system: 'NutriCore Pro - Sistema Clínico de Nutrição & Antropometria',
      clinicConfig,
      nutritionists,
      patients,
      anthropometryRecords,
      dietPlans,
      dietTemplates,
      labExams,
      prescriptions,
      anamnesisMap,
      adherenceRecords,
      appointments,
      foods,
      foodSubstitutionGroups
    };
    return JSON.stringify(backupPkg, null, 2);
  };

  const importBackupData = (jsonString: string): { success: boolean; message: string; counts?: any } => {
    try {
      const data = JSON.parse(jsonString) as Partial<BackupDataPackage>;
      if (!data.patients || !Array.isArray(data.patients)) {
        return { success: false, message: 'Arquivo de backup inválido: lista de pacientes não encontrada.' };
      }

      if (data.clinicConfig) setClinicConfig(data.clinicConfig);
      if (data.nutritionists && Array.isArray(data.nutritionists)) setNutritionists(data.nutritionists);
      if (data.patients) {
        setPatients(data.patients);
        if (data.patients.length > 0) {
          setSelectedPatientForDetail(data.patients[0]);
          setActivePatientId(data.patients[0].id);
        }
      }
      if (data.anthropometryRecords) setAnthropometryRecords(data.anthropometryRecords);
      if (data.dietPlans) setDietPlans(data.dietPlans);
      if (data.dietTemplates) setDietTemplates(data.dietTemplates);
      if (data.foodSubstitutionGroups) setFoodSubstitutionGroups(data.foodSubstitutionGroups);
      if (data.labExams) setLabExams(data.labExams);
      if (data.prescriptions) setPrescriptions(data.prescriptions);
      if (data.foods) setFoods(data.foods);
      if (data.anamnesisMap) setAnamnesisMap(data.anamnesisMap);
      if (data.adherenceRecords) setAdherenceRecords(data.adherenceRecords);
      if (data.appointments) setAppointments(data.appointments);

      return {
        success: true,
        message: 'Backup restaurado com sucesso no sistema!',
        counts: {
          nutritionists: data.nutritionists?.length || 0,
          patients: data.patients.length,
          dietPlans: data.dietPlans?.length || 0,
          dietTemplates: data.dietTemplates?.length || 0,
          substitutionGroups: data.foodSubstitutionGroups?.length || 0,
          anthropometry: data.anthropometryRecords?.length || 0,
          labExams: data.labExams?.length || 0,
          prescriptions: data.prescriptions?.length || 0,
        }
      };
    } catch (err: any) {
      return { success: false, message: `Erro ao processar JSON: ${err?.message || 'Arquivo corrompido'}` };
    }
  };

  // Patient Evolution Photos
  const addEvolutionPhoto = (photoData: Omit<PatientEvolutionPhoto, 'id' | 'createdAt'>): PatientEvolutionPhoto => {
    const newPhoto: PatientEvolutionPhoto = {
      ...photoData,
      id: `photo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    setPatientEvolutionPhotos((prev) => [newPhoto, ...prev]);
    return newPhoto;
  };

  const deleteEvolutionPhoto = (id: string) => {
    setPatientEvolutionPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const getPatientPhotos = (patientId: string) => {
    return patientEvolutionPhotos.filter((p) => p.patientId === patientId);
  };

  // Program Progress Reports & End-of-Program Summaries
  const generateAndSendProgramReport = (
    enrollmentId: string,
    customObservations?: string
  ): ProgramProgressReport => {
    const enrollment = patientProgramEnrollments.find((e) => e.id === enrollmentId);
    if (!enrollment) {
      throw new Error('Matrícula de programa não encontrada.');
    }
    const patient = patients.find((p) => p.id === enrollment.patientId);
    if (!patient) {
      throw new Error('Paciente não encontrado.');
    }

    // Get sorted records for this patient
    const records = anthropometryRecords
      .filter((r) => r.patientId === patient.id)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const firstRecord = records[0];
    const lastRecord = records[records.length - 1];

    const initialWeightKg = firstRecord?.weightKg || patient.weightKg;
    const finalWeightKg = lastRecord?.weightKg || patient.weightKg;
    const deltaWeightKg = Number((finalWeightKg - initialWeightKg).toFixed(1));

    const initialBodyFatPercent = firstRecord?.bodyFatPercent || 22.0;
    const finalBodyFatPercent = lastRecord?.bodyFatPercent || 17.0;
    const deltaBodyFatPercent = Number((finalBodyFatPercent - initialBodyFatPercent).toFixed(1));

    const initialLeanMassKg = firstRecord?.leanMassKg || Number((initialWeightKg * (1 - initialBodyFatPercent / 100)).toFixed(1));
    const finalLeanMassKg = lastRecord?.leanMassKg || Number((finalWeightKg * (1 - finalBodyFatPercent / 100)).toFixed(1));
    const deltaLeanMassKg = Number((finalLeanMassKg - initialLeanMassKg).toFixed(1));

    const initialWaist = firstRecord?.circumferences?.waist;
    const finalWaist = lastRecord?.circumferences?.waist;
    const deltaWaistCm = initialWaist && finalWaist ? Number((finalWaist - initialWaist).toFixed(1)) : undefined;

    // Photos
    const patientPhotos = patientEvolutionPhotos
      .filter((p) => p.patientId === patient.id && p.angle === 'frontal')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const beforePhoto = patientPhotos[0];
    const afterPhoto = patientPhotos.length > 1 ? patientPhotos[patientPhotos.length - 1] : undefined;

    const report: ProgramProgressReport = {
      id: `report-${Date.now()}`,
      patientId: patient.id,
      patientName: patient.name,
      programEnrollmentId: enrollment.id,
      programTitle: enrollment.title,
      generatedDate: new Date().toISOString().split('T')[0],
      period: {
        startDate: enrollment.startDate,
        endDate: enrollment.endDate,
        totalConsultations: enrollment.totalConsultations,
        completedConsultations: enrollment.completedConsultations,
      },
      metricsDelta: {
        initialWeightKg,
        finalWeightKg,
        deltaWeightKg,
        initialBodyFatPercent,
        finalBodyFatPercent,
        deltaBodyFatPercent,
        initialLeanMassKg,
        finalLeanMassKg,
        deltaLeanMassKg,
        initialWaistCm: initialWaist,
        finalWaistCm: finalWaist,
        deltaWaistCm,
      },
      beforePhoto,
      afterPhoto,
      clinicalSummary: customObservations || `Excelente evolução clínica ao longo do ${enrollment.title}. Houve redução de ${Math.abs(deltaWeightKg)} kg e preservação notável de massa magra (${deltaLeanMassKg > 0 ? `+${deltaLeanMassKg} kg` : `${deltaLeanMassKg} kg`}), com adesão exemplar à dieta e hidratação.`,
      lifestyleImprovements: [
        'Consistência nos treinos e gasto energético diário',
        'Adesão acima de 85% às metas de hidratação (3L/dia)',
        'Melhora na disposição geral e qualidade do sono',
        'Substituições conscientes mantendo equilíbrio dos macronutrientes'
      ],
      nextStepsAdvice: 'Recomendada manutenção da fase de estabilização calórica ou início de ciclo de hipertrofia com progressão controlada.',
      nutritionistName: clinicConfig.nutritionistName || 'Dr. Ricardo Silva',
      crn: clinicConfig.crn || 'CRN-3 48.912/SP',
      sentToPatientPortal: true,
      sentAt: new Date().toISOString(),
    };

    setProgramProgressReports((prev) => [report, ...prev]);

    // Mark program as completed
    setPatientProgramEnrollments((prev) =>
      prev.map((e) => (e.id === enrollmentId ? { ...e, status: 'concluido' } : e))
    );

    return report;
  };

  const openReportModal = (report?: ProgramProgressReport, enrollment?: PatientProgramEnrollment) => {
    setActiveReportModal({
      isOpen: true,
      report,
      enrollment,
    });
  };

  const closeReportModal = () => {
    setActiveReportModal(null);
  };

  // Diagnostics
  const openDiagnosticsModal = () => setIsDiagnosticsModalOpen(true);
  const closeDiagnosticsModal = () => setIsDiagnosticsModalOpen(false);

  const runSystemDiagnostics = async (): Promise<SystemDiagnosticReport> => {
    const report = executeSystemDiagnostics({
      patients,
      anthropometryRecords,
      dietPlans,
      programTemplates,
      patientProgramEnrollments,
      tasks,
      photos: patientEvolutionPhotos,
      payments,
      foods,
      superAdminEmail: authUser.email,
    });
    setLatestDiagnosticReport(report);
    return report;
  };

  // Reset Demo Data
  const resetAllData = () => {
    localStorage.clear();
    setClinicConfig(DEFAULT_CLINIC_CONFIG);
    setNutritionists(INITIAL_NUTRITIONISTS);
    setPatients(INITIAL_PATIENTS);
    setSelectedPatientForDetail(INITIAL_PATIENTS[0]);
    setActivePatientId(INITIAL_PATIENTS[0].id);
    setAnthropometryRecords(INITIAL_ANTHROPOMETRY);
    setDietPlans(INITIAL_DIET_PLANS);
    setDietTemplates(INITIAL_DIET_TEMPLATES);
    setFoodSubstitutionGroups(INITIAL_FOOD_SUBSTITUTION_GROUPS);
    setLabExams(INITIAL_LAB_EXAMS);
    setPrescriptions(INITIAL_PRESCRIPTIONS);
    setFoods(TACO_FOOD_DATABASE);
    setAnamnesisMap(INITIAL_ANAMNESIS);
    setAdherenceRecords(INITIAL_ADHERENCE);
    setAppointments(INITIAL_APPOINTMENTS);
    setPayments(INITIAL_PAYMENTS);
    setTasks(INITIAL_NUTRITIONIST_TASKS);
    setPatientEvolutionPhotos(INITIAL_EVOLUTION_PHOTOS);
    setProgramProgressReports([]);
    setLatestDiagnosticReport(null);
    setCurrentNutritionistId('nutri-01');
    setCurrentRole('nutritionist');
  };

  return (
    <NutritionContext.Provider
      value={{
        currentView,
        setCurrentView,
        currentRole,
        setCurrentRole,
        currentNutritionistId,
        setCurrentNutritionistId,
        activeAdminTab,
        setActiveAdminTab,
        activePatientTab,
        setActivePatientTab,
        mobileDeviceFrame,
        setMobileDeviceFrame,
        exportPlanModalOpen,
        isExportPlanModalOpen: exportPlanModalOpen,
        setExportPlanModalOpen,

        // Authentication & Super-Admin (victorlaraujo@gmail.com)
        authUser,
        masterAdminEmail: MASTER_ADMIN_EMAIL,
        isMasterAdmin,
        isSuperAdmin,
        canDeleteAllDatabase: authUser.permissions.canDeleteAllDatabase,
        masterAdminUser: MASTER_ADMIN_USER,
        switchAuthEmail,
        deleteAllNutritionists,
        deleteAllPatients,
        deleteAllDatabase,

        clinicConfig: clinicConfig || DEFAULT_CLINIC_CONFIG,
        setClinicConfig,
        clinicPixConfig,
        updateClinicPixConfig,

        nutritionists,
        currentNutritionist,
        addNutritionist,
        updateNutritionist,
        deleteNutritionist,

        patients,
        filteredPatients,
        activePatientId,
        activePatient,
        setActivePatientId,
        selectedPatientForDetail,
        setSelectedPatientForDetail,
        addPatient,
        updatePatient,
        deletePatient,

        // Patient Modal
        isPatientModalOpen,
        patientModalMode,
        patientToEdit,
        openNewPatientModal,
        openEditPatientModal,
        closePatientModal,

        anthropometryRecords,
        patientAnthropometry,
        addAnthropometryRecord,
        deleteAnthropometryRecord,

        dietPlans,
        activeDietPlan,
        saveDietPlan,
        addMealToPlan,
        updateMeal,
        deleteMeal,
        addItemToMeal,
        removeItemFromMeal,
        updateItemInMeal,

        dietTemplates,
        addDietTemplate,
        updateDietTemplate,
        deleteDietTemplate,
        applyDietTemplate,
        saveCurrentPlanAsTemplate,

        // Food Substitution Groups & Equivalence Rules
        foodSubstitutionGroups,
        addFoodSubstitutionGroup,
        updateFoodSubstitutionGroup,
        deleteFoodSubstitutionGroup,
        applySubstitutionGroupToItem,
        autoLinkSubstitutionGroupsToPlan,

        labExams,
        patientLabExams,
        addLabExam,
        updateLabExam,
        deleteLabExam,

        prescriptions,
        patientPrescriptions,
        addPrescription,
        updatePrescription,
        deletePrescription,

        foods,
        addCustomFood,

        anamnesisMap,
        saveAnamnesis,

        adherenceRecords,
        todayAdherence,
        toggleMealCheck,
        logWater,
        setWaterTotal,
        toggleWorkout,
        toggleMealCompleted,
        logWaterIntake,
        logWorkout,

        appointments,
        addAppointment,
        updateAppointment,
        updateAppointmentStatus,
        deleteAppointment,
        generateGoogleMeetLink,
        generateGoogleChatLink,

        googleAuth,
        isSyncingCalendar,
        googleClientId,
        setGoogleClientId,
        connectGoogleAccount,
        connectDemoGoogleAccount,
        disconnectGoogleAccount,
        syncAppointmentsWithGoogle,

        exportBackupData,
        importBackupData,

        // Online Payments & Billing
        payments,
        patientPayments,
        activePaymentModal,
        openPaymentModal,
        closePaymentModal,
        createPixCharge,
        processCardPayment,
        confirmPixPayment,
        updatePaymentStatus,
        deletePayment,
        addPayment,

        // Programas de Acompanhamento Nutricional
        programTemplates,
        patientProgramEnrollments,
        addProgramTemplate,
        updateProgramTemplate,
        deleteProgramTemplate,
        enrollPatientInProgram,
        updatePatientEnrollment,
        deletePatientEnrollment,
        registerProgramSession,
        recordConsultationPayment,

        // Nutritionist Task Reminders & Administrative Deadlines
        tasks,
        addTask,
        updateTask,
        toggleTaskCompleted,
        // Patient Evolution Photos & Visual Progress
        patientEvolutionPhotos,
        addEvolutionPhoto,
        deleteEvolutionPhoto,
        getPatientPhotos,

        // Program Progress Reports & Patient Notifications
        programProgressReports,
        generateAndSendProgramReport,
        activeReportModal,
        openReportModal,
        closeReportModal,

        // System Diagnostics & Data Integrity
        isDiagnosticsModalOpen,
        openDiagnosticsModal,
        closeDiagnosticsModal,
        runSystemDiagnostics,
        latestDiagnosticReport,

        resetAllData,
      }}
    >
      {children}
    </NutritionContext.Provider>
  );
};

export const useNutrition = () => {
  const context = useContext(NutritionContext);
  if (!context) {
    throw new Error('useNutrition must be used within a NutritionProvider');
  }
  return context;
};
