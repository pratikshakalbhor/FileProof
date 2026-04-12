package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"

	"cryptovault/database"
	"cryptovault/models"
)

func GetAllFiles(c *gin.Context) {
	collection := database.GetCollection("files")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Optional wallet filter
	filter := bson.M{}
	wallet := c.Query("wallet")
	if wallet != "" {
		filter["walletAddress"] = wallet
	}

	// Latest first
	opts := options.Find().SetSort(bson.M{"uploadedAt": -1})
	cursor, err := collection.Find(ctx, filter, opts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Files fetch error"})
		return
	}
	defer cursor.Close(ctx)

	var files []models.FileRecord
	cursor.All(ctx, &files)

	if files == nil {
		files = []models.FileRecord{}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"count":   len(files),
		"files":   files,
	})
}

func GetFileByID(c *gin.Context) {
	fileID := c.Param("id")

	collection := database.GetCollection("files")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var record models.FileRecord
	err := collection.FindOne(ctx, bson.M{"fileId": fileID}).Decode(&record)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "File nahi mila"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "file": record})
}

func RevokeFile(c *gin.Context) {
	fileID := c.Param("id")

	collection := database.GetCollection("files")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var record models.FileRecord
	err := collection.FindOne(ctx, bson.M{"fileId": fileID}).Decode(&record)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "File nahi mila"})
		return
	}

	if record.IsRevoked {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Already revoked aahe"})
		return
	}

	collection.UpdateOne(ctx,
		bson.M{"fileId": fileID},
		bson.M{"$set": bson.M{"isRevoked": true, "status": "revoked"}},
	)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": fileID + " revoked successfully",
	})
}

func GetFileVersions(c *gin.Context) {
	fileID := c.Param("id")

	collection := database.GetCollection("files")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var record models.FileRecord
	err := collection.FindOne(ctx, bson.M{"fileId": fileID}).Decode(&record)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "File nahi mila"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":  true,
		"fileId":   fileID,
		"versions": record.Versions,
		"total":    len(record.Versions),
	})
}

func GetStats(c *gin.Context) {
	collection := database.GetCollection("files")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	total, _    := collection.CountDocuments(ctx, bson.M{})
	valid, _    := collection.CountDocuments(ctx, bson.M{"status": "valid"})
	tampered, _ := collection.CountDocuments(ctx, bson.M{"status": "tampered"})
	revoked, _  := collection.CountDocuments(ctx, bson.M{"status": "revoked"})

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"stats": models.Stats{
			Total:    total,
			Valid:    valid,
			Tampered: tampered,
			Revoked:  revoked,
		},
	})
}

// UpdateVisibility — file visibility change karo
func UpdateVisibility(c *gin.Context) {
	fileID := c.Param("id")

	var body struct {
		Visibility string   `json:"visibility"`
		SharedWith []string `json:"sharedWith"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	if body.Visibility != "private" && body.Visibility != "public" && body.Visibility != "shared" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid visibility — use private/public/shared"})
		return
	}

	collection := database.GetCollection("files")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	update := bson.M{
		"$set": bson.M{
			"visibility": body.Visibility,
			"sharedWith": body.SharedWith,
		},
	}

	_, err := collection.UpdateOne(ctx, bson.M{"fileId": fileID}, update)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Update failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":    true,
		"fileId":     fileID,
		"visibility": body.Visibility,
		"sharedWith": body.SharedWith,
	})
}