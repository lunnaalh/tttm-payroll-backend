import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import "./index.css";

import { auth } from "./firebase";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "firebase/auth";

export default function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rows, setRows] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [search, setSearch] = useState("");
  const [sending, setSending] = useState(false);

  // ✅ Firebase auth state (no restrictions here)
  useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {

    // ✅ ONLY allow office account
    if (currentUser?.email === "office@ticketothemoon.com") {
      setUser(currentUser);
    } else {
      // ❌ force logout for all other emails
      if (currentUser) {
        await signOut(auth);
      }
      setUser(null);
    }

  });

  return () => unsubscribe();
}, []);

  // ================= AUTH =================

  const login = async () => {
  if (!email || !password) {
    alert("Enter email & password");
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch {
    alert("Wrong email or password");
  }
};

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  // ================= EXCEL =================

  const num = (v) => {
    if (!v || v === "") return 0;
    const cleaned = String(v)
      .replace(/Rp\s*/g, "")
      .replace(/\./g, "")
      .replace(/,/g, "")
      .trim();
    return Number(cleaned) || 0;
  };

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);
      const wb = XLSX.read(data, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(ws, { defval: "" });

      const cleaned = json.map((r) => {
        const obj = {};
        Object.keys(r).forEach((k) => {
          if (!k.toLowerCase().includes("unnamed")) obj[k.trim()] = r[k];
        });
        return obj;
      });

      setHeaders(Object.keys(cleaned[0] || {}));
      setRows(cleaned.filter((r) => r["Name"]));
    };

    reader.readAsArrayBuffer(file);
  };

  const totalEmployees = rows.length;
  const grossPayroll = rows.reduce(
    (s, r) => s + num(r["TotalEarnings"]),
    0
  );
  const totalDeductions = rows.reduce(
    (s, r) => s + num(r["Total deduction"]),
    0
  );
  const netPayroll = rows.reduce((s, r) => s + num(r["NetPay"]), 0);

  // ================= SEND EMAIL =================

  const sendEmailsToAll = async () => {
    if (rows.length === 0) {
      alert("No employee data loaded!");
      return;
    }

    setSending(true);

    try {
      const response = await fetch(
        "http://localhost:5000/send-payslips",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rows }),
        }
      );

      const data = await response.json();

      if (data.success) {
        alert("✅ Emails sent successfully!");
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (err) {
      alert(`❌ Failed to send emails: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  // ================= LOGIN PAGE =================

  if (!user) {
    return (
      <div className="login">
        <h1>Payroll System</h1>

        <input
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button onClick={login}>Login</button>
      </div>
    );
  }

  // ================= MAIN APP =================

  return (
    <div className="layout">
      <aside className="sidebar">
        <h2>Ticket To The Moon</h2>
        <p>Payroll</p>
        <p style={{ fontSize: "12px" }}>
          Logged in as:<br />
          {user.email}
        </p>
        <button onClick={logout}>Logout</button>
      </aside>

      <main className="main">
        <h1>Payroll System</h1>

        <input type="file" accept=".xlsx,.xls" onChange={handleUpload} />

        {/* rest unchanged */}
      </main>
    </div>
  );
}
