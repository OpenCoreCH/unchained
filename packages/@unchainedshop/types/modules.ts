import { AccountsModule } from './accounts';
import { AssortmentsModule } from './assortments';
import { BookmarksModule } from './bookmarks';
import { CountriesModule } from './countries';
import { CurrenciesModule } from './currencies';
import { DeliveryModule } from './delivery';
import { EnrollmentsModule } from './enrollments';
import { EventsModule } from './events';
import { FilesModule } from './files';
import { FiltersModule } from './filters';
import { LanguagesModule } from './languages';
import { MessagingModule } from './messaging';
import { OrdersModule } from './orders';
import { PaymentModule } from './payments';
import { ProductsModule } from './products';
import { QuotationsModule } from './quotations';
import { UsersModule } from './user';
import { WarehousingModule } from './warehousing';
import { WorkerModule } from './worker';

export interface Modules {
  accounts: AccountsModule;
  assortments: AssortmentsModule;
  bookmarks: BookmarksModule;
  countries: CountriesModule;
  currencies: CurrenciesModule;
  delivery: DeliveryModule;
  enrollments: EnrollmentsModule;
  events: EventsModule;
  files: FilesModule;
  filters: FiltersModule;
  languages: LanguagesModule;
  messaging: MessagingModule;
  orders: OrdersModule;
  payment: PaymentModule;
  products: ProductsModule;
  quotations: QuotationsModule;
  users: UsersModule;
  warehousing: WarehousingModule;
  worker: WorkerModule;
}
