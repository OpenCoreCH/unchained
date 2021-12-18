import { Locale } from '@types/locale';
import { ObjectId } from 'bjson';
import { Request } from 'express';
import { BookmarksModule } from './bookmarks';
import {
  Collection,
  Db,
  Document,
  Filter,
  ModuleCreateMutation,
  ModuleInput,
  ModuleMutations,
  TimestampFields,
  _ID,
} from './common';
import { CountriesModule } from './countries';
import { CurrenciesModule } from './currencies';
import { EventDirector, EventsModule } from './events';
import { FileDirector, FilesModule } from './files';
import { LanguagesModule } from './languages';
import {
  Logger,
  LogLevel as LogLevelType,
  LogOptions,
  Transports,
} from './logs';
import {
  PaymentAdapter as IPaymentAdapter,
  PaymentConfiguration,
  PaymentContext,
  PaymentDirector as IPaymentDirector,
  PaymentError as PaymentErrorType,
  PaymentModule,
  PaymentProvider,
  PaymentProviderType as PaymentProviderTypeType,
} from './payments';
import {
  WarehousingAdapter as IWarehousingAdapter,
  WarehousingContext,
  WarehousingDirector as IWarehousingDirector,
  WarehousingError as WarehousingErrorType,
  WarehousingModule,
  WarehousingProvider,
} from './warehousing';
import { WorkerModule, WorkerPlugin as IWorkerPlugin } from './worker';

export { Modules } from './modules';

declare module 'meteor/unchained:utils' {
  function checkId(
    value: string,
    error?:
      | {
          message: string;
          path?: string | undefined;
        }
      | undefined
  ): void;

  function dbIdToString(_id: _ID): string;

  function findUnusedSlug(
    checkSlugIsUniqueFn: (slug: string) => Promise<boolean>,
    options: { slugify?: (text: string) => string } = {}
  ): (params: { title?: string, existingSlug: string, newSlug?: string }) => string;

  function generateId(id: unknown): ObjectId;
  function generateDbFilterById<T extends { _id?: _ID }>(
    id: any,
    query?: Filter<T>
  ): Filter<T>;

  function generateDbMutations<T extends { _id?: _ID }>(
    collection: Collection<T>,
    schema: SimpleSchema,
    options?: { hasCreateOnly: boolean }
  ): ModuleMutations<T> | ModuleCreateMutation<T>;

  function buildDbIndexes<T extends Document>(
    collection: Collection<T>,
    indexes: Indexes<T>
  ): Promise<boolean>;

  function resolveBestSupported(language: string, locales: Locales): Locale;
  function resolveBestCountry(
    contextCountry: string,
    headerCountry: string | string[],
    countries: Array<Country>
  ): string;
  function resolveUserRemoteAddress(req: Request): {
    remoteAddress: string;
    remotePort: string;
  };

  const systemLocale: Locale;

  const Schemas: {
    timestampFields: TimestampFields;
  };
}

declare module 'meteor/unchained:logger' {
  export function log(message: string, options?: LogOptions): void;
  export function createLogger(
    moduleName: string,
    moreTransports?: Transports
  ): Logger;

  export const LogLevel: typeof LogLevelType;
}

/*
 * Director packages
 */

declare module 'meteor/unchained:director-events' {
  export const emit: EventDirector['emit'];
  export const getEmitAdapter: EventDirector['getEmitAdapter'];
  export const getEmitHistoryAdapter: EventDirector['getEmitHistoryAdapter'];
  export const getRegisteredEvents: EventDirector['getRegisteredEvents'];
  export const registerEvents: EventDirector['registerEvents'];
  export const setEmitAdapter: EventDirector['setEmitAdapter'];
  export const setEmitHistoryAdapter: EventDirector['setEmitHistoryAdapter'];
  export const subscribe: EventDirector['subscribe'];
}

declare module 'meteor/unchained:director-file-upload' {
  export const setFileUploadAdapter: FileDirector['setFileAdapter'];
  export const getFileUploadAdapter: FileDirector['getFileAdapter'];

  export const composeFileName: FileDirector['composeFileName'];
  export const createSignedURL: FileDirector['createSignedURL'];

  export const registerFileUploadCallback: FileDirector['registerFileUploadCallback'];
  export const getFileUploadCallback: FileDirector['getFileUploadCallback'];

  export const removeFiles = FileDirector['removeFiles'];
  export const uploadFileFromStream: FileDirector['uploadFileFromStream'];
  export const uploadFileFromURL: FileDirector['uploadFileFromStream'];
}

declare module 'meteor/unchained:director-documents' {}

/*
 * Core packages
 */

declare module 'meteor/unchained:core-events' {
  export function configureEventsModule(
    params: ModuleInput
  ): Promise<EventsModule>;
}

declare module 'meteor/unchained:core-files-next' {
  export function configureFilesModule(
    params: ModuleInput
  ): Promise<FilesModule>;

  export const fileServices: any;
}

declare module 'meteor/unchained:core-bookmarks' {
  export function configureBookmarksModule(
    params: ModuleInput
  ): Promise<BookmarksModule>;
  export const bookmarkServices: any;
}

