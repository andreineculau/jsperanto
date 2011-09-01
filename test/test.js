asyncTest('translation', function() {
    var o = {
		lang : 'testlang'
	};
	$.jsperanto(function(t) {
        equal(t('product.name'), 'jsperanto');

        equal(t('withreuse'), 'jsperanto and Home');

        equal(t('withreplacement', {year: 2005}), 'since 2005');

        equal(t('4.level.of.nesting'), '4 level of nesting');

        equal(t('not.existing.key', {defaultValue: 'default'}), 'default');

        equal(t('product.name'), 'jsperanto');

        equal(t('pluralversionexist', {count: 2}), 'plural version of pluralversionexist');

        equal(t('pluralversionexist', {count: 1}), 'singular version of pluralversionexist');

        equal(t('pluralversionexist'), 'singular version of pluralversionexist');

        notEqual(t('pluralversiondoesnotexist', {count: 2}), 'plural version does not exist');

        equal(t('withHTML'), '<b>this would be bold</b>');

        equal(t('count and replacement', {count: 1}), 'you have 1 friend');

        equal(t('count and replacement', {count: 3}), 'you have 3 friends');

		equal($.t('can_speak_plural', {count: 'any'}), 'I can speak any languages', 'count can be a string');

		equal($.t('project.size.source', {value: 4, unit: 'kb'}), 'jsperanto is 4 kb', 'Interpolation variables can be a number');

		equal($.t('project.size.min', {value: 1010, unit: 'bytes'}), 'jsperanto is 1010 bytes when minified', 'options are also used for nested lookup ');

        equal($.t('project.size.gzip', {value: 505, unit: 'bytes'}), 'jsperanto is 505 bytes when minified and gzipped', 'options are also used for nested lookup');

        equal(t('not.existing.key'), 'not.existing.key');

		t('infinite');

        equal(true, true, 'recursive nested lookup should not crash');

		start();
    },  o);
});
