import { test } from 'qunit';
import moduleForAcceptance from 'hospitalrun/tests/helpers/module-for-acceptance';

function verifyPricingLists(path, includesPrices, excludesPrices, assert) {
  runWithPouchDump('billing', function() {
    authenticateUser();
    visit(path);
    andThen(function() {
      assert.equal(currentURL(), path);
      includesPrices.forEach(function(priceName) {
        assert.equal(find(`.price-name:contains(${priceName})`).length, 1, `${priceName} displays`);
      });
      excludesPrices.forEach(function(priceName) {
        assert.equal(find(`.price-name:contains(${priceName})`).length, 0, `${priceName} is not present`);
      });

    });
  });
}

moduleForAcceptance('Acceptance | pricing');

test('visiting /pricing', function(assert) {
  let includesPrices = [
    'Xray Hand',
    'Blood test',
    'Leg Casting',
    'Gauze pad'
  ];
  verifyPricingLists('/pricing', includesPrices, [], assert);
});

test('visiting /pricing/imaging', function(assert) {
  let excludesPrices = [
    'Blood test',
    'Leg Casting',
    'Gauze pad'
  ];
  let includesPrices = [
    'Xray Hand'
  ];
  verifyPricingLists('/pricing/imaging', includesPrices, excludesPrices, assert);

});

test('visiting /pricing/lab', function(assert) {
  let excludesPrices = [
    'Xray Hand',
    'Leg Casting',
    'Gauze pad'
  ];
  let includesPrices = [
    'Blood test'
  ];
  verifyPricingLists('/pricing/lab', includesPrices, excludesPrices, assert);
});

test('visiting /pricing/procedure', function(assert) {
  let excludesPrices = [
    'Xray Hand',
    'Blood test',
    'Gauze pad'
  ];
  let includesPrices = [
    'Leg Casting'
  ];
  verifyPricingLists('/pricing/procedure', includesPrices, excludesPrices, assert);
});

test('visiting /pricing/ward', function(assert) {
  let excludesPrices = [
    'Xray Hand',
    'Blood test',
    'Leg Casting'
  ];
  let includesPrices = [
    'Gauze pad'
  ];
  verifyPricingLists('/pricing/ward', includesPrices, excludesPrices, assert);
});

test('create new price', function(assert) {
  runWithPouchDump('billing', function() {
    authenticateUser();
    visit('/pricing/edit/new');
    andThen(function() {
      assert.equal(currentURL(), '/pricing/edit/new');
      fillIn('.price-name input', 'Xray Foot');
      fillIn('.price-amount input', 100);
      fillIn('.price-department input', 'Imaging');
      select('.price-category', 'Imaging');
      click('button:contains(Add):last');
      waitToAppear('.modal-dialog');
      andThen(() => {
        assert.equal(find('.modal-title').text(), 'Pricing Item Saved', 'Pricing Item saved');
        click('button:contains(Ok)');
      });
      andThen(() => {
        click('button:contains(Add Override)');
        waitToAppear('.modal-dialog');
      });
      andThen(() => {
        assert.equal(find('.modal-title').text(), 'Add Override', 'Add Override Dialog displays');
        select('.pricing-profile', 'Half off');
        fillIn('.pricing-override-price input', 20);
      });
      andThen(() => {
        click('button:contains(Add):last');
        waitToAppear('.override-profile');
      });
      andThen(() => {
        assert.equal(find('.override-profile').text(), 'Half off', 'Pricing override saved');
      });
    });
  });
});

test('delete price', function(assert) {
  runWithPouchDump('billing', function() {
    authenticateUser();
    visit('/pricing/lab');
    andThen(function() {
      assert.equal(currentURL(), '/pricing/lab');
      assert.equal(find('.price-name:contains(Blood test)').length, 1, 'Price exists to delete');
      click('button:contains(Delete)');
    });
    waitToAppear('.modal-dialog');
    andThen(() => {
      assert.equal(find('.alert').text().trim(), 'Are you sure you wish to delete Blood test?', 'Pricing item is displayed for deletion');
    });
    click('button:contains(Delete):last');
    waitToDisappear('.price-name:contains(Blood test)');
    andThen(() => {
      assert.equal(find('.price-name:contains(Blood test)').length, 0, 'Price disappears from price list');
    });
  });
});

