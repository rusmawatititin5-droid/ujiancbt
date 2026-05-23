import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import type { Student, Question, ExamSession, StudentAttempt } from "./src/types.js";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Resolve paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = process.env.VERCEL ? "/tmp" : path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

// Ensure Data Directory and DB File exist
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error("Failed to create DATA_DIR:", err);
  }
}

// On Vercel, if DB_FILE in /tmp doesn't exist, check if we have database template to copy from source package
if (process.env.VERCEL && !fs.existsSync(DB_FILE)) {
  const templatePath = path.join(process.cwd(), "data", "db.json");
  if (fs.existsSync(templatePath)) {
    try {
      fs.copyFileSync(templatePath, DB_FILE);
      console.log("[CBT] Seeded database to /tmp/db.json from template");
    } catch (err) {
      console.error("[CBT] Failed to copy database template to /tmp:", err);
    }
  }
}

// Initial Seeding Data
const initialStudents: Student[] = [
  { nisn: "1234567890", name: "Ahmad Fauzi", classRoom: "XII RPL 1", password: "123" },
  { nisn: "0987654321", name: "Siti Aminah", classRoom: "XII RPL 1", password: "123" },
  { nisn: "1122334455", name: "Budi Santoso", classRoom: "XII IPA 2", password: "123" },
  { nisn: "5544332211", name: "Dewi Lestari", classRoom: "XII IPS 3", password: "123" },
  { nisn: "9988776655", name: "Rian Hidayat", classRoom: "XII IPA 1", password: "123" }
];

const initialQuestions: Question[] = [
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
    imageUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&auto=format&fit=crop&q=60", // Math background illustrative
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
    imageUrl: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=400&auto=format&fit=crop&q=60", // physics tools
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
    text: "Choose the correct expression to complete the interview dialog:\nInterviewers: 'Why are you interested in this internship position?'\nApplicant: '... I can apply my knowledge from vocational school.'"
    ,
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

const initialSessions: ExamSession[] = [
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

interface DBStructure {
  students: Student[];
  questions: Question[];
  sessions: ExamSession[];
  attempts: StudentAttempt[];
}

const loadDB = (): DBStructure => {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (error) {
    console.error("Error reading database file, resetting to blank details", error);
  }
  // Default Seed
  const dbData: DBStructure = {
    students: initialStudents,
    questions: initialQuestions,
    sessions: initialSessions,
    attempts: []
  };
  saveDB(dbData);
  return dbData;
};

const saveDB = (dbData: DBStructure) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to save database file:", error);
  }
};

// Auto boot database
let db = loadDB();

// API ROUTES: Authenticaton
app.post("/api/auth/login", (req, res) => {
  const { role, username, nisn, password } = req.body;

  if (role === "admin") {
    if (username === "admin" && password === "admin123") {
      return res.json({ success: true, role: "admin", name: "Kepala Kurikulum / Admin" });
    }
    return res.status(401).json({ success: false, message: "Username atau Password Admin salah!" });
  } else if (role === "student") {
    const student = db.students.find(s => s.nisn === nisn);
    if (!student) {
      return res.status(401).json({ success: false, message: "NISN tidak terdaftar di database sekolah." });
    }
    // Checking password (default '123' if not matches)
    const storedPassword = student.password || "123";
    if (password === storedPassword) {
      return res.json({
        success: true,
        role: "student",
        student: {
          nisn: student.nisn,
          name: student.name,
          classRoom: student.classRoom
        }
      });
    }
    return res.status(401).json({ success: false, message: "Sandi NISN salah. (Kunci Asal: 123)" });
  }

  return res.status(400).json({ success: false, message: "Peran autentikasi tidak valid." });
});

// API: Students CRUD
app.get("/api/students", (req, res) => {
  res.json(db.students);
});

app.post("/api/students", (req, res) => {
  const student: Student = req.body;
  if (!student.nisn || !student.name || !student.classRoom) {
    return res.status(400).json({ message: "Data siswa kurang lengkap. Isi NISN, Nama, dan Kelas." });
  }

  // Check unique NISN
  if (db.students.some(s => s.nisn === student.nisn)) {
    return res.status(400).json({ message: `Siswa dengan NISN ${student.nisn} sudah terdaftar!` });
  }

  if (!student.password) {
    student.password = "123"; // default password
  }

  db.students.push(student);
  saveDB(db);
  res.status(201).json(student);
});

app.put("/api/students/:nisn", (req, res) => {
  const { nisn } = req.params;
  const updatedData: Partial<Student> = req.body;

  const idx = db.students.findIndex(s => s.nisn === nisn);
  if (idx === -1) {
    return res.status(404).json({ message: "Siswa tidak ditemukan." });
  }

  db.students[idx] = { ...db.students[idx], ...updatedData };
  saveDB(db);
  res.json(db.students[idx]);
});

app.delete("/api/students/:nisn", (req, res) => {
  const { nisn } = req.params;
  db.students = db.students.filter(s => s.nisn !== nisn);
  // Also clean attempts to maintain consistency
  db.attempts = db.attempts.filter(a => a.nisn !== nisn);
  saveDB(db);
  res.json({ message: "Siswa berhasil dihapus." });
});

