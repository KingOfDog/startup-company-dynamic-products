let _modPath;

const config = require('./config.json');

const {
    registerCompetitor,
    registerComponent,
    registerFeature,
    registerFramework,
    registerProduct,
} = require('./registration');

const {
    getInternalName,
    getFeatures,
    initLanguage,
    copyToClipboard,
} = require('./helpers');

const {
    initOnline,
    hasAgreedToOnline,
    agreeToOnline,
    isLoggedIn,
    login,
    getPresets,
    downloadPreset,
    uploadPreset,
    uploadImage,
} = require('./http');

const presets = [
    require('./presets/search-engine.json'),
    require('./presets/instant-messenger.json'),
    require('./presets/language-plattform.json'),
    require('./presets/online-forum.json'),
    require('./presets/travel-planning.json'),
    require('./presets/music-streaming.json'),
    require('./presets/version-control.json'),
];

function loadSettings(settings) {
    if (!settings[config.name]) {
        settings[config.name] = {
            agreedToOnline: false,
            loggedIn: false,
            username: null,
            competitors: [],
            components: [],
            features: [],
            frameworks: [],
            products: [],
        };
    }
    if (!settings[config.name].components) {
        settings[config.name].components = [];
    }
    if (!settings[config.name].features) {
        settings[config.name].features = [];
    }
    if (!settings[config.name].frameworks) {
        settings[config.name].frameworks = [];
    }
    if (!settings[config.name].products) {
        settings[config.name].products = [];
    }

    settings[config.name].components.forEach(component => {
        registerComponent(component, false);
    });
    settings[config.name].features.forEach(feature => {
        registerFeature(feature, false);
    });
    settings[config.name].frameworks.forEach(framework => {
        registerFramework(framework, _modPath, false);
    });
    settings[config.name].products.forEach(product => {
        registerProduct(product, false);
    });
}

const loadGame = Helpers.LoadGame;
Helpers.LoadGame = (e, t, n) => {
    console.log(config.name, 'Loading game...');
    if (null == t) return void n(null);
    t.date = new Date(t.date), t.started = 0 != t.started && new Date(t.started), t.paused = !0, e.settings = t, loadSettings(e.settings), runBackgroundWorkerInjection(e, t), Helpers.PrepareSavegameCompatibility(t), e.updateFinanceData();
    let a = Buildings.find(e => e.name == t.office.buildingName);
    null != a ? Helpers.GoToBuilding(a) : (e.setActiveView("cityMap"), ToggleLoader(!1)), Helpers.SafeApply(), n(t), e.$broadcast(Enums.GameEvents.MilestoneTrigger), e.$broadcast(Enums.GameEvents.MailChange), e.$broadcast(Enums.GameEvents.UiUpdate), e.$broadcast(Enums.GameEvents.RackChange), Game.Lifecycle.PauseTime(!0, !0), "$apply" != e.$$phase && "$digest" != e.$$phase && e.$apply(), Helpers.UpdateTopbar(), Helpers.UpdateTopbarProgress(), Helpers.UpdateRetirementProgress(), Helpers.UpdateAndSetUiDay(), Helpers.UpdateDiscord(), e.$broadcast(Enums.GameEvents.OnLoadGame), Modding._executeEvent("onLoadGame", e.settings)
};

