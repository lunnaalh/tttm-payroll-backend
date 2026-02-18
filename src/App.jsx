import { useState } from "react";
import * as XLSX from "xlsx";
import "./index.css";

export default function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rows, setRows] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [search, setSearch] = useState("");
  const [sending, setSending] = useState(false);


  const login = () => {
    if (!email || !password) {
      alert("Enter email & password");
      return;
    }

    if (
      email === "office@ticketothemoon.com" &&
      password === "T1cket77"
    ) {
      setUser({ email });
    } else {
      alert("Wrong email or password");
    }
  };

  const logout = () => {
    setUser(null);
    setEmail("");
    setPassword("");
  };

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
  const netPayroll = rows.reduce(
    (s, r) => s + num(r["NetPay"]),
    0
  );

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

  if (!user) {
    return (
      <div className="login">
        <h1>Payroll System</h1>

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button onClick={login}>Login</button>
      </div>
    );
  }

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

        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleUpload}
        />

        <h2>Payroll Summary</h2>

        <div className="summary">
          <div className="card">
            <h3>Total Employees</h3>
            <p>{totalEmployees}</p>
          </div>

          <div className="card">
            <h3>Gross Payroll</h3>
            <p>Rp {grossPayroll.toLocaleString()}</p>
          </div>

          <div className="card">
            <h3>Total Deductions</h3>
            <p>Rp {totalDeductions.toLocaleString()}</p>
          </div>

          <div className="card">
            <h3>Net Payroll</h3>
            <p>Rp {netPayroll.toLocaleString()}</p>
          </div>
        </div>

        <input
          className="search"
          placeholder="Search employee..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="excel-wrap">
          <table className="excel">
            <thead>
              <tr>
                {headers.map((h) => (
                  <th key={h}>{h}</th>
                ))}
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {rows
                .filter((r) =>
                  String(r["Name"])
                    .toLowerCase()
                    .includes(search.toLowerCase())
                )
                .map((r, i) => (
                  <tr key={i}>
                    {headers.map((h) => (
                      <td key={h}>{r[h]}</td>
                    ))}
                    <td>—</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <button
          className="pdf"
          onClick={sendEmailsToAll}
          disabled={sending}
          style={{ backgroundColor: sending ? "#ccc" : "#4CAF50" }}
        >
          {sending ? "Sending..." : "📧 Send Emails to All Employees"}
        </button>
      </main>
    </div>
  );
}
