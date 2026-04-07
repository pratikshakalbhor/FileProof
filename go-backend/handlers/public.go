package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"

	"cryptovault/database"
	"cryptovault/models"
)

// PublicVerify — Unauthenticated file lookup by PublicID
func PublicVerify(c *gin.Context) {
	publicID := c.Param("id")

	collection := database.GetCollection("files")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var record models.FileRecord
	err := collection.FindOne(ctx, bson.M{"publicId": publicID}).Decode(&record)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Verify link invalid ya expire zala aahe"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":   true,
		"filename":  record.Filename,
		"fileId":    record.FileID,
		"fileHash":  record.OriginalHash,
		"txHash":    record.TxHash,
		"version":   record.Version,
		"updatedAt": record.UploadedAt,
		"status":    record.Status,
	})
}
