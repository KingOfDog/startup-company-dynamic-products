package images

import (
	"encoding/base64"
	"io/ioutil"
	"net/http"
)

func GetContentType(content []byte) string {
	return http.DetectContentType(content)
}

func ReadAsBase64(path string) (string, error) {
	bytes, err := ioutil.ReadFile(path)
	if err != nil {
		return "", err
	}

	encoded := base64.StdEncoding.EncodeToString(bytes)
	return "data:" + GetContentType(bytes) + ";base64," + encoded, nil
}
