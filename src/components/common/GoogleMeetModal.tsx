import React, { useState } from 'react';
import { Appointment } from '../../types';
import {
  Video,
  MessageSquare,
  Copy,
  CheckCircle2,
  ExternalLink,
  X,
  Calendar,
  Clock,
  User,
  Sparkles
} from 'lucide-react';

interface GoogleMeetModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment?: Appointment | null;
  patientName?: string;
}

export const GoogleMeetModal: React.FC<GoogleMeetModalProps> = ({
  isOpen,
  onClose,
  appointment,
  patientName = 'Paciente'
}) => {
  const [copiedMeet, setCopiedMeet] = useState(false);
  const [copiedChat, setCopiedChat] = useState(false);

  if (!isOpen) return null;

  const targetName = appointment?.patientName || patientName;
  const slug = targetName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '-');

  const meetUrl = appointment?.meetLink || `https://meet.google.com/nutri-${slug}-pro`;
  const chatUrl = appointment?.googleChatSpaceUrl || `https://chat.google.com/room/nutricore-${slug}`;

  const handleCopyMeet = () => {
    navigator.clipboard.writeText(meetUrl);
    setCopiedMeet(true);
    setTimeout(() => setCopiedMeet(false), 2500);
  };

  const handleCopyChat = () => {
    navigator.clipboard.writeText(chatUrl);
    setCopiedChat(true);
    setTimeout(() => setCopiedChat(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-6 animate-fadeIn">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
              <Video className="w-4 h-4" />
            </span>
            Teleconsulta Integrada (Google Meet & Google Chat)
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Appointment Context Info */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg mb-4 text-xs space-y-1.5">
          <div className="flex items-center justify-between font-semibold text-slate-900">
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              {targetName}
            </span>
            {appointment?.status && (
              <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                {appointment.status}
              </span>
            )}
          </div>
          {appointment && (
            <div className="flex items-center gap-4 text-slate-500 font-mono text-[11px]">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                {appointment.date}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                {appointment.time} ({appointment.durationMinutes || 60} min)
              </span>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {/* Google Meet Option */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-xs text-emerald-950">
                <Video className="w-4 h-4 text-emerald-600" />
                <span>Sala de Videoconsulta Google Meet</span>
              </div>
              <span className="text-[10px] bg-emerald-200/70 text-emerald-900 font-bold px-2 py-0.5 rounded">
                Vídeo HD
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={meetUrl}
                className="w-full text-xs font-mono bg-white border border-emerald-300 text-slate-700 px-2.5 py-1.5 rounded-lg focus:outline-none select-all"
              />
              <button
                onClick={handleCopyMeet}
                className="p-1.5 bg-white hover:bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-lg transition-colors shrink-0"
                title="Copiar Link"
              >
                {copiedMeet ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <a
                href={meetUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <span>Entrar na Sala Meet</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Google Chat Space Option */}
          <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-xs text-blue-950">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <span>Canal / Chat Direto no Google Chat</span>
              </div>
              <span className="text-[10px] bg-blue-200/70 text-blue-900 font-bold px-2 py-0.5 rounded">
                Mensagens & Dúvidas
              </span>
            </div>

            <p className="text-[11px] text-blue-900">
              Espaço dedicado no Google Chat para tirar dúvidas diárias sobre a dieta, envio de fotos de pratos e acompanhamento em tempo real.
            </p>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={chatUrl}
                className="w-full text-xs font-mono bg-white border border-blue-300 text-slate-700 px-2.5 py-1.5 rounded-lg focus:outline-none select-all"
              />
              <button
                onClick={handleCopyChat}
                className="p-1.5 bg-white hover:bg-blue-100 border border-blue-300 text-blue-800 rounded-lg transition-colors shrink-0"
                title="Copiar Link"
              >
                {copiedChat ? <CheckCircle2 className="w-4 h-4 text-blue-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <a
                href={chatUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <span>Abrir Google Chat</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
          >
            Concluído
          </button>
        </div>
      </div>
    </div>
  );
};
