import {
  Text,
  Button,
  BlockStack,
  InlineStack,
  Thumbnail,
} from "@shopify/polaris";

import { ImageIcon } from "@shopify/polaris-icons";

export interface ProductSelectionProps {
  productType: 'matchingProducts' | 'freeGifts';
  title: string;
  productData: any;
  index: number;
  onSelectProduct: (productType: ProductSelectionProps['productType'], index: number ) => void;
}

const  ProductSelection = ({ productType , productData, onSelectProduct, title, index }: ProductSelectionProps) => (
  <BlockStack gap="500">
    <InlineStack align="space-between">
      <Text as="h2" variant="headingLg">
        {title}
      </Text>
      {productData?.productId && (
        <Button variant="plain" onClick={() => onSelectProduct(productType, index)}>
          Change product
        </Button>
      )}
    </InlineStack>
    {productData?.productId ? (
      <InlineStack blockAlign="center" gap="500">
        <Thumbnail source={productData.productImage || ImageIcon} alt={productData.productAlt} />
        <Text as="span" variant="headingMd" fontWeight="semibold">
          {productData.productTitle}
        </Text>
      </InlineStack>
    ) : (
      <BlockStack gap="200">
        <Button onClick={() => onSelectProduct(productType, index)}>{`Select product`}</Button>
      </BlockStack>
    )}
  </BlockStack>
);

export default ProductSelection