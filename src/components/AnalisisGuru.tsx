import React, { useState, useMemo } from "react";
import { 
  Users, 
  Search, 
  ArrowUpDown, 
  Edit2, 
  Save, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  TrendingUp, 
  TrendingDown, 
  ShieldAlert,
  BarChart2,
  PieChart,
  Grid
} from "lucide-react";
import { Teacher } from "../types";

interface AnalisisGuruProps {
  teachers: Teacher[];
  onUpdateTeacher: (id: string, jumlahMengganti: number, jumlahDiganti: number) => void;
}

type SortField = 'nama' | 'jumlahMengganti' | 'jumlahDiganti' | 'jumlahKeseluruhan';
type SortOrder = 'asc' | 'desc';

export default function AnalisisGuru({ teachers, onUpdateTeacher }: AnalisisGuruProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("nama");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [showFullComparison, setShowFullComparison] = useState(false);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMengganti, setEditMengganti] = useState(0);
  const [editDiganti, setEditDiganti] = useState(0);

  // Sorting Handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc'); // Default to descending for numbers
    }
    setCurrentPage(1);
  };

  // Inline editing actions
  const startEditing = (teacher: Teacher) => {
    setEditingId(teacher.id);
    setEditMengganti(teacher.jumlahMengganti);
    setEditDiganti(teacher.jumlahDiganti);
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const saveEditing = (id: string) => {
    onUpdateTeacher(id, editMengganti, editDiganti);
    setEditingId(null);
  };

  // Compute stats lists
  const processedTeachers = useMemo(() => {
    return teachers.map(t => ({
      ...t,
      jumlahKeseluruhan: t.jumlahMengganti + t.jumlahDiganti
    }));
  }, [teachers]);

  // Top 5 Mengganti (Highest replaces)
  const topMengganti = useMemo(() => {
    return [...processedTeachers]
      .sort((a, b) => b.jumlahMengganti - a.jumlahMengganti)
      .slice(0, 5);
  }, [processedTeachers]);

  // Top 5 Diganti (Highest replaced)
  const topDiganti = useMemo(() => {
    return [...processedTeachers]
      .sort((a, b) => b.jumlahDiganti - a.jumlahDiganti)
      .slice(0, 5);
  }, [processedTeachers]);

  // Total sums for comparison
  const totalStats = useMemo(() => {
    let totalMengganti = 0;
    let totalDiganti = 0;
    processedTeachers.forEach(t => {
      totalMengganti += t.jumlahMengganti;
      totalDiganti += t.jumlahDiganti;
    });
    return { totalMengganti, totalDiganti };
  }, [processedTeachers]);

  // Filter & Sort
  const filteredAndSortedTeachers = useMemo(() => {
    let result = processedTeachers.filter(t => 
      t.nama.toLowerCase().includes(searchQuery.toLowerCase())
    );

    result.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortOrder === 'asc' 
          ? valA.localeCompare(valB) 
          : valB.localeCompare(valA);
      } else {
        // Numbers
        return sortOrder === 'asc' 
          ? (valA as number) - (valB as number) 
          : (valB as number) - (valA as number);
      }
    });

    return result;
  }, [processedTeachers, searchQuery, sortField, sortOrder]);

  // Paginated List
  const paginatedTeachers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedTeachers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedTeachers, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedTeachers.length / itemsPerPage) || 1;

  // Max value in stats for chart percentage calculations
  const maxMenggantiVal = Math.max(...topMengganti.map(t => t.jumlahMengganti), 1);
  const maxDigantiVal = Math.max(...topDiganti.map(t => t.jumlahDiganti), 1);

  return (
    <div className="space-y-6" id="analisis-guru-container">
      {/* Title block */}
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-black text-[#0c2340]">ANALISIS BEBAN TUGAS GURU</h2>
        <p className="text-xs text-slate-500 mt-1">
          Menilai agihan mengganti dan diganti guru bagi mengekalkan keadilan beban tugas
        </p>
      </div>

      {/* Pristine Launch State Banner */}
      {totalStats.totalMengganti === 0 && totalStats.totalDiganti === 0 && (
        <div className="p-4 rounded-xl bg-yellow-50 border border-yellow-200 flex items-start gap-3" id="pristine-launch-banner">
          <ShieldAlert className="w-5 h-5 text-[#b38e3f] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-black tracking-wider text-[#b38e3f] uppercase">📊 STATUS: SISTEM SEDIA DILANCARKAN</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Semua rekod dan jadual MMI terdahulu telah dipadamkan sepenuhnya. Statistik mengganti dan diganti guru bermula dengan nilai sifar (0). Analisis beban tugas, matriks perbandingan, dan laporan kecenderungan akan dikemas kini secara dinamik sebaik sahaja jadual penggantian guru mula dimasukkan.
            </p>
          </div>
        </div>
      )}

      {/* GRAPHIC ANALYTICS GRID (4 visual charts) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" id="teachers-charts-grid">
        
        {/* Chart 1: Guru Paling Banyak Mengganti (Sumbangsih Tinggi) */}
        <div className="rounded-xl glass-panel p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-black tracking-wider text-[#0c2340] uppercase mb-4 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <TrendingUp className="w-4 h-4 text-[#c5a850]" />
              TOP 5 MENGGANTI
            </h3>
            <div className="space-y-3" id="top-mengganti-bars">
              {topMengganti.map((t, index) => {
                const percent = Math.round((t.jumlahMengganti / maxMenggantiVal) * 100);
                return (
                  <div key={t.id} className="space-y-1">
                    <div className="flex justify-between text-[11px] font-semibold">
                      <span className="text-slate-700 truncate max-w-[150px]" title={t.nama}>{t.nama}</span>
                      <span className="text-[#0c2340] font-bold">{t.jumlahMengganti} Kali</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-[#0c2340] to-[#c5a850] h-full rounded-full transition-all duration-1000"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-4 pt-3 border-t border-slate-100 italic text-center">
            Guru penyumbang ganti instruksional tertinggi
          </p>
        </div>

        {/* Chart 2: Guru Paling Banyak Diganti (Cuti/Tugas Luar) */}
        <div className="rounded-xl glass-panel p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-black tracking-wider text-[#b38e3f] uppercase mb-4 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <TrendingDown className="w-4 h-4 text-[#c5a850]" />
              TOP 5 DIGANTI
            </h3>
            <div className="space-y-3" id="top-diganti-bars">
              {topDiganti.map((t, index) => {
                const percent = Math.round((t.jumlahDiganti / maxDigantiVal) * 100);
                return (
                  <div key={t.id} className="space-y-1">
                    <div className="flex justify-between text-[11px] font-semibold">
                      <span className="text-slate-700 truncate max-w-[150px]" title={t.nama}>{t.nama}</span>
                      <span className="text-[#b38e3f] font-bold">{t.jumlahDiganti} Kali</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-[#c5a850] to-[#e2b23d] h-full rounded-full transition-all duration-1000"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-4 pt-3 border-t border-slate-100 italic text-center">
            Guru paling kerap digantikan (tugasan/mesyuarat)
          </p>
        </div>

        {/* Chart 3: Perbandingan Mengganti vs Diganti (Custom SVG Donut & Ratio) */}
        <div className="rounded-xl glass-panel p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-black tracking-wider text-[#0c2340] uppercase mb-4 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <BarChart2 className="w-4 h-4 text-[#c5a850]" />
              MENGGANTI VS DIGANTI
            </h3>

            {/* Custom SVG Dual Ring Donut */}
            <div className="flex justify-center items-center h-28 relative">
              <svg className="w-24 h-24 transform -rotate-90">
                {/* Background Ring */}
                <circle cx="48" cy="48" r="38" fill="transparent" stroke="rgba(12, 35, 64, 0.05)" strokeWidth="6" />
                
                {/* Mengganti Segment */}
                {/* Total = Mengganti + Diganti */}
                {(() => {
                  const total = totalStats.totalMengganti + totalStats.totalDiganti || 1;
                  const ratioM = totalStats.totalMengganti / total;
                  const strokeDashM = ratioM * 2 * Math.PI * 38;
                  const strokeDashEmptyM = (1 - ratioM) * 2 * Math.PI * 38;

                  return (
                    <circle 
                      cx="48" cy="48" r="38" 
                      fill="transparent" 
                      stroke="#0c2340" 
                      strokeWidth="6" 
                      strokeDasharray={`${strokeDashM} ${strokeDashEmptyM}`}
                      className="transition-all duration-1000"
                    />
                  );
                })()}

                {/* Diganti Segment offset */}
                {(() => {
                  const total = totalStats.totalMengganti + totalStats.totalDiganti || 1;
                  const ratioD = totalStats.totalDiganti / total;
                  const strokeDashD = ratioD * 2 * Math.PI * 38;
                  const strokeDashEmptyD = (1 - ratioD) * 2 * Math.PI * 38;
                  // Calculate rotate degree based on mengganti ratio
                  const offsetDeg = (totalStats.totalMengganti / total) * 360;

                  return (
                    <circle 
                      cx="48" cy="48" r="38" 
                      fill="transparent" 
                      stroke="#c5a850" 
                      strokeWidth="6" 
                      strokeDasharray={`${strokeDashD} ${strokeDashEmptyD}`}
                      transform={`rotate(${offsetDeg} 48 48)`}
                      className="transition-all duration-1000"
                    />
                  );
                })()}
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-black text-[#0c2340]">
                  {totalStats.totalMengganti + totalStats.totalDiganti}
                </span>
                <span className="text-[9px] text-slate-400 font-bold uppercase">Jumlah Ganti</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="text-center p-1.5 bg-slate-50 rounded border border-slate-100">
                <span className="text-[9px] text-slate-400 font-bold block">MENGGANTI</span>
                <span className="text-xs font-bold text-[#0c2340]">{totalStats.totalMengganti} Kali</span>
              </div>
              <div className="text-center p-1.5 bg-slate-50 rounded border border-slate-100">
                <span className="text-[9px] text-slate-400 font-bold block">DIGANTI</span>
                <span className="text-xs font-bold text-[#b38e3f]">{totalStats.totalDiganti} Kali</span>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 pt-2 border-t border-slate-100 text-center">
            Kadar nisbah keseluruhan guru di SK Payang
          </p>
        </div>

        {/* Chart 4: Agihan Beban Guru (Grid map) */}
        <div className="rounded-xl glass-panel p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-black tracking-wider text-[#b38e3f] uppercase mb-3 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Grid className="w-4 h-4 text-[#c5a850]" />
              AGIHAN BEBAN GURU
            </h3>
            
            {/* Quick scatter metric boxes */}
            <div className="space-y-2 mt-2" id="workload-distribution-stats">
              {(() => {
                // Calculate average workload
                const counts = processedTeachers.map(t => t.jumlahKeseluruhan);
                const avg = counts.reduce((a, b) => a + b, 0) / (counts.length || 1);
                
                // Categorize
                const tinggi = processedTeachers.filter(t => t.jumlahKeseluruhan > avg + 4).length;
                const seimbang = processedTeachers.filter(t => t.jumlahKeseluruhan >= avg - 4 && t.jumlahKeseluruhan <= avg + 4).length;
                const rendah = processedTeachers.filter(t => t.jumlahKeseluruhan < avg - 4).length;

                return (
                  <>
                    <div className="flex items-center justify-between p-2 rounded bg-red-50 border border-red-100 text-[11px]">
                      <span className="text-slate-600 font-semibold">Tinggi (&gt;{Math.round(avg + 4)} MMI)</span>
                      <span className="font-bold text-red-700 px-1.5 py-0.25 bg-red-100 rounded">{tinggi} Guru</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-emerald-50 border border-emerald-100 text-[11px]">
                      <span className="text-slate-600 font-semibold">Seimbang ({Math.round(avg - 4)} - {Math.round(avg + 4)})</span>
                      <span className="font-bold text-emerald-700 px-1.5 py-0.25 bg-emerald-100 rounded">{seimbang} Guru</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-blue-50 border border-blue-100 text-[11px]">
                      <span className="text-slate-600 font-semibold">Rendah (&lt;{Math.round(avg - 4)} MMI)</span>
                      <span className="font-bold text-blue-700 px-1.5 py-0.25 bg-blue-100 rounded">{rendah} Guru</span>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
          <div className="text-[10px] text-slate-400 mt-2 pt-2 border-t border-slate-100 text-center flex items-center justify-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
            <span>Keadilan agihan: Purata seimbang</span>
          </div>
        </div>
      </div>

      {/* COMPREHENSIVE VISUAL COMPARISON TOGGLE & BLOCK */}
      <div className="rounded-xl glass-panel p-5 space-y-4" id="comprehensive-comparison-block">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-black tracking-wider text-[#0c2340] uppercase flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-[#c5a850]" />
              MATRIKS PERBANDINGAN BEBAN TUGAS KOMPREHENSIF (SEMUA GURU)
            </h3>
            <p className="text-xs text-slate-500">
              Bandingkan kadar mengganti vs diganti bagi semua guru secara bersebelahan untuk pemantauan beban MMI
            </p>
          </div>
          <button
            onClick={() => setShowFullComparison(!showFullComparison)}
            className="px-4 py-2 rounded-lg bg-[#0c2340] hover:bg-[#1a3c75] border border-[#c5a850]/40 text-[#c5a850] text-xs font-bold tracking-wider uppercase shadow-md transition-all cursor-pointer"
          >
            {showFullComparison ? "Sembunyikan Perbandingan Penuh" : "Buka Perbandingan Semua Guru"}
          </button>
        </div>

        {showFullComparison && (
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
            {/* Search filter for comparison grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" id="comparison-grid-cards">
              {processedTeachers.map(t => {
                const maxVal = Math.max(...processedTeachers.map(gt => Math.max(gt.jumlahMengganti, gt.jumlahDiganti, 1)));
                const mPercent = Math.round((t.jumlahMengganti / maxVal) * 100);
                const dPercent = Math.round((t.jumlahDiganti / maxVal) * 100);

                return (
                  <div key={t.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3 hover:border-[#c5a850]/40 transition-all">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-xs font-bold text-slate-800 truncate max-w-[170px]" title={t.nama}>{t.nama}</span>
                      <span className="text-[10px] font-mono font-bold bg-white px-2 py-0.5 rounded text-[#0c2340] border border-slate-200">
                        {t.jumlahKeseluruhan} MMI
                      </span>
                    </div>

                    <div className="space-y-2">
                      {/* Mengganti progress bar */}
                      <div className="space-y-0.5">
                        <div className="flex justify-between text-[9px] font-bold">
                          <span className="text-[#0c2340]">Mengganti (Penyumbang)</span>
                          <span className="text-[#0c2340] font-mono">{t.jumlahMengganti} Kali</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-[#0c2340] to-[#c5a850] h-full rounded-full transition-all duration-500"
                            style={{ width: `${mPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Diganti progress bar */}
                      <div className="space-y-0.5">
                        <div className="flex justify-between text-[9px] font-bold">
                          <span className="text-[#b38e3f]">Diganti (Penerima)</span>
                          <span className="text-[#b38e3f] font-mono">{t.jumlahDiganti} Kali</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-[#c5a850] to-[#e2b23d] h-full rounded-full transition-all duration-500"
                            style={{ width: `${dPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* TEACHERS DATA TABLE WITH INLINE UPDATER */}
      <div className="rounded-xl glass-panel p-5" id="teachers-table-block">
        
        {/* Table Controls (Search and info) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#c5a850]" />
            <h3 className="text-base font-bold text-[#0c2340]">REKOD BEBAN GURU (NAMA GURU & MMI COUNTS)</h3>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search query */}
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Cari guru..."
                className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#c5a850] font-semibold"
              />
            </div>
            <span className="text-xs text-slate-400 font-bold hidden md:inline">
              Jumlah: {filteredAndSortedTeachers.length} Guru
            </span>
          </div>
        </div>

        {/* Core Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" id="teachers-data-grid">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50 text-xs">
                <th className="py-3 px-4">
                  <button 
                    onClick={() => handleSort('nama')}
                    className="flex items-center gap-1 hover:text-[#0c2340] cursor-pointer text-left"
                  >
                    NAMA GURU
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </button>
                </th>
                <th className="py-3 px-4 text-center">
                  <button 
                    onClick={() => handleSort('jumlahMengganti')}
                    className="flex items-center gap-1 hover:text-[#0c2340] cursor-pointer mx-auto"
                  >
                    JUMLAH MENGGANTI
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </button>
                </th>
                <th className="py-3 px-4 text-center">
                  <button 
                    onClick={() => handleSort('jumlahDiganti')}
                    className="flex items-center gap-1 hover:text-[#0c2340] cursor-pointer mx-auto"
                  >
                    JUMLAH DIGANTI
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </button>
                </th>
                <th className="py-3 px-4 text-center">
                  <button 
                    onClick={() => handleSort('jumlahKeseluruhan')}
                    className="flex items-center gap-1 hover:text-[#0c2340] cursor-pointer mx-auto"
                  >
                    JUMLAH KESELURUHAN
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </button>
                </th>
                <th className="py-3 px-4 text-center">TINDAKAN KEMASKINI</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTeachers.map((t) => {
                const isEditing = editingId === t.id;

                return (
                  <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors text-xs">
                    <td className="py-3 px-4 font-semibold text-slate-800 tracking-wide">
                      {t.nama}
                    </td>
                    
                    <td className="py-3 px-4 text-center">
                      {isEditing ? (
                        <input 
                          type="number" 
                          min="0"
                          value={editMengganti}
                          onChange={(e) => setEditMengganti(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-16 bg-white border border-slate-200 rounded px-2 py-1 text-center text-xs text-[#0c2340] font-bold focus:outline-none focus:border-[#c5a850]"
                        />
                      ) : (
                        <span className="font-mono font-bold text-[#0c2340] px-2.5 py-1 rounded bg-blue-50 border border-blue-100">
                          {t.jumlahMengganti}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      {isEditing ? (
                        <input 
                          type="number" 
                          min="0"
                          value={editDiganti}
                          onChange={(e) => setEditDiganti(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-16 bg-white border border-slate-200 rounded px-2 py-1 text-center text-xs text-[#b38e3f] font-bold focus:outline-none focus:border-[#c5a850]"
                        />
                      ) : (
                        <span className="font-mono font-bold text-[#b38e3f] px-2.5 py-1 rounded bg-yellow-50 border border-yellow-200">
                          {t.jumlahDiganti}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className="font-mono font-bold text-slate-700 px-2.5 py-1 rounded bg-slate-50 border border-slate-100">
                        {isEditing ? editMengganti + editDiganti : t.jumlahKeseluruhan}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex justify-center items-center gap-2">
                        {isEditing ? (
                          <>
                            <button
                              title="Simpan"
                              onClick={() => saveEditing(t.id)}
                              className="p-1.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-all cursor-pointer"
                            >
                              <Save className="w-3.5 h-3.5" />
                            </button>
                            <button
                              title="Batal"
                              onClick={cancelEditing}
                              className="p-1.5 rounded bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 transition-all cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => startEditing(t)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-[#c5a850] hover:text-[#0c2340] text-slate-600 text-[11px] font-bold transition-all cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3 text-[#c5a850]" />
                            <span>KEMASKINI</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredAndSortedTeachers.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">
                    Tiada keputusan untuk carian &ldquo;{searchQuery}&rdquo;.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between border-t border-slate-200 pt-4 mt-4" id="table-pagination-nav">
          <span className="text-[11px] text-slate-400 font-semibold uppercase">
            Halaman {currentPage} daripada {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="p-1.5 rounded bg-white border border-slate-200 hover:border-[#c5a850] text-slate-500 hover:text-[#0c2340] transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="p-1.5 rounded bg-white border border-slate-200 hover:border-[#c5a850] text-slate-500 hover:text-[#0c2340] transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
