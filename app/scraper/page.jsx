"use client";

import { useState } from "react";

export default function ScraperPage() {
    const [url, setUrl] = useState("");
    const [htmlData, setHtmlData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchGoogleData = async () => {
        if (!url.trim()) {
            alert("Please enter a valid URL to check.");
            return;
        }

        setLoading(true);
        setError(null);
        setHtmlData(null);

        try {
            const response = await fetch(`/api/scrape?url=${encodeURIComponent(url)}`);
            const data = await response.json();

            if (response.ok) {
                setHtmlData(data.html);
            } else {
                setError(data.error || "An error occurred while fetching data.");
            }
        } catch (error) {
            setError("Network error. Please try again.");
            console.error("Error fetching data:", error);
        }

        setLoading(false);
    };

    const resetData = () => {
        setUrl("");
        setHtmlData(null);
        setError(null);
    };

    return (
        <div className="max-w-2xl mx-auto mt-10 p-6 bg-white border border-gray-300 shadow-lg rounded-lg">
            <h1 className="text-2xl font-bold text-gray-800 text-center mb-4">Google Index Checker</h1>
            
            <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter URL (e.g., https://dumpsqueen.com/nclex-dumps/nclex-pn/)"
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
            
            <div className="flex gap-2 mt-3">
                <button
                    onClick={fetchGoogleData}
                    disabled={loading}
                    className={`flex-1 p-3 text-white font-semibold rounded-md transition ${
                        loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                    }`}
                >
                    {loading ? "Fetching..." : "Check Indexing"}
                </button>
                <button
                    onClick={resetData}
                    disabled={loading}
                    className="flex-1 p-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-md transition"
                >
                    Reset
                </button>
            </div>

            {error && (
                <div className="mt-4 p-3 bg-red-100 text-red-600 border border-red-300 rounded-md">
                    {error}
                </div>
            )}

            {htmlData && (
                <div className="mt-6 p-3 bg-gray-100 border border-gray-300 rounded-md overflow-auto max-h-96">
                    <h2 className="text-lg font-semibold text-gray-700">Google Search Page HTML:</h2>
                    <pre className="text-xs whitespace-pre-wrap break-words">{htmlData}</pre>
                </div>
            )}
        </div>
    );
}
