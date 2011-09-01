/*jslint browser:true */
/*jshint browser:true */
/*global
  jQuery:true
*/
(function(window, document, $) {
	//defaults
	var o = {
        'interpolationPrefix': '__',

        'interpolationSuffix': '__',

        'keyseparator': '.', // keys passed to $.jsperanto.translate use this separator

        'pluralSuffix': '_plural',

        'reusePrefix': '$t(',

        'reuseSuffix': ')',

        'maxRecursion': 50, //used while applying reuse of strings to avoid infinite loop

        'setDollarT': true, // $.t aliases $.jsperanto.translate, nice shortcut

        'dictionaryPath': 'locales', // see Dictionary section

        'dictionary': false, // to supply the dictionary instead of loading it using $.ajax. A (big) javascript object containing your namespaced translations

        'fallbackLang': 'en-US', // see Language fallback section

        'lang': false //specify a language to use
    };

    var pluralNotFound = ['plural_not_found_', Math.random()].join(''); // used internally by translate
	var countRecursion = 0;
	var dictionary = false; //not yet loaded
	var currentLang = false;

	var detectLanguage = function() {
		if (navigator) {
			return navigator.language ? navigator.language : navigator.userLanguage;
		} else {
			return o.fallbackLang;
		}
	};

	var loadDictionary = function(lang, doneCallback) {
		if (o.dictionary) {
			dictionary = o.dictionary;
			doneCallback(lang);
			return;
		}

		$.ajax({
			'url': o.dictionaryPath + '/' + lang + '.json',

			'success': function(data, status, xhr) {
				dictionary = data;
				doneCallback(lang);
			},

			'error': function(xhr, status, error) {
				if (lang != o.fallbackLang) {
					loadDictionary(o.fallbackLang, doneCallback);
				} else {
					doneCallback(false);
				}
			},

			'dataType': 'json'
		});
	};

	var applyReplacement = function(string, replacementHash) {
		$.each(replacementHash, function(key, value) {
			string = string.replace([o.interpolationPrefix, key, o.interpolationSuffix].join(''), value);
		});
		return string;
	};

	var applyReuse = function(translated, options) {
		while (translated.indexOf(o.reusePrefix) != -1) {
			countRecursion++;

            // safety net for too much recursion
			if (countRecursion > o.maxRecursion) {
                break;
            }

			var indexOfOpening = translated.indexOf(o.reusePrefix);
			var indexOfEndOfClosing = translated.indexOf(o.reuseSuffix, indexOfOpening) + o.reuseSuffix.length;
			var token = translated.substring(indexOfOpening, indexOfEndOfClosing);
			var tokenSansSymbols = token.replace(o.reusePrefix, '').replace(o.reuseSuffix, '');
			var translatedToken = doTranslate(tokenSansSymbols, options);

			translated = translated.replace(token, translatedToken);
		}
		return translated;
	};

	var needsPlural = function(options) {
		return (options.count && typeof options.count !== 'string' && options.count > 1);
	};


	/*
	options.defaultValue
	options.count
	*/
	var doTranslate = function(dottedkey, options) {
		options = $.extend({}, options);

		var notFound = options.defaultValue ? options.defaultValue : dottedkey;

        // No dictionary to translate from
		if (!dictionary) {
            return notFound;
        }

		if (needsPlural(options)) {
			var optionsPlural = $.extend({}, options);
            delete optionsPlural.count;
            optionsPlural.defautValue = pluralNotFound;

			var pluralKey = dottedkey + o.pluralSuffix;
			var translated = translate(pluralKey, optionsPlural);

            //apply replacement for count only
			if (translated !== pluralNotFound) {
				return applyReplacement(translated, {
                    'count': options.count
                });
			}
		}

		var keys = dottedkey.split(o.keyseparator);
		var i = 0;
		var value = dictionary;
        while (keys[i]) {
            value = value && value[keys[i]];
            i++;
        }
		if (value) {
			value = applyReplacement(value, options);
			value = applyReuse(value, options);
			return value;
		} else {
			return notFound;
		}
	};

	var translate = function(dottedkey, options) {
		countRecursion = 0;
		return doTranslate(dottedkey, options);
	};

    var translateCapital = function(dottedKey, options) {
        var text = translate(dottedKey, options);
        return text.charAt(0).toUpperCase() + text.substr(1);
    };

    var translateUpperCase  = function(dottedKey, options) {
        var text = translate(dottedKey, options);
        return text.toUpperCase();
    };

	var lang = function(newLang) {
        if (newLang) {
            loadDictionary(newLang, function() {
            });
        } else {
		    return currentLang;
        }
	};

	$.jsperanto = function(callback, options) {
		$.extend(o, options);

		if (!o.lang) {
            o.lang = detectLanguage();
        }

		loadDictionary(o.lang, function(loadedLang) {
			currentLang = loadedLang;

            if (o.setDollarT) {
                $.t = translate;
                $.T = translateCapital;
                $.U = translateUpperCase;
            }

			callback(translate);
		});
    };

    $.extend($.jsperanto, {
        'translate': translate,

		't': translate,

        'T': translateCapital,

        'U': translateUpperCase,

        'detectLanguage': detectLanguage,

		'lang': lang
	});
})(this, this.document, this.jQuery);
