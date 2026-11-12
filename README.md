# NutriCore Pro

Sistema de gestão nutricional com área profissional e portal do paciente.

## Funcionalidades

- Cadastro de pacientes, anamnese, exames e acompanhamento de evolução.
- Cálculo de TMB e VET e avaliação antropométrica por sete dobras de Pollock.
- Planejamento alimentar com base de alimentos, grupos de substituição, listas de compras e exportação de planos em PDF.
- Portal do paciente e recurso opcional de análise com Gemini.

## Executar localmente

Node.js e npm.

Use [`.env.example`](.env.example) para configurar `GEMINI_API_KEY` se for usar o recurso de IA. Para conectar um ambiente Firebase próprio, ajuste `firebase-applet-config.json` e confira as [regras do Firestore](firestore.rules).

Na raiz do projeto, execute:

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`. Abra a área profissional para cadastrar um paciente, registrar avaliações e preparar um plano alimentar.

## Comandos

- `npm run lint` — Verifica os tipos do TypeScript.
- `npm run build` — Gera a versão de distribuição.
- `npm run start` — Inicia o servidor da aplicação.

## Arquivos de referência

- [Cálculos nutricionais](src/utils/nutritionCalculations.ts)
- [Planejador alimentar](src/components/admin/DietPlanner.tsx)
- [Portal do paciente](src/components/patient/PatientPortal.tsx)
