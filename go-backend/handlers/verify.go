package handlers

import (
	"context"
	"fmt"
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
	// 1. Receive File & FileID
	file, _, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File missing in request"})
		return
	}
	defer file.Close()

	fileId := c.PostForm("fileId")

	// 2. Generate current hash
	currentHash, err := utils.GenerateSHA256(file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Hash generation failed"})
		return
	}
	currentHash = strings.ToLower(strings.TrimSpace(currentHash))

	// 3. Fetch from DB
	collection := database.GetCollection("files")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var record models.FileRecord
	dbFound := true
	
	// Lookup strategy: fileId if provided, otherwise fallback to hash
	var dbErr error
	if fileId != "" && fileId != "undefined" {
		dbErr = collection.FindOne(ctx, bson.M{"fileId": fileId}).Decode(&record)
	} else {
		dbErr = collection.FindOne(ctx, bson.M{"originalHash": currentHash}).Decode(&record)
	}

	if dbErr != nil {
		dbFound = false
	}

	dbHash := ""
	if dbFound {
		dbHash = strings.ToLower(strings.TrimSpace(record.OriginalHash))
		fileId = record.FileID // Ensure we have the correct fileId for blockchain check
	}

	// 4. Fetch from Blockchain
	chainHash := ""
	if fileId != "" {
		cHash, err := utils.FetchFileFromChain(fileId)
		if err == nil {
			chainHash = strings.ToLower(strings.TrimSpace(cHash))
		}
	}

	// 5. Decision Logic
	var status string
	var message string

	// User requested debug logs
	fmt.Println("--- VERIFICATION DEBUG ---")
	fmt.Println("FileId:        ", fileId)
	fmt.Println("DB Hash:       ", dbHash)
	fmt.Println("Blockchain Hash:", chainHash)
	fmt.Println("Current Hash:   ", currentHash)
	fmt.Println("--------------------------")

	if dbHash == "" {
		status = "NOT_FOUND"
		message = "🚫 This file was not found in the system"
	} else if chainHash == "" {
		status = "NOT_SYNCED"
		message = "⚠️ This file is not yet synced with the blockchain"
	} else if currentHash == dbHash && currentHash == chainHash {
		status = "VALID"
		message = "✔ This file is safe and unchanged"
	} else if currentHash != dbHash {
		status = "TAMPERED"
		message = "❌ This file has been modified (Tamper Detected)"
	} else {
		// currentHash == dbHash but currentHash != chainHash
		status = "TAMPERED"
		message = "⚠ Blockchain record mismatch (Potential Record Mismatch)"
	}

	// Update record in DB if found
	if dbFound {
		collection.UpdateOne(ctx,
			bson.M{"fileId": record.FileID},
			bson.M{"$set": bson.M{
				"status":     strings.ToLower(status),
				"verifiedAt": time.Now(),
			}},
		)
	}

	// 6. Response
	c.JSON(http.StatusOK, gin.H{
		"status":         status,
		"currentHash":    currentHash,
		"originalHash":   dbHash,
		"blockchainHash": chainHash,
		"message":        message,
		"fileId":         fileId,
		"filename":       record.Filename,
	})
}