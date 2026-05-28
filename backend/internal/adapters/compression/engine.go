package compression

import (
	"encoding/base64"
	"errors"
	"strings"
)

const (
	AlgoHuffman = "huffman"
	AlgoLZW     = "lzw"
)

var errUnknownAlgo = errors.New("algoritmo desconhecido")

// Engine selects between the Huffman and LZW implementations by algorithm name
// and produces typed results for the HTTP layer to serialize.
type Engine struct{}

func NewEngine() *Engine { return &Engine{} }

type CompressResult struct {
	Algo           string  `json:"algoritmo"`
	OriginalSize   int     `json:"tamanhoOriginal"`
	CompressedSize int     `json:"tamanhoComprimido"`
	Ratio          float64 `json:"taxa"`
	CompressedB64  string  `json:"dadosComprimidos"`
}

type DecompressResult struct {
	Algo         string `json:"algoritmo"`
	OriginalSize int    `json:"tamanhoOriginal"`
	RestoredSize int    `json:"tamanhoRestaurado"`
	Verified     bool   `json:"verificado"`
}

func (e *Engine) Compress(data []byte, algo string) (CompressResult, error) {
	normalized := strings.ToLower(strings.TrimSpace(algo))
	encoded, err := runEncode(data, normalized)
	if err != nil {
		return CompressResult{}, err
	}
	ratio := 0.0
	if len(data) > 0 {
		ratio = float64(len(encoded)) / float64(len(data))
	}
	return CompressResult{
		Algo:           normalized,
		OriginalSize:   len(data),
		CompressedSize: len(encoded),
		Ratio:          ratio,
		CompressedB64:  base64.StdEncoding.EncodeToString(encoded),
	}, nil
}

func (e *Engine) Decompress(data []byte, algo string, originalSize int) (DecompressResult, error) {
	normalized := strings.ToLower(strings.TrimSpace(algo))
	decoded, err := runDecode(data, normalized)
	if err != nil {
		return DecompressResult{}, err
	}
	return DecompressResult{
		Algo:         normalized,
		OriginalSize: originalSize,
		RestoredSize: len(decoded),
		Verified:     len(decoded) == originalSize,
	}, nil
}

func runEncode(data []byte, algo string) ([]byte, error) {
	switch algo {
	case AlgoHuffman:
		return huffmanEncode(data)
	case AlgoLZW:
		return lzwEncode(data)
	default:
		return nil, errUnknownAlgo
	}
}

func runDecode(data []byte, algo string) ([]byte, error) {
	switch algo {
	case AlgoHuffman:
		return huffmanDecode(data)
	case AlgoLZW:
		return lzwDecode(data)
	default:
		return nil, errUnknownAlgo
	}
}
