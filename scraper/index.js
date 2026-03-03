const axios = require("axios");
const fs = require("fs");

// === CONFIGURATION ===
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

async function fetchUrl(url) {
  const startTime = Date.now();
  try {
    console.log(`\n⏳ LOADING... ${url}`);
    console.log(`   ⏸️  Script is PAUSED. Waiting up to 2 minutes for this specific link...`);

    // Timeout set to 120,000ms (2 minutes)
    const response = await axios.get(url, {
      timeout: 120000, 
      responseType: 'json'
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    if (!Array.isArray(response.data)) {
      console.warn(`   ⚠️ [${duration}s] Error: Data is not an array.`);
      return [];
    }

    console.log(`   ✅ [${duration}s] LOAD COMPLETE.`);
    console.log(`   ➡️  Now moving to the next link...`);
    
    return response.data;

  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.error(`   ❌ [${duration}s] FAILED or TIMEOUT.`);
    return [];
  }
}

async function generateM3U() {
  console.log("🚀 STARTING SCRIP");
  let m3uContent = "#EXTM3U\n";

  for (const [categoryName, config] of Object.entries(CATEGORIES)) {
    console.log(`\n📂 Category: ${categoryName}`);
    let categoryChannels = [];

    // === STRICT SEQUENTIAL PROCESSING ===
    // This loop waits for the line above to finish before running the next line.
    for (const url of config.urls) {
      const data = await fetchUrl(url); // <--- WAITS HERE UNTIL DONE
      categoryChannels = categoryChannels.concat(data);
    }

    console.log(`\n📊 Finished fetching all links for ${categoryName}. Total: ${categoryChannels.length} channels.`);

    categoryChannels.forEach(channel => {
      if (!channel || !channel.stream_url || !channel.title) return;
      const cleanTitle = channel.title.replace(/,/g, " ");
      const logo = channel.image || "";
      const tvgName = channel.title;
      const extInf = `#EXTINF:-1 tvg-name="${tvgName}" tvg-logo="${logo}" group-title="${config.groupTitle}", ${cleanTitle}`;
      m3uContent += `${extInf}\n${channel.stream_url}\n`;
    });
  }

  fs.writeFileSync(OUTPUT_FILE, m3uContent, "utf-8");
  console.log(`\n✅ Saved ${OUTPUT_FILE}`);
}

generateM3U();