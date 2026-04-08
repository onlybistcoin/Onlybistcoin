async function test() {
  try {
    const res = await fetch("https://finans.truncgil.com/v3/today.json");
    const data = await res.json();
    console.log(Object.keys(data).slice(0, 20));
  } catch (e) {
    console.error(e);
  }
}
test();
