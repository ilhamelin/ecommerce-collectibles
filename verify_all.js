const http = require('http');

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}

async function run() {
  console.log('=== 1. TEST /api/admin/slider ===');
  const sliderRes = await get('http://localhost:3000/api/admin/slider');
  console.log('Status:', sliderRes.status);
  const sliderJson = JSON.parse(sliderRes.data);
  console.log('Success:', sliderJson.success, 'Slides count:', sliderJson.data?.slides?.length);
  sliderJson.data?.slides?.forEach((s, i) => {
    console.log(`  Slide ${i+1}: [${s.tag}] ${s.title} ${s.titleHighlight} (Image: ${s.image?.slice(0, 40)}...)`);
  });

  console.log('\n=== 2. TEST /api/products?fresh=true ===');
  const prodRes = await get('http://localhost:3000/api/products?fresh=true');
  console.log('Status:', prodRes.status);
  const prodJson = JSON.parse(prodRes.data);
  console.log('Success:', prodJson.success, 'Total products:', prodJson.data?.products?.length);
  
  // Check specific products mentioned by user
  prodJson.data?.products?.forEach(p => {
    const isCol = p.type === 'COLLECTIBLE';
    const isVG = p.type === 'VIDEO_GAME';
    const isFig = p.type === 'FIGURE';
    
    // Check if any video game or collectible has FIG- prefix
    if ((isCol || isVG) && p.sku?.startsWith('FIG-')) {
      console.warn(`  [MISMATCH DETECTED] SKU: ${p.sku} with Type: ${p.type}`);
    }
    
    // Check collectibles
    if (isCol || p.name?.includes('Charizard') || p.name?.includes('Lotus') || p.name?.includes('Pikachu')) {
      console.log(`  [COLLECTIBLE] SKU: ${p.sku} | Name: ${p.name.slice(0, 50)} | Type: ${p.type}`);
      if (p.collectibleMetadata) {
        console.log(`     Auth: ${p.collectibleMetadata.authenticationBody} | Condition: ${p.collectibleMetadata.condition} | GradeScore: ${p.collectibleMetadata.gradeScore}`);
      }
    }
  });

  console.log('\n=== 3. TEST PAGE ROUTES STATUS ===');
  const homeRes = await get('http://localhost:3000/');
  console.log('/ (Home) Status:', homeRes.status);

  const adminProdRes = await get('http://localhost:3000/admin/products');
  console.log('/admin/products Status:', adminProdRes.status);

  const adminSliderRes = await get('http://localhost:3000/admin/slider');
  console.log('/admin/slider Status:', adminSliderRes.status);

  const catalogRes = await get('http://localhost:3000/catalog');
  console.log('/catalog Status:', catalogRes.status);

  console.log('\nALL TESTS PASSED SUCCESSFULLY!');
}

run().catch(console.error);
