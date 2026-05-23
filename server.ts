import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import type { Student, Question, ExamSession, StudentAttempt } from "./src/types.js";
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where,
  getDocFromServer
} from "firebase/firestore";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Resolve paths
const hasImportMetaUrl = typeof import.meta !== "undefined" && !!import.meta.url;
const __filename = hasImportMetaUrl ? fileURLToPath(import.meta.url) : "server.js";
const __dirname = hasImportMetaUrl ? path.dirname(__filename) : process.cwd();

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

// Firebase Setup
const configPath = fs.existsSync(path.join(process.cwd(), "firebase-applet-config.json"))
  ? path.join(process.cwd(), "firebase-applet-config.json")
  : path.join(__dirname, "firebase-applet-config.json");

const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
const firebaseApp = initializeApp(firebaseConfig);
const firestoreDb = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

// Test Firestore initialization connection (Skill Critical Requirement)
async function testConnection() {
  try {
    await getDocFromServer(doc(firestoreDb, "test", "connection"));
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.error("[CBT Firebase] Warning: Please check your Firebase configuration or network.");
    }
  }
}
testConnection();

// Initial Database Seeding to Cloud Firestore
async function seedInitialDatabase() {
  try {
    const studentsSnapshot = await getDocs(collection(firestoreDb, "students"));
    if (studentsSnapshot.empty) {
      console.log("[CBT Firebase] Seeding initial students to Firestore...");
      for (const student of initialStudents) {
        await setDoc(doc(firestoreDb, "students", student.nisn), student);
      }
    }

    const questionsSnapshot = await getDocs(collection(firestoreDb, "questions"));
    if (questionsSnapshot.empty) {
      console.log("[CBT Firebase] Seeding initial questions to Firestore...");
      for (const question of initialQuestions) {
        await setDoc(doc(firestoreDb, "questions", question.id), question);
      }
    }

    const sessionsSnapshot = await getDocs(collection(firestoreDb, "sessions"));
    if (sessionsSnapshot.empty) {
      console.log("[CBT Firebase] Seeding initial sessions to Firestore...");
      for (const s of initialSessions) {
        await setDoc(doc(firestoreDb, "sessions", s.id), s);
      }
    }
    console.log("[CBT Firebase] Cloud Firestore seeding verify completed.");
  } catch (error) {
    console.error("[CBT Firebase] Seeding verify error:", error);
  }
}
seedInitialDatabase();

// Firestore Error handler interface & function (Skill requirement)
enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {},
    operationType,
    path
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Helper to query all questions from Firestore
async function getAllQuestions(): Promise<Question[]> {
  const querySnapshot = await getDocs(collection(firestoreDb, "questions")).catch(err => {
    handleFirestoreError(err, OperationType.LIST, "questions");
  });
  const list: Question[] = [];
  if (querySnapshot) {
    querySnapshot.forEach(doc => {
      list.push(doc.data() as Question);
    });
  }
  return list;
}

// Helper to query all sessions from Firestore
async function getAllSessions(): Promise<ExamSession[]> {
  const querySnapshot = await getDocs(collection(firestoreDb, "sessions")).catch(err => {
    handleFirestoreError(err, OperationType.LIST, "sessions");
  });
  const list: ExamSession[] = [];
  if (querySnapshot) {
    querySnapshot.forEach(doc => {
      list.push(doc.data() as ExamSession);
    });
  }
  return list;
}

