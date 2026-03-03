const axios = require("axios");
const fs = require("fs");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/* ================= CONFIG ================= */

const CATEGORIES = {
  TAMIL: {
    groupTitle: "VT 📺 | Tamil Local Channel",
    urls: [
      "https://b4u.vodep39240327.workers.dev/1.json?url=https://tulnit.com/channel/local-tamil-tv/",
      "https://b4u.vodep39240327.workers.dev/1.json?url=https://tulnit.com/channel/local-tamil-tv/page/2",
      "https://b4u.vodep39240327.workers.dev/1.json?url=https://tulnit.com/channel/local-tamil-tv/page/3",
      "https://b4u.vodep39240327.workers.dev/1.json?url=https://tulnit.com/channel/local-tamil-tv/page/4",
      "https://b4u.vodep39240327.workers.dev/1.json?url=https://tulnit.com/channel/local-tamil-tv/page/5",
      "https://b4u.vodep39240327.workers.dev/1.json?url=https://tulnit.com/channel/local-tamil-tv/page/6",
      "https://b4u.vodep39240327.workers.dev/1.json?url=https://tulnit.com/channel/local-tamil-tv/page/7",
    ],
  },
  TELUGU: {
    groupTitle: "VT 📺 | Telugu Local Channel",
    urls: [
      "https://b4u.vodep39240327.workers.dev/1.json?url=https://tulnit.com/channel/telugu-tv/",
      "https://b4u.vodep39240327.workers.dev/1.json?url=https://tulnit.com/channel/telugu-tv/page/2",
      "https://b4u.vodep39240327.workers.dev/1.json?url=https://tulnit.com/channel/telugu-tv/page/3",
      "https://b4u.vodep39240327.workers.dev/1.json?url=https://tulnit.com/channel/telugu-tv/page/4",
    ],
  },
};

const OUTPUT_FILE = "stream.m3u";
const MAX_RETRIES = 2;
const REQUEST_TIMEOUT = 45000;

/* ================= FETCH FUNCTION ================= */

async function fetchUrl(url) {
  try {
    const start = Date.now();

    const response = await axios.get(url, {
      timeout: 60000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept":
          "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://tulnit.com/",
        "Connection": "keep-alive",
      },
      validateStatus: () => true,
    });

    const duration = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`   Status: ${response.status} (${duration}s)`);

    // 👇 IMPORTANT DEBUG
    console.log("   Content-Type:", response.headers["content-type"]);

    if (typeof response.data === "string") {
      console.log("   ⚠️ Got STRING instead of JSON");
      console.log(response.data.slice(0, 200));
      return [];
    }

    if (!Array.isArray(response.data)) {
      console.log("   ⚠️ Not an array");
      return [];
    }

    console.log(`   ✅ Items: ${response.data.length}`);
    return response.data;

  } catch (err) {
    console.log("   ❌ Error:", err.message);
    return [];
  }
}

/* ================= M3U GENERATOR ================= */

async function generateM3U() {
  console.log("🚀 Starting Fast Scraper\n");

  let m3uContent = "#EXTM3U\n";
  const seenStreams = new Set();

  for (const [categoryName, config] of Object.entries(CATEGORIES)) {
    console.log(`\n📂 Category: ${categoryName}`);

    // Parallel fetch (FAST)
    const results = await Promise.all(
      config.urls.map((url) => fetchUrl(url))
    );

    const categoryChannels = results.flat();
    console.log(`   📊 Found ${categoryChannels.length} raw items`);

    for (const channel of categoryChannels) {
      if (!channel?.stream_url || !channel?.title) continue;

      // Remove duplicates
      if (seenStreams.has(channel.stream_url)) continue;
      seenStreams.add(channel.stream_url);

      const cleanTitle = channel.title.replace(/,/g, " ");
      const logo = channel.image || "";
      const tvgName = channel.title;

      m3uContent += `#EXTINF:-1 tvg-name="${tvgName}" tvg-logo="${logo}" group-title="${config.groupTitle}", ${cleanTitle}\n`;
      m3uContent += `${channel.stream_url}\n`;
    }
  }

  fs.writeFileSync(OUTPUT_FILE, m3uContent, "utf-8");
  console.log(`\n✅ Saved: ${OUTPUT_FILE}`);
}

/* ================= START ================= */

generateM3U();