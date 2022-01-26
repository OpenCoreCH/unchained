export default (productIds, allProductIds) => (values) => {
  const [stringifiedBoolean] = values; // drop all non index 0 values
  if (stringifiedBoolean !== undefined) {
    if (
      !stringifiedBoolean ||
      stringifiedBoolean === 'false' ||
      stringifiedBoolean === '0'
    ) {
      return productIds.false;
    }
    return productIds.true;
  }
  return allProductIds;
};
