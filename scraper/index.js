const axios = require("axios");
const fs = require("fs");

// === CONFIGURATION ===
// Map your categories to their specific URLs and Output Group Titles
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
  // Add more languages here following the same pattern...
};

const OUTPUT_FILE = "stream.m3u";

async function fetchUrl(url) {
  try {
    const response = await axios.get(url, { timeout: 60000 }); // 60s timeout per link
    return response.data;
  } catch (error) {
    console.error(`❌ Failed to fetch ${url}: ${error.message}`);
    return [];
  }
}

async function generateM3U() {
  console.log("🚀 Starting M3U Generation...");
  let m3uContent = "#EXTM3U\n";

  // Loop through each category (Tamil, Telugu, etc.)
  for (const [categoryName, config] of Object.entries(CATEGORIES)) {
    console.log(`\n📡 Processing ${categoryName}: Fetching ${config.urls.length} pages in parallel...`);

    // Fetch all URLs for this category simultaneously (parallel processing)
    const promises = config.urls.map(url => fetchUrl(url));
    const results = await Promise.all(promises);

    // Flatten the results (combine all pages into one list)
    let allChannels = results.flat();

    console.log(`✅ Fetched ${allChannels.length} channels for ${categoryName}.`);

    // Format channels
    allChannels.forEach(channel => {
      if (!channel.stream_url || !channel.title) return;

      // Clean title (remove commas to prevent M3U syntax errors)
      const cleanTitle = channel.title.replace(/,/g, " ");
      
      // Extract ID or Image safely
      const logo = channel.image || "";
      const tvgName = channel.title;

      // Construct the EXTINF line
      // Format: #EXTINF:-1 tvg-name="..." tvg-logo="..." group-title="...", Title
      const extInf = `#EXTINF:-1 tvg-name="${tvgName}" tvg-logo="${logo}" group-title="${config.groupTitle}", ${cleanTitle}`;

      // Add to content
      m3uContent += `${extInf}\n${channel.stream_url}\n`;
    });
  }

  // Write to file
  fs.writeFileSync(OUTPUT_FILE, m3uContent, "utf-8");
  console.log(`\n✅ Successfully saved ${OUTPUT_FILE}`);
}

generateM3U();