import { json } from "@remix-run/node";
import { AdminApiContext } from "@shopify/shopify-app-remix/server";



export interface Input {
  automaticAppDiscount: AutomaticAppDiscountInput;
}

export interface AutomaticAppDiscountInput {
  title:        string;
  functionId:   string;
  combinesWith: CombinesWith;
  startsAt:     string;
  endsAt:       null;
  metafields?:   Metafield[];
}

export interface CombinesWith {
  orderDiscounts:    boolean;
  productDiscounts:  boolean;
  shippingDiscounts: boolean;
}

export interface Metafield {
  namespace: string;
  key:       string;
  type:      string;
  value:     string;
}



export const discountAutomaticAppCreate = async (admin:AdminApiContext, input: AutomaticAppDiscountInput) => {
  try {
    const response = await admin.graphql(
      `#graphql
      mutation discountAutomaticAppCreate($automaticAppDiscount: DiscountAutomaticAppInput!) {
        discountAutomaticAppCreate(automaticAppDiscount: $automaticAppDiscount) {
          userErrors {
            field
            message
          }
          automaticAppDiscount {
            discountId
            title
            startsAt
            endsAt
            status
            appDiscountType {
              appKey
              functionId
            }
            combinesWith {
              orderDiscounts
              productDiscounts
              shippingDiscounts
            }
          }
        }
      }
      `,
      {
        variables: {
          automaticAppDiscount: input
        }
        
      }
    )
    const responseJson = await response.json()
    
    return json(responseJson)

  } catch (error) {
    console.error("Error fetching shop info:", error);
    throw error;
  }
}