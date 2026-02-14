const apiKey = process.env.LEMONSQUEEZY_API_KEY;

async function fetchLemonData() {
  if (!apiKey) {
    console.error('No API Key found');
    return;
  }

  try {
      // 1. Get Store
      const userRes = await fetch('https://api.lemonsqueezy.com/v1/users/me', {
        headers: { Authorization: `Bearer ${apiKey}` }
      });
      const userData = await userRes.json();
      
      // List stores directly
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
      
      // Flatten variants from "included" array
      const variants = productsData.included.filter((item) => item.type === 'variants');
      
      const monthly = variants.find((v) => v.attributes.name.toLowerCase().includes('monthly') || v.attributes.interval === 'month');
      const yearly = variants.find((v) => v.attributes.name.toLowerCase().includes('yearly') || v.attributes.interval === 'year');
      
      if (monthly) console.log(`LEMONSQUEEZY_VARIANT_ID_MONTHLY=${monthly.id}`);
      if (yearly) console.log(`LEMONSQUEEZY_VARIANT_ID_YEARLY=${yearly.id}`);
      
      const randomSecret = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      console.log(`LEMONSQUEEZY_WEBHOOK_SECRET=${randomSecret}`);

  } catch (error) {
      console.error('Error fetching data:', error);
  }
}

fetchLemonData();
