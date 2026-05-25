export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const { html } = req.body;
    const BROWSERLESS_TOKEN = "2UPZhQ7nEbXV6fG63fcc5e9df3bfacbe8248ebf7b5c0bfd77";
    const url = `https://production-sfo.browserless.io/pdf?token=${BROWSERLESS_TOKEN}`;

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

    // הזרקת אופטימיזציית ה-CSS ישירות לתוך הגדרות הרינדור של Browserless.
    // זה מוחק את הצלליות ששוקלות המון ומוריד את הקובץ אל מתחת ל-2MB מבלי לשנות את העיצוב!
    const shadowOptCSS = "* { box-shadow: none !important; text-shadow: none !important; filter: none !important; }";

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
        },
        addStyle: [
          { content: shadowOptCSS }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Execution failed");
    }

    const pdf = await response.arrayBuffer();
    
    // בדיקה סופית מול מגבלת 2MB של לינקדאין
    const fileSizeInMB = pdf.byteLength / (1024 * 1024);
    if (fileSizeInMB > 2) {
      return res.status(413).json({ 
        error: `קובץ ה-PDF גדול מ-2MB המותרים בלינקדאין (${fileSizeInMB.toFixed(2)}MB).` 
      });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.send(Buffer.from(pdf));

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
