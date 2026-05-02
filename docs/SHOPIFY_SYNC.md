# Shopify catalog-group sync

## Audit summary

- There was no Shopify sync pipeline in-repo before this change.
- No existing SKU->variant idempotent mapping layer existed.
- No manifest logging existed for Shopify sync runs.

## Sync flow

1. Read catalog groups from Convex (`catalogGroups:listForShopifySync` by default).
2. Map each group to one Shopify product payload and each SKU to one Shopify variant payload.
3. Lookup existing Shopify variants by SKU (`productVariants(query: "sku:<SKU>")`).
4. If SKU exists, mark as update target (or `skipped` in dry-run).
5. If SKU does not exist, create product/variant (or mark `created` in dry-run).
6. Write structured manifest JSON to disk when `--manifest` is provided.

## Usage

```bash
npm run shopify:sync -- --dry-run --manifest tmp/shopify-sync/latest.json
npm run shopify:sync -- --slug atomizer-5ml --dry-run --manifest tmp/shopify-sync/atomizer.json
```

## Required env vars

- `NEXT_PUBLIC_CONVEX_URL`
- `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN`
- `SHOPIFY_ADMIN_TOKEN`

Optional:

- `SHOPIFY_API_VERSION` (default `2025-10`)
- `CONVEX_CATALOG_GROUPS_FUNCTION` (default `catalogGroups:listForShopifySync`)

## Manifest entry format

Each entry includes:

- `status`: `created | updated | skipped | error`
- `sku`
- `shopifyProductId` (when known)
- `shopifyVariantId` (when known)
- `reason` (for dry-run decisions/errors)
- `groupSlug`
