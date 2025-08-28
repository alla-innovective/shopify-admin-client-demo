import { ShopifyClient } from '../client/shopifyClient';

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  
  if (args.length < 4) {
    console.error('Usage: yarn add-video <store-name> <access-token> <product-id> <video-url>');
    console.error('Example: yarn add-video my-store shpat_xxxxxxxxxxxxxxxxxxxx gid://shopify/Product/1234567890 https://vimeo.com/1099782710');
    process.exit(1);
  }

  const [storeName, accessToken, productId, videoUrl] = args;

  try {
    console.log(`🔍 Connecting to Shopify store: ${storeName}`);
    console.log(`📹 Adding video to product: ${productId}`);
    console.log(`🎬 Video URL: ${videoUrl}`);
    
    const client = new ShopifyClient({
      storeName,
      accessToken: accessToken
    });

    const result = await client.addExternalVideoToProduct(productId, videoUrl, "Product demonstration video");

    if (result.data?.productCreateMedia?.media) {
      const media = result.data.productCreateMedia.media[0];
      console.log('✅ Video added successfully!');
      console.log(`   Media ID: ${media.id}`);
      console.log(`   Media Type: ${media.mediaContentType}`);
      
      if (media.embedUrl) {
        console.log(`   Embed URL: ${media.embedUrl}`);
        console.log(`   Host: ${media.host}`);
      }
    } else if (result.data?.productCreateMedia?.mediaUserErrors) {
      console.error('❌ Errors adding video:');
      result.data.productCreateMedia.mediaUserErrors.forEach((error: any) => {
        console.error(`   Field: ${error.field}, Message: ${error.message}`);
      });
    } else {
      console.log('❌ Unexpected response format');
      console.log(JSON.stringify(result, null, 2));
    }

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
