import { NutritionProgramTemplate, PatientProgramEnrollment } from '../types';

export const INITIAL_PROGRAM_TEMPLATES: NutritionProgramTemplate[] = [
  {
    id: 'prog-tpl-01',
    title: 'Programa Emagrecimento Consciente & Metabólico',
    description: 'Tratamento contínuo focado em perda de gordura sustentável, preservação de massa magra e reeducação metabólica sem efeito sanfona.',
    durationMonths: 3,
    durationDays: 90,
    totalConsultations: 6,
    suggestedFrequency: 'Quinzenal (a cada 15 dias)',
    suggestedPrice: 1200.0,
    targetGoal: 'emagrecimento',
    isActive: true,
    createdAt: '2025-01-15',
    includedFeatures: [
      '6 Consultas clínicas periódicas com nutricionista',
      'Avaliação antropométrica completa (Pollock 7D / Bioimpedância) a cada retorno',
      'Ajustes ilimitados no plano alimentar e metas calóricas',
      'Canal tira-dúvidas contínuo via WhatsApp durante todo o período',
      'Prescrições de suplementação e fitoterápicos termogênicos individualizados',
      'Relatórios gráficos de evolução percentual de gordura e peso'
    ]
  },
  {
    id: 'prog-tpl-02',
    title: 'Programa Hipertrofia & Rendimento Esportivo',
    description: 'Acompanhamento nutricional intensivo para ganho de massa muscular, periodização de macronutrientes conforme treinos e alta performance.',
    durationMonths: 6,
    durationDays: 180,
    totalConsultations: 12,
    suggestedFrequency: 'Quinzenal / Mensal com periodização',
    suggestedPrice: 2100.0,
    targetGoal: 'hipertrofia',
    isActive: true,
    createdAt: '2025-01-15',
    includedFeatures: [
      '12 Consultas clínicas com periodização nutricional alinhada ao mesociclo de musculação',
      'Monitoramento milimétrico de dobras cutâneas e taxa de ganho de massa livre de gordura',
      'Estratégias de timing de nutrientes (pré-treino, intra-treino e pós-treino)',
      'Prescrição de creatina, proteínas isoladas e ergogênicos seguros',
      'Acesso completo ao aplicativo do paciente com diário de adesão e água'
    ]
  },
  {
    id: 'prog-tpl-03',
    title: 'Reeducação Alimentar & Longevidade Saudável',
    description: 'Acompanhamento contínuo voltado para pacientes que buscam melhorar marcadores de saúde, colesterol, glicemia e qualidade de vida duradoura.',
    durationMonths: 4,
    durationDays: 120,
    totalConsultations: 4,
    suggestedFrequency: 'Mensal (a cada 30 dias)',
    suggestedPrice: 850.0,
    targetGoal: 'saude_geral',
    isActive: true,
    createdAt: '2025-02-01',
    includedFeatures: [
      '4 Consultas mensais com análise detalhada de hábitos de rotina',
      'Rastreamento e interpretação de exames laboratoriais (perfil lipídico e glicêmico)',
      'Elaboração de lista de compras prática e tabela de equivalências personalizada',
      'Orientações comportamentais para fins de semana e eventos sociais',
      'Suporte para adaptação familiar e receitas práticas'
    ]
  },
  {
    id: 'prog-tpl-04',
    title: 'Saúde da Mulher & Equilíbrio Hormonal (SOP / Climatério)',
    description: 'Tratamento nutricional específico para modulação da inflamação, saúde menstrual, sensibilidade à insulina e suporte nutricional feminino.',
    durationMonths: 3,
    durationDays: 90,
    totalConsultations: 6,
    suggestedFrequency: 'Quinzenal (a cada 15 dias)',
    suggestedPrice: 1350.0,
    targetGoal: 'saude_geral',
    isActive: true,
    createdAt: '2025-03-01',
    includedFeatures: [
      '6 Consultas focadas em modulação dietética de baixo índice glicêmico',
      'Prescrição de inositol, ômega-3, coenzima Q10 e fitoterápicos adaptógenos',
      'Acompanhamento de sintomas de TPM, retenção hídrica e disposição',
      'Protocolos de saúde intestinal e modulação da microbiota',
      'Suporte humanizado e ajustes de plano a cada fase do ciclo'
    ]
  }
];

