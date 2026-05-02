export default async function handler(req, res) {
  // הגדרות אבטחה כדי למנוע שגיאות Fetch מהדפדפן
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const { html } = req.body;
    if (!html) throw new Error("Missing HTML content");

    const BROWSERLESS_TOKEN = "2UPZhQ7nEbXV6fG63fcc5e9df3bfacbe8248ebf7b5c0bfd77";
    const url = `https://production-sfo.browserless.io/pdf?token=${BROWSERLESS_TOKEN}`;

    // הזרקת הגדרות Viewport וביטול חלוקה לעמודים ב-CSS
    const finalHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=1200">
        <style>
          @page { size: auto; margin: 0; }
          html, body { 
            margin: 0 !important; 
            padding: 0 !important; 
            width: 210mm !important; 
            height: auto !important;
          }
          * { 
            break-inside: avoid !important; 
            page-break-inside: avoid !important; 
          }
        </style>
      </head>
      <body>
        ${html}
      </body>
      </html>
    `;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        html: finalHtml,
        options: {
          width: '210mm',
          printBackground: true,
          preferCSSPageSize: true, // אומר לשרת להיצמד לגובה האוטומטי מה-CSS
          margin: { top: 0, right: 0, bottom: 0, left: 0 }
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Browserless Error: ${errorText}`);
    }

    const pdf = await response.arrayBuffer();
    res.setHeader("Content-Type", "application/pdf");
    res.send(Buffer.from(pdf));

  } catch (error) {
    console.error("API Error:", error.message);
    res.status(500).json({ error: error.message });
  }
}
