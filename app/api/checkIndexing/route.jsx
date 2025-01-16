import { NextResponse } from "next/server";
import puppeteer from "puppeteer";

// Function to generate a random session key
const generateSessionKey = () => Math.random().toString(36).substring(2, 15);

export async function POST(req) {
    try {
        const { urls } = await req.json();

        if (!urls || !Array.isArray(urls)) {
            return NextResponse.json({ message: "Invalid URLs array" }, { status: 400 });
        }

        const results = [];
        const proxyHost = "gw.dataimpulse.com";
        const proxyPort = "823";
        const proxyUser = "d0ff83de17e4adadbaab__cr.us";
        const proxyPass = "0f4bcbc92369cc01";
        const proxyUrl = `http://${proxyUser}:${proxyPass}@${proxyHost}:${proxyPort}`;

        console.log("Using Proxy:", proxyUrl);

        for (const url of urls) {
            const sessionKey = generateSessionKey();
            let browser;
            let proxyUsed = "Unknown";

            try {
                browser = await puppeteer.launch({
                    headless: 'new',
                    args: [
                        "--no-sandbox",
                        "--disable-setuid-sandbox",
                        `--proxy-server=http://${proxyHost}:${proxyPort}`
                    ]
                });

                const page = await browser.newPage();
                await page.authenticate({ username: proxyUser, password: proxyPass });

                // Verify Proxy IP
                try {
                    await page.goto('https://api.ipify.org', { waitUntil: "domcontentloaded" });
                    proxyUsed = await page.evaluate(() => document.body.innerText);
                    console.log("Proxy Used (Public IP):", proxyUsed);
                } catch (proxyError) {
                    console.error("Proxy Verification Failed:", proxyError);
                }

                // Perform Google Search
                try {
                    const googleQuery = `https://www.google.com/search?q=site:${url}`;
                    await page.goto(googleQuery, { waitUntil: "domcontentloaded" });

                    // Check if Google returned "did not match any documents"
                    const noResults = await page.evaluate(() => {
                        return document.body.innerText.includes("did not match any documents");
                    });

                    if (noResults) {
                        results.push({
                            url,
                            indexed: false,
                            proxy: proxyUsed,
                            searchResults: [],
                            message: "Not Indexed"
                        });
                        console.log(`❌ ${url} is NOT indexed`);
                    } else {
                        // Extract search results
                        const searchResults = await page.evaluate(() => {
                            return Array.from(document.querySelectorAll(".tF2Cxc")).map(result => ({
                                title: result.querySelector("h3")?.innerText || "No Title",
                                link: result.querySelector("a")?.href || "No Link",
                                description: result.querySelector(".VwiC3b")?.innerText || "No Description"
                            }));
                        });

                        const isIndexed = searchResults.some(result => result.title !== "No Title");

                        results.push({ url, indexed: isIndexed, proxy: proxyUsed, searchResults });
                        console.log(`✅ ${url} is indexed`);
                    }
                } catch (searchError) {
                    console.error(`Error checking ${url}:`, searchError);
                    results.push({
                        url,
                        indexed: false,
                        proxy: proxyUsed,
                        searchResults: [],
                        error: "Failed to fetch search results"
                    });
                }

            } catch (error) {
                console.error("Browser Launch Error:", error);
                results.push({
                    url,
                    indexed: false,
                    proxy: proxyUsed,
                    searchResults: [],
                    error: "Browser launch failed"
                });
            } finally {
                if (browser) await browser.close();
            }
        }

        return NextResponse.json({ results }, { status: 200 });
    } catch (error) {
        console.error("Server Error:", error);
        return NextResponse.json({ message: "Server Error" }, { status: 500 });
    }
}
