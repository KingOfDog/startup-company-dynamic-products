package helpers

func Contains(array []string, searched string) bool {
	for _, item := range array {
		if item == searched {
			return true
		}
	}
	return false
}
