export default (productIds, allProductIds) => (values) => {
  values.reduce((accumulator, value) => {
    const additionalValues =
      value === undefined ? allProductIds : productIds[value];
    return [...accumulator, ...(additionalValues || [])];
  }, []);
};
