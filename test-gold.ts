async function test() {
  try {
    const res = await fetch("https://api.gold-api.com/price/XAU");
    console.log("Status:", res.status);
    const data = await res.json();
    console.log(data);
  } catch (e) {
    console.error(e);
  }
}
test();
