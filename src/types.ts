export interface SchoolInfo {
  nama: string;
  lokasi: string;
  alamat?: string;
  kodSekolah?: string;
  jumlahMurid: number;
  jumlahGuru: number;
  jumlahKelas: number;
  kehadiran: number;
  visi: string;
  misi: string;
  maklumatPenting: string[];
  aktivitiTerkini: { id: string; tarikh: string; perkara: string; status: 'Selesai' | 'Aktif' | 'Penting' }[];
}

export interface Teacher {
  id: string;
  nama: string;
  jumlahMengganti: number;
  jumlahDiganti: number;
}

export interface MMIFile {
  id: string;
  tarikh: string; // YYYY-MM-DD
  namaFail: string;
  jenis: 'pdf' | 'image';
  status: 'Aktif' | 'Draf' | 'Disahkan';
  fileData?: string; // Base64 data URL
  fileSize: string;
  guruDiganti?: string;
  guruMengganti?: string;
  kelas?: string;
  slot?: string;
  catatan?: string;
}

export interface Substitution {
  id: string;
  tarikh: string; // YYYY-MM-DD
  guruMengganti: string; // Nama guru
  guruDiganti: string; // Nama guru
  kelas: string; // e.g., "3 BIJAK"
  slot: string; // e.g., "Masa 3"
  status?: string;
  catatan?: string;
}

export const SENARAI_GURU_ASAL: string[] = [
  "SAABI BINTI HASIN",
  "TINA BINTI SANUSI",
  "AZEMAN YANGKOK",
  "TRACCIE SAHNI",
  "AINAN SALSABEELA NASIR",
  "AISYAH NAJIHAH ABD RAISHAM",
  "ASLAN ARDANI",
  "ASLINA ALI",
  "ASNIE PATRASAH",
  "BIBIANA ANTHONY MAYOH",
  "DARWINA MATHEW",
  "DK NORMAH PG NASIP",
  "MIRA AZRINA MOHAMAD ISAK",
  "MOHD HAIKAL MOHD SABRI",
  "MOHD HILMI RAMLI",
  "MOHD NAZRIN DAHIRIN",
  "NONIE MOHD KASSIM",
  "NURUL NABILAH BADARULDZAMAN",
  "ROSLI PITRI",
  "ROSLY LATAENA",
  "ROWAHNI @ROHWANI ABU BAKAR",
  "SALHA SILADJAN",
  "SAMINAH RAFEL",
  "SILVESTER BIN JOSEPH",
  "UMAMAGESWARI A/P MARIMUTHU",
  "YATI NUR FATIHAH TIKSON",
  "NIR SHAFIQAH BINTI HARUN"
];

export const SENARAI_KELAS: string[] = [
  "1 BIJAK",
  "1 BESTARI",
  "2 BIJAK",
  "2 BESTARI",
  "3 BIJAK",
  "3 BESTARI",
  "4 BIJAK",
  "4 BESTARI",
  "5 BIJAK",
  "5 BESTARI",
  "6 BIJAK",
  "6 BESTARI"
];

export interface SlotMasa {
  id: string;
  label: string;
  waktu: string;
  isRehat: boolean;
}

export const SLOT_MASA_MMI: SlotMasa[] = [
  { id: "Masa 1", label: "Masa 1", waktu: "7.00 – 7.30 pagi", isRehat: false },
  { id: "Masa 2", label: "Masa 2", waktu: "7.30 – 8.00 pagi", isRehat: false },
  { id: "Masa 3", label: "Masa 3", waktu: "8.00 – 8.30 pagi", isRehat: false },
  { id: "Masa 4", label: "Masa 4", waktu: "8.30 – 9.00 pagi", isRehat: false },
  { id: "Masa 5", label: "Masa 5", waktu: "9.00 – 9.30 pagi", isRehat: false },
  { id: "Masa 6", label: "Masa 6", waktu: "9.30 – 10.00 pagi", isRehat: true }, // REHAT
  { id: "Masa 7", label: "Masa 7", waktu: "10.00 – 10.30 pagi", isRehat: false },
  { id: "Masa 8", label: "Masa 8", waktu: "10.30 – 11.00 pagi", isRehat: false },
  { id: "Masa 9", label: "Masa 9", waktu: "11.00 – 11.30 pagi", isRehat: false },
  { id: "Masa 10", label: "Masa 10", waktu: "11.30 – 12.00 tengahari", isRehat: false },
  { id: "Masa 11", label: "Masa 11", waktu: "12.00 – 12.30 tengahari", isRehat: false },
  { id: "Masa 12", label: "Masa 12", waktu: "12.30 – 1.00 petang", isRehat: false }
];