// API ROUTES: Authentication
app.post("/api/auth/login", async (req, res) => {
  const { role, username, nisn, password } = req.body;

  try {
    if (role === "admin") {
      if (username === "admin" && password === "admin123") {
        return res.json({ success: true, role: "admin", name: "Kepala Kurikulum / Admin" });
      }
      return res.status(401).json({ success: false, message: "Username atau Password Admin salah!" });
    } else if (role === "student") {
      if (!nisn) {
        return res.status(400).json({ success: false, message: "NISN diperlukan." });
      }
      const studentDocRef = doc(firestoreDb, "students", nisn);
      const studentDoc = await getDoc(studentDocRef).catch(err => {
        handleFirestoreError(err, OperationType.GET, `students/${nisn}`);
      });
      
      if (!studentDoc || !studentDoc.exists()) {
        return res.status(401).json({ success: false, message: "NISN tidak terdaftar di database sekolah." });
      }
      
      const student = studentDoc.data() as Student;
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
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Internal Server Error" });
  }
});

// API: Students CRUD
app.get("/api/students", async (req, res) => {
  try {
    const querySnapshot = await getDocs(collection(firestoreDb, "students")).catch(err => {
      handleFirestoreError(err, OperationType.LIST, "students");
    });
    const students: Student[] = [];
    if (querySnapshot) {
      querySnapshot.forEach(doc => {
        students.push(doc.data() as Student);
      });
    }
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Gagal mengambil data siswa." });
  }
});

app.post("/api/students", async (req, res) => {
  const student: Student = req.body;
  if (!student.nisn || !student.name || !student.classRoom) {
    return res.status(400).json({ message: "Data siswa kurang lengkap. Isi NISN, Nama, dan Kelas." });
  }

  try {
    const studentDocRef = doc(firestoreDb, "students", student.nisn);
    const studentExists = await getDoc(studentDocRef).catch(err => {
      handleFirestoreError(err, OperationType.GET, `students/${student.nisn}`);
    });
    
    if (studentExists && studentExists.exists()) {
      return res.status(400).json({ message: `Siswa dengan NISN ${student.nisn} sudah terdaftar!` });
    }

    if (!student.password) {
      student.password = "123"; // default password
    }

    await setDoc(studentDocRef, student).catch(err => {
      handleFirestoreError(err, OperationType.CREATE, `students/${student.nisn}`);
    });
    
    res.status(201).json(student);
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Gagal menambahkan siswa." });
  }
});

app.put("/api/students/:nisn", async (req, res) => {
  const { nisn } = req.params;
  const updatedData: Partial<Student> = req.body;

  try {
    const studentDocRef = doc(firestoreDb, "students", nisn);
    const studentDoc = await getDoc(studentDocRef).catch(err => {
      handleFirestoreError(err, OperationType.GET, `students/${nisn}`);
    });
    if (!studentDoc || !studentDoc.exists()) {
      return res.status(404).json({ message: "Siswa tidak ditemukan." });
    }

    const merged = { ...studentDoc.data(), ...updatedData };
    await setDoc(studentDocRef, merged).catch(err => {
      handleFirestoreError(err, OperationType.UPDATE, `students/${nisn}`);
    });
    
    res.json(merged);
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Gagal memperbarui siswa." });
  }
});

app.delete("/api/students/:nisn", async (req, res) => {
  const { nisn } = req.params;

  try {
    const studentDocRef = doc(firestoreDb, "students", nisn);
    await deleteDoc(studentDocRef).catch(err => {
      handleFirestoreError(err, OperationType.DELETE, `students/${nisn}`);
    });

    // Also clean attempts to maintain consistency
    const attemptsSnapshot = await getDocs(query(collection(firestoreDb, "attempts"), where("nisn", "==", nisn)));
    attemptsSnapshot.forEach(async (d) => {
      await deleteDoc(doc(firestoreDb, "attempts", d.id)).catch(err => {
        handleFirestoreError(err, OperationType.DELETE, `attempts/${d.id}`);
      });
    });

    res.json({ message: "Siswa berhasil dihapus." });
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Gagal menghapus siswa." });
  }
});

// API: Questions CRUD
app.get("/api/questions", async (req, res) => {
  try {
    const querySnapshot = await getDocs(collection(firestoreDb, "questions")).catch(err => {
      handleFirestoreError(err, OperationType.LIST, "questions");
    });
    const questions: Question[] = [];
    if (querySnapshot) {
      querySnapshot.forEach(doc => {
        questions.push(doc.data() as Question);
      });
    }
    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Gagal mengambil data soal." });
  }
});

app.post("/api/questions", async (req, res) => {
  const question: Question = req.body;
  if (!question.subject || !question.text || !question.options || !question.correctAnswer) {
    return res.status(400).json({ message: "Gagal membuat soal. Lengkapi subjek, teks soal, opsi multiple choice, dan kunci jawaban." });
  }

  question.id = "q_" + Date.now();

  try {
    await setDoc(doc(firestoreDb, "questions", question.id), question).catch(err => {
      handleFirestoreError(err, OperationType.CREATE, `questions/${question.id}`);
    });
    res.status(201).json(question);
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Gagal menambahkan soal." });
  }
});

app.put("/api/questions/:id", async (req, res) => {
  const { id } = req.params;
  const updatedData: Partial<Question> = req.body;

  try {
    const questionDocRef = doc(firestoreDb, "questions", id);
    const questionDoc = await getDoc(questionDocRef).catch(err => {
      handleFirestoreError(err, OperationType.GET, `questions/${id}`);
    });
    if (!questionDoc || !questionDoc.exists()) {
      return res.status(404).json({ message: "Soal tidak ditemukan." });
    }

    const merged = { ...questionDoc.data(), ...updatedData };
    await setDoc(questionDocRef, merged).catch(err => {
      handleFirestoreError(err, OperationType.UPDATE, `questions/${id}`);
    });
    res.json(merged);
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Gagal memperbarui soal." });
  }
});

app.delete("/api/questions/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await deleteDoc(doc(firestoreDb, "questions", id)).catch(err => {
      handleFirestoreError(err, OperationType.DELETE, `questions/${id}`);
    });
    res.json({ message: "Soal berhasil dihapus dari bank soal." });
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Gagal menghapus soal." });
  }
});

