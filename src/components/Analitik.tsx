import React, { useState, useMemo } from "react";
import { 
  BarChart2, 
  Calendar, 
  Filter, 
  Users, 
  FileText, 
  TrendingUp, 
  Award, 
  Clock, 
  HelpCircle,
  Database,
  ArrowUpDown,
  BookOpen,
  PieChart,
  User,
  Info
} from "lucide-react";
import { MMIFile, Substitution, Teacher, SENARAI_GURU_ASAL, SENARAI_KELAS } from "../types";

interface AnalitikProps {
  mmiFiles: MMIFile[];
  substitutions: Substitution[];
  teachers: Teacher[];
}

export default function Analitik({ mmiFiles, substitutions, teachers }: AnalitikProps) {
  // Filters State
  const [filterTarikh, setFilterTarikh] = useState<string>("");
  const [filterBulan, setFilterBulan] = useState<string>("");
  const [filterTahun, setFilterTahun] = useState<string>("");
  
  // Interactive sorting & limit states
  const [sortBy, setSortBy] = useState<'mengganti' | 'diganti' | 'jumlah'>('mengganti');
  const [limitCount, setLimitCount] = useState<number>(10);
  const [selectedTeacherName, setSelectedTeacherName] = useState<string | null>(null);
  const [hoveredBar, setHoveredBar] = useState<{ name: string; type: 'mengganti' | 'diganti'; value: number; x: number; y: number } | null>(null);

  // Clear all filters
  const resetFilters = () => {
    setFilterTarikh("");
    setFilterBulan("");
    setFilterTahun("");
    setSelectedTeacherName(null);
  };

  // List of unique dates for dropdown
  const uniqueDates = useMemo(() => {
    const dates = new Set(substitutions.map(s => s.tarikh));
    return Array.from(dates).sort();
  }, [substitutions]);

  // List of months for dropdown
  const monthsList = [
    { value: "01", label: "Januari" },
    { value: "02", label: "Februari" },
    { value: "03", label: "Mac" },
    { value: "04", label: "April" },
    { value: "05", label: "Mei" },
    { value: "06", label: "Jun" },
    { value: "07", label: "Kulai" },
    { value: "08", label: "Ogos" },
    { value: "09", label: "September" },
    { value: "10", label: "Oktober" },
    { value: "11", label: "November" },
    { value: "12", label: "Disember" }
  ];

  // Filter substitutions
  const filteredSubstitutions = useMemo(() => {
    return substitutions.filter(sub => {
      if (filterTarikh && sub.tarikh !== filterTarikh) return false;
      if (filterBulan) {
        const month = sub.tarikh.split("-")[1];
        if (month !== filterBulan) return false;
      }
      if (filterTahun) {
        const year = sub.tarikh.split("-")[0];
        if (year !== filterTahun) return false;
      }
      return true;
    });
  }, [substitutions, filterTarikh, filterBulan, filterTahun]);

  // Calculate dynamic teacher counts from filtered data
  const teacherChartData = useMemo(() => {
    const dataMap: Record<string, { nama: string; mengganti: number; diganti: number; total: number }> = {};
    
    // Initialize with all original teachers to ensure no blank gaps
    SENARAI_GURU_ASAL.forEach(name => {
      dataMap[name] = { nama: name, mengganti: 0, diganti: 0, total: 0 };
    });

    // Count replacing and being replaced
    filteredSubstitutions.forEach(sub => {
      if (dataMap[sub.guruMengganti]) {
        dataMap[sub.guruMengganti].mengganti += 1;
        dataMap[sub.guruMengganti].total += 1;
      }
      if (dataMap[sub.guruDiganti]) {
        dataMap[sub.guruDiganti].diganti += 1;
        dataMap[sub.guruDiganti].total += 1;
      }
    });

    const resultList = Object.values(dataMap);

    // Sort accordingly
    if (sortBy === 'mengganti') {
      resultList.sort((a, b) => b.mengganti - a.mengganti || b.diganti - a.diganti);
    } else if (sortBy === 'diganti') {
      resultList.sort((a, b) => b.diganti - a.diganti || b.mengganti - a.mengganti);
    } else {
      resultList.sort((a, b) => b.total - a.total);
    }

    // Return limited items
    return resultList.slice(0, limitCount);
  }, [filteredSubstitutions, sortBy, limitCount]);

  // If selected teacher is null, auto-select the highest in the list
  const activeTeacher = useMemo(() => {
    if (selectedTeacherName) {
      const found = teacherChartData.find(t => t.nama === selectedTeacherName);
      if (found) return found;
    }
    return teacherChartData[0] || null;
  }, [selectedTeacherName, teacherChartData]);

  // Top active metrics
  const totalSubstitutionsCount = filteredSubstitutions.length;
  
  const mostActiveReplacing = useMemo(() => {
    const list = [...teacherChartData].sort((a, b) => b.mengganti - a.mengganti);
    return list[0]?.mengganti > 0 ? list[0] : null;
  }, [teacherChartData]);

  const mostActiveReplaced = useMemo(() => {
    const list = [...teacherChartData].sort((a, b) => b.diganti - a.diganti);
    return list[0]?.diganti > 0 ? list[0] : null;
  }, [teacherChartData]);

  // SVG Chart sizing configurations
  const svgHeight = 320;
  const paddingLeft = 140;
  const paddingRight = 40;
  const paddingTop = 20;
  const paddingBottom = 40;
  
  // Weekly MMI frequency trend calculations
  const weeklyTrendData = useMemo(() => {
    const weekCounts: Record<string, number> = {
      "Minggu 1": 0,
      "Minggu 2": 0,
      "Minggu 3": 0,
      "Minggu 4": 0,
      "Minggu 5": 0,
      "Minggu 6": 0
    };

    filteredSubstitutions.forEach(sub => {
      if (!sub.tarikh) return;
      const parts = sub.tarikh.split("-");
      const dayNum = parseInt(parts[2] || "1", 10);
      let w = "Minggu 1";
      if (dayNum > 28) w = "Minggu 5";
      else if (dayNum > 21) w = "Minggu 4";
      else if (dayNum > 14) w = "Minggu 3";
      else if (dayNum > 7) w = "Minggu 2";
      else w = "Minggu 1";

      if (weekCounts[w] !== undefined) {
        weekCounts[w] += 1;
      }
    });

    return Object.entries(weekCounts).map(([minggu, jumlah]) => ({
      minggu,
      jumlah
    }));
  }, [filteredSubstitutions]);

  const maxWeeklyCount = useMemo(() => {
    const max = Math.max(...weeklyTrendData.map(w => w.jumlah), 1);
    return Math.max(max + 2, 5);
  }, [weeklyTrendData]);

  const peakWeek = useMemo(() => {
    const sorted = [...weeklyTrendData].sort((a, b) => b.jumlah - a.jumlah);
    return sorted[0];
  }, [weeklyTrendData]);

  const totalWeeklySubstitutions = useMemo(() => {
    return weeklyTrendData.reduce((acc, curr) => acc + curr.jumlah, 0);
  }, [weeklyTrendData]);
  
  // Find max value to calibrate scales
  const maxVal = useMemo(() => {
    const max = Math.max(...teacherChartData.map(t => Math.max(t.mengganti, t.diganti)), 1);
    return Math.ceil(max / 5) * 5; // Round to nearest 5
  }, [teacherChartData]);

  return (
    <div className="space-y-6 animate-fade-in" id="analitik-dashboard-container">
      {/* Title Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center space-x-2 text-[#c5a850] font-bold text-xs tracking-widest mb-1">
          <span className="w-6 h-[2px] bg-[#c5a850]"></span>
          <span>DASHBOARD ANALITIK</span>
        </div>
        <h2 className="text-2xl font-black text-[#0c2340] uppercase">Analisis Perbandingan Gantian Instruksional</h2>
        <p className="text-xs text-slate-500 mt-1">
          Modul carta interaktif membandingkan kekerapan guru mengganti kelas vs guru diganti kerana cuti/tugas luar.
        </p>
      </div>

      {/* GRAF GARISAN: TREND KEKERAPAN MMI MENGIKUT MINGGU */}
      <div className="rounded-xl glass-panel p-5 space-y-4" id="mmi-weekly-line-chart-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="space-y-0.5">
            <h3 className="text-xs font-black tracking-wider text-[#0c2340] uppercase flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#c5a850]" />
              TREND KEKERAPAN MMI MENGIKUT MINGGU (POLA KETIDAKHADIRAN GURU)
            </h3>
            <p className="text-[11px] text-slate-500">
              Graf garisan trend yang menunjukkan corak turun naik kekerapan penggantian MMI dari minggu ke minggu untuk kemudahan pemantauan pentadbir.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="px-3 py-1 bg-amber-50 border border-amber-200/60 rounded-lg text-right">
              <span className="text-[9px] font-bold text-slate-400 block uppercase">Puncak Kekerapan</span>
              <span className="text-xs font-black text-[#0c2340]">
                {peakWeek ? `${peakWeek.minggu} (${peakWeek.jumlah} Kali)` : 'Tiada Data'}
              </span>
            </div>
            <div className="px-3 py-1 bg-blue-50 border border-blue-200/60 rounded-lg text-right">
              <span className="text-[9px] font-bold text-slate-400 block uppercase">Jumlah Keseluruhan</span>
              <span className="text-xs font-black text-[#0c2340]">{totalWeeklySubstitutions} Rekod</span>
            </div>
          </div>
        </div>

        {/* SVG LINE CHART */}
        {(() => {
          const chartW = 760;
          const chartH = 190;
          const padL = 45;
          const padR = 25;
          const padT = 30;
          const padB = 35;
          const usableW = chartW - padL - padR;
          const usableH = chartH - padT - padB;

          const points = weeklyTrendData.map((item, idx) => {
            const x = padL + (idx / (weeklyTrendData.length - 1 || 1)) * usableW;
            const ratio = item.jumlah / maxWeeklyCount;
            const y = padT + usableH - (ratio * usableH);
            return { x, y, ...item };
          });

          const pathD = points.length > 0 
            ? points.reduce((acc, p, i) => i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, "")
            : "";

          const areaD = points.length > 0
            ? `${pathD} L ${points[points.length - 1].x} ${padT + usableH} L ${points[0].x} ${padT + usableH} Z`
            : "";

          // Y-axis grid ticks (4 levels)
          const yTicks = [0, Math.round(maxWeeklyCount * 0.33), Math.round(maxWeeklyCount * 0.66), maxWeeklyCount];

          return (
            <div className="w-full overflow-x-auto bg-slate-50/70 rounded-xl border border-slate-200/70 p-3">
              <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full min-w-[600px] h-auto font-sans">
                <defs>
                  <linearGradient id="lineAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0c2340" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#c5a850" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="strokeLineGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#0c2340" />
                    <stop offset="50%" stopColor="#1a4175" />
                    <stop offset="100%" stopColor="#c5a850" />
                  </linearGradient>
                </defs>

                {/* Y-Axis Gridlines & Labels */}
                {yTicks.map((tickVal, i) => {
                  const tickY = padT + usableH - ((tickVal / maxWeeklyCount) * usableH);
                  return (
                    <g key={i}>
                      <line 
                        x1={padL} 
                        y1={tickY} 
                        x2={chartW - padR} 
                        y2={tickY} 
                        stroke="#e2e8f0" 
                        strokeDasharray="4 4" 
                        strokeWidth="1" 
                      />
                      <text 
                        x={padL - 10} 
                        y={tickY + 3} 
                        className="text-[9px] font-bold font-mono text-slate-400 fill-current" 
                        textAnchor="end"
                      >
                        {tickVal}
                      </text>
                    </g>
                  );
                })}

                {/* Gradient Area under line */}
                {areaD && (
                  <path d={areaD} fill="url(#lineAreaGrad)" />
                )}

                {/* Main Trend Line */}
                {pathD && (
                  <path 
                    d={pathD} 
                    fill="none" 
                    stroke="url(#strokeLineGrad)" 
                    strokeWidth="3.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="transition-all duration-500"
                  />
                )}

                {/* Data Nodes & Labels */}
                {points.map((pt, idx) => (
                  <g key={idx} className="group cursor-pointer">
                    {/* Vertical guide line on node */}
                    <line 
                      x1={pt.x} 
                      y1={padT} 
                      x2={pt.x} 
                      y2={padT + usableH} 
                      stroke="#0c2340" 
                      strokeWidth="1" 
                      strokeDasharray="2 2" 
                      className="opacity-0 group-hover:opacity-40 transition-opacity"
                    />

                    {/* Node Dot Outer Ring */}
                    <circle 
                      cx={pt.x} 
                      cy={pt.y} 
                      r="6" 
                      fill="#ffffff" 
                      stroke="#0c2340" 
                      strokeWidth="2.5" 
                      className="transition-transform group-hover:scale-150"
                    />

                    {/* Node Dot Inner Core */}
                    <circle 
                      cx={pt.x} 
                      cy={pt.y} 
                      r="2.5" 
                      fill="#c5a850" 
                    />

                    {/* Data Value Badge above dot */}
                    <rect 
                      x={pt.x - 14} 
                      y={pt.y - 24} 
                      width="28" 
                      height="16" 
                      rx="4" 
                      fill="#0c2340" 
                      className="group-hover:fill-[#c5a850] transition-colors"
                    />
                    <text 
                      x={pt.x} 
                      y={pt.y - 13} 
                      className="text-[9px] font-black text-white fill-current font-mono" 
                      textAnchor="middle"
                    >
                      {pt.jumlah}
                    </text>

                    {/* X-Axis Label (Minggu 1, Minggu 2, etc.) */}
                    <text 
                      x={pt.x} 
                      y={padT + usableH + 20} 
                      className="text-[10px] font-bold text-slate-600 group-hover:text-[#0c2340] fill-current" 
                      textAnchor="middle"
                    >
                      {pt.minggu}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          );
        })()}

        <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold pt-1 border-t border-slate-100">
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0c2340] inline-block"></span>
            Garis Trend Kekerapan MMI Bertindak Balas Mengikut Filter
          </span>
          <span className="text-slate-400 italic">Data dikemas kini secara automatik berdasarkan pendaftaran jadual ganti.</span>
        </div>
      </div>

      {/* FILTER PANEL */}
      <div className="rounded-xl glass-panel p-4" id="analitik-filter-block">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[#0c2340]">
            <Filter className="w-4 h-4 text-[#c5a850]" />
            <span className="text-xs font-black tracking-widest uppercase">Tapisan Masa & Had Paparan</span>
          </div>
          {(filterTarikh || filterBulan || filterTahun) && (
            <button 
              onClick={resetFilters}
              className="text-xs text-[#b38e3f] hover:text-[#0c2340] font-bold uppercase tracking-wider underline cursor-pointer"
            >
              Kosongkan Penapis
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-3">
          {/* Tarikh */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Tarikh Spesifik</label>
            <select
              value={filterTarikh}
              onChange={(e) => {
                setFilterTarikh(e.target.value);
                setFilterBulan("");
              }}
              className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2 text-xs text-slate-800 focus:outline-none focus:border-[#c5a850] font-semibold"
            >
              <option value="">Semua Tarikh</option>
              {uniqueDates.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Bulan */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Bulan</label>
            <select
              value={filterBulan}
              onChange={(e) => {
                setFilterBulan(e.target.value);
                setFilterTarikh("");
              }}
              className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2 text-xs text-slate-800 focus:outline-none focus:border-[#c5a850] font-semibold"
            >
              <option value="">Semua Bulan</option>
              {monthsList.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Tahun */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Tahun</label>
            <select
              value={filterTahun}
              onChange={(e) => setFilterTahun(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2 text-xs text-slate-800 focus:outline-none focus:border-[#c5a850] font-semibold"
            >
              <option value="">Semua Tahun</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
            </select>
          </div>

          {/* Isihan Carta */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Susun Mengikut</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2 text-xs text-slate-800 focus:outline-none focus:border-[#c5a850] font-semibold text-[#0c2340]"
            >
              <option value="mengganti">🔥 Paling Banyak Mengganti</option>
              <option value="diganti">💤 Paling Banyak Diganti</option>
              <option value="jumlah">📊 Jumlah Aktiviti Tertinggi</option>
            </select>
          </div>

          {/* Limit Bar Count */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Had Bilangan Guru</label>
            <select
              value={limitCount}
              onChange={(e) => setLimitCount(Number(e.target.value))}
              className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2 text-xs text-slate-800 focus:outline-none focus:border-[#c5a850] font-semibold"
            >
              <option value={5}>Top 5 Guru</option>
              <option value={10}>Top 10 Guru</option>
              <option value={15}>Top 15 Guru</option>
              <option value={30}>Semua Guru</option>
            </select>
          </div>
        </div>
      </div>

      {/* HIGHLIGHT KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="analytics-highlight-cards">
        <div className="bg-[#0c2340] text-white rounded-xl p-4 border border-[#c5a850]/40 flex items-center justify-between shadow-md">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-[#c5a850] uppercase">Jumlah Gantian (Instruksional)</span>
            <h3 className="text-2xl font-black mt-1 text-white">{totalSubstitutionsCount}</h3>
            <p className="text-[10px] text-slate-300 mt-1">Sesi kelas yang berjaya dipelihara</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-950 flex items-center justify-center text-[#c5a850] border border-[#c5a850]/20">
            <Database className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Penyumbang Mengganti Tertinggi</span>
            <h3 className="text-lg font-black mt-1 text-[#0c2340] truncate max-w-[180px]">
              {mostActiveReplacing ? mostActiveReplacing.nama : "Tiada"}
            </h3>
            <p className="text-[10px] text-emerald-600 font-bold mt-1">
              {mostActiveReplacing ? `Menyelamatkan ${mostActiveReplacing.mengganti} kelas` : "N/A"}
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
            <Award className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Kekerapan Cuti/Tugas Luar Terbanyak</span>
            <h3 className="text-lg font-black mt-1 text-[#b38e3f] truncate max-w-[180px]">
              {mostActiveReplaced ? mostActiveReplaced.nama : "Tiada"}
            </h3>
            <p className="text-[10px] text-amber-600 font-bold mt-1">
              {mostActiveReplaced ? `Diganti sebanyak ${mostActiveReplaced.diganti} kali` : "N/A"}
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-[#b38e3f] border border-amber-100">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* DYNAMIC SVG CHART CONTAINER & TEACHER SELECTION PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* INTERACTIVE COMPREHENSIVE CHART (8 COLS) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 p-5 shadow-sm relative overflow-visible">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-4">
            <div className="flex items-center space-x-2">
              <BarChart2 className="w-4 h-4 text-[#c5a850]" />
              <h4 className="text-xs font-black tracking-wider text-[#0c2340] uppercase">
                Perbandingan Mengganti (Biru) vs Diganti (Emas)
              </h4>
            </div>
            
            <div className="flex items-center space-x-3 text-[10px] font-bold">
              <span className="flex items-center space-x-1.5">
                <span className="w-3 h-3 bg-[#0c2340] rounded"></span>
                <span className="text-slate-600">Mengganti</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-3 h-3 bg-[#c5a850] rounded"></span>
                <span className="text-slate-600">Diganti</span>
              </span>
            </div>
          </div>

          {/* DYNAMIC HORIZONTAL SVG GRAPH */}
          <div className="relative w-full" style={{ minHeight: `${teacherChartData.length * 36 + 60}px` }}>
            <svg 
              viewBox={`0 0 600 ${teacherChartData.length * 36 + 60}`}
              className="w-full h-full font-sans select-none"
            >
              {/* Vertical Guide Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                const value = Math.round(maxVal * ratio);
                const xPos = paddingLeft + (420 * ratio);
                return (
                  <g key={i}>
                    <line 
                      x1={xPos} 
                      y1={paddingTop} 
                      x2={xPos} 
                      y2={teacherChartData.length * 36 + paddingTop} 
                      stroke="#e2e8f0" 
                      strokeDasharray="3 3"
                      strokeWidth={1}
                    />
                    <text 
                      x={xPos} 
                      y={teacherChartData.length * 36 + paddingTop + 15} 
                      className="text-[9px] font-bold font-mono text-slate-400 fill-current"
                      textAnchor="middle"
                    >
                      {value}
                    </text>
                  </g>
                );
              })}

              {/* Rows */}
              {teacherChartData.map((item, index) => {
                const yPos = paddingTop + (index * 36);
                
                // Calculate Width relative to scale
                const widthMengganti = (item.mengganti / maxVal) * 420;
                const widthDiganti = (item.diganti / maxVal) * 420;
                
                const isSelected = activeTeacher?.nama === item.nama;

                return (
                  <g 
                    key={item.nama}
                    className="cursor-pointer group"
                    onClick={() => setSelectedTeacherName(item.nama)}
                  >
                    {/* Background Highlight on Hover / Selection */}
                    <rect 
                      x={4}
                      y={yPos - 4}
                      width={592}
                      height={32}
                      rx={6}
                      className={`fill-current transition-all duration-150 ${
                        isSelected 
                          ? "text-blue-50/50 stroke-blue-200/40" 
                          : "text-transparent group-hover:text-slate-50/70"
                      }`}
                      stroke={isSelected ? "#0c2340" : "transparent"}
                      strokeWidth={isSelected ? 1 : 0}
                    />

                    {/* Teacher short label */}
                    <text 
                      x={paddingLeft - 12}
                      y={yPos + 16}
                      className={`text-[10px] font-bold fill-current text-right ${
                        isSelected ? "text-[#0c2340] font-black" : "text-slate-600 group-hover:text-[#0c2340]"
                      }`}
                      textAnchor="end"
                    >
                      {item.nama.length > 20 ? `${item.nama.substring(0, 18)}...` : item.nama}
                    </text>

                    {/* Blue Bar (Mengganti) */}
                    <rect 
                      x={paddingLeft}
                      y={yPos + 2}
                      width={Math.max(widthMengganti, 2)}
                      height={10}
                      rx={2}
                      className="transition-all duration-300"
                      fill={isSelected ? "#0c2340" : "#1c4a8a"}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHoveredBar({ name: item.nama, type: 'mengganti', value: item.mengganti, x: rect.left, y: rect.top });
                      }}
                      onMouseLeave={() => setHoveredBar(null)}
                    />
                    {item.mengganti > 0 && (
                      <text
                        x={paddingLeft + widthMengganti + 6}
                        y={yPos + 10}
                        className="text-[9px] font-bold font-mono text-[#0c2340] fill-current"
                      >
                        {item.mengganti}
                      </text>
                    )}

                    {/* Gold Bar (Diganti) */}
                    <rect 
                      x={paddingLeft}
                      y={yPos + 14}
                      width={Math.max(widthDiganti, 2)}
                      height={10}
                      rx={2}
                      className="transition-all duration-300"
                      fill={isSelected ? "#c5a850" : "#dcae5b"}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHoveredBar({ name: item.nama, type: 'diganti', value: item.diganti, x: rect.left, y: rect.top });
                      }}
                      onMouseLeave={() => setHoveredBar(null)}
                    />
                    {item.diganti > 0 && (
                      <text
                        x={paddingLeft + widthDiganti + 6}
                        y={yPos + 22}
                        className="text-[9px] font-bold font-mono text-[#c5a850] fill-current"
                      >
                        {item.diganti}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Custom Tooltip absolute block */}
            {hoveredBar && (
              <div 
                className="absolute z-10 bg-slate-900 text-white p-2.5 rounded-lg text-xs font-semibold shadow-xl space-y-0.5 pointer-events-none"
                style={{
                  left: `${paddingLeft + 10}px`,
                  top: `${Math.max(0, teacherChartData.findIndex(t => t.nama === hoveredBar.name) * 36 + 10)}px`
                }}
              >
                <p className="text-[10px] font-bold text-slate-400 uppercase">{hoveredBar.name}</p>
                <p className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${hoveredBar.type === 'mengganti' ? 'bg-sky-400' : 'bg-yellow-400'}`}></span>
                  <span>{hoveredBar.type === 'mengganti' ? 'Mengganti' : 'Diganti'}:</span>
                  <span className="font-black text-white">{hoveredBar.value} kali</span>
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-2 text-[10px] text-slate-500 font-bold">
            <Info className="w-3.5 h-3.5 text-[#c5a850] shrink-0" />
            <span>Klik pada mana-mana baris guru di dalam carta di atas untuk memaparkan ulasan prestasi & butiran rekod guru di panel sebelah.</span>
          </div>
        </div>

        {/* TEACHER DETAIL ANALYSIS PANEL (4 COLS) */}
        <div className="lg:col-span-4 space-y-4">
          
          {activeTeacher ? (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#0c2340]/5 flex items-center justify-center text-[#0c2340] border border-[#0c2340]/10">
                  <User className="w-4 h-4 text-[#c5a850]" />
                </div>
                <div className="overflow-hidden">
                  <h4 className="text-xs font-black text-[#0c2340] uppercase truncate" title={activeTeacher.nama}>
                    {activeTeacher.nama}
                  </h4>
                  <p className="text-[9px] text-slate-400 font-bold tracking-wider uppercase">Staf Akademik SK Payang</p>
                </div>
              </div>

              {/* STATS BREAKDOWN GRID */}
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100/50">
                  <p className="text-[9px] font-bold text-slate-500 uppercase">MENGGANTI</p>
                  <p className="text-xl font-black text-[#0c2340] mt-0.5">{activeTeacher.mengganti}</p>
                  <p className="text-[9px] text-slate-400">kali bertugas</p>
                </div>

                <div className="p-3 bg-amber-50/40 rounded-lg border border-amber-100/50">
                  <p className="text-[9px] font-bold text-slate-500 uppercase">DIGANTI</p>
                  <p className="text-xl font-black text-[#c5a850] mt-0.5">{activeTeacher.diganti}</p>
                  <p className="text-[9px] text-slate-400">kali bercuti/tugas luar</p>
                </div>
              </div>

              {/* RATIO COMPARATIVE RATIO METER */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-[10px] font-bold text-slate-500">
                  <span>Agihan Peratus Beban</span>
                  <span className="text-[#0c2340]">
                    {activeTeacher.total > 0 
                      ? `${Math.round((activeTeacher.mengganti / activeTeacher.total) * 100)}% Mengganti` 
                      : "0%"}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden flex">
                  {activeTeacher.total > 0 ? (
                    <>
                      <div 
                        style={{ width: `${(activeTeacher.mengganti / activeTeacher.total) * 100}%` }}
                        className="bg-[#0c2340] h-full"
                      />
                      <div 
                        style={{ width: `${(activeTeacher.diganti / activeTeacher.total) * 100}%` }}
                        className="bg-[#c5a850] h-full"
                      />
                    </>
                  ) : (
                    <div className="w-full bg-slate-200 h-full" />
                  )}
                </div>
              </div>

              {/* LIST OF INVOLVED SLOTS/CLASSES */}
              <div className="space-y-2 pt-2">
                <p className="text-[10px] font-bold text-[#0c2340] uppercase tracking-wider">Senarai Transaksi Terkini ({activeTeacher.nama.split(" ")[0]})</p>
                
                <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                  {filteredSubstitutions.filter(s => s.guruMengganti === activeTeacher.nama || s.guruDiganti === activeTeacher.nama).length > 0 ? (
                    filteredSubstitutions.filter(s => s.guruMengganti === activeTeacher.nama || s.guruDiganti === activeTeacher.nama).slice(0, 5).map((sub, idx) => {
                      const isReplacing = sub.guruMengganti === activeTeacher.nama;
                      return (
                        <div key={idx} className="p-2 rounded bg-slate-50 border border-slate-100 text-[11px] flex items-center justify-between">
                          <div className="space-y-0.5">
                            <span className="font-mono font-bold text-slate-500 block text-[9px]">{sub.tarikh}</span>
                            <span className="font-semibold text-slate-700">
                              {isReplacing ? `Mengganti di ${sub.kelas}` : `Diganti oleh ${sub.guruMengganti.split(" ")[0]}`}
                            </span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                            isReplacing ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                          }`}>
                            {isReplacing ? 'Bertugas' : 'Cuti'}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-slate-400 text-[11px] italic text-center py-4">Tiada rekod gantian untuk penapis masa ini.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
              Sila pilih guru dari carta untuk memaparkan analisis terperinci.
            </div>
          )}

          {/* DYNAMIC GENERAL CONCLUSION CARD */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
            <h5 className="text-xs font-black text-[#0c2340] uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
              <PieChart className="w-3.5 h-3.5 text-[#c5a850]" />
              Rumusan Beban Instruksional
            </h5>
            
            <p className="text-xs text-slate-600 leading-relaxed">
              Sistem MMI telah melancarkan penjajaran yang saksama. Seramai <strong className="text-[#0c2340]">{teacherChartData.filter(t => t.mengganti > 0).length} orang guru</strong> telah menyumbang tenaga untuk menggantikan kelas bagi melindungi jam masa pengajaran pelajar SK Payang.
            </p>

            <div className="pt-1.5">
              <div className="flex justify-between text-[10px] font-black text-[#0c2340] uppercase">
                <span>Kekuatan Perlindungan MMI</span>
                <span>100% Terjamin</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden mt-1">
                <div className="bg-gradient-to-r from-[#0c2340] to-[#c5a850] h-full" style={{ width: '100%' }} />
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
