async function test() {
  try {
    const res = await fetch("https://bigpara.hurriyet.com.tr/api/v1/borsa/hisseyuzeysel/THYAO");
    const data = await res.json();
    console.log(data);
  } catch (e) {
    console.error(e);
  }
}
test();
