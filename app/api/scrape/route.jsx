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

        const browser = await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });

        const page = await browser.newPage();
        await page.goto(googleQuery, { waitUntil: "domcontentloaded" });

        // Extract full page HTML
        const pageContent = await page.content();

        await browser.close();

        return NextResponse.json({ html: pageContent }, { status: 200 });

    } catch (error) {
        console.error("Error fetching Google search page:", error);
        return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
    }
}
