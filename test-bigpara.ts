async function test() {
  try {
    const res = await fetch("https://bigpara.hurriyet.com.tr/api/v1/hisse/list");
    const data = await res.json();
    console.log(data.data.slice(0, 5));
  } catch (e) {
    console.error(e);
  }
}
test();
