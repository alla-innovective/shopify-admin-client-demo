export interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  status: string;
  description?: string;
  productType?: string;
  vendor?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  media?: Media[];
  variants: ProductVariant[];
  options?: ProductOption[];
  metafields?: Metafield[];
}

export interface Metafield {
  id: string;
  namespace: string;
  key: string;
  value: string;
  type: string;
}

export interface ProductImage {
  id: string;
  url: string;
  altText?: string;
  width?: number;
  height?: number;
}

export interface Media {
  id: string;
  mediaContentType: string;
  image?: {
    id: string;
    url: string;
    altText?: string;
  };
  sources?: {
    url: string;
    mimeType: string;
    format: string;
  }[];
}

export interface InventoryLevel {
  id: string;
  quantities: {
    name: string;
    quantity: number;
  }[];
  location: {
    id: string;
    name: string;
  };
}

export interface InventoryItem {
  id: string;
  tracked: boolean;
  inventoryLevels?: InventoryLevel[];
}

export interface SelectedOption {
  name: string;
  value: string;
}

export interface ProductVariant {
  id: string;
  title: string;
  sku?: string;
  price: string;
  compareAtPrice?: string;
  inventoryQuantity: number;
  inventoryItem?: InventoryItem;
  selectedOptions?: SelectedOption[];
}

export interface ProductOption {
  id: string;
  name: string;
  values: string[];
}

export interface Collection {
  id: string;
  title: string;
  handle: string;
}

export interface ProductsResponse {
  products: {
    edges: Array<{
      node: ShopifyProduct;
    }>;
    pageInfo: {
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      startCursor?: string;
      endCursor?: string;
    };
  };
}

export interface ShopifyConfig {
  storeName: string;
  accessToken: string;
  apiVersion?: string;
} 