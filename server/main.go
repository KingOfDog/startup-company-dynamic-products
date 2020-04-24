package main

import (
	"github.com/KingOfDog/dynamic-products/contains"

	"encoding/json"
	"io"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"

	"github.com/google/uuid"

	"github.com/gorilla/mux"

	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
)

type User struct {
	gorm.Model
	SteamID  string `gorm:"unique;not null"`
	Username string `gorm:"unique;not null"`
	Presets  []Preset
}

type Preset struct {
	gorm.Model
	Name         string
	Description  string
	UserID       uint
	User         User
	Competitors  []*Competitor  `gorm:"many2many:preset_competitors"`
	Components   []*Component   `gorm:"many2many:preset_components"`
	Features     []*Feature     `gorm:"many2many:preset_features"`
	Frameworks   []*Framework   `gorm:"many2many:preset_frameworks"`
	ProductTypes []*ProductType `gorm:"many2many:preset_products"`
}

type PresetJSON struct {
	ID           uint              `json:"id"`
	Name         string            `json:"name"`
	Description  string            `json:"description"`
	Author       string            `json:"author"`
	Competitors  []CompetitorJSON  `json:"competitors"`
	Components   []ComponentJSON   `json:"components"`
	Features     []FeatureJSON     `json:"features"`
	Frameworks   []FrameworkJSON   `json:"frameworks"`
	ProductTypes []ProductTypeJSON `json:"products"`
}

type Competitor struct {
	gorm.Model
	Presets         []*Preset `gorm:"many2many:preset_competitors;"`
	Name            string    `gorm:"unique;not null"`
	ProductTypeID   uint
	ProductType     ProductType
	Users           uint
	StockVolume     uint
	LogoColorDegree uint
	LogoPath        string
}

type CompetitorJSON struct {
	Name            string `json:"name"`
	LogoPath        string `json:"logoPath"`
	LogoColorDegree uint   `json:"logoColorDegree"`
	Users           uint   `json:"users"`
	StockVolume     uint   `json:"stockVolume"`
	ProductTypeName string `json:"productTypeName"`
}

type ProductType struct {
	gorm.Model
	Presets         []*Preset `gorm:"many2many:preset_products;"`
	Name            string    `gorm:"unique;not null"`
	DisplayName     string
	Icon            string
	Features        []*Feature `gorm:"many2many:product_features;"`
	AudienceMatches string
}

type ProductTypeJSON struct {
	Name            string   `json:"name"`
	DisplayName     string   `json:"displayName"`
	Icon            string   `json:"faIcon"`
	Features        []string `json:"features"`
	AudienceMatches []string `json:"audienceMatches"`
}

type Feature struct {
	gorm.Model
	Presets        []*Preset `gorm:"many2many:preset_features;"`
	Name           string    `gorm:"unique;not null"`
	DisplayName    string
	Icon           string
	Category       string
	Level          string
	ResearchPoints uint
	ProductTypes   []*ProductType `gorm:"many2many:product_features;"`
}

type FeatureJSON struct {
	Name           string          `json:"name"`
	DisplayName    string          `json:"displayName"`
	Icon           string          `json:"faIcon"`
	Category       string          `json:"categoryName"`
	Level          string          `json:"level"`
	Requirements   map[string]uint `json:"requirements"`
	ResearchPoints uint            `json:"researchPoints"`
	ProductTypes   []string        `json:"availableProducts"`
}

type Framework struct {
	gorm.Model
	Name            string `gorm:"uniqe;not null"`
	DisplayName     string
	ResearchPoints  uint
	PricePerUser    float64
	MaxFeatures     uint
	MaxFeatureLevel uint
	LicenseCost     uint
	CuPerMs         float64
}

type FrameworkJSON struct {
	Name            string  `json:"name"`
	DisplayName     string  `json:"displayName"`
	ResearchPoints  uint    `json:"researchPoints"`
	PricePerUser    float64 `json:"pricePerUser"`
	MaxFeatures     uint    `json:"maxFeatures"`
	MaxFeatureLevel uint    `json:"maxFeatureLevel"`
	LicenseCost     uint    `json:"licenseCost"`
	CuPerMs         float64 `json:"cuPerMs"`
}

