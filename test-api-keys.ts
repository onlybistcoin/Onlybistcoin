async function test() {
  try {
    const res = await fetch("http://127.0.0.1:3000/api/prices");
    const data = await res.json();
    const bistKeys = Object.keys(data).filter(k => !k.includes("USDT") && !k.includes("="));
    console.log("BIST keys:", bistKeys);
  } catch (e) {
    console.error(e);
  }
}
test();
