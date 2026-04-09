
async function testFallback() {
  const cacheBuster = Date.now();
  const targetUrl = `https://finans.truncgil.com/v3/today.json?_=${cacheBuster}`;
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}&_=${cacheBuster}`;
  
  try {
    const res = await fetch(proxyUrl);
    console.log("Proxy Status:", res.status);
    if (res.ok) {
      const proxyData = await res.json();
      const data = JSON.parse(proxyData.contents);
      console.log("Data keys count:", Object.keys(data).length);
      console.log("Sample data:", Object.entries(data).slice(0, 5));
    }
  } catch (e) {
    console.error("Fallback test failed:", e);
  }
}
testFallback();
