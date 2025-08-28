import { ShopifyClient } from '../client/shopifyClient';

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('Usage: yarn test-auth <store-name> <access-token>');
    console.error('Example: yarn test-auth my-store shpat_xxxxxxxxxxxxxxxxxxxx');
    process.exit(1);
  }

  const [storeName, accessToken] = args;

  try {
    console.log(`🔍 Testing connection to Shopify store: ${storeName}`);
    
    const client = new ShopifyClient({
      storeName,
      accessToken: accessToken
    });

    // Test with a simple read operation first
    console.log('📖 Testing read permissions...');
    const products = await client.getAllProducts();
    
    console.log(`✅ Successfully connected! Found ${products.length} products`);
    
    if (products.length > 0) {
      console.log('Sample product:', products[0].title);
    }

  } catch (error) {
    console.error('❌ Authentication/Connection Error:', error instanceof Error ? error.message : error);
    console.log('\n💡 Troubleshooting tips:');
    console.log('1. Make sure your access token is valid and has the right permissions');
    console.log('2. Ensure the store name is correct (without .myshopify.com)');
    console.log('3. Check that your access token has write_products scope for creating products');
    process.exit(1);
  }
}

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

if (require.main === module) {
  main();
} 