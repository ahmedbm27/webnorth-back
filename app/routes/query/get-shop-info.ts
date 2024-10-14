import { json } from "@remix-run/node";
import { AdminApiContext } from "@shopify/shopify-app-remix/server";
import { ShopifyGraphQLResponse } from "app/common/interfaces/shopify-graphql.interface";

export interface GetShopInfoData {
  shop: Shop;
}

export interface Shop {
  id:         string;
  metafields: Metafields;
}

export interface Metafields {
  nodes: Node[];
}

export interface Node {
  id:        string;
  key:       string;
  namespace: string;
  jsonValue: JSONValue;
}

export interface JSONValue {
  data: Product[];
}

export interface Product {
  uuid:             string;
  status:           boolean;
  matchingProducts: string[];
  freeGifts:        string[];
}


export const getShopInfo = async (admin:AdminApiContext) => {
  if (!process.env.APP_METAFIELD_NAME_SPACE || !process.env.APP_METAFIELD_KEY) {
    throw new Error("Environment variables for metafields are missing");
  }
  try {
    const response = await admin.graphql(
      `#graphql
      query x($namespace_:String!,$key_:[String!]){
        shop{
          id
          metafields(first:250,namespace:$namespace_,keys:$key_){
            nodes{
              id
              jsonValue
            }
          }
        }
      }`,
      {
        variables:{
          namespace_:process.env.APP_METAFIELD_NAME_SPACE,
          key: [process.env.APP_METAFIELD_KEY]
        }
      }
    )
    const responseJson = await response.json() as ShopifyGraphQLResponse<GetShopInfoData>;
    
    return json({
      cartRules:responseJson.data.shop.metafields.nodes,
      shopId:responseJson.data.shop.id
    })

  } catch (error) {
    console.error("Error fetching shop info:", error);
    throw error;
  }
}
