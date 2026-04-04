package utils

import (
  "crypto/aes"
  "crypto/cipher"
  "crypto/rand"
  "errors"
  "io"
  "os"
)

func EncryptAES(data []byte) ([]byte, error) {
  key := []byte(os.Getenv("ENCRYPTION_KEY"))
  if len(key) == 0 {
    key = []byte("cryptovault2025securekey12345678") // 32 bytes default
  }
  // 32 bytes exactly
  if len(key) > 32 { key = key[:32] }
  for len(key) < 32 { key = append(key, '0') }

  block, err := aes.NewCipher(key)
  if err != nil { return nil, err }

  gcm, err := cipher.NewGCM(block)
  if err != nil { return nil, err }

  nonce := make([]byte, gcm.NonceSize())
  if _, err = io.ReadFull(rand.Reader, nonce); err != nil {
    return nil, err
  }

  return gcm.Seal(nonce, nonce, data, nil), nil
}

func DecryptAES(data []byte) ([]byte, error) {
  key := []byte(os.Getenv("ENCRYPTION_KEY"))
  if len(key) == 0 {
    key = []byte("cryptovault2025securekey12345678")
  }
  if len(key) > 32 { key = key[:32] }
  for len(key) < 32 { key = append(key, '0') }

  block, err := aes.NewCipher(key)
  if err != nil { return nil, err }

  gcm, err := cipher.NewGCM(block)
  if err != nil { return nil, err }

  nonceSize := gcm.NonceSize()
  if len(data) < nonceSize {
    return nil, errors.New("ciphertext too short")
  }

  nonce, ciphertext := data[:nonceSize], data[nonceSize:]
  return gcm.Open(nil, nonce, ciphertext, nil)
}
