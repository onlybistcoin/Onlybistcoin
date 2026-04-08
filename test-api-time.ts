async function test() {
  console.time("fetch");
  try {
    const res = await fetch("http://127.0.0.1:3000/api/prices");
    console.timeEnd("fetch");
    console.log("Status:", res.status);
  } catch (e) {
    console.error(e);
  }
}
test();
