let _modPath;

const modName = "Dynamic Products";

const searchEnginePreset = require('./presets/search-engine.json');

/*exports.onBackgroundWorkerStart = () => {
    console.log('hier bin ich');
    FeatureNames.Test = 'Test';
    Features.push({
        name: 'Test',
        level: Enums.EmployeeLevels.Expert,
        requirements: {
            ContentManagementModule: 1,
            UiComponent: 1,
            BlueprintComponent: 1
        },
        faIcon: "fa-file-video-o",
        categoryName: Enums.FeatureCategories.Users
    });
};

ResearchItemNames.Test = 'Test';
ResearchItems.push({
    name: 'Test',
    category: ResearchCategories.Features,
    points: 30,
    unlockType: "Feature"
});*/

exports.initialize = (modPath) => {
    _modPath = modPath;

    Modding.setMenuItem({
        name: 'dynamic',
        tooltip: modName,
        tooltipPosition: 'top',
        faIcon: 'fa-cubes',
        badgeCount: 0,
    });

    /*FeatureNames.Test = 'Test';
    Features.push({
        name: FeatureNames.Test,
        level: Enums.EmployeeLevels.Expert,
        requirements: {
            ContentManagementModule: 1,
            UiComponent: 1,
            BlueprintComponent: 1
        },
        faIcon: "fa-file-video-o",
        categoryName: Enums.FeatureCategories.Users
    });*/

    exports.views = [{
        name: 'dynamic',
        viewPath: _modPath + 'view.html',
        controller: ['$scope', function ($scope) {
            // Get Language String
            this.getString = (key) => {
                return Language[key.toLowerCase()]
            };



            this.uploadFile = (files) => {
                console.log(files);

            };




            this.tab = 'Home';
            this.tabs = [{
                    name: 'Home',
                    icon: 'fa-home',
                },
                {
                    name: 'Competitors',
                    icon: 'fa-building',
                },
                {
                    name: 'Features',
                    icon: 'fa-cubes',
                },
                {
                    name: 'Products',
                    icon: 'fa-cube',
                },
            ];

            this.name = '';
            this.faIcon = '';
            this.features = getFeatures();
            this.productType = '';
            this.researchPoints = 0;
            this.category = '';
            this.requirements = {};
            this.newRequirement = '';
            this.level = '';
            this.dissatisfaction = 0;
            this.users = 0;
            this.stockVolume = 0;
            this.logo = '';
            this.audienceGender = null;
            this.audienceAges = [];
            this.audienceInterests = [];

            this.components = Components.map(component => {
                return {
                    label: this.getString(component.name),
                    component: component
                }
            });
            this.productTypes = ProductTypes.map(productType => {
                return {
                    label: this.getString(productType.name),
                    productType: productType,
                };
            });
            this.featureCategories = FeatureCategories;
            this.featureLevels = Object.keys(EmployeeLevels).map(level => {
                return {
                    name: level
                }
            });
            this.logos = _.range(1, 100).map(n => ({
                number: n,
                url: `images/logos/companies/${n}.png`,
            }));
            this.audiences = {
                genders: ['male', 'female'],
                ages: ['age_group1', 'age_group2', 'age_group3'],
                interests: Object.keys(MarketingInterests),
            };

            this.presets = [searchEnginePreset];

            // Competitors Section
            this.submitCompetitor = () => {

                const newCompetitor = {
                    name: this.name,
                    logoPath: this.logo.url,
                    logoColorDegree: 300,
                    users: this.users,
                    stockVolume: this.stockVolume,
                    stockPrice: 0,
                    productTypeName: this.productType.productType.name,
                };

                registerCompetitor(newCompetitor);

                this.reset();
            };

            // Features Section
            // TODO: implement features
            this.onRequirementCountChange = () => {
                Object.entries(this.requirements).forEach(entry => {
                    if (entry[1].count <= 0) {
                        delete this.requirements[entry[0]];
                    }
                });
            };

            this.addNewRequirement = () => {
                if (!this.components.includes(this.newRequirement)) {
                    return;
                }

                const componentName = this.newRequirement.component.name;
                if (!this.requirements[componentName]) {
                    this.requirements[componentName] = {
                        component: this.newRequirement.component,
                        count: 0
                    };
                }
                this.requirements[componentName].count++;

                this.newRequirement = '';
                this.showList = false;
            };

            this.isFeatureValid = () => {
                if (this.name == '' || this.faIcon == '' || this.category == '') {
                    return false;
                }

                if (this.category.name == 'Users' && this.level == '') {
                    return false;
                }

                return true;
            }

            this.submitFeature = () => {
                if (!this.isFeatureValid() || true) {
                    return;
                }

                const newFeature = {
                    name: this.name,
                    faIcon: this.faIcon,
                    categoryName: this.category.name,
                    level: this.level.name,
                    requirements: this.requirements,
                    dissatisfaction: this.dissatisfaction,
                    researchPoints: this.researchPoints,
                };
                console.log(newFeature);

                registerFeature(newFeature);
                if (!GetRootScope().settings[modName].features) {
                    GetRootScope().settings[modName].features = [];
                }
                GetRootScope().settings[modName].features.push(newFeature);

                // Reset inputs
                this.reset();
            };

            // Products Section
            this.clickAudienceAge = (age) => {
                if (age == null) {
                    this.audienceAges = [];
                    return;
                }
                if (this.audienceAges.includes[age]) {
                    this.audienceAges.splice(this.audienceAges.indexOf(age), 1);
                } else {
                    this.audienceAges.push(age);
                }
                if (this.audienceAges.length == 3) {
                    this.audienceAges = [];
                }
            };
            this.clickAudienceInterest = (interest) => {
                if (interest == null) {
                    this.audienceInterests = [];
                    return;
                }
                if (this.audienceInterests.includes[interest]) {
                    this.audienceInterests.splice(this.audienceInterests.indexOf(interest), 1);
                } else {
                    this.audienceInterests.push(interest);
                }
                if (this.audienceInterests.length == this.audiences.interests.length) {
                    this.audienceInterests = [];
                }
            };

            this.submitProduct = () => {
                const audienceMatches = [];
                if (this.audienceGender) {
                    audienceMatches.push(this.audienceGender);
                }
                audienceMatches.push(...this.audienceAges);
                audienceMatches.push(...this.audienceInterests);

                const newProduct = {
                    name: this.name,
                    features: Object.keys(this.features).filter(name => this.features[name]),
                    audienceMatches: audienceMatches,
                    faIcon: this.faIcon,
                };
                console.log(newProduct);

                registerProduct(newProduct);
                if (!GetRootScope().settings[modName].products) {
                    GetRootScope().settings[modName].products = [];
                }
                GetRootScope().settings[modName].products.push(newProduct);

                // Reset inputs
                this.reset();
            };

            // Preset import
            this.importPresetConfirmation = (preset) => {
                GetRootScope().confirm("", "Are you sure that you want to import this pack? This action can currently not be undone.", () => {
                    this.importPreset(preset);
                });
            };

            this.importPreset = (preset) => {
                if (preset.products) {
                    preset.products.forEach(product => registerProduct(product));
                }
                if (preset.competitors) {
                    preset.competitors.forEach(competitor => registerCompetitor(competitor));
                }

                Helpers.ShowSuccessMessage("Successfully imported preset", "Have fun playing with the additions")
            };

            this.reset = () => {
                this.name = '';
                this.faIcon = '';
                this.features = getFeatures();
                this.researchPoints = 0;
                this.category = '';
                this.requirements = {};
                this.newRequirement = '';
                this.dissatisfaction = 0;
                this.productType = '';
                this.level = '';
                this.users = 0;
                this.stockVolume = 0;
                this.logo = '';
                this.audienceGender = null;

                this.productTypes = ProductTypes.map(productType => {
                    return {
                        label: this.getString(productType.name),
                        productType: productType,
                    };
                });
            };
        }]
    }];
};

