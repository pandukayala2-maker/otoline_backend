const axios = require('axios');

async function testProductAPI() {
  const vendorId = '6926d9c155a439ba53df28fd';
  const apiUrl = `http://192.168.8.119:4321/v1/product?vendor_id=${vendorId}`;
  
  try {
    console.log('🧪 TESTING PRODUCT API FIX\n');
    console.log(`📍 URL: ${apiUrl}\n`);
    
    const response = await axios.get(apiUrl);
    const data = response.data;
    
    console.log('✅ API Response Status:', response.status);
    console.log('✅ Success:', data.success);
    console.log('📦 Products Found:', data.data?.length || 0);
    
    if (data.data && data.data.length > 0) {
      console.log('\n🎉 SUCCESS! Products returned:\n');
      data.data.forEach((product, idx) => {
        console.log(`${idx + 1}. ${product.name}`);
        console.log(`   Price: ${product.price} KWD`);
        console.log(`   Stock: ${product.stock}`);
        console.log('');
      });
    } else {
      console.log('\n❌ No products returned');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', error.response.data);
    }
  }
}

testProductAPI();
