import type { ActionFunctionArgs } from "@remix-run/node";
import { useEffect, useState } from "react";
import { useForm } from "@shopify/react-form";
import {
  Text,
  Layout,
  Button,
  BlockStack,
  Card,
  InlineStack,
  Page,
} from "@shopify/polaris";
import {
  useActionData,
  useFetcher,
  useNavigate,
} from "@remix-run/react";
import { json } from "@remix-run/node";


import shopify from "../shopify.server";
import type {ResourceSelection } from "./interfaces/shopify.interface";
import { v4 as uuidv4 } from 'uuid';
import type {ProductSelectionProps} from '../routes/ProductSelection';
import ProductSelection from '../routes/ProductSelection'
import type { IProductSelection } from "./interfaces/selected-product.interface";
import { getShopInfo } from "./query/get-shop-info";



export const action = async ({ params, request }: ActionFunctionArgs) => {
  const { admin, redirect } = await shopify.authenticate.admin(request);
  const formData:FormData = await request.formData();
  const {cartRules,shopId} = await getShopInfo(admin).then(resp => resp.json())
  console.log(cartRules);
  const cartRule = formData.get('cartRule');
  if (!cartRule) {
    return json({ message: 'cartRule required param' }, { status: 400 });
  }
  const payload = JSON.parse(cartRule.toString()) as {matchingProducts: (IProductSelection | null)[], freeGifts: (IProductSelection | null)[]};
  let value = {
    uuid: uuidv4(),
    status:true,
    matchingProducts:payload.matchingProducts.filter((item) => !!item).map(({productVariantId}) => productVariantId),
    freeGifts : payload.freeGifts.filter((item) => !!item).map(({productVariantId}) => productVariantId)
  }
  
  if (value.matchingProducts.length != [...new Set(value.matchingProducts)].length) {
    return json({ok: false, message: 'each product can only be selected once' }, { status: 422 });
  }

  if (value.matchingProducts.length < 2) {
    return json({ok: false, message: 'at least 2 paid products must be selected' }, { status: 422 });
  }
  if (value.freeGifts.length != 1) {
    return json({ok: false, message: '1 free product must be selected' }, { status: 422 });
  }

  const existingCartRules = cartRules[0]?.jsonValue?.data || [];

  const hasOneExactMatch = existingCartRules.some((metafieldCartRule) => {
    const hasAllMatchingProducts = value.matchingProducts.length ==  metafieldCartRule.matchingProducts.length && metafieldCartRule.matchingProducts.every((metafieldMatchingProductId) => {
      return value.matchingProducts.includes(metafieldMatchingProductId);
    })
    const hasAllFreeGifts = value.freeGifts.length == metafieldCartRule.freeGifts.length && metafieldCartRule.freeGifts.every((metafieldFreeGift) => {
      return value.freeGifts.includes(metafieldFreeGift)
    })
    return hasAllFreeGifts && hasAllMatchingProducts;
  })

  if (hasOneExactMatch) {
    return json({ok: false, message: 'combination already exists' }, { status: 200 });
  }
  const metafields = (() =>{



    return [...existingCartRules, value]
  })()

  
  const metafield = {
    "key": process.env.APP_METAFIELD_KEY,
    "namespace": process.env.APP_METAFIELD_NAME_SPACE,
    "ownerId": shopId,
    "type": "json",
    "value": JSON.stringify({data:metafields})
  }

  const response = await admin.graphql(
    `#graphql
      mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields {
            key
            namespace
            value
            createdAt
            updatedAt
          }
          userErrors {
            field
            message
            code
          }
        }
      }`,
      {
        variables:{
          "metafields": [metafield]
        }
      }
  )
  const responseJson = await response.json();
  console.log(responseJson.data);
  
  return json({ok: true}, {status: 200});
}




export default function NewCartRule(props: unknown){
  const fetcher = useFetcher();
  const [cartRule, setCartRule] = useState<{matchingProducts: (IProductSelection | null)[], freeGifts: (IProductSelection | null)[]}>({
    matchingProducts: [null, null],
    freeGifts:[null],
  });

  console.log({props})
  const daxxta = useActionData<typeof action>();
  console.log(daxxta)
  const { submit } = useForm({
    fields:{
      matchingProducts: [],
      freeGifts:[],
    },
    onSubmit: async () => {
      fetcher.submit({ cartRule: JSON.stringify(cartRule) }, { method: "post" ,});
      return { status: "success" };
    }
  })

  const navigate = useNavigate();
  useEffect(() => {
    console.log(fetcher.state)
    console.log(fetcher.data)
    console.log(fetcher)
    const data = fetcher.data as { ok : false, message: string} | {ok: true} | null
    if (!data) {
      return
    }
    if (data.ok) {
      navigate('/app')
      return;
    }
    window.shopify.toast.show(data.message, {
      isError: true,
      duration: 2000,
    })
    
  }, [fetcher, fetcher.data, fetcher.state]);


  async function handleSelectProduct(productType: ProductSelectionProps['productType'], index: number) {
    const products = await window.shopify.resourcePicker({
      type: "product",
      action: "select",
    }) as ResourceSelection<"product">[];

    if (products) {
      const { images, id, variants, title, handle } = products[0];
      cartRule[productType][index] = {
        productId: id,
        productVariantId: variants[0].id!,
        productTitle: title,
        productHandle: handle,
        productAlt: images[0]?.altText,
        productImage: images[0]?.originalSrc,
      }
      console.log({cartRulexx: cartRule, productType, index})
      setCartRule(JSON.parse(JSON.stringify(cartRule)));
    }
    console.log({cartRule});
    
  }

return(
  <Page>
    <Layout>
      <Layout.Section>
            <BlockStack gap="500">
              <fetcher.Form onSubmit={submit} method="post">
                <BlockStack gap="500">
                  <Card>
                    <BlockStack gap="500">
                      <Text as="h2" variant="headingLg">
                        Matching Products :
                      </Text>
                      {cartRule.matchingProducts.map((matchingProduct, index) => {
                        return (
                        <ProductSelection
                          productType = "matchingProducts"
                          title={`Select Product ${index + 1}`}
                          productData={matchingProduct || null}
                          onSelectProduct={handleSelectProduct}
                          key={index}
                          index={index}
                        />)
                      })}
                    </BlockStack>
                    
                  </Card>

                  <Card>
                  <BlockStack gap="500">
                    <Text as="h2" variant="headingLg">
                      Free Gifts :
                    </Text>
                    {cartRule.freeGifts.map((freeGift, index) => {
                        return (
                        <ProductSelection
                          productType = "freeGifts"
                          title={`Select a Gift ${index + 1}`}
                          productData={freeGift}
                          onSelectProduct={handleSelectProduct}
                          key={index}
                          index={index}
                        />)
                      })}
                  </BlockStack>
                  </Card>
                  <InlineStack align="end">
                  <Button 
                  loading={fetcher.state == 'loading'}
                  disabled={fetcher.state != 'idle'}
                    variant="primary"
                    submit={true}
                    accessibilityLabel="Save">
                    Save
                  </Button>   
                </InlineStack>
                </BlockStack >


                
              </fetcher.Form>
            </BlockStack>
      </Layout.Section>
    </Layout>
  </Page>
)
}


export const ErrorBoundary = NewCartRule