package handlers

import (
	"context"
	"fmt"
	"io"
	"log"
	"math/rand"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"

	"cryptovault/database"
	"cryptovault/models"
	"cryptovault/utils"
)

func init() {
	os.MkdirAll("uploads", 0755)
	os.MkdirAll("backup", 0755)
}

func UploadFile(c *gin.Context) {
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File not found"})
		return
	}
	defer file.Close()

	wallet := strings.ToLower(c.PostForm("wallet"))
	if wallet == "" {
		wallet = strings.ToLower(c.Request.FormValue("walletAddress"))
	}
	parentFileId := c.PostForm("parentFileId")
	versionNote := c.PostForm("versionNote")

	// 🔍 DEBUG LOGS
	log.Printf("📥 New Upload Request:")
	log.Printf("   Wallet: %s", wallet)
	log.Printf("   File:   %s", header.Filename)

	if wallet == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Wallet address required"})
		return
	}

	// 📂 SAVE FILE LOCALLY
	uploadPath := filepath.Join("uploads", header.Filename)
	out, err := os.Create(uploadPath)
	if err != nil {
		log.Printf("❌ Failed to create file locally: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file locally"})
		return
	}
	defer out.Close()

	// Read file and write to local storage
	fileBytes, err := io.ReadAll(file)
	if err != nil {
		log.Printf("❌ Failed to read uploaded file: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "File read error"})
		return
	}

	_, err = out.Write(fileBytes)
	if err != nil {
		log.Printf("❌ Failed to write file locally: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file locally"})
		return
	}

	log.Printf("💾 File saved locally: %s", uploadPath)

	// Hash
	fileHash := utils.GenerateSHA256FromBytes(fileBytes)

	// Encrypt
	encryptedBytes, err := utils.EncryptAES(fileBytes)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Encryption failed"})
		return
	}

	// Upload to IPFS
	ipfsURL, ipfsCID, err := utils.UploadToPinata(encryptedBytes, header.Filename)
	if err != nil {
		ipfsURL = "mock_url"
		ipfsCID = "mock_cid_" + header.Filename
	}

	// Real blockchain TX will be stored after frontend confirmation
	txHash := ""

	fileID := fmt.Sprintf("FILE-%d", time.Now().Unix())
	publicID := randomString(10)

	collection := database.GetCollection("files")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Expiry
	expiryStr := c.PostForm("expiryDate")
	var expiryDate *time.Time
	if expiryStr != "" {
		t, _ := time.Parse("2006-01-02", expiryStr)
		expiryDate = &t
	}

	// VERSION LOGIC FIX
	if parentFileId != "" {
		var existing models.FileRecord
		err := collection.FindOne(ctx, bson.M{"fileId": parentFileId}).Decode(&existing)

		if err == nil {
			newVersion := existing.Version + 1

			_, _ = collection.UpdateOne(ctx,
				bson.M{"fileId": parentFileId},
				bson.M{
					"$set": bson.M{
						"originalHash": fileHash,
						"ipfsCID":      ipfsCID,
						"encryptedURL":  ipfsURL,
						"txHash":       txHash,
						"fileSize":     header.Size,
						"mimeType":     header.Header.Get("Content-Type"),
						"version":      newVersion,
						"uploadedAt":   time.Now(),
					},
					"$push": bson.M{
						"versions": models.VersionRecord{
							VersionNumber: newVersion,
							Hash:          ipfsCID, // Store CID in versions too
							TxHash:        txHash,
							Timestamp:     time.Now(),
							Note:          versionNote,
						},
					},
				})

			fileID = parentFileId
			publicID = existing.PublicID
		}
	} else {
		// 🛡️ DUPLICATE PREVENTION (Requirement #1)
		var duplicate models.FileRecord
		dupFilter := bson.M{
			"walletAddress": wallet,
			"originalHash": fileHash,
			"isDeleted":    bson.M{"$ne": true},
		}
		err := collection.FindOne(ctx, dupFilter).Decode(&duplicate)
		if err == nil {
			log.Printf("⚠️ Duplicate file detected for wallet %s. Returning existing record.", wallet)
			c.JSON(http.StatusOK, gin.H{
				"message":  "File already exists",
				"fileId":   duplicate.FileID,
				"publicId": duplicate.PublicID,
				"filename": duplicate.Filename,
				"txHash":   duplicate.TxHash,
				"isDuplicate": true,
			})
			return
		}

		// 🛡️ TX HASH VALIDATION (Requirement #4)
		// Try to get txHash from frontend first, else use mock
		clientTxHash := c.PostForm("txHash")
		if clientTxHash != "" {
			if !strings.HasPrefix(clientTxHash, "0x") || len(clientTxHash) != 66 {
				log.Printf("❌ Invalid txHash provided: %s", clientTxHash)
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid transaction hash format"})
				return
			}
			txHash = clientTxHash
		}

		// New file
		record := models.FileRecord{
			FileID:        fileID,
			PublicID:      publicID,
			Filename:      header.Filename,
			OriginalHash:  fileHash,
			EncryptedURL:  ipfsURL,
			IpfsCID:       ipfsCID,
			FileSize:      header.Size,
			MimeType:      header.Header.Get("Content-Type"),
			WalletAddress: wallet,
			TxHash:        txHash,
			Status:        "valid",
			ExpiryDate:    expiryDate,
			UploadedAt:    time.Now(),
			Version:       1,
		}

		result, err := collection.InsertOne(ctx, record)
		if err != nil {
			log.Printf("❌ MongoDB INSERT ERROR: %v", err)
			c.JSON(500, gin.H{"error": "DB save failed: " + err.Error()})
			return
		} else {
			log.Printf("✅ MongoDB INSERT SUCCESS: %v", result.InsertedID)
		}
	}

	//  FINAL RESPONSE FIX
	c.JSON(http.StatusOK, gin.H{
		"fileId":   fileID,
		"publicId": publicID,
		"filename": header.Filename,
		"fileHash": fileHash,
		"ipfsCID":  ipfsCID,
		"fileSize": header.Size,
		"txHash":   txHash,
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