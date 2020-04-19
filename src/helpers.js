module.exports.getFeatures = function() {
    const features = {};
    Object.keys(FeatureNames).forEach(name => {
        features[name] = false;
    });
    return features;
}

module.exports.getInternalName = function(name) {
    return _.startCase(_.toLower(name)).replace(/ /g, '');
}

const languages = {
    en: require('./lang/en.json'),
    de: require('./lang/de.json'),
};

module.exports.initLanguage = function() {
    console.log('Loading languages...');
    Object.entries(languages).forEach(entry => {
        const [lang, data] = entry;
        console.log('Loading', lang);
        
        Object.entries(data.strings).forEach(string => {
            Modding.addTranslation(string[0], {[lang]: string[1]});
        });
    });
    console.log('Loaded languages!');
}