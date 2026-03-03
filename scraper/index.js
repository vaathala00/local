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
  try {
    console.log(`   -> Requesting: ${url}...`);
    
    // Increased timeout to 180000ms (3 minutes) because links are slow
    const response = await axios.get(url, {
      timeout: 180000, 
      responseType: 'json'
    });

    // Check if the response is actually an array
    if (!Array.isArray(response.data)) {
      console.warn(`   ⚠️ Warning: Response is not an array (Type: ${typeof response.data}). Skipping.`);
      return [];
    }

    console.log(`   ✅ Success: Fetched ${response.data.length} items.`);
    return response.data;

  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      console.error(`   ❌ TIMEOUT: The request took longer than 3 minutes and was cancelled.`);
    } else if (error.response) {
      console.error(`   ❌ HTTP Error ${error.response.status}: ${error.response.statusText}`);
    } else {
      console.error(`   ❌ Error: ${error.message}`);
    }
    return [];
  }
}

async function generateM3U() {
  console.log("🚀 Starting M3U Generation...");
  let m3uContent = "#EXTM3U\n";

  for (const [categoryName, config] of Object.entries(CATEGORIES)) {
    console.log(`\n📡 Processing ${categoryName}: Fetching ${config.urls.length} pages...`);

    // We keep Promise.all for speed, but now with longer timeouts
    const promises = config.urls.map(url => fetchUrl(url));
    const results = await Promise.all(promises);

    let allChannels = results.flat();
    console.log(`✅ Total fetched for ${categoryName}: ${allChannels.length} channels.`);

    allChannels.forEach(channel => {
      // Basic validation
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