async function test() {
  try {
    const res = await fetch("https://finans.truncgil.com/v3/today.json");
    console.log("Status:", res.status);
    const data = await res.json();
    console.log(Object.keys(data).slice(0, 10));
    console.log(data["THYAO"]);
  } catch (e) {
    console.error(e);
  }
}
test();
