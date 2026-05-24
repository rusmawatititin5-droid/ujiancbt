import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initialStudents, initialQuestions, initialSessions } from './mockData.ts';

// Dynamic Static Environment Detector & Local API Engine
const isStaticPages = typeof window !== "undefined" && (
  window.location.hostname.endsWith(".github.io") ||
  (!window.location.port && !window.location.hostname.includes("run.app") && window.location.hostname !== "localhost")
);

if (isStaticPages) {
  // Setup standard local initial keys if not already present
  if (!localStorage.getItem("cbt_local_students")) {
    localStorage.setItem("cbt_local_students", JSON.stringify(initialStudents));
  }
  if (!localStorage.getItem("cbt_local_questions")) {
    localStorage.setItem("cbt_local_questions", JSON.stringify(initialQuestions));
  }
  if (!localStorage.getItem("cbt_local_sessions")) {
    localStorage.setItem("cbt_local_sessions", JSON.stringify(initialSessions));
  }
  if (!localStorage.getItem("cbt_local_attempts")) {
    localStorage.setItem("cbt_local_attempts", JSON.stringify([]));
  }
  
  const originalFetch = window.fetch;
  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = typeof input === "string" ? input : (input instanceof URL ? input.toString() : input.url);
    
    if (url.includes("/api/")) {
      const apiIndex = url.indexOf("/api/");
      const path = url.substring(apiIndex + 5);
      const method = init?.method || "GET";
      const body = init?.body ? JSON.parse(init.body as string) : null;
      
      let resData: any = null;
      let status = 200;
      
      try {
        if (path.startsWith("auth/login")) {
          const { role, username, password, nisn } = body;
          const students = JSON.parse(localStorage.getItem("cbt_local_students") || "[]");
          if (role === "admin") {
            if (username === "admin" && password === "admin123") {
              resData = { role: "admin", name: "Administrator" };
            } else {
              status = 401;
              resData = { message: "Kredensial admin salah!" };
            }
          } else {
            const student = students.find((s: any) => s.nisn === nisn && s.password === password);
            if (student) {
              resData = { role: "student", student };
            } else {
              status = 401;
              resData = { message: "NISN atau Kata Sandi salah!" };
            }
          }
        } 
        else if (path === "sessions" && method === "GET") {
          resData = JSON.parse(localStorage.getItem("cbt_local_sessions") || "[]");
        }
        else if (path === "sessions" && method === "POST") {
          const list = JSON.parse(localStorage.getItem("cbt_local_sessions") || "[]");
          const newSess = { ...body, id: "s_" + Date.now() };
          list.push(newSess);
          localStorage.setItem("cbt_local_sessions", JSON.stringify(list));
          resData = newSess;
        }
        else if (path.startsWith("sessions/") && method === "PUT") {
          const id = path.split("/")[1];
          const list = JSON.parse(localStorage.getItem("cbt_local_sessions") || "[]");
          const idx = list.findIndex((s: any) => s.id === id);
          if (idx !== -1) {
            list[idx] = { ...list[idx], ...body };
            localStorage.setItem("cbt_local_sessions", JSON.stringify(list));
            resData = list[idx];
          } else {
            status = 404;
            resData = { message: "Sesi tidak ditemukan" };
          }
        }
        else if (path.startsWith("sessions/") && method === "DELETE") {
          const id = path.split("/")[1];
          const list = JSON.parse(localStorage.getItem("cbt_local_sessions") || "[]");
          const updated = list.filter((s: any) => s.id !== id);
          localStorage.setItem("cbt_local_sessions", JSON.stringify(updated));
          resData = { success: true };
        }
        else if (path === "students" && method === "GET") {
          resData = JSON.parse(localStorage.getItem("cbt_local_students") || "[]");
        }
        else if (path === "students" && method === "POST") {
          const list = JSON.parse(localStorage.getItem("cbt_local_students") || "[]");
          list.push(body);
          localStorage.setItem("cbt_local_students", JSON.stringify(list));
          resData = body;
        }
        else if (path.startsWith("students/") && method === "PUT") {
          const nisn = path.split("/")[1];
          const list = JSON.parse(localStorage.getItem("cbt_local_students") || "[]");
          const idx = list.findIndex((s: any) => s.nisn === nisn);
          if (idx !== -1) {
            list[idx] = { ...list[idx], ...body };
            localStorage.setItem("cbt_local_students", JSON.stringify(list));
            resData = list[idx];
          } else {
            status = 404;
            resData = { message: "Siswa tidak ditemukan" };
          }
        }
        else if (path.startsWith("students/") && method === "DELETE") {
          const nisn = path.split("/")[1];
          const list = JSON.parse(localStorage.getItem("cbt_local_students") || "[]");
          const updated = list.filter((s: any) => s.nisn !== nisn);
          localStorage.setItem("cbt_local_students", JSON.stringify(updated));
          resData = { success: true };
        }
        else if (path === "questions" && method === "GET") {
          resData = JSON.parse(localStorage.getItem("cbt_local_questions") || "[]");
        }
        else if (path === "questions" && method === "POST") {
          const list = JSON.parse(localStorage.getItem("cbt_local_questions") || "[]");
          const newQ = { ...body, id: "q_" + Date.now() };
          list.push(newQ);
          localStorage.setItem("cbt_local_questions", JSON.stringify(list));
          resData = newQ;
        }
        else if (path.startsWith("questions/") && method === "PUT") {
          const id = path.split("/")[1];
          const list = JSON.parse(localStorage.getItem("cbt_local_questions") || "[]");
          const idx = list.findIndex((q: any) => q.id === id);
          if (idx !== -1) {
            list[idx] = { ...list[idx], ...body };
            localStorage.setItem("cbt_local_questions", JSON.stringify(list));
            resData = list[idx];
          } else {
            status = 404;
            resData = { message: "Soal tidak ditemukan" };
          }
        }
        else if (path.startsWith("questions/") && method === "DELETE") {
          const id = path.split("/")[1];
          const list = JSON.parse(localStorage.getItem("cbt_local_questions") || "[]");
          const updated = list.filter((q: any) => q.id !== id);
          localStorage.setItem("cbt_local_questions", JSON.stringify(updated));
          resData = { success: true };
        }
        else if (path.startsWith("exam/status")) {
          const params = new URLSearchParams(url.split("?")[1] || "");
          const nisn = params.get("nisn");
          const sessionId = params.get("sessionId");
          const attempts = JSON.parse(localStorage.getItem("cbt_local_attempts") || "[]");
          const attempt = attempts.find((a: any) => a.nisn === nisn && a.examSessionId === sessionId) || null;
          const sessions = JSON.parse(localStorage.getItem("cbt_local_sessions") || "[]");
          const session = sessions.find((s: any) => s.id === sessionId) || null;
          resData = { attempt, session };
        }
        else if (path.startsWith("exam/start")) {
          const { nisn, token } = body;
          const students = JSON.parse(localStorage.getItem("cbt_local_students") || "[]");
          const student = students.find((s: any) => s.nisn === nisn);
          const sessions = JSON.parse(localStorage.getItem("cbt_local_sessions") || "[]");
          const session = sessions.find((s: any) => s.token.toUpperCase() === token.toUpperCase() && !s.isClosed);
          
          if (!student) {
            status = 404;
            resData = { message: "Siswa tidak terdaftar!" };
          } else if (!session) {
            status = 404;
            resData = { message: "Sesi ujian tidak aktif atau token salah!" };
          } else {
            const attempts = JSON.parse(localStorage.getItem("cbt_local_attempts") || "[]");
            let attempt = attempts.find((a: any) => a.nisn === nisn && a.examSessionId === session.id);
            const allQuestions = JSON.parse(localStorage.getItem("cbt_local_questions") || "[]");
            const questions = allQuestions.filter((q: any) => q.subject === session.subject);
            
            if (!attempt) {
              attempt = {
                id: session.id + "_" + nisn,
                examSessionId: session.id,
                nisn,
                studentName: student.name,
                classRoom: student.classRoom,
                startTime: new Date().toISOString(),
                answers: {},
                doubtfulAnswers: [],
                isSubmitted: false,
                score: 0,
                correctCount: 0,
                incorrectCount: 0,
                unansweredCount: questions.length,
                antiCheatWarnings: 0
              };
              attempts.push(attempt);
              localStorage.setItem("cbt_local_attempts", JSON.stringify(attempts));
            }
            resData = { attempt, session, questions };
          }
        }
        else if (path.startsWith("exam/update")) {
          const { attemptId, answers, doubtfulAnswers, antiCheatWarnings } = body;
          const attempts = JSON.parse(localStorage.getItem("cbt_local_attempts") || "[]");
          const idx = attempts.findIndex((a: any) => a.id === attemptId);
          if (idx !== -1) {
            if (answers) {
              attempts[idx].answers = { ...attempts[idx].answers, ...answers };
            }
            if (doubtfulAnswers) {
              attempts[idx].doubtfulAnswers = doubtfulAnswers;
            }
            if (antiCheatWarnings !== undefined) {
              attempts[idx].antiCheatWarnings = antiCheatWarnings;
            }
            localStorage.setItem("cbt_local_attempts", JSON.stringify(attempts));
            resData = { attempt: attempts[idx] };
          } else {
            status = 404;
            resData = { message: "Attempt tidak ditemukan" };
          }
        }
        else if (path.startsWith("exam/submit")) {
          const { attemptId } = body;
          const attempts = JSON.parse(localStorage.getItem("cbt_local_attempts") || "[]");
          const idx = attempts.findIndex((a: any) => a.id === attemptId);
          if (idx !== -1) {
            const attempt = attempts[idx];
            const allQuestions = JSON.parse(localStorage.getItem("cbt_local_questions") || "[]");
            const sessions = JSON.parse(localStorage.getItem("cbt_local_sessions") || "[]");
            const session = sessions.find((s: any) => s.id === attempt.examSessionId);
            const questions = allQuestions.filter((q: any) => q.subject === (session?.subject || ""));
            
            let correct = 0;
            let incorrect = 0;
            questions.forEach((q: any) => {
              const ans = attempt.answers[q.id];
              if (ans === q.correctAnswer) {
                correct++;
              } else if (ans) {
                incorrect++;
              }
            });
            const totalQ = questions.length || 1;
            const score = Math.round((correct / totalQ) * 100);
            
            attempt.isSubmitted = true;
            attempt.endTime = new Date().toISOString();
            attempt.score = score;
            attempt.correctCount = correct;
            attempt.incorrectCount = incorrect;
            attempt.unansweredCount = totalQ - (correct + incorrect);
            
            localStorage.setItem("cbt_local_attempts", JSON.stringify(attempts));
            resData = { attempt };
          } else {
            status = 404;
            resData = { message: "Attempt tidak ditemukan" };
          }
        }
        else if (path === "results" && method === "GET") {
          const attempts = JSON.parse(localStorage.getItem("cbt_local_attempts") || "[]");
          const sessions = JSON.parse(localStorage.getItem("cbt_local_sessions") || "[]");
          resData = attempts.map((a: any) => {
            const sess = sessions.find((s: any) => s.id === a.examSessionId);
            return {
              ...a,
              subject: sess?.subject || "CBT",
              sessionDate: sess?.date || "-",
              duration: sess?.duration || 0
            };
          });
        }
        else {
          status = 404;
          resData = { message: "Endpoint mock API tidak ditemukan" };
        }
      } catch (err: any) {
        status = 500;
        resData = { message: err.message || "Interseptor API Error" };
      }
      
      const responseStream = JSON.stringify(resData);
      return new Response(responseStream, {
        status,
        headers: { "Content-Type": "application/json" }
      });
    }
    return originalFetch.apply(window, [input, init]);
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

