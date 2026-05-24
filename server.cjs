var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server.ts
var server_exports = {};
__export(server_exports, {
  default: () => server_default
});
module.exports = __toCommonJS(server_exports);
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_url = require("url");
var import_dotenv = __toESM(require("dotenv"), 1);
var import_app = require("firebase/app");
var import_firestore = require("firebase/firestore");
var import_meta = {};
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json({ limit: "50mb" }));
app.use(import_express.default.urlencoded({ limit: "50mb", extended: true }));
var hasImportMetaUrl = typeof import_meta !== "undefined" && !!import_meta.url;
var __filename = hasImportMetaUrl ? (0, import_url.fileURLToPath)(import_meta.url) : "server.js";
var __dirname = hasImportMetaUrl ? import_path.default.dirname(__filename) : process.cwd();
var initialStudents = [
  { nisn: "1234567890", name: "Ahmad Fauzi", classRoom: "XII RPL 1", password: "123" },
  { nisn: "0987654321", name: "Siti Aminah", classRoom: "XII RPL 1", password: "123" },
  { nisn: "1122334455", name: "Budi Santoso", classRoom: "XII IPA 2", password: "123" },
  { nisn: "5544332211", name: "Dewi Lestari", classRoom: "XII IPS 3", password: "123" },
  { nisn: "9988776655", name: "Rian Hidayat", classRoom: "XII IPA 1", password: "123" }
];
var initialQuestions = [
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
      { key: "A", text: "2 m/s\xB2" },
      { key: "B", text: "4 m/s\xB2" },
      { key: "C", text: "8 m/s\xB2" },
      { key: "D", text: "10 m/s\xB2" },
      { key: "E", text: "25 m/s\xB2" }
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
var initialSessions = [
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
var configPath = import_fs.default.existsSync(import_path.default.join(process.cwd(), "firebase-applet-config.json")) ? import_path.default.join(process.cwd(), "firebase-applet-config.json") : import_path.default.join(__dirname, "firebase-applet-config.json");
var firebaseConfig = JSON.parse(import_fs.default.readFileSync(configPath, "utf8"));
var firebaseApp = (0, import_app.initializeApp)(firebaseConfig);
var firestoreDb = (0, import_firestore.getFirestore)(firebaseApp, firebaseConfig.firestoreDatabaseId);
async function testConnection() {
  try {
    await (0, import_firestore.getDocFromServer)((0, import_firestore.doc)(firestoreDb, "test", "connection"));
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.error("[CBT Firebase] Warning: Please check your Firebase configuration or network.");
    }
  }
}
testConnection();
async function seedInitialDatabase() {
  try {
    const studentsSnapshot = await (0, import_firestore.getDocs)((0, import_firestore.collection)(firestoreDb, "students"));
    if (studentsSnapshot.empty) {
      console.log("[CBT Firebase] Seeding initial students to Firestore...");
      for (const student of initialStudents) {
        await (0, import_firestore.setDoc)((0, import_firestore.doc)(firestoreDb, "students", student.nisn), student);
      }
    }
    const questionsSnapshot = await (0, import_firestore.getDocs)((0, import_firestore.collection)(firestoreDb, "questions"));
    if (questionsSnapshot.empty) {
      console.log("[CBT Firebase] Seeding initial questions to Firestore...");
      for (const question of initialQuestions) {
        await (0, import_firestore.setDoc)((0, import_firestore.doc)(firestoreDb, "questions", question.id), question);
      }
    }
    const sessionsSnapshot = await (0, import_firestore.getDocs)((0, import_firestore.collection)(firestoreDb, "sessions"));
    if (sessionsSnapshot.empty) {
      console.log("[CBT Firebase] Seeding initial sessions to Firestore...");
      for (const s of initialSessions) {
        await (0, import_firestore.setDoc)((0, import_firestore.doc)(firestoreDb, "sessions", s.id), s);
      }
    }
    console.log("[CBT Firebase] Cloud Firestore seeding verify completed.");
  } catch (error) {
    console.error("[CBT Firebase] Seeding verify error:", error);
  }
}
seedInitialDatabase();
function handleFirestoreError(error, operationType, path2) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {},
    operationType,
    path: path2
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
async function getAllQuestions() {
  const querySnapshot = await (0, import_firestore.getDocs)((0, import_firestore.collection)(firestoreDb, "questions")).catch((err) => {
    handleFirestoreError(err, "list" /* LIST */, "questions");
  });
  const list = [];
  if (querySnapshot) {
    querySnapshot.forEach((doc2) => {
      list.push(doc2.data());
    });
  }
  return list;
}
async function getAllSessions() {
  const querySnapshot = await (0, import_firestore.getDocs)((0, import_firestore.collection)(firestoreDb, "sessions")).catch((err) => {
    handleFirestoreError(err, "list" /* LIST */, "sessions");
  });
  const list = [];
  if (querySnapshot) {
    querySnapshot.forEach((doc2) => {
      list.push(doc2.data());
    });
  }
  return list;
}
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
      const studentDocRef = (0, import_firestore.doc)(firestoreDb, "students", nisn);
      const studentDoc = await (0, import_firestore.getDoc)(studentDocRef).catch((err) => {
        handleFirestoreError(err, "get" /* GET */, `students/${nisn}`);
      });
      if (!studentDoc || !studentDoc.exists()) {
        return res.status(401).json({ success: false, message: "NISN tidak terdaftar di database sekolah." });
      }
      const student = studentDoc.data();
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
app.get("/api/students", async (req, res) => {
  try {
    const querySnapshot = await (0, import_firestore.getDocs)((0, import_firestore.collection)(firestoreDb, "students")).catch((err) => {
      handleFirestoreError(err, "list" /* LIST */, "students");
    });
    const students = [];
    if (querySnapshot) {
      querySnapshot.forEach((doc2) => {
        students.push(doc2.data());
      });
    }
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Gagal mengambil data siswa." });
  }
});
app.post("/api/students", async (req, res) => {
  const student = req.body;
  if (!student.nisn || !student.name || !student.classRoom) {
    return res.status(400).json({ message: "Data siswa kurang lengkap. Isi NISN, Nama, dan Kelas." });
  }
  try {
    const studentDocRef = (0, import_firestore.doc)(firestoreDb, "students", student.nisn);
    const studentExists = await (0, import_firestore.getDoc)(studentDocRef).catch((err) => {
      handleFirestoreError(err, "get" /* GET */, `students/${student.nisn}`);
    });
    if (studentExists && studentExists.exists()) {
      return res.status(400).json({ message: `Siswa dengan NISN ${student.nisn} sudah terdaftar!` });
    }
    if (!student.password) {
      student.password = "123";
    }
    await (0, import_firestore.setDoc)(studentDocRef, student).catch((err) => {
      handleFirestoreError(err, "create" /* CREATE */, `students/${student.nisn}`);
    });
    res.status(201).json(student);
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Gagal menambahkan siswa." });
  }
});
app.put("/api/students/:nisn", async (req, res) => {
  const { nisn } = req.params;
  const updatedData = req.body;
  try {
    const studentDocRef = (0, import_firestore.doc)(firestoreDb, "students", nisn);
    const studentDoc = await (0, import_firestore.getDoc)(studentDocRef).catch((err) => {
      handleFirestoreError(err, "get" /* GET */, `students/${nisn}`);
    });
    if (!studentDoc || !studentDoc.exists()) {
      return res.status(404).json({ message: "Siswa tidak ditemukan." });
    }
    const merged = { ...studentDoc.data(), ...updatedData };
    await (0, import_firestore.setDoc)(studentDocRef, merged).catch((err) => {
      handleFirestoreError(err, "update" /* UPDATE */, `students/${nisn}`);
    });
    res.json(merged);
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Gagal memperbarui siswa." });
  }
});
app.delete("/api/students/:nisn", async (req, res) => {
  const { nisn } = req.params;
  try {
    const studentDocRef = (0, import_firestore.doc)(firestoreDb, "students", nisn);
    await (0, import_firestore.deleteDoc)(studentDocRef).catch((err) => {
      handleFirestoreError(err, "delete" /* DELETE */, `students/${nisn}`);
    });
    const attemptsSnapshot = await (0, import_firestore.getDocs)((0, import_firestore.query)((0, import_firestore.collection)(firestoreDb, "attempts"), (0, import_firestore.where)("nisn", "==", nisn)));
    attemptsSnapshot.forEach(async (d) => {
      await (0, import_firestore.deleteDoc)((0, import_firestore.doc)(firestoreDb, "attempts", d.id)).catch((err) => {
        handleFirestoreError(err, "delete" /* DELETE */, `attempts/${d.id}`);
      });
    });
    res.json({ message: "Siswa berhasil dihapus." });
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Gagal menghapus siswa." });
  }
});
app.get("/api/questions", async (req, res) => {
  try {
    const querySnapshot = await (0, import_firestore.getDocs)((0, import_firestore.collection)(firestoreDb, "questions")).catch((err) => {
      handleFirestoreError(err, "list" /* LIST */, "questions");
    });
    const questions = [];
    if (querySnapshot) {
      querySnapshot.forEach((doc2) => {
        questions.push(doc2.data());
      });
    }
    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Gagal mengambil data soal." });
  }
});
app.post("/api/questions", async (req, res) => {
  const question = req.body;
  if (!question.subject || !question.text || !question.options || !question.correctAnswer) {
    return res.status(400).json({ message: "Gagal membuat soal. Lengkapi subjek, teks soal, opsi multiple choice, dan kunci jawaban." });
  }
  question.id = "q_" + Date.now();
  try {
    await (0, import_firestore.setDoc)((0, import_firestore.doc)(firestoreDb, "questions", question.id), question).catch((err) => {
      handleFirestoreError(err, "create" /* CREATE */, `questions/${question.id}`);
    });
    res.status(201).json(question);
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Gagal menambahkan soal." });
  }
});
app.put("/api/questions/:id", async (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;
  try {
    const questionDocRef = (0, import_firestore.doc)(firestoreDb, "questions", id);
    const questionDoc = await (0, import_firestore.getDoc)(questionDocRef).catch((err) => {
      handleFirestoreError(err, "get" /* GET */, `questions/${id}`);
    });
    if (!questionDoc || !questionDoc.exists()) {
      return res.status(404).json({ message: "Soal tidak ditemukan." });
    }
    const merged = { ...questionDoc.data(), ...updatedData };
    await (0, import_firestore.setDoc)(questionDocRef, merged).catch((err) => {
      handleFirestoreError(err, "update" /* UPDATE */, `questions/${id}`);
    });
    res.json(merged);
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Gagal memperbarui soal." });
  }
});
app.delete("/api/questions/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await (0, import_firestore.deleteDoc)((0, import_firestore.doc)(firestoreDb, "questions", id)).catch((err) => {
      handleFirestoreError(err, "delete" /* DELETE */, `questions/${id}`);
    });
    res.json({ message: "Soal berhasil dihapus dari bank soal." });
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Gagal menghapus soal." });
  }
});
app.get("/api/sessions", async (req, res) => {
  try {
    const querySnapshot = await (0, import_firestore.getDocs)((0, import_firestore.collection)(firestoreDb, "sessions")).catch((err) => {
      handleFirestoreError(err, "list" /* LIST */, "sessions");
    });
    const sessions = [];
    if (querySnapshot) {
      querySnapshot.forEach((doc2) => {
        sessions.push(doc2.data());
      });
    }
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Gagal mengambil database sesi." });
  }
});
app.post("/api/sessions", async (req, res) => {
  const session = req.body;
  if (!session.subject || !session.date || !session.duration || !session.token) {
    return res.status(400).json({ message: "Gagal menyetel sesi. Isi Mata Pelajaran, Tanggal, Durasi (menit), dan Token ujian." });
  }
  session.id = "s_" + Date.now();
  session.isClosed = false;
  try {
    await (0, import_firestore.setDoc)((0, import_firestore.doc)(firestoreDb, "sessions", session.id), session).catch((err) => {
      handleFirestoreError(err, "create" /* CREATE */, `sessions/${session.id}`);
    });
    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Gagal menyetel sesi baru." });
  }
});
app.put("/api/sessions/:id", async (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;
  try {
    const sessionDocRef = (0, import_firestore.doc)(firestoreDb, "sessions", id);
    const sessionDoc = await (0, import_firestore.getDoc)(sessionDocRef).catch((err) => {
      handleFirestoreError(err, "get" /* GET */, `sessions/${id}`);
    });
    if (!sessionDoc || !sessionDoc.exists()) {
      return res.status(404).json({ message: "Sesi ujian tidak ditemukan." });
    }
    const merged = { ...sessionDoc.data(), ...updatedData };
    await (0, import_firestore.setDoc)(sessionDocRef, merged).catch((err) => {
      handleFirestoreError(err, "update" /* UPDATE */, `sessions/${id}`);
    });
    res.json(merged);
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Gagal mengubah sesi." });
  }
});
app.delete("/api/sessions/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await (0, import_firestore.deleteDoc)((0, import_firestore.doc)(firestoreDb, "sessions", id)).catch((err) => {
      handleFirestoreError(err, "delete" /* DELETE */, `sessions/${id}`);
    });
    const attemptsSnapshot = await (0, import_firestore.getDocs)((0, import_firestore.query)((0, import_firestore.collection)(firestoreDb, "attempts"), (0, import_firestore.where)("examSessionId", "==", id)));
    attemptsSnapshot.forEach(async (d) => {
      await (0, import_firestore.deleteDoc)((0, import_firestore.doc)(firestoreDb, "attempts", d.id)).catch((err) => {
        handleFirestoreError(err, "delete" /* DELETE */, `attempts/${d.id}`);
      });
    });
    res.json({ message: "Sesi berhasil dihapus." });
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Gagal menghapus sesi." });
  }
});
app.get("/api/exam/status", async (req, res) => {
  const { nisn, sessionId } = req.query;
  if (!nisn || !sessionId) {
    return res.status(400).json({ message: "NISN dan SessionID diperlukan." });
  }
  try {
    const attemptId = `att_${sessionId}_${nisn}`;
    const attemptDoc = await (0, import_firestore.getDoc)((0, import_firestore.doc)(firestoreDb, "attempts", attemptId)).catch((err) => {
      handleFirestoreError(err, "get" /* GET */, `attempts/${attemptId}`);
    });
    const sessionDoc = await (0, import_firestore.getDoc)((0, import_firestore.doc)(firestoreDb, "sessions", sessionId)).catch((err) => {
      handleFirestoreError(err, "get" /* GET */, `sessions/${sessionId}`);
    });
    res.json({
      attempt: attemptDoc && attemptDoc.exists() ? attemptDoc.data() : null,
      session: sessionDoc && sessionDoc.exists() ? sessionDoc.data() : null
    });
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Sistem gagal membaca status ujian." });
  }
});
app.post("/api/exam/start", async (req, res) => {
  const { nisn, token } = req.body;
  if (!nisn || !token) {
    return res.status(400).json({ message: "NISN dan Token diperlukan untuk memulai ujian." });
  }
  try {
    const studentDoc = await (0, import_firestore.getDoc)((0, import_firestore.doc)(firestoreDb, "students", nisn)).catch((err) => {
      handleFirestoreError(err, "get" /* GET */, `students/${nisn}`);
    });
    if (!studentDoc || !studentDoc.exists()) {
      return res.status(404).json({ message: "Siswa tidak terdaftar." });
    }
    const student = studentDoc.data();
    const allSess = await getAllSessions().catch(() => []);
    const session = allSess.find((s) => s.token.toUpperCase().trim() === token.toUpperCase().trim() && !s.isClosed);
    if (!session) {
      return res.status(400).json({ message: "Token Ujian tidak valid atau ujian telah ditutup oleh pengawas!" });
    }
    const attemptId = `att_${session.id}_${nisn}`;
    const attemptDoc = await (0, import_firestore.getDoc)((0, import_firestore.doc)(firestoreDb, "attempts", attemptId)).catch((err) => {
      handleFirestoreError(err, "get" /* GET */, `attempts/${attemptId}`);
    });
    const allQ = await getAllQuestions();
    const questionsForSubject = allQ.filter((q) => q.subject === session.subject);
    if (attemptDoc && attemptDoc.exists()) {
      const attempt = attemptDoc.data();
      if (attempt.isSubmitted) {
        return res.status(400).json({ message: "Anda sudah mengumpulkan ujian ini sebelumnya." });
      }
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
    const newAttempt = {
      id: attemptId,
      examSessionId: session.id,
      nisn: student.nisn,
      studentName: student.name,
      classRoom: student.classRoom,
      startTime: (/* @__PURE__ */ new Date()).toISOString(),
      answers: {},
      doubtfulAnswers: [],
      isSubmitted: false,
      score: 0,
      correctCount: 0,
      incorrectCount: 0,
      unansweredCount: questionsForSubject.length,
      antiCheatWarnings: 0
    };
    await (0, import_firestore.setDoc)((0, import_firestore.doc)(firestoreDb, "attempts", attemptId), newAttempt).catch((err) => {
      handleFirestoreError(err, "create" /* CREATE */, `attempts/${attemptId}`);
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
app.post("/api/exam/update", async (req, res) => {
  const { attemptId, answers, doubtfulAnswers, antiCheatWarnings } = req.body;
  if (!attemptId) {
    return res.status(400).json({ message: "Attempt ID diperlukan." });
  }
  try {
    const attemptDocRef = (0, import_firestore.doc)(firestoreDb, "attempts", attemptId);
    const attemptDoc = await (0, import_firestore.getDoc)(attemptDocRef).catch((err) => {
      handleFirestoreError(err, "get" /* GET */, `attempts/${attemptId}`);
    });
    if (!attemptDoc || !attemptDoc.exists()) {
      return res.status(404).json({ message: "Sesi ujian aktif tidak ditemukan." });
    }
    const attempt = attemptDoc.data();
    if (attempt.isSubmitted) {
      return res.status(400).json({ message: "Sesi ujian ini telah dipasrahkan/selesai." });
    }
    if (answers !== void 0) {
      attempt.answers = { ...attempt.answers, ...answers };
    }
    if (doubtfulAnswers !== void 0) {
      attempt.doubtfulAnswers = doubtfulAnswers;
    }
    if (antiCheatWarnings !== void 0) {
      attempt.antiCheatWarnings = antiCheatWarnings;
    }
    const sessionDoc = await (0, import_firestore.getDoc)((0, import_firestore.doc)(firestoreDb, "sessions", attempt.examSessionId)).catch((err) => {
      handleFirestoreError(err, "get" /* GET */, `sessions/${attempt.examSessionId}`);
    });
    if (sessionDoc && sessionDoc.exists()) {
      const session = sessionDoc.data();
      const allQ = await getAllQuestions();
      const questionsForSubject = allQ.filter((q) => q.subject === session.subject);
      const answeredCount = Object.keys(attempt.answers).length;
      attempt.unansweredCount = Math.max(0, questionsForSubject.length - answeredCount);
    }
    await (0, import_firestore.setDoc)(attemptDocRef, attempt).catch((err) => {
      handleFirestoreError(err, "update" /* UPDATE */, `attempts/${attemptId}`);
    });
    res.json({ success: true, attempt });
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Gagal sinkronisasi data real-time." });
  }
});
app.post("/api/exam/submit", async (req, res) => {
  const { attemptId, finalAnswers } = req.body;
  if (!attemptId) {
    return res.status(400).json({ message: "Attempt ID tidak lengkap." });
  }
  try {
    const attemptDocRef = (0, import_firestore.doc)(firestoreDb, "attempts", attemptId);
    const attemptDoc = await (0, import_firestore.getDoc)(attemptDocRef).catch((err) => {
      handleFirestoreError(err, "get" /* GET */, `attempts/${attemptId}`);
    });
    if (!attemptDoc || !attemptDoc.exists()) {
      return res.status(404).json({ message: "Sesi ujian tidak ditemukan." });
    }
    const attempt = attemptDoc.data();
    if (attempt.isSubmitted) {
      return res.json({ message: "Sudah disubmit sebelumnya.", attempt });
    }
    if (finalAnswers) {
      attempt.answers = { ...attempt.answers, ...finalAnswers };
    }
    const sessionDoc = await (0, import_firestore.getDoc)((0, import_firestore.doc)(firestoreDb, "sessions", attempt.examSessionId)).catch((err) => {
      handleFirestoreError(err, "get" /* GET */, `sessions/${attempt.examSessionId}`);
    });
    if (!sessionDoc || !sessionDoc.exists()) {
      return res.status(404).json({ message: "Data mata pelajaran sesi ujian hilang." });
    }
    const session = sessionDoc.data();
    const allQ = await getAllQuestions();
    const questions = allQ.filter((q) => q.subject === session.subject);
    let correct = 0;
    let incorrect = 0;
    let unanswered = 0;
    questions.forEach((q) => {
      const studentAnswer = attempt.answers[q.id];
      if (!studentAnswer) {
        unanswered++;
      } else if (studentAnswer.toUpperCase().trim() === q.correctAnswer.toUpperCase().trim()) {
        correct++;
      } else {
        incorrect++;
      }
    });
    const score = questions.length > 0 ? parseFloat((correct / questions.length * 100).toFixed(2)) : 0;
    attempt.isSubmitted = true;
    attempt.correctCount = correct;
    attempt.incorrectCount = incorrect;
    attempt.unansweredCount = unanswered;
    attempt.score = score;
    attempt.endTime = (/* @__PURE__ */ new Date()).toISOString();
    await (0, import_firestore.setDoc)(attemptDocRef, attempt).catch((err) => {
      handleFirestoreError(err, "update" /* UPDATE */, `attempts/${attemptId}`);
    });
    res.json({
      message: "Ujian selesai dikoreksi dan dikumpulkan otomatis oleh sistem.",
      attempt
    });
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Gagal mengumpulkan ujian." });
  }
});
app.get("/api/results", async (req, res) => {
  try {
    const querySnapshot = await (0, import_firestore.getDocs)((0, import_firestore.collection)(firestoreDb, "attempts")).catch((err) => {
      handleFirestoreError(err, "list" /* LIST */, "attempts");
    });
    const attempts = [];
    if (querySnapshot) {
      querySnapshot.forEach((doc2) => {
        attempts.push(doc2.data());
      });
    }
    const allSess = await getAllSessions().catch(() => []);
    const resultsInfo = attempts.map((attempt) => {
      const session = allSess.find((s) => s.id === attempt.examSessionId);
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
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[CBT SERVER] Started running on http://0.0.0.0:${PORT}`);
  });
}
if (!process.env.VERCEL) {
  startServer();
}
var server_default = app;
//# sourceMappingURL=server.cjs.map
