import React, { useState, useEffect, useRef } from "react";
import {
  LogOut,
  User,
  Key,
  CheckCircle,
  AlertTriangle,
  Clock,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  Shield,
  Eye,
  FileSpreadsheet,
  BookOpen,
  Send,
  Check,
  X,
  Image as ImageIcon,
  Save,
  Grid,
  Search,
  ChevronDown
} from "lucide-react";
import { Student, Question, ExamSession, StudentAttempt } from "./types";

// Toast Notification Helper
interface Toast {
  id: string;
  type: "success" | "error" | "warning" | "info";
  message: string;
}

export default function App() {
  // Authentication & Current User States
  const [currentUser, setCurrentUser] = useState<{
    role: "admin" | "student";
    name: string;
    nisn?: string;
    classRoom?: string;
  } | null>(() => {
    const saved = localStorage.getItem("cbt_user");
    return saved ? JSON.parse(saved) : null;
  });

  const [currentView, setCurrentView] = useState<"login" | "token_entry" | "exam" | "finished" | "admin">(() => {
    const savedUser = localStorage.getItem("cbt_user");
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      if (parsed.role === "admin") return "admin";
      // If student was in middle of exam, restore later via start exam
      return "token_entry";
    }
    return "login";
  });

  // Toast Notifications
  const [toasts, setToasts] = useState<Toast[]>([]);
  const showToast = (message: string, type: Toast["type"] = "info") => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Auth Inputs
  const [loginRole, setLoginRole] = useState<"student" | "admin">("student");
  const [nisnInput, setNisnInput] = useState("");
  const [studentPassword, setStudentPassword] = useState("");
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Exam States
  const [tokenInput, setTokenInput] = useState("");
  const [isStartingExam, setIsStartingExam] = useState(false);
  const [activeSession, setActiveSession] = useState<ExamSession | null>(null);
  const [activeAttempt, setActiveAttempt] = useState<StudentAttempt | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [cheatWarning, setCheatWarning] = useState<string | null>(null);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

  // Admin Workspace States
  const [adminTab, setAdminTab] = useState<"dashboard" | "soal" | "sesi" | "siswa" | "laporan">("dashboard");
  const [adminStudents, setAdminStudents] = useState<Student[]>([]);
  const [adminQuestions, setAdminQuestions] = useState<Question[]>([]);
  const [adminSessions, setAdminSessions] = useState<ExamSession[]>([]);
  const [adminResults, setAdminResults] = useState<(StudentAttempt & { subject?: string; sessionDate?: string; duration?: number })[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(false);

  // Admin Selection / Modal States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState("SEMUA KELAS");
  const [selectedSubject, setSelectedSubject] = useState("SEMUA MAPEL");
  const [editingStudent, setEditingStudent] = useState<Partial<Student> | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Partial<Question> | null>(null);
  const [editingSession, setEditingSession] = useState<Partial<ExamSession> | null>(null);
  const [viewingDetailAttempt, setViewingDetailAttempt] = useState<StudentAttempt | null>(null);

  // Initialize data on Login / Reload
  useEffect(() => {
    if (currentUser?.role === "admin") {
      loadAdminData();
    } else if (currentUser?.role === "student") {
      // Look for active existing attempt
      checkExistingExam();
    }
  }, [currentUser]);

  // Sync Timer countdown
  useEffect(() => {
    if (currentView !== "exam" || !activeAttempt || !activeSession || secondsLeft === null) return;

    if (secondsLeft <= 0) {
      showToast("Waktu ujian telah habis! Sistem mengirimkan jawaban Anda secara otomatis.", "warning");
      handleSubmitExam(true);
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft, currentView, activeAttempt, activeSession]);

  // Anti-Cheat: Listeners for Window Blur or Visibility Tab Switches
  useEffect(() => {
    if (currentView !== "exam" || !activeAttempt || activeAttempt.isSubmitted) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        triggerCheatWarning("Pindah Tab Terdeteksi! Jangan berpindah halaman atau tab browser demi kejujuran ujian.");
      }
    };

    const handleBlur = () => {
      triggerCheatWarning("Kehilangan Fokus Layar! Tetap fokus pada jendela ujian CBT Anda.");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
    };
  }, [currentView, activeAttempt]);

  const triggerCheatWarning = async (warningText: string) => {
    if (!activeAttempt || activeAttempt.isSubmitted) return;
    
    // Increment local warning text to show modal
    setCheatWarning(warningText);

    const updatedWarnings = (activeAttempt.antiCheatWarnings || 0) + 1;
    const updatedAttempt = { ...activeAttempt, antiCheatWarnings: updatedWarnings };
    setActiveAttempt(updatedAttempt);

    // Save warning instantly to server database JSON
    try {
      await fetch("/api/exam/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId: activeAttempt.id,
          antiCheatWarnings: updatedWarnings
        })
      });
    } catch (err) {
      console.error("Gagal sinkronisasi data kecurangan ke server", err);
    }
  };

  // Check and restore existing in-flight student attempt
  const checkExistingExam = async () => {
    if (!currentUser?.nisn) return;
    try {
      // Find list of active sessions
      const res = await fetch("/api/sessions");
      if (!res.ok) return;
      const sessions: ExamSession[] = await res.json();
      
      for (const sess of sessions) {
        if (sess.isClosed) continue;
        const statusRes = await fetch(`/api/exam/status?nisn=${currentUser.nisn}&sessionId=${sess.id}`);
        if (statusRes.ok) {
          const { attempt, session } = await statusRes.json();
          if (attempt && !attempt.isSubmitted) {
            // Restore session
            setActiveSession(session);
            setActiveAttempt(attempt);
            
            // Get questions
            const qRes = await fetch("/api/questions");
            if (qRes.ok) {
              const allQ: Question[] = await qRes.json();
              const filtered = allQ.filter(q => q.subject === session.subject);
              setQuestions(filtered);
              
              // Calculate remaining seconds based on exact real Database timestamp
              const startTimeMs = new Date(attempt.startTime).getTime();
              const durationMs = session.duration * 60 * 1000;
              const elapsedMs = Date.now() - startTimeMs;
              const remainingSec = Math.max(0, Math.floor((durationMs - elapsedMs) / 1000));
              
              setSecondsLeft(remainingSec);
              setCurrentQuestionIndex(0);
              setCurrentView("exam");
              showToast(`Selamat datang kembali! Melanjutkan pengerjaan ujian: ${session.subject}`, "info");
              break;
            }
          }
        }
      }
    } catch (err) {
      console.error("Fault restoring session:", err);
    }
  };

  // Fetch admin-related records
  const loadAdminData = async () => {
    setIsDataLoading(true);
    try {
      const [stdRes, qRes, sessRes, resultsRes] = await Promise.all([
        fetch("/api/students"),
        fetch("/api/questions"),
        fetch("/api/sessions"),
        fetch("/api/results")
      ]);

      if (stdRes.ok) setAdminStudents(await stdRes.json());
      if (qRes.ok) setAdminQuestions(await qRes.json());
      if (sessRes.ok) setAdminSessions(await sessRes.json());
      if (resultsRes.ok) setAdminResults(await resultsRes.json());
    } catch (err) {
      showToast("Gagal memuat database sekolah ke panel admin.", "error");
    } finally {
      setIsDataLoading(false);
    }
  };

  // Log in Action
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      const payload: Record<string, string> = { role: loginRole };
      if (loginRole === "student") {
        payload.nisn = nisnInput;
        payload.password = studentPassword;
      } else {
        payload.username = adminUsername;
        payload.password = adminPassword;
      }

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Gagal masuk");
      }

      const userData = {
        role: loginRole,
        name: data.role === "admin" ? data.name : data.student.name,
        nisn: loginRole === "student" ? data.student.nisn : undefined,
        classRoom: loginRole === "student" ? data.student.classRoom : undefined
      };

      setCurrentUser(userData);
      localStorage.setItem("cbt_user", JSON.stringify(userData));
      showToast(`Sukses masuk sebagai ${userData.name}`, "success");

      if (loginRole === "admin") {
        setCurrentView("admin");
      } else {
        setCurrentView("token_entry");
      }
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Submit Token to Start Exam
  const handleVerifyToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim() || !currentUser?.nisn) {
      showToast("Silakan masukkan token ujian dari pengawas.", "warning");
      return;
    }

    setIsStartingExam(true);
    try {
      const res = await fetch("/api/exam/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nisn: currentUser.nisn, token: tokenInput })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Gagal memverifikasi token");
      }

      setActiveSession(data.session);
      setActiveAttempt(data.attempt);
      setQuestions(data.questions);
      setCurrentQuestionIndex(0);

      // Secure elapsed calculation
      const startTimeMs = new Date(data.attempt.startTime).getTime();
      const durationMs = data.session.duration * 60 * 1000;
      const elapsedMs = Date.now() - startTimeMs;
      const remainingSec = Math.max(0, Math.floor((durationMs - elapsedMs) / 1000));
      setSecondsLeft(remainingSec);

      setCurrentView("exam");
      showToast(`Ujian ${data.session.subject} berhasil dimulai!`, "success");
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsStartingExam(false);
    }
  };

  // Real-time Option Select Action
  const handleSelectOption = async (questionId: string, optionKey: string) => {
    if (!activeAttempt || activeAttempt.isSubmitted) return;

    const newAnswers = { ...activeAttempt.answers, [questionId]: optionKey };
    
    // Update attempt locally
    const updatedAttempt = {
      ...activeAttempt,
      answers: newAnswers,
      unansweredCount: Math.max(0, questions.length - Object.keys(newAnswers).length)
    };
    setActiveAttempt(updatedAttempt);

    // Sync to backend real-time
    try {
      await fetch("/api/exam/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId: activeAttempt.id,
          answers: { [questionId]: optionKey }
        })
      });
    } catch (e) {
      console.warn("Gagal sinkron jawaban ke server secara instan, namun lokal tersimpan.");
    }
  };

  // Toggle Raguragu State (Yellow marker)
  const toggleDoubtStatus = async (questionId: string) => {
    if (!activeAttempt || activeAttempt.isSubmitted) return;

    let newDoubt = [...(activeAttempt.doubtfulAnswers || [])];
    if (newDoubt.includes(questionId)) {
      newDoubt = newDoubt.filter(id => id !== questionId);
    } else {
      newDoubt.push(questionId);
    }

    const updatedAttempt = { ...activeAttempt, doubtfulAnswers: newDoubt };
    setActiveAttempt(updatedAttempt);

    // Sync to database
    try {
      await fetch("/api/exam/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId: activeAttempt.id,
          doubtfulAnswers: newDoubt
        })
      });
    } catch (e) {
      console.warn("Failed to sync doubtful flag");
    }
  };

  // Final submit CBT Test
  const handleSubmitExam = async (force: boolean = false) => {
    if (!activeAttempt) return;
    if (!force && !showConfirmSubmit) {
      setShowConfirmSubmit(true);
      return;
    }

    setShowConfirmSubmit(false);
    try {
      const res = await fetch("/api/exam/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId: activeAttempt.id })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Gagal mengumpulkan ujian.");
      }

      setActiveAttempt(data.attempt);
      setCurrentView("finished");
      showToast("Selamat, hasil ujian berhasil disimpan & terkirim ke server pengawas.", "success");
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  // Sign out
  const handleLogout = () => {
    localStorage.removeItem("cbt_user");
    setCurrentUser(null);
    setCurrentView("login");
    setActiveSession(null);
    setActiveAttempt(null);
    setQuestions([]);
    setNisnInput("");
    setStudentPassword("");
    setAdminUsername("");
    setAdminPassword("");
    showToast("Anda telah keluar dari aplikasi.", "info");
  };

  // CSV Exporter Utility
  const handleExportCSV = () => {
    if (adminResults.length === 0) {
      showToast("Belum ada laporan nilai untuk diekspor ke Excel.", "warning");
      return;
    }

    const headers = ["NISN", "Nama Siswa", "Kelas", "Mata Pelajaran", "Skor Nilai", "Jawaban Benar", "Jawaban Salah", "Kosong/Belum", "Pelanggaran Tab", "Waktu Mulai", "Status"];
    const rows = adminResults.map(r => [
      r.nisn,
      r.studentName,
      r.classRoom,
      r.subject || "CBT",
      r.score,
      r.correctCount,
      r.incorrectCount,
      r.unansweredCount,
      r.antiCheatWarnings,
      r.startTime ? new Date(r.startTime).toLocaleString("id-ID") : "-",
      r.isSubmitted ? "SELESAI" : "DIKERJAKAN"
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Nilai_CBT_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Berkas CSV berhasil diunduh.", "success");
  };

  // Save/Edit Student record in Admin panel
  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent?.nisn || !editingStudent?.name || !editingStudent?.classRoom) {
      showToast("Mohon lengkapi NISN, Nama, dan Kelas siswa.", "warning");
      return;
    }

    const isExisting = adminStudents.some(s => s.nisn === editingStudent.nisn);
    const url = isExisting ? `/api/students/${editingStudent.nisn}` : "/api/students";
    const method = isExisting ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingStudent)
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || "Simpan siswa gagal.");
      }

      showToast(`Berhasil menyimpan data siswa: ${editingStudent.name}`, "success");
      setEditingStudent(null);
      loadAdminData();
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleDeleteStudent = async (nisn: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus siswa dan nilai asalnya dari database?")) return;
    try {
      const res = await fetch(`/api/students/${nisn}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus.");
      showToast("Siswa telah terhapus dari bank peserta.", "success");
      loadAdminData();
    } catch (e: any) {
      showToast(e.message, "error");
    }
  };

  // Save/Edit Question in Admin
  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion?.subject || !editingQuestion?.text || !editingQuestion?.correctAnswer) {
      showToast("Mohon lengkapi Subjek, Teks Pertanyaan, dan Kunci Jawaban.", "warning");
      return;
    }

    // Prepare default options if not structured
    const options = editingQuestion.options || [
      { key: "A", text: "" },
      { key: "B", text: "" },
      { key: "C", text: "" },
      { key: "D", text: "" },
      { key: "E", text: "" }
    ];

    if (options.some(o => !o.text.trim())) {
      showToast("Lengkapi semua teks pilihan jawaban A sampai E.", "warning");
      return;
    }

    const toSave = { ...editingQuestion, options };
    const isExisting = !!toSave.id;
    const url = isExisting ? `/api/questions/${toSave.id}` : "/api/questions";
    const method = isExisting ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toSave)
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || "Simpan soal gagal.");
      }

      showToast("Soal ujian berhasil didaftarkan di bank soal sekolah.", "success");
      setEditingQuestion(null);
      loadAdminData();
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm("Hapus soal ini dari bank soal?")) return;
    try {
      const res = await fetch(`/api/questions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus.");
      showToast("Soal berhasil terbuang.", "success");
      loadAdminData();
    } catch (e: any) {
      showToast(e.message, "error");
    }
  };

  // Save/Edit Exam Session details
  const handleSaveSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSession?.subject || !editingSession?.date || !editingSession?.duration || !editingSession?.token) {
      showToast("Lengkapi form pembuatan Sesi Ujian.", "warning");
      return;
    }

    const isExisting = !!editingSession.id;
    const url = isExisting ? `/api/sessions/${editingSession.id}` : "/api/sessions";
    const method = isExisting ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingSession)
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || "Gagal menyetel sesi");
      }

      showToast(`Berhasil merilis sesi ujian ${editingSession.subject}`, "success");
      setEditingSession(null);
      loadAdminData();
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const toggleSessionStatus = async (session: ExamSession) => {
    try {
      const res = await fetch(`/api/sessions/${session.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isClosed: !session.isClosed })
      });
      if (!res.ok) throw new Error();
      showToast(`Sesi ujian ${session.subject} telah ${!session.isClosed ? 'ditutup' : 'dibuka'}`, "info");
      loadAdminData();
    } catch {
      showToast("Gagal mengubah status sesi.", "error");
    }
  };

  const handleDeleteSession = async (id: string) => {
    if (!confirm("Menghapus sesi ujian ini juga akan menghapus hasil pengerjaan terkait. Lanjutkan?")) return;
    try {
      const res = await fetch(`/api/sessions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      showToast("Sesi ujian dihapus.", "success");
      loadAdminData();
    } catch {
      showToast("Gagal menghapus sesi.", "error");
    }
  };

  // Helpers for time formatted strings
  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return [
      hrs.toString().padStart(2, "0"),
      mins.toString().padStart(2, "0"),
      secs.toString().padStart(2, "0")
    ].join(":");
  };

  // Filter lists in client-side
  const filteredStudentsList = adminStudents.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.nisn.includes(searchQuery);
    const matchClass = selectedClass === "SEMUA KELAS" || s.classRoom === selectedClass;
    return matchSearch && matchClass;
  });

  const filteredQuestionsList = adminQuestions.filter(q => {
    const matchSearch = q.text.toLowerCase().includes(searchQuery.toLowerCase()) || q.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchSubject = selectedSubject === "SEMUA MAPEL" || q.subject === selectedSubject;
    return matchSearch && matchSubject;
  });

  // Extract unique classes & subjects for filter selections
  const classOptions = Array.from(new Set(adminStudents.map(s => s.classRoom)));
  const subjectOptions = Array.from(new Set(adminQuestions.map(q => q.subject)));

  return (
    <div id="cbt_container" className="min-h-screen bg-[#05070a] text-slate-200 font-sans select-none flex flex-col relative overflow-x-hidden">
      
      {/* Dynamic Toast Alerts Container */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 max-w-sm">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`p-4 rounded-xl shadow-2xl flex items-start gap-3 transition-all duration-300 transform translate-y-0 scale-100 ${
              t.type === "success" ? "bg-emerald-950/90 border border-emerald-500/40 text-emerald-300" :
              t.type === "error" ? "bg-rose-950/90 border border-rose-500/40 text-rose-300" :
              t.type === "warning" ? "bg-amber-950/90 border border-amber-500/40 text-amber-300" :
              "bg-sky-950/90 border border-sky-500/40 text-sky-300"
            }`}
          >
            {t.type === "success" && <CheckCircle className="w-5 h-5 shrink-0 text-emerald-400" />}
            {t.type === "error" && <X className="w-5 h-5 shrink-0 text-rose-400" />}
            {t.type === "warning" && <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400" />}
            {t.type === "info" && <Shield className="w-5 h-5 shrink-0 text-sky-400" />}
            <p className="text-xs font-semibold leading-relaxed">{t.message}</p>
          </div>
        ))}
      </div>

      {/* 1. LOGIN SCREEN VIEW */}
      {currentView === "login" && (
        <div className="flex-1 flex items-center justify-center p-6 gradient-cbt">
          <div className="w-full max-w-md glass-panel p-8 rounded-2xl border border-white/10 shadow-2xl relative z-10">
            {/* System logo */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-14 h-14 bg-sky-500 rounded-2xl flex items-center justify-center font-black text-2xl text-black shadow-lg shadow-sky-500/30 mb-4 tracking-wider">
                CBT
              </div>
              <h2 className="text-xl font-bold text-center tracking-wide">Computer Based Test (CBT)</h2>
              <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-mono">Ujian Akhir Sekolah</p>
            </div>

            {/* Login Role Toggle */}
            <div className="flex rounded-lg overflow-hidden border border-white/10 bg-slate-950/60 p-1 mb-6">
              <button
                type="button"
                onClick={() => setLoginRole("student")}
                className={`flex-1 py-2 text-xs font-bold rounded transition-all uppercase tracking-wider ${
                  loginRole === "student" ? "bg-sky-500 text-black shadow-md font-extrabold" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Portal Siswa
              </button>
              <button
                type="button"
                onClick={() => setLoginRole("admin")}
                className={`flex-1 py-2 text-xs font-bold rounded transition-all uppercase tracking-wider ${
                  loginRole === "admin" ? "bg-sky-500 text-black shadow-md font-extrabold" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Guru / Admin
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              {loginRole === "student" ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">Nomor Induk Siswa Nasional (NISN)</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Masukkan NISN (Cth: 1234567890)"
                        value={nisnInput}
                        onChange={(e) => setNisnInput(e.target.value)}
                        required
                        className="w-full bg-slate-950/60 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all font-mono"
                      />
                      <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">Kata Sandi Akun</label>
                    <div className="relative">
                      <input
                        type="password"
                        placeholder="Sandi default: 123"
                        value={studentPassword}
                        onChange={(e) => setStudentPassword(e.target.value)}
                        required
                        className="w-full bg-slate-950/60 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all font-mono"
                      />
                      <Key className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">Username Admin</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Admin username (Cth: admin)"
                        value={adminUsername}
                        onChange={(e) => setAdminUsername(e.target.value)}
                        required
                        className="w-full bg-slate-950/60 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all font-mono"
                      />
                      <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">Sandi Pengawas</label>
                    <div className="relative">
                      <input
                        type="password"
                        placeholder="Sandi (Cth: admin123)"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        required
                        className="w-full bg-slate-950/60 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all font-mono"
                      />
                      <Key className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3 bg-sky-500 hover:bg-sky-400 disabled:bg-slate-700 text-black font-extrabold rounded-xl transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 mt-6"
              >
                {isLoggingIn ? <RefreshCw className="w-4 h-4 animate-spin text-black" /> : null}
                Masuk ke Aplikasi CBT
              </button>
            </form>

            <div className="mt-8 border-t border-white/5 pt-4 text-center">
              <p className="text-[10px] text-slate-500 italic">Sistem Keamanan Dilengkapi Real-time Tracking & Anti-Cheat Tab</p>
            </div>
          </div>
        </div>
      )}

      {/* 2. STUDENT TOKEN ENTRY SCREEN */}
      {currentView === "token_entry" && currentUser && (
        <div className="flex-1 flex flex-col">
          <header className="h-16 glass-panel flex items-center justify-between px-8 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-sky-500 rounded-lg flex items-center justify-center font-bold text-black text-sm">CBT</div>
              <h1 className="text-xs font-bold tracking-widest uppercase text-sky-400">Portal Siswa</h1>
            </div>
            
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-white text-xs font-semibold flex items-center gap-2 bg-white/5"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              Keluar
            </button>
          </header>

          <main className="flex-1 flex items-center justify-center p-6 gradient-cbt">
            <div className="w-full max-w-lg glass-panel p-8 rounded-2xl border border-white/10 shadow-2xl">
              <div className="mb-6">
                <span className="text-[10px] text-sky-400 font-mono tracking-widest uppercase bg-sky-500/10 border border-sky-500/30 px-2 py-0.5 rounded">Verifikasi Peserta</span>
                <h2 className="text-xl font-bold mt-2">Selamat Datang, {currentUser.name}!</h2>
                <div className="grid grid-cols-2 gap-4 mt-4 bg-slate-950/60 p-4 border border-white/5 rounded-xl text-xs font-mono text-slate-300">
                  <p><span className="text-slate-500">KELAS:</span> {currentUser.classRoom || "-"}</p>
                  <p><span className="text-slate-500">NISN:</span> {currentUser.nisn || "-"}</p>
                  <p className="col-span-2 text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Offline Database Aktif (Siap Ujian)
                  </p>
                </div>
              </div>

              <div className="border-t border-white/10 pt-6">
                <h3 className="text-xs font-bold tracking-wider uppercase text-slate-400 mb-3 font-mono">Diberikan oleh Pengawas Ruangan</h3>
                <form onSubmit={handleVerifyToken} className="space-y-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Masukkan Kode Token Pelajaran</label>
                    <input
                      type="text"
                      placeholder="Contoh: MTK123, IND456, FIS789"
                      value={tokenInput}
                      onChange={(e) => setTokenInput(e.target.value)}
                      required
                      className="w-full bg-slate-950/65 border border-white/10 rounded-xl py-3 px-4 text-center text-lg font-bold tracking-[0.2em] uppercase focus:outline-none focus:border-sky-500 font-mono text-white"
                    />
                  </div>

                  <p className="text-[10px] leading-relaxed text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-yellow-400" />
                    <span><b>PENTING:</b> Selama ujian berlangsung, dilarang menekan tombol back, berpindah tab, meminimalkan layar, atau membuka materi lain. Segala aktivitas di luar jendela CBT akan dicatat di server.</span>
                  </p>

                  <button
                    type="submit"
                    disabled={isStartingExam}
                    className="w-full py-3 bg-sky-500 hover:bg-sky-400 disabled:bg-slate-700 text-black font-extrabold rounded-xl transition-all uppercase tracking-wider text-xs flex items-center justify-center gap-2"
                  >
                    {isStartingExam ? <RefreshCw className="w-4 h-4 animate-spin text-black" /> : null}
                    Mulai Ujian Sekarang
                  </button>
                </form>
              </div>
            </div>
          </main>
        </div>
      )}

      {/* 3. CBT MAIN EXAM INTERFACE */}
      {currentView === "exam" && activeAttempt && activeSession && questions.length > 0 && (
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          
          {/* Top Info Bar */}
          <header className="h-16 glass-panel flex items-center justify-between px-8 border-b border-white/5 shrink-0 z-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-sky-500 rounded-lg flex items-center justify-center font-bold text-black">CBT</div>
              <div>
                <h1 className="text-sm font-semibold tracking-wider uppercase text-sky-400">UJIAN AKHIR SEKOLAH</h1>
                <p className="text-xs text-slate-400 font-mono">Mapel: {activeSession.subject}</p>
              </div>
            </div>

            <div className="flex items-center gap-12">
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-mono">Sisa Waktu</p>
                <p className="text-2xl font-mono font-bold text-rose-500 tabular-nums leading-none">
                  {secondsLeft !== null ? formatTime(secondsLeft) : "--:--:--"}
                </p>
              </div>
              
              <div className="h-10 w-[1px] bg-white/10 hidden md:block"></div>
              
              {/* Profile Details */}
              <div className="flex items-center gap-3">
                <div className="text-right hidden md:block">
                  <p className="text-sm font-semibold">{activeAttempt.studentName}</p>
                  <p className="text-xs text-slate-400 font-mono">NISN: {activeAttempt.nisn}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-slate-300">
                  {activeAttempt.studentName.split(" ").slice(0, 2).map(n => n[0]).join("")}
                </div>
              </div>
            </div>
          </header>

          {/* Core Content Area */}
          <main className="flex-1 flex flex-col md:flex-row gap-6 p-6 overflow-hidden min-h-0 bg-slate-950/20">
            
            {/* Left Side: Question Pane */}
            <div className="flex-1 flex flex-col gap-4 overflow-hidden min-h-0">
              <div className="glass-panel rounded-2xl flex-1 p-6 md:p-8 relative overflow-y-auto min-h-0">
                {/* Status Badge */}
                <div className="absolute top-6 right-8 px-4 py-1.5 bg-sky-500/10 border border-sky-500/20 rounded-full font-mono flex items-center gap-2">
                  <span className="text-[10px] text-sky-400 font-bold uppercase tracking-widest">Soal {currentQuestionIndex + 1} dari {questions.length}</span>
                </div>

                <div className="max-w-4xl mt-6">
                  {/* Subject Name Indicator */}
                  <span className="text-[10px] font-mono text-slate-400 border border-white/10 px-2 py-0.5 rounded uppercase">
                    {questions[currentQuestionIndex].subject}
                  </span>

                  {/* Question Text */}
                  <div className="text-md leading-relaxed font-medium mt-4 text-slate-200 whitespace-pre-wrap">
                    {questions[currentQuestionIndex].text}
                  </div>

                  {/* Question Image (Supports uploaded/hosted drawings) */}
                  {questions[currentQuestionIndex].imageUrl && (
                    <div className="mt-4 max-w-md border border-white/10 rounded-xl overflow-hidden bg-slate-900/60">
                      <img
                        src={questions[currentQuestionIndex].imageUrl}
                        alt="diagram ujian"
                        className="w-full h-auto object-contain max-h-64 mx-auto"
                      />
                    </div>
                  )}

                  {/* Options List */}
                  <div className="space-y-3 mt-8">
                    {questions[currentQuestionIndex].options.map((option) => {
                      const isSelected = activeAttempt.answers[questions[currentQuestionIndex].id] === option.key;
                      return (
                        <button
                          key={option.key}
                          onClick={() => handleSelectOption(questions[currentQuestionIndex].id, option.key)}
                          className={`w-full text-left rounded-xl p-4 flex items-center gap-4 transition-all group ${
                            isSelected
                              ? "bg-sky-500/10 border-2 border-sky-500 shadow-lg shadow-sky-500/10"
                              : "glass-panel border border-white/5 hover:border-white/20 hover:bg-white/5"
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                              isSelected
                                ? "bg-sky-500 text-black font-black"
                                : "bg-slate-800 text-slate-400 border border-white/15 group-hover:border-sky-500 group-hover:text-sky-400"
                            }`}
                          >
                            {option.key}
                          </div>
                          
                          <div className="flex-1 text-xs md:text-sm text-slate-200">{option.text}</div>

                          {option.imageUrl && (
                            <img
                              src={option.imageUrl}
                              alt={`opsi ${option.key}`}
                              className="w-12 h-12 object-cover rounded border border-white/10"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Lower Controls Panel */}
              <div className="h-16 flex items-center justify-between shrink-0 px-2">
                <button
                  disabled={currentQuestionIndex === 0}
                  onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                  className="px-6 py-2.5 glass-panel border border-white/10 hover:border-white/20 hover:bg-white/5 disabled:opacity-40 rounded-xl text-xs md:text-sm font-semibold flex items-center gap-2 transition-all"
                >
                  <ChevronLeft className="w-4 h-4 text-sky-400" />
                  Sebelumnya
                </button>

                <button
                  onClick={() => toggleDoubtStatus(questions[currentQuestionIndex].id)}
                  className={`px-8 py-2.5 border rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                    (activeAttempt.doubtfulAnswers || []).includes(questions[currentQuestionIndex].id)
                      ? "bg-amber-500 border-amber-500 text-black shadow-lg shadow-amber-500/20 font-black"
                      : "bg-amber-500/10 border-amber-500/30 text-amber-500 hover:bg-amber-500/20"
                  }`}
                >
                  Ragu-Ragu
                </button>

                {currentQuestionIndex < questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                    className="px-6 py-2.5 bg-sky-500 hover:bg-sky-400 text-black rounded-xl text-xs md:text-sm font-bold flex items-center gap-2 transition-all shadow-md active:scale-95"
                  >
                    Selanjutnya
                    <ChevronRight className="w-4 h-4 text-black" />
                  </button>
                ) : (
                  <button
                    onClick={() => setShowConfirmSubmit(true)}
                    className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl text-xs md:text-sm font-bold flex items-center gap-2 transition-all shadow-md hover:scale-[1.02]"
                  >
                    <Send className="w-4 h-4 text-black animate-bounce" />
                    Kumpulkan
                  </button>
                )}
              </div>
            </div>

            {/* Right Side: Grid Nav Controls */}
            <div className="w-full md:w-80 flex flex-col gap-4 shrink-0 overflow-y-auto">
              <div className="glass-panel rounded-2xl p-6 flex-1 flex flex-col min-h-[300px]">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 font-mono">Navigasi Soal</h3>
                
                <div className="grid grid-cols-5 gap-2 overflow-y-auto max-h-72 md:max-h-none pr-1">
                  {questions.map((q, idx) => {
                    const isCurrent = idx === currentQuestionIndex;
                    const isAnswered = !!activeAttempt.answers[q.id];
                    const isDoubt = (activeAttempt.doubtfulAnswers || []).includes(q.id);

                    let btnClass = "border border-white/10 hover:bg-white/5 text-slate-300";
                    if (isCurrent) {
                      btnClass = "active-question"; // custom fluorescent sky border
                    } else if (isDoubt) {
                      btnClass = "doubt-question font-medium"; // custom amber
                    } else if (isAnswered) {
                      btnClass = "answered-question"; // custom green emerald
                    }

                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => setCurrentQuestionIndex(idx)}
                        className={`h-10 rounded-lg flex items-center justify-center text-xs font-mono font-bold transition-all ${btnClass}`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>

                {/* Interactive Legend Grid */}
                <div className="mt-auto pt-6 border-t border-white/5 grid grid-cols-2 gap-3 text-[10px] text-slate-400 font-mono font-semibold">
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded bg-emerald-500"></div>
                    <span>Selesai Dijawab</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded bg-amber-500"></div>
                    <span>Ragu-Ragu</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded bg-sky-500"></div>
                    <span>Posisi Aktif</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded border border-white/20"></div>
                    <span>Belum Diisi</span>
                  </div>
                </div>
              </div>

              {/* Direct Quick Submit button on Sidebar */}
              <button
                onClick={() => setShowConfirmSubmit(true)}
                className="h-14 bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-600/30 rounded-2xl font-bold uppercase tracking-wider text-xs transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                Selesaikan Ujian
              </button>
            </div>
          </main>

          {/* Anti-Cheat Safety Status Bar Footer */}
          <footer className="h-8 px-6 flex items-center justify-between text-[10px] bg-slate-950 border-t border-white/5 shrink-0 z-20 font-mono text-slate-500">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-emerald-400 uppercase tracking-wider font-extrabold">Sistem Anti-Cheat Aktif</span>
              </div>
              <span className="text-slate-500 truncate hidden sm:inline">Perpindahan halaman tab browser terpantau oleh pengawas</span>
            </div>
            <div>
              NISN: {activeAttempt.nisn} | Peringatan: {activeAttempt.antiCheatWarnings || 0}
            </div>
          </footer>
        </div>
      )}

      {/* 4. STUDENT FINISHED / EXAM SUBMITTED CONFIRMATION DIALOG & OVERVIEWS */}
      {currentView === "finished" && activeAttempt && (
        <div className="flex-1 flex items-center justify-center p-6 gradient-cbt">
          <div className="w-full max-w-lg glass-panel p-8 rounded-2xl border border-white/5 text-center shadow-2xl relative">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8" />
            </div>

            <span className="text-[10px] font-mono tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full uppercase">
              Ujian Terkirim
            </span>

            <h2 className="text-2xl font-bold mt-4">Terima Kasih, Ujian Selesai!</h2>
            <p className="text-slate-400 text-sm mt-2 max-w-sm mx-auto">
              Seluruh jawaban Anda berhasil dianalisis dan dikunci secara aman oleh sistem pengawas sekolah.
            </p>

            <div className="mt-8 bg-slate-950/60 p-5 rounded-xl border border-white/5 text-left font-mono space-y-2 mt-6">
              <h3 className="text-xs uppercase text-slate-500 tracking-wider">Lembar Konfirmasi Ujian:</h3>
              <div className="h-[1px] bg-white/5 my-2"></div>
              <p className="text-xs text-slate-300">Pelajaran: <span className="text-white float-right font-bold">{activeSession?.subject || "CBT"}</span></p>
              <p className="text-xs text-slate-300">Siswa / NISN: <span className="text-white float-right">{activeAttempt.studentName} ({activeAttempt.nisn})</span></p>
              <p className="text-xs text-slate-300">Total Benar: <span className="text-emerald-400 float-right font-bold">{activeAttempt.correctCount} Soal</span></p>
              <p className="text-xs text-slate-300">Salah Jawaban: <span className="text-rose-400 float-right font-bold">{activeAttempt.incorrectCount} Soal</span></p>
              <p className="text-xs text-slate-300">Kosong / Unanswered: <span className="text-slate-400 float-right">{activeAttempt.unansweredCount} Soal</span></p>
              <p className="text-xs text-slate-300 font-bold border-t border-white/5 pt-2 mt-2">Diberikan Nilai: <span className="text-sky-400 float-right text-lg font-black">{activeAttempt.score} / 100</span></p>
              <p className="text-[10px] text-amber-500 italic mt-3 text-center">Hasil nilai real-time ini telah dilaporkan kepada wali kelas.</p>
            </div>

            <button
              onClick={handleLogout}
              className="mt-8 px-8 py-3 bg-white text-black font-extrabold rounded-xl text-xs uppercase tracking-wider hover:bg-slate-200 transition-all active:scale-95 shadow-lg"
            >
              Keluar ke Halaman Utama
            </button>
          </div>
        </div>
      )}

      {/* 5. PORTAL GURU / COGNITIVE ADMIN WORKSPACE */}
      {currentView === "admin" && currentUser && (
        <div className="flex-1 flex flex-col md:flex-row h-screen overflow-hidden">
          
          {/* Admin Sidebar Navigation Panel */}
          <aside className="w-full md:w-64 bg-slate-950 border-r border-white/5 flex flex-col shrink-0">
            <div className="p-6 border-b border-white/10 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center font-black text-black">A</div>
              <div>
                <h2 className="text-sm font-bold tracking-wider text-sky-400">PANEL KURIKULUM</h2>
                <p className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">Computer Based Test</p>
              </div>
            </div>

            <div className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
              <button
                onClick={() => { setAdminTab("dashboard"); setSearchQuery(""); }}
                className={`w-full text-left py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-3 ${
                  adminTab === "dashboard" ? "bg-sky-500 text-black font-black" : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Grid className="w-4 h-4" />
                Daftar Statistik
              </button>

              <button
                onClick={() => { setAdminTab("soal"); setSearchQuery(""); }}
                className={`w-full text-left py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-3 ${
                  adminTab === "soal" ? "bg-sky-500 text-black font-black" : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <BookOpen className="w-4 h-4" />
                Bank Soal Ujian
              </button>

              <button
                onClick={() => { setAdminTab("sesi"); setSearchQuery(""); }}
                className={`w-full text-left py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-3 ${
                  adminTab === "sesi" ? "bg-sky-500 text-black font-black" : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Clock className="w-4 h-4" />
                Sesi Ujian & Token
              </button>

              <button
                onClick={() => { setAdminTab("siswa"); setSearchQuery(""); }}
                className={`w-full text-left py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-3 ${
                  adminTab === "siswa" ? "bg-sky-500 text-black font-black" : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <User className="w-4 h-4" />
                Peserta (Siswa)
              </button>

              <button
                onClick={() => { setAdminTab("laporan"); setSearchQuery(""); }}
                className={`w-full text-left py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-3 ${
                  adminTab === "laporan" ? "bg-sky-500 text-black font-black" : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                Laporan & Nilai
              </button>
            </div>

            {/* Quick Profile log & exit */}
            <div className="p-4 border-t border-white/5 bg-slate-950/80 flex flex-col gap-2 mt-auto text-xs shrink-0 font-mono">
              <p className="text-slate-400 text-[10px] break-all">Masuk: <b>{currentUser.name}</b></p>
              <button
                onClick={handleLogout}
                className="w-full py-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all uppercase tracking-wider"
              >
                <LogOut className="w-3.5 h-3.5" />
                Keluar Panel
              </button>
            </div>
          </aside>

          {/* Core Right Main Workplace Panel */}
          <main className="flex-1 p-6 md:p-8 flex flex-col overflow-y-auto min-h-0 relative">
            
            {/* Top Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6 mb-6">
              <div>
                <span className="text-[10px] bg-slate-800 border border-white/10 text-sky-400 uppercase tracking-widest px-2 py-0.5 rounded font-mono">Portal Guru Admin</span>
                <h2 className="text-xl md:text-2xl font-bold mt-1 uppercase tracking-wide">
                  {adminTab === "dashboard" && "Dashboard & Statistik"}
                  {adminTab === "soal" && "Manajemen Bank Soal"}
                  {adminTab === "sesi" && "Atur Jadwal & Token Sesi"}
                  {adminTab === "siswa" && "Database Siswa Ujian"}
                  {adminTab === "laporan" && "Analisis Hasil Real-Time"}
                </h2>
              </div>

              {/* Refresh Sync button */}
              <button
                onClick={loadAdminData}
                disabled={isDataLoading}
                className="self-start md:self-auto px-4 py-2 rounded-xl glass-panel border border-white/10 hover:border-white/20 hover:bg-white/5 text-xs font-semibold flex items-center gap-2 bg-white/5 shadow"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-sky-400 ${isDataLoading ? 'animate-spin' : ''}`} />
                Segarkan Sinkronisasi
              </button>
            </div>

            {/* SECTION A: DASHBOARD VIEW STAT CARDS */}
            {adminTab === "dashboard" && (
              <div className="space-y-8">
                {/* Visual Stats Block Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  
                  {/* Card 1 */}
                  <div className="glass-panel p-6 rounded-2xl border border-white/5 relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-950">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full blur-2xl"></div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Total Siswa Terdaftar</span>
                    <h3 className="text-3xl font-black mt-2 text-white font-mono">{adminStudents.length}</h3>
                    <p className="text-[10px] text-emerald-400 mt-2 font-mono">● Database Siswa Aktif</p>
                  </div>

                  {/* Card 2 */}
                  <div className="glass-panel p-6 rounded-2xl border border-white/5 relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-950">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl"></div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Total Bank Soal</span>
                    <h3 className="text-3xl font-black mt-2 text-white font-mono">{adminQuestions.length}</h3>
                    <p className="text-[10px] text-sky-400 mt-2 font-mono">Multi Pilihan Ganda A-E</p>
                  </div>

                  {/* Card 3 */}
                  <div className="glass-panel p-6 rounded-2xl border border-white/5 relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-950">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl"></div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Sesi Ujian Terbit</span>
                    <h3 className="text-3xl font-black mt-2 text-white font-mono">{adminSessions.length}</h3>
                    <p className="text-[10px] text-slate-400 mt-2 font-mono">Aktif dengan Akses Token</p>
                  </div>

                  {/* Card 4 */}
                  <div className="glass-panel p-6 rounded-2xl border border-white/5 relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-950">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl"></div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Siswa Selesai Ujian</span>
                    <h3 className="text-3xl font-black mt-2 text-white font-mono">
                      {adminResults.filter(r => r.isSubmitted).length}
                    </h3>
                    <p className="text-[10px] text-amber-500 mt-2 font-mono">
                      {adminResults.filter(r => !r.isSubmitted && r.startTime).length} Siswa Mengerjakan
                    </p>
                  </div>
                </div>

                {/* Sub-block Activity List & Chart mock */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Left Column: Quick Monitor Live Ujian */}
                  <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-slate-900/40">
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Monitoring Siswa Ujian Secara Live</h3>
                      <span className="text-[9px] bg-sky-500/10 border border-sky-500/30 text-sky-400 px-2 py-0.5 rounded font-mono">Live Tracking</span>
                    </div>

                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {adminResults.length === 0 ? (
                        <p className="text-xs text-slate-500 italic py-4 text-center">Belum ada siswa yang terkoneksi memulai token ujian.</p>
                      ) : (
                        adminResults.slice().reverse().map(r => (
                          <div key={r.id} className="p-3.5 rounded-xl border border-white/5 bg-slate-950/60 text-xs font-mono flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div>
                              <p className="font-semibold text-white">{r.studentName}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">NISN: {r.nisn} | Kelas: {r.classRoom} | Mapel: <b>{r.subject}</b></p>
                            </div>
                            <div className="text-right shrink-0">
                              {r.isSubmitted ? (
                                <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded text-[9px] font-bold">SELESAI (Nilai: {r.score})</span>
                              ) : (
                                <span className="px-2 py-0.5 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded text-[9px] font-bold animate-pulse">SEDANG MENGERJAKAN</span>
                              )}
                              
                              {r.antiCheatWarnings > 0 && (
                                <p className="text-[9px] text-red-400 font-bold mt-1 text-right">⚠️ {r.antiCheatWarnings} Warning Terpantau</p>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Right Column: Mini Guidelines */}
                  <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 pb-2 border-b border-white/5">Pedoman Penggunaan CBT</h3>
                      <div className="space-y-4 text-xs leading-relaxed text-slate-300">
                        <p>1. <b>Bank Soal Sekolah:</b> Masukkan butir soal pilihan ganda pelajaran Matematika, Fisika, Kimia, dsb. Dukung input diagram via kolom input Image URL.</p>
                        <p>2. <b>Sesi Ujian:</b> Token bersifat case-sensitive. Matikan atau tutup sesi ujian bila pengerjaan seluruh kelas telah usai untuk mengunci lembar jawaban.</p>
                        <p>3. <b>Keamanan Ekstrem:</b> Apabila siswa sengaja meminimalkan browser, sistem merekam log pelanggaran real-time yang langsung terpajang di tab <b>Laporan & Nilai</b>.</p>
                        <p>4. <b>Export CSV:</b> Klik satu kali tombol export di tab Laporan untuk menarik rekapan nilai siap impor ke software Buku Nilai Guru Rapor.</p>
                      </div>
                    </div>

                    <div className="mt-6 p-3 bg-sky-500/10 border border-sky-500/20 rounded-xl text-[10px] font-mono text-sky-400 flex items-center gap-2">
                      <Shield className="w-5 h-5 shrink-0" />
                      <span>Sistem CBT ini terintegrasi database lokal sekolah, pengerjaan minim lag saat 500+ siswa klik tombol secara simultan.</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION B: BANK SOAL CRUD VIEW */}
            {adminTab === "soal" && (
              <div className="space-y-6">
                
                {/* Search & Action Bar */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-950/40 p-4 border border-white/5 rounded-xl">
                  <div className="relative w-full md:w-80">
                    <input
                      type="text"
                      placeholder="Cari teks soal / subjek mapel..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-950/80 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs text-white focus:outline-none focus:border-sky-500"
                    />
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto self-stretch md:self-auto justify-end">
                    <select
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      className="bg-slate-950/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
                    >
                      <option value="SEMUA MAPEL">Mapel: Semua</option>
                      {subjectOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>

                    <button
                      onClick={() => setEditingQuestion({
                        subject: "Matematika",
                        text: "",
                        correctAnswer: "A",
                        options: [
                          { key: "A", text: "" },
                          { key: "B", text: "" },
                          { key: "C", text: "" },
                          { key: "D", text: "" },
                          { key: "E", text: "" }
                        ]
                      })}
                      className="bg-sky-500 hover:bg-sky-400 text-black px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Buat Soal Baru
                    </button>
                  </div>
                </div>

                {/* Listing Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredQuestionsList.map((q) => (
                    <div key={q.id} className="p-5 rounded-2xl glass-panel border border-white/5 flex flex-col justify-between">
                      <div>
                        {/* Tags block */}
                        <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2.5 mb-3.5">
                          <span className="text-[10px] font-mono text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded font-extrabold uppercase">
                            {q.subject}
                          </span>
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-bold">
                            Kunci: {q.correctAnswer}
                          </span>
                        </div>

                        {/* Text */}
                        <p className="text-xs text-slate-200 line-clamp-3 hover:line-clamp-none transition-all whitespace-pre-wrap leading-relaxed">
                          {q.text}
                        </p>

                        {/* Optional thumbnail image */}
                        {q.imageUrl && (
                          <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                            <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
                            <span className="underline truncate">Ilustrasi Diagram Tersemat</span>
                          </div>
                        )}

                        {/* Tiny render of options list */}
                        <div className="grid grid-cols-5 gap-1.5 mt-4 text-[9px] font-mono">
                          {q.options.map(opt => (
                            <div
                              key={opt.key}
                              title={opt.text}
                              className={`p-1 text-center rounded truncate border ${
                                opt.key === q.correctAnswer ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-300" : "bg-slate-950/60 border-white/5 text-slate-455"
                              }`}
                            >
                              {opt.key}: {opt.text || "<Kosong>"}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Row buttons */}
                      <div className="flex items-center justify-end gap-3 border-t border-white/5 pt-4 mt-4">
                        <button
                          onClick={() => setEditingQuestion(q)}
                          className="p-2 border border-white/10 hover:border-white/30 text-slate-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-sky-400" />
                          Sunting
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="p-2 border border-rose-500/10 hover:border-rose-500/30 text-rose-400 hover:text-rose-300 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Hapus
                        </button>
                      </div>
                    </div>
                  ))}

                  {filteredQuestionsList.length === 0 && (
                    <div className="col-span-full py-12 glass-panel rounded-2xl text-center border border-white/5">
                      <p className="text-slate-500 text-xs italic">Tidak ada butir soal yang sesuai kata kunci pencarian.</p>
                    </div>
                  )}
                </div>

                {/* Dynamic Create/Edit Modal Overlay */}
                {editingQuestion && (
                  <div className="fixed inset-0 bg-[#000000]/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="w-full max-w-2xl bg-neutral-900 border border-white/10 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                        <h3 className="font-bold text-sm tracking-wider uppercase text-sky-400">
                          {editingQuestion.id ? "Sunting Butir Soal" : "Daulat Soal Baru"}
                        </h3>
                        <button onClick={() => setEditingQuestion(null)} className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-slate-200">
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <form onSubmit={handleSaveQuestion} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Mata Pelajaran (Subjek)</label>
                            <input
                              type="text"
                              placeholder="Cth: Matematika, Fisika, Kimia"
                              value={editingQuestion.subject || ""}
                              onChange={(e) => setEditingQuestion({ ...editingQuestion, subject: e.target.value })}
                              required
                              className="w-full bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1 font-mono">Posisikan Kunci Jawaban (A-E)</label>
                            <select
                              value={editingQuestion.correctAnswer || "A"}
                              onChange={(e) => setEditingQuestion({ ...editingQuestion, correctAnswer: e.target.value })}
                              required
                              className="w-full bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-xs focus:outline-none"
                            >
                              <option value="A">Opsi A</option>
                              <option value="B">Opsi B</option>
                              <option value="C">Opsi C</option>
                              <option value="D">Opsi D</option>
                              <option value="E">Opsi E</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Teks Rumusan Soal Ujian</label>
                          <textarea
                            placeholder="Tuliskan teks butir soal secara lengkap di sini..."
                            rows={3}
                            value={editingQuestion.text || ""}
                            onChange={(e) => setEditingQuestion({ ...editingQuestion, text: e.target.value })}
                            required
                            className="w-full bg-slate-950 border border-white/10 rounded-xl py-2.5 px-3 text-xs text-slate-200 focus:ring-1 focus:ring-sky-500 focus:outline-none whitespace-pre-wrap"
                          />
                        </div>

                        <div>
                          <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Tautkan Teks Image URL (Pendukung Soal Bergambar)</label>
                          <input
                            type="text"
                            placeholder="Cth: https://alamat-gambar-diagram.png (Bisa dikosongi saja)"
                            value={editingQuestion.imageUrl || ""}
                            onChange={(e) => setEditingQuestion({ ...editingQuestion, imageUrl: e.target.value })}
                            className="w-full bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-xs focus:outline-none"
                          />
                        </div>

                        {/* Options Form Mapping */}
                        <div className="space-y-2 border-t border-white/5 pt-4">
                          <p className="text-xs uppercase tracking-wider font-extrabold text-slate-400 mb-2">Alternatif Pilihan Jawaban (A-E):</p>
                          {["A", "B", "C", "D", "E"].map((letter) => {
                            const optionIndex = (editingQuestion.options || []).findIndex(opt => opt.key === letter);
                            const valText = optionIndex !== -1 ? editingQuestion.options![optionIndex].text : "";
                            
                            return (
                              <div key={letter} className="flex items-center gap-3 bg-slate-950/40 p-2.5 rounded-xl border border-white/5">
                                <span className="w-8 h-8 rounded bg-slate-950 border border-white/10 flex items-center justify-center font-bold text-xs text-sky-400 shrink-0">
                                  {letter}
                                </span>
                                <input
                                  type="text"
                                  placeholder={`Masukkan materi alternatif jawaban ${letter}`}
                                  value={valText}
                                  onChange={(e) => {
                                    const nextOptions = [...(editingQuestion.options || [])];
                                    const index = nextOptions.findIndex(o => o.key === letter);
                                    if (index !== -1) {
                                      nextOptions[index] = { ...nextOptions[index], text: e.target.value };
                                    } else {
                                      nextOptions.push({ key: letter, text: e.target.value });
                                    }
                                    setEditingQuestion({ ...editingQuestion, options: nextOptions });
                                  }}
                                  className="flex-1 bg-slate-950 border border-white/5 rounded-lg py-2 px-3 text-xs text-slate-200 focus:outline-none"
                                />
                              </div>
                            );
                          })}
                        </div>

                        {/* Bottom Actions inside modal */}
                        <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-4 mt-6">
                          <button
                            type="button"
                            onClick={() => setEditingQuestion(null)}
                            className="px-4 py-2 border border-white/10 hover:bg-white/5 rounded-xl text-xs font-semibold text-slate-300"
                          >
                            Batal
                          </button>
                          <button
                            type="submit"
                            className="px-6 py-2 bg-sky-500 hover:bg-sky-400 text-black font-extrabold rounded-xl text-xs uppercase tracking-widest flex items-center gap-1.5 shadow"
                          >
                            <Save className="w-4 h-4" />
                            Simpan Soal
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SECTION C: JADWAL & SESI UJIAN (TOKEN) VIEW */}
            {adminTab === "sesi" && (
              <div className="space-y-6">
                
                {/* Release token header block */}
                <div className="flex items-center justify-between gap-4 bg-slate-950/40 p-5 border border-white/5 rounded-2xl">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Rilis Ruang Ujian Baru</h3>
                    <p className="text-slate-500 text-xs mt-1">Sediakan Sesi ujian, atur lama menit durasi dan tentukan kunci Token ujian bagi siswa.</p>
                  </div>

                  <button
                    onClick={() => setEditingSession({
                      subject: "Bahasa Indonesia",
                      date: new Date().toISOString().split("T")[0],
                      duration: 90,
                      token: Math.floor(100000 + Math.random() * 900000).toString(),
                      isClosed: false
                    })}
                    className="bg-sky-500 hover:bg-sky-400 text-black px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 shadow"
                  >
                    <Plus className="w-4 h-4" />
                    Buat Sesi Baru
                  </button>
                </div>

                {/* Sesi active grid lists */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {adminSessions.map((session) => (
                    <div
                      key={session.id}
                      className={`p-6 rounded-2xl glass-panel border flex flex-col justify-between ${
                        session.isClosed ? "border-rose-500/20 opacity-80" : "border-emerald-500/20"
                      }`}
                    >
                      <div>
                        {/* Token Badge */}
                        <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-3 mb-4">
                          <span className="text-[9px] uppercase font-mono bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded border border-white/10">Matpel</span>
                          <span className="text-[12px] font-mono tracking-widest font-black text-sky-400 px-2 py-0.5 rounded bg-sky-550/5">
                            TOKEN: <span className="font-sans font-black uppercase text-xs">{session.token}</span>
                          </span>
                        </div>

                        <h4 className="text-md font-bold text-white uppercase">{session.subject}</h4>
                        
                        <div className="space-y-2 mt-4 text-xs font-mono text-slate-400">
                          <p>📅 TANGGAL: <span className="text-white float-right">{session.date}</span></p>
                          <p>⏱️ DURASI: <span className="text-white float-right">{session.duration} MENIT</span></p>
                          <p>
                            🔐 STATUS: 
                            <span className={`float-right font-bold ${session.isClosed ? 'text-rose-400' : 'text-emerald-400'}`}>
                              {session.isClosed ? 'DITUTUP (KUNCI)' : 'BUKA / AKTIF'}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Row Footer Button */}
                      <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-6">
                        <button
                          onClick={() => toggleSessionStatus(session)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border text-xs ${
                            session.isClosed 
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25" 
                              : "bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/25"
                          }`}
                        >
                          {session.isClosed ? "Buka Akses" : "Kunci Sesi"}
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingSession(session)}
                            className="p-1.5 border border-white/10 hover:border-white/30 text-slate-300 rounded-lg text-xs"
                            title="Edit Sesi"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-sky-400" />
                          </button>
                          <button
                            onClick={() => handleDeleteSession(session.id)}
                            className="p-1.5 border border-rose-500/10 hover:border-rose-500/30 text-rose-450 rounded-lg text-xs"
                            title="Hapus Sesi"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {adminSessions.length === 0 && (
                    <div className="col-span-full py-12 text-center glass-panel rounded-2xl border border-white/5">
                      <p className="text-slate-500 text-xs italic">Belum ada sesi ujian dirilis pengawas.</p>
                    </div>
                  )}
                </div>

                {/* Create/Edit Session modal dialog details */}
                {editingSession && (
                  <div className="fixed inset-0 bg-[#000000]/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="w-full max-w-md bg-neutral-900 border border-white/10 rounded-2xl p-6 shadow-2xl">
                      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                        <h3 className="font-bold text-sm tracking-wider uppercase text-sky-400">
                          {editingSession.id ? "Edit Sesi Ujian" : "Rilis Sesi Ujian Baru"}
                        </h3>
                        <button onClick={() => setEditingSession(null)} className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-slate-200">
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <form onSubmit={handleSaveSession} className="space-y-4">
                        <div>
                          <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Mata Pelajaran (Subjek)</label>
                          <input
                            type="text"
                            placeholder="Cth: Matematika, Fisika, B. Indonesia"
                            value={editingSession.subject || ""}
                            onChange={(e) => setEditingSession({ ...editingSession, subject: e.target.value })}
                            required
                            className="w-full bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Tanggal Rencana</label>
                            <input
                              type="date"
                              value={editingSession.date || ""}
                              onChange={(e) => setEditingSession({ ...editingSession, date: e.target.value })}
                              required
                              className="w-full bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-xs focus:outline-none font-mono text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Durasi (Menit)</label>
                            <input
                              type="number"
                              placeholder="90"
                              value={editingSession.duration || ""}
                              onChange={(e) => setEditingSession({ ...editingSession, duration: parseInt(e.target.value) || 0 })}
                              required
                              className="w-full bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-xs focus:outline-none font-mono text-white"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Generate Token Ujian</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={editingSession.token || ""}
                              onChange={(e) => setEditingSession({ ...editingSession, token: e.target.value.toUpperCase() })}
                              required
                              placeholder="Cari Token"
                              className="flex-1 bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-xs text-center font-bold tracking-widest font-mono text-sky-400 uppercase"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const randomT = Math.floor(100000 + Math.random() * 900000).toString();
                                setEditingSession({ ...editingSession, token: randomT });
                              }}
                              className="px-3 bg-slate-800 hover:bg-slate-700 rounded-xl border border-white/5 text-[10px] uppercase font-bold"
                            >
                              Acak
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-4 mt-6">
                          <button
                            type="button"
                            onClick={() => setEditingSession(null)}
                            className="px-4 py-2 border border-white/10 hover:bg-white/5 rounded-xl text-xs font-semibold text-slate-300"
                          >
                            Batal
                          </button>
                          <button
                            type="submit"
                            className="px-6 py-2 bg-sky-500 hover:bg-sky-400 text-black font-extrabold rounded-xl text-xs uppercase tracking-widest flex items-center gap-1.5"
                          >
                            <Save className="w-4 h-4" />
                            Simpan Sesi
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SECTION D: DATABASE SISWA PESERTA VIEW */}
            {adminTab === "siswa" && (
              <div className="space-y-6">
                
                {/* Search and class select bar */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-950/40 p-4 border border-white/5 rounded-xl">
                  <div className="relative w-full md:w-80">
                    <input
                      type="text"
                      placeholder="Cari NISN atau nama lengkap..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-950/80 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs text-white focus:outline-none focus:border-sky-500"
                    />
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto self-stretch md:self-auto justify-end">
                    <select
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      className="bg-slate-950/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
                    >
                      <option value="SEMUA KELAS">Kelas: Semua</option>
                      {classOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>

                    <button
                      onClick={() => setEditingStudent({ nisn: "", name: "", classRoom: "", password: "123" })}
                      className="bg-sky-500 hover:bg-sky-400 text-black px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Umat Siswa Baru
                    </button>
                  </div>
                </div>

                {/* Table list of students */}
                <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-950 border-b border-white/10 uppercase tracking-wider text-slate-400 font-mono text-[10px]">
                        <tr>
                          <th className="p-4">NISN (Username)</th>
                          <th className="p-4">Nama Lengkap</th>
                          <th className="p-4">Kelas</th>
                          <th className="p-4">Kunci Sandi</th>
                          <th className="p-4 text-right">Opsi Operasi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredStudentsList.map((st) => (
                          <tr key={st.nisn} className="hover:bg-white/2 transition-colors">
                            <td className="p-4 font-mono font-bold text-sky-400">{st.nisn}</td>
                            <td className="p-4 font-semibold text-white">{st.name}</td>
                            <td className="p-4">{st.classRoom}</td>
                            <td className="p-4 font-mono text-slate-400">{st.password || "123"}</td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => setEditingStudent(st)}
                                  className="p-1 px-2.5 border border-white/10 hover:border-white/30 text-slate-350 bg-white/5 rounded text-[10px] uppercase font-bold flex items-center gap-1 text-sky-400"
                                >
                                  <Edit2 className="w-3 h-3 text-sky-400" />
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteStudent(st.nisn)}
                                  className="p-1 px-2.5 border border-rose-500/10 hover:border-rose-500/30 text-rose-400 bg-white/5 rounded text-[10px] uppercase font-bold flex items-center gap-1"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  Hapus
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}

                        {filteredStudentsList.length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-slate-500 italic">Belum ada data siswa dalam filter ini.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Edit Student modal overlay */}
                {editingStudent && (
                  <div className="fixed inset-0 bg-[#000000]/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="w-full max-w-sm bg-neutral-900 border border-white/10 rounded-2xl p-6 shadow-2xl">
                      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                        <h3 className="font-bold text-sm tracking-wider uppercase text-sky-400">
                          {editingStudent.nisn ? "Sunting Data Peserta" : "Daftarkan Siswa Baru"}
                        </h3>
                        <button onClick={() => setEditingStudent(null)} className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-slate-200">
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <form onSubmit={handleSaveStudent} className="space-y-4">
                        <div>
                          <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1 font-mono">NISN (10 Digit)</label>
                          <input
                            type="text"
                            placeholder="Cth: 1234567890"
                            disabled={editingStudent.nisn !== "" && adminStudents.some(s => s.nisn === editingStudent.nisn)}
                            value={editingStudent.nisn || ""}
                            onChange={(e) => setEditingStudent({ ...editingStudent, nisn: e.target.value })}
                            required
                            className="w-full bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-xs focus:outline-none font-mono text-white text-md tracking-wider disabled:opacity-50"
                          />
                        </div>

                        <div>
                          <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Nama Lengkap Siswa</label>
                          <input
                            type="text"
                            placeholder="Cth: Ahmad Fauzi"
                            value={editingStudent.name || ""}
                            onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })}
                            required
                            className="w-full bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Rombel Kelas</label>
                          <input
                            type="text"
                            placeholder="Cth: XII RPL 1, XII IPA 2"
                            value={editingStudent.classRoom || ""}
                            onChange={(e) => setEditingStudent({ ...editingStudent, classRoom: e.target.value })}
                            required
                            className="w-full bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-xs focus:outline-none text-white uppercase font-semibold"
                          />
                        </div>

                        <div>
                          <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1 font-mono">Set Password Default</label>
                          <input
                            type="text"
                            placeholder="Akun password (biasanya: 123)"
                            value={editingStudent.password || ""}
                            onChange={(e) => setEditingStudent({ ...editingStudent, password: e.target.value })}
                            required
                            className="w-full bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-xs focus:outline-none font-mono text-slate-400"
                          />
                        </div>

                        <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-4 mt-6">
                          <button
                            type="button"
                            onClick={() => setEditingStudent(null)}
                            className="px-4 py-2 border border-white/10 hover:bg-white/5 rounded-xl text-xs font-semibold text-slate-300"
                          >
                            Batal
                          </button>
                          <button
                            type="submit"
                            className="px-6 py-2 bg-sky-500 hover:bg-sky-400 text-black font-extrabold rounded-xl text-xs uppercase tracking-widest flex items-center gap-1.5"
                          >
                            <Save className="w-4 h-4" />
                            Simpan Data
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SECTION E: LAPORAN & PENILAIAN REAL-TIME DETAIL */}
            {adminTab === "laporan" && (
              <div className="space-y-6">
                
                {/* Statistics helper banner with CSV download click */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-950/40 p-5 border border-white/5 rounded-2xl">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Arsip Lembar Jawaban & Nilai Siswa</h3>
                    <p className="text-slate-500 text-xs mt-1">Status pengumpulan siswa, total kebenaran soal, persentase nilai akhir, hingga warning kecurangan (minimizing screen).</p>
                  </div>

                  <button
                    onClick={handleExportCSV}
                    className="bg-emerald-500 hover:bg-emerald-400 text-black px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-black" />
                    Ekspor Excel (CSV)
                  </button>
                </div>

                {/* Score analysis table */}
                <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-950 border-b border-b-white/10 uppercase tracking-wider text-[10px] font-mono text-slate-400">
                        <tr>
                          <th className="p-4">Nama Siswa</th>
                          <th className="p-4">Mapel</th>
                          <th className="p-4 text-center font-bold text-sky-400">Skor Akhir</th>
                          <th className="p-4 text-center">B / S / K</th>
                          <th className="p-4 text-center">Anti-Cheat Warns</th>
                          <th className="p-4">Tanggal Mulai</th>
                          <th className="p-4 text-right">Dokumen</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {adminResults.map((resAttempt) => (
                          <tr key={resAttempt.id} className="hover:bg-white/2 transition-colors">
                            <td className="p-4 font-mono">
                              <p className="font-semibold text-white font-sans">{resAttempt.studentName}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">NISN: {resAttempt.nisn} | Kelas: {resAttempt.classRoom}</p>
                            </td>
                            <td className="p-4 font-semibold uppercase">{resAttempt.subject || "Matematika"}</td>
                            <td className="p-4 text-center shrink-0">
                              <span className="p-2 py-1 bg-sky-500/10 text-sky-400 rounded-lg text-xs font-black font-mono">
                                {resAttempt.score}
                              </span>
                            </td>
                            <td className="p-4 text-center font-mono text-[11px]">
                              <span className="text-emerald-400 font-bold">{resAttempt.correctCount}</span>
                              <span className="text-slate-500"> / </span>
                              <span className="text-rose-400 font-bold">{resAttempt.incorrectCount}</span>
                              <span className="text-slate-500"> / </span>
                              <span className="text-slate-300">{resAttempt.unansweredCount}</span>
                            </td>
                            <td className="p-4 text-center">
                              {resAttempt.antiCheatWarnings > 0 ? (
                                <span className="px-2 py-0.5 bg-rose-500/15 text-rose-400 border border-rose-500/30 rounded font-bold font-mono">
                                  ⚠️ {resAttempt.antiCheatWarnings} Warning
                                </span>
                              ) : (
                                <span className="text-slate-500 font-mono">-</span>
                              )}
                            </td>
                            <td className="p-4 font-mono text-[10px] text-slate-400">
                              {resAttempt.startTime ? new Date(resAttempt.startTime).toLocaleString("id-ID") : "-"}
                            </td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() => setViewingDetailAttempt(resAttempt)}
                                className="p-1 px-3 border border-white/10 hover:bg-white/5 rounded text-[10px] tracking-wide text-sky-400 uppercase font-black font-mono inline-flex items-center gap-1 shadow"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                Analisis
                              </button>
                            </td>
                          </tr>
                        ))}

                        {adminResults.length === 0 && (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-slate-500 italic">Belum ada rekap pengerjaan ujian masuk di server.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Analytical answer key breakdown modal dialog */}
                {viewingDetailAttempt && (
                  <div className="fixed inset-0 bg-[#000000]/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="w-full max-w-xl bg-neutral-900 border border-white/10 rounded-2xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
                      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                        <div>
                          <h3 className="font-bold text-sm tracking-wider uppercase text-sky-400">
                            Lembar Koreksi Lembar Jawaban
                          </h3>
                          <p className="text-[10px] text-slate-400 font-mono mt-1">Siswa: {viewingDetailAttempt.studentName} (Kelas: {viewingDetailAttempt.classRoom})</p>
                        </div>
                        <button onClick={() => setViewingDetailAttempt(null)} className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-slate-200">
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="space-y-3 font-mono">
                        <div className="grid grid-cols-2 gap-4 bg-slate-950 p-4 border border-white/5 rounded-xl text-xs">
                          <p><span className="text-slate-500">Mata Pelajaran:</span> {viewingDetailAttempt.subject}</p>
                          <p><span className="text-slate-500">NIlai Akhir (0-100):</span> <b className="text-sky-400">{viewingDetailAttempt.score}</b></p>
                          <p><span className="text-slate-500">Batas Pelanggaran:</span> {viewingDetailAttempt.antiCheatWarnings} Tab Exit</p>
                          <p>
                            <span className="text-slate-500">Keterangan:</span> 
                            <span className="text-emerald-400"> DIKOREKSI OTOMATIS</span>
                          </p>
                        </div>

                        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-extrabold mt-6 mb-2">Simulasi Butir Jawaban yang Dipilih:</p>
                        
                        <div className="space-y-2.5">
                          {adminQuestions
                            .filter(q => q.subject === viewingDetailAttempt.subject)
                            .map((q, qIdx) => {
                              const ansChose = viewingDetailAttempt.answers[q.id];
                              const isCorrect = ansChose === q.correctAnswer;
                              
                              return (
                                <div key={q.id} className="p-3 rounded-lg bg-slate-950/60 border border-white/5 text-xs">
                                  <p className="text-white text-xs font-sans font-medium line-clamp-2">
                                    Soal {qIdx + 1}: {q.text}
                                  </p>
                                  <div className="flex items-center gap-4 mt-3 pt-2.5 border-t border-white/5 text-[11px] font-mono">
                                    <p>Jawaban Siswa: 
                                      <span className={`ml-1 px-1.5 py-0.5 rounded ${isCorrect ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'}`}>
                                        {ansChose || "KOSONG"}
                                      </span>
                                    </p>
                                    <p>Kunci Benar: 
                                      <span className="ml-1 px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 font-extrabold">
                                        {q.correctAnswer}
                                      </span>
                                    </p>
                                    <p className="ml-auto font-bold uppercase tracking-wider">
                                      {isCorrect ? (
                                        <span className="text-emerald-400 text-[10px] flex items-center gap-1">✔️ BENAR</span>
                                      ) : (
                                        <span className="text-rose-400 text-[10px] flex items-center gap-1">❌ SALAH</span>
                                      )}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>

                      <div className="flex justify-end mt-6 pt-4 border-t border-white/10">
                        <button
                          onClick={() => setViewingDetailAttempt(null)}
                          className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs uppercase"
                        >
                          Tutup
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      )}

      {/* DETECTED ANTICHEAT ATTEMPT WARNING OVERLAY MODAL */}
      {cheatWarning && (
        <div className="fixed inset-0 bg-[#000000]/85 backdrop-blur-md flex items-center justify-center p-6 z-50 cheat-warning-active">
          <div className="w-full max-w-md bg-stone-950 border-2 border-rose-500 rounded-3xl p-8 text-center shadow-2xl relative">
            <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/30 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8" />
            </div>

            <span className="text-[10px] font-mono tracking-widest text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-full uppercase">
              Pelanggaran Terdeteksi
            </span>

            <h2 className="text-xl font-extrabold mt-4 text-rose-450 uppercase tracking-wider">Security Anti-Cheat Alarm</h2>
            <p className="text-slate-300 text-xs mt-3 leading-relaxed">
              {cheatWarning}
            </p>

            <div className="bg-slate-900/60 p-4 border border-rose-500/10 rounded-2xl text-[11px] font-mono mt-5 text-left text-slate-400">
              <p>📍 KEJADIAN: <span className="text-white float-right">Kelahiran Tab & Window Blur</span></p>
              <p>📈 TOTAL PELANGGARAN: <span className="text-rose-400 font-bold font-mono float-right">{(activeAttempt?.antiCheatWarnings || 0)} KALI</span></p>
              <p className="text-red-400 font-bold uppercase mt-2.5 text-center bg-red-950/40 p-1.5 rounded">DATA INI DIREKAM LIVE DI SERVER UTAMA!</p>
            </div>

            <button
              onClick={() => setCheatWarning(null)}
              className="w-full mt-6 py-3 bg-rose-500 hover:bg-rose-400 text-black font-extrabold rounded-2xl text-xs uppercase tracking-widest transition-all shadow-md active:scale-95"
            >
              Saya Bersumpah Tidak Mengulangi & Lanjutkan
            </button>
          </div>
        </div>
      )}

      {/* EXAM CONFIRM SUBMIT MODAL DIALOG */}
      {showConfirmSubmit && activeAttempt && (
        <div className="fixed inset-0 bg-[#000000]/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-sm bg-neutral-900 border border-white/10 rounded-2xl p-6 shadow-2xl text-center">
            <div className="w-12 h-12 bg-sky-500/10 border border-sky-500/30 text-sky-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-6 h-6" />
            </div>

            <h3 className="text-md font-bold text-white uppercase tracking-wider">Konfirmasi Kumpulkan Ujian</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Apakah Anda yakin ingin mengakhiri sesi ujian ini? Seluruh lembar jawaban Anda akan dikunci dan dianalisis nilainya dalam sistem.
            </p>

            {/* Answered vs Unanswered breakdown inside confirmation */}
            <div className="grid grid-cols-2 gap-2 mt-4 text-xs font-mono bg-slate-950 p-2.5 rounded-xl border border-white/5 text-left text-slate-300">
              <p>✔️ Sudah Diisi: <span className="text-emerald-400 float-right font-bold">{Object.keys(activeAttempt.answers || {}).length} Soal</span></p>
              <p>❌ Kosong / Belum: <span className="text-rose-400 float-right font-bold">{activeAttempt.unansweredCount} Soal</span></p>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setShowConfirmSubmit(false)}
                className="flex-1 py-2.5 border border-white/10 hover:bg-white/5 rounded-xl text-xs font-semibold text-slate-350 uppercase transition-all"
              >
                Kembali
              </button>
              <button
                onClick={() => handleSubmitExam(true)}
                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md"
              >
                Ya, Kumpulkan!
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