exports.initialize = (modPath) => {
    _modPath = modPath;

    Modding.setMenuItem({
        name: 'dynamic',
        tooltip: config.name,
        tooltipPosition: 'top',
        faIcon: 'fa-cubes',
        badgeCount: 0,
    });

    $(document.body).append('<style>ul.tab-list { overflow-y: auto; height: 3.25em }</style>');

    exports.views = [{
            name: 'dynamichome',
            viewPath: _modPath + 'templates/home.html',
            controller: ['$scope', function ($scope, $http) {
                // Get Language String
                this.getString = (key) => {
                    return Helpers.GetLocalized(key);
                };

                this.tab = 'home';
                this.presetTab = 'online';

                this.hasAgreed = hasAgreedToOnline();
                this.loggedIn = isLoggedIn();

                this.username = '';

                this.localPresets = presets.map(p => {
                    p.local = true;
                    return p;
                });
                this.loading = true;
                this.presets = [];
                this.preset = null;

                this.agree = () => {
                    agreeToOnline();
                    this.hasAgreed = hasAgreedToOnline();
                };

                this.isValid = () => {
                    return this.username.trim().length > 0;
                };

                this.login = () => {
                    if (!this.isValid()) {
                        return;
                    }

                    login(Game.debug.steamId, this.username.trim())
                        .then(result => {
                            this.loggedIn = result;
                            this.loadPresets();
                        });
                };

                this.loadPresets = () => {
                    this.loading = true;
                    getPresets()
                        .then(presets => {
                            this.loading = false;
                            this.presets = presets;
                            GetRootScope().$digest();
                        });
                };
                this.loadPresets();

                this.showPreset = (preset) => {
                    this.preset = preset;
                    this.tab = 'preset';
                };
            }]
        },
        {
            name: 'dynamicpreset',
            viewPath: _modPath + 'templates/preset.html',
            controller: ['$scope', function ($scope) {
                // Get Language String
                this.getString = (key) => {
                    return Helpers.GetLocalized(key);
                };

                this.loading = true;
                this.preset = null;

                this.loadPreset = (id) => {
                    downloadPreset(id)
                        .then(preset => {
                            this.preset = preset;
                            this.loading = false;
                            this.calculateIncludes();
                            GetRootScope().$digest();
                        });
                };

                this.getCount = (name) => {
                    if (!this.preset[name]) {
                        return 0;
                    }
                    return this.preset[name].length;
                };

                this.includes = {};

                this.calculateIncludes = () => {
                    this.includes = {
                        components: this.getCount('components'),
                        competitors: this.getCount('competitors'),
                        features: this.getCount('features'),
                        frameworks: this.getCount('frameworks'),
                        products: this.getCount('products'),
                    };
                };

                if ($scope.$parent.dynamichomeCtrl.preset.local) {
                    this.preset = $scope.$parent.dynamichomeCtrl.preset;
                    this.loading = false;
                    this.calculateIncludes();
                } else {
                    this.loadPreset($scope.$parent.dynamichomeCtrl.preset.id);
                }

                this.importPresetConfirm = () => {
                    GetRootScope().confirm('', this.getString('dp_preset_confirm'), () => {
                        this.importPreset();
                    });
                };

                this.importPreset = () => {
                    if (this.preset.components) {
                        this.preset.components.forEach(component => registerComponent(component));
                    }
                    if (this.preset.features) {
                        this.preset.features.forEach(feature => registerFeature(feature));
                    }
                    if (this.preset.frameworks) {
                        this.preset.frameworks.forEach(framework => registerFramework(framework, _modPath));
                    }
                    if (this.preset.products) {
                        this.preset.products.forEach(product => registerProduct(product));
                    }
                    if (this.preset.competitors) {
                        this.preset.competitors.forEach(competitor => registerCompetitor(competitor));
                    }

                    Helpers.ShowSuccessMessage(this.getString('dp_preset_success'), this.getString('dp_preset_success_sub'));
                };

                this.quitScreen = () => {
                    $scope.$parent.dynamichomeCtrl.tab = 'home';
                };
            }],
        },
        {
            name: 'dynamiccreatepreset',
            viewPath: _modPath + 'templates/create_preset.html',
            controller: ['$scope', function ($scope) {
                // Get Language String
                this.getString = (key) => {
                    return Helpers.GetLocalized(key);
                };

                this.loading = false;

                this.name = '';
                this.description = '';
                this.competitors = [];
                this.components = [];
                this.features = [];
                this.frameworks = [];
                this.products = [];

                this.userCompetitors = GetRootScope().settings[config.name].competitors.filter(c => c.createdSelf);
                this.userComponents = GetRootScope().settings[config.name].components.filter(c => c.createdSelf);
                this.userFeatures = GetRootScope().settings[config.name].features.filter(c => c.createdSelf);
                this.userFrameworks = GetRootScope().settings[config.name].frameworks.filter(c => c.createdSelf);
                this.userProducts = GetRootScope().settings[config.name].products.filter(c => c.createdSelf);

                this.isActive = (name, object) => {
                    return !!this[name].find(o => o.name == object.name);
                };

                this.toggle = (name, object) => {
                    const index = this[name].findIndex(o => o.name == object.name);
                    if (index == -1) {
                        this[name].push(object);
                    } else {
                        this[name].splice(index, 1);
                    }
                };

                this.confirm = () => {
                    GetRootScope().confirm('', this.getString('dp_preset_confirm'), () => {
                        this.submit();
                    });
                };

                this.isValid = () => {
                    return this.name.length > 0 &&
                        this.description.length > 0;
                };

                this.submit = () => {
                    if (!this.isValid()) {
                        return;
                    }

                    this.loading = true;

                    const newPreset = {
                        name: this.name,
                        description: this.description,
                        competitors: this.competitors,
                        components: this.components,
                        features: this.features,
                        frameworks: this.frameworks,
                        products: this.products,
                    };
                    uploadPreset(newPreset)
                        .then(result => {
                            console.log('preset', result);
                            this.loading = false;

                            if (result.Success) {
                                Helpers.ShowSuccessMessage(this.getString('dp_create_preset_success'), this.getString('dp_create_preset_success_sub'));
                                this.quitScreen();
                            }
                        });
                };

                this.quitScreen = () => {
                    $scope.$parent.dynamichomeCtrl.tab = 'home';
                    setTimeout(() => {
                        GetRootScope().$digest();
                    }, 100);
                };
            }],
        },
        {
            name: 'dynamiccompetitors',
            viewPath: _modPath + 'templates/competitors.html',
            controller: ['$scope', function ($scope) {
                // Get Language String
                this.getString = (key) => {
                    return Helpers.GetLocalized(key);
                };

                this.competitors = GetRootScope().settings[config.name].competitors;

                this.tab = 'list';

                this.getRealUsers = (competitor) => {
                    const realCompetitor = GetRootScope().settings.competitorProducts.find(product => product.name == competitor.name);
                    return Helpers.SmartNumber(realCompetitor.users, 0);
                };

                this.copyToClipboard = (competitor) => {
                    copyToClipboard(JSON.stringify(competitor));
                };

                this.format = (number, a = 0) => {
                    return Helpers.SmartNumber(number, a);
                };
            }],
        },
        {
            name: 'dynamiccompetitorsedit',
            viewPath: _modPath + 'templates/competitors_edit.html',
            controller: ['$scope', function ($scope) {
                // Get Language String
                this.getString = (key) => {
                    return Helpers.GetLocalized(key);
                };

                this.format = (number, a = 0) => {
                    return Helpers.SmartNumber(number, a);
                };

                this.loggedIn = isLoggedIn();

                this.name = '';
                this.logo = null;
                this.productType = null;
                this.users = 1000;
                this.stockVolume = 100;
                this.maxUsers = 7779482758;

                this.valuation = 0;
                this.stockPrice = 0;

                this.logos = _.range(1, 100).map(n => ({
                    number: n,
                    id: -n,
                    url: `images/logos/companies/${n}.png`,
                }));
                this.productTypes = ProductTypes.map(productType => {
                    return {
                        label: this.getString(productType.name),
                        productType: productType,
                    };
                });

                this.selectFile = () => {
                    $('#file').click();
                    $('#file').one('change', () => {
                        console.log('hallo');
                        this.uploadFile();
                    });
                };
                this.uploadFile = () => {
                    const file = document.getElementById('file').files[0];
                    console.log(file);
                    uploadImage(file)
                        .catch(error => {
                            console.log(error);
                        })
                        .then(result => {
                            console.log(result);
                            this.logo = {
                                online: true,
                                id: result.ImageID,
                                url: result.URL,
                            };
                            $('#file').val('');
                            GetRootScope().$digest();
                        })
                        .catch(error => {
                            console.log(error);
                        });
                };

                this.updateUsers = () => {
                    if (typeof this.users == 'string') {
                        this.users = parseInt(this.users);
                    }
                    console.log(this.users);

                    if (!this.users) {
                        this.users = this.maxUsers;
                    }
                    this.valuation = Helpers.CalculateValuation({
                        users: this.users
                    });
                    this.stockVolume = Math.max(Math.round(this.valuation / 1000), 1);
                    this.updateStockVolume();
                };
                this.updateStockVolume = () => {
                    if (typeof this.stockVolume == 'string') {
                        this.stockVolume = parseInt(this.stockVolume);
                    }
                    if (!this.stockVolume) {
                        this.stockVolume = 1e8;
                    }
                    this.stockPrice = Helpers.CalculateStockPrice({
                        stockVolume: this.stockVolume
                    }, this.valuation);
                };

                this.confirm = () => {
                    GetRootScope().confirm('', this.getString('dp_competitor_confirm'), () => {
                        this.submit();
                    });
                };

                this.isValid = () => {
                    if (
                        this.name.length == 0 ||
                        this.logo == null ||
                        this.productType == null
                    ) {
                        return false;
                    }

                    return true;
                };

                this.submit = () => {
                    if (!this.isValid()) {
                        console.log('Invalid competitor');
                        return;
                    }

                    const newCompetitor = {
                        name: this.name,
                        imageId: this.logo.id,
                        logoPath: this.logo.url,
                        logoColorDegree: 300,
                        users: this.users,
                        stockVolume: this.stockVolume,
                        stockPrice: 0,
                        productTypeName: this.productType.productType.name,
                        createdSelf: true,
                    };

                    registerCompetitor(newCompetitor);

                    this.quitScreen();
                };

                this.quitScreen = () => {
                    $scope.$parent.dynamiccompetitorsCtrl.tab = 'list';
                };
            }],
        },
        {
            name: 'dynamiccomponents',
            viewPath: _modPath + 'templates/components.html',
            controller: ['$scope', function ($scope) {
                // Get Language String
                this.getString = (key) => {
                    return Helpers.GetLocalized(key);
                };

                this.components = GetRootScope().settings[config.name].components;

                this.tab = 'list';

                this.copyToClipboard = (component) => {
                    copyToClipboard(JSON.stringify(component));
                };
            }],
        },
        {
            name: 'dynamiccomponentsedit',
            viewPath: _modPath + 'templates/components_edit.html',
            controller: ['$scope', function ($scope) {
                // Get Language String
                this.getString = (key) => {
                    return Helpers.GetLocalized(key);
                };

                this.loggedIn = isLoggedIn();

                this.name = '';
                let type = null;
                this.employeeType = null;
                this.employeeLevel = null;
                this.produceHours = 1;
                this.requirements = {};
                this.newRequirement = null;
                this.icon = null;

                this.types = [{
                        label: this.getString('dp_component'),
                        name: 'Component'
                    },
                    {
                        label: this.getString('dp_module'),
                        name: 'Module'
                    }
                ];
                this.employeeTypes = [];
                this.employeeLevels = Object.keys(EmployeeLevels).map(name => ({
                    label: this.getString(name),
                    name: name,
                }));
                this.components = Components.map(component => ({
                    label: this.getString(component.name),
                    component: component
                }));

                this.updateType = () => {
                    if (this.type.name == 'Component') {
                        this.employeeTypes = [{
                                label: this.getString('Designer'),
                                name: 'Designer'
                            },
                            {
                                label: this.getString('Developer'),
                                name: 'Developer'
                            },
                            {
                                label: this.getString('Marketer'),
                                name: 'Marketer'
                            },
                            {
                                label: this.getString('SysAdmin'),
                                name: 'SysAdmin'
                            },
                        ];
                    } else {
                        this.employeeTypes = [{
                                label: this.getString('Designer'),
                                name: 'Designer'
                            },
                            {
                                label: this.getString('LeadDeveloper'),
                                name: 'LeadDeveloper'
                            },
                            {
                                label: this.getString('Marketer'),
                                name: 'Marketer'
                            },
                            {
                                label: this.getString('SysAdmin'),
                                name: 'SysAdmin'
                            },
                        ];
                    }
                };

                this.__defineGetter__('type', () => type);
                this.__defineSetter__('type', (val) => {
                    type = val;
                    this.updateType();
                });

                this.onRequirementCountChange = () => {
                    Object.entries(this.requirements).forEach(entry => {
                        if (entry[1].count <= 0) {
                            delete this.requirements[entry[0]];
                        }
                    });
                };

                this.deleteRequirement = (name) => {
                    delete this.requirements[name];
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
                };

                this.selectFile = () => {
                    $('#file').click();
                    $('#file').one('change', () => {
                        console.log('hallo');
                        this.uploadFile();
                    });
                };
                this.uploadFile = () => {
                    const file = document.getElementById('file').files[0];
                    console.log(file);
                    uploadImage(file)
                        .catch(error => {
                            console.log(error);
                        })
                        .then(result => {
                            console.log(result);
                            this.icon = {
                                id: result.ImageID,
                                url: result.URL,
                            };
                            $('#file').val('');
                            GetRootScope().$digest();
                        });
                };

                this.isValid = () => {
                    return this.name.length > 0 &&
                        this.type != null &&
                        this.employeeType != null &&
                        this.employeeLevel != null &&
                        (this.type.name == 'Component' || Object.keys(this.requirements).length > 0);
                };

                this.confirm = () => {
                    GetRootScope().confirm('', this.getString('dp_component_confirm'), () => {
                        this.submit();
                    });
                };

                this.submit = () => {
                    if (!this.isValid()) {
                        return;
                    }

                    const newComponent = {
                        name: getInternalName(this.name),
                        displayName: this.name,
                        type: this.type.name,
                        employeeTypeName: this.employeeType.name,
                        employeeLevel: this.employeeLevel.name,
                        imageId: -1,
                        icon: 'mods/dynamicproducts/thumbnail.png',
                        createdSelf: true,
                    };

                    if (this.type.name == 'Component') {
                        newComponent.produceHours = this.produceHours;
                    } else {
                        const requirements = {};
                        Object.entries(this.requirements).forEach(entry => {
                            requirements[entry[0]] = entry[1].count;
                        });
                        newComponent.requirements = requirements;
                    }

                    if (this.icon) {
                        newComponent.imageId = this.icon.id;
                        newComponent.icon = this.icon.url;
                    }

                    console.log(newComponent);

                    registerComponent(newComponent, true);
                    runBackgroundWorkerInjection(GetRootScope(), GetRootScope().settings);

                    this.quitScreen();
                };

                this.quitScreen = () => {
                    $scope.$parent.dynamiccomponentsCtrl.tab = 'list';
                };
            }],
        },
        {
            name: 'dynamicfeatures',
            viewPath: _modPath + 'templates/features.html',
            controller: ['$scope', function ($scope) {
                // Get Language String
                this.getString = (key) => {
                    return Helpers.GetLocalized(key);
                };

                this.tab = 'list';

                this.features = GetRootScope().settings[config.name].features;

                this.copyToClipboard = (feature) => {
                    copyToClipboard(JSON.stringify(feature));
                };

                this.format = (number, a = 0) => {
                    return Helpers.SmartNumber(number, a);
                };
            }],
        },
        {
            name: 'dynamicfeaturesedit',
            viewPath: _modPath + 'templates/features_edit.html',
            controller: ['$scope', function ($scope) {
                // Get Language String
                this.getString = (key) => {
                    return Helpers.GetLocalized(key);
                };

                this.name = '';
                this.faIcon = '';
                this.researchPoints = 0;
                this.category = {
                    name: 'Users'
                };
                this.requirements = {};
                this.newRequirement = null;
                this.level = '';
                // this.dissatisfaction = 0;

                this.featureCategories = FeatureCategories;
                this.featureLevels = Object.keys(EmployeeLevels).map(level => {
                    return {
                        label: this.getString(level),
                        name: level
                    };
                });
                this.components = Components.map(component => {
                    return {
                        label: this.getString(component.name),
                        component: component
                    };
                });

                this.onRequirementCountChange = () => {
                    Object.entries(this.requirements).forEach(entry => {
                        if (entry[1].count <= 0) {
                            delete this.requirements[entry[0]];
                        }
                    });
                };

                this.deleteRequirement = (name) => {
                    delete this.requirements[name];
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
                };

                this.isValid = () => {
                    console.log(this.name, this.faIcon, this.category, this.level, this.requirements);

                    if (
                        this.name.length == 0 ||
                        this.faIcon.length == 0 ||
                        this.category == null ||
                        this.level == '' ||
                        Object.keys(this.requirements).length == 0
                    ) {
                        return false;
                    }

                    return true;
                };

                this.confirm = () => {
                    GetRootScope().confirm('', this.getString('dp_feature_confirm'), () => {
                        this.submit();
                    });
                };

                this.submit = () => {
                    if (!this.isValid()) {
                        console.log('Invalid feature');
                        return;
                    }

                    const requirements = {};
                    Object.entries(this.requirements).forEach(entry => {
                        if (entry[1].count > 0) {
                            requirements[entry[0]] = entry[1].count;
                        }
                    });

                    const newFeature = {
                        name: getInternalName(this.name),
                        displayName: this.name,
                        faIcon: this.faIcon,
                        categoryName: 'Users',
                        level: this.level.name,
                        requirements: requirements,
                        dissatisfaction: this.dissatisfaction,
                        researchPoints: this.researchPoints,
                        availableProducts: Object.keys(ProductTypeNames), // TODO: allow user to specify
                        createdSelf: true,
                    };
                    console.log(newFeature);

                    registerFeature(newFeature);
                    runBackgroundWorkerInjection(GetRootScope(), GetRootScope().settings);

                    this.quitScreen();
                };

                this.quitScreen = () => {
                    $scope.$parent.dynamicfeaturesCtrl.tab = 'list';
                };
            }],
        },
        {
            name: 'dynamicframeworks',
            viewPath: _modPath + 'templates/frameworks.html',
            controller: ['$scope', function ($scope) {
                // Get Language String
                this.getString = (key) => {
                    return Helpers.GetLocalized(key);
                };

                this.tab = 'list';

                this.frameworks = GetRootScope().settings[config.name].frameworks;

                this.copyToClipboard = (framework) => {
                    copyToClipboard(JSON.stringify(framework));
                };

                this.format = (number, a = 0) => {
                    return Helpers.SmartNumber(number, a);
                };
            }],
        },
        {
            name: 'dynamicframeworksedit',
            viewPath: _modPath + 'templates/frameworks_edit.html',
            controller: ['$scope', function ($scope) {
                // Get Language String
                this.getString = (key) => {
                    return Helpers.GetLocalized(key);
                };

                this.name = '';
                this.researchPoints = 1e3;
                this.licenseCost = 1e5;
                this.pricePerUser = 1e-4;
                this.cuPerMs = 0.1;
                this.maxFeatures = 3;
                this.maxFeatureLevel = 1;
                this.icon = null;

                $('#file').on('change', () => {
                    this.uploadFile();
                });
                this.uploadFile = () => {
                    const file = document.getElementById('file').files[0];
                    console.log(file);
                    uploadImage(file)
                        .catch(error => {
                            console.log(error);
                        })
                        .then(result => {
                            console.log(result);
                            this.icon = {
                                online: true,
                                id: result.ImageID,
                                url: result.URL,
                            };
                            $('#file').val('');
                            GetRootScope().$digest();
                        });
                };

                this.confirm = () => {
                    GetRootScope().confirm('', this.getString('dp_framework_confirm'), () => {
                        this.submit();
                    });
                };

                this.isValid = () => {
                    if (this.name.length == 0) {
                        return false;
                    }

                    return true;
                };

                this.submit = () => {
                    if (!this.isValid) {
                        console.log('Invalid framework');
                        return;
                    }

                    const newFramework = {
                        name: getInternalName(this.name),
                        displayName: this.name,
                        researchPoints: this.researchPoints,
                        pricePerUser: this.pricePerUser,
                        maxFeatures: this.maxFeatures,
                        maxFeatureLevel: this.maxFeatureLevel,
                        licenseCost: this.licenseCost,
                        cuPerMs: this.cuPerMs,
                        createdSelf: true,
                        imageId: -1,
                        logoPath: 'mods/dynamicproducts/thumbnail.png',
                    };

                    if (this.icon) {
                        newFramework.imageId = this.icon.id;
                        newFramework.logoPath = this.icon.url;
                    }

                    console.log('New Framework', newFramework);

                    registerFramework(newFramework, _modPath);
                    runBackgroundWorkerInjection(GetRootScope(), GetRootScope().settings);

                    this.quitScreen();
                };

                this.quitScreen = () => {
                    $scope.$parent.dynamicframeworksCtrl.tab = 'list';
                };
            }],
        },
        {
            name: 'dynamicproducts',
            viewPath: _modPath + 'templates/products.html',
            controller: ['$scope', function ($scope) {
                // Get Language String
                this.getString = (key) => {
                    return Helpers.GetLocalized(key);
                };

                this.tab = 'list';

                this.products = GetRootScope().settings[config.name].products;

                this.copyToClipboard = (product) => {
                    copyToClipboard(JSON.stringify(product));
                };

                this.format = (number, a = 0) => {
                    return Helpers.SmartNumber(number, a);
                };
            }],
        },
        {
            name: 'dynamicproductsedit',
            viewPath: _modPath + 'templates/products_edit.html',
            controller: ['$scope', function ($scope) {
                // Get Language String
                this.getString = (key) => {
                    return Helpers.GetLocalized(key);
                };

                this.name = '';
                this.faIcon = '';
                this.featureCategories = FeatureCategories;
                this.selectedFeatureCategory = 'Users';
                this.features = getFeatures();
                this.audienceAges = [];
                this.audienceGender = null;
                this.audienceInterests = [];

                this.audiences = {
                    genders: ['male', 'female'],
                    ages: ['age_group1', 'age_group2', 'age_group3'],
                    interests: Object.keys(MarketingInterests),
                };

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

                this.confirm = () => {
                    GetRootScope().confirm('', this.getString('dp_product_confirm'), () => {
                        this.submit();
                    });
                };

                this.isValid = () => {
                    return this.name.length > 0 &&
                        this.faIcon.length > 0;
                };

                this.submit = () => {
                    if (!this.isValid()) {
                        console.log('invalid product');
                        return;
                    }

                    const audienceMatches = [];
                    if (this.audienceGender) {
                        audienceMatches.push(this.audienceGender);
                    }
                    audienceMatches.push(...this.audienceAges);
                    audienceMatches.push(...this.audienceInterests);

                    const newProduct = {
                        name: getInternalName(this.name),
                        displayName: this.name,
                        features: this.features.filter(item => item.selected).map(item => item.feature.name),
                        audienceMatches: audienceMatches,
                        faIcon: this.faIcon,
                        createdSelf: true,
                    };
                    console.log(newProduct);

                    registerProduct(newProduct);
                    runBackgroundWorkerInjection(GetRootScope(), GetRootScope().settings);

                    // Reset inputs
                    this.quitScreen();
                };

                this.quitScreen = () => {
                    $scope.$parent.dynamicproductsCtrl.tab = 'list';
                };
            }],
        },
        {
            name: 'dynamic',
            viewPath: _modPath + 'templates/index.html',
            controller: ['$scope', function ($scope) {
                // Get Language String
                this.getString = (key) => {
                    return Helpers.GetLocalized(key);
                };

                this.tab = 'Home';
                this.tabs = [{
                        label: this.getString('dp_home'),
                        tab: 'Home',
                        icon: 'fa-home',
                    },
                    {
                        label: this.getString('dp_competitors'),
                        tab: 'Competitors',
                        icon: 'fa-industry',
                    },
                    {
                        label: this.getString('dp_components'),
                        tab: 'Components',
                        icon: 'fa-keyboard-o',
                    },
                    {
                        label: this.getString('dp_features'),
                        tab: 'Features',
                        icon: 'fa-gear',
                    },
                    {
                        label: this.getString('dp_frameworks'),
                        tab: 'Frameworks',
                        icon: 'fa-microchip',
                    },
                    {
                        label: this.getString('dp_products'),
                        tab: 'Products',
                        icon: 'fa-cubes',
                    },
                ];
            }]
        }
    ];
};

