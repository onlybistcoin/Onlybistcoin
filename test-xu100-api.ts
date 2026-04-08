async function test() {
  try {
    const res = await fetch("http://127.0.0.1:3000/api/prices");
    const data = await res.json();
    console.log("XU100 exists:", "XU100" in data);
    console.log("XU100 value:", data["XU100"]);
  } catch (e) {
    console.error(e);
  }
}
test();
