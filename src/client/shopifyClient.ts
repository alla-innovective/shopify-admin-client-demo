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
      scopes: ['read_products', 'write_products'],
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
              description
              productType
              vendor
              tags
              createdAt
              updatedAt
              media(first: 10) {
                edges {
                  node {
                    id
                    mediaContentType
                    ... on MediaImage {
                      id
                      image {
                        id
                        url
                        altText
                      }
                    }
                    ... on Video {
                      id
                      sources {
                        url
                        mimeType
                        format
                      }
                    }
                  }
                }
              }
              variants(first: 20) {
                edges {
                  node {
                    id
                    title
                    sku
                    price
                    compareAtPrice
                    inventoryQuantity
                    inventoryItem {
                      id
                      tracked
                      inventoryLevels(first: 5) {
                        edges {
                          node {
                            id
                            quantities(names: ["available"]) {
                              name
                              quantity
                            }
                            location {
                              id
                              name
                            }
                          }
                        }
                      }
                    }
                    selectedOptions {
                      name
                      value
                    }
                  }
                }
              }
              options {
                id
                name
                values
              }
              metafields(first: 20) {
                edges {
                  node {
                    id
                    namespace
                    key
                    value
                    type
                  }
                }
              }
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
      
      // Check for GraphQL errors in the response
      if (response.errors && response.errors.graphQLErrors && response.errors.graphQLErrors.length > 0) {
        console.error('GraphQL Errors:');
        response.errors.graphQLErrors.forEach((error: any, index: number) => {
          console.error(`  Error ${index + 1}:`);
          console.error(`    Message: ${error.message}`);
          if (error.locations) {
            console.error(`    Locations: ${JSON.stringify(error.locations)}`);
          }
          if (error.path) {
            console.error(`    Path: ${JSON.stringify(error.path)}`);
          }
          if (error.extensions) {
            console.error(`    Extensions: ${JSON.stringify(error.extensions)}`);
          }
        });
      }
      
      return response;
    } catch (error: any) {
      console.error('Error fetching products:', error);
      
      // Handle the specific error structure you showed
      if (error.body && error.body.errors) {
        console.error('Network Status Code:', error.body.errors.networkStatusCode);
        console.error('Error Message:', error.body.errors.message);
        
        if (error.body.errors.graphQLErrors && error.body.errors.graphQLErrors.length > 0) {
          console.error('GraphQL Errors:');
          error.body.errors.graphQLErrors.forEach((graphQLError: any, index: number) => {
            console.error(`  Error ${index + 1}:`);
            console.error(`    Message: ${graphQLError.message}`);
            if (graphQLError.locations) {
              console.error(`    Locations: ${JSON.stringify(graphQLError.locations)}`);
            }
            if (graphQLError.path) {
              console.error(`    Path: ${JSON.stringify(graphQLError.path)}`);
            }
            if (graphQLError.extensions) {
              console.error(`    Extensions: ${JSON.stringify(graphQLError.extensions)}`);
            }
          });
        }
      }
    }
  }

  async getAllProducts(): Promise<any[]> {
    const allProducts: any[] = [];
    let hasNextPage = true;
    let cursor: string | undefined;

    while (hasNextPage) {
      try {
        const response = await this.getProducts(50, cursor);
        
        if (!response) {
          console.error('No response received from getProducts');
          break;
        }
        
        // Check for GraphQL errors in the response
        if (response.errors && response.errors.graphQLErrors && response.errors.graphQLErrors.length > 0) {
          console.error('GraphQL Errors in getAllProducts:');
          response.errors.graphQLErrors.forEach((error: any, index: number) => {
            console.error(`  Error ${index + 1}:`);
            console.error(`    Message: ${error.message}`);
            if (error.locations) {
              console.error(`    Locations: ${JSON.stringify(error.locations)}`);
            }
            if (error.path) {
              console.error(`    Path: ${JSON.stringify(error.path)}`);
            }
            if (error.extensions) {
              console.error(`    Extensions: ${JSON.stringify(error.extensions)}`);
            }
          });
          break;
        }
        
        const productsData = response.data.products;

        const products = productsData.edges.map((edge: any) => {
          const node = edge.node;
          return {
            ...node,
            media: node.media?.edges?.map((mediaEdge: any) => mediaEdge.node) || [],
            variants: node.variants?.edges?.map((variantEdge: any) => {
              const variant = variantEdge.node;
              return {
                ...variant,
                inventoryItem: variant.inventoryItem ? {
                  ...variant.inventoryItem,
                  inventoryLevels: variant.inventoryItem.inventoryLevels?.edges?.map((levelEdge: any) => levelEdge.node) || []
                } : undefined,
                selectedOptions: variant.selectedOptions || []
              };
            }) || [],
            options: node.options || [],
            metafields: node.metafields?.edges?.map((metafieldEdge: any) => metafieldEdge.node) || []
          };
        });

        allProducts.push(...products);

        hasNextPage = productsData.pageInfo.hasNextPage;
        cursor = productsData.pageInfo.endCursor;
      } catch (error: any) {
        console.error('Error in getAllProducts iteration:', error);
        
        // Handle the specific error structure
        if (error.body && error.body.errors) {
          console.error('Network Status Code:', error.body.errors.networkStatusCode);
          console.error('Error Message:', error.body.errors.message);
          
          if (error.body.errors.graphQLErrors && error.body.errors.graphQLErrors.length > 0) {
            console.error('GraphQL Errors:');
            error.body.errors.graphQLErrors.forEach((graphQLError: any, index: number) => {
              console.error(`  Error ${index + 1}:`);
              console.error(`    Message: ${graphQLError.message}`);
              if (graphQLError.locations) {
                console.error(`    Locations: ${JSON.stringify(graphQLError.locations)}`);
              }
              if (graphQLError.path) {
                console.error(`    Path: ${JSON.stringify(graphQLError.path)}`);
              }
              if (graphQLError.extensions) {
                console.error(`    Extensions: ${JSON.stringify(graphQLError.extensions)}`);
              }
            });
          }
        }
        break;
      }
    }

    return allProducts;
  }

  async createProduct(productData: any): Promise<any> {
    try {
      const session = {
        accessToken: this.config.accessToken,
        shop: `${this.config.storeName}.myshopify.com`
      };
      
      const client = new this.shopify.clients.Graphql({ session });
      
      // Prepare variables for the mutation
      const variables = {
        input: {
          title: productData.title,
          productType: productData.productType || 'Default',
          vendor: productData.vendor || 'Default',
          status: productData.status,
          ...(productData.metafields && productData.metafields.length > 0 && {
            metafields: productData.metafields.map((metafield: any) => ({
              namespace: metafield.namespace,
              key: metafield.key,
              value: metafield.value,
              type: metafield.type
            }))
          })
        }
      };

      const mutation = `
        mutation productCreate($input: ProductCreateInput!) {
          productCreate(product: $input) {
            product {
              id
              title
              productType
              vendor
              status
              variants(first: 1) {
                nodes {
                  id
                  price
                  inventoryItem {
                    id
                    tracked
                  }
                }
              }
            }
            userErrors {
              field
              message
            }
          }
        }
      `;
      
      const response = await client.request(mutation, { variables });
      return response;
    } catch (error: any) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  async addExternalVideoToProduct(productId: string, videoUrl: string, altText?: string): Promise<any> {
    try {
      const session = {
        accessToken: this.config.accessToken,
        shop: `${this.config.storeName}.myshopify.com`
      };
      
      const client = new this.shopify.clients.Graphql({ session });
      
      const mutation = `
        mutation {
          productCreateMedia(
            media: [{
              mediaContentType: EXTERNAL_VIDEO,
              originalSource: "${videoUrl}",
              alt: "${altText || "Product video"}"
            }],
            productId: "${productId}"
          ) {
            media {
              id
              mediaContentType
              ... on ExternalVideo {
                id
                embedUrl
                host
              }
            }
            mediaUserErrors {
              field
              message
            }
          }
        }
      `;
      
      const response = await client.query({
        data: mutation
      });
      
      // Check for GraphQL errors
      if (response.errors && response.errors.graphQLErrors && response.errors.graphQLErrors.length > 0) {
        console.error('GraphQL Errors:');
        response.errors.graphQLErrors.forEach((error: any, index: number) => {
          console.error(`  Error ${index + 1}:`);
          console.error(`    Message: ${error.message}`);
          if (error.locations) {
            console.error(`    Locations: ${JSON.stringify(error.locations)}`);
          }
          if (error.path) {
            console.error(`    Path: ${JSON.stringify(error.path)}`);
          }
          if (error.extensions) {
            console.error(`    Extensions: ${JSON.stringify(error.extensions)}`);
          }
        });
      }
      
      return response;
    } catch (error: any) {
      console.error('Error adding external video to product:', error);
      
      // Handle the specific error structure
      if (error.body && error.body.errors) {
        console.error('Network Status Code:', error.body.errors.networkStatusCode);
        console.error('Error Message:', error.body.errors.message);
        
        if (error.body.errors.graphQLErrors && error.body.errors.graphQLErrors.length > 0) {
          console.error('GraphQL Errors:');
          error.body.errors.graphQLErrors.forEach((graphQLError: any, index: number) => {
            console.error(`  Error ${index + 1}:`);
            console.error(`    Message: ${graphQLError.message}`);
            if (graphQLError.locations) {
              console.error(`    Locations: ${JSON.stringify(graphQLError.locations)}`);
            }
            if (graphQLError.path) {
              console.error(`    Path: ${JSON.stringify(graphQLError.path)}`);
            }
            if (graphQLError.extensions) {
              console.error(`    Extensions: ${JSON.stringify(graphQLError.extensions)}`);
            }
          });
        }
      }
      throw error;
    }
  }

} 