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
    console.log(`   📡 Waiting for: ${url}...`);
    
    // 5 Minute Timeout (300000ms) - Extremely slow links
    const response = await axios.get(url, {
      timeout: 300000, 
      responseType: 'json'
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    if (!Array.isArray(response.data)) {
      console.warn(`   ⚠️ [${duration}s] Response not an array. Skipping.`);
      return [];
    }

    console.log(`   ✅ [${duration}s] Fetched ${response.data.length} items.`);
    return response.data;

  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    if (error.code === 'ECONNABORTED') {
      console.error(`   ❌ [${duration}s] TIMEOUT: Link took > 5 mins.`);
    } else if (error.response) {
      console.error(`   ❌ [${duration}s] Server Error: ${error.response.status}`);
    } else {
      console.error(`   ❌ [${duration}s] Error: ${error.message}`);
    }
    return [];
  }
}

async function generateM3U() {
  console.log("🚀 Starting M3U Generation (Sequential Mode)...");
  let m3uContent = "#EXTM3U\n";

  for (const [categoryName, config] of Object.entries(CATEGORIES)) {
    console.log(`\n📂 Category: ${categoryName} (${config.urls.length} pages)`);

    // === CHANGED: Sequential Loop instead of Promise.all ===
    // We process one URL at a time to avoid overwhelming the slow worker
    let categoryChannels = [];
    
    for (const url of config.urls) {
      const data = await fetchUrl(url);
      categoryChannels = categoryChannels.concat(data);
    }
    
    console.log(`📊 Total fetched for ${categoryName}: ${categoryChannels.length} channels.`);

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
  console.log(`\n✅ Successfully saved ${OUTPUT_FILE}`);
}

generateM3U();