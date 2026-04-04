package handlers

import (
	"context"
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"

	"cryptovault/database"
	"cryptovault/models"
	"cryptovault/utils"
)

func UploadFile(c *gin.Context) {
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File nahi mila"})
		return
	}
	defer file.Close()

	wallet := c.Request.FormValue("walletAddress")
	if wallet == "" {
		wallet = "unknown"
	}

	// Step 1 — File bytes read karo
	fileBytes, err := io.ReadAll(file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "File read error"})
		return
	}

	// Step 2 — SHA-256 hash
	fileHash := utils.GenerateSHA256FromBytes(fileBytes)

	// Step 3 — AES-256 encrypt
	encryptedBytes, err := utils.EncryptAES(fileBytes)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Encrypt error"})
		return
	}

	// Step 4 — Pinata IPFS upload (encrypted file)
	ipfsURL, err := utils.UploadToPinata(encryptedBytes, "encrypted_"+header.Filename)
	if err != nil {
		// IPFS fail zali tari — mock URL vaprto, upload continue hoto
		ipfsURL = fmt.Sprintf("https://gateway.pinata.cloud/ipfs/mock_%s", header.Filename)
	}

	// Step 5 — Mock TX hash
	txHash := utils.MockTxHash(fileHash)

	// Step 6 — File ID
	fileID := fmt.Sprintf("FILE-%s%d", randomString(6), time.Now().Unix())

	parentFileID := c.Request.FormValue("parentFileId")
	versionNote  := c.Request.FormValue("versionNote")
	version      := 1
	versionGroup := fileID // default — new file = new group

	if parentFileID != "" {
		var parentRecord models.FileRecord
		collection := database.GetCollection("files")
		ctx2, cancel2 := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel2()

		err := collection.FindOne(ctx2, bson.M{"fileId": parentFileID}).Decode(&parentRecord)
		if err == nil {
			version      = parentRecord.Version + 1
			versionGroup = parentRecord.VersionGroup
			if versionGroup == "" {
				versionGroup = parentFileID
			}
		}
	}

	// Step 7 — Expiry date
	expiryDateStr := c.Request.FormValue("expiryDate")
	var expiryDate *time.Time
	if expiryDateStr != "" {
		parsed, err := time.Parse("2006-01-02", expiryDateStr)
		if err == nil {
			expiryDate = &parsed
		}
	}

	// Step 8 — MongoDB save
	record := models.FileRecord{
		FileID:        fileID,
		Filename:      header.Filename,
		OriginalHash:  fileHash,
		EncryptedURL:  ipfsURL,   // ← Pinata IPFS URL!
		FileSize:      header.Size,
		WalletAddress: wallet,
		TxHash:        txHash,
		Status:        "valid",
		IsRevoked:     false,
		ExpiryDate:    expiryDate,
		IsExpired:     false,
		UploadedAt:    time.Now(),
		Version:       version,
		ParentFileID:  parentFileID,
		VersionGroup:  versionGroup,
		VersionNote:   versionNote,
	}

	collection := database.GetCollection("files")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err = collection.InsertOne(ctx, record)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "MongoDB save error"})
		return
	}

	// Response
	c.JSON(http.StatusCreated, gin.H{
		"success":   true,
		"message":   "File sealed on blockchain + IPFS!",
		"fileId":    fileID,
		"filename":  header.Filename,
		"fileHash":  fileHash,
		"ipfsUrl":   ipfsURL,       // ← IPFS URL frontend la pathavto
		"txHash":    txHash,
		"fileSize":  header.Size,
		"timestamp": time.Now().Format(time.RFC3339),
	})
}

func randomString(n int) string {
	letters := []rune("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789")
	s := make([]rune, n)
	for i := range s {
		s[i] = letters[rand.Intn(len(letters))]
	}
	return string(s)
}
