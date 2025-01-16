import { NextResponse } from "next/server";
import puppeteer from "puppeteer";

export async function POST(req) {
    try {
        const { urls } = await req.json();

        if (!urls || !Array.isArray(urls)) {
            return NextResponse.json({ message: "Invalid URLs array" }, { status: 400 });
        }

        const browser = await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });

        const page = await browser.newPage();
        const results = [];

        for (const url of urls) {
            try {
                const googleQuery = `https://www.google.com/search?q=site:${url}`;
                await page.goto(googleQuery, { waitUntil: "domcontentloaded" });

                // Extract search results
                const searchResults = await page.evaluate(() => {
                    return Array.from(document.querySelectorAll(".tF2Cxc")).map(result => ({
                        title: result.querySelector("h3")?.innerText || "No Title",
                        link: result.querySelector("a")?.href || "No Link",
                        description: result.querySelector(".VwiC3b")?.innerText || "No Description"
                    }));
                });

                // Check if the exact URL appears in search results
                const isIndexed = searchResults.some(result => result.link.includes(url));

                results.push({
                    url,
                    indexed: isIndexed,
                    searchResults
                });

            } catch (error) {
                console.error(`Error checking ${url}:`, error);
                results.push({
                    url,
                    indexed: false,
                    searchResults: [],
                    error: "Failed to fetch search results"
                });
            }
        }

        await browser.close();
        return NextResponse.json({ results }, { status: 200 });

    } catch (error) {
        console.error("Server error:", error);
        return NextResponse.json({ message: "Server Error" }, { status: 500 });
    }
}
