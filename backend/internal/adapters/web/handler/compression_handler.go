package handler

import (
	"backend/internal/adapters/compression"
	"encoding/base64"
	"encoding/json"
	"errors"
	"net/http"
	"os"
)

var entityFiles = map[string]string{
	"imoveis":  "data/imoveis.db",
	"usuarios": "data/usuarios.db",
	"reservas": "data/reservas.db",
}

type CompressionHandler struct {
	engine *compression.Engine
}

func NewCompressionHandler(e *compression.Engine) *CompressionHandler {
	return &CompressionHandler{engine: e}
}

type compressRequest struct {
	Entidade  string `json:"entidade"`
	Algoritmo string `json:"algoritmo"`
}

func (h *CompressionHandler) Compress(w http.ResponseWriter, r *http.Request) {
	var req compressRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, err)
		return
	}

	path, ok := entityFiles[req.Entidade]
	if !ok {
		respondError(w, http.StatusBadRequest, errors.New("entidade desconhecida"))
		return
	}

	data, err := os.ReadFile(path)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}

	result, err := h.engine.Compress(data, req.Algoritmo)
	if err != nil {
		respondError(w, http.StatusBadRequest, err)
		return
	}
	respondJSON(w, http.StatusOK, result)
}

type decompressRequest struct {
	Algoritmo        string `json:"algoritmo"`
	DadosComprimidos string `json:"dadosComprimidos"`
	TamanhoOriginal  int    `json:"tamanhoOriginal"`
}

func (h *CompressionHandler) Decompress(w http.ResponseWriter, r *http.Request) {
	var req decompressRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, err)
		return
	}

	raw, err := base64.StdEncoding.DecodeString(req.DadosComprimidos)
	if err != nil {
		respondError(w, http.StatusBadRequest, errors.New("dadosComprimidos não é base64 válido"))
		return
	}

	result, err := h.engine.Decompress(raw, req.Algoritmo, req.TamanhoOriginal)
	if err != nil {
		respondError(w, http.StatusBadRequest, err)
		return
	}
	respondJSON(w, http.StatusOK, result)
}