exports.onLoadGame = settings => {
    if (!settings[modName]) {
        settings[modName] = {
            features: [],
            products: [],
        };
    }
    settings[modName].products.forEach(product => {
        console.log(product);
        registerProduct(product);
    });
};

function getFeatures() {
    const features = {};
    Object.keys(FeatureNames).forEach(name => {
        features[name] = false;
    });
    return features;
}

function getInternalName(name) {
    return name.replace(/ /g, '');
}

function registerCompetitor(competitor) {
    const internalName = getInternalName(competitor.name);
    const stockPrice = Helpers.CalculateStockPrice(competitor, Helpers.CalculateValuation(competitor));

    if(GetRootScope().settings.competitorProducts.find(product => product.name == internalName)) {
        console.log('Skipping competitor', competitor, 'as it already exists');
        return;
    }

    GetRootScope().settings.competitorProducts.push({
        id: internalName,
        name: internalName,
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
    Modding.addTranslation(internalName, {
        en: competitor.name
    });
}

function registerFeature(feature) {
    return;
    const internalName = getInternalName(feature.name);

    FeatureNames[internalName] = internalName;
    const featureCopy = JSON.parse(JSON.stringify(feature));
    featureCopy.name = internalName;
    Features.push(featureCopy);

    ResearchItemNames[internalName] = internalName;
    ResearchItems.push({
        name: internalName,
        category: 'Features',
        unlockType: 'Feature',
        points: feature.researchPoints,
    });

    Modding.addTranslation(internalName, {
        en: feature.name
    });
    // TODO: Add option for description
    Modding.addTranslation(internalName + '_description', {
        en: ''
    });
}

function registerFramework(framework) {

}

function registerProduct(product) {
    const internalName = getInternalName(product.name);

    if(ProductTypeNames[internalName]) {
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
}