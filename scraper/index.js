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
  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
    const start = Date.now();

    try {
      console.log(`⏳ [${attempt}] Fetching: ${url}`);

      const response = await axios.get(url, {
        timeout: REQUEST_TIMEOUT,
        responseType: "json",
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Accept": "application/json, text/plain, */*",
          "Referer": "https://tulnit.com/",
        },
      });

      const duration = ((Date.now() - start) / 1000).toFixed(1);
      console.log(`   ✅ Success (${duration}s)`);

      if (!Array.isArray(response.data)) {
        console.log("   ⚠️ Invalid format (not array)");
        return [];
      }

      return response.data;

    } catch (err) {
      console.log(`   ❌ Attempt ${attempt} failed: ${err.message}`);

      if (attempt > MAX_RETRIES) {
        console.log("   ⛔ Giving up on this URL");
        return [];
      }

      await sleep(3000);
    }
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