type Component struct {
	gorm.Model
	Name          string `gorm:"unique;not null"`
	DisplayName   string
	Icon          string
	Type          string
	EmployeeType  string
	EmployeeLevel string
	ProduceHours  uint
}

type ComponentJSON struct {
	Name          string `json:"name"`
	DisplayName   string `json:"displayName"`
	Icon          string `json:"icon"`
	Type          string `json:"type"`
	EmployeeType  string `json:"employeeTypeName"`
	EmployeeLevel string `json:"employeeLevel"`
	ProduceHours  uint   `json:"produceHours"`
}

type FeatureRequirement struct {
	FeatureID   uint
	Feature     Feature
	ComponentID uint
	Component   Component
	Count       uint
}

type Image struct {
	gorm.Model
	Name     string
	Size     int64
	FileName string
}

func GetDatabase() *gorm.DB {
	db, err := gorm.Open("sqlite3", "main.db")
	if err != nil {
		panic("Failed to connect to database")
	}

	return db
}

func LoginHandler(w http.ResponseWriter, r *http.Request) {
	var body struct {
		SteamID  string `json:"steamId"`
		Username string `json:"username"`
	}
	err := json.NewDecoder(r.Body).Decode(&body)
	if err != nil {
		panic(err)
	}

	db := GetDatabase()
	defer db.Close()

	w.Header().Set("Content-Type", "application/json")

	var user User
	if db.Where("steam_id = ? AND username = ?", body.SteamID, body.Username).First(&user).RecordNotFound() {
		err := db.Create(&User{
			SteamID:  body.SteamID,
			Username: body.Username,
		})
		if err.Error != nil {
			json.NewEncoder(w).Encode(struct {
				Success bool
			}{
				false,
			})
			return
		}
	}

	json.NewEncoder(w).Encode(struct {
		Success bool
	}{
		true,
	})
}

func PresetUploadHandler(w http.ResponseWriter, r *http.Request) {
	var body PresetJSON
	if json.NewDecoder(r.Body).Decode(&body) != nil {
		panic("error")
	}

	db := GetDatabase()
	defer db.Close()

	var user User
	db.Where("steam_id = ?", body.Author).First(&user)

	preset := Preset{
		Name:         body.Name,
		Description:  body.Description,
		UserID:       user.ID,
		Competitors:  make([]*Competitor, len(body.Competitors)),
		Components:   make([]*Component, len(body.Components)),
		Features:     make([]*Feature, len(body.Features)),
		Frameworks:   make([]*Framework, len(body.Frameworks)),
		ProductTypes: make([]*ProductType, len(body.ProductTypes)),
	}

	for index, component := range body.Components {
		item := component.ConvToComponent()
		db.Create(&item)
		preset.Components[index] = &item
	}

	for index, feature := range body.Features {
		log.Println(feature.Requirements)
		item := feature.ConvToFeature()
		item.ProductTypes = make([]*ProductType, 0)

		for _, productTypeName := range feature.ProductTypes {
			var productType ProductType
			if !db.First(&productType, "name = ?", productTypeName).RecordNotFound() {
				item.ProductTypes = append(item.ProductTypes, &productType)
			}
		}

		db.Create(&item)

		for componentName, count := range feature.Requirements {
			log.Println(componentName, count)
			var component Component
			if !db.First(&component, "name = ?", componentName).RecordNotFound() {
				log.Println("new feature requirement")
				db.Create(&FeatureRequirement{
					Feature:   item,
					Component: component,
					Count:     count,
				})
			}
		}

		preset.Features[index] = &item
	}

	for index, productType := range body.ProductTypes {
		item := productType.ConvToProductType()
		item.Features = make([]*Feature, 0)

		for _, featureName := range productType.Features {
			var feature Feature
			err := db.First(&feature, "name = ?", featureName)
			if !err.RecordNotFound() {
				item.Features = append(item.Features, &feature)
			}
		}

		db.Create(&item)
		preset.ProductTypes[index] = &item
	}

	for index, competitor := range body.Competitors {
		item := competitor.ConvToCompetitor()

		var productType ProductType
		err := db.Last(&productType, "Name = ?", competitor.ProductTypeName)
		if !err.RecordNotFound() {
			item.ProductType = productType
			db.Create(&item)
			preset.Competitors[index] = &item
		}
	}

	for index, framework := range body.Frameworks {
		item := framework.ConvToFramework()
		db.Create(&item)
		preset.Frameworks[index] = &item
	}

	db.Create(&preset)

	json.NewEncoder(w).Encode(struct {
		Success bool
	}{
		Success: true,
	})
}

