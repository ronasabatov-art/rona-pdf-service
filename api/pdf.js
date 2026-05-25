 export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const { html } = req.body;
    const BROWSERLESS_TOKEN = "2UPZhQ7nEbXV6fG63fcc5e9df3bfacbe8248ebf7b5c0bfd77";
    
    // אופטימיזציה נוספת: הגבלת איכות הרינדור ל-50 והפחתת פרופיל הצבע (ביטול lossless) ישירות ב-URL
    const url = `https://production-sfo.browserless.io/pdf?token=${BROWSERLESS_TOKEN}&--losslessCompression=false&--optimizeFonts=true&--pdfQuality=50`;

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
        
        /* הסרת אלמנטים כבדים ברינדור כרום (כמו צלליות ואפקטים מורכבים) */
        * {
          text-rendering: optimizeLegibility !important;
          -webkit-font-smoothing: antialiased !important;
          box-shadow: none !important; 
          text-shadow: none !important;
        }
        
        .sidebar {
          min-height: 100vh;
        }
      </style>
      ${html}
    `;

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

    const pdf = await response.arrayBuffer();
    
    // בדיקה מול מגבלת 2MB של לינקדאין
    const fileSizeInMB = pdf.byteLength / (1024 * 1024);
    if (fileSizeInMB > 2) {
      return res.status(413).json({ 
        error: `קובץ ה-PDF נוצר בהצלחה אך משקלו (${fileSizeInMB.toFixed(2)}MB) חורג מה-2MB המותרים בלינקדאין.` 
      });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.send(Buffer.from(pdf));

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
