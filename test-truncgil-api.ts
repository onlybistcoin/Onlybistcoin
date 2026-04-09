async function testTruncgil() {
  try {
    const res = await fetch('https://finans.truncgil.com/v3/today.json');
    if (res.ok) {
      const data = await res.json();
      console.log("Keys:", Object.keys(data).slice(0, 20));
      console.log("Sample (BIST 100):", data["BIST 100"]);
    } else {
      console.log("Failed:", res.status);
    }
  } catch (e) {
    console.error("Error:", e);
  }
}
testTruncgil();
