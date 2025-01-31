import SimpleSchema from 'simpl-schema';
import {
  Collection,
  ModuleMutations,
  ModuleCreateMutation,
  _ID,
  Update,
} from '@unchainedshop/types/common';
import { checkId } from './check-id';
import { generateDbObjectId } from './generate-db-object-id';
import { generateDbFilterById } from './generate-db-filter-by-id';

export const generateDbMutations = <T extends { _id?: _ID }>(
  collection: Collection<T>,
  schema: SimpleSchema,
  options?: {
    hasCreateOnly?: boolean;
    permanentlyDeleteByDefault?: boolean;
  },
): ModuleMutations<T> | ModuleCreateMutation<T> => {
  if (!collection) throw new Error('Collection is missing');
  if (!schema) throw new Error('Schema is missing');

  const { hasCreateOnly, permanentlyDeleteByDefault } = options || {
    hasCreateOnly: false,
    permanentlyDeleteByDefault: false,
  };

  const deletePermanently = async (_id) => {
    checkId(_id);
    const filter = generateDbFilterById(_id);
    const result = await collection.deleteOne(filter);
    return result.deletedCount;
  };

  return {
    create: async (doc, userId) => {
      const values = schema.clean(doc);
      values.created = new Date();
      values.createdBy = userId;
      schema.validate(values);
      values._id = doc._id || generateDbObjectId();

      const result = await collection.insertOne(values);
      return result.insertedId as string;
    },

    update: hasCreateOnly
      ? undefined
      : async (_id, doc, userId) => {
          checkId(_id);

          let modifier: Update<T>;

          if (doc.$set) {
            const values = schema.clean(doc, { isModifier: true });
            modifier = values;
            modifier.$set = values.$set || {};
            modifier.$set.updated = new Date();
            modifier.$set.updatedBy = userId;
          } else {
            const values = schema.clean(doc);
            modifier = { $set: values };
            modifier.$set.updated = new Date();
            modifier.$set.updatedBy = userId;
          }

          schema.validate(modifier, { modifier: true });
          const filter = generateDbFilterById(_id, { deleted: null });
          await collection.updateOne(filter, modifier);

          return _id;
        },

    deletePermanently: hasCreateOnly ? undefined : deletePermanently,

    delete: hasCreateOnly
      ? undefined
      : async (_id, userId) => {
          if (permanentlyDeleteByDefault) {
            return deletePermanently(_id);
          }
          checkId(_id);
          const filter = generateDbFilterById(_id, { deleted: null });
          const modifier = { $set: { deleted: new Date(), deletedBy: userId } };
          const values = schema.clean(modifier, { isModifier: true });
          const result = await collection.updateOne(filter, values);

          return result.modifiedCount;
        },
  };
};
