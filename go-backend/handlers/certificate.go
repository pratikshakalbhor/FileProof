package handlers

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jung-kurt/gofpdf"
	"github.com/skip2/go-qrcode"
	"go.mongodb.org/mongo-driver/bson"

	"cryptovault/database"
	"cryptovault/models"
)

func DownloadCertificate(c *gin.Context) {
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

	// ── PDF Generate ──
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.AddPage()

	// Header
	pdf.SetFillColor(20, 20, 25) // Dark theme theme
	pdf.Rect(0, 0, 210, 40, "F")
	
	pdf.SetFont("Arial", "B", 24)
	pdf.SetTextColor(255, 255, 255)
	pdf.Text(10, 25, "CryptoVault Integrity Certificate")
	
	pdf.SetFont("Arial", "I", 10)
	pdf.Text(10, 32, "Enterprise-Grade Document Verification")

	// Content
	pdf.SetTextColor(50, 50, 50)
	pdf.SetY(50)
	pdf.SetFont("Arial", "B", 14)
	pdf.Cell(0, 10, "Document Details")
	pdf.Ln(10)
	
	pdf.SetFont("Arial", "", 11)
	pdf.Cell(40, 8, "Filename:")
	pdf.Cell(0, 8, record.Filename)
	pdf.Ln(8)
	
	pdf.Cell(40, 8, "File ID:")
	pdf.Cell(0, 8, record.FileID)
	pdf.Ln(8)
	
	pdf.Cell(40, 8, "Seal Date:")
	pdf.Cell(0, 8, record.UploadedAt.Format("02 Jan 2006, 15:04:05 MST"))
	pdf.Ln(10)
	
	// Blockchain Proof
	pdf.SetFont("Arial", "B", 14)
	pdf.Cell(0, 10, "Blockchain Proof of Integrity")
	pdf.Ln(10)
	
	pdf.SetFont("Courier", "", 9)
	pdf.SetFillColor(245, 245, 245)
	
	pdf.Cell(0, 6, "Digital Fingerprint (SHA-256):")
	pdf.Ln(6)
	pdf.MultiCell(190, 6, record.OriginalHash, "1", "L", true)
	pdf.Ln(4)
	
	pdf.Cell(0, 6, "Transaction Hash (Ethereum Sepolia):")
	pdf.Ln(6)
	pdf.MultiCell(190, 6, record.TxHash, "1", "L", true)
	pdf.Ln(10)

	// QR Code (Scan to Verify)
	// Base URL should be the frontend verify link
	verifyURL := fmt.Sprintf("http://localhost:3000/verify-public?fileId=%s&publicId=%s", record.FileID, record.PublicID)
	qrBytes, _ := qrcode.Encode(verifyURL, qrcode.Medium, 256)
	
	// In-memory format for gofpdf image
	pdf.RegisterImageOptionsReader("qr", gofpdf.ImageOptions{ImageType: "PNG"}, bytesToReader(qrBytes))
	
	pdf.SetY(180)
	pdf.ImageOptions("qr", 75, pdf.GetY(), 60, 60, false, gofpdf.ImageOptions{ImageType: "PNG"}, 0, "")
	
	pdf.SetY(240)
	pdf.SetFont("Arial", "B", 10)
	pdf.CellFormat(190, 10, "Scan to Verify Authenticity", "0", 0, "C", false, 0, "")
	
	pdf.SetY(260)
	pdf.SetFont("Arial", "I", 8)
	pdf.SetTextColor(150, 150, 150)
	pdf.CellFormat(190, 10, "This document is cryptographically sealed and verified on the blockchain. Any modification will invalidate this proof.", "0", 0, "C", false, 0, "")

	// Finalize
	c.Header("Content-Type", "application/pdf")
	c.Header("Content-Disposition", "attachment; filename=Certificate_"+record.Filename+".pdf")
	
	err = pdf.Output(c.Writer)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "PDF generate fail zala"})
	}
}

// Helper func
type bytesReader struct {
	data []byte
	off  int
}

func (r *bytesReader) Read(b []byte) (int, error) {
	if r.off >= len(r.data) {
		return 0, fmt.Errorf("EOF")
	}
	n := copy(b, r.data[r.off:])
	r.off += n
	return n, nil
}

func bytesToReader(b []byte) *bytesReader {
	return &bytesReader{data: b}
}
