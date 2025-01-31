import { FilterAdapterActions } from '@unchainedshop/types/filters';

export const assortmentFulltextSearch =
  ({ filterSelector, assortmentSelector, sortStage }, filterActions: FilterAdapterActions) =>
  async (assortmentIds: Array<string>) => {
    const foundAssortmentIds = await filterActions.searchAssortments(
      { assortmentIds },
      {
        filterSelector,
        assortmentSelector,
        sortStage,
      },
    );
    return foundAssortmentIds || [];
  };
