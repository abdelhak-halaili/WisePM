const axios = require('axios');
require('dotenv').config({ path: '.env' });

const apiKey = process.env.LEMONSQUEEZY_API_KEY;
const storeId = process.env.LEMONSQUEEZY_STORE_ID;

if (!apiKey) {
    console.error('No LEMONSQUEEZY_API_KEY found in .env');
    process.exit(1);
}

async function checkLemon() {
    try {
        console.log(`Checking Store ID: ${storeId}`);
        
        // List Variants
        console.log('\n--- Fetching Variants ---');
        const response = await axios.get('https://api.lemonsqueezy.com/v1/variants', {
            headers: {
                'Accept': 'application/vnd.api+json',
                'Content-Type': 'application/vnd.api+json',
                'Authorization': `Bearer ${apiKey}`
            }
        });

        const variants = response.data.data;
        variants.forEach(v => {
            console.log(`ID: ${v.id} | Name: ${v.attributes.name} | Product ID: ${v.attributes.product_id}`);
        });

        if (variants.length === 0) {
            console.log('No variants found.');
        }

    } catch (error) {
        if (error.response) {
            console.error('API Error:', error.response.status, error.response.statusText);
            console.error(JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error:', error.message);
        }
    }
}

checkLemon();
