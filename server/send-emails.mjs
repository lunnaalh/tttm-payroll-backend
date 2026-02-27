import XLSX from "xlsx";
import * as brevo from "@getbrevo/brevo";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===== CONFIG =====
const EXCEL_PATH = "C:\\Users\\HP\\Downloads\\salary slip2 (1).xlsx";
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const FROM_EMAIL = "office@ticketothemoon.com";
const FROM_NAME = "Ticket To The Moon";
// ==================

const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, BREVO_API_KEY);

const LOGO_PATH = path.join(__dirname, "assets", "logo-06.jpg");
const STAMP_PATH = path.join(__dirname, "assets", "tttm_hrd_stamp.jpg");

function buildPDF(r) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const getValue = (key) => {
      if (!r) return 0;
      const searchKey = key.toLowerCase().replace(/\s/g, '');
      const actualKey = Object.keys(r).find(k => k.toLowerCase().replace(/\s/g, '') === searchKey);
      let val = r[actualKey];
      if (val === undefined || val === null || val === "") return 0;
      if (typeof val === "string") {
        return Number(val.replace(/Rp\s*/g, "").replace(/\./g, "").replace(/,/g, "").trim()) || 0;
      }
      return Number(val) || 0;
    };

    const formatRp = (val) => {
      const num = typeof val === 'number' ? val : getValue(val);
      if (!num || num === 0) return "-";
      return num.toLocaleString("id-ID");
    };

    let y = 28;
    if (fs.existsSync(LOGO_PATH)) doc.image(LOGO_PATH, 40, y - 10, { width: 80 });
    doc.fontSize(8).font("Helvetica").fillColor("#333")
      .text("Jl. Muding Batu Sangian IV no 10, Kerobokan", 280, y, { align: "right", width: 275 });
    y += 10;
    doc.text("Telp: 0361-419288 | www.ticketothemoon.com", 280, y, { align: "right", width: 275 });
    y += 50;
    doc.moveTo(40, y).lineTo(555, y).lineWidth(1).stroke("#dddddd");
    y += 15;
    doc.fontSize(18).font("Helvetica-Bold").fillColor("#1a1a1a").text("SALARY SLIP", 0, y, { align: "center" });
    y += 25;

    doc.roundedRect(40, y, 515, 60, 3).fillAndStroke("#f5f5f5", "#003D5C");
    y += 10;
    doc.fontSize(8).font("Helvetica").fillColor("#333");
    doc.text("ID: " + (r.EmployeeID || "-"), 50, y);
    doc.text("Position: " + (r.Position || "-"), 300, y);
    y += 12;
    doc.text("Name: " + (r.Name || "-"), 50, y);
    doc.text("Hire Date: " + (r.HireDate || "-"), 300, y);
    y += 12;
    doc.text("Working Days: " + (r.WorkingDays || "-"), 50, y);
    doc.text("Location: " + (r.Location || "-"), 300, y);
    y += 18;

    const col1X = 40, col2X = 215, col3X = 390, colWidth = 165;
    doc.roundedRect(col1X, y, colWidth, 22, 2).fillAndStroke("#003D5C", "#003D5C");
    doc.roundedRect(col2X, y, colWidth, 22, 2).fillAndStroke("#003D5C", "#003D5C");
    doc.roundedRect(col3X, y, colWidth, 22, 2).fillAndStroke("#003D5C", "#003D5C");
    doc.font("Helvetica-Bold").fontSize(9).fillColor("#FFF");
    doc.text("INCOME", col1X, y + 6, { width: colWidth, align: "center" });
    doc.text("DEDUCTION", col2X, y + 6, { width: colWidth, align: "center" });
    doc.text("LAST MONTH'S BENEFITS", col3X, y + 6, { width: colWidth, align: "center" });
    y += 28;

    const income = [
      ["Basic Salary", getValue("BasicSalary")],
      ["Yearly Working Allow.", getValue("YearlyWorkingAllowance")],
      ["Skill Allow.", getValue("SkillAllowance")],
      ["Meal Allow.", getValue("MealAllowance")],
      ["Transport", getValue("Transport")],
      ["Productivity", getValue("Productivity")],
      ["Overtime", getValue("Overtime")],
      ["Meal OT", getValue("MealOvertime")],
      ["Homework", getValue("HomeworkAllowance")],
    ];
    const deduction = [
      ["Other Deduct.", getValue("Other Deductions")],
      ["Adv Cash", getValue("Adv cash deductions")],
    ];
    const benefits = [
      ["BPJS Health", getValue("Benefit BPJS kesehatan")],
      ["BPJS Employment", getValue("Benefit BPJS Tenaga Kerja")],
      ["PPH 21", getValue("Benefit PPH 21")],
    ];

    doc.fontSize(7.5).font("Helvetica").fillColor("#333");
    for (let i = 0; i < 9; i++) {
      if (i % 2 === 0) {
        doc.rect(col1X, y - 2, colWidth, 16).fill("#fafafa");
        if (i < deduction.length) doc.rect(col2X, y - 2, colWidth, 16).fill("#fafafa");
        if (i < benefits.length) doc.rect(col3X, y - 2, colWidth, 16).fill("#fafafa");
      }
      doc.fillColor("#333");
      doc.text(income[i][0], col1X + 5, y);
      doc.text("Rp " + formatRp(income[i][1]), col1X + 85, y, { width: 75, align: "right" });
      if (i < deduction.length) {
        doc.text(deduction[i][0], col2X + 5, y);
        doc.text("Rp " + formatRp(deduction[i][1]), col2X + 85, y, { width: 75, align: "right" });
      }
      if (i < benefits.length) {
        doc.text(benefits[i][0], col3X + 5, y);
        doc.text("Rp " + formatRp(benefits[i][1]), col3X + 85, y, { width: 75, align: "right" });
      }
      y += 16;
    }

    y += 15;
    doc.fontSize(6.5).font("Helvetica-Oblique").fillColor("#666");
    doc.text("Benefits 100% supported by the company", col3X + 5, y, { width: colWidth - 10 });
    y += 10;

    doc.fontSize(8).font("Helvetica-Bold").fillColor("#1a1a1a");
    doc.text("TOTAL", col1X + 5, y);
    doc.text("Rp " + formatRp(getValue("TotalEarnings")), col1X + 85, y, { width: 75, align: "right" });
    doc.text("TOTAL", col2X + 5, y);
    doc.text("Rp " + formatRp(getValue("Total deduction")), col2X + 85, y, { width: 75, align: "right" });
    doc.text("TOTAL", col3X + 5, y);
    doc.text("Rp " + formatRp(getValue("Total  benefit")), col3X + 85, y, { width: 75, align: "right" });

    y += 25;
    doc.roundedRect(280, y, 275, 35, 4).lineWidth(1.5).fillAndStroke("#f5f5f5", "#003D5C");
    doc.fontSize(10).font("Helvetica-Bold").fillColor("#1a1a1a").text("TAKE HOME PAY", 290, y + 8);
    doc.fontSize(14).text("Rp " + formatRp(getValue("NetPay")), 290, y + 18, { width: 255, align: "right" });

    const signY = y + 55;
    const signX = 420;
    if (fs.existsSync(STAMP_PATH)) doc.image(STAMP_PATH, signX + 15, signY + 12, { width: 75 });
    doc.font("Helvetica-Bold").text("HRD Department", signX, signY + 75, { width: 115, align: "center" });

    doc.end();
  });
}

