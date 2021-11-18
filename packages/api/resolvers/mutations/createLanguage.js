import { log } from 'unchained-logger';
import { Languages } from 'meteor/unchained:core-languages';

export default function createLanguage(root, { language }, { userId }) {
  log('mutation createLanguage', { userId });
  return Languages.createLanguage({
    ...language,
    authorId: userId,
  });
}
