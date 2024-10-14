import {json, type LoaderFunctionArgs } from "@remix-run/node";
import shopify from "../shopify.server";
import { BlockStack, Button, Card, IndexTable,List,Page,Text, useBreakpoints } from "@shopify/polaris";
import { Link, useLoaderData,useNavigate } from "@remix-run/react";
import type { AdminApiContext } from "@shopify/shopify-app-remix/server";


const getCartRules = async (admin:AdminApiContext) => {

  const response = await admin.graphql(
    `#graphql
    query x($namespace_:String!,$key_:[String!]){
      shop{
        metafields(first:250,namespace:$namespace_,keys:$key_){
          nodes{
            id
            jsonValue
            key
          }
        }
      }
    }`,
    {
      variables:{namespace_:process.env.APP_METAFIELD_NAME_SPACE,key: [process.env.APP_METAFIELD_KEY]}
    }
  )
  const responseJson = await response.json();
  const cartRules = responseJson.data.shop.metafields.nodes
  
  return json({cartRules})
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await shopify.authenticate.admin(request);
  const {cartRules} = await getCartRules(admin).then(resp => resp.json())
  return json({cartRules: cartRules})
};



export default function Index() {
  const { smDown } = useBreakpoints()
  const navigate = useNavigate();
  
  const { cartRules } = useLoaderData<typeof loader>();

  const data = cartRules[0]?.jsonValue?.data as {uuid: string, status: boolean,matchingProducts: (string | null)[], freeGifts: (string | null)[]}[]
  if(!cartRules.length) return ((
  <Page>
    <Card>
      <BlockStack gap="500">
        <Text as="h2" variant="bodyMd">
          Create a new cart rule
        </Text>
        <Button onClick={()=>navigate(`./new-cart-rule/`)}>Create</Button>
      </BlockStack>
    </Card>
  </Page>
  ));
  
 return(
  <Page
  primaryAction={<Link to={`./new-cart-rule`}>Create a new rule</Link>}
  >
    {data.length ? 
    (
      <IndexTable
        condensed={smDown}
        resourceName = {{
          singular: 'order',
          plural: 'orders',
        }}
        itemCount={data.length}
        headings={[
          {title: 'ID'},
          {title: 'Matching Products'},
          {title: 'Free Gifts'},
          {title: 'Status'},
        ]}
        selectable={false}
      >
        {data.map((cartRule,index) => {
          return (
            
          <IndexTable.Row id={cartRule.uuid} key={cartRule.uuid} position={index}>
            <IndexTable.Cell>
              <Text variant="bodyMd" fontWeight="bold" as="span">
                {index + 1}
              </Text>
            </IndexTable.Cell>
            
            <IndexTable.Cell>
              <List type="bullet">
                {cartRule.matchingProducts.map((product, index) => { return (<List.Item  key={index}>{product}</List.Item>)})}
              </List>
            </IndexTable.Cell>
            <IndexTable.Cell>
            <List type="bullet">
                {cartRule.freeGifts.map((gift, index) => { return (<List.Item key={index}>{gift}</List.Item>)})}
              </List>
            </IndexTable.Cell>
            <IndexTable.Cell>
              <Text variant="bodyMd"  as="span">
                {cartRule.status ? "Active" : "Inactive"}
              </Text>
            </IndexTable.Cell>
          </IndexTable.Row>)
        })}
      </IndexTable>
    )
    : 
    (<Card>
      <Text as="h2" variant="bodyMd">
        Create a new cart rule
      </Text>
      <Button onClick={()=>navigate(`./new-cart-rule/`)}>Create</Button>
    </Card>) }
  </Page>
) 

}
