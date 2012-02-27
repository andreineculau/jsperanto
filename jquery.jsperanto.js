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

        'keySeparator': '.', // keys passed to $.jsperanto.translate use this separator

        'pluralSuffix': '_plural',

        'reusePrefix': '$t(',

        'reuseSuffix': ')',

        'maxRecursion': 50, //used while applying reuse of strings to avoid infinite loop

        'setDollarT': true, // $.t aliases $.jsperanto.translate, nice shortcut

        'dictionaryPath': 'locales', // see Dictionary section

        'dictionary': false, // to supply the dictionary instead of loading it using $.ajax. A (big) javascript object containing your namespaced translations

        'fallbackLocale': 'en_US', // see Locale fallback section

        'locale': false //specify a locale to use
    };

    var pluralNotFound = ['plural_not_found_', Math.random()].join(''); // used internally by translate
    var countRecursion = 0;
    var dictionary = false; //not yet loaded
    var currentLocale = false;

    var detect = function() {
	    if (navigator) {
	        return navigator.language ? navigator.language : navigator.userLanguage;
	    } else {
	        return o.fallbackLocale;
	    }
    };

    var loadDictionary = function(locale, doneCallback) {
	    if (o.dictionary) {
	        dictionary = o.dictionary;
	        doneCallback(locale);
	        return;
	    }

	    $.ajax({
	        'url': o.dictionaryPath + '/' + locale + '.json',

	        'success': function(data, status, xhr) {
		        dictionary = data;
		        doneCallback(locale);
	        },

	        'error': function(xhr, status, error) {
		        if (locale != o.fallbackLocale) {
		            loadDictionary(o.fallbackLocale, doneCallback);
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

	    var keys, i, value;

        if (dictionary[dottedkey]) {
            value = dictionary[dottedkey];
	        value = applyReplacement(value, options);
	        value = applyReuse(value, options);
	        return value;
        }

	    keys = dottedkey.split(o.keySeparator);
	    i = 0;
	    value = dictionary;
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

    var locale = function() {
	    return currentLocale;
    };

    $.jsperanto = function(callback, options) {
	    $.extend(o, options);

	    if (!o.locale || o.locale === 'detect') {
            o.locale = detect();
        }

	    loadDictionary(o.locale, function(loadedLocale) {
	        currentLocale = loadedLocale;

            if (o.setDollarT) {
                $.t = translate;
                $.T = translateCapital;
                $.U = translateUpperCase;
            }

            if (typeof callback === 'function') {
		        callback(translate);
            }
	    });
    };

    $.extend($.jsperanto, {
        'translate': translate,

	    't': translate,

        'T': translateCapital,

        'U': translateUpperCase,

        'detect': detect,

	    'locale': locale
    });
})(this, this.document, this.jQuery);
