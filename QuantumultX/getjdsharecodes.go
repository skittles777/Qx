package main

import (
	"fmt"
	"io/ioutil"
	"regexp"
	"strings"
)

const (
	SEP                 = "@"
	QUOTE               = "'"
	SHARECODE_FILE_PATH = `G:\github_code\Qx\sharecodes.txt`
)

func readFile(fileName string) {
	ctx, _ := ioutil.ReadFile(SHARECODE_FILE_PATH)
	keys := getAllValues(`）(.*)】`, string(ctx))
	fmt.Println("****", rmDuplicate(keys))
	exprMap := make(map[string][]string)
	for _, r := range getCodeValRegExps(rmDuplicate(keys)) {
		var ncLists []string
		for _, v := range r.FindAllStringSubmatch(string(ctx), -1) {
			ncLists = append(ncLists, v[1])
		}
		exprMap[r.String()] = ncLists
	}
	fmt.Println("**********", exprMap)

	for k, v := range exprMap {
		fmt.Println("\n", k)
		generateList(v)
	}
}

func getCodeValRegExps(keys []string) (regList []*regexp.Regexp) {
	for _, v := range keys {
		regList = append(regList, regexp.MustCompile(v+`】(\S*)`))
	}
	return
}

func getAllValues(expr string, src string) (keys []string) {
	r := regexp.MustCompile(expr)
	for _, v := range r.FindAllStringSubmatch(src, -1) {
		keys = append(keys, v[1])
	}
	return
}

func rmDuplicate(klist []string) (uniqueList []string) {
	tmpMap := make(map[string]string)
	for _, v := range klist {
		tmpMap[v] = v
	}
	for k := range tmpMap {
		uniqueList = append(uniqueList, k)
	}
	return
}

func generateList(shareCodeList []string) (codeList []string) {
	for i := range shareCodeList {
		var tmp []string
		tmp = append(tmp, shareCodeList[0:i]...)
		tmp = append(tmp, shareCodeList[i+1:]...)
		codeList = append(codeList, QUOTE+strings.Join(tmp, SEP)+QUOTE+",")
	}
	fmt.Println(strings.Join(codeList, "\n"))
	return
}
