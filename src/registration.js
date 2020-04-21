const {
    getInternalName
} = require('./helpers');

const config = require('./config.json');

module.exports.registerCompetitor = function (competitor, addToSettings = true) {
    console.log('Registering competitor', competitor);
    if (GetRootScope().settings.competitorProducts.find(product => product.name == competitor.name)) {
        console.log('Skipping competitor', competitor, 'as it already exists');
        return;
    }

    const internalName = getInternalName(competitor.name);
    const stockPrice = Helpers.CalculateStockPrice(competitor, Helpers.CalculateValuation(competitor));

    GetRootScope().settings.competitorProducts.push({
        id: internalName,
        name: competitor.name,
        logoPath: competitor.logoPath,
        logoColorDegree: competitor.logoColorDegree,
        users: competitor.users,
        productTypeName: competitor.productTypeName,
        version: 100,
        controlled: false,
        history: [{
            day: 1,
            stockPrice: stockPrice,
            users: competitor.users,
            week: 1,
        }],
        stockVolume: competitor.stockVolume,
        ownedStocks: 0,
        dealResults: [],
        stockTransactions: [],
        priceExpectations: Math.round((Math.random() * 3 + 2) * 10) / 10,
    });

    if (addToSettings) {
        if (!GetRootScope().settings[config.name].competitors) {
            GetRootScope().settings[config.name].competitors = [];
        }
        GetRootScope().settings[config.name].competitors.push(competitor);
    }
}

module.exports.registerComponent = function(component, addToSettings= true) {
    console.log('Registering component', component);
    if(Object.keys(ComponentNames).find(name => name == component.name)) {
        console.log('Skipping component', component, 'as it already exists');
        return;
    }

    const internalName = getInternalName(component.name);
    const clone = Helpers.Clone(component);
    clone.name = internalName;
    
    ComponentNames[internalName] = internalName;
    Components.push(clone);

    ResearchItemNames[internalName] = internalName;
    ResearchItems.push({
        name: internalName,
        category: 'Production',
        unlockType: 'Component',
        points: 5,
        unlocks: [internalName],
    });

    Modding.addTranslation(internalName, {
        en: component.name,
    });
    Modding.addTranslation(internalName + '_description', {
        en: component.name,
    });

    if(addToSettings) {
        if(!GetRootScope().settings[config.name].components) {
            GetRootScope().settings[config.name].components = [];
        }
        GetRootScope().settings[config.name].components.push(component);
    }
}

module.exports.registerFeature = function (feature, addToSettings = true) {
    console.log('Registering feature', feature);
    const internalName = getInternalName(feature.name);

    if (FeatureNames[internalName]) {
        console.log('Skipping feature', feature, 'because it already exists');
        return;
    }

    // Add feature
    FeatureNames[internalName] = internalName;
    const clone = Helpers.Clone(feature);
    clone.name = internalName;
    Features.push(clone);

    // Add research items
    ResearchItemNames[internalName] = internalName;
    ResearchItems.push({
        name: internalName,
        category: 'Features',
        unlockType: 'Feature',
        points: feature.researchPoints,
    });

    // Add feature to specified product types
    feature.availableProducts.map(name => ProductTypes.find(product => product.name == name)).forEach(product => {
        if (product) {
            product.features.push(internalName);
        }
    });

    // Add language strings
    Modding.addTranslation(internalName, {
        en: feature.name
    });
    // TODO: Add option for description
    Modding.addTranslation(internalName + '_description', {
        en: 'The multipurpose feature ' + feature.name + ' enables every animal, human, robot and plant to live together in harmony. <3'
    });

    if (addToSettings) {
        if (!GetRootScope().settings[config.name].features) {
            GetRootScope().settings[config.name].features = [];
        }
        GetRootScope().settings[config.name].features.push(feature);
    }
}

module.exports.registerFramework = function (framework, modPath, addToSettings = true) {
    console.log('Registering framework', framework);
    const internalName = getInternalName(framework.name);

    if (FrameworkNames[internalName]) {
        console.log('Skipping framework', framework, 'because it already exists');
        return;
    }

    // Add framework
    FrameworkNames[internalName] = internalName;

    const clone = Helpers.Clone(framework);
    clone.name = internalName;
    clone.logoPath = modPath + 'thumbnail.png';
    clone.order = _.maxBy(Frameworks, e => e.order).order + 1;
    delete clone.researchPoints;
    Frameworks.push(clone);

    // Add research items
    ResearchItemNames[internalName] = internalName;
    ResearchItems.push({
        name: internalName,
        category: 'Frameworks',
        unlockType: 'Framework',
        points: framework.researchPoints,
    });

    // Add language strings
    Modding.addTranslation(internalName, {
        en: framework.name,
    });

    if (addToSettings) {
        if (!GetRootScope().settings[config.name].frameworks) {
            GetRootScope().settings[config.name].frameworks = [];
        }
        GetRootScope().settings[config.name].frameworks.push(framework);
    }
}

module.exports.registerProduct = function (product, addToSettings = true) {
    console.log('Registering product', product);
    const internalName = getInternalName(product.name);

    if (ProductTypeNames[internalName]) {
        console.log('Skipping product', product, 'because it already exists');
        return;
    }

    ProductTypeNames[internalName] = internalName;
    const productCopy = JSON.parse(JSON.stringify(product));
    productCopy.name = internalName
    ProductTypes.push(productCopy);
    Modding.addTranslation(internalName, {
        en: product.name
    });

    if (addToSettings) {
        if (!GetRootScope().settings[config.name].products) {
            GetRootScope().settings[config.name].products = [];
        }
        GetRootScope().settings[config.name].products.push(product);
    }
}