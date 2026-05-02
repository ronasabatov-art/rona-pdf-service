export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const { html } = req.body;
    const BROWSERLESS_TOKEN = "2UPZhQ7nEbXV6fG63fcc5e9df3bfacbe8248ebf7b5c0bfd77";

    const url = `https://production-sfo.browserless.io/pdf?token=${BROWSERLESS_TOKEN}&waitUntil=networkidle0`;

    // הזרקת ה-viewport לטיפול במובייל ו-CSS לגובה אוטומטי
    const finalHtml = `
      <meta name="viewport" content="width=1200">
      <style>
        /* ביטול חלוקה לדפים והגדרת גובה גמיש */
        @page { 
          size: auto; 
          margin: 0; 
        }
        html, body { 
          margin: 0 !important; 
          padding: 0 !important; 
          width: 210mm !important; 
          height: auto !important;
          min-height: auto !important;
        }
        /* מניעת חיתוך אלמנטים באמצע */
        * { 
          break-inside: avoid !important; 
          page-break-inside: avoid !important; 
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
          width: '210mm',
          printBackground: true,
          // הקסם: אומר לשרת להשתמש בגובה האוטומטי שהגדרנו ב-CSS ולא ב-A4 קשיח
          preferCSSPageSize: true,[cite: 1]
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
    res.status(500).send("Server Error: " + error.message);
  }
}
