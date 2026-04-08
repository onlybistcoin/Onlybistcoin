async function test() {
  try {
    const res = await fetch("https://bigpara.hurriyet.com.tr/api/v1/borsa/hisseyuzeysel");
    console.log("Status:", res.status);
    const data = await res.json();
    console.log(data.data.slice(0, 2));
  } catch (e) {
    console.error(e);
  }
}
test();
