import SimpleSchema from 'simpl-schema';
import { AddressSchema } from './AddressSchema';
import { timestampFields } from './commonSchemaFields';

const ProfileSchema = new SimpleSchema(
  {
    displayName: String,
    birthday: Date,
    phoneMobile: String,
    gender: String,
    address: AddressSchema,
    customFields: {
      type: Object,
      optional: true,
      blackbox: true,
    },
  },
  { requiredByDefault: false },
);

export const LastLoginSchema = new SimpleSchema(
  {
    timestamp: Date,
    locale: String,
    countryContext: String,
    remoteAddress: String,
    remotePort: String,
    userAgent: String,
  },
  { requiredByDefault: false },
);

export const LastContactSchema = new SimpleSchema(
  {
    telNumber: String,
    emailAddress: String,
  },
  { requiredByDefault: false },
);

export const UserSchema = new SimpleSchema(
  {
    emails: Array,
    'emails.$': Object,
    'emails.$.address': String,
    'emails.$.verified': Boolean,
    username: String,
    lastLogin: LastLoginSchema,
    profile: ProfileSchema,
    lastBillingAddress: AddressSchema,
    lastContact: LastContactSchema,
    guest: Boolean,
    initialPassword: Boolean,
    tags: Array,
    'tags.$': String,
    avatarId: String,
    services: {
      type: Object,
      optional: true,
      blackbox: true,
    },
    roles: Array,
    'roles.$': String,
    ...timestampFields,
  },
  { requiredByDefault: false },
);
