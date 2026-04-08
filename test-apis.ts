async function test() {
  try {
    const goldRes = await fetch("https://api.gold-api.com/price/XAU");
    console.log("Gold OK:", goldRes.ok, goldRes.status);
    if (!goldRes.ok) console.log(await goldRes.text());
    
    const fxRes = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
    console.log("FX OK:", fxRes.ok, fxRes.status);
    if (!fxRes.ok) console.log(await fxRes.text());
  } catch (e) {
    console.error(e);
  }
}
test();
