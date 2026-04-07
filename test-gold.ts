
async function testGold() {
  const url = "https://api.gold-api.com/price/WTI";
  try {
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      console.log("WTI price:", data.price);
    } else {
      console.log("WTI failed:", res.status);
    }
  } catch (err: any) {
    console.error("WTI fetch failed:", err.message);
  }
}
testGold();
