
async function testLocalApi() {
  try {
    const res = await fetch('http://localhost:3000/api/health');
    console.log("Health Status:", res.status);
    const data = await res.json();
    console.log("Health Data:", data);

    const res2 = await fetch('http://localhost:3000/api/prices');
    console.log("Prices Status:", res2.status);
    const data2 = await res2.json();
    console.log("Prices Count:", Object.keys(data2).length);
  } catch (e) {
    console.error("Test failed:", e);
  }
}
testLocalApi();
