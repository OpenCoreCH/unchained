export default (productIds, allProductIds) => (values) => {
  const [range] = values;
  if (range === undefined) return allProductIds;
  const [start, end] = range?.split(':');
  if (range === null || !start) return accumulator;

  const nStart = new Number(start);
  const nEnd = new Number(end);
  const foundProductIds = Object.keys(productIds).flatMap((key) => {
    const nKey = new Number(key);
    if (nStart <= nKey && nEnd >= nKey) {
      return productIds[key] || [];
    }
    return [];
  });
  return [...accumulator, ...foundProductIds];
};
