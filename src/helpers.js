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
    it: require('./lang/it.json'),
};

module.exports.initLanguage = async function() {
    console.log('Loading languages...');
    const strings = {};
    Object.entries(languages).forEach(entry => {
        const [lang, data] = entry;
        console.log('Loading', lang);
        
        Object.entries(data.strings).forEach(string => {
            if(!strings[string[0]]) {
                strings[string[0]] = {};
            }
            strings[string[0]][lang] = string[1];
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