import { AdminApiContext } from "@shopify/shopify-app-remix/server";
import { ShopifyGraphQLResponse } from "../interfaces/shopify-graphql.interface";
import { json } from "@remix-run/node";




export interface ShopifyFunctionsResponseDTO {
  shopifyFunctions: ShopifyFunctions;
}

export interface ShopifyFunctions {
  nodes: Node[];
}

export interface Node {
  apiType: string;
  id:      string;
  app:     App;
  title:   string;
}

export interface App {
  id: string;
}


export enum ShopifyFunctionsApiTypes {
  PRODUCT_DISCOUNTS = 'product_discounts'
}
export interface ShopifyFunctionsInput  {
  apiType: ShopifyFunctionsApiTypes,
}

export const queryShopifyFunctions = async (admin: AdminApiContext, variables?: ShopifyFunctionsInput) => {
  try {
    const response = await admin.graphql(
      `#graphql
     
          query  x($apiType: String!) {
            shopifyFunctions(apiType: $apiType, first: 250) {
              nodes {
                apiType
                id
                app {
                  id
                }
                title
              }
            }
          }

      `,
      {
        variables,
      }
    )
    const responseJson = await response.json() as ShopifyGraphQLResponse<ShopifyFunctionsResponseDTO>
    
    return json(responseJson)

  } catch (error) {
    console.error("Error fetching shop info:", error);
    throw error;
  }
}