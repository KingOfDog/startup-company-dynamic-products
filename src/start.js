let _modPath;

const config = require('./config.json');

const {
    registerCompetitor,
    registerFeature,
    registerFramework,
    registerProduct,
} = require('./registration');

const {
    getFeatures,
    initLanguage,
} = require('./helpers');

const presets = [
    require('./presets/search-engine.json'),
    require('./presets/instant-messenger.json'),
    require('./presets/language-plattform.json'),
    require('./presets/online-forum.json'),
    require('./presets/travel-planning.json'),
];

exports.initialize = (modPath) => {
    _modPath = modPath;

    Modding.setMenuItem({
        name: 'dynamic',
        tooltip: config.name,
        tooltipPosition: 'top',
        faIcon: 'fa-cubes',
        badgeCount: 0,
    });

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
                    icon: 'fa-industry',
                },
                {
                    name: 'Features',
                    icon: 'fa-gear',
                },
                {
                    name: 'Frameworks',
                    icon: 'fa-microchip',
                },
                {
                    name: 'Products',
                    icon: 'fa-cubes',
                },
            ];

            this.name = '';
            this.faIcon = '';
            this.features = getFeatures();
            this.productType = '';
            this.category = '';
            this.requirements = {};
            this.newRequirement = '';
            this.level = '';
            this.logo = '';
            this.audienceGender = null;
            this.audienceAges = [];
            this.audienceInterests = [];

            this.researchPoints = 0;
            this.dissatisfaction = 0;
            this.users = 0;
            this.stockVolume = 0;
            this.cuPerMs = 0;
            this.maxFeatureLevel = 1;
            this.maxFeatures = 3;
            this.pricePerUser = 0;
            this.licenseCost = 0;

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

            this.presets = presets;

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
                /*if (!this.isFeatureValid()) {
                    return;
                }*/

                const requirements = {};
                Object.entries(this.requirements).forEach(entry => {
                    if(entry[1].count > 0) {
                        requirements[entry[0]] = entry[1].count;
                    }
                });

                const newFeature = {
                    name: this.name,
                    faIcon: this.faIcon,
                    categoryName: this.category.name,
                    level: this.level.name,
                    requirements: requirements,
                    dissatisfaction: this.dissatisfaction,
                    researchPoints: this.researchPoints,
                    availableProducts: Object.keys(ProductTypeNames), // TODO: allow user to specify
                };
                console.log(newFeature);

                registerFeature(newFeature);

                // Reset inputs
                this.reset();
            };

            // Frameworks Section
            this.submitFramework = () => {
                // TODO: Validate

                const newFramework = {
                    name: this.name,
                    researchPoints: this.researchPoints,
                    pricePerUser: this.pricePerUser,
                    maxFeatures: this.maxFeatures,
                    maxFeatureLevel: this.maxFeatureLevel,
                    licenseCost: this.licenseCost,
                    cuPerMs: this.cuPerMs,
                };
                console.log('New Framework', newFramework);

                registerFramework(newFramework, _modPath);

                // Reset input fields
                this.reset();
            }

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
                if(preset.features) {
                    preset.features.forEach(feature => registerFeature(feature));
                }
                if(preset.frameworks) {
                    preset.frameworks.forEach(framework => registerFramework(framework, _modPath));
                }
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
    initLanguage();

    if (!settings[config.name]) {
        settings[config.name] = {
            features: [],
            frameworks: [],
            products: [],
        };
    }
    if(!settings[config.name].features) {
        settings[config.name].features = [];
    }
    if(!settings[config.name].frameworks) {
        settings[config.name].frameworks = [];
    }
    if(!settings[config.name].products) {
        settings[config.name].products = [];
    }

    settings[config.name].features.forEach(feature => {
        registerFeature(feature, false);
    });
    settings[config.name].frameworks.forEach(framework => {
        registerFramework(framework, _modPath, false);
    });
    settings[config.name].products.forEach(product => {
        registerProduct(product, false);
    });
};
