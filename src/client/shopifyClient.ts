import '@shopify/shopify-api/adapters/node';
import { shopifyApi, LATEST_API_VERSION } from '@shopify/shopify-api';
import { ShopifyConfig } from '../types/shopify';

export class ShopifyClient {
  private shopify: any;
  private config: ShopifyConfig;
  private baseUrl!: string;

  constructor(config: ShopifyConfig) {
    this.config = config;
    this.initializeClient();
  }

  private initializeClient(): void {
    const storeDomain = `${this.config.storeName}.myshopify.com`;
    
    this.baseUrl = `https://${storeDomain}/admin/api/${LATEST_API_VERSION}`;
    this.shopify = shopifyApi({
      apiKey: 'dummy',
      apiSecretKey: 'dummy',
      scopes: ['read_products'],
      hostName: storeDomain,
      apiVersion: LATEST_API_VERSION,
      isEmbeddedApp: false
    });
  }

  async getProducts(first: number = 50, after?: string): Promise<any> {
    try {
      const session = {
        accessToken: this.config.accessToken,
        shop: `${this.config.storeName}.myshopify.com`
      };
      
      const client = new this.shopify.clients.Graphql({ session });
      
      const queryString = `{
        products(first: ${first}${after ? `, after: "${after}"` : ''}) {
          edges {
            node {
              id
              title
              handle
              status
              createdAt
              updatedAt
            }
          }
          pageInfo {
            hasNextPage
            hasPreviousPage
            startCursor
            endCursor
          }
        }
      }`;
      
      const response = await client.request(queryString);
      return response;
    } catch (error: any) {
      console.error('Error fetching products:', error);
    }
  }

  async getAllProducts(): Promise<any[]> {
    const allProducts: any[] = [];
    let hasNextPage = true;
    let cursor: string | undefined;

    while (hasNextPage) {
      const response = await this.getProducts(50, cursor);
      
      if (!response) {
        console.error('No response received from getProducts');
        break;
      }
      
      const productsData = response.data.products;

      const products = productsData.edges.map((edge: any) => edge.node);

      allProducts.push(...products);

      hasNextPage = productsData.pageInfo.hasNextPage;
      cursor = productsData.pageInfo.endCursor;
    }

    return allProducts;
}

} 