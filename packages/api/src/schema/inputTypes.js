export default [
  /* GraphQL */ `
    """
    A hashed password
    """
    input HashedPasswordInput {
      """
      The hashed password
      """
      digest: String!

      """
      Algorithm used to hash the password
      """
      algorithm: String!
    }

    input ProductReviewSortOptionInput {
      key: String!
      value: SortDirection!
    }

    input UserProfileInput {
      displayName: String
      birthday: Timestamp
        @deprecated(
          reason: "Use strict format that is compliant with the format (YYYY-mm-dd) refer to section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times for more information"
        )
      phoneMobile: String
      gender: String
      address: AddressInput
      customFields: JSON
    }

    input AddressInput {
      firstName: String
      lastName: String
      company: String
      addressLine: String
      addressLine2: String
      postalCode: String
      regionCode: String
      city: String
      countryCode: String
    }

    input ContactInput {
      emailAddress: String
      telNumber: String
    }

    input CreateLanguageInput {
      isoCode: String!
    }
    input UpdateLanguageInput {
      isoCode: String!
      isActive: Boolean
    }

    input CreateCountryInput {
      isoCode: String!
    }
    input UpdateCountryInput {
      isoCode: String!
      isActive: Boolean
      defaultCurrencyId: String
    }

    input CreateCurrencyInput {
      isoCode: String!
      contractAddress: String
    }
    input UpdateCurrencyInput {
      isoCode: String!
      isActive: Boolean
      contractAddress: String
    }

    input CreateProductInput {
      title: String!
      type: String!
      tags: [String!]
    }

    input CreateProductVariationInput {
      key: String!
      type: ProductVariationType!
      title: String!
    }

    input CreateProductVariationOptionInput {
      value: String!
      title: String!
    }

    input ProductAssignmentVectorInput {
      key: String!
      value: String!
    }

    input UpdateProductInput {
      tags: [String!]
      sequence: Int
      meta: JSON
    }

    input UpdateProductTextInput {
      locale: String!
      slug: String
      title: String
      subtitle: String
      description: String
      vendor: String
      brand: String
      labels: [String!]
    }

    input UpdateProductMediaTextInput {
      locale: String!
      title: String
      subtitle: String
    }

    input UpdateProductVariationTextInput {
      locale: String!
      title: String
      subtitle: String
    }

    input UpdateProductCommercePricingInput {
      amount: Int!
      maxQuantity: Int
      isTaxable: Boolean
      isNetPrice: Boolean
      currencyCode: String!
      countryCode: String!
    }

    input UpdateProductCommerceInput {
      pricing: [UpdateProductCommercePricingInput!]!
    }

    input UpdateProductSupplyInput {
      weightInGram: Int
      heightInMillimeters: Int
      lengthInMillimeters: Int
      widthInMillimeters: Int
    }

    input UpdateProductWarehousingInput {
      sku: String
      baseUnit: String
    }

    input ReorderProductMediaInput {
      productMediaId: ID!
      sortKey: Int!
    }

    input CreateWarehousingProviderInput {
      type: WarehousingProviderType!
      adapterKey: String!
    }

    input CreateDeliveryProviderInput {
      type: DeliveryProviderType!
      adapterKey: String!
    }

    input CreatePaymentProviderInput {
      type: PaymentProviderType!
      adapterKey: String!
    }

    input UpdateProviderInput {
      configuration: [JSON!]
    }

    input CreateAssortmentInput {
      isRoot: Boolean
      tags: [String!]
      title: String!
    }

    input UpdateAssortmentInput {
      isRoot: Boolean
      tags: [String!]
      isActive: Boolean
    }

    input UpdateAssortmentTextInput {
      locale: String!
      slug: String
      title: String
      subtitle: String
      description: String
    }

    input ReorderAssortmentProductInput {
      assortmentProductId: ID!
      sortKey: Int!
    }

    input ReorderAssortmentFilterInput {
      assortmentFilterId: ID!
      sortKey: Int!
    }

    input ReorderAssortmentLinkInput {
      assortmentLinkId: ID!
      sortKey: Int!
    }

    input UpdateAssortmentMediaTextInput {
      locale: String!
      title: String
      subtitle: String
    }

    input ReorderAssortmentMediaInput {
      assortmentMediaId: ID!
      sortKey: Int!
    }

    input CreateFilterInput {
      key: String!
      type: FilterType!
      title: String!
      options: [String!]
    }

    input CreateFilterOptionInput {
      value: String!
      title: String!
    }

    input UpdateFilterInput {
      isActive: Boolean
      key: String
    }

    input UpdateFilterTextInput {
      locale: String!
      title: String
      subtitle: String
    }

    input ProductConfigurationParameterInput {
      key: String!
      value: String!
    }

    input ProductReviewInput {
      rating: Int
      title: String
      review: String
    }

    input FilterQueryInput {
      key: String!
      value: String
    }

    input CreateProductBundleItemInput {
      productId: ID!
      quantity: Int!
    }

    input EnrollmentDeliveryInput {
      deliveryProviderId: ID!
      meta: JSON
    }

    input EnrollmentPaymentInput {
      paymentProviderId: ID!
      meta: JSON
    }

    input EnrollmentPlanInput {
      productId: ID!
      quantity: Int = 1
      configuration: [ProductConfigurationParameterInput!]
    }

    input OrderItemInput {
      productId: ID!
      quantity: Int = 1
      configuration: [ProductConfigurationParameterInput!]
    }

    input DateFilterInput {
      start: DateTime
      end: DateTime
    }
  `,
];
