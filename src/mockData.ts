import { Student, Question, ExamSession } from "./types";

export const initialStudents: Student[] = [
  { nisn: "1234567890", name: "Ahmad Fauzi", classRoom: "XII RPL 1", password: "123" },
  { nisn: "0987654321", name: "Siti Aminah", classRoom: "XII RPL 1", password: "123" },
  { nisn: "1122334455", name: "Budi Santoso", classRoom: "XII IPA 2", password: "123" },
  { nisn: "5544332211", name: "Dewi Lestari", classRoom: "XII IPS 3", password: "123" },
  { nisn: "9988776655", name: "Rian Hidayat", classRoom: "XII IPA 1", password: "123" }
];

export const initialQuestions: Question[] = [
  {
    id: "q1",
    subject: "Matematika",
    text: "Jika f(x) = 3x + 4 dan g(x) = 2x - 1, maka komposisi fungsi (f o g)(x) adalah...",
    options: [
      { key: "A", text: "6x + 1" },
      { key: "B", text: "6x + 3" },
      { key: "C", text: "6x - 1" },
      { key: "D", text: "5x + 3" },
      { key: "E", text: "6x + 7" }
    ],
    correctAnswer: "A"
  },
  {
    id: "q2",
    subject: "Matematika",
    text: "Di bawah ini, manakah grafik yang menunjukkan fungsi eksponensial y = 2^x?",
    imageUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&auto=format&fit=crop&q=60",
    options: [
      { key: "A", text: "Garis lurus naik dari kiri bawah ke kanan atas" },
      { key: "B", text: "Kurva mulus yang memotong sumbu Y di (0,1) dan meningkat sangat cepat dibanding sumbu X positif" },
      { key: "C", text: "Kurva parabola terbuka ke atas" },
      { key: "D", text: "Garis horizontal sejajar dengan sumbu X" },
      { key: "E", text: "Lingkaran berpusat di titik asal (0,0)" }
    ],
    correctAnswer: "B"
  },
  {
    id: "q3",
    subject: "Bahasa Indonesia",
    text: "Ide pokok paragraf di atas membahas tentang...",
    options: [
      { key: "A", text: "Dampak pemanasan global bagi kehidupan nelayan" },
      { key: "B", text: "Langkah taktis mengatasi abrasi pantai utara Jawa" },
      { key: "C", text: "Peningkatan suhu air laut secara ekstrem" },
      { key: "D", text: "Solusi energi terbarukan di pedesaan" },
      { key: "E", text: "Kerja bakti tahunan warga pesisir pantai" }
    ],
    correctAnswer: "A"
  },
  {
    id: "q4",
    subject: "Bahasa Indonesia",
    text: "Penulisan kata serapan yang tepat terdapat pada kalimat...",
    options: [
      { key: "A", text: "Aktivitas bongkar muat di pelabuhan berjalan dinamis." },
      { key: "B", text: "Siswa kelas XII sedang melakukan praktek fisika di laboratorium." },
      { key: "C", text: "Guru menekankan pentingnya analisa data dalam laporan ilmiah." },
      { key: "D", text: "Kualitas produk kerajinan bambu itu perlu distandarisir." },
      { key: "E", text: "Jadwal ujian sudah dikoordinir oleh panitia sekolah." }
    ],
    correctAnswer: "A"
  },
  {
    id: "q5",
    subject: "Fisika",
    text: "Sebuah balok bermassa 5 kg ditarik dengan gaya horizontal sebesar 20 N di atas lantai tanpa gesekan. Berapakah percepatan balok tersebut?",
    options: [
      { key: "A", text: "2 m/s²" },
      { key: "B", text: "4 m/s²" },
      { key: "C", text: "8 m/s²" },
      { key: "D", text: "10 m/s²" },
      { key: "E", text: "25 m/s²" }
    ],
    correctAnswer: "B"
  },
  {
    id: "q6",
    subject: "Fisika",
    text: "Manakah dari diagram berikut yang mendemonstrasikan sistem pengungkit jenis pertama (tuas golongan 1) dengan titik tumpu berada di antara beban dan kuasa?",
    imageUrl: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=400&auto=format&fit=crop&q=60",
    options: [
      { key: "A", text: "Gunting atau jungkat-jungkit (Titik Tumpu di tengah)" },
      { key: "B", text: "Gerobak roda satu (Beban di tengah)" },
      { key: "C", text: "Pinset atau staples (Kuasa di tengah)" },
      { key: "D", text: "Tangga dorong pemadam kebakaran" },
      { key: "E", text: "Katrol bebas bergerak" }
    ],
    correctAnswer: "A"
  },
  {
    id: "q7",
    subject: "Bahasa Inggris",
    text: "Choose the correct expression to complete the interview dialog:\nInterviewers: 'Why are you interested in this internship position?'\nApplicant: '... I can apply my knowledge from vocational school.'",
    options: [
      { key: "A", text: "Because I want to make easy money." },
      { key: "B", text: "Because it offers great hands-on learning opportunity where..." },
      { key: "C", text: "Since my friends recommended it to me." },
      { key: "D", text: "So I can ignore my theory textbooks." },
      { key: "E", text: "Actually, I have nothing else to do this semester." }
    ],
    correctAnswer: "B"
  }
];

export const initialSessions: ExamSession[] = [
  {
    id: "s1",
    subject: "Matematika",
    date: "2026-05-24",
    duration: 60,
    token: "MTK123",
    isClosed: false
  },
  {
    id: "s2",
    subject: "Bahasa Indonesia",
    date: "2026-05-25",
    duration: 90,
    token: "IND456",
    isClosed: false
  },
  {
    id: "s3",
    subject: "Fisika",
    date: "2026-05-26",
    duration: 45,
    token: "FIS789",
    isClosed: false
  }
];
