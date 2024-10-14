import type { AdminApiContext } from "@shopify/shopify-app-remix/server";
import type { ShopifyGraphQLResponse } from "../interfaces/shopify-graphql.interface";
import { json } from "@remix-run/node";



export interface CurrentAppInstallationResponseDTO {
  currentAppInstallation: CurrentAppInstallation;
}

export interface CurrentAppInstallation {
  id:  string;
  app: App;
}

export interface App {
  id: string;
}

export const queryCurrentAppInstallation = async (admin:AdminApiContext) => {
  try {
    const response = await admin.graphql(
      `#graphql
     
      query {
        currentAppInstallation {
          id
          app {
            id
          }
        }
      }
      `
    )
    const responseJson = await response.json() as ShopifyGraphQLResponse<CurrentAppInstallationResponseDTO>
    
    return json(responseJson)

  } catch (error) {
    console.error("Error fetching shop info:", error);
    throw error;
  }
}