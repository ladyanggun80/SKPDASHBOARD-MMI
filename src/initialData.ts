import { SchoolInfo, Teacher, MMIFile, Substitution, SENARAI_GURU_ASAL } from "./types";

export const INITIAL_SCHOOL_INFO: SchoolInfo = {
  nama: "SK PAYANG",
  lokasi: "Peti Surat 61345, 91122 Lahad Datu, Sabah",
  alamat: "Peti Surat 61345, 91122 Lahad Datu, Sabah",
  kodSekolah: "XBA3149",
  jumlahMurid: 428,
  jumlahGuru: 27,
  jumlahKelas: 12,
  kehadiran: 94.8,
  visi: "Pendidikan Berkualiti Insan Terdidik Negara Sejahtera",
  misi: "Melestarikan Sistem Pendidikan Yang Berkualiti Untuk Membangun Potensi Individu Bagi Memenuhi Aspirasi Negara",
  maklumatPenting: [
    "Sesi Persekolahan: Isnin – Jumaat (7.00 pagi – 1.00 petang)",
    "Pejabat Pentadbiran dibuka dari jam 8.00 pagi hingga 5.00 petang",
    "Kod Sekolah: XBA3149 | SK Payang, Lahad Datu",
    "Peti Surat 61345, 91122 Lahad Datu, Sabah",
    "Program MMI dijalankan setiap kali guru tidak hadir untuk mengekalkan masa instruksional"
  ],
  aktivitiTerkini: [
    { id: "act-4", tarikh: "2026-09-06", perkara: "Kemaskini Portal SCHOOL360 SK Payang", status: "Aktif" },
    { id: "act-5", tarikh: "2026-09-07", perkara: "Latihan Dalam Perkhidmatan (LDP) Pengurusan Instruksional", status: "Penting" }
  ]
};

// Seed teachers with 0 starting MMI counters for a fresh clean launch
export const getInitialTeachers = (): Teacher[] => {
  return SENARAI_GURU_ASAL.map((nama, index) => {
    return {
      id: `guru-${index + 1}`,
      nama,
      jumlahMengganti: 0,
      jumlahDiganti: 0
    };
  });
};

// Start with empty schedules for launching the system
export const INITIAL_MMI_FILES: MMIFile[] = [];

// Start with empty substitutions for launching the system
export const INITIAL_SUBSTITUTIONS: Substitution[] = [];
