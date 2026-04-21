package handlers

import (
	"context"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"

	"cryptovault/database"
	"cryptovault/models"
	"cryptovault/utils"
)

func VerifyFile(c *gin.Context) {
	// Step 1 — Receive File
	file, _, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File not found in request"})
		return
	}
	defer file.Close()

	// Step 2 — Generate current hash
	currentHash, err := utils.GenerateSHA256(file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Hash generation failed"})
		return
	}

	// Logging identifiers
	log.Printf("[VERIFY] Request received. Computed Hash: %s", currentHash)

	// Step 3 — Search MongoDB
	collection := database.GetCollection("files")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var record models.FileRecord
	err = collection.FindOne(ctx, bson.M{"originalHash": currentHash}).Decode(&record)

	dbVerified := (err == nil)
	chainVerified := false
	blockchainHash := ""
	finalStatus := "TAMPERED"

	if dbVerified {
		// Log found record
		log.Printf("[VERIFY] DB Match Found! FileID: %s | DB Hash: %s", record.FileID, record.OriginalHash)

		// Step 4 — Dual Check Blockchain
		ok, bcHash, bcErr := utils.VerifyOnChain(record.FileID, currentHash)
		if bcErr != nil {
			log.Printf("[VERIFY] WARNING: Blockchain check failed: %v", bcErr)
			// We don't fail the whole request, but chainVerified remains false
		} else {
			chainVerified = ok
			blockchainHash = bcHash
		}

		// Revoked check (secondary)
		if record.IsRevoked {
			finalStatus = "REVOKED"
		} else if chainVerified {
			finalStatus = "SAFE"
		} else {
			// Found in DB but mismatch/missing on chain
			if blockchainHash == "" {
				finalStatus = "NOT_SYNCED"
			} else {
				finalStatus = "MISMATCH"
			}
		}
	}

	// MongoDB status update (Audit trail)
	if dbVerified {
		now := time.Now()
		collection.UpdateOne(ctx,
			bson.M{"fileId": record.FileID},
			bson.M{"$set": bson.M{
				"status":     strings.ToLower(finalStatus),
				"verifiedAt": now,
			}},
		)
	}

	// Final Response Structure
	c.JSON(http.StatusOK, gin.H{
		"success":        true,
		"dbVerified":     dbVerified,
		"chainVerified":  chainVerified,
		"finalStatus":    finalStatus,
		"fileId":         record.FileID,
		"filename":       record.Filename,
		"currentHash":    currentHash,
		"originalHash":   record.OriginalHash,
		"blockchainHash": blockchainHash,
		"txHash":         record.TxHash,
		"walletAddress":  record.WalletAddress,
		"uploadedAt":     record.UploadedAt,
	})
}