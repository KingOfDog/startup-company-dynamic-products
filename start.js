let _modPath;

exports.onBackgroundWorkerStart = () => {
            Features.push({
                name: FeatureNames.features_1,
                level: Enums.EmployeeLevels.Expert,
                requirements: {
                    ContentManagementModule: 1,
                    UiComponent: 1,
                    BlueprintComponent: 1
                },
                faIcon: "fa-file-video-o",
                categoryName: Enums.FeatureCategories.Users
            });


            ResearchItems.push({
                name: FeatureNames.features_1,
                category: ResearchCategories.Features,
                points: 30,
                unlockType: "Feature"
            });
};

exports.initialize = (modPath) => {
    _modPath = modPath;

    Modding.setMenuItem({
        name: 'dynamic',
        tooltip: 'Dynamic Products',
        tooltipPosition: 'top',
        faIcon: 'fa-cubes',
        badgeCount: 0,
    });

    FeatureNames.features_1 = 'Feature 1';
            Features.push({
                name: FeatureNames.features_1,
                level: Enums.EmployeeLevels.Expert,
                requirements: {
                    ContentManagementModule: 1,
                    UiComponent: 1,
                    BlueprintComponent: 1
                },
                faIcon: "fa-file-video-o",
                categoryName: Enums.FeatureCategories.Users
            });


            ResearchItems.push({
                name: FeatureNames.features_1,
                category: ResearchCategories.Features,
                points: 30,
                unlockType: "Feature"
            });

    exports.views = [{
        name: 'dynamic',
        viewPath: _modPath + 'view.html',
        controller: ['$scope', function ($scope) {
            // Get Language String
            this.getString = (key) => {
                return Language[key.toLowerCase()]
            };

            this.tab;
            this.tabs = [
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
            this.researchPoints = 0;
            this.category = '';
            this.requirements = {};
            this.newRequirement = '';
            this.level = '';
            this.dissatisfaction = 0;

            this.components = Components.map(component => {
                return {
                    label: this.getString(component.name),
                    component: component
                }
            });
            this.featureCategories = FeatureCategories;
            this.featureLevels = Object.keys(EmployeeLevels).map(level => {
                return {
                    name: level
                }
            });

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
                console.log('hi da');
                if (this.name == '' || this.faIcon == '' || this.category == '') {
                    return false;
                }
                console.log(this.category, this.level);

                if (this.category.name == 'Users' && this.level == '') {
                    return false;
                }

                return true;
            }

            this.submitFeature = () => {
                if(!this.isFeatureValid()) {
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
                if (!GetRootScope().settings.dynamicProducts.features) {
                    GetRootScope().settings.dynamicProducts.features = [];
                }
                GetRootScope().settings.dynamicProducts.features.push(newFeature);

                // Reset inputs
                this.reset();
            };

            // Products Section
            this.submitProduct = () => {
                const newProduct = {
                    name: this.name,
                    features: Object.keys(this.features).filter(name => this.features[name]),
                    audienceMatches: [],
                    faIcon: this.faIcon,
                };
                console.log(newProduct);

                registerProduct(newProduct);
                if (!GetRootScope().settings.dynamicProducts.products) {
                    GetRootScope().settings.dynamicProducts.products = [];
                }
                GetRootScope().settings.dynamicProducts.products.push(newProduct);

                // Reset inputs
                this.reset();
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
            };
        }]
    }];
};

exports.onLoadGame = settings => {
    if (!settings.dynamicProducts) {
        settings.dynamicProducts = {
            features: [],
            products: [],
        };
    }
    settings.dynamicProducts.products.forEach(product => {
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

function registerFeature(feature) {
    // TODO: check for duplicates
    const internalName = feature.name.replace(/ /g, '');
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

function registerProduct(product) {
    // TODO: check if exists
    const internalName = product.name.replace(/ /g, '');
    ProductTypeNames[internalName] = internalName;
    const productCopy = JSON.parse(JSON.stringify(product));
    productCopy.name = internalName
    ProductTypes.push(productCopy);
    Modding.addTranslation(internalName, {
        en: product.name
    });
}