async function main() {
  console.log("📂 Reading Excel...");
  const wb = XLSX.readFile(EXCEL_PATH);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json(ws, { defval: "" });
  const rows = json.filter(r => r["Name"]);
  console.log(`👥 Found ${rows.length} employees`);

  let sent = 0, skipped = 0;

  for (const r of rows) {
    if (!r.Email || r.Email.trim() === "") {
      console.log(`⏭ Skipped (no email): ${r.Name}`);
      skipped++;
      continue;
    }

    try {
      const pdfBuffer = await buildPDF(r);
      const sendSmtpEmail = new brevo.SendSmtpEmail();
      sendSmtpEmail.sender = { name: FROM_NAME, email: FROM_EMAIL };
      sendSmtpEmail.to = [{ email: r.Email.trim(), name: r.Name }];
      sendSmtpEmail.subject = `Salary Slip - ${r.Name}`;
      sendSmtpEmail.htmlContent = `<p>Dear ${r.Name},</p><p>Please find your attached salary slip.</p>`;
      sendSmtpEmail.attachment = [{ name: `Salary-Slip-${r.Name}.pdf`, content: pdfBuffer.toString("base64") }];
      await apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log(`✅ Sent to: ${r.Name} (${r.Email})`);
      sent++;
      await new Promise(res => setTimeout(res, 1000));
    } catch (err) {
      console.error(`❌ Failed for ${r.Name}: ${err.message}`);
    }
  }

  console.log(`\n🎉 Done! Sent: ${sent}, Skipped: ${skipped}`);
}

main();
