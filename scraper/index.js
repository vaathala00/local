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
    console.log(`⏳ STARTING: ${url}`);
    
    // 5 Minute Timeout - Script will wait here until done or 5 mins pass
    const response = await axios.get(url, {
      timeout: 300000, 
      responseType: 'json'
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    if (!Array.isArray(response.data)) {
      console.warn(`   ⚠️ [${duration}s] Skipped (Not an array)`);
      return [];
    }

    console.log(`✅ FINISHED: Loaded ${response.data.length} items in ${duration}s`);
    return response.data;

  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.error(`❌ FAILED: ${error.message} (after ${duration}s)`);
    return [];
  }
}

async function generateM3U() {
  console.log("🚀 Script Started (Strict Sequential Mode)");
  let m3uContent = "#EXTM3U\n";

  // Loop through each Category
  for (const [categoryName, config] of Object.entries(CATEGORIES)) {
    console.log(`\n📂 Processing Category: ${categoryName}`);
    let categoryChannels = [];

    // ==========================================
    // STRICT SEQUENTIAL LOOP
    // ==========================================
    // The "await" keyword below forces the loop to PAUSE.
    // It will NOT run the next URL until this one is done.
    for (const url of config.urls) {
      const data = await fetchUrl(url); // <--- WAITS HERE
      categoryChannels = categoryChannels.concat(data);
    }

    console.log(`📊 Completed ${categoryName}: Total ${categoryChannels.length} channels found.`);

    // Build M3U content
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