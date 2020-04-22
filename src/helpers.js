module.exports.getFeatures = function() {
    const features = {};
    Object.keys(FeatureNames).forEach(name => {
        features[name] = false;
    });
    return features;
}

module.exports.getInternalName = function(name) {
    const random = Math.round(Math.random() * 8999 + 1000);
    return _.startCase(_.toLower(name)).replace(/ /g, '') + random;
}

const languages = require('./lang/lang.json');

module.exports.initLanguage = async function() {
    console.log('Loading languages...');
    const strings = {};

    languages.languages.forEach(lang => {
        const langStrings = require('./lang/' + lang.file);

        Object.entries(langStrings).forEach(string => {
            if(!strings[string[0]]) {
                strings[string[0]] = {};
            }
            strings[string[0]][lang.name] = string[1];
        });
    });

    Object.entries(strings).forEach(entry => {
        Modding.addTranslation(entry[0], entry[1]);
    });
    console.log('Loaded languages!');
}

module.exports.copyToClipboard = function(string) {
    const el = document.createElement('textarea');
    el.value = string;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
};