import React, { useState } from 'react';
import { NutritionProvider, useNutrition } from './context/NutritionContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { PatientList } from './components/admin/PatientList';
import { PatientDetail } from './components/admin/PatientDetail';
import { DietTemplatesView } from './components/admin/DietTemplatesView';
import { FoodDatabaseView } from './components/admin/FoodDatabaseView';
import { CalculatorsView } from './components/admin/CalculatorsView';
import { NutritionProgramsView } from './components/admin/NutritionProgramsView';
import { BillingView } from './components/admin/BillingView';
import { SystemAdminView } from './components/admin/SystemAdminView';
import { PatientPortal } from './components/patient/PatientPortal';
import { PDFExportModal } from './components/common/PDFExportModal';
import { GoogleCalendarManagerModal } from './components/common/GoogleCalendarManagerModal';
import { BackupModal } from './components/common/BackupModal';
import { OnlinePaymentModal } from './components/common/OnlinePaymentModal';
import { PatientModal } from './components/admin/PatientModal';
import { SystemDiagnosticsModal } from './components/admin/SystemDiagnosticsModal';
import { ProgramProgressReportModal } from './components/admin/ProgramProgressReportModal';

const AppContent: React.FC = () => {
  const {
    currentView,
    activeAdminTab,
    selectedPatientForDetail,
    setSelectedPatientForDetail,
    activePaymentModal,
    closePaymentModal,
    openNewPatientModal,
    isDiagnosticsModalOpen,
    closeDiagnosticsModal,
    activeReportModal,
    closeReportModal,
  } = useNutrition();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  const handleSelectPatient = (patient: any) => {
    setSelectedPatientForDetail(patient);
  };

  const handleBackToPatientList = () => {
    setSelectedPatientForDetail(null);
  };

  const handleOpenNewPatient = () => {
    openNewPatientModal();
  };

  return (
    <div className="flex min-h-screen w-full bg-slate-50 font-sans text-slate-900 overflow-hidden selection:bg-emerald-500 selection:text-white">
      {/* Left Dark Sidebar */}
      <Sidebar
        onOpenNewPatientModal={handleOpenNewPatient}
        onOpenCalendarModal={() => setIsCalendarModalOpen(true)}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        isOpenMobile={isMobileMenuOpen}
        setIsOpenMobile={setIsMobileMenuOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen h-full overflow-hidden bg-slate-50">
        {/* Top Header */}
        <Navbar
          onOpenNewPatientModal={handleOpenNewPatient}
          onOpenCalendarModal={() => setIsCalendarModalOpen(true)}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {currentView === 'admin' ? (
            <div>
              {/* View Switcher based on activeAdminTab */}
              {activeAdminTab === 'dashboard' && (
                <AdminDashboard
                  onOpenNewPatientModal={handleOpenNewPatient}
                  onOpenCalendarModal={() => setIsCalendarModalOpen(true)}
                />
              )}

              {activeAdminTab === 'patients' && (
                <>
                  {selectedPatientForDetail ? (
                    <PatientDetail onBackToList={handleBackToPatientList} />
                  ) : (
                    <PatientList
                      onSelectPatient={handleSelectPatient}
                    />
                  )}
                </>
              )}

              {activeAdminTab === 'templates' && <DietTemplatesView />}

              {activeAdminTab === 'programs' && <NutritionProgramsView />}

              {activeAdminTab === 'foods' && <FoodDatabaseView />}

              {activeAdminTab === 'calculators' && <CalculatorsView />}

              {activeAdminTab === 'billing' && <BillingView />}

              {activeAdminTab === 'system_admin' && <SystemAdminView />}
            </div>
          ) : (
            /* Mobile-first Patient View */
            <div className="py-2">
              <PatientPortal />
            </div>
          )}
        </main>
      </div>

      {/* Global Patient Creation / Edition Modal */}
      <PatientModal />

      {/* Global PDF Export & Printable Sheet Modal */}
      <PDFExportModal />

      {/* Google Calendar Management & Appointments Modal */}
      <GoogleCalendarManagerModal
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
      />

      {/* Backup & Restore Modal */}
      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
      />

      {/* Internal Financial Registration & Consultation Fee Modal */}
      <OnlinePaymentModal
        isOpen={!!activePaymentModal?.isOpen}
        onClose={closePaymentModal}
      />

      {/* System Diagnostics & Integrity Inspector Modal */}
      <SystemDiagnosticsModal
        isOpen={isDiagnosticsModalOpen}
        onClose={closeDiagnosticsModal}
      />

      {/* Program Progress Report & Certificate Modal */}
      <ProgramProgressReportModal
        isOpen={!!activeReportModal?.isOpen}
        onClose={closeReportModal}
        report={activeReportModal?.report}
        enrollment={activeReportModal?.enrollment}
      />
    </div>
  );
};

export default function App() {
  return (
    <NutritionProvider>
      <AppContent />
    </NutritionProvider>
  );
}
