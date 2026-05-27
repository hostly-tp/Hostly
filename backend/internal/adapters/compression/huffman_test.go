package compression

import (
	"bytes"
	"math/rand"
	"testing"
)

func TestHuffmanRoundTrip(t *testing.T) {
	cases := map[string][]byte{
		"empty":           {},
		"single byte":     {'a'},
		"single repeated": bytes.Repeat([]byte{'x'}, 1000),
		"text":            []byte("a casa azul fica na rua azul, perto da casa amarela"),
		"all bytes":       allBytes(),
	}
	for name, input := range cases {
		t.Run(name, func(t *testing.T) {
			enc, err := huffmanEncode(input)
			if err != nil {
				t.Fatalf("encode: %v", err)
			}
			dec, err := huffmanDecode(enc)
			if err != nil {
				t.Fatalf("decode: %v", err)
			}
			if !bytes.Equal(dec, input) {
				t.Fatalf("round-trip mismatch: got %d bytes, want %d", len(dec), len(input))
			}
		})
	}
}

func TestHuffmanRoundTripRandom(t *testing.T) {
	rng := rand.New(rand.NewSource(7))
	for i := 0; i < 50; i++ {
		input := make([]byte, rng.Intn(4096))
		rng.Read(input)
		enc, err := huffmanEncode(input)
		if err != nil {
			t.Fatalf("encode iter %d: %v", i, err)
		}
		dec, err := huffmanDecode(enc)
		if err != nil {
			t.Fatalf("decode iter %d: %v", i, err)
		}
		if !bytes.Equal(dec, input) {
			t.Fatalf("iter %d: round-trip mismatch", i)
		}
	}
}

func allBytes() []byte {
	b := make([]byte, 256)
	for i := range b {
		b[i] = byte(i)
	}
	return b
}
