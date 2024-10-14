import "@shopify/shopify-app-remix/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
} from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import { restResources } from "@shopify/shopify-api/rest/admin/2024-07";
import prisma from "./db.server";
import { discountAutomaticAppCreate } from "./common/query/discount-automatic-app-create";
import { queryCurrentAppInstallation } from "./common/query/current-app-installation";
import { queryShopifyFunctions, ShopifyFunctionsApiTypes } from "./common/query/shopify-functions";

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.October24,
  scopes: process.env.SCOPES?.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  restResources,
  hooks: {
    async afterAuth({admin}) {
      const currentAppInstallation = await (await queryCurrentAppInstallation(admin)).json();
      const appId = currentAppInstallation.data.currentAppInstallation?.app?.id;

      const shopifyFunctions = await ((await queryShopifyFunctions(admin, {
        apiType: ShopifyFunctionsApiTypes.PRODUCT_DISCOUNTS,
      })).json())

      const shopifyFunction = shopifyFunctions.data.shopifyFunctions.nodes.find((shopifyFunction) => shopifyFunction.app.id == appId)
      if (!shopifyFunction) {
        throw Error(`could not find shopifyFunction`)
      }
      await discountAutomaticAppCreate(admin, {
        combinesWith: {
          orderDiscounts: true,
          productDiscounts: true,
          shippingDiscounts: true,
        },
        endsAt: null,
        startsAt: `${(new Date()).toISOString().substring(0, 19)}Z`,
        title: 'Free gift allocator',
        functionId: shopifyFunction.id,
      })
    },
  },
  future: {
    unstable_newEmbeddedAuthStrategy: true,
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

export default shopify;
export const apiVersion = ApiVersion.October24;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
