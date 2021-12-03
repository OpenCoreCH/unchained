import { assert } from 'chai';
import { initDb } from 'meteor/unchained:mongodb';
import { configureFilesModule } from 'meteor/unchained:core-files-next';
import { Mongo } from 'meteor/mongo';

describe('Test exports', () => {
  let module;

  before(async () => {
    const db = initDb();
    module = await configureFilesModule({ db });
  });

  it('Check Bookmarks module', async () => {
    assert.ok(module);
    assert.isFunction(module.findCurrency);
    assert.isFunction(module.findFiles);
    assert.isFunction(module.currencyExists);
    assert.isFunction(module.create);
    assert.isFunction(module.update);
    assert.isFunction(module.delete);
  });

  it('Mutate currency', async () => {
    const currencyId = await module.create(
      {
        authorId: 'Test-User-1',
        isoCode: 'CHF',
      },
      'Test-User-1'
    );

    assert.ok(currencyId);
    const currency = await module.findCurrency(currencyId);

    assert.ok(currency);
    assert.equal(currency._id, currencyId);
    assert.equal(currency.isoCode, 'CHF');
    assert.equal(currency.userId, 'Test-User-1');
    assert.isDefined(currency.created);
    assert.isUndefined(currency.updated);
    assert.isUndefined(currency.updatedBy);
    assert.equal(currency.createdBy, 'Test-User-1');

    const deletedCount = await module.delete(currencyId);
    assert.equal(deletedCount, 1);
  });
});