func ImageUploadHandler(w http.ResponseWriter, r *http.Request) {
	r.ParseMultipartForm(32 << 20)

	file, header, err := r.FormFile("image")
	if err != nil {
		panic(err)
	}
	defer file.Close()

	// Max file size 2MB
	if header.Size > 2<<20 {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte("400 - File too big"))
		return
	}

	name := strings.Split(header.Filename, ".")
	log.Println("file name " + name[0])

	allowedFileTypes := [2]string{"png", "jpg"}
	if len(name) <= 1 || helpers.Contains(allowedFileTypes, name[len(name)-1]) {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte("400 - Invalid file type"))
		return
	}

	os.MkdirAll("./uploads/images", 0777)

	fileName := uuid.New().String() + "." + name[len(name)-1]
	f, err := os.OpenFile("./uploads/images/"+fileName, os.O_WRONLY|os.O_CREATE, 0777)
	if err != nil {
		panic(err)
	}

	io.Copy(f, file)

	image := Image{
		Name:     header.Filename,
		Size:     header.Size,
		FileName: fileName,
	}

	db := GetDatabase()
	defer db.Close()

	db.Create(&image)
}

func PresetDownloadHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	presetID, err := strconv.ParseUint(vars["presetID"], 10, 64)
	if err != nil {
		panic(err)
	}

	w.Header().Set("Content-Type", "application/json")

	db := GetDatabase()
	defer db.Close()

	var preset Preset
	db.First(&preset, presetID)
	db.Model(&preset).Related(&preset.Competitors, "Competitors")
	db.Model(&preset).Related(&preset.Components, "Components")
	db.Model(&preset).Related(&preset.Features, "Features")
	db.Model(&preset).Related(&preset.Frameworks, "Frameworks")
	db.Model(&preset).Related(&preset.ProductTypes, "ProductTypes")

	presetJSON := preset.ConvToJSON()

	json.NewEncoder(w).Encode(presetJSON)
}

func FindPresetsHandler(w http.ResponseWriter, r *http.Request) {
	db := GetDatabase()
	defer db.Close()

	var presets []Preset
	db.Find(&presets)

	results := make([]PresetJSON, len(presets))

	for index, preset := range presets {
		results[index] = preset.ConvToJSON()
	}

	w.Header().Set("Content-Type", "application/json")

	json.NewEncoder(w).Encode(results)
}

func TestHandler(w http.ResponseWriter, r *http.Request) {
	db := GetDatabase()
	defer db.Close()

	var result User
	db.First(&result, 2)

	var presets []Preset
	db.Model(&result).Related(&presets)

	json.NewEncoder(w).Encode(presets)
}

func Init() {
	data, err := ioutil.ReadFile("./default.json")
	if err != nil {
		log.Println(err)
		return
	}

	var defaults struct {
		Components   []ComponentJSON   `json:"components"`
		Features     []FeatureJSON     `json:"features"`
		ProductTypes []ProductTypeJSON `json:"products"`
	}

	err = json.Unmarshal(data, &defaults)
	if err != nil {
		log.Println(err)
		return
	}

	db := GetDatabase()
	defer db.Close()

	for _, component := range defaults.Components {
		item := component.ConvToComponent()
		db.Create(&item)
	}

	for _, feature := range defaults.Features {
		item := feature.ConvToFeature()
		db.Create(&item)

		for componentName, count := range feature.Requirements {
			var component Component
			if !db.First(&component, "name = ?", componentName).RecordNotFound() {
				db.Create(&FeatureRequirement{
					Feature:   item,
					Component: component,
					Count:     count,
				})
			}
		}
	}

	for _, productType := range defaults.ProductTypes {
		item := productType.ConvToProductType()

		for _, featureName := range productType.Features {
			var feature Feature
			err := db.First(&feature, "name = ?", featureName)
			if !err.RecordNotFound() {
				item.Features = append(item.Features, &feature)
			}
		}

		db.Create(&item)
	}
}