declare module 'meteor/unchained:core-countries' {
  export function configureCountriesModule(
    params: ModuleInput
  ): Promise<CountriesModule>;
  export const countryServices: any;
}

declare module 'meteor/unchained:core-currencies' {
  export function configureCurrenciesModule(
    params: ModuleInput
  ): Promise<CurrenciesModule>;
}

declare module 'meteor/unchained:director-discounting' {
  export class DiscountAdapter implements IDiscountAdapter {
    static key: string;
    static label: string;
    static version: string;
    static orderIndex: number;

    static isManualAdditionAllowed(code: string): boolean;

    // return true if a discount is allowed to get removed manually by a user
    static isManualRemovalAllowed(): boolean;

    public context: DiscountContext;
  }

  export class DiscountDirector {
    interfaceClass: (discountKey: string) => typeof IDiscountAdapter;
    interface: (discountKey: string) => IDiscountAdapter;
    resolveDiscountKeyFromStaticCode: (options) => Promise<string>;
    findSystemDiscounts: () => Promise<Array<string>>;

    static sortedAdapters: () => Array<typeof IDiscountAdapter>;
    static registerAdapter: (adapter: typeof IDiscountAdapter) => void;
  }
}

declare module 'meteor/unchained:core-languages' {
  function configureLanguagesModule(
    params: ModuleInput
  ): Promise<LanguagesModule>;
}

declare module 'meteor/unchained:core-payments' {
  export function configurePaymentModule(
    params: ModuleInput
  ): Promise<PaymentModule>;
  export const paymentServices;

  export function PaymentDirector(
    provider: PaymentProvider,
    context: PaymentContext
  ): IPaymentDirector;

  export function registerAdapter(adapter: typeof IPaymentAdapter): void;
  export function getAdapter(key: string): typeof IPaymentAdapter;

  export class PaymentAdapter implements IPaymentAdapter {
    static key: string;
    static label: string;
    static version: string;
    static typeSupported: (type: PaymentProviderTypeType) => boolean;

    public config: PaymentConfiguration | null;
    public context: PaymentContext | null;

    constructor(config: PaymentConfiguration, context: PaymentContext);
  }
  export const PaymentError: typeof PaymentErrorType;

  export const paymentLogger;

  export const PaymentProviderType: typeof PaymentProviderTypeType;
}

declare module 'meteor/unchained:director-pricing' {
  export class DeliveryPricingAdapter {}
  export type DeliveryPricingAdapterContext = {};
  export type DeliveryPricingCalculation = {};
  export const DeliveryPricingSheet;
  export type DeliveryPricingSheetRowCategory = {};
  export const DeliveryPricingDirector: any; // TODO: define class

  export class OrderPricingAdapter {}
  export type OrderPricingAdapterContext = {};
  export type OrderPricingCalculation = {};
  export const OrderPricingSheet;
  export type OrderPricingSheetRowCategory = {};
  export class OrderPricingDirector {}

  export class PaymentPricingAdapter {}
  export type PaymentPricingAdapterContext = {};
  export type PaymentPricingCalculation = {};
  export const PaymentPricingSheet;
  export type PaymentPricingSheetRowCategory = {};
  export class PaymentPricingDirector {}

  export class ProductPricingAdapter {}
  export type ProductPricingAdapterContext = {};
  export type ProductPricingCalculation = {};
  export const ProductPricingSheet;
  export type ProductPricingSheetRowCategory = {};
  export class ProductPricingDirector {}
}

declare module 'meteor/unchained:core-warehousing' {
  export function configureWarehousingModule(
    params: ModuleInput
  ): Promise<WarehousingModule>;

  export function WarehousingDirector(
    provider: WarehousingProvider
  ): IWarehousingDirector;

  export function registerWarehousingAdapter(
    adapter: typeof IWarehousingAdapter
  ): void;
  export function getWarehousingAdapter(
    key: string
  ): typeof IWarehousingAdapter;

  export class WarehousingAdapter implements IWarehousingAdapter {
    static key: string;
    static label: string;
    static version: string;
    static typeSupported: (type: WarehousingProviderTypeType) => boolean;

    public config: WarehousingProvider['configuration'];
    public context: WarehousingContext;

    constructor(
      config: WarehousingProvider['configuration'],
      context: WarehousingContext
    );
  }
  export const WarehousingError: typeof WarehousingErrorType;

  export const WarehousingProviderType: typeof WarehousingProviderTypeType;
}

declare module 'meteor/unchained:core-worker' {
  export function configureWorkerModule(
    params: ModuleInput
  ): Promise<WorkerModule>;

  export const WorkerDirector: typeof WorkerDirectorType;

  export type WorkerPlugin<Args, Result> = IWorkerPlugin<Args, Result>;
}

declare module 'meteor/unchained:core-users' {
  export function configureUsersModule(
    params: ModuleInput
  ): Promise<UsersModule>;
}

declare module 'meteor/unchained:core-orders' {
  export const Orders: {
    findOrder({ orderId: string }): any;
  };
}

declare module 'meteor/unchained:core-products' {
  export const Products: {
    productExists({ productId: string }): any;
  };
}

declare module 'meteor/unchained:mongodb' {
  export function initDb(): Db;
}
