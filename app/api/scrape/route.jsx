import { NextResponse } from "next/server";
import puppeteer from "puppeteer";

export async function GET(req) {
    try {
        // Extract URL from query params
        const { searchParams } = new URL(req.url);
        const urlToCheck = searchParams.get("url");

        if (!urlToCheck) {
            return NextResponse.json({ error: "Missing URL parameter" }, { status: 400 });
        }

        const googleQuery = `https://www.google.com/search?q=site:${urlToCheck}`;

        console.log(`🔍 Searching: ${googleQuery}`);

        // Launch Puppeteer with anti-detection tweaks
        const browser = await puppeteer.launch({
            headless: "new",
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-blink-features=AutomationControlled",
                "--disable-dev-shm-usage",
                "--disable-gpu",
                "--single-process"
            ]
        });

        const page = await browser.newPage();

        // Set a real browser User-Agent to avoid detection
        await page.setUserAgent(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
        );

        // Add additional anti-detection methods
        await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, "webdriver", { get: () => false });
        });

        // Open Google Search Page
        await page.goto(googleQuery, { waitUntil: "domcontentloaded" });

        // Check if Google CAPTCHA appears
        const captchaCheck = await page.evaluate(() =>
            document.body.innerText.includes("Our systems have detected unusual traffic")
        );
        if (captchaCheck) {
            await browser.close();
            return NextResponse.json(
                { error: "Google CAPTCHA detected. Use a proxy or solve manually." },
                { status: 403 }
            );
        }

        // Extract full page HTML
        const pageContent = await page.content();

        await browser.close();

        return NextResponse.json({ html: pageContent }, { status: 200 });

    } catch (error) {
        console.error("Error fetching Google search page:", error);
        return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
    }
}
