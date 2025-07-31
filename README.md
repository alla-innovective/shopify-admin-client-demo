# Shopify Admin API Client

A Node.js TypeScript application that connects to the Shopify Admin API using the latest GraphQL SDK. This client provides easy access to Shopify store data, particularly focused on product information.

## Features

- 🔐 Secure authentication with Shopify Admin API
- 📦 Fetch all products with variants and pricing
- 🎯 TypeScript support with full type definitions
- 📊 Pagination support for large product catalogs
- 🚀 Command-line script for quick product listing
- ⚡ Built with the latest Shopify GraphQL SDK

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Shopify store with Admin API access
- Admin API access token

## Installation

1. Clone or download this repository
2. Install dependencies:

```bash
yarn install
```

3. Build the TypeScript code:

```bash
yarn build
```

## Setup

To use this client, you'll need your Shopify Admin API credentials:

1. **Store Name**: Your Shopify store name (without .myshopify.com)
2. **Access Token**: Your Admin API access token (starts with `shpat_`)

You can get these credentials by:
1. Going to your Shopify admin panel
2. Navigating to **Apps** > **Develop apps**
3. Creating a new app or selecting an existing one
4. Going to **API credentials**
5. Generating an **Admin API access token**
6. Noting your store name (the part before .myshopify.com)

## Usage

### Using the Products Script

The easiest way to get product information is using the provided script:

```bash
# Using command line arguments
yarn products your-store-name shpat_xxxxxxxxxxxxxxxxxxxx
```

### Programmatic Usage

```typescript
import { ShopifyClient } from './src/client/shopifyClient';

const client = new ShopifyClient({
  storeName: 'your-store-name',
  accessToken: 'shpat_xxxxxxxxxxxxxxxxxxxx'
});

const products = await client.getAllProducts();

const response = await client.getProducts(50, 'cursor');
```

## API Reference

### ShopifyClient

The main client class for interacting with Shopify Admin API.

#### Constructor

```typescript
new ShopifyClient(config: ShopifyConfig)
```

**Parameters:**
- `config.storeName`: Your Shopify store name (without .myshopify.com)
- `config.accessToken`: Your Admin API access token
- `config.apiVersion`: API version (optional, defaults to '2025-10')

#### Methods

##### `getProducts(first: number, after?: string)`

Fetches a paginated list of products.

**Parameters:**
- `first`: Number of products to fetch (max 250)
- `after`: Cursor for pagination

**Returns:** Promise with products data and pagination info

##### `getAllProducts()`

Fetches all products from the store using automatic pagination.

**Returns:** Promise with array of all products

## Output Format

The products script outputs formatted product information:

```
============================================================
Product Name (Variant)                    ACTIVE
Product Name 2                            DRAFT
Product Name 3 (Large)                    ACTIVE
============================================================
Total products: 25
Total variants: 30
```

## Error Handling

The application includes comprehensive error handling:

- Invalid credentials
- Network connectivity issues
- API rate limiting
- Malformed responses

## Development

### Scripts

- `yarn build`: Compile TypeScript to JavaScript
- `yarn products`: Run the products listing script

### Project Structure

```
src/
├── client/
│   └── shopifyClient.ts    # Main API client
├── scripts/
│   └── getProducts.ts      # Command-line script
└── types/
    └── shopify.ts          # TypeScript definitions
```

## Troubleshooting

### Common Issues

1. **"Invalid access token"**
   - Ensure your access token starts with `shpat_`
   - Verify the token has Admin API permissions

2. **"Store not found"**
   - Check your store name (should not include .myshopify.com)
   - Verify the store exists and is accessible

3. **"Rate limit exceeded"**
   - The client automatically handles pagination
   - For large stores, consider implementing delays between requests

### Debug Mode

To enable debug logging, set the `DEBUG` environment variable:

```bash
DEBUG=* npm run products your-store-name your-token
```

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For issues related to:
- Shopify API: Check the [Shopify Admin API documentation](https://shopify.dev/api/admin)
- This client: Open an issue in this repository 