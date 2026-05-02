package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"

	"cryptovault/database"
)

// ── GET NOTIFICATIONS ──────────────────────────
func GetNotifications(c *gin.Context) {
	wallet := c.Query("wallet")
	if wallet == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "wallet required"})
		return
	}

	col := database.GetCollection("notifications")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	opts   := options.Find().SetSort(bson.M{"createdAt": -1}).SetLimit(20)
	cursor, err := col.Find(ctx, bson.M{"user": wallet}, opts)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"success": true, "notifications": []interface{}{}})
		return
	}
	defer cursor.Close(ctx)

	var notifications []bson.M
	cursor.All(ctx, &notifications)
	if notifications == nil {
		notifications = []bson.M{}
	}

	// Unread count
	unread, _ := col.CountDocuments(ctx, bson.M{"user": wallet, "read": false})

	c.JSON(http.StatusOK, gin.H{
		"success":       true,
		"notifications": notifications,
		"unread":        unread,
	})
}

// ── MARK ALL READ ──────────────────────────────
func MarkNotificationsRead(c *gin.Context) {
	wallet := c.Query("wallet")
	if wallet == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "wallet required"})
		return
	}

	col := database.GetCollection("notifications")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	col.UpdateMany(ctx,
		bson.M{"user": wallet, "read": false},
		bson.M{"$set": bson.M{"read": true}},
	)

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Marked as read"})
}

// ── CREATE NOTIFICATION (internal helper) ──────
func CreateNotification(wallet, message, notifType, fileId string) {
	if wallet == "" || wallet == "unknown" {
		return
	}
	col := database.GetCollection("notifications")
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	col.InsertOne(ctx, bson.M{
		"user":      wallet,
		"message":   message,
		"type":      notifType,
		"fileId":    fileId,
		"read":      false,
		"createdAt": time.Now(),
	})
}

// ── CREATE NOTIFICATION API ────────────────────
func CreateNotificationAPI(c *gin.Context) {
	var body struct {
		Wallet  string `json:"wallet"`
		Message string `json:"message"`
		Type    string `json:"type"`
		FileId  string `json:"fileId"`
	}
	c.ShouldBindJSON(&body)
	CreateNotification(body.Wallet, body.Message, body.Type, body.FileId)
	c.JSON(200, gin.H{"success": true})
}
