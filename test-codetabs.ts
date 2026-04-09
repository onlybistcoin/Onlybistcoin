
async function testCodetabsProxy() {
  const targetUrl = `https://finans.truncgil.com/v3/today.json`;
  const proxyUrl = `https://api.codetabs.com/v1/proxy?url=${encodeURIComponent(targetUrl)}`;
  
  try {
    const res = await fetch(proxyUrl);
    console.log("Codetabs Proxy Status:", res.status);
    if (res.ok) {
      const data = await res.json();
      console.log("Data keys count:", Object.keys(data).length);
    }
  } catch (e) {
    console.error("Codetabs Proxy test failed:", e);
  }
}
testCodetabsProxy();
