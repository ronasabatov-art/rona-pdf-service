export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const { html } = req.body;
    const BROWSERLESS_TOKEN = "2UPZhQ7nEbXV6fG63fcc5e9df3bfacbe8248ebf7b5c0bfd77";

    // אנחנו עוברים ל-Endpoint של screenshot אבל מבקשים סוג PDF
    // זה השילוב המנצח שמאפשר גובה אוטומטי באמת (fullPage)
    const url = `https://production-sfo.browserless.io/screenshot?token=${BROWSERLESS_TOKEN}&type=pdf&fullPage=true`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        html: html,
        context: {
          viewport: {
            width: 1200, // שומר על פריסת דסקטופ מהמובייל
            height: 800,
            deviceScaleFactor: 1
          }
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
