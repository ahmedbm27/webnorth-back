import type { ActionFunctionArgs } from "@remix-run/node";
import { useState } from "react";
import { useForm, useField } from "@shopify/react-form";
import {
  Text,
  Layout,
  Button,
  BlockStack,
  Card,
  InlineStack,
  Thumbnail,
  Page,
  InlineGrid,
} from "@shopify/polaris";
import { ImageIcon } from "@shopify/polaris-icons";
import {
  Form,
  useActionData,
  useNavigation,
  useSubmit,
} from "@remix-run/react";
import { json } from "@remix-run/node";


import shopify from "../shopify.server";
import type {ResourceSelection } from "./interfaces/shopify.interface";
import type { AdminApiContext } from "@shopify/shopify-app-remix/server";
import type { RestResources } from "@shopify/shopify-api/rest/admin/2024-07";


interface ProductSelectionProps {
  productKey: string;
  title: string;
  productData: any;
  onSelectProduct: (productKey: string) => void;
}
const ProductSelection = ({ productKey, productData, onSelectProduct, title }: ProductSelectionProps) => (
  <BlockStack gap="500">
    <InlineStack align="space-between">
      <Text as="h2" variant="headingLg">
        {`${title}`}
      </Text>
      {productData.productId && (
        <Button variant="plain" onClick={() => onSelectProduct(productKey)}>
          Change product
        </Button>
      )}
    </InlineStack>
    {productData.productId ? (
      <InlineStack blockAlign="center" gap="500">
        <Thumbnail source={productData.productImage || ImageIcon} alt={productData.productAlt} />
        <Text as="span" variant="headingMd" fontWeight="semibold">
          {productData.productTitle}
        </Text>
      </InlineStack>
    ) : (
      <BlockStack gap="200">
        <Button onClick={() => onSelectProduct(productKey)}>{`Select product ${productKey}`}</Button>
      </BlockStack>
    )}
  </BlockStack>
);
const getShopId = async (admin:AdminApiContext) =>{

  const response = await admin.graphql(
    `#graphql
      query {
        shop {
          id
        }
      }`
  )
  const responseJson = await response.json()
  const shopID = responseJson.data.shop.id
  return json({shopID});
}

export const action = async ({ params, request }: ActionFunctionArgs) => {
  const { functionId } = params;
  const { admin } = await shopify.authenticate.admin(request);
  const formData:FormData = await request.formData();
  //const {shopID} = await getShopId(admin).then(resp => resp.json())

  const {
    product1,
    product2,
    freeGift
  } = JSON.parse(formData.get("cartRule"));
  console.log("product1**********************");
  console.log(product1);
  
  const metafield = {
    "key": "function-configuration",
    "namespace": "$app:free_gift",
    "ownerId": "gid://shopify/CartTransform/27132233",
    "type": "json",
    "value": JSON.stringify({product1,product2,freeGift})
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
  //console.log(responseJson)
  const errors = responseJson.data.discountCreate?.userErrors;
  const discount = responseJson.data?.codeAppDiscount;
  return json({ errors, discount: { ...discount, functionId } });
}

export default function NewGift(){
  const submitForm = useSubmit();
  const actionData = useActionData();
  const navigation = useNavigation();
  const [productsState, setProductsState] = useState({
    product1: {},
    product2: {},
    freeGift:{},
  }) as any;
  const { 
    fields:{
      product1,
      product2,
      freeGift,
    }, 
    submit 
  } = useForm({
    fields:{
      product1: useField({}),
      product2: useField({}),
      freeGift: useField({}),
    },
    onSubmit: async () => {
      const cartRule = {
        product1: productsState.product1,
        product2: productsState.product2,
        freeGift: productsState.freeGift,
      }
      console.log("cartRule")
      console.log(cartRule)
      submitForm({ cartRule: JSON.stringify(cartRule) }, { method: "post" });
      return { status: "success" };
    }
  })

  async function handleSelectProduct(productKey: string) {
    const products = await window.shopify.resourcePicker({
      type: "product",
      action: "select",
    }) as ResourceSelection<"product">[];

    if (products) {
      const { images, id, variants, title, handle } = products[0];

      setProductsState({
        ...productsState,
        [productKey]: {
          productId: id,
          productVariantId: variants[0].id,
          productTitle: title,
          productHandle: handle,
          productAlt: images[0]?.altText,
          productImage: images[0]?.originalSrc,
        }
      });
    }
  }
return(
  <Page>
    <Layout>
      <Layout.Section>
            <BlockStack gap="500">
              <Card>
              <BlockStack gap="500">
              <Form onSubmit={submit} method="post">
                <InlineGrid gap="400" columns={2}>
                  <ProductSelection
                  productKey="product1"
                  title="Select Product 1"
                  productData={productsState.product1}
                  onSelectProduct={handleSelectProduct}
                  />
                  <ProductSelection
                  productKey="product2"
                  title="Select Product 2"
                  productData={productsState.product2}
                  onSelectProduct={handleSelectProduct}
                  />
                </InlineGrid>
                <ProductSelection
                  productKey="freeGift"
                  title="Select The Free Gift"
                  productData={productsState.freeGift}
                  onSelectProduct={handleSelectProduct}
                />

                <InlineStack align="end">
                  <Button 
                    variant="primary"
                    submit={true}
                    accessibilityLabel="Save">
                    Save
                  </Button>   
                </InlineStack>
              </Form>
              </BlockStack>
              </Card>
            </BlockStack>
      </Layout.Section>
    </Layout>
  </Page>
)
}
