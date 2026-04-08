async function test() {
  try {
    const res = await fetch("https://www.isyatirim.com.tr/_layouts/15/IsYatirim.Website/Common/Data.aspx/TumHisse");
    console.log("Status:", res.status);
    const data = await res.json();
    console.log(data);
  } catch (e) {
    console.error(e);
  }
}
test();
