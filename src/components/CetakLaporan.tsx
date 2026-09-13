import React, { useState, useEffect } from "react";
import { 
  Printer, 
  X, 
  Calendar, 
  FileText, 
  Check, 
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  ChevronLeft
} from "lucide-react";
import { SchoolInfo, Teacher, MMIFile, Substitution, SLOT_MASA_MMI } from "../types";

interface CetakLaporanProps {
  schoolInfo: SchoolInfo;
  teachers: Teacher[];
  mmiFiles: MMIFile[];
  substitutions: Substitution[];
  isOpen: boolean;
  onClose: () => void;
  initialDate?: string;
}

// Common MOE MMI reasons for teacher replacement
const SEBAB_LAZIM = [
  "Cuti Sakit (MC)",
  "Urusan Rasmi PPD/JPN/KPM",
  "Kursus / Bengkel Pengurusan",
  "Cuti Rehat Khas (CRK)",
  "Mesyuarat Pentadbiran",
  "Urusan Peribadi (Kecemasan)",
  "Program Kokurikulum",
  "Menghadiri Seminar"
];

export default function CetakLaporan({
  schoolInfo,
  teachers,
  mmiFiles,
  substitutions,
  isOpen,
  onClose,
  initialDate = ""
}: CetakLaporanProps) {
  // Available dates from files or substitutions
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  
  // Custom reasons for each substitution (key is sub.id)
  const [reasons, setReasons] = useState<Record<string, string>>({});
  
  // Customizing letter reference and other official documents fields
  const [docRef, setDocRef] = useState<string>("SKP/MMI/2026/GANTI-(01)");
  const [penyelarasName, setPenyelarasName] = useState<string>("AZEMAN YANGKOK");
  const [guruBesarName, setGuruBesarName] = useState<string>("SAABI BINTI HASIN");

  // Load available dates from data
  useEffect(() => {
    const datesSet = new Set<string>();
    
    // Collect from MMI files
    mmiFiles.forEach(f => {
      if (f.tarikh) datesSet.add(f.tarikh);
    });
    
    // Collect from substitutions just in case
    substitutions.forEach(s => {
      if (s.tarikh) datesSet.add(s.tarikh);
    });
    
    // Convert to sorted array (most recent first)
    const datesList = Array.from(datesSet).sort((a, b) => b.localeCompare(a));
    setAvailableDates(datesList);
    
    if (initialDate && datesSet.has(initialDate)) {
      setSelectedDate(initialDate);
    } else if (datesList.length > 0) {
      setSelectedDate(datesList[0]);
    } else {
      // Fallback to today's date if empty
      setSelectedDate(new Date().toISOString().split('T')[0]);
    }
  }, [mmiFiles, substitutions, initialDate]);

  // Handle setting default reasons for substitutions
  useEffect(() => {
    if (!selectedDate) return;
    
    const subsForDate = substitutions.filter(s => s.tarikh === selectedDate);
    const newReasons = { ...reasons };
    
    subsForDate.forEach(sub => {
      if (!newReasons[sub.id]) {
        // Prepopulate with a deterministic reason based on ID, so it is realistic but customizable
        const idx = Math.abs(sub.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % SEBAB_LAZIM.length;
        newReasons[sub.id] = SEBAB_LAZIM[idx];
      }
    });
    
    setReasons(newReasons);
  }, [selectedDate, substitutions]);

  if (!isOpen) return null;

  // Filter substitutions for selected date
  const filteredSubs = substitutions.filter(s => s.tarikh === selectedDate);

  // Stats
  const totalClasses = new Set(filteredSubs.map(s => s.kelas)).size;
  const totalSubbedTeachers = new Set(filteredSubs.map(s => s.guruDiganti)).size;
  const totalReplacingTeachers = new Set(filteredSubs.map(s => s.guruMengganti)).size;

  // Format date helper (e.g. 2026-09-06 -> 6 September 2026)
  const formatMalayDate = (dateStr: string) => {
    if (!dateStr) return "-";
    try {
      const parts = dateStr.split("-");
      if (parts.length !== 3) return dateStr;
      const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      return date.toLocaleDateString('ms-MY', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  // Get Day of Week in Malay
  const getMalayDay = (dateStr: string) => {
    if (!dateStr) return "-";
    try {
      const parts = dateStr.split("-");
      const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      return date.toLocaleDateString('ms-MY', { weekday: 'long' }).toUpperCase();
    } catch {
      return "-";
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div 
      id="mmi-print-overlay"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-md flex flex-col items-center justify-start p-4 md:p-8"
    >
      {/* CSS overrides specifically for clean black-and-white printing */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Enforce pure black & white, hide colors & shadows */
          body, html {
            background-color: #FFFFFF !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            font-family: serif, "Times New Roman", Georgia, Arial, sans-serif !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* Hide standard container components completely */
          #school360-root-application,
          #school360-main-sidebar,
          #school360-top-header,
          #mmi-print-overlay-controls,
          .no-print,
          button,
          aside,
          header {
            display: none !important;
          }
          
          /* Enforce the print wrapper takes full page */
          #mmi-print-overlay {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #FFFFFF !important;
            overflow: visible !important;
          }
          
          /* Printable Paper Format */
          .printable-sheet {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 1.5cm !important;
            box-shadow: none !important;
            border: none !important;
            background: #FFFFFF !important;
            color: #000000 !important;
          }
          
          /* Borders & Grid Alignment */
          .print-border {
            border: 1px solid #000000 !important;
          }
          
          .print-border-double {
            border-bottom: 4px double #000000 !important;
          }
          
          table.print-table {
            border-collapse: collapse !important;
            width: 100% !important;
            margin-top: 15px !important;
            margin-bottom: 15px !important;
          }
          
          table.print-table th, 
          table.print-table td {
            border: 1px solid #000000 !important;
            padding: 6px 10px !important;
            color: #000000 !important;
            background-color: transparent !important;
            font-size: 11pt !important;
            line-height: 1.3 !important;
          }

          table.print-table th {
            font-weight: bold !important;
            text-align: center !important;
          }

          /* Ensure page breaks don't orphan content */
          .page-break-avoid {
            page-break-inside: avoid !important;
          }
        }
      `}} />

      {/* Control Actions - Header panel inside the overlay (Hidden on print) */}
      <div 
        id="mmi-print-overlay-controls" 
        className="w-full max-w-4xl bg-[#0c2340] text-white rounded-xl p-4 md:p-5 mb-6 border border-[#c5a850]/40 shadow-xl no-print flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-[#c5a850]" />
            <h2 className="text-base font-black tracking-wider uppercase text-[#c5a850]">
              MOD CETAKAN LAPORAN MMI RASMI (HITAM PUTIH)
            </h2>
          </div>
          <p className="text-xs text-slate-300">
            Paparan dioptimumkan kepada mod dokumen rasmi monokrom (tanpa grafik warna) sedia cetak A4.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Date Selector */}
          <div className="flex items-center gap-2 bg-blue-950/40 px-3 py-1.5 rounded-lg border border-blue-900/40">
            <Calendar className="w-3.5 h-3.5 text-[#c5a850]" />
            <span className="text-xs font-bold text-slate-300">Pilih Tarikh:</span>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-[#0c2340] border border-blue-900 rounded px-2 py-1 text-xs font-mono font-bold text-white focus:outline-none focus:border-[#c5a850]"
            >
              {availableDates.map(date => (
                <option key={date} value={date}>{date}</option>
              ))}
              {availableDates.length === 0 && (
                <option value={selectedDate}>{selectedDate}</option>
              )}
            </select>
          </div>

          {/* Print Trigger */}
          <button
            onClick={handlePrint}
            className="bg-[#c5a850] hover:bg-[#e2b23d] text-[#0c2340] px-4 py-2 rounded-lg text-xs font-black tracking-wider uppercase transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Cetak Laporan
          </button>

          {/* Close Panel */}
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3.5 py-2 rounded-lg text-xs font-bold uppercase transition-all border border-slate-700 cursor-pointer flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            Tutup
          </button>
        </div>
      </div>

      {/* Main Container - Combines Configuration Sidebar (Left) and Print Sheet Preview (Right) (Sidebar is hidden on print) */}
      <div className="w-full max-w-4xl flex flex-col md:flex-row gap-6 items-start">
        
        {/* Left Side: Parameters Customization Panel (No Print) */}
        <div className="w-full md:w-80 space-y-4 shrink-0 no-print">
          <div className="rounded-xl bg-white border border-slate-200 p-4 space-y-4 shadow-md">
            <h3 className="text-xs font-black text-[#0c2340] uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#c5a850]" />
              Maklumat Laporan Rasmi
            </h3>
            
            {/* Document Reference Code */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Rujukan Dokumen</label>
              <input 
                type="text" 
                value={docRef}
                onChange={(e) => setDocRef(e.target.value)}
                placeholder="Rujukan Rasmi Fail"
                className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#c5a850]"
              />
            </div>

            {/* Coordinator Signature Name */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Nama Penyelaras MMI</label>
              <input 
                type="text" 
                value={penyelarasName}
                onChange={(e) => setPenyelarasName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none"
              />
            </div>

            {/* Headmaster Signature Name */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Nama Guru Besar</label>
              <input 
                type="text" 
                value={guruBesarName}
                onChange={(e) => setGuruBesarName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none"
              />
            </div>
          </div>

          {/* Interactive Reasons configuration per substitution */}
          {filteredSubs.length > 0 && (
            <div className="rounded-xl bg-white border border-slate-200 p-4 space-y-3 shadow-md max-h-[350px] overflow-y-auto">
              <h3 className="text-xs font-black text-[#0c2340] uppercase tracking-wider border-b border-slate-100 pb-1.5">
                ✏️ Pengesahan Sebab MMI
              </h3>
              <p className="text-[10px] text-slate-400">
                Pilih atau isi catatan sebab ketidakhadiran guru asal bagi menjana justifikasi dalam laporan.
              </p>
              
              {filteredSubs.map((sub, idx) => (
                <div key={sub.id} className="space-y-1.5 bg-slate-50 p-2.5 rounded border border-slate-150 text-xs">
                  <div className="flex justify-between items-center font-bold text-slate-700 text-[10px]">
                    <span className="text-[#0c2340]">Slot {idx + 1}: {sub.kelas}</span>
                    <span className="text-slate-400 font-mono">{sub.slot}</span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Diganti: <strong className="text-slate-700">{sub.guruDiganti}</strong>
                  </p>
                  
                  {/* Select reason */}
                  <select
                    value={reasons[sub.id] || ""}
                    onChange={(e) => setReasons({ ...reasons, [sub.id]: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-[11px] font-semibold text-slate-800"
                  >
                    {SEBAB_LAZIM.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                    <option value="Urusan Sekolah">Urusan Sekolah</option>
                    <option value="Cuti Bersalin">Cuti Bersalin</option>
                    <option value="Cuti Kuarantin">Cuti Kuarantin</option>
                    <option value="Tugas Pengawasan Peperiksaan">Tugas Pengawasan Peperiksaan</option>
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: A4 Clean Black & White Paper Preview */}
        <div className="flex-1 w-full bg-slate-100 p-0 md:p-4 rounded-xl flex justify-center no-print-bg">
          <div 
            id="official-mmi-print-report-container"
            className="printable-sheet w-full bg-white p-8 md:p-12 text-black shadow-lg rounded-none border border-slate-300 font-serif"
            style={{ minHeight: "29.7cm" }}
          >
            {/* Official KPM style letterhead header */}
            <div className="text-center space-y-1 pb-4 print-border-double border-b-2 border-black flex flex-col items-center">
              <span className="text-xs uppercase tracking-widest font-sans font-bold text-slate-800 print:text-black">
                KEMENTERIAN PENDIDIKAN MALAYSIA
              </span>
              <h2 className="text-base font-bold uppercase tracking-wide font-sans">
                SEKOLAH KEBANGSAAN PAYANG
              </h2>
              <p className="text-xs font-sans text-slate-600 print:text-black">
                Peti Surat 61345, 91122 Lahad Datu, Sabah. • Kod Sekolah: <strong>XBA3149</strong>
              </p>
              <p className="text-[10px] font-sans text-slate-500 print:text-black font-semibold">
                Rujukan Dokumen: {docRef || "-"}
              </p>
            </div>

            {/* Document Title */}
            <div className="text-center my-6 space-y-1">
              <h3 className="text-md font-bold uppercase tracking-wider underline">
                LAPORAN HARIAN MELINDUNGI MASA INSTRUKSIONAL (MMI)
              </h3>
              <p className="text-xs font-semibold uppercase tracking-widest">
                PENYELARASAN TRANSAKSI JADUAL GANTI GURU
              </p>
            </div>

            {/* Metadata Section - Structured in clear bordered grid */}
            <div className="grid grid-cols-2 gap-4 text-xs font-sans my-4 p-3 border border-black rounded-sm bg-slate-50/50 print:bg-transparent">
              <div className="space-y-1">
                <p><strong>Tarikh MMI:</strong> {formatMalayDate(selectedDate)}</p>
                <p><strong>Hari Persekolahan:</strong> {getMalayDay(selectedDate)}</p>
                <p><strong>Sesi:</strong> Pagi (7.00 pagi – 1.00 petang)</p>
              </div>
              <div className="space-y-1">
                <p><strong>Nama Sekolah:</strong> SK PAYANG, LAHAD DATU</p>
                <p><strong>Jumlah Guru Terlibat:</strong> {totalSubbedTeachers} orang</p>
                <p><strong>Purata Kehadiran Murid:</strong> {schoolInfo.kehadiran}%</p>
              </div>
            </div>

            {/* Stats Summary Panel */}
            <div className="my-5 border border-black p-3 rounded-sm">
              <h4 className="text-xs font-bold uppercase tracking-wider mb-2 font-sans border-b border-black pb-1">
                I. RINGKASAN DATA KESELURUHAN MMI HARIAN
              </h4>
              <div className="grid grid-cols-4 gap-2 text-center text-xs font-sans">
                <div className="p-2 border border-black rounded-sm">
                  <span className="text-[9px] text-slate-500 print:text-black block font-bold uppercase leading-tight">Jumlah Masa Diganti</span>
                  <span className="text-base font-extrabold mt-1 block">{filteredSubs.length} Masa</span>
                </div>
                <div className="p-2 border border-black rounded-sm">
                  <span className="text-[9px] text-slate-500 print:text-black block font-bold uppercase leading-tight">Kelas Terlibat</span>
                  <span className="text-base font-extrabold mt-1 block">{totalClasses}</span>
                </div>
                <div className="p-2 border border-black rounded-sm">
                  <span className="text-[9px] text-slate-500 print:text-black block font-bold uppercase leading-tight">Guru Diganti</span>
                  <span className="text-base font-extrabold mt-1 block">{totalSubbedTeachers}</span>
                </div>
                <div className="p-2 border border-black rounded-sm">
                  <span className="text-[9px] text-slate-500 print:text-black block font-bold uppercase leading-tight">Guru Mengganti</span>
                  <span className="text-base font-extrabold mt-1 block">{totalReplacingTeachers}</span>
                </div>
              </div>
            </div>

            {/* Detailed MMI substitutions Table */}
            <div className="my-5">
              <h4 className="text-xs font-bold uppercase tracking-wider mb-2.5 font-sans">
                II. JADUAL MUTASI & TRANSAKSI GURU GANTI (MMI)
              </h4>
              
              <table className="print-table w-full text-left font-sans text-xs border border-black">
                <thead>
                  <tr className="border-b border-black text-black font-bold bg-slate-100 print:bg-transparent text-center">
                    <th className="py-2.5 px-3 border border-black text-[11px] w-10">BIL.</th>
                    <th className="py-2.5 px-3 border border-black text-[11px] w-24">JUMLAH MASA</th>
                    <th className="py-2.5 px-3 border border-black text-[11px] w-24">KELAS</th>
                    <th className="py-2.5 px-3 border border-black text-[11px]">GURU ASAL (DIGANTI)</th>
                    <th className="py-2.5 px-3 border border-black text-[11px]">GURU PENGGANTI</th>
                    <th className="py-2.5 px-3 border border-black text-[11px] w-48">SEBAB KETIDAKHADIRAN / CATATAN</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubs.map((sub, idx) => {
                    return (
                      <tr key={sub.id} className="border-b border-black hover:bg-slate-50/20">
                        <td className="py-2.5 px-3 border border-black text-center font-bold">{idx + 1}</td>
                        <td className="py-2.5 px-3 border border-black text-center font-sans font-bold text-xs">
                          1 Masa
                        </td>
                        <td className="py-2.5 px-3 border border-black text-center font-bold text-[#0c2340] print:text-black">
                          {sub.kelas}
                        </td>
                        <td className="py-2.5 px-3 border border-black font-medium">{sub.guruDiganti}</td>
                        <td className="py-2.5 px-3 border border-black font-semibold text-[#0c2340] print:text-black">{sub.guruMengganti}</td>
                        <td className="py-2.5 px-3 border border-black text-[11px]">
                          {reasons[sub.id] || "Urusan Sekolah / Rasmi"}
                        </td>
                      </tr>
                    );
                  })}
                  
                  {filteredSubs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 print:text-black italic font-sans">
                        Tiada sebarang rekod transaksi ganti dicatatkan pada tarikh ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Verification and Endorsement Block (Signatures) */}
            <div className="grid grid-cols-2 gap-8 pt-10 mt-10 border-t border-dashed border-slate-300 print:border-black page-break-avoid font-sans">
              <div className="space-y-12">
                <div className="space-y-1 text-xs">
                  <p className="uppercase font-bold text-slate-600 print:text-black text-[10px]">Disediakan oleh Penyelaras MMI:</p>
                  <p className="italic text-[10px] text-slate-400 print:hidden">Sila tanda tangan di bawah:</p>
                </div>
                
                <div className="space-y-1 text-xs">
                  <p className="font-bold underline">...........................................................................</p>
                  <p className="font-bold uppercase">{penyelarasName || "GURU PENYELARAS MMI"}</p>
                  <p className="text-[10px] text-slate-500 print:text-black">Penyelaras Jawatankuasa MMI SK Payang</p>
                  <p>Tarikh: {formatMalayDate(selectedDate)}</p>
                </div>
              </div>

              <div className="space-y-12">
                <div className="space-y-1 text-xs">
                  <p className="uppercase font-bold text-slate-600 print:text-black text-[10px]">Disahkan & Diperakukan oleh Guru Besar:</p>
                  <p className="italic text-[10px] text-slate-400 print:hidden">Sila tanda tangan & cop rasmi di bawah:</p>
                </div>

                <div className="space-y-1 text-xs">
                  <p className="font-bold underline">...........................................................................</p>
                  <p className="font-bold uppercase">{guruBesarName || "GURU BESAR"}</p>
                  <p className="text-[10px] text-slate-500 print:text-black">Guru Besar Cemerlang, SK Payang Sabah</p>
                  <p>Tarikh: ..............................................................</p>
                </div>
              </div>
            </div>

            {/* Mini Footer Stamp for System Authentication */}
            <div className="mt-12 pt-6 border-t border-slate-100 print:border-black text-[9px] text-slate-400 print:text-black font-sans font-medium flex justify-between items-center">
              <span>Sekolah Kebangsaan Payang Lahad Datu • Sistem Pengurusan SCHOOL360 MMI v3</span>
              <span className="font-mono text-[8px]">CETAKAN BERKANUN • KPM-MMI-XBA3149</span>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
