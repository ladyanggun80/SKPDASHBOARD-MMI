import React, { useState, useEffect } from "react";
import { 
  School, 
  Database, 
  Users, 
  BarChart2, 
  Clock, 
  Menu, 
  X, 
  User,
  Power,
  ChevronRight,
  TrendingUp,
  AlertCircle
} from "lucide-react";

// Types & Data
import { SchoolInfo, Teacher, MMIFile, Substitution } from "./types";
import { INITIAL_SCHOOL_INFO, getInitialTeachers, INITIAL_MMI_FILES, INITIAL_SUBSTITUTIONS } from "./initialData";

// Components
import DashboardUtama from "./components/DashboardUtama";
import DataMMI from "./components/DataMMI";
import AnalisisGuru from "./components/AnalisisGuru";
import Analitik from "./components/Analitik";
import CetakLaporan from "./components/CetakLaporan";

type ActiveTab = 'dashboard' | 'mmi' | 'guru' | 'analitik';

export default function App() {
  // Sidebar states (supports mobile toggling)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [systemTime, setSystemTime] = useState("");
  const [isResetConfirm, setIsResetConfirm] = useState(false);
  const [showPrintReport, setShowPrintReport] = useState(false);
  const [printReportDate, setPrintReportDate] = useState("");

  // Persistent States
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo>(() => {
    const saved = localStorage.getItem("school360_school_info_v4");
    return saved ? JSON.parse(saved) : INITIAL_SCHOOL_INFO;
  });

  const [teachers, setTeachers] = useState<Teacher[]>(() => {
    const saved = localStorage.getItem("school360_teachers_v3");
    return saved ? JSON.parse(saved) : getInitialTeachers();
  });

  const [mmiFiles, setMmiFiles] = useState<MMIFile[]>(() => {
    const saved = localStorage.getItem("school360_mmi_files_v3");
    return saved ? JSON.parse(saved) : INITIAL_MMI_FILES;
  });

  const [substitutions, setSubstitutions] = useState<Substitution[]>(() => {
    const saved = localStorage.getItem("school360_substitutions_v3");
    return saved ? JSON.parse(saved) : INITIAL_SUBSTITUTIONS;
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem("school360_school_info_v4", JSON.stringify(schoolInfo));
  }, [schoolInfo]);

  useEffect(() => {
    localStorage.setItem("school360_teachers_v3", JSON.stringify(teachers));
  }, [teachers]);

  useEffect(() => {
    localStorage.setItem("school360_mmi_files_v3", JSON.stringify(mmiFiles));
  }, [mmiFiles]);

  useEffect(() => {
    localStorage.setItem("school360_substitutions_v3", JSON.stringify(substitutions));
  }, [substitutions]);

  // Clean old localStorage remnants on mount to be absolutely pristine
  useEffect(() => {
    const oldKeys = ["school360_teachers", "school360_mmi_files", "school360_substitutions", "school360_school_info"];
    oldKeys.forEach(k => localStorage.removeItem(k));
  }, []);

  // Real-time Clock effect
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: true 
      };
      setSystemTime(now.toLocaleString('ms-MY', options));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Action: Add new MMI schedule file
  const handleAddMMIFile = (newFile: MMIFile) => {
    setMmiFiles(prev => [...prev, newFile]);
  };

  // Action: Update existing MMI file (overwrites fields without creating a duplicate)
  const handleUpdateMMIFile = (updatedFile: MMIFile) => {
    setMmiFiles(prev => prev.map(f => f.id === updatedFile.id ? updatedFile : f));
  };

  // Action: Update existing MMI file's date and all related substitutions
  const handleUpdateMMIFileDate = (fileId: string, oldDate: string, newDate: string) => {
    setMmiFiles(prev => prev.map(f => {
      if (f.id === fileId) {
        return { ...f, tarikh: newDate };
      }
      return f;
    }));

    setSubstitutions(prev => prev.map(s => {
      if (s.tarikh === oldDate) {
        return { ...s, tarikh: newDate };
      }
      return s;
    }));
  };

  // Action: Delete MMI file (synchronizes and removes linked substitutions & decrements teacher metrics)
  const handleDeleteMMIFile = (id: string) => {
    const fileToDelete = mmiFiles.find(f => f.id === id);
    if (!fileToDelete) return;

    const fileTarikh = fileToDelete.tarikh;

    // Find all substitutions linked to this file's date
    const subsToRemove = substitutions.filter(s => s.tarikh === fileTarikh);

    // Decrement stats for the teachers involved in those substitutions
    setTeachers(prevTeachers => {
      return prevTeachers.map(teacher => {
        let updated = { ...teacher };
        subsToRemove.forEach(sub => {
          if (teacher.nama === sub.guruMengganti) {
            updated.jumlahMengganti = Math.max(0, updated.jumlahMengganti - 1);
          }
          if (teacher.nama === sub.guruDiganti) {
            updated.jumlahDiganti = Math.max(0, updated.jumlahDiganti - 1);
          }
        });
        return updated;
      });
    });

    // Remove the substitutions
    setSubstitutions(prev => prev.filter(s => s.tarikh !== fileTarikh));

    // Remove the file itself
    setMmiFiles(prev => prev.filter(f => f.id !== id));
  };

  // Action: Add substitution transaction (automatically increments teacher counts too!)
  const handleAddSubstitution = (newSub: Substitution) => {
    setSubstitutions(prev => [...prev, newSub]);

    // Update teacher counts in teachers list
    setTeachers(prevTeachers => {
      return prevTeachers.map(teacher => {
        let updated = { ...teacher };
        if (teacher.nama === newSub.guruMengganti) {
          updated.jumlahMengganti += 1;
        }
        if (teacher.nama === newSub.guruDiganti) {
          updated.jumlahDiganti += 1;
        }
        return updated;
      });
    });
  };

  // Action: Update existing substitution (adjusts teacher stats accurately)
  const handleUpdateSubstitution = (updatedSub: Substitution) => {
    const originalSub = substitutions.find(s => s.id === updatedSub.id);
    if (!originalSub) return;

    setSubstitutions(prev => prev.map(s => s.id === updatedSub.id ? updatedSub : s));

    setTeachers(prevTeachers => {
      return prevTeachers.map(teacher => {
        let updated = { ...teacher };
        
        // Remove old counts
        if (teacher.nama === originalSub.guruMengganti) {
          updated.jumlahMengganti = Math.max(0, updated.jumlahMengganti - 1);
        }
        if (teacher.nama === originalSub.guruDiganti) {
          updated.jumlahDiganti = Math.max(0, updated.jumlahDiganti - 1);
        }

        // Add new counts
        if (teacher.nama === updatedSub.guruMengganti) {
          updated.jumlahMengganti += 1;
        }
        if (teacher.nama === updatedSub.guruDiganti) {
          updated.jumlahDiganti += 1;
        }

        return updated;
      });
    });
  };

  // Action: Delete single substitution (adjusts teacher stats accurately)
  const handleDeleteSubstitution = (subId: string) => {
    const originalSub = substitutions.find(s => s.id === subId);
    if (!originalSub) return;

    setSubstitutions(prev => prev.filter(s => s.id !== subId));

    setTeachers(prevTeachers => {
      return prevTeachers.map(teacher => {
        let updated = { ...teacher };
        if (teacher.nama === originalSub.guruMengganti) {
          updated.jumlahMengganti = Math.max(0, updated.jumlahMengganti - 1);
        }
        if (teacher.nama === originalSub.guruDiganti) {
          updated.jumlahDiganti = Math.max(0, updated.jumlahDiganti - 1);
        }
        return updated;
      });
    });
  };

  // Action: Direct manual update of teacher counts in Analisis Guru
  const handleUpdateTeacher = (id: string, jumlahMengganti: number, jumlahDiganti: number) => {
    setTeachers(prev => prev.map(t => {
      if (t.id === id) {
        return {
          ...t,
          jumlahMengganti,
          jumlahDiganti
        };
      }
      return t;
    }));
  };

  // Action: Clear / Reset all data completely for a clean launch
  const handleResetAllData = () => {
    localStorage.removeItem("school360_mmi_files_v3");
    localStorage.removeItem("school360_substitutions_v3");
    localStorage.removeItem("school360_teachers_v3");
    localStorage.removeItem("school360_mmi_files");
    localStorage.removeItem("school360_substitutions");
    localStorage.removeItem("school360_teachers");
    
    setMmiFiles([]);
    setSubstitutions([]);
    setTeachers(getInitialTeachers());
  };

  return (
    <div 
      id="school360-root-application"
      className="min-h-screen flex text-slate-800 bg-futuristic scanline-effect"
    >
      {/* SIDEBAR NAVIGATION (ROYAL BLUE / GOLD GLOW) */}
      <aside 
        id="school360-main-sidebar"
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-[#0c2340] border-r-2 border-[#c5a850] p-5 flex flex-col justify-between transform transition-transform duration-300 md:translate-x-0 md:static ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="space-y-8">
          {/* Brand header */}
          <div className="flex items-center justify-between pb-4 border-b border-blue-900/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#c5a850] to-[#e2b23d] rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(197,168,80,0.4)]">
                <span className="font-bold text-[#0c2340] text-lg">360</span>
              </div>
              <div>
                <h2 className="text-white font-black tracking-tighter text-lg leading-none">SCHOOL360</h2>
                <span className="text-[10px] text-[#c5a850] font-bold tracking-[0.2em] uppercase block mt-1">SK PAYANG</span>
              </div>
            </div>
            {/* Mobile close sidebar */}
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden p-1.5 rounded-lg bg-blue-950 border border-blue-900 text-slate-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5" id="sidebar-navigation-menu">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block pl-2 mb-2">MENU SISTEM</span>
            
            {/* 1. Dashboard Utama */}
            <button
              onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center justify-between py-3 px-4 text-left cursor-pointer transition-all ${
                activeTab === 'dashboard'
                  ? "bg-gradient-to-r from-[#c5a850]/20 to-transparent border-l-4 border-[#c5a850] text-[#c5a850] rounded-r-md font-bold"
                  : "text-slate-300 hover:text-white hover:bg-blue-950/40 rounded-md"
              }`}
            >
              <span className="flex items-center gap-3">
                <School className={`w-4 h-4 ${activeTab === 'dashboard' ? 'text-[#c5a850]' : 'text-slate-400'}`} />
                <span className="text-sm">1. DASHBOARD UTAMA</span>
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* 2. Data MMI */}
            <button
              onClick={() => { setActiveTab('mmi'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center justify-between py-3 px-4 text-left cursor-pointer transition-all ${
                activeTab === 'mmi'
                  ? "bg-gradient-to-r from-[#c5a850]/20 to-transparent border-l-4 border-[#c5a850] text-[#c5a850] rounded-r-md font-bold"
                  : "text-slate-300 hover:text-white hover:bg-blue-950/40 rounded-md"
              }`}
            >
              <span className="flex items-center gap-3">
                <Database className={`w-4 h-4 ${activeTab === 'mmi' ? 'text-[#c5a850]' : 'text-slate-400'}`} />
                <span className="text-sm">2. DATA MMI</span>
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* 3. Analisis Guru */}
            <button
              onClick={() => { setActiveTab('guru'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center justify-between py-3 px-4 text-left cursor-pointer transition-all ${
                activeTab === 'guru'
                  ? "bg-gradient-to-r from-[#c5a850]/20 to-transparent border-l-4 border-[#c5a850] text-[#c5a850] rounded-r-md font-bold"
                  : "text-slate-300 hover:text-white hover:bg-blue-950/40 rounded-md"
              }`}
            >
              <span className="flex items-center gap-3">
                <Users className={`w-4 h-4 ${activeTab === 'guru' ? 'text-[#c5a850]' : 'text-slate-400'}`} />
                <span className="text-sm">3. ANALISIS GURU</span>
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* 4. Analitik */}
            <button
              onClick={() => { setActiveTab('analitik'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center justify-between py-3 px-4 text-left cursor-pointer transition-all ${
                activeTab === 'analitik'
                  ? "bg-gradient-to-r from-[#c5a850]/20 to-transparent border-l-4 border-[#c5a850] text-[#c5a850] rounded-r-md font-bold"
                  : "text-slate-300 hover:text-white hover:bg-blue-950/40 rounded-md"
              }`}
            >
              <span className="flex items-center gap-3">
                <BarChart2 className={`w-4 h-4 ${activeTab === 'analitik' ? 'text-[#c5a850]' : 'text-slate-400'}`} />
                <span className="text-sm">4. ANALITIK</span>
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </nav>
        </div>

        {/* Logged in User Profile Info (Pencintahijab@gmail.com with Premium Royal Blue & Gold theme) */}
        <div className="pt-6 border-t border-blue-900 space-y-3">
          <div className="flex items-center space-x-3 p-3 bg-blue-950/40 rounded-xl border border-blue-900/30">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#c5a850] to-[#e2b23d] p-[2px] shadow-[0_0_10px_rgba(197,168,80,0.3)]">
              <div className="w-full h-full rounded-full bg-[#0c2340] flex items-center justify-center text-xs font-bold text-[#c5a850]">AD</div>
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-bold text-white truncate uppercase" title="Pencintahijab@gmail.com">Pencintahijab</p>
              <p className="text-[10px] text-[#c5a850] font-bold truncate">SK PAYANG</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/5 p-1.5 rounded border border-emerald-500/10">
            <span>DATABASE SYNC</span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              ONLINE
            </span>
          </div>

          {/* Interactive safe stateful database purge button */}
          {isResetConfirm ? (
            <div className="flex gap-1.5 mt-2 bg-rose-950/20 p-1.5 rounded border border-rose-500/30 animate-pulse">
              <button 
                onClick={() => {
                  handleResetAllData();
                  setIsResetConfirm(false);
                }}
                className="flex-1 py-1 px-2 rounded bg-rose-600 hover:bg-rose-500 text-white text-[9px] font-black tracking-wider uppercase transition-all cursor-pointer text-center"
              >
                Pasti, Padam!
              </button>
              <button 
                onClick={() => setIsResetConfirm(false)}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 text-[9px] font-bold uppercase transition-all cursor-pointer text-center"
              >
                Batal
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsResetConfirm(true)}
              className="w-full mt-2 py-2 rounded bg-rose-950/20 hover:bg-rose-950/40 border border-rose-500/20 hover:border-rose-500 text-rose-400 hover:text-rose-300 text-[9px] font-black tracking-widest uppercase transition-all cursor-pointer text-center"
            >
              🗑️ SET SEMULA (PADAM DATA)
            </button>
          )}
        </div>
      </aside>

      {/* MAIN VIEWPORT BODY */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* TOP STATUS HEADER BAR */}
        <header 
          id="school360-top-header"
          className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur px-6 flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            {/* Mobile hamburger menu toggle */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden p-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            {/* Static Telemetry Info */}
            <div className="hidden sm:flex items-center gap-3 text-slate-400 text-xs font-mono font-bold">
              <span className="text-slate-400">STATION:</span>
              <span className="text-slate-700">SK PAYANG LAHAD DATU</span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-400">STATUS:</span>
              <span className="glow-text-red animate-pulse font-extrabold text-xs">SECURE LINK (NEON ACTIVE)</span>
            </div>
          </div>

          {/* Real-time dynamic clock */}
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 font-mono">
            <Clock className="w-4 h-4 text-[#c5a850]" />
            <span>{systemTime || "Memuatkan masa..."}</span>
          </div>
        </header>

        {/* SCROLLABLE CENTRAL VIEW AREA */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 relative">
          {/* Elegant Royal Blue & Gold Theme display header */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-4 pb-6 border-b border-slate-200">
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2 text-[#c5a850] font-bold text-xs tracking-widest">
                <span className="w-8 h-[2px] bg-[#c5a850]"></span>
                <span>OFFICIAL PORTAL</span>
              </div>
              <h2 className="text-3xl font-black text-[#0c2340] tracking-tight">SK PAYANG <span className="text-[#c5a850]">|</span> SABAH</h2>
              <div className="flex flex-wrap items-center text-slate-500 text-xs font-medium gap-3">
                <span className="flex items-center">
                  <svg className="w-3.5 h-3.5 mr-1.5 text-[#c5a850]" fill="currentColor" viewBox="0 0 20 20"><path d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"></path></svg> 
                  Peti Surat 61345, 91122 Lahad Datu, Sabah
                </span>
                <span className="px-2 py-0.5 rounded bg-[#0c2340]/5 text-[#0c2340] font-mono text-[11px] font-bold border border-[#0c2340]/15">
                  Kod Sekolah: XBA3149
                </span>
                <span className="flex items-center text-emerald-700 font-semibold">
                  <svg className="w-3.5 h-3.5 mr-1.5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20"><path d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"></path></svg> 
                  Sistem MMI Premium
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={() => {
                  const latestDate = mmiFiles.length > 0 
                    ? [...mmiFiles].sort((a, b) => b.tarikh.localeCompare(a.tarikh))[0].tarikh 
                    : new Date().toISOString().split('T')[0];
                  setPrintReportDate(latestDate);
                  setShowPrintReport(true);
                }}
                className="bg-slate-900 hover:bg-slate-800 text-white border border-slate-750 text-xs font-black py-2.5 px-4 rounded-lg transition-all cursor-pointer shadow-lg flex items-center gap-1.5"
                title="Cetak Laporan MMI Rasmi (Mod Hitam Putih)"
              >
                🖨️ CETAK LAPORAN MMI
              </button>
              <button 
                onClick={() => setActiveTab('mmi')}
                className="btn-warna-warni text-xs font-black py-2.5 px-5 rounded-lg transition-all cursor-pointer shadow-lg"
              >
                ⚡ KEMASKINI DATA MMI
              </button>
              <button 
                onClick={() => setActiveTab('analitik')}
                className="btn-warna-warni text-xs font-black py-2.5 px-4 rounded-lg transition-all cursor-pointer shadow-lg"
              >
                📊 LIHAT ANALITIK
              </button>
            </div>
          </div>

          {activeTab === 'dashboard' && (
            <DashboardUtama 
              schoolInfo={schoolInfo}
              teachers={teachers}
              mmiFiles={mmiFiles}
              substitutions={substitutions}
            />
          )}

          {activeTab === 'mmi' && (
            <DataMMI 
              mmiFiles={mmiFiles}
              onAddMMIFile={handleAddMMIFile}
              onUpdateMMIFile={handleUpdateMMIFile}
              onDeleteMMIFile={handleDeleteMMIFile}
              onUpdateMMIFileDate={handleUpdateMMIFileDate}
              substitutions={substitutions}
              onAddSubstitution={handleAddSubstitution}
              onUpdateSubstitution={handleUpdateSubstitution}
              onDeleteSubstitution={handleDeleteSubstitution}
              onCetakLaporan={(date) => {
                setPrintReportDate(date);
                setShowPrintReport(true);
              }}
            />
          )}

          {activeTab === 'guru' && (
            <AnalisisGuru 
              teachers={teachers}
              onUpdateTeacher={handleUpdateTeacher}
            />
          )}

          {activeTab === 'analitik' && (
            <Analitik 
              mmiFiles={mmiFiles}
              substitutions={substitutions}
              teachers={teachers}
            />
          )}

          {/* Cetak Laporan Modal Overlay */}
          <CetakLaporan 
            schoolInfo={schoolInfo}
            teachers={teachers}
            mmiFiles={mmiFiles}
            substitutions={substitutions}
            isOpen={showPrintReport}
            onClose={() => setShowPrintReport(false)}
            initialDate={printReportDate}
          />

          {/* Decorative Elegant light theme footer info */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2 opacity-50 text-[9px] font-bold tracking-[0.25em] uppercase pt-8 pb-4 pointer-events-none border-t border-slate-200">
            <span className="text-slate-500">School360 Enterprise Management System</span>
            <span className="text-slate-500">SK Payang Lahad Datu © 2026</span>
            <span className="text-slate-400">Secure Data Stream Active</span>
          </div>
        </main>
      </div>
    </div>
  );
}
