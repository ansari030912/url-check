"use client";

import { useState } from "react";

const CheckUrl = () => {
  const [urls, setUrls] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");

  const checkIndexing = async () => {
    setLoading(true);
    setResults([]);

    const urlArray = urls
      .split("\n")
      .map((url) => url.trim())
      .filter((url) => url.length > 0);

    if (urlArray.length === 0) {
      alert("Please enter valid URLs.");
      setLoading(false);
      return;
    }

    for (const url of urlArray) {
      setCurrentUrl(url);

      try {
        const response = await fetch("/api/checkIndexing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ urls: [url] }), // Send one URL at a time
        });

        const data = await response.json();
        console.log("🚀 ~ checkIndexing ~ data:", data)
        setResults((prevResults) => [...prevResults, ...data.results]);
      } catch (error) {
        alert("Error fetching indexing status.");
      }
    }

    setLoading(false);
    setCurrentUrl("");
  };

  const copyToClipboard = (url) => {
    navigator.clipboard.writeText(url);
    alert(`Copied: ${url}`);
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white border border-gray-300 shadow-lg rounded-lg">
      <h1 className="text-2xl font-bold text-gray-800 text-center mb-4">
        Google Index Checker
      </h1>
      <textarea
        rows="6"
        value={urls}
        onChange={(e) => setUrls(e.target.value)}
        placeholder="Enter URLs (one per line)"
        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
      ></textarea>
      <button
        onClick={checkIndexing}
        disabled={loading}
        className={`w-full mt-3 p-3 text-white font-semibold rounded-md transition ${
          loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {loading ? "Checking..." : "Check Indexing"}
      </button>

      {loading && currentUrl && (
        <p className="mt-3 text-gray-600 animate-pulse">Checking: {currentUrl}</p>
      )}

      {results.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-gray-700">Results:</h2>
          <ul className="mt-2 space-y-2">
            {results.map((result, index) => (
              <li
                key={index}
                className={`flex justify-between items-center p-3 rounded-md text-sm border ${
                  result.indexed
                    ? "border-green-500 text-green-600"
                    : "border-red-500 text-red-600"
                }`}
              >
                <span>
                  {result.url} - {result.indexed ? "Indexed ✅" : "Not Indexed ❌"}
                </span>
                <button
                  onClick={() => copyToClipboard(result.url)}
                  className="ml-3 px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md text-xs"
                >
                  Copy 📋
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CheckUrl;
