import "@shopify/shopify-api/adapters/node";
import { shopifyApi, LATEST_API_VERSION } from "@shopify/shopify-api";
import { ShopifyConfig } from "../types/shopify";

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
      apiKey: "dummy",
      apiSecretKey: "dummy",
      scopes: ["read_products", "write_products"],
      hostName: storeDomain,
      apiVersion: LATEST_API_VERSION,
      isEmbeddedApp: false,
    });
  }

  async getProducts(first: number = 50, after?: string): Promise<any> {
    try {
      const session = {
        accessToken: this.config.accessToken,
        shop: `${this.config.storeName}.myshopify.com`,
      };

      const client = new this.shopify.clients.Graphql({ session });

      const queryString = `{
        products(first: ${first}${after ? `, after: "${after}"` : ""}) {
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
      if (
        response.errors &&
        response.errors.graphQLErrors &&
        response.errors.graphQLErrors.length > 0
      ) {
        console.error("GraphQL Errors:");
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
            console.error(
              `    Extensions: ${JSON.stringify(error.extensions)}`
            );
          }
        });
      }

      return response;
    } catch (error: any) {
      console.error("Error fetching products:", error);

      // Handle the specific error structure you showed
      if (error.body && error.body.errors) {
        console.error(
          "Network Status Code:",
          error.body.errors.networkStatusCode
        );
        console.error("Error Message:", error.body.errors.message);

        if (
          error.body.errors.graphQLErrors &&
          error.body.errors.graphQLErrors.length > 0
        ) {
          console.error("GraphQL Errors:");
          error.body.errors.graphQLErrors.forEach(
            (graphQLError: any, index: number) => {
              console.error(`  Error ${index + 1}:`);
              console.error(`    Message: ${graphQLError.message}`);
              if (graphQLError.locations) {
                console.error(
                  `    Locations: ${JSON.stringify(graphQLError.locations)}`
                );
              }
              if (graphQLError.path) {
                console.error(`    Path: ${JSON.stringify(graphQLError.path)}`);
              }
              if (graphQLError.extensions) {
                console.error(
                  `    Extensions: ${JSON.stringify(graphQLError.extensions)}`
                );
              }
            }
          );
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
          console.error("No response received from getProducts");
          break;
        }

        // Check for GraphQL errors in the response
        if (
          response.errors &&
          response.errors.graphQLErrors &&
          response.errors.graphQLErrors.length > 0
        ) {
          console.error("GraphQL Errors in getAllProducts:");
          response.errors.graphQLErrors.forEach((error: any, index: number) => {
            console.error(`  Error ${index + 1}:`);
            console.error(`    Message: ${error.message}`);
            if (error.locations) {
              console.error(
                `    Locations: ${JSON.stringify(error.locations)}`
              );
            }
            if (error.path) {
              console.error(`    Path: ${JSON.stringify(error.path)}`);
            }
            if (error.extensions) {
              console.error(
                `    Extensions: ${JSON.stringify(error.extensions)}`
              );
            }
          });
          break;
        }

        const productsData = response.data.products;

        const products = productsData.edges.map((edge: any) => {
          const node = edge.node;
          return {
            ...node,
            media:
              node.media?.edges?.map((mediaEdge: any) => mediaEdge.node) || [],
            variants:
              node.variants?.edges?.map((variantEdge: any) => {
                const variant = variantEdge.node;
                return {
                  ...variant,
                  inventoryItem: variant.inventoryItem
                    ? {
                        ...variant.inventoryItem,
                        inventoryLevels:
                          variant.inventoryItem.inventoryLevels?.edges?.map(
                            (levelEdge: any) => levelEdge.node
                          ) || [],
                      }
                    : undefined,
                  selectedOptions: variant.selectedOptions || [],
                };
              }) || [],
            options: node.options || [],
            metafields:
              node.metafields?.edges?.map(
                (metafieldEdge: any) => metafieldEdge.node
              ) || [],
          };
        });

        allProducts.push(...products);

        hasNextPage = productsData.pageInfo.hasNextPage;
        cursor = productsData.pageInfo.endCursor;
      } catch (error: any) {
        console.error("Error in getAllProducts iteration:", error);

        // Handle the specific error structure
        if (error.body && error.body.errors) {
          console.error(
            "Network Status Code:",
            error.body.errors.networkStatusCode
          );
          console.error("Error Message:", error.body.errors.message);

          if (
            error.body.errors.graphQLErrors &&
            error.body.errors.graphQLErrors.length > 0
          ) {
            console.error("GraphQL Errors:");
            error.body.errors.graphQLErrors.forEach(
              (graphQLError: any, index: number) => {
                console.error(`  Error ${index + 1}:`);
                console.error(`    Message: ${graphQLError.message}`);
                if (graphQLError.locations) {
                  console.error(
                    `    Locations: ${JSON.stringify(graphQLError.locations)}`
                  );
                }
                if (graphQLError.path) {
                  console.error(
                    `    Path: ${JSON.stringify(graphQLError.path)}`
                  );
                }
                if (graphQLError.extensions) {
                  console.error(
                    `    Extensions: ${JSON.stringify(graphQLError.extensions)}`
                  );
                }
              }
            );
          }
        }
        break;
      }
    }

    return allProducts;
  }

  // Create a product with its default variant, all metadata, images uploaded to a staged upload and Vimeo video added from original source
  // Includes inventory quantities for the UK location
  // This is a test function to illustrate the process and GraphQL queries and should be adapted to multiple media, actual inventory location ids, better error handling etc.
  
  async createProduct(productData: any): Promise<any> {
    try {
      const session = {
        accessToken: this.config.accessToken,
        shop: `${this.config.storeName}.myshopify.com`,
      };

      const client = new this.shopify.clients.Graphql({ session });

      // Creates a signed URL for uploading the image to Shopify's staged upload GCP location
      // The filename is not the file you are uploading but rather the filename which will be used to upload the data to the GCP location

      const imageInput = {
        filename: "image.jpg",
        mimeType: "image/jpeg",
        resource: "IMAGE",
        httpMethod: "PUT",
      };

      const imageMutation = `
      mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
        stagedUploadsCreate(input: $input) {
          stagedTargets {
            url
            resourceUrl
            parameters {
              name
              value
            }
          }
          userErrors {
            field
            message
          }
        }
      }`;

      const imageVariables = {
        input: [imageInput],
      };
      const imageResponse = await client.request(imageMutation, {
        variables: imageVariables,
      });

      if (
        imageResponse.data.stagedUploadsCreate.userErrors &&
        imageResponse.data.stagedUploadsCreate.userErrors.length > 0
      ) {
        console.error(
          "Staged upload errors:",
          imageResponse.data.stagedUploadsCreate.userErrors
        );
        throw new Error("Failed to create staged upload");
      }

      // Uploads the image to the signed URL GCP location
      // The file path here  is the path to the file you are uploading
      await this.uploadFileToStagedUpload("image.jpg", imageResponse);

      const imageUrls =
        imageResponse.data.stagedUploadsCreate.stagedTargets.map(
          (target: any) => target.resourceUrl
        );
      const mediaFiles = imageUrls.map((url: string) => ({
        contentType: "IMAGE",
        originalSource: url,
      }));

      // Adds a video as a Vimeo-hosted video. No need to upload the video, just use the original source URL
      mediaFiles.push({
        contentType: "EXTERNAL_VIDEO",
        originalSource:
          "https://player.vimeo.com/video/1093648744?autoplay=1&byline=0&controls=1&loop=1&playsinline=1&title=0",
      });

      const input = {
        title: productData.title,
        descriptionHtml: productData.description,
        files: mediaFiles,
        productOptions: [
          {
            name: "Title",
            position: 1,
            values: [
              {
                name: "Default Title",
              },
            ],
          },
        ],
        variants: [
          {
            // Use "Title" and "Default Title" **exactly** to ensure the variant is created as the default variant in Shopify
            optionValues: [
              {
                optionName: "Title",
                name: "Default Title",
              },
            ],
            price: productData.price,
            taxable: false,

            // SKU is the same as the minkeeper_number metafield
            sku: productData.metafields.find(
              (metafield: any) => metafield.key === "minkeeper_number"
            )?.value,
            inventoryItem: {
              tracked: true,
              measurement: {
                weight: {
                  value: productData.weight,
                  unit: "GRAMS",
                },
              },
            },
            inventoryQuantities: [
              {
                // This is the UK stock in the **test** store. 
                // For the production import you will need to the **live** store location ids for UK, US and Munich
                locationId: "gid://shopify/Location/74448765091",

                // For initial imports we use "available" inventory.
                // When synchronising inventory between Shopify and MinKeeper, if products are sold, reserved or in transit in MinKeeper,
                // other inventory quantity names must be used to update inventory.
                // See https://shopify.dev/docs/apps/build/orders-fulfillment/inventory-management-apps#inventory-states for more details
                name: "available",
                quantity: 1,
              },
            ],
          },
        ],
        ...(productData.metafields &&
          productData.metafields.length > 0 && {
            metafields: productData.metafields.map((metafield: any) => ({
              namespace: metafield.namespace,
              key: metafield.key,
              value: metafield.value,
              type: metafield.type,
            })),
          }),
      };

      const variables = {
        productSet: input,
      };

      const mutation = `
        mutation createProduct($productSet: ProductSetInput!) {
          productSet(input: $productSet) {
              product {
                id
                title
                variants(first: 1) {
                  nodes {
                    price
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
      console.error("Error creating product with productSet:", error);
      throw error;
    }
  }

  async publishProduct(productId: string, publications: any[]): Promise<any> {
    try {
      const session = {
        accessToken: this.config.accessToken,
        shop: `${this.config.storeName}.myshopify.com`,
      };

      const client = new this.shopify.clients.Graphql({ session });

      const mutation = `
        mutation publishProduct($id: ID!, $input: [PublicationInput!]!) {
          publishablePublish(id: $id, input: $input) {
            publishable {
              availablePublicationsCount {
                count
              }
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const variables = {
        id: productId,
        input: publications,
      };

      const response = await client.request(mutation, { variables });
      return response;
    } catch (error: any) {
      console.error("Error publishing product:", error);
      throw error;
    }
}

    async uploadFileToStagedUpload(
    filePath: string,
    stagedUploadResponse: any
  ): Promise<void> {
    try {
      const fs = require('fs');
      const path = require('path');
      
      const fileBuffer = fs.readFileSync(filePath);
      const fileName = path.basename(filePath);
      
      const stagedTarget = stagedUploadResponse.data.stagedUploadsCreate.stagedTargets[0];
    
      if (!stagedTarget) {
        throw new Error("No staged upload target found in response");
      }
      
      const aclParam = stagedTarget.parameters.find((param: any) => param.name === 'acl');
      const contentTypeParam = stagedTarget.parameters.find((param: any) => param.name === 'content_type');

      const uploadUrl = stagedTarget.url;
    
      const response = await fetch(uploadUrl, {
        // PUT is used to upload smaller files to the GCP location.
        // You MUST use PUT here, otherwise the signature on the presigned URL will not match
        method: 'PUT',
        // Only these two headers are required, everything else is included in the presigned URL
        headers: {
          'content_type': contentTypeParam?.value,
          'acl': aclParam
        },
        body: fileBuffer
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed with status ${response.status}: ${errorText}`);
      }
      
      console.log(`File ${fileName} uploaded successfully`);
      
    } catch (error) {
      console.error("Error uploading file to staged upload:", error);
      throw error;
    }
  }
}
