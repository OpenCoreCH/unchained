import { Db, UpdateFilter, ObjectId } from 'mongodb';

export type _ID = string | ObjectId;

export type TimestampFields = {
  created?: Date;
  createdBy?: string;
  updated?: Date;
  updatedBy?: string;
  deleted?: Date;
  deletedBy?: string;
};

export type Query = { [x: string]: any };

export interface ModuleInput {
  db: Db;
}

export interface ModuleMutations<T> {
  create: (doc: T, userId?: string) => Promise<string>;
  update: (_id: string, doc: UpdateFilter<T>, userId?: string) => Promise<void>;
  delete: (_id: string) => Promise<number>;
}
