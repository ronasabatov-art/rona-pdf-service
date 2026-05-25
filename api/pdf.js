// טעינת הספרייה ישירות מהאינטרנט - חוסך התקנות ב-Base44
import { PDFDocument } from 'https://esm.sh/pdf-lib@1.17.1';

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const { html } = req.body;
    const BROWSERLESS_TOKEN = "2UPZhQ7nEbXV6fG63fcc5e9df3bfacbe8248ebf7b5c0bfd77";
    const url = `https://production-sfo.browserless.io/pdf?token=${BROWSERLESS_TOKEN}`;

    // ה-HTML וה-CSS המקוריים והנקיים שלך - ללא שום שינוי בעיצוב
    const finalHtml = `
      <meta name="viewport" content="width=1200">
      <style>
        @page { 
          size: A4; 
          margin: 0; 
        }
        html, body { 
          margin: 0; 
          padding: 0; 
          width: 210mm;
          -webkit-print-color-adjust: exact;
        }
        section, .experience-item, .project-item, .skill-category {
          break-inside: avoid !important;
          page-break-inside: avoid !important;
        }
        .sidebar {
          min-height: 100vh;
        }
      </style>
      ${html}
    `;

    // 1. הפקת ה-PDF המקורי מ-Browserless
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        html: finalHtml,
        options: {
          format: 'A4',
          printBackground: true,
          margin: { top: 0, right: 0, bottom: 0, left: 0 },
          preferCSSPageSize: true
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Execution failed");
    }

    const originalPdfBuffer = await response.arrayBuffer();
    let finalPdfBuffer = Buffer.from(originalPdfBuffer);
    
    const originalSizeInMB = finalPdfBuffer.byteLength / (1024 * 1024);

    // 2. מנגנון הגנה: דחיסה אופטימלית אגרסיבית יותר אם הקובץ עובר את ה-2MB
    if (originalSizeInMB > 2) {
      const pdfDoc = await PDFDocument.load(originalPdfBuffer);
      
      // שמירה עם הגדרות תתי-קבוצות לפונטים ואיחוד אובייקטים (ללא פגיעה ויזואלית)
      const compressedPdfBytes = await pdfDoc.save({ 
        useObjectStreams: true,
        addGlyphsToSubsets: true,
        updateFieldAppearances: false
      });
      finalPdfBuffer = Buffer.from(compressedPdfBytes);
    }

    // בדיקה סופית מול מגבלת 2MB של לינקדאין
    const finalSizeInMB = finalPdfBuffer.byteLength / (1024 * 1024);
    if (finalSizeInMB > 2) {
      return res.status(413).json({ 
        error: `גם לאחר דחיסה אוטומטית משודרגת, משקל הקובץ (${finalSizeInMB.toFixed(2)}MB) גדול מ-2MB.` 
      });
    }

    // 3. שליחת קובץ ה-PDF הדחוס והמוכן למשתמש
    res.setHeader("Content-Type", "application/pdf");
    res.send(finalPdfBuffer);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
