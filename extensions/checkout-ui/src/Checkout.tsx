import {
  reactExtension,
  useApplyCartLinesChange,
  useInstructions,
  useCartLines,
  useApi,
} from "@shopify/ui-extensions-react/checkout";
import type { AppMetafieldEntry } from "@shopify/ui-extensions/checkout";
import { useEffect } from "react";

// 1. Choose an extension target
export default reactExtension("purchase.checkout.block.render", () => (
  <Extension />
));
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
function Extension() {
  
  const instructions = useInstructions();
  const applyCartLinesChange = useApplyCartLinesChange();
  const {appMetafields} = useApi();
  const cartLines = useCartLines();
  useEffect(() => {
    (async () => {
      const metafields = await new Promise<AppMetafieldEntry[]>((resolve) => {
        let unsubscribe: any;
        unsubscribe = appMetafields.subscribe((v) => {
          if (!v || v.length == 0) {
            return
          }
          resolve(v);
          unsubscribe?.();
        });
      });
      const rawValue = metafields.find(
        ({ metafield: { key, namespace } }) =>
          namespace == process.env.APP_METAFIELD_NAME_SPACE && key == process.env.APP_METAFIELD_KEY
      )?.metafield.value as string;
      console.log("******");
      console.log(rawValue);
      
      
      const cartRules = JSON.parse(rawValue).data as Datum[];

      const freeGiftProductVariantQuantities = cartRules.reduce((acc, curr) => {
        // check if all required products for this ruleset are present
        const matched = curr.matchingProducts.every((productVariantId) => cartLines.some((line) => {
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

      const freeGiftProductVariantIdForQuantity = Object.entries(freeGiftProductVariantQuantities);
      const freeGiftProductVariantIdForQuantityAdjustedForCart = freeGiftProductVariantIdForQuantity.map<[string, number]>(([productVariantId, quantity]) => {
        const matchedCartLine = cartLines.find((cartLine) => cartLine.merchandise.id == productVariantId)
        if (!matchedCartLine) {
          return [productVariantId, quantity]
        }
        return [productVariantId, Number(quantity > matchedCartLine.quantity ? quantity - matchedCartLine.quantity : 0)]
      }).filter(([productVariantId, quantity]) => quantity > 0)


      for(const [productVariantId, quantity] of freeGiftProductVariantIdForQuantityAdjustedForCart){
        await applyCartLinesChange({
          merchandiseId: productVariantId,
          quantity: quantity,
          type: "addCartLine"
        })
      }
     
    })();
  }, []);
  // 2. Check instructions for feature availability, see https://shopify.dev/docs/api/checkout-ui-extensions/apis/cart-instructions for details
  if (!instructions.attributes.canUpdateAttributes) {
    return
  }


  
  
 
}