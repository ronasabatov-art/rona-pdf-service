export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const { html } = req.body;
    const BROWSERLESS_TOKEN = "2UPZhQ7nEbXV6fG63fcc5e9df3bfacbe8248ebf7b5c0bfd77";
    
    // חזרה לקישור המקורי והנקי
    const url = `https://production-sfo.browserless.io/pdf?token=${BROWSERLESS_TOKEN}`;

    // ה-HTML וה-CSS המקוריים כפי שמופיעים ב-Commit בגיטהאב שלך
    const finalHtml = `
      <meta name="viewport" content="width=1200">
      <style>
        /* הגדרות A4 מקוריות */
        @page { size: A4; margin: 0; }
        html, body { margin: 0; padding: 0; }
        
        /* מניעת חיתוך פסקאות באמצע */
        section, .experience-item, .project-item, .skill-category {
          break-inside: avoid !important;
          page-break-inside: avoid !important;
        }

        /* שמירה על הרקע הצבעוני של הסיידבר */
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
          margin: { top: 0, right: 0, bottom: 0, left: 0 }
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Execution failed");
    }

    const pdf = await response.arrayBuffer();
    res.setHeader("Content-Type", "application/pdf");
    res.send(Buffer.from(pdf));

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
