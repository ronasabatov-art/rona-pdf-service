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
        /* הגדרות להדפסת A4 נקייה */
        @page { size: A4; margin: 0; }
        html, body { margin: 0; padding: 0; }
        
        /* הקסם: מונע מהדפדפן לחתוך פסקאות או כותרות באמצע */
        section, .experience-item, .project-item, .skill-category {
          break-inside: avoid !important;
          page-break-inside: avoid !important;
        }

        /* מוודא שהרקע הצבעוני של הסיידבר נמשך לכל אורך הדף */
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
          format: 'A4',          // חוזרים לפורמט סטנדרטי
          printBackground: true, // שומר על הגרפיקה
          margin: { top: 0, right: 0, bottom: 0, left: 0 }
        }
      })
    });

    const pdf = await response.arrayBuffer();
    res.setHeader("Content-Type", "application/pdf");
    res.send(Buffer.from(pdf));

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
