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
    
    // Added User-Agent to look like a real browser
    const response = await axios.get(url, {
      timeout: 120000, 
      responseType: 'json',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json, text/plain, */*'
      }
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    // === DEBUG LOGS ===
    console.log(`   📡 HTTP Status Code: ${response.status}`);
    console.log(`   🧪 First 300 chars of response:`, JSON.stringify(response.data).substring(0, 300));
    // ==================
    
    if (!Array.isArray(response.data)) {
      console.warn(`   ⚠️ [${duration}s] Data is NOT an array. It might be an HTML error page.`);
      return [];
    }

    if (response.data.length === 0) {
        console.warn(`   ⚠️ [${duration}s] Data is an empty array [].`);
    } else {
        console.log(`   ✅ [${duration}s] LOAD COMPLETE. Found ${response.data.length} items.`);
    }
    
    return response.data;

  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.error(`   ❌ [${duration}s] ERROR: ${error.message}`);
    if (error.response) {
        console.error(`   ❌ Server responded with status: ${error.response.status}`);
        console.error(`   ❌ Server data:`, JSON.stringify(error.response.data).substring(0, 200));
    }
    return [];
  }
}

async function generateM3U() {
  console.log("🚀 STARTING SCRIP");
  let m3uContent = "#EXTM3U\n";

  for (const [categoryName, config] of Object.entries(CATEGORIES)) {
    console.log(`\n📂 Category: ${categoryName}`);
    let categoryChannels = [];

    for (const url of config.urls) {
      const data = await fetchUrl(url);
      categoryChannels = categoryChannels.concat(data);
    }

    console.log(`\n📊 Finished ${categoryName}. Total channels: ${categoryChannels.length}.`);

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