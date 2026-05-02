package routes

import (
	"github.com/gin-gonic/gin"
	"cryptovault/handlers"
)

func RegisterRoutes(r *gin.Engine) {
	api := r.Group("/api")
	{
		// ── Core ──
		api.POST("/upload",  handlers.UploadFile)
		api.POST("/verify",  handlers.VerifyFile)

		// ── Files ──
		api.GET("/files",                 handlers.GetAllFiles)
		api.GET("/files/:id",             handlers.GetFileByID)
		api.PUT("/files/:id/revoke",      handlers.RevokeFile)
		api.PUT("/files/:id/visibility",  handlers.UpdateVisibility)
		api.PATCH("/files/:id/tx",        handlers.UpdateTxHash)
		api.GET("/files/:id/versions",    handlers.GetFileVersions)
		api.GET("/files/:id/certificate", handlers.DownloadCertificate)
		api.POST("/files/:id/restore",    handlers.RestoreFile)

		// ── Trash ──
		api.DELETE("/files/:id",          handlers.TrashFile)
		api.GET("/files/trash/all",       handlers.GetTrashFiles)
		api.POST("/files/:id/untrash",    handlers.RestoreFromTrash)
		api.DELETE("/files/:id/permanent",handlers.PermanentDeleteFile)

		// ── Stats ──
		api.GET("/stats",     handlers.GetStats)
		api.GET("/dashboard", handlers.GetStats)

		// ── Notifications ── (NEW!)
		api.GET("/notifications",         handlers.GetNotifications)
		api.PUT("/notifications/read",    handlers.MarkNotificationsRead)
		api.POST("/notifications",        handlers.CreateNotificationAPI)

		// ── Public ──
		api.GET("/public/verify/:id", handlers.PublicVerify)
	}
}