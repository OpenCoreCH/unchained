import { Context } from '@unchainedshop/types/api';
import { EnrollmentPeriod as EnrollmentPeriodType } from '@unchainedshop/types/enrollments';
import { Order } from '@unchainedshop/types/orders';

type HelperType<T> = (enrollmentPeriod: EnrollmentPeriodType, _: never, context: Context) => T;

type EnrollmentPeriodHelperTypes = {
  order: HelperType<Promise<Order>>;
};

export const EnrollmentPeriod: EnrollmentPeriodHelperTypes = {
  order: async (period, _, { modules }) => {
    return modules.orders.findOrder({ orderId: period.orderId });
  },
};
