async function test() {
  try {
    const res = await fetch("http://127.0.0.1:3000/api/prices");
    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Keys:", Object.keys(data).length);
  } catch (e) {
    console.error(e);
  }
}
test();
