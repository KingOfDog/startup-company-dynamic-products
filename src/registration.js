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

    if(!component.displayName) {
        component.displayName = component.name;
        component.name = getInternalName(component.name);
    }

    ComponentNames[component.name] = component.name;
    Components.push(component);

    ResearchItemNames[component.name] = component.name;
    ResearchItems.push({
        name: component.name,
        category: 'Production',
        unlockType: 'Component',
        points: 5,
        unlocks: [component.name],
    });

    Modding.addTranslation(component.name, {
        en: component.displayName,
    });
    Modding.addTranslation(component.name + '_description', {
        en: component.displayName,
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

    if (FeatureNames[feature.name]) {
        console.log('Skipping feature', feature, 'because it already exists');
        return;
    }

    if(!feature.displayName) {
        feature.displayName = feature.name;
        feature.name = getInternalName(feature.name);
    }

    // Add feature
    FeatureNames[feature.name] = feature.name;
    Features.push(feature);

    // Add research items
    ResearchItemNames[feature.name] = feature.name;
    ResearchItems.push({
        name: feature.name,
        category: 'Features',
        unlockType: 'Feature',
        points: feature.researchPoints,
    });

    // Add feature to specified product types
    feature.availableProducts.map(name => ProductTypes.find(product => product.name == name)).forEach(product => {
        if (product) {
            product.features.push(feature.name);
        }
    });

    // Add language strings
    Modding.addTranslation(feature.name, {
        en: feature.displayName,
    });
    // TODO: Add option for description
    Modding.addTranslation(feature.name + '_description', {
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

    if (FrameworkNames[framework.name]) {
        console.log('Skipping framework', framework, 'because it already exists');
        return;
    }

    if(!framework.displayName) {
        framework.displayName = framework.name;
        framework.name = getInternalName(framework.name);
    }

    // Add framework
    FrameworkNames[framework.name] = framework.name;

    const clone = Helpers.Clone(framework);
    clone.logoPath = modPath + 'thumbnail.png';
    clone.order = _.maxBy(Frameworks, e => e.order).order + 1;
    delete clone.researchPoints;
    Frameworks.push(clone);

    // Add research items
    ResearchItemNames[framework.name] = framework.name;
    ResearchItems.push({
        name: framework.name,
        category: 'Frameworks',
        unlockType: 'Framework',
        points: framework.researchPoints,
    });

    // Add language strings
    Modding.addTranslation(framework.name, {
        en: framework.displayName,
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

    if (ProductTypeNames[product.name]) {
        console.log('Skipping product', product, 'because it already exists');
        return;
    }

    if(!product.displayName) {
        product.displayName = product.name;
        product.name = getInternalName(product.name);
    }

    ProductTypeNames[product.name] = product.name;
    ProductTypes.push(product);
    Modding.addTranslation(product.name, {
        en: product.displayName
    });

    if (addToSettings) {
        if (!GetRootScope().settings[config.name].products) {
            GetRootScope().settings[config.name].products = [];
        }
        GetRootScope().settings[config.name].products.push(product);
    }
}