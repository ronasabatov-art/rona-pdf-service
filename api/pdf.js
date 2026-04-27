import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const { html } = req.body;

    // כאן אנחנו אומרים לשרת להוריד את ה"מנוע" של הדפדפן אם הוא חסר
    const executablePath = await chromium.executablePath(
      `https://github.com/sparticuz/chromium/releases/download/v123.0.1/chromium-v123.0.1-pack.tar`
    );

    const browser = await puppeteer.launch({
      args: [...chromium.args, "--hide-scrollbars", "--disable-web-security"],
      defaultViewport: chromium.defaultViewport,
      executablePath: executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0px", right: "0px", bottom: "0px", left: "0px" }
    });

    await browser.close();
    res.setHeader("Content-Type", "application/pdf");
    res.send(pdf);
  } catch (error) {
    res.status(500).send("Server Error: " + error.message);
  }
}