// API: Exam Sessions CRUD
app.get("/api/sessions", async (req, res) => {
  try {
    const querySnapshot = await getDocs(collection(firestoreDb, "sessions")).catch(err => {
      handleFirestoreError(err, OperationType.LIST, "sessions");
    });
    const sessions: ExamSession[] = [];
    if (querySnapshot) {
      querySnapshot.forEach(doc => {
        sessions.push(doc.data() as ExamSession);
      });
    }
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Gagal mengambil database sesi." });
  }
});

app.post("/api/sessions", async (req, res) => {
  const session: ExamSession = req.body;
  if (!session.subject || !session.date || !session.duration || !session.token) {
    return res.status(400).json({ message: "Gagal menyetel sesi. Isi Mata Pelajaran, Tanggal, Durasi (menit), dan Token ujian." });
  }

  session.id = "s_" + Date.now();
  session.isClosed = false;

  try {
    await setDoc(doc(firestoreDb, "sessions", session.id), session).catch(err => {
      handleFirestoreError(err, OperationType.CREATE, `sessions/${session.id}`);
    });
    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Gagal menyetel sesi baru." });
  }
});

app.put("/api/sessions/:id", async (req, res) => {
  const { id } = req.params;
  const updatedData: Partial<ExamSession> = req.body;

  try {
    const sessionDocRef = doc(firestoreDb, "sessions", id);
    const sessionDoc = await getDoc(sessionDocRef).catch(err => {
      handleFirestoreError(err, OperationType.GET, `sessions/${id}`);
    });
    if (!sessionDoc || !sessionDoc.exists()) {
      return res.status(404).json({ message: "Sesi ujian tidak ditemukan." });
    }

    const merged = { ...sessionDoc.data(), ...updatedData };
    await setDoc(sessionDocRef, merged).catch(err => {
      handleFirestoreError(err, OperationType.UPDATE, `sessions/${id}`);
    });
    res.json(merged);
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Gagal mengubah sesi." });
  }
});

app.delete("/api/sessions/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await deleteDoc(doc(firestoreDb, "sessions", id)).catch(err => {
      handleFirestoreError(err, OperationType.DELETE, `sessions/${id}`);
    });

    // Also clean related attempts
    const attemptsSnapshot = await getDocs(query(collection(firestoreDb, "attempts"), where("examSessionId", "==", id)));
    attemptsSnapshot.forEach(async (d) => {
      await deleteDoc(doc(firestoreDb, "attempts", d.id)).catch(err => {
        handleFirestoreError(err, OperationType.DELETE, `attempts/${d.id}`);
      });
    });

    res.json({ message: "Sesi berhasil dihapus." });
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Gagal menghapus sesi." });
  }
});

// API: Student Exam Actions (Real-time tracking of Answers, Countdown Calculation, Security logs)