exports.onLoadGame = settings => {
    initLanguage().then();

    loadSettings(settings);

    initOnline(config.name);
    if (hasAgreedToOnline()) {
        try {
            login(Game.debug.steamId, GetRootScope().settings[config.name].username);
        } catch (e) {}
    }
};

function runBackgroundWorkerInjection(a, settings) {
    // Create background worker if not existing.
    if (!Game.BackgroundWorker) {
        Helpers.ResetEngine();
    }

    // Injecting a custom function into the background worker which has its own code
    Game.BackgroundWorker.postMessage({
        method: 'injectJs',
        data: {
            method: backgroundWorkerInjection.toString().replace('{}', JSON.stringify(settings[config.name])),
            modPath: _modPath,
        },
    });

    // Executing the original background worker
    Helpers.RunBackgroundWorker(null, null, true);
}

const backgroundWorkerInjection = modPath => {
    const settings = {};
    settings.components.forEach(component => {
        if (ComponentNames[component.name]) {
            return;
        }

        ComponentNames[component.name] = component.name;
        Components.push(component);
    });
    settings.features.forEach(feature => {
        if (FeatureNames[feature.name]) {
            return;
        }

        FeatureNames[feature.name] = feature.name;
        Features.push(feature);
    });
    settings.frameworks.forEach(framework => {
        if (FrameworkNames[framework.name]) {
            return;
        }

        FrameworkNames[framework.name] = framework.name;

        const clone = Helpers.Clone(framework);
        clone.order = _.maxBy(Frameworks, e => e.order).order + 1;
        delete clone.researchPoints;
        Frameworks.push(clone);
    });
    settings.products.forEach(product => {
        if (ProductTypeNames[product.name]) {
            return;
        }

        ProductTypeNames[product.name] = product.name;
        ProductTypes.push(product);
    });
};