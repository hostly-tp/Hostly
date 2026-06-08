package main

import (
	"backend/internal/adapters/repository"
	"log"
)

func main() {
	repo, err := repository.NewUserFileRepository("data/usuarios.db")
	if err != nil {
		log.Fatalf("erro ao abrir repositorio: %v", err)
	}

	if err := repo.MigratePasswordKey("hostly-2024", "hostly-2026"); err != nil {
		log.Fatalf("erro na migracao: %v", err)
	}

	log.Println("Migracao concluida: senhas re-cifradas com a chave hostly-2026")
}
