import React, { useState, useMemo, useRef } from 'react';
import { useNutrition } from '../../context/NutritionContext';
import { Patient, PatientEvolutionPhoto, PhotoAngle } from '../../types';
import {
  Camera,
  Upload,
  Plus,
  Trash2,
  Calendar,
  Layers,
  ArrowRightLeft,
  Sliders,
  Scale,
  Percent,
  Sparkles,
  Info,
  Maximize2,
  X,
  CheckCircle2,
  Image as ImageIcon
} from 'lucide-react';

interface PatientEvolutionPhotosViewProps {
  patient: Patient;
}

export const PatientEvolutionPhotosView: React.FC<PatientEvolutionPhotosViewProps> = ({ patient }) => {
  const {
    patientEvolutionPhotos,
    addEvolutionPhoto,
    deleteEvolutionPhoto,
    patientAnthropometry
  } = useNutrition();

  const [selectedAngleFilter, setSelectedAngleFilter] = useState<PhotoAngle | 'all'>('all');
  const [comparisonMode, setComparisonMode] = useState<'slider' | 'side_by_side'>('slider');
  const [sliderPosition, setSliderPosition] = useState<number>(50); // percentage 0 - 100
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Form states for photo upload
  const [uploadDate, setUploadDate] = useState(new Date().toISOString().split('T')[0]);
  const [uploadAngle, setUploadAngle] = useState<PhotoAngle>('frontal');
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadWeight, setUploadWeight] = useState<number>(patient.weightKg || 75);
  const [uploadBodyFat, setUploadBodyFat] = useState<number>(20);
  const [uploadPhotoUrl, setUploadPhotoUrl] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter photos for this patient
  const patientPhotos = useMemo(() => {
    return patientEvolutionPhotos
      .filter((p) => p.patientId === patient.id)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [patientEvolutionPhotos, patient.id]);

  const filteredPhotos = useMemo(() => {
    if (selectedAngleFilter === 'all') return patientPhotos;
    return patientPhotos.filter((p) => p.angle === selectedAngleFilter);
  }, [patientPhotos, selectedAngleFilter]);

  // Comparison selection
  const [beforePhotoId, setBeforePhotoId] = useState<string>(() => {
    return patientPhotos[0]?.id || '';
  });
  const [afterPhotoId, setAfterPhotoId] = useState<string>(() => {
    return patientPhotos[patientPhotos.length - 1]?.id || '';
  });

  const beforePhoto = useMemo(() => {
    return patientPhotos.find((p) => p.id === beforePhotoId) || patientPhotos[0];
  }, [patientPhotos, beforePhotoId]);

  const afterPhoto = useMemo(() => {
    return (
      patientPhotos.find((p) => p.id === afterPhotoId) ||
      (patientPhotos.length > 1 ? patientPhotos[patientPhotos.length - 1] : patientPhotos[0])
    );
  }, [patientPhotos, afterPhotoId]);

  // Delta calculations between comparison photos
  const deltaWeight = useMemo(() => {
    if (beforePhoto?.weightKgAtTime && afterPhoto?.weightKgAtTime) {
      return Number((afterPhoto.weightKgAtTime - beforePhoto.weightKgAtTime).toFixed(1));
    }
    return null;
  }, [beforePhoto, afterPhoto]);

  const deltaBodyFat = useMemo(() => {
    if (beforePhoto?.bodyFatPercentAtTime && afterPhoto?.bodyFatPercentAtTime) {
      return Number((afterPhoto.bodyFatPercentAtTime - beforePhoto.bodyFatPercentAtTime).toFixed(1));
    }
    return null;
  }, [beforePhoto, afterPhoto]);

  // Handle local image file upload conversion
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Por favor selecione um arquivo de imagem válido (JPG, PNG ou WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('A imagem deve ter no máximo 5MB.');
      return;
    }

    setUploadError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setUploadPhotoUrl(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSavePhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadPhotoUrl) {
      setUploadError('Selecione uma imagem ou informe a foto.');
      return;
    }

    addEvolutionPhoto({
      patientId: patient.id,
      date: uploadDate,
      angle: uploadAngle,
      photoUrl: uploadPhotoUrl,
      caption: uploadCaption.trim() || undefined,
      weightKgAtTime: uploadWeight,
      bodyFatPercentAtTime: uploadBodyFat,
      tags: [uploadAngle, 'registro_clinico'],
    });

    setIsUploadModalOpen(false);
    setUploadPhotoUrl('');
    setUploadCaption('');
    setUploadError(null);
  };

  const angleLabels: Record<PhotoAngle, string> = {
    frontal: 'Frontal',
    lateral_direita: 'Perfil Direito',
    lateral_esquerda: 'Perfil Esquerdo',
    costas: 'Costas'
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Camera className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">
              Fotos de Evolução & Comparador Corporal
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Galeria cronológica e comparador interativo antes/depois para visualização da composição física.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              // Pre-fill weight from latest record
              const latest = patientAnthropometry[patientAnthropometry.length - 1];
              if (latest) {
                setUploadWeight(latest.weightKg);
                setUploadBodyFat(latest.bodyFatPercent || 20);
              }
              setIsUploadModalOpen(true);
            }}
            className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Nova Foto</span>
          </button>
        </div>
      </div>

      {/* COMPARATOR TOOL CARD (When 2 or more photos exist) */}
      {patientPhotos.length >= 2 && beforePhoto && afterPhoto && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                <ArrowRightLeft className="w-4 h-4 text-emerald-600" />
                <span>Comparador Interativo Antes & Depois</span>
              </span>
              <span className="text-xs text-slate-500 mt-0.5 block">
                Arraste o divisor ou selecione fotos de datas distintas para comparar o avanço físico.
              </span>
            </div>

            {/* Mode switch */}
            <div className="flex items-center gap-2">
              <div className="bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600 flex items-center">
                <button
                  onClick={() => setComparisonMode('slider')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    comparisonMode === 'slider'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'hover:text-slate-900'
                  }`}
                >
                  Régua Deslizante (Split)
                </button>
                <button
                  onClick={() => setComparisonMode('side_by_side')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    comparisonMode === 'side_by_side'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'hover:text-slate-900'
                  }`}
                >
                  Lado a Lado
                </button>
              </div>
            </div>
          </div>

          {/* Selectors for Before & After */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Foto Inicial (Antes):</label>
              <select
                value={beforePhotoId}
                onChange={(e) => setBeforePhotoId(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-semibold"
              >
                {patientPhotos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.date} • {angleLabels[p.angle]} {p.weightKgAtTime ? `(${p.weightKgAtTime} kg)` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Foto Recente (Depois):</label>
              <select
                value={afterPhotoId}
                onChange={(e) => setAfterPhotoId(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-semibold"
              >
                {patientPhotos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.date} • {angleLabels[p.angle]} {p.weightKgAtTime ? `(${p.weightKgAtTime} kg)` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Evolution Metric Delta Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-400 block font-semibold">INTERVALO</span>
              <span className="font-bold text-slate-800 mt-0.5 block">
                {beforePhoto.date} ➔ {afterPhoto.date}
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-400 block font-semibold">VARIAÇÃO DE PESO</span>
              <span
                className={`font-bold text-sm mt-0.5 block ${
                  deltaWeight !== null && deltaWeight <= 0 ? 'text-emerald-700' : 'text-slate-900'
                }`}
              >
                {deltaWeight !== null ? (deltaWeight > 0 ? `+${deltaWeight} kg` : `${deltaWeight} kg`) : '—'}
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-400 block font-semibold">VARIAÇÃO % GORDURA</span>
              <span
                className={`font-bold text-sm mt-0.5 block ${
                  deltaBodyFat !== null && deltaBodyFat <= 0 ? 'text-emerald-700' : 'text-slate-900'
                }`}
              >
                {deltaBodyFat !== null ? (deltaBodyFat > 0 ? `+${deltaBodyFat}%` : `${deltaBodyFat}%`) : '—'}
              </span>
            </div>

            <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200">
              <span className="text-[11px] text-emerald-800 block font-semibold">RESULTADO CLÍNICO</span>
              <span className="font-bold text-emerald-950 mt-0.5 block">
                {deltaWeight !== null && deltaWeight < 0 ? 'Perda Ponderal Ativa ✓' : 'Fase de Recomposição ✓'}
              </span>
            </div>
          </div>

          {/* INTERACTIVE VIEWER */}
          {comparisonMode === 'slider' ? (
            <div className="space-y-2">
              <div
                className="relative w-full h-[450px] sm:h-[520px] rounded-2xl overflow-hidden border border-slate-200 select-none bg-slate-900 shadow-inner"
              >
                {/* Background Layer: "Depois" Photo */}
                <img
                  src={afterPhoto.photoUrl}
                  alt="Depois"
                  className="absolute inset-0 w-full h-full object-contain bg-slate-950"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur-md text-white px-3 py-1 rounded-lg text-xs font-bold border border-white/10 z-10">
                  Depois ({afterPhoto.date}) • {afterPhoto.weightKgAtTime} kg
                </div>

                {/* Foreground Layer: "Antes" Photo clipped by slider percentage */}
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${sliderPosition}%` }}
                >
                  <img
                    src={beforePhoto.photoUrl}
                    alt="Antes"
                    className="absolute inset-0 w-full h-full object-contain bg-slate-950"
                    referrerPolicy="no-referrer"
                    style={{
                      width: '100%',
                      minWidth: '100%',
                      maxWidth: 'none',
                    }}
                  />
                  <div className="absolute top-4 left-4 bg-emerald-900/80 backdrop-blur-md text-white px-3 py-1 rounded-lg text-xs font-bold border border-emerald-400/20 z-10">
                    Antes ({beforePhoto.date}) • {beforePhoto.weightKgAtTime} kg
                  </div>
                </div>

                {/* Vertical Divider Line & Dragger Handle */}
                <div
                  className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-20 shadow-2xl flex items-center justify-center"
                  style={{ left: `${sliderPosition}%` }}
                >
                  <div className="w-8 h-8 rounded-full bg-white text-slate-900 shadow-lg flex items-center justify-center text-xs font-bold -ml-3.5 border border-slate-300">
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              {/* Slider Range Controller */}
              <div className="flex items-center space-x-3 pt-2">
                <span className="text-xs font-bold text-slate-500">Antes</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sliderPosition}
                  onChange={(e) => setSliderPosition(Number(e.target.value))}
                  className="flex-1 accent-emerald-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-500">Depois</span>
              </div>
            </div>
          ) : (
            /* Side-by-side View */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 h-[420px] flex items-center justify-center">
                <img
                  src={beforePhoto.photoUrl}
                  alt="Antes"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3 left-3 bg-emerald-900/80 backdrop-blur-md text-white px-3 py-1 rounded-lg text-xs font-bold">
                  Antes: {beforePhoto.date} ({beforePhoto.weightKgAtTime} kg)
                </div>
                {beforePhoto.caption && (
                  <div className="absolute bottom-3 inset-x-3 bg-black/70 backdrop-blur-xs text-white p-2 rounded-lg text-[11px]">
                    {beforePhoto.caption}
                  </div>
                )}
              </div>

              <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 h-[420px] flex items-center justify-center">
                <img
                  src={afterPhoto.photoUrl}
                  alt="Depois"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white px-3 py-1 rounded-lg text-xs font-bold">
                  Depois: {afterPhoto.date} ({afterPhoto.weightKgAtTime} kg)
                </div>
                {afterPhoto.caption && (
                  <div className="absolute bottom-3 inset-x-3 bg-black/70 backdrop-blur-xs text-white p-2 rounded-lg text-[11px]">
                    {afterPhoto.caption}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* GALLERY SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Galeria Completa de Fotos ({filteredPhotos.length})
            </h3>
            <span className="text-xs text-slate-500">Histórico de registros fotográficos organizados por data e ângulo</span>
          </div>

          {/* Angle filters */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
            <button
              onClick={() => setSelectedAngleFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedAngleFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todas ({patientPhotos.length})
            </button>
            <button
              onClick={() => setSelectedAngleFilter('frontal')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedAngleFilter === 'frontal'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Frontal
            </button>
            <button
              onClick={() => setSelectedAngleFilter('lateral_direita')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedAngleFilter === 'lateral_direita'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Perfil
            </button>
            <button
              onClick={() => setSelectedAngleFilter('costas')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedAngleFilter === 'costas'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Costas
            </button>
          </div>
        </div>

        {filteredPhotos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredPhotos.map((photo) => (
              <div
                key={photo.id}
                className="group relative bg-slate-50 rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-all flex flex-col"
              >
                {/* Photo Thumbnail */}
                <div className="relative h-64 bg-slate-950 flex items-center justify-center overflow-hidden">
                  <img
                    src={photo.photoUrl}
                    alt={photo.caption || 'Foto de evolução'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-xs text-white px-2 py-0.5 rounded text-[10px] font-bold">
                    {angleLabels[photo.angle]}
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => {
                      if (confirm('Deseja excluir esta foto de evolução?')) {
                        deleteEvolutionPhoto(photo.id);
                      }
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Excluir foto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Details Footer */}
                <div className="p-3 text-xs space-y-1 bg-white flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-slate-500 text-[11px]">
                      <span className="font-semibold">{photo.date}</span>
                      {photo.weightKgAtTime && (
                        <span className="font-bold text-slate-900">{photo.weightKgAtTime} kg</span>
                      )}
                    </div>
                    {photo.caption && (
                      <p className="text-slate-700 font-medium line-clamp-2 mt-1 text-[11px]">
                        {photo.caption}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setBeforePhotoId(photo.id);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900"
                    >
                      Usar no Antes ➔
                    </button>
                    <button
                      onClick={() => {
                        setAfterPhotoId(photo.id);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="text-[11px] font-bold text-sky-700 hover:text-sky-900"
                    >
                      Usar no Depois ➔
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400 space-y-3">
            <Camera className="w-10 h-10 mx-auto text-slate-300 stroke-1" />
            <p className="text-xs">Nenhuma foto encontrada para os filtros selecionados.</p>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold"
            >
              Adicionar Primeira Foto
            </button>
          </div>
        )}
      </div>

      {/* UPLOAD PHOTO MODAL */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Camera className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Adicionar Foto de Evolução
                </h3>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePhoto} className="space-y-4 text-xs">
              {/* Image Preview / File Dropzone */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Foto do Paciente: *
                </label>
                {uploadPhotoUrl ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-950 h-52 flex items-center justify-center">
                    <img
                      src={uploadPhotoUrl}
                      alt="Preview"
                      className="w-full h-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => setUploadPhotoUrl('')}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 text-white hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-50 hover:bg-emerald-50/30"
                  >
                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">Clique para selecionar a imagem</p>
                    <p className="text-[11px] text-slate-400 mt-1">Formatos aceitos: JPG, PNG, WebP (máx. 5MB)</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {uploadError && (
                <div className="p-2.5 bg-red-50 text-red-700 rounded-lg text-xs font-semibold">
                  {uploadError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Data do Registro: *</label>
                  <input
                    type="date"
                    value={uploadDate}
                    onChange={(e) => setUploadDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 font-semibold text-slate-800"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Ângulo Corporal: *</label>
                  <select
                    value={uploadAngle}
                    onChange={(e) => setUploadAngle(e.target.value as PhotoAngle)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 font-semibold text-slate-800"
                  >
                    <option value="frontal">Frontal</option>
                    <option value="lateral_direita">Perfil Direito</option>
                    <option value="lateral_esquerda">Perfil Esquerdo</option>
                    <option value="costas">Costas</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Peso na Data (kg):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={uploadWeight}
                    onChange={(e) => setUploadWeight(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-800 font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">% Gordura Estimado:</label>
                  <input
                    type="number"
                    step="0.1"
                    value={uploadBodyFat}
                    onChange={(e) => setUploadBodyFat(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-800 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Observações / Legenda Clínica:</label>
                <input
                  type="text"
                  placeholder="Ex: 2º Retorno - Perda visível de gordura abdominal"
                  value={uploadCaption}
                  onChange={(e) => setUploadCaption(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  Salvar Foto no Prontuário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
