import http from 'http';

http.get('http://localhost:3000/api/yahoo?symbols=KOZAL.IS,ALMAD.IS,KOZAA.IS,IPEKE.IS,KERVT.IS,KORD.IS,PEGYO.IS,THYAO.IS', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Body:', data);
  });
}).on('error', (err) => {
  console.log('Error:', err.message);
});