test('create new pricing profile', function(assert) {
  runWithPouchDump('billing', function() {
    authenticateUser();
    visit('/pricing/profiles');
    andThen(function() {
      assert.equal(currentURL(), '/pricing/profiles');
      click('button:contains(+ new item)');
      waitToAppear('.modal-dialog');
      andThen(() => {
        assert.equal(find('.modal-title').text(), 'New Pricing Profile', 'New Pricing Profile modal appears');
      });
      fillIn('.pricing-profile-name input', 'Quarter Off');
      fillIn('.pricing-profile-percentage input', 25);
      fillIn('.pricing-profile-discount input', 10);
      andThen(() => {
        click('button:contains(Add)');
      });
      waitToAppear('.modal-title:contains(Pricing Profile Saved)');
      click('button:contains(Ok)');
      waitToAppear('.pricing-profile-name:contains(Quarter Off)');
      andThen(() => {
        assert.equal(find('.pricing-profile-name:contains(Quarter Off)').text(), 'Quarter Off', 'New price profile displays');
      });
    });
  });
});

test('delete pricing profile', function(assert) {
  runWithPouchDump('billing', function() {
    authenticateUser();
    visit('/pricing/profiles');
    andThen(function() {
      assert.equal(currentURL(), '/pricing/profiles');
      assert.equal(find('.pricing-profile-name:contains(Half off)').length, 1, 'Pricing profile exists to delete');
      click('button:contains(Delete)');
    });
    waitToAppear('.modal-dialog');
    andThen(() => {
      assert.equal(find('.modal-title').text().trim(), 'Delete Profile', 'Pricing Profile delete confirmation is displayed');
    });
    click('button:contains(Ok)');
    waitToDisappear('.pricing-profile-name:contains(Half off)');
    andThen(() => {
      assert.equal(find('.pricing-profile-name:contains(Half off)').length, 0, 'Pricing profile disappears from list');
    });
  });
});

test('Searching pricing', function(assert) {
  runWithPouchDump('billing', function() {
    authenticateUser();
    visit('/pricing');

    fillIn('[role="search"] div input', 'Xray Hand');
    click('.glyphicon-search');

    andThen(() => {
      assert.equal(currentURL(), '/pricing/search/Xray%20Hand', 'Searched for Name: Xray Hand');
      assert.equal(find('button:contains(Delete)').length, 3, 'There are 3 search items');
    });

    fillIn('[role="search"] div input', 'Blood');
    click('.glyphicon-search');

    andThen(() => {
      assert.equal(currentURL(), '/pricing/search/Blood', 'Searched for Name: Blood');
      assert.equal(find('button:contains(Delete)').length, 1, 'There is one search item');
    });

    fillIn('[role="search"] div input', 'Leg');
    click('.glyphicon-search');

    andThen(() => {
      assert.equal(currentURL(), '/pricing/search/Leg', 'Searched for Name: Leg');
      assert.equal(find('button:contains(Delete)').length, 2, 'There are 2 search items');
    });

    fillIn('[role="search"] div input', 'Gauze');
    click('.glyphicon-search');

    andThen(() => {
      assert.equal(currentURL(), '/pricing/search/Gauze', 'Searched for Name: Gauze');
      assert.equal(find('button:contains(Delete)').length, 2, 'There are 2 search items');
    });

    fillIn('[role="search"] div input', 'xray');
    click('.glyphicon-search');

    andThen(() => {
      assert.equal(currentURL(), '/pricing/search/xray', 'Searched for all lower case xray');
      assert.equal(find('button:contains(Delete)').length, 3, 'There is one search item');
    });

    fillIn('[role="search"] div input', 'ItemNotFound');
    click('.glyphicon-search');

    andThen(() => {
      assert.equal(currentURL(), '/pricing/search/ItemNotFound', 'Searched for ItemNotFound');
      assert.equal(find('.clickable').length, 0, 'There is no search result');
    });
  });
});
