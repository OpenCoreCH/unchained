import { Context, Root } from '@unchainedshop/types/api';
import { log } from 'meteor/unchained:logger';
import { InvalidIdError, ProductVariationNotFoundError } from '../../../errors';

export default async function createProductVariationOption(
  root: Root,
  params: {
    option: { value: string; title: string };
    productVariationId: string;
  },
  { modules, localeContext, userId }: Context,
) {
  const { option: inputData, productVariationId } = params;

  log(`mutation createProductVariationOption ${productVariationId}`, {
    userId,
  });

  if (!productVariationId) throw new InvalidIdError({ productVariationId });

  const variation = await modules.products.variations.findProductVariation({
    productVariationId,
  });
  if (!variation) throw new ProductVariationNotFoundError({ productVariationId });

  return modules.products.variations.addVariationOption(
    productVariationId,
    { inputData, localeContext },
    userId,
  );
}
