const http = require('http');

http.get('http://localhost:3000/api/products?fresh=true', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      const prods = json.data?.products || [];
      console.log('Total products:', prods.length);
      console.log('Source:', json.data?.source);
      prods.forEach(p => {
        console.log(`[${p.id}] SKU: ${p.sku} | Type: ${p.type} | Name: ${p.name.slice(0, 45)} | Price: ${p.price}`);
        if (p.collectibleMetadata) {
          console.log(`   Collectible: auth=${p.collectibleMetadata.authenticationBody}, grade=${p.collectibleMetadata.grade}, condition=${p.collectibleMetadata.condition}`);
        }
      });
    } catch(e) {
      console.error('Parse error:', e);
    }
  });
}).on('error', err => console.error('Fetch error:', err));
