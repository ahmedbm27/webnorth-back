import type {
  RunInput,
  FunctionRunResult
} from "../generated/api";
import {
  DiscountApplicationStrategy,
} from "../generated/api";

const EMPTY_DISCOUNT: FunctionRunResult = {
  discountApplicationStrategy: DiscountApplicationStrategy.First,
  discounts: [],
};



export interface Metafield {
  jsonValue: JSONValue;
}

export interface JSONValue {
  data: Datum[];
}

export interface Datum {
  uuid:             string;
  status:           boolean;
  matchingProducts: string[];
  freeGifts:        string[];
}

export function run({cart: {lines}, shop: {metafield}}: RunInput): FunctionRunResult {
  

  const cartRules = metafield as Metafield
  const data = cartRules.jsonValue.data;
  const freeGiftProductVariantQuantities = data.reduce((acc, curr) => {
    // check if all required products for this ruleset are present
    const matched = curr.matchingProducts.every((productVariantId) => lines.some((line) => {
      if (line.merchandise.__typename == 'CustomProduct') {
        return false;
      }
      return line.quantity > 0 && line.merchandise.id == productVariantId
    }));
    // if not all products are present, proceed to next one
    if (!matched) {
      return acc;
    } 
    // sum up the number of occurences of each free product throughout multiple iterations
    for (const freeGiftProductVariantId of curr.freeGifts) {
      acc[freeGiftProductVariantId] = acc[freeGiftProductVariantId] ? acc[freeGiftProductVariantId] + 1 : 1;
    }


    return acc;
  }, {} as Record<string, number>)
  // if we did not match any rule set, there will be no free products to distribute
  const freeGiftProductVariantIdForQuantity = Object.entries(freeGiftProductVariantQuantities);
  if (freeGiftProductVariantIdForQuantity.length == 0) {
    return EMPTY_DISCOUNT;
  }
  
  
  return {
    discounts: [
      {
        targets: freeGiftProductVariantIdForQuantity.map(([productVariantId, quantity]) => {
          return {
            productVariant: {
              id: productVariantId,
              quantity: quantity
            }
          }
        }),
        value: {
          percentage: {
            value: "100.0",
          },
        },
      },
    ],
    discountApplicationStrategy: DiscountApplicationStrategy.First,
  };
  
};