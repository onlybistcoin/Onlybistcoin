async function test() {
  try {
    const res = await fetch("http://localhost:3000/api/prices");
    const data = await res.json();
    console.log("Total symbols:", Object.keys(data).length);
    console.log("THYAO:", data["THYAO"]);
    console.log("GAG=X:", data["GAG=X"]);
    console.log("SI=F:", data["SI=F"]);
    console.log("TRY=X:", data["TRY=X"]);
  } catch (e) {
    console.error(e);
  }
}
test();
