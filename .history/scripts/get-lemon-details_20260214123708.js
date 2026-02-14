const apiKey = process.env.LEMONSQUEEZY_API_KEY;

async function fetchLemonData() {
  if (!apiKey) {
    console.error('No API Key found');
    return;
  }

  // 1. Get Store
  const userRes = await fetch('https://api.lemonsqueezy.com/v1/users/me', {
    headers: { Authorization: `Bearer ${apiKey}` }
  });
  const userData = await userRes.json();
  const storeId = userData.data.attributes.store_id; // Check structure
  
  // Actually, let's list stores directly
  const storesRes = await fetch('https://api.lemonsqueezy.com/v1/stores', {
      headers: { Authorization: `Bearer ${apiKey}` }
  });
  const storesData = await storesRes.json();
  const store = storesData.data[0];
  
  console.log('--- Lemon Squeezy Config ---');
  console.log(`LEMONSQUEEZY_STORE_ID=${store.id}`);
  
  // 2. Get Products & Variants
  const productsRes = await fetch(`https://api.lemonsqueezy.com/v1/products?filter[store_id]=${store.id}&include=variants`, {
      headers: { Authorization: `Bearer ${apiKey}` }
  });
  const productsData = await productsRes.json();
  
  // Flatten variants
  const variants = productsData.included.filter((item: any) => item.type === 'variants');
  
  const monthly = variants.find((v: any) => v.attributes.name.toLowerCase().includes('monthly') || v.attributes.interval === 'month');
  const yearly = variants.find((v: any) => v.attributes.name.toLowerCase().includes('yearly') || v.attributes.interval === 'year');
  
  if (monthly) console.log(`LEMONSQUEEZY_VARIANT_ID_MONTHLY=${monthly.id}`);
  if (yearly) console.log(`LEMONSQUEEZY_VARIANT_ID_YEARLY=${yearly.id}`);
  
  console.log(`LEMONSQUEEZY_WEBHOOK_SECRET=${Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)}`);
}

fetchLemonData();
