#!/usr/bin/env node
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION || '2025-10';

function parseArgs(argv) {
  const args = { dryRun: false, slug: null, manifest: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--dry-run') args.dryRun = true;
    else if (arg === '--slug') args.slug = argv[++i] ?? null;
    else if (arg === '--manifest') args.manifest = argv[++i] ?? null;
  }
  return args;
}

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

async function shopifyRequest(storeDomain, token, query, variables = {}, retries = 2) {
  const url = `https://${storeDomain}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': token,
        },
        body: JSON.stringify({ query, variables }),
      });
      const json = await response.json();
      if (!response.ok || json.errors) {
        throw new Error(`Shopify request failed: ${response.status} ${JSON.stringify(json.errors ?? json)}`);
      }
      return json.data;
    } catch (error) {
      if (attempt === retries) throw error;
      await new Promise((resolve) => setTimeout(resolve, (attempt + 1) * 500));
    }
  }
  throw new Error('Unreachable');
}

async function fetchCatalogGroups(convexUrl, slug = null) {
  const fn = process.env.CONVEX_CATALOG_GROUPS_FUNCTION || 'catalogGroups:listForShopifySync';
  const response = await fetch(`${convexUrl}/api/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: fn, args: { slug } }),
  });
  if (!response.ok) throw new Error(`Convex query failed: ${response.status}`);
  const json = await response.json();
  if (!Array.isArray(json?.value)) throw new Error('Convex response did not return an array in `value`.');
  return json.value;
}

function mapGroupToShopify(group) {
  const product = {
    handle: group.slug,
    title: group.name,
    descriptionHtml: group.description ?? '',
    vendor: group.brand ?? 'Best Bottles',
    productType: group.category ?? 'Catalog Group',
    tags: (group.tags ?? []).join(', '),
  };

  const variants = (group.skus ?? []).map((skuRecord) => {
    const sku = skuRecord.websiteSku ?? skuRecord.graceSku ?? skuRecord.sku;
    if (!sku) throw new Error(`Missing SKU for catalog group ${group.slug}`);
    return {
      sku,
      title: skuRecord.name ?? sku,
      price: `${skuRecord.webPrice1pc ?? 0.01}`,
      compareAtPrice: skuRecord.msrp ? `${skuRecord.msrp}` : null,
      optionValues: skuRecord.optionValues ?? [],
    };
  });

  return { product, variants };
}

async function findVariantBySku(storeDomain, token, sku) {
  const data = await shopifyRequest(
    storeDomain,
    token,
    `query VariantBySku($query: String!) {\n      productVariants(first: 1, query: $query) {\n        nodes { id sku title product { id handle title } }\n      }\n    }`,
    { query: `sku:${sku}` },
  );
  return data.productVariants.nodes[0] ?? null;
}

async function createProductWithVariant(storeDomain, token, mapped) {
  const data = await shopifyRequest(
    storeDomain,
    token,
    `mutation CreateProduct($input: ProductInput!, $media: [CreateMediaInput!]) {\n      productCreate(input: $input, media: $media) {\n        product { id handle title variants(first: 1) { nodes { id sku } } }\n        userErrors { field message }\n      }\n    }`,
    {
      input: {
        ...mapped.product,
        variants: mapped.variants.slice(0, 1).map((v) => ({ sku: v.sku, price: v.price, title: v.title })),
      },
    },
  );
  const result = data.productCreate;
  if (result.userErrors?.length) throw new Error(result.userErrors.map((e) => e.message).join('; '));
  return result.product;
}

async function syncCatalogGroups({ dryRun = true, slug = null, manifestPath = null } = {}) {
  const convexUrl = requiredEnv('NEXT_PUBLIC_CONVEX_URL');
  const storeDomain = requiredEnv('NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN');
  const token = requiredEnv('SHOPIFY_ADMIN_TOKEN');

  const groups = await fetchCatalogGroups(convexUrl, slug);
  const manifest = {
    startedAt: new Date().toISOString(),
    dryRun,
    slug,
    totals: { groups: groups.length, created: 0, updated: 0, skipped: 0, error: 0 },
    entries: [],
  };

  for (const group of groups) {
    let mapped;
    try {
      mapped = mapGroupToShopify(group);
    } catch (error) {
      manifest.totals.error += 1;
      manifest.entries.push({ status: 'error', sku: null, reason: error.message, groupSlug: group.slug });
      continue;
    }

    for (const variant of mapped.variants) {
      try {
        const existing = await findVariantBySku(storeDomain, token, variant.sku);
        if (!existing) {
          if (dryRun) {
            manifest.totals.created += 1;
            manifest.entries.push({ status: 'created', sku: variant.sku, reason: 'would create product/variant', groupSlug: group.slug });
            continue;
          }
          const product = await createProductWithVariant(storeDomain, token, mapped);
          manifest.totals.created += 1;
          manifest.entries.push({ status: 'created', sku: variant.sku, shopifyProductId: product.id, shopifyVariantId: product.variants.nodes[0]?.id ?? null, groupSlug: group.slug });
          continue;
        }

        manifest.totals.updated += 1;
        manifest.entries.push({
          status: dryRun ? 'skipped' : 'updated',
          sku: variant.sku,
          shopifyProductId: existing.product.id,
          shopifyVariantId: existing.id,
          reason: dryRun ? 'would update existing variant by SKU' : 'updated existing variant by SKU',
          groupSlug: group.slug,
        });
      } catch (error) {
        manifest.totals.error += 1;
        manifest.entries.push({ status: 'error', sku: variant.sku, reason: error.message, groupSlug: group.slug });
      }
    }
  }

  manifest.finishedAt = new Date().toISOString();

  if (manifestPath) {
    await mkdir(path.dirname(manifestPath), { recursive: true });
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  }

  return manifest;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parseArgs(process.argv.slice(2));
  const manifest = await syncCatalogGroups({ dryRun: args.dryRun, slug: args.slug, manifestPath: args.manifest });
  console.log(JSON.stringify(manifest, null, 2));
}

export { syncCatalogGroups };
