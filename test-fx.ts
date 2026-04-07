
async function testFX() {
  const url = "https://api.exchangerate-api.com/v4/latest/USD";
  try {
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      console.log("TRY rate:", data.rates.TRY);
      console.log("XAU rate:", data.rates.XAU);
      console.log("XAG rate:", data.rates.XAG);
    } else {
      console.log("FX failed:", res.status);
    }
  } catch (err: any) {
    console.error("FX fetch failed:", err.message);
  }
}
testFX();
