  import { PDFDocument } from 'pdf-lib';

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const { html } = req.body;
    const BROWSERLESS_TOKEN = "2UPZhQ7nEbXV6fG63fcc5e9df3bfacbe8248ebf7b5c0bfd77";
    const url = `https://production-sfo.browserless.io/pdf?token=${BROWSERLESS_TOKEN}`;

    // ה-HTML וה-CSS המקוריים והנקיים שלך - ללא שום שינוי פונטים או עיצוב!
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

    // 1. הפקת ה-PDF המקורי דרך Browserless כפי שהיה תמיד
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
    
    // חישוב המשקל המקורי של הקובץ שנוצר
    const originalSizeInMB = finalPdfBuffer.byteLength / (1024 * 1024);

    // 2. מנגנון הגנה: אם הקובץ שנוצר גדול מ-2MB, נפעיל דחיסה אוטומטית מבנית
    if (originalSizeInMB > 2) {
      // טעינת ה-PDF לתוך pdf-lib
      const pdfDoc = await PDFDocument.load(originalPdfBuffer);
      
      // שמירה מחדש תוך שימוש ב-Object Streams שמכווץ ומייעל את המבנה הפנימי והפונטים של ה-PDF
      const compressedPdfBytes = await pdfDoc.save({ useObjectStreams: true });
      finalPdfBuffer = Buffer.from(compressedPdfBytes);
    }

    // בדיקה סופית לאחר הדחיסה לוודא שעמדנו ביעד עבור לינקדאין
    const finalSizeInMB = finalPdfBuffer.byteLength / (1024 * 1024);
    if (finalSizeInMB > 2) {
      return res.status(413).json({ 
        error: `גם לאחר דחיסה אוטומטית, משקל הקובץ (${finalSizeInMB.toFixed(2)}MB) גדול מ-2MB. יש להקטין את קובץ תמונת הפרופיל המקורית.` 
      });
    }

    // 3. שליחת קובץ ה-PDF המוכן והתקין למשתמש
    res.setHeader("Content-Type", "application/pdf");
    res.send(finalPdfBuffer);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
