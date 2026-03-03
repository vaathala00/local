const axios = require("axios");
const fs = require("fs");

// Helper function to pause execution (Sleep)
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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

async function fetchUrl(url, retries = 2) {
  const startTime = Date.now();
  
  try {
    console.log(`\n⏳ Preparing to load... ${url}`);
    console.log(`   🐢 Slowing down... waiting 5 seconds (Human Simulation)`);
    await sleep(60000); // <--- SLOW DOWN: Wait 5 seconds before fetching

    console.log(`   📡 Sending Request...`);
    
    const response = await axios.get(url, {
      timeout: 120000, // 2 minutes timeout
      responseType: 'json',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Referer': 'https://tulnit.com/', // Tell them we are coming from their site
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`   📡 HTTP Status: ${response.status} | Time: ${duration}s`);

    if (!Array.isArray(response.data)) {
      console.warn(`   ⚠️ Data is NOT an array. Skipping.`);
      return [];
    }

    // CHECK FOR EMPTY ARRAY
    if (response.data.length === 0) {
      console.warn(`   ⚠️ Received EMPTY ARRAY [].`);
      
      if (retries > 0) {
        console.log(`   🔄 Retrying in 10 seconds... (${retries} attempts left)`);
        await sleep(10000); // Wait 10 seconds before retry
        return fetchUrl(url, retries - 1); // RECURSIVE CALL
      } else {
        console.error(`   ❌ Max retries reached. Giving up on this link.`);
        return [];
      }
    }

    console.log(`   ✅ SUCCESS: Found ${response.data.length} items.`);
    return response.data;

  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.error(`   ❌ ERROR: ${error.message} (after ${duration}s)`);
    
    if (retries > 0) {
        console.log(`   🔄 Retrying in 10 seconds... (${retries} attempts left)`);
        await sleep(10000);
        return fetchUrl(url, retries - 1);
    }

    return [];
  }
}

async function generateM3U() {
  console.log("🚀 STARTING SLOW SCRAPER");
  let m3uContent = "#EXTM3U\n";

  for (const [categoryName, config] of Object.entries(CATEGORIES)) {
    console.log(`\n📂 Category: ${categoryName}`);
    let categoryChannels = [];

    for (const url of config.urls) {
      const data = await fetchUrl(url); 
      categoryChannels = categoryChannels.concat(data);
      
      // Extra small pause between links to be nice to the server
      await sleep(2000); 
    }

    console.log(`\n📊 Finished ${categoryName}. Total: ${categoryChannels.length}.`);

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