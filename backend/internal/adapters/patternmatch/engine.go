package patternmatch

import (
	"strings"
	"time"
)

// MatchBM reports whether pattern appears anywhere in text (case-insensitive) using Boyer-Moore.
func MatchBM(text, pattern string) bool {
	if pattern == "" {
		return true
	}
	return len(SearchBM(strings.ToLower(text), strings.ToLower(pattern))) > 0
}

// MatchKMP reports whether pattern appears anywhere in text (case-insensitive) using KMP.
func MatchKMP(text, pattern string) bool {
	if pattern == "" {
		return true
	}
	return len(SearchKMP(strings.ToLower(text), strings.ToLower(pattern))) > 0
}

type Engine struct{}

func NewEngine() *Engine { return &Engine{} }

type SearchableRecord struct {
	ID     int
	Fields map[string]string
}

type Match struct {
	Field    string `json:"campo"`
	Position int    `json:"posicao"`
}

type RecordMatch struct {
	ID         int     `json:"id"`
	Preview    string  `json:"preview"`
	MatchesBM  []Match `json:"ocorrenciasBM"`
	MatchesKMP []Match `json:"ocorrenciasKMP"`
}

type SearchResult struct {
	Pattern      string        `json:"padrao"`
	Entity       string        `json:"entidade"`
	TotalRecords int           `json:"totalRegistros"`
	Results      []RecordMatch `json:"resultados"`
	DurationBM   float64       `json:"tempoMs_BM"`
	DurationKMP  float64       `json:"tempoMs_KMP"`
}

func (e *Engine) Search(pattern, entity string, records []SearchableRecord) SearchResult {
	result := SearchResult{
		Pattern:      pattern,
		Entity:       entity,
		TotalRecords: len(records),
		Results:      []RecordMatch{},
	}

	lowerPattern := strings.ToLower(pattern)
	if lowerPattern == "" {
		return result
	}

	// Run BM over all records and time it.
	startBM := time.Now()
	bmPerRecord := make([][]Match, len(records))
	for i, rec := range records {
		var matches []Match
		for field, value := range rec.Fields {
			positions := SearchBM(strings.ToLower(value), lowerPattern)
			for _, pos := range positions {
				matches = append(matches, Match{Field: field, Position: pos})
			}
		}
		if matches == nil {
			matches = []Match{}
		}
		bmPerRecord[i] = matches
	}
	result.DurationBM = float64(time.Since(startBM).Nanoseconds()) / 1e6

	// Run KMP over all records and time it.
	startKMP := time.Now()
	kmpPerRecord := make([][]Match, len(records))
	for i, rec := range records {
		var matches []Match
		for field, value := range rec.Fields {
			positions := SearchKMP(strings.ToLower(value), lowerPattern)
			for _, pos := range positions {
				matches = append(matches, Match{Field: field, Position: pos})
			}
		}
		if matches == nil {
			matches = []Match{}
		}
		kmpPerRecord[i] = matches
	}
	result.DurationKMP = float64(time.Since(startKMP).Nanoseconds()) / 1e6

	// Build result list — only records with at least one match.
	for i, rec := range records {
		bm := bmPerRecord[i]
		kmp := kmpPerRecord[i]
		if len(bm) == 0 && len(kmp) == 0 {
			continue
		}

		// Preview: original value of first field that produced a match.
		preview := ""
		for _, m := range bm {
			if val, ok := rec.Fields[m.Field]; ok {
				preview = val
				break
			}
		}

		result.Results = append(result.Results, RecordMatch{
			ID:         rec.ID,
			Preview:    preview,
			MatchesBM:  bm,
			MatchesKMP: kmp,
		})
	}

	return result
}
