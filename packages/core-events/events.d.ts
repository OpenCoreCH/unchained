import { ContextNormalizerFunction } from './director';

declare module 'meteor/unchained:core-events' {
  const emit: any;
  const registerEvents: any;
  const subscribe: any;
  const defaultNormalizer: ContextNormalizerFunction;
  const setContextNormalizer: ContextNormalizerFunction;

  export {
    emit,
    registerEvents,
    subscribe,
    setContextNormalizer,
    defaultNormalizer,
    ContextNormalizerFunction,
  };
}