export const INITIAL_PATIENT_ENROLLMENTS: PatientProgramEnrollment[] = [
  {
    id: 'enr-pat-01',
    patientId: 'pat-01',
    patientName: 'Lucas Albuquerque Silva',
    programTemplateId: 'prog-tpl-02',
    title: 'Programa Hipertrofia & Rendimento Esportivo (6 Meses)',
    description: 'Acompanhamento intensivo para ganho de massa magra de 81kg para 85kg e redução de gordura.',
    startDate: '2026-06-01',
    endDate: '2026-11-30',
    durationMonths: 6,
    totalConsultations: 12,
    completedConsultations: 3,
    status: 'ativo',
    internalFinance: {
      totalValue: 2100.0,
      paymentStatus: 'pago',
      paymentMethod: 'pix',
      paidAmount: 2100.0,
      installments: 1,
      paymentDate: '2026-06-01',
      paymentNotes: 'Valor do programa integral recebido via Pix pelo consultório.'
    },
    sessions: [
      {
        id: 'sess-01-pat01',
        sessionNumber: 1,
        date: '2026-06-01',
        status: 'realizada',
        appointmentId: 'app-legacy-01',
        notes: 'Consulta inaugural do programa. Estabelecido plano de 3.200 kcal e suplementação.',
        registeredAt: '2026-06-01T10:00:00Z'
      },
      {
        id: 'sess-02-pat01',
        sessionNumber: 2,
        date: '2026-06-20',
        status: 'realizada',
        notes: 'Avaliação de 20 dias. Ganho de 1.1kg com manutenção da dobra subescapular.',
        registeredAt: '2026-06-20T10:30:00Z'
      },
      {
        id: 'sess-03-pat01',
        sessionNumber: 3,
        date: '2026-07-15',
        status: 'realizada',
        notes: 'Ajuste calórico para 3.400 kcal. Inclusão de creatina 5g e beta-alanina.',
        registeredAt: '2026-07-15T11:00:00Z'
      },
      {
        id: 'sess-04-pat01',
        sessionNumber: 4,
        date: '2026-09-15',
        status: 'agendada',
        notes: 'Reavaliação antropométrica e checagem de exames de sangue.'
      }
    ],
    clinicalObjectives: 'Ganho limpo de 4kg de massa muscular com preservação do percentual de gordura abaixo de 14%.',
    notes: 'Paciente muito disciplinado com treinos e dieta.',
    createdAt: '2026-06-01',
    updatedAt: '2026-07-15'
  },
  {
    id: 'enr-pat-02',
    patientId: 'pat-02',
    patientName: 'Camila Rodrigues',
    programTemplateId: 'prog-tpl-04',
    title: 'Saúde da Mulher & Equilíbrio Hormonal (3 Meses)',
    description: 'Tratamento para controle de sintomas de SOP, melhora do perfil lipídico e regulação hormonal.',
    startDate: '2026-07-10',
    endDate: '2026-10-10',
    durationMonths: 3,
    totalConsultations: 6,
    completedConsultations: 2,
    status: 'ativo',
    internalFinance: {
      totalValue: 1350.0,
      paymentStatus: 'pago',
      paymentMethod: 'cartao_credito',
      paidAmount: 1350.0,
      installments: 3,
      paymentDate: '2026-07-10',
      paymentNotes: 'Parcelado em 3x no cartão na maquininha física da clínica.'
    },
    sessions: [
      {
        id: 'sess-01-pat02',
        sessionNumber: 1,
        date: '2026-07-10',
        status: 'realizada',
        notes: 'Consulta inaugural do programa de saúde feminina. Prescrito myo-inositol e plano anti-inflamatório.',
        registeredAt: '2026-07-10T14:00:00Z'
      },
      {
        id: 'sess-02-pat02',
        sessionNumber: 2,
        date: '2026-08-05',
        status: 'realizada',
        notes: 'Retorno de 30 dias. Redução acentuada de inchaço e melhora na regularidade intestinal.',
        registeredAt: '2026-08-05T15:00:00Z'
      },
      {
        id: 'sess-03-pat02',
        sessionNumber: 3,
        date: '2026-09-20',
        status: 'agendada',
        appointmentId: 'app-02',
        notes: 'Medição de circunferências e readequação de suplementos.'
      }
    ],
    clinicalObjectives: 'Melhora da sensibilidade à insulina, controle do perfil androgênico e redução de medidas abdominais.',
    createdAt: '2026-07-10',
    updatedAt: '2026-08-05'
  }
];
