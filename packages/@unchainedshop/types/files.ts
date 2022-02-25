import { Context } from './api';
import {
  FindOptions,
  IBaseAdapter,
  IBaseDirector,
  ModuleMutations,
  TimestampFields,
  _ID,
} from './common';

export type File = {
  _id?: _ID;
  expires?: Date;
  path: string;
  meta?: Record<string, unknown>;
  name: string;
  size?: number;
  type?: string;
  url?: string;
} & TimestampFields;

/*
 * Module
 */

type UploadFileCallback = (file: File, context: Context) => Promise<void>;

type SignedFileUpload = {
  _id: _ID;
  expires?: Date;
  putURL: string;
};

export type FilesModule = ModuleMutations<File> & {
  // Query
  findFile: (params: { fileId?: string }, options?: FindOptions) => Promise<File>;

  findFilesByMetaData: (
    params: {
      meta: Record<string, any>;
    },
    options?: FindOptions,
  ) => Promise<Array<File>>;

  findFiles: (selector: any) => Promise<Array<File>>;

  deleteMany: (fileIds: Array<_ID>, userId: string) => Promise<void>;
};

/*
 * Services
 */

export type LinkFileService = (
  params: { fileId: string; size: number; type: string },
  context: Context,
) => Promise<File>;

export type CreateSignedURLService = (
  params: { directoryName: string; fileName: string; meta?: any; userId?: string },
  context: Context,
) => Promise<File>;

export type UploadFileFromStreamService = (
  params: { directoryName: string; rawFile: any; meta?: any; userId?: string },
  context: Context,
) => Promise<File>;

export type RemoveFilesService = (params: { fileIds: Array<_ID> }, context: Context) => Promise<number>;

export type UploadFileFromURLService = (
  params: {
    directoryName: string;
    fileInput: { fileLink: string; fileName: string };
    meta?: any;
    userId?: string;
  },
  context: Context,
) => Promise<File>;

export interface FileServices {
  linkFile: LinkFileService;
  uploadFileFromStream: UploadFileFromStreamService;
  uploadFileFromURL: UploadFileFromURLService;
  createSignedURL: CreateSignedURLService;
  removeFiles: RemoveFilesService;
}

/*
 * Director
 */

export interface UploadFileData {
  directoryName: string;
  expiryDate: Date;
  fileName: string;
  hash: string;
  hashedName: string;
  size?: number;
  type: string;
  url: string;
}

export interface IFileAdapter extends IBaseAdapter {
  createSignedURL: (
    directoryName: string,
    fileName: string,
    unchainedContext: Context,
  ) => Promise<UploadFileData | null>;
  removeFiles: (files: Array<File>, unchainedContext: Context) => Promise<void>;
  uploadFileFromStream: (
    directoryName: string,
    rawFile: any,
    unchainedContext: Context,
  ) => Promise<UploadFileData | null>;
  uploadFileFromURL: (
    directoryName: string,
    fileInput: { fileLink: string; fileName: string },
    unchainedContext: Context,
  ) => Promise<UploadFileData | null>;
}

export type IFileDirector = IBaseDirector<IFileAdapter> & {
  registerFileUploadCallback: (directoryName: string, callback: UploadFileCallback) => void;
  getFileUploadCallback: (directoryName: string) => UploadFileCallback;
};
