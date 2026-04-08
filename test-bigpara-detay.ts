async function test() {
  try {
    const res = await fetch("https://bigpara.hurriyet.com.tr/api/v1/hisse/detay/THYAO");
    console.log("Status:", res.status);
    const data = await res.json();
    console.log(data);
  } catch (e) {
    console.error(e);
  }
}
test();