func main() {
	db := GetDatabase()
	db.AutoMigrate(&User{}, &Preset{}, &Feature{}, &Framework{}, &Competitor{}, &ProductType{}, &Component{}, &FeatureRequirement{}, &Image{})
	db.Close()

	Init()

	r := mux.NewRouter()
	r.HandleFunc("/login", LoginHandler).Methods("POST")
	r.HandleFunc("/presets", FindPresetsHandler).Methods("GET")
	r.HandleFunc("/preset/{presetID}", PresetDownloadHandler).Methods("GET")
	r.HandleFunc("/preset", PresetUploadHandler).Methods("POST")
	r.HandleFunc("/image", ImageUploadHandler).Methods("POST")
	r.HandleFunc("/test", TestHandler).Methods("GET")

	log.Fatal(http.ListenAndServe(":8000", r))
}

func RemoveSpaces(s string) string {
	return strings.Replace(s, " ", "", -1)
}

func (p *Preset) ConvToJSON() PresetJSON {
	db := GetDatabase()
	defer db.Close()

	var author User
	db.Model(&p).Related(&author)

	presetJSON := PresetJSON{
		ID:           p.ID,
		Name:         p.Name,
		Description:  p.Description,
		Author:       author.Username,
		Competitors:  make([]CompetitorJSON, len(p.Competitors)),
		Components:   make([]ComponentJSON, len(p.Components)),
		Features:     make([]FeatureJSON, len(p.Features)),
		Frameworks:   make([]FrameworkJSON, len(p.Frameworks)),
		ProductTypes: make([]ProductTypeJSON, len(p.ProductTypes)),
	}

	for index, competitor := range p.Competitors {
		presetJSON.Competitors[index] = competitor.ConvToJSON()
	}

	for index, component := range p.Components {
		presetJSON.Components[index] = component.ConvToJSON()
	}

	for index, feature := range p.Features {
		presetJSON.Features[index] = feature.ConvToJSON()
	}

	for index, framework := range p.Frameworks {
		presetJSON.Frameworks[index] = framework.ConvToJSON()
	}

	for index, productType := range p.ProductTypes {
		presetJSON.ProductTypes[index] = productType.ConvToJSON()
	}

	return presetJSON
}

func (c *CompetitorJSON) ConvToCompetitor() Competitor {
	return Competitor{
		Name:            c.Name,
		Users:           c.Users,
		StockVolume:     c.StockVolume,
		LogoColorDegree: c.LogoColorDegree,
		LogoPath:        c.LogoPath,
	}
}

func (c *Competitor) ConvToJSON() CompetitorJSON {
	db := GetDatabase()
	defer db.Close()

	db.Model(&c).Related(&c.ProductType)

	return CompetitorJSON{
		Name:            c.Name,
		LogoPath:        c.LogoPath,
		LogoColorDegree: c.LogoColorDegree,
		Users:           c.Users,
		StockVolume:     c.StockVolume,
		ProductTypeName: c.ProductType.Name,
	}
}

func (c *ComponentJSON) ConvToComponent() Component {
	if c.DisplayName == "" {
		c.DisplayName = c.Name
		c.Name = RemoveSpaces(c.Name)
	}
	return Component{
		Name:          c.Name,
		DisplayName:   c.DisplayName,
		Icon:          c.Icon,
		Type:          c.Type,
		EmployeeType:  c.EmployeeType,
		EmployeeLevel: c.EmployeeLevel,
		ProduceHours:  c.ProduceHours,
	}
}

