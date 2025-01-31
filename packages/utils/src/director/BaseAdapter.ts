import { IBaseAdapter } from '@unchainedshop/types/common';
import { log, LogLevel } from 'meteor/unchained:logger';

export const BaseAdapter: Omit<IBaseAdapter, 'key' | 'label' | 'version'> = {
  log(message: string, { level = LogLevel.Debug, ...options } = {}) {
    return log(message, { level, ...options });
  },
};
