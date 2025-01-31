import { IWorkerAdapter } from '@unchainedshop/types/worker';
import { WorkerDirector, WorkerAdapter } from 'meteor/unchained:core-worker';

export const ExternalWorkerPlugin: IWorkerAdapter<void, void> = {
  ...WorkerAdapter,

  key: 'shop.unchained.worker-plugin.external',
  label: 'External plugin as a placeholder for workers who interact with the system only via GraphQL',
  version: '1.0',
  type: 'EXTERNAL',

  async doWork() {
    throw new Error('Cannot do work for external workers');
  },
};

WorkerDirector.registerAdapter(ExternalWorkerPlugin);
