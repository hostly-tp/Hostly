package compression

import (
	"bytes"
	"math/rand"
	"testing"
)

func TestLZWRoundTrip(t *testing.T) {
	cases := map[string][]byte{
		"empty":           {},
		"single byte":     {'a'},
		"single repeated": bytes.Repeat([]byte{'x'}, 1000),
		"text":            []byte("a casa azul fica na rua azul, perto da casa amarela"),
		"all bytes":       allBytes(),
	}
	for name, input := range cases {
		t.Run(name, func(t *testing.T) {
			enc, err := lzwEncode(input)
			if err != nil {
				t.Fatalf("encode: %v", err)
			}
			dec, err := lzwDecode(enc)
			if err != nil {
				t.Fatalf("decode: %v", err)
			}
			if !bytes.Equal(dec, input) {
				t.Fatalf("round-trip mismatch: got %d bytes, want %d", len(dec), len(input))
			}
		})
	}
}

func TestLZWRoundTripRandom(t *testing.T) {
	rng := rand.New(rand.NewSource(11))
	for i := 0; i < 50; i++ {
		input := make([]byte, rng.Intn(4096))
		rng.Read(input)
		enc, err := lzwEncode(input)
		if err != nil {
			t.Fatalf("encode iter %d: %v", i, err)
		}
		dec, err := lzwDecode(enc)
		if err != nil {
			t.Fatalf("decode iter %d: %v", i, err)
		}
		if !bytes.Equal(dec, input) {
			t.Fatalf("iter %d: round-trip mismatch", i)
		}
	}
}

// TestLZWKwKwK exercises the special case where a code references a dictionary
// entry that is only being defined on this step (repetitive run like "ababab").
func TestLZWKwKwK(t *testing.T) {
	input := bytes.Repeat([]byte("ab"), 500)
	enc, err := lzwEncode(input)
	if err != nil {
		t.Fatalf("encode: %v", err)
	}
	dec, err := lzwDecode(enc)
	if err != nil {
		t.Fatalf("decode: %v", err)
	}
	if !bytes.Equal(dec, input) {
		t.Fatal("KwKwK round-trip mismatch")
	}
}
