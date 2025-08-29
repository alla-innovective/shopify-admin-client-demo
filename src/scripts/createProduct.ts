import { ShopifyClient } from "../client/shopifyClient";

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error("Usage: yarn create-product <store-name> <access-token>");
    console.error(
      "Example: yarn create-product my-store shpat_xxxxxxxxxxxxxxxxxxxx"
    );
    process.exit(1);
  }

  const [storeName, accessToken] = args;

  try {
    console.log(`🔍 Connecting to Shopify store: ${storeName}`);

    const client = new ShopifyClient({
      storeName,
      accessToken: accessToken,
    });

    // Metafields data with literal values from the example
    const metafieldsData = [
      {
        namespace: "custom",
        key: "web_number",
        value: "CC45742",
        type: "single_line_text_field",
      },
      {
        namespace: "custom",
        key: "minkeeper_number",
        value: "min_keeper_counterpart_to_CC45742",
        type: "single_line_text_field",
      },
      {
        namespace: "custom",
        key: "repaired_or_restored",
        value: "No recorded repairs",
        type: "single_line_text_field",
      },
      {
        namespace: "custom",
        key: "custom_category_3",
        value: "South America",
        type: "single_line_text_field",
      },
      {
        namespace: "custom",
        key: "custom_category_2",
        value: "Gem Minerals",
        type: "single_line_text_field",
      },
      {
        namespace: "custom",
        key: "custom_category_1",
        value: "Tourmaline",
        type: "single_line_text_field",
      },
      {
        namespace: "custom",
        key: "custom_stand",
        value: "true",
        type: "boolean",
      },
      {
        namespace: "custom",
        key: "box_code",
        value: "12",
        type: "single_line_text_field",
      },
      {
        namespace: "custom",
        key: "locality_continent",
        value: "South America",
        type: "single_line_text_field",
      },
      {
        namespace: "custom",
        key: "locality_region",
        value: "Jequitinhonha Valley, Minas Gerais",
        type: "single_line_text_field",
      },
      {
        namespace: "custom",
        key: "locality_country",
        value: "Brazil",
        type: "single_line_text_field",
      },
      {
        namespace: "custom",
        key: "locality_mine",
        value: "Coronel Murta",
        type: "single_line_text_field",
      },
      {
        namespace: "custom",
        key: "locality_full",
        value: "Coronel Murta, Jequitinhonha Valley, Minas Gerais, Brazil",
        type: "single_line_text_field",
      },
      {
        namespace: "custom",
        key: "species",
        value: '["Elbaite","Cleavelandite","Lepidolite"]',
        type: "list.single_line_text_field",
      },
      {
        namespace: "custom",
        key: "color",
        value: '["Green","Pink"]',
        type: "list.single_line_text_field",
      },
      {
        namespace: "custom",
        key: "length",
        value: '{"value":108.0,"unit":"MILLIMETERS"}',
        type: "dimension",
      },
      {
        namespace: "custom",
        key: "width",
        value: '[{"value":55.0,"unit":"MILLIMETERS"}]',
        type: "list.dimension",
      },
      {
        namespace: "custom",
        key: "height",
        value: '{"value":43.0,"unit":"MILLIMETERS"}',
        type: "dimension",
      },
    ];

    // Product data with literal values from the example
    const productData = {
      title: "ELBAITE with Cleavelandite and Lepidolite",
      price: "1000.00",
      weight: 20,
      metafields: metafieldsData,
      description: "Stunning miniature tourmaline"
    };

    let productResponse;
    try {
      productResponse = await client.createProduct(productData);
    } catch (error) {
      console.error("❌ GraphQL Error:", error);
      return;
    }

    if (productResponse.body?.data?.productSet?.userErrors?.length > 0) {
      console.error(
        "❌ Product creation errors:",
        productResponse.body.data.productSet.userErrors
      );
      return;
    }

    const createdProduct = productResponse.data?.productSet?.product;
    if (!createdProduct) {
      console.error("❌ No product returned from creation");
      console.log("Response:", JSON.stringify(productResponse, null, 2));
      return;
    }

    console.log("✅ Product created successfully:", createdProduct.title);
    console.log("Product ID:", createdProduct.id);

    // Publish the product to the online store, Shop and POS
    const publications = [
        {
          publicationId: "gid://shopify/Publication/154328137891", // Online Store in dev
          publishDate: "2025-08-29T00:00:00Z"
        },
        {
          publicationId: "gid://shopify/Publication/154328203427", // POS in dev
          publishDate: "2025-08-29T00:00:00Z"
        },
        {
          publicationId: "gid://shopify/Publication/154328268963", // Shop (Shopify marketplace) in dev
          publishDate: "2025-08-29T00:00:00Z"
        }
    ]
    const publishProductResponse = await client.publishProduct(createdProduct.id, publications);
    if (publishProductResponse.body?.data?.productSet?.userErrors?.length > 0) {
      console.error(
        "❌ Product publication errors:",
        publishProductResponse.body.data.productSet.userErrors
      );
      return;
    }

    console.log("\n🎉 Product copy creation completed!");
    console.log(
      "Product URL:",
      `https://${storeName}.myshopify.com/admin/products/${createdProduct.id
        .split("/")
        .pop()}`
    );
  } catch (error) {
    console.error("❌ Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

if (require.main === module) {
  main();
}