func (c *Component) ConvToJSON() ComponentJSON {
	return ComponentJSON{
		Name:          c.Name,
		DisplayName:   c.DisplayName,
		Icon:          c.Icon,
		Type:          c.Type,
		EmployeeType:  c.EmployeeType,
		EmployeeLevel: c.EmployeeLevel,
		ProduceHours:  c.ProduceHours,
	}
}

func (f *FeatureJSON) ConvToFeature() Feature {
	if f.DisplayName == "" {
		f.DisplayName = f.Name
		f.Name = RemoveSpaces(f.Name)
	}
	return Feature{
		Name:           f.Name,
		DisplayName:    f.DisplayName,
		Icon:           f.Icon,
		Category:       f.Category,
		Level:          f.Level,
		ResearchPoints: f.ResearchPoints,
	}
}

func (f *Feature) ConvToJSON() FeatureJSON {
	db := GetDatabase()
	defer db.Close()

	var requirements []FeatureRequirement
	db.Where("feature_id = ?", f.ID).Find(&requirements)
	requirementsMap := make(map[string]uint, len(requirements))

	for _, requirement := range requirements {
		db.Model(requirement).Related(&requirement.Component)
		requirementsMap[requirement.Component.Name] = requirement.Count
	}

	db.Model(&f).Related(&f.ProductTypes, "ProductTypes")
	productTypes := make([]string, len(f.ProductTypes))

	for index, productType := range f.ProductTypes {
		productTypes[index] = productType.Name
	}

	return FeatureJSON{
		Name:           f.Name,
		DisplayName:    f.DisplayName,
		Icon:           f.Icon,
		Category:       f.Category,
		Level:          f.Level,
		Requirements:   requirementsMap,
		ResearchPoints: f.ResearchPoints,
		ProductTypes:   productTypes,
	}
}

func (f *FrameworkJSON) ConvToFramework() Framework {
	if f.DisplayName == "" {
		f.DisplayName = f.Name
		f.Name = RemoveSpaces(f.Name)
	}
	return Framework{
		Name:            f.Name,
		DisplayName:     f.DisplayName,
		ResearchPoints:  f.ResearchPoints,
		PricePerUser:    f.PricePerUser,
		MaxFeatures:     f.MaxFeatures,
		MaxFeatureLevel: f.MaxFeatureLevel,
		LicenseCost:     f.LicenseCost,
		CuPerMs:         f.CuPerMs,
	}
}

func (f *Framework) ConvToJSON() FrameworkJSON {
	return FrameworkJSON{
		Name:            f.Name,
		DisplayName:     f.DisplayName,
		ResearchPoints:  f.ResearchPoints,
		PricePerUser:    f.PricePerUser,
		MaxFeatures:     f.MaxFeatures,
		MaxFeatureLevel: f.MaxFeatureLevel,
		LicenseCost:     f.LicenseCost,
		CuPerMs:         f.CuPerMs,
	}
}

func (p *ProductTypeJSON) ConvToProductType() ProductType {
	if p.DisplayName == "" {
		p.DisplayName = p.Name
		p.Name = RemoveSpaces(p.Name)
	}
	audienceMatches, _ := json.Marshal(p.AudienceMatches)
	return ProductType{
		Name:            p.Name,
		DisplayName:     p.DisplayName,
		Icon:            p.Icon,
		AudienceMatches: string(audienceMatches),
	}
}

func (p *ProductType) ConvToJSON() ProductTypeJSON {
	log.Println(p)
	db := GetDatabase()
	defer db.Close()

	db.Model(&p).Related(&p.Features, "Features")
	features := make([]string, len(p.Features))

	for index, feature := range p.Features {
		features[index] = feature.Name
	}

	var audiences []string
	json.Unmarshal([]byte(p.AudienceMatches), &audiences)

	return ProductTypeJSON{
		Name:            p.Name,
		DisplayName:     p.DisplayName,
		Icon:            p.Icon,
		Features:        features,
		AudienceMatches: audiences,
	}
}
