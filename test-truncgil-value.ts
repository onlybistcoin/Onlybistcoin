
async function testTruncgil() {
  try {
    const res = await fetch("https://finans.truncgil.com/v3/today.json");
    if (res.ok) {
      const data = await res.json();
      console.log("Truncgil Keys:", Object.keys(data).slice(0, 20));
      console.log("BIST 100 Data:", data["BIST 100"] || data["XU100"] || "Not found");
    } else {
      console.log("Truncgil failed:", res.status);
    }
  } catch (e) {
    console.error(e);
  }
}
testTruncgil();
