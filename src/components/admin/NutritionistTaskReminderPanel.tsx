import React, { useState, useMemo } from 'react';
import { useNutrition } from '../../context/NutritionContext';
import { NutritionistTask, TaskCategory, TaskPriority } from '../../types';
import {
  Bell,
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
  Plus,
  Filter,
  User,
  ArrowRight,
  Trash2,
  Edit2,
  X,
  Sparkles,
  Check,
  CalendarDays,
  FileText,
  Activity,
  Utensils,
  Briefcase,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';

interface NutritionistTaskReminderPanelProps {
  onSelectPatient?: (patientId: string) => void;
}

export const NutritionistTaskReminderPanel: React.FC<NutritionistTaskReminderPanelProps> = ({
  onSelectPatient,
}) => {
  const {
    tasks,
    addTask,
    updateTask,
    toggleTaskCompleted,
    deleteTask,
    patients,
    setSelectedPatientForDetail,
    setActivePatientId,
    setActiveAdminTab,
    setActivePatientTab,
  } = useNutrition();

  // Filters state
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'urgent_today' | 'completed'>('pending');
  const [categoryFilter, setCategoryFilter] = useState<'all' | TaskCategory>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | TaskPriority>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<NutritionistTask | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState<TaskCategory>('follow_up');
  const [formPriority, setFormPriority] = useState<TaskPriority>('media');
  const [formDueDate, setFormDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [formDueTime, setFormDueTime] = useState('10:00');
  const [formPatientId, setFormPatientId] = useState<string>('');

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Open modal for create
  const handleOpenCreateModal = (preset?: Partial<NutritionistTask>) => {
    setEditingTask(null);
    setFormTitle(preset?.title || '');
    setFormDescription(preset?.description || '');
    setFormCategory(preset?.category || 'follow_up');
    setFormPriority(preset?.priority || 'media');
    setFormDueDate(preset?.dueDate || todayStr);
    setFormDueTime(preset?.dueTime || '10:00');
    setFormPatientId(preset?.patientId || '');
    setIsModalOpen(true);
  };

  // Open modal for edit
  const handleOpenEditModal = (task: NutritionistTask) => {
    setEditingTask(task);
    setFormTitle(task.title);
    setFormDescription(task.description || '');
    setFormCategory(task.category);
    setFormPriority(task.priority);
    setFormDueDate(task.dueDate);
    setFormDueTime(task.dueTime || '10:00');
    setFormPatientId(task.patientId || '');
    setIsModalOpen(true);
  };

  // Handle Save
  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const patientObj = patients.find((p) => p.id === formPatientId);
    const patientName = patientObj ? patientObj.name : undefined;

    if (editingTask) {
      updateTask(editingTask.id, {
        title: formTitle.trim(),
        description: formDescription.trim(),
        category: formCategory,
        priority: formPriority,
        dueDate: formDueDate,
        dueTime: formDueTime,
        patientId: formPatientId || undefined,
        patientName,
      });
    } else {
      addTask({
        title: formTitle.trim(),
        description: formDescription.trim(),
        category: formCategory,
        priority: formPriority,
        dueDate: formDueDate,
        dueTime: formDueTime,
        patientId: formPatientId || undefined,
        patientName,
      });
    }

    setIsModalOpen(false);
  };

  // Navigate to Patient
  const handleNavigateToPatient = (patId: string) => {
    if (onSelectPatient) {
      onSelectPatient(patId);
      return;
    }
    const pat = patients.find((p) => p.id === patId);
    if (pat) {
      setSelectedPatientForDetail(pat);
      setActivePatientId(pat.id);
      setActiveAdminTab('patients');
      setActivePatientTab('overview');
    }
  };

  // Metrics
  const pendingTasks = useMemo(() => tasks.filter((t) => !t.isCompleted), [tasks]);
  const completedTasks = useMemo(() => tasks.filter((t) => t.isCompleted), [tasks]);

  const overdueTasks = useMemo(() => {
    return pendingTasks.filter((t) => t.dueDate < todayStr);
  }, [pendingTasks, todayStr]);

  const dueTodayTasks = useMemo(() => {
    return pendingTasks.filter((t) => t.dueDate === todayStr);
  }, [pendingTasks, todayStr]);

  const urgentTasksCount = overdueTasks.length + dueTodayTasks.length;

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Status filter
      if (statusFilter === 'pending' && task.isCompleted) return false;
      if (statusFilter === 'completed' && !task.isCompleted) return false;
      if (statusFilter === 'urgent_today' && (task.isCompleted || task.dueDate > todayStr)) return false;

      // Category filter
      if (categoryFilter !== 'all' && task.category !== categoryFilter) return false;

      // Priority filter
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(term);
        const matchesDesc = task.description?.toLowerCase().includes(term);
        const matchesPatient = task.patientName?.toLowerCase().includes(term);
        if (!matchesTitle && !matchesDesc && !matchesPatient) return false;
      }

      return true;
    }).sort((a, b) => {
      // Completed at bottom
      if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
      // Sort by dueDate ascending (overdue first)
      if (a.dueDate !== b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      // High priority first
      const priorityWeight: Record<TaskPriority, number> = { alta: 3, media: 2, baixa: 1 };
      return priorityWeight[b.priority] - priorityWeight[a.priority];
    });
  }, [tasks, statusFilter, categoryFilter, priorityFilter, searchTerm, todayStr]);

  // Helpers for category styling
  const getCategoryMeta = (cat: TaskCategory) => {
    switch (cat) {
      case 'follow_up':
        return {
          label: 'Follow-up de Paciente',
          icon: Clock,
          badgeColor: 'bg-blue-50 text-blue-700 border-blue-200/80',
        };
      case 'administrative':
        return {
          label: 'Prazo Administrativo',
          icon: Briefcase,
          badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
        };
      case 'plan_review':
        return {
          label: 'Revisão de Plano',
          icon: Utensils,
          badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
        };
      case 'exam_check':
        return {
          label: 'Checagem de Exames',
          icon: Activity,
          badgeColor: 'bg-purple-50 text-purple-700 border-purple-200/80',
        };
      case 'custom':
      default:
        return {
          label: 'Lembrete Geral',
          icon: FileText,
          badgeColor: 'bg-amber-50 text-amber-700 border-amber-200/80',
        };
    }
  };

  const getPriorityMeta = (pri: TaskPriority) => {
    switch (pri) {
      case 'alta':
        return {
          label: 'Prioridade Alta',
          dotColor: 'bg-rose-500',
          textColor: 'text-rose-700',
          badgeBg: 'bg-rose-50 border-rose-200',
        };
      case 'media':
        return {
          label: 'Prioridade Média',
          dotColor: 'bg-amber-500',
          textColor: 'text-amber-700',
          badgeBg: 'bg-amber-50 border-amber-200',
        };
      case 'baixa':
      default:
        return {
          label: 'Prioridade Baixa',
          dotColor: 'bg-slate-400',
          textColor: 'text-slate-600',
          badgeBg: 'bg-slate-50 border-slate-200',
        };
    }
  };

  const formatDueDateLabel = (dueDate: string, dueTime?: string) => {
    if (dueDate < todayStr) {
      return (
        <span className="text-rose-600 font-bold flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Vencido ({new Date(dueDate + 'T00:00:00').toLocaleDateString('pt-BR')})</span>
        </span>
      );
    }
    if (dueDate === todayStr) {
      return (
        <span className="text-amber-700 font-extrabold flex items-center gap-1 bg-amber-100/80 px-2 py-0.5 rounded-md">
          <Clock className="w-3.5 h-3.5 shrink-0 animate-pulse text-amber-600" />
          <span>Vence Hoje {dueTime ? `às ${dueTime}` : ''}</span>
        </span>
      );
    }
    const targetDate = new Date(dueDate + 'T00:00:00');
    const todayDate = new Date(todayStr + 'T00:00:00');
    const diffDays = Math.round((targetDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return (
        <span className="text-sky-700 font-semibold flex items-center gap-1">
          <CalendarDays className="w-3.5 h-3.5 shrink-0" />
          <span>Amanhã {dueTime ? `às ${dueTime}` : ''}</span>
        </span>
      );
    }
    return (
      <span className="text-slate-600 font-medium flex items-center gap-1">
        <Calendar className="w-3.5 h-3.5 shrink-0 text-slate-400" />
        <span>Em {diffDays} dias ({targetDate.toLocaleDateString('pt-BR')})</span>
      </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Top Banner / Notification Header */}
      <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-xs">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-slate-900">
                Lembretes & Prazos Administrativos
              </h3>
              {urgentTasksCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black border border-rose-200 animate-pulse">
                  {urgentTasksCount} Urgente{urgentTasksCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Notificações de follow-ups pós-consulta, checagem de exames e prazos da rotina do nutricionista.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleOpenCreateModal()}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Lembrete</span>
          </button>
        </div>
      </div>

      {/* Urgent Warning Banner if overdue or due today */}
      {urgentTasksCount > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200/80 px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2.5 text-amber-900 font-semibold">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Você possui <strong>{overdueTasks.length} tarefa(s) em atraso</strong> e{' '}
              <strong>{dueTodayTasks.length} prevista(s) para hoje</strong>.
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setStatusFilter('urgent_today');
              }}
              className="px-2.5 py-1 bg-amber-200/80 hover:bg-amber-300 text-amber-950 rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
            >
              Filtrar Urgentes & Hoje
            </button>
          </div>
        </div>
      )}

      {/* Summary KPI Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 bg-slate-50/70 border-b border-slate-100 text-xs">
        <button
          onClick={() => setStatusFilter('all')}
          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-white border-slate-300 shadow-2xs ring-2 ring-slate-400/20'
              : 'bg-white/80 border-slate-200 hover:bg-white'
          }`}
        >
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Cadastrado
          </span>
          <span className="text-lg font-black text-slate-900 block mt-0.5">
            {tasks.length}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter('urgent_today')}
          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
            statusFilter === 'urgent_today'
              ? 'bg-amber-50/80 border-amber-300 shadow-2xs ring-2 ring-amber-500/20'
              : 'bg-white/80 border-slate-200 hover:bg-white'
          }`}
        >
          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
            Vencidos & Hoje
          </span>
          <span className="text-lg font-black text-amber-800 block mt-0.5">
            {urgentTasksCount}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter('pending')}
          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
            statusFilter === 'pending'
              ? 'bg-emerald-50/80 border-emerald-300 shadow-2xs ring-2 ring-emerald-500/20'
              : 'bg-white/80 border-slate-200 hover:bg-white'
          }`}
        >
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
            Em Aberto
          </span>
          <span className="text-lg font-black text-emerald-800 block mt-0.5">
            {pendingTasks.length}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter('completed')}
          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
            statusFilter === 'completed'
              ? 'bg-slate-100 border-slate-300 shadow-2xs ring-2 ring-slate-400/20'
              : 'bg-white/80 border-slate-200 hover:bg-white'
          }`}
        >
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Concluídos
          </span>
          <span className="text-lg font-black text-slate-700 block mt-0.5">
            {completedTasks.length}
          </span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Category Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none py-1">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
              categoryFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todas ({tasks.length})
          </button>
          <button
            onClick={() => setCategoryFilter('follow_up')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap flex items-center space-x-1 cursor-pointer ${
              categoryFilter === 'follow_up'
                ? 'bg-blue-600 text-white'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>Follow-ups</span>
          </button>
          <button
            onClick={() => setCategoryFilter('administrative')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap flex items-center space-x-1 cursor-pointer ${
              categoryFilter === 'administrative'
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Briefcase className="w-3 h-3" />
            <span>Administrativo</span>
          </button>
          <button
            onClick={() => setCategoryFilter('plan_review')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap flex items-center space-x-1 cursor-pointer ${
              categoryFilter === 'plan_review'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            <Utensils className="w-3 h-3" />
            <span>Revisão de Planos</span>
          </button>
          <button
            onClick={() => setCategoryFilter('exam_check')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap flex items-center space-x-1 cursor-pointer ${
              categoryFilter === 'exam_check'
                ? 'bg-purple-600 text-white'
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
            }`}
          >
            <Activity className="w-3 h-3" />
            <span>Exames</span>
          </button>
        </div>

        {/* Priority & Search Input */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Todas Prioridades</option>
            <option value="alta">Alta Prioridade</option>
            <option value="media">Média Prioridade</option>
            <option value="baixa">Baixa Prioridade</option>
          </select>

          <input
            type="text"
            placeholder="Buscar por paciente ou título..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs flex-1 sm:w-56 focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Task List */}
      <div className="divide-y divide-slate-100 max-h-[460px] overflow-y-auto">
        {filteredTasks.length === 0 ? (
          <div className="p-10 text-center text-slate-400 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <p className="text-xs font-medium text-slate-600">
              Nenhuma tarefa encontrada para os filtros selecionados.
            </p>
            <button
              onClick={() => handleOpenCreateModal()}
              className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer"
            >
              + Criar nova tarefa ou lembrete
            </button>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const catMeta = getCategoryMeta(task.category);
            const priMeta = getPriorityMeta(task.priority);
            const CatIcon = catMeta.icon;

            return (
              <div
                key={task.id}
                className={`p-4 transition-all hover:bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  task.isCompleted ? 'bg-slate-50/50 opacity-75' : ''
                }`}
              >
                {/* Left: Checkbox + Title + Description + Badges */}
                <div className="flex items-start space-x-3 flex-1 min-w-0">
                  <button
                    onClick={() => toggleTaskCompleted(task.id)}
                    className="mt-0.5 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer shrink-0"
                    title={task.isCompleted ? 'Marcar como pendente' : 'Marcar como concluído'}
                  >
                    {task.isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`text-xs font-bold ${
                          task.isCompleted ? 'line-through text-slate-400' : 'text-slate-900'
                        }`}
                      >
                        {task.title}
                      </span>

                      {/* Category Badge */}
                      <span
                        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${catMeta.badgeColor}`}
                      >
                        <CatIcon className="w-3 h-3" />
                        <span>{catMeta.label}</span>
                      </span>

                      {/* Priority Badge */}
                      <span
                        className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${priMeta.badgeBg} ${priMeta.textColor}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${priMeta.dotColor}`} />
                        <span>{priMeta.label.replace('Prioridade ', '')}</span>
                      </span>

                      {task.autoGenerated && (
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded font-mono">
                          Auto
                        </span>
                      )}
                    </div>

                    {task.description && (
                      <p
                        className={`text-xs text-slate-500 leading-relaxed ${
                          task.isCompleted ? 'line-through text-slate-400' : ''
                        }`}
                      >
                        {task.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-xs pt-0.5">
                      {/* Due Date & Time */}
                      {formatDueDateLabel(task.dueDate, task.dueTime)}

                      {/* Associated Patient */}
                      {task.patientName && task.patientId && (
                        <button
                          onClick={() => handleNavigateToPatient(task.patientId!)}
                          className="inline-flex items-center space-x-1 text-slate-700 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 px-2 py-0.5 rounded-md text-[11px] font-semibold border border-slate-200 transition-colors cursor-pointer"
                          title="Abrir prontuário do paciente"
                        >
                          <User className="w-3 h-3 text-slate-500" />
                          <span>{task.patientName}</span>
                          <ChevronRight className="w-3 h-3 text-slate-400" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center space-x-1 self-end sm:self-center shrink-0">
                  <button
                    onClick={() => handleOpenEditModal(task)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    title="Editar tarefa"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Excluir lembrete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Task Creation / Edition Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">
                    {editingTask ? 'Editar Lembrete / Tarefa' : 'Novo Lembrete ou Prazo Administrativo'}
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Controle de rotina e acompanhamento clínico do consultório.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveTask} className="p-6 space-y-4 text-xs">
              {/* Presets Quick Pick */}
              {!editingTask && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Sugestões Rápidas:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { title: 'Follow-up de 15 dias pós-consulta', cat: 'follow_up' as TaskCategory, pri: 'alta' as TaskPriority },
                      { title: 'Checagem de exames de sangue', cat: 'exam_check' as TaskCategory, pri: 'media' as TaskPriority },
                      { title: 'Revisão de cardápio / calorias', cat: 'plan_review' as TaskCategory, pri: 'media' as TaskPriority },
                      { title: 'Fechamento contábil e recibos do mês', cat: 'administrative' as TaskCategory, pri: 'alta' as TaskPriority },
                      { title: 'Lembrete de renovação de programa contínuo', cat: 'follow_up' as TaskCategory, pri: 'media' as TaskPriority },
                    ].map((pre, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setFormTitle(pre.title);
                          setFormCategory(pre.cat);
                          setFormPriority(pre.pri);
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium transition-colors cursor-pointer"
                      >
                        + {pre.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Título da Tarefa / Lembrete: *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ex: Follow-up de 15 dias com o paciente..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Descrição e Orientações:
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Ex: Verificar adesão alimentar, sintomas digestivos e ingestão de água..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Associated Patient */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Vincular ao Paciente:
                </label>
                <select
                  value={formPatientId}
                  onChange={(e) => setFormPatientId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                >
                  <option value="">Nenhum (Tarefa Administrativa Geral / Clínica)</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.goal})
                    </option>
                  ))}
                </select>
              </div>

              {/* Category & Priority */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Categoria:
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                  >
                    <option value="follow_up">Follow-up de Paciente</option>
                    <option value="administrative">Prazo Administrativo</option>
                    <option value="plan_review">Revisão de Plano</option>
                    <option value="exam_check">Checagem de Exames</option>
                    <option value="custom">Geral / Personalizado</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Prioridade:
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold text-slate-800"
                  >
                    <option value="alta">🔴 Alta Prioridade</option>
                    <option value="media">🟡 Média Prioridade</option>
                    <option value="baixa">⚪ Baixa Prioridade</option>
                  </select>
                </div>
              </div>

              {/* Due Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Data Limite (Prazo): *
                  </label>
                  <input
                    type="date"
                    required
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Horário Previsto:
                  </label>
                  <input
                    type="time"
                    value={formDueTime}
                    onChange={(e) => setFormDueTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold"
                  />
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs transition-colors cursor-pointer"
                >
                  {editingTask ? 'Salvar Alterações' : 'Criar Lembrete'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
