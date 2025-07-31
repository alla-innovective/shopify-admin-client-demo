import { ShopifyClient } from '../client/shopifyClient';
import { ShopifyProduct } from '../types/shopify';

interface ProductOutput {
  id: string;
  title: string;
  handle: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

function extractProductInfo(product: ShopifyProduct): ProductOutput {
  return {
    id: product.id,
    title: product.title,
    handle: product.handle,
    status: product.status,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt
  };
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('Usage: yarn products <store-name> <access-token>');
    console.error('Example: yarn products my-store shpat_xxxxxxxxxxxxxxxxxxxx');
    process.exit(1);
  }

  const [storeName, accessToken] = args;

  try {
    console.log(`🔍 Connecting to Shopify store: ${storeName}`);
    
    const client = new ShopifyClient({
      storeName,
      accessToken: accessToken
    });

    const products = await client.getAllProducts();

    if (products.length === 0) {
      console.log('❌ No products found in the store.');
      return;
    }

    console.log(`\n✅ Found ${products.length} products:\n`);
    console.log('='.repeat(80));

    const allProductInfo: ProductOutput[] = [];
    
    products.forEach(product => {
      const productInfo = extractProductInfo(product);
      allProductInfo.push(productInfo);
    });

    allProductInfo.sort((a, b) => a.title.localeCompare(b.title));

    allProductInfo.forEach(({ title, status }) => {
      console.log(`${title.padEnd(40)} ${status.padEnd(10)}`);
    });

    console.log('='.repeat(80));
    console.log(`Total products: ${products.length}`);

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
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