// 1. Get current exam status for a student (checks if they have active sessions in progress to resume)
app.get("/api/exam/status", async (req, res) => {
  const { nisn, sessionId } = req.query;
  if (!nisn || !sessionId) {
    return res.status(400).json({ message: "NISN dan SessionID diperlukan." });
  }

  try {
    const attemptId = `att_${sessionId}_${nisn}`;
    const attemptDoc = await getDoc(doc(firestoreDb, "attempts", attemptId)).catch(err => {
      handleFirestoreError(err, OperationType.GET, `attempts/${attemptId}`);
    });
    const sessionDoc = await getDoc(doc(firestoreDb, "sessions", sessionId as string)).catch(err => {
      handleFirestoreError(err, OperationType.GET, `sessions/${sessionId}`);
    });

    res.json({ 
      attempt: attemptDoc && attemptDoc.exists() ? attemptDoc.data() : null, 
      session: sessionDoc && sessionDoc.exists() ? sessionDoc.data() : null 
    });
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Sistem gagal membaca status ujian." });
  }
});

// 2. Start Exam
app.post("/api/exam/start", async (req, res) => {
  const { nisn, token } = req.body;

  if (!nisn || !token) {
    return res.status(400).json({ message: "NISN dan Token diperlukan untuk memulai ujian." });
  }

  try {
    // Authenticate student again
    const studentDoc = await getDoc(doc(firestoreDb, "students", nisn)).catch(err => {
      handleFirestoreError(err, OperationType.GET, `students/${nisn}`);
    });
    if (!studentDoc || !studentDoc.exists()) {
      return res.status(404).json({ message: "Siswa tidak terdaftar." });
    }
    const student = studentDoc.data() as Student;

    // Find Session via Token
    const allSess = await getAllSessions().catch(() => [] as ExamSession[]);
    const session = allSess.find(s => s.token.toUpperCase().trim() === token.toUpperCase().trim() && !s.isClosed);
    if (!session) {
      return res.status(400).json({ message: "Token Ujian tidak valid atau ujian telah ditutup oleh pengawas!" });
    }

    const attemptId = `att_${session.id}_${nisn}`;
    // Check if they already have an attempt
    const attemptDoc = await getDoc(doc(firestoreDb, "attempts", attemptId)).catch(err => {
      handleFirestoreError(err, OperationType.GET, `attempts/${attemptId}`);
    });

    const allQ = await getAllQuestions();
    const questionsForSubject = allQ.filter(q => q.subject === session.subject);

    if (attemptDoc && attemptDoc.exists()) {
      const attempt = attemptDoc.data() as StudentAttempt;
      if (attempt.isSubmitted) {
        return res.status(400).json({ message: "Anda sudah mengumpulkan ujian ini sebelumnya." });
      }
      // Recover existing session (this fully implements "siswa refresh -> timer tidak reset + jawaban aman")
      return res.json({
        message: "Melanjutkan sesi ujian yang sedang berjalan.",
        attempt,
        session,
        questions: questionsForSubject
      });
    }

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

    await setDoc(doc(firestoreDb, "attempts", attemptId), newAttempt).catch(err => {
      handleFirestoreError(err, OperationType.CREATE, `attempts/${attemptId}`);
    });

    res.json({
      message: "Sesi ujian baru berhasil dimulai.",
      attempt: newAttempt,
      session,
      questions: questionsForSubject
    });
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Gagal memulai sesi ujian." });
  }
});

// 3. Real-time Save state (answers + doubtful tracker)
app.post("/api/exam/update", async (req, res) => {
  const { attemptId, answers, doubtfulAnswers, antiCheatWarnings } = req.body;

  if (!attemptId) {
    return res.status(400).json({ message: "Attempt ID diperlukan." });
  }

  try {
    const attemptDocRef = doc(firestoreDb, "attempts", attemptId);
    const attemptDoc = await getDoc(attemptDocRef).catch(err => {
      handleFirestoreError(err, OperationType.GET, `attempts/${attemptId}`);
    });
    
    if (!attemptDoc || !attemptDoc.exists()) {
      return res.status(404).json({ message: "Sesi ujian aktif tidak ditemukan." });
    }

    const attempt = attemptDoc.data() as StudentAttempt;

    if (attempt.isSubmitted) {
      return res.status(400).json({ message: "Sesi ujian ini telah dipasrahkan/selesai." });
    }

    // Update in-flight state
    if (answers !== undefined) {
      attempt.answers = { ...attempt.answers, ...answers };
    }
    if (doubtfulAnswers !== undefined) {
      attempt.doubtfulAnswers = doubtfulAnswers;
    }
    if (antiCheatWarnings !== undefined) {
      attempt.antiCheatWarnings = antiCheatWarnings;
    }

    // Recalculate unanswered count during sync
    const sessionDoc = await getDoc(doc(firestoreDb, "sessions", attempt.examSessionId)).catch(err => {
      handleFirestoreError(err, OperationType.GET, `sessions/${attempt.examSessionId}`);
    });
    
    if (sessionDoc && sessionDoc.exists()) {
      const session = sessionDoc.data() as ExamSession;
      const allQ = await getAllQuestions();
      const questionsForSubject = allQ.filter(q => q.subject === session.subject);
      const answeredCount = Object.keys(attempt.answers).length;
      attempt.unansweredCount = Math.max(0, questionsForSubject.length - answeredCount);
    }

    await setDoc(attemptDocRef, attempt).catch(err => {
      handleFirestoreError(err, OperationType.UPDATE, `attempts/${attemptId}`);
    });
    
    res.json({ success: true, attempt });
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Gagal sinkronisasi data real-time." });
  }
});

// 4. Submit active exam (calculates correctness percentage, score, updates flags)
app.post("/api/exam/submit", async (req, res) => {
  const { attemptId, finalAnswers } = req.body;

  if (!attemptId) {
    return res.status(400).json({ message: "Attempt ID tidak lengkap." });
  }

  try {
    const attemptDocRef = doc(firestoreDb, "attempts", attemptId);
    const attemptDoc = await getDoc(attemptDocRef).catch(err => {
      handleFirestoreError(err, OperationType.GET, `attempts/${attemptId}`);
    });
    if (!attemptDoc || !attemptDoc.exists()) {
      return res.status(404).json({ message: "Sesi ujian tidak ditemukan." });
    }

    const attempt = attemptDoc.data() as StudentAttempt;
    if (attempt.isSubmitted) {
      return res.json({ message: "Sudah disubmit sebelumnya.", attempt });
    }

    // Incorporate any final answers
    if (finalAnswers) {
      attempt.answers = { ...attempt.answers, ...finalAnswers };
    }

    // Fetch subject questions to grade
    const sessionDoc = await getDoc(doc(firestoreDb, "sessions", attempt.examSessionId)).catch(err => {
      handleFirestoreError(err, OperationType.GET, `sessions/${attempt.examSessionId}`);
    });
    if (!sessionDoc || !sessionDoc.exists()) {
      return res.status(404).json({ message: "Data mata pelajaran sesi ujian hilang." });
    }

    const session = sessionDoc.data() as ExamSession;
    const allQ = await getAllQuestions();
    const questions = allQ.filter(q => q.subject === session.subject);

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

    await setDoc(attemptDocRef, attempt).catch(err => {
      handleFirestoreError(err, OperationType.UPDATE, `attempts/${attemptId}`);
    });

    res.json({
      message: "Ujian selesai dikoreksi dan dikumpulkan otomatis oleh sistem.",
      attempt
    });
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Gagal mengumpulkan ujian." });
  }
});

// API: Result Overview & Report Analysis for Teacher Panel
app.get("/api/results", async (req, res) => {
  try {
    const querySnapshot = await getDocs(collection(firestoreDb, "attempts")).catch(err => {
      handleFirestoreError(err, OperationType.LIST, "attempts");
    });
    const attempts: StudentAttempt[] = [];
    if (querySnapshot) {
      querySnapshot.forEach(doc => {
        attempts.push(doc.data() as StudentAttempt);
      });
    }

    const allSess = await getAllSessions().catch(() => [] as ExamSession[]);

    const resultsInfo = attempts.map(attempt => {
      const session = allSess.find(s => s.id === attempt.examSessionId);
      return {
        ...attempt,
        subject: session ? session.subject : "Mata Pelajaran Tidak Diketahui",
        duration: session ? session.duration : 0,
        sessionDate: session ? session.date : "",
        tokenUsed: session ? session.token : ""
      };
    });
    res.json(resultsInfo);
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Gagal mengambil data riwayat nilai." });
  }
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
