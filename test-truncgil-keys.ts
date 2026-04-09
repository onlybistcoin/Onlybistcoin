async function testTruncgil() {
  try {
    const res = await fetch('https://finans.truncgil.com/v3/today.json');
    if (res.ok) {
      const data = await res.json();
      const keys = Object.keys(data);
      console.log("Total keys:", keys.length);
      const bistKeys = keys.filter(k => k.includes("BIST") || k.includes("XU100"));
      console.log("BIST related keys:", bistKeys);
    }
  } catch (e) {}
}
testTruncgil();