// API: Questions CRUD
app.get("/api/questions", (req, res) => {
  res.json(db.questions);
});

app.post("/api/questions", (req, res) => {
  const question: Question = req.body;
  if (!question.subject || !question.text || !question.options || !question.correctAnswer) {
    return res.status(400).json({ message: "Gagal membuat soal. Lengkapi subjek, teks soal, opsi multiple choice, dan kunci jawaban." });
  }

  question.id = "q_" + Date.now();
  db.questions.push(question);
  saveDB(db);
  res.status(201).json(question);
});

app.put("/api/questions/:id", (req, res) => {
  const { id } = req.params;
  const updatedData: Partial<Question> = req.body;

  const idx = db.questions.findIndex(q => q.id === id);
  if (idx === -1) {
    return res.status(404).json({ message: "Soal tidak ditemukan." });
  }

  db.questions[idx] = { ...db.questions[idx], ...updatedData };
  saveDB(db);
  res.json(db.questions[idx]);
});

app.delete("/api/questions/:id", (req, res) => {
  const { id } = req.params;
  db.questions = db.questions.filter(q => q.id !== id);
  saveDB(db);
  res.json({ message: "Soal berhasil dihapus dari bank soal." });
});

// API: Exam Sessions CRUD
app.get("/api/sessions", (req, res) => {
  res.json(db.sessions);
});

app.post("/api/sessions", (req, res) => {
  const session: ExamSession = req.body;
  if (!session.subject || !session.date || !session.duration || !session.token) {
    return res.status(400).json({ message: "Gagal menyetel sesi. Isi Mata Pelajaran, Tanggal, Durasi (menit), dan Token ujian." });
  }

  session.id = "s_" + Date.now();
  session.isClosed = false;
  db.sessions.push(session);
  saveDB(db);
  res.status(201).json(session);
});

app.put("/api/sessions/:id", (req, res) => {
  const { id } = req.params;
  const updatedData: Partial<ExamSession> = req.body;

  const idx = db.sessions.findIndex(s => s.id === id);
  if (idx === -1) {
    return res.status(404).json({ message: "Sesi ujian tidak ditemukan." });
  }

  db.sessions[idx] = { ...db.sessions[idx], ...updatedData };
  saveDB(db);
  res.json(db.sessions[idx]);
});

app.delete("/api/sessions/:id", (req, res) => {
  const { id } = req.params;
  db.sessions = db.sessions.filter(s => s.id !== id);
  // Also clean related attempts
  db.attempts = db.attempts.filter(a => a.examSessionId !== id);
  saveDB(db);
  res.json({ message: "Sesi berhasil dihapus." });
});

// API: Student Exam Actions (Real-time tracking of Answers, Countdown Calculation, Security logs)

// 1. Get current exam status for a student (checks if they have active sessions in progress to resume)
app.get("/api/exam/status", (req, res) => {
  const { nisn, sessionId } = req.query;
  if (!nisn || !sessionId) {
    return res.status(400).json({ message: "NISN dan SessionID diperlukan." });
  }

  const attempt = db.attempts.find(a => a.nisn === nisn && a.examSessionId === sessionId);
  const session = db.sessions.find(s => s.id === sessionId);

  res.json({ attempt, session });
});

// 2. Start Exam
app.post("/api/exam/start", (req, res) => {
  const { nisn, token } = req.body;

  if (!nisn || !token) {
    return res.status(400).json({ message: "NISN dan Token diperlukan untuk memulai ujian." });
  }

  // Authenticate student again
  const student = db.students.find(s => s.nisn === nisn);
  if (!student) {
    return res.status(404).json({ message: "Siswa tidak terdaftar." });
  }

  // Find Session via Token
  const session = db.sessions.find(s => s.token.toUpperCase().trim() === token.toUpperCase().trim() && !s.isClosed);
  if (!session) {
    return res.status(400).json({ message: "Token Ujian tidak valid atau ujian telah ditutup oleh pengawas!" });
  }

  // Check if they already have an attempt
  let attempt = db.attempts.find(a => a.nisn === nisn && a.examSessionId === session.id);

  if (attempt) {
    if (attempt.isSubmitted) {
      return res.status(400).json({ message: "Anda sudah mengumpulkan ujian ini sebelumnya." });
    }
    // Recover existing session (this fully implements "siswa refresh -> timer tidak reset + jawaban aman")
    return res.json({
      message: "Melanjutkan sesi ujian yang sedang berjalan.",
      attempt,
      session,
      questions: db.questions.filter(q => q.subject === session.subject)
    });
  }

  // Create new Exam Attempt
  const attemptId = `att_${session.id}_${nisn}`;
  const questionsForSubject = db.questions.filter(q => q.subject === session.subject);

  if (questionsForSubject.length === 0) {
    return res.status(400).json({ message: `Belum ada bank soal tersedia untuk mata pelajaran ${session.subject}.` });
  }

  const newAttempt: StudentAttempt = {
    id: attemptId,
    examSessionId: session.id,
    nisn: student.nisn,
    studentName: student.name,
    classRoom: student.classRoom,
    startTime: new Date().toISOString(),
    answers: {},
    doubtfulAnswers: [],
    isSubmitted: false,
    score: 0,
    correctCount: 0,
    incorrectCount: 0,
    unansweredCount: questionsForSubject.length,
    antiCheatWarnings: 0
  };

  db.attempts.push(newAttempt);
  saveDB(db);

  res.json({
    message: "Sesi ujian baru berhasil dimulai.",
    attempt: newAttempt,
    session,
    questions: questionsForSubject
  });
});

// 3. Real-time Save state (answers + doubtful tracker)
app.post("/api/exam/update", (req, res) => {
  const { attemptId, answers, doubtfulAnswers, antiCheatWarnings } = req.body;

  if (!attemptId) {
    return res.status(400).json({ message: "Attempt ID diperlukan." });
  }

  const idx = db.attempts.findIndex(a => a.id === attemptId);
  if (idx === -1) {
    return res.status(404).json({ message: "Sesi ujian aktif tidak ditemukan." });
  }

  if (db.attempts[idx].isSubmitted) {
    return res.status(400).json({ message: "Sesi ujian ini telah dipasrahkan/selesai." });
  }

  // Update in-flight state
  if (answers !== undefined) {
    db.attempts[idx].answers = { ...db.attempts[idx].answers, ...answers };
  }
  if (doubtfulAnswers !== undefined) {
    db.attempts[idx].doubtfulAnswers = doubtfulAnswers;
  }
  if (antiCheatWarnings !== undefined) {
    db.attempts[idx].antiCheatWarnings = antiCheatWarnings;
  }

  // Recalculate unanswered count during sync
  const session = db.sessions.find(s => s.id === db.attempts[idx].examSessionId);
  if (session) {
    const questionsForSubject = db.questions.filter(q => q.subject === session.subject);
    const answeredCount = Object.keys(db.attempts[idx].answers).length;
    db.attempts[idx].unansweredCount = Math.max(0, questionsForSubject.length - answeredCount);
  }

  saveDB(db);
  res.json({ success: true, attempt: db.attempts[idx] });
});

// 4. Submit active exam (calculates correctness percentage, score, updates flags)
app.post("/api/exam/submit", (req, res) => {
  const { attemptId, finalAnswers } = req.body;

  if (!attemptId) {
    return res.status(400).json({ message: "Attempt ID tidak lengkap." });
  }

  const idx = db.attempts.findIndex(a => a.id === attemptId);
  if (idx === -1) {
    return res.status(404).json({ message: "Sesi ujian tidak ditemukan." });
  }

  const attempt = db.attempts[idx];
  if (attempt.isSubmitted) {
    return res.json({ message: "Sudah disubmit sebelumnya.", attempt });
  }

  // Incorporate any final answers
  if (finalAnswers) {
    attempt.answers = { ...attempt.answers, ...finalAnswers };
  }

  // Fetch subject questions to grade
  const session = db.sessions.find(s => s.id === attempt.examSessionId);
  if (!session) {
    return res.status(404).json({ message: "Data mata pelajaran sesi ujian hilang." });
  }

  const questions = db.questions.filter(q => q.subject === session.subject);

  let correct = 0;
  let incorrect = 0;
  let unanswered = 0;

  questions.forEach(q => {
    const studentAnswer = attempt.answers[q.id];
    if (!studentAnswer) {
      unanswered++;
    } else if (studentAnswer.toUpperCase().trim() === q.correctAnswer.toUpperCase().trim()) {
      correct++;
    } else {
      incorrect++;
    }
  });

  // Calculate final score out of 100
  const score = questions.length > 0 ? parseFloat(((correct / questions.length) * 100).toFixed(2)) : 0;

  attempt.isSubmitted = true;
  attempt.correctCount = correct;
  attempt.incorrectCount = incorrect;
  attempt.unansweredCount = unanswered;
  attempt.score = score;
  attempt.endTime = new Date().toISOString();

  // Commit update to database JSON file
  db.attempts[idx] = attempt;
  saveDB(db);

  res.json({
    message: "Ujian selesai dikoreksi dan dikumpulkan otomatis oleh sistem.",
    attempt
  });
});

// API: Result Overview & Report Analysis for Teacher Panel
app.get("/api/results", (req, res) => {
  // Let's rich map results with related subjects/stats
  const resultsInfo = db.attempts.map(attempt => {
    const session = db.sessions.find(s => s.id === attempt.examSessionId);
    return {
      ...attempt,
      subject: session ? session.subject : "Mata Pelajaran Tidak Diketahui",
      duration: session ? session.duration : 0,
      sessionDate: session ? session.date : "",
      tokenUsed: session ? session.token : ""
    };
  });
  res.json(resultsInfo);
});


// Dev & Production serving middlewares logic
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[CBT SERVER] Started running on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
