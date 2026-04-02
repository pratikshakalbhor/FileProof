# 🔐 ChainLock — CryptoVault

> **Blockchain-Based Encrypted File Storage with Integrity Verification**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.19-blue.svg)](https://soliditylang.org/)
[![Go](https://img.shields.io/badge/Go-1.21-cyan.svg)](https://golang.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green.svg)](https://mongodb.com/)
[![Ethereum](https://img.shields.io/badge/Ethereum-Sepolia-purple.svg)](https://sepolia.etherscan.io/)

---

## 📌 Problem Statement

Cloud storage files can be **silently corrupted or tampered** without anyone knowing:

- 🦠 **Bit Rot** — Hardware failures corrupt files over time, undetected
- 👤 **Insider Threats** — Cloud employees can modify database records
- 🏥 **Real Incident** — AIIMS Delhi 2023: 40 million patient records compromised
- ⚖️ **No Legal Proof** — Traditional databases cannot prove data integrity

> **"Wrong Data is more dangerous than No Data"**

---

## ✅ Solution — "Trust but Verify"

CryptoVault uses a **3-Layer Security System**:

```
Layer 1 → AES-256 Encryption    (File encrypted before upload)
Layer 2 → SHA-256 Hashing       (Unique digital fingerprint)
Layer 3 → Blockchain Seal       (Hash permanently stored on Ethereum)
```

**Verification Flow:**
```
Re-upload same file → New hash generated → Compare with blockchain hash
    ↓
Hash Match    → ✅ VALID    — File is authentic
Hash Mismatch → ⚠️ TAMPERED — File has been modified
```

---

## 🏗️ Architecture

```
👤 User (MetaMask Wallet)
        ↓
🖥️  React Frontend (JSX + Framer Motion)
        ↓                    ↓
⚙️  Go Backend (Gin)    ⛓️  Ethereum Smart Contract
        ↓                    ↓
🍃  MongoDB Atlas       📜  CryptoVault.sol (Sepolia)
☁️  Cloudinary
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React + JSX + Framer Motion | User Interface |
| Backend | Go + Gin Framework | API Server |
| Database | MongoDB Atlas | File Metadata |
| Cloud Storage | Cloudinary | Encrypted File Storage |
| Blockchain | Solidity + Ethereum Sepolia | Hash Seal (Immutable) |
| Web3 | ethers.js | Blockchain Interaction |
| Wallet | MetaMask | User Authentication |
| Hashing | SHA-256 (Go crypto) | File Fingerprint |
| Encryption | AES-256-GCM (Go crypto) | File Encryption |

---

## 📁 Project Structure

```
ChainLock/
├── 📁 frontend/                    ← React Application
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Landing.jsx         ← Home page (before login)
│   │   │   ├── Login.jsx           ← MetaMask wallet connect
│   │   │   ├── Dashboard.jsx       ← Stats + Integrity Score
│   │   │   ├── Upload.jsx          ← File upload + blockchain seal
│   │   │   ├── Verify.jsx          ← File integrity verification
│   │   │   ├── Files.jsx           ← File management
│   │   │   ├── BlockchainLog.jsx   ← Transaction history
│   │   │   └── Profile.jsx         ← Wallet info
│   │   ├── components/
│   │   │   ├── Sidebar.jsx         ← Navigation
│   │   │   ├── Topbar.jsx          ← Header
│   │   │   ├── StatusBadge.jsx     ← Valid/Tampered badge
│   │   │   ├── TxStatus.jsx        ← Transaction status
│   │   │   └── Loading.jsx         ← Loading states
│   │   ├── utils/
│   │   │   ├── api.js              ← Go Backend API calls
│   │   │   ├── blockchain.js       ← ethers.js contract calls
│   │   │   └── animations.js       ← Framer Motion variants
│   │   └── contracts/
│   │       └── abi.json            ← Smart contract ABI
│   └── .env                        ← Environment variables
│
├── 📁 go-backend/                  ← Go API Server
│   ├── main.go                     ← Entry point
│   ├── database/
│   │   └── db.go                   ← MongoDB connection
│   ├── handlers/
│   │   ├── upload.go               ← File upload handler
│   │   ├── verify.go               ← File verify handler
│   │   └── files.go                ← File CRUD handlers
│   ├── models/
│   │   └── file.go                 ← MongoDB schema
│   ├── routes/
│   │   └── routes.go               ← API route registration
│   └── utils/
│       └── hash.go                 ← SHA-256 utility
│
└── 📁 contracts/                   ← Solidity Smart Contract
    ├── CryptoVault.sol             ← Main contract
    └── abi.json                    ← Contract ABI
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Go](https://golang.org/) v1.21+
- [MetaMask](https://metamask.io/) browser extension
- [MongoDB Atlas](https://mongodb.com/atlas) account
- Sepolia testnet ETH ([Faucet](https://sepoliafaucet.com/))

---

### 1. Clone Repository

```bash
git clone https://github.com/pratikshakalbhor/CryptoVault.git
cd ChainLock
```

---

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

Edit `frontend/.env`:
```env
REACT_APP_CONTRACT_ADDRESS=0x_your_deployed_contract_address
REACT_APP_API_URL=http://localhost:5000/api
```

```bash
# Start frontend
npm start
```

Frontend runs at: `http://localhost:3000`

---

### 3. Go Backend Setup

```bash
cd go-backend

# Create .env file
```

Create `go-backend/.env`:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
PORT=5000
```

```bash
# Install dependencies
go mod tidy

# Run backend
go run main.go
```

Backend runs at: `http://localhost:5000`

---

### 4. Smart Contract

Contract is deployed on **Ethereum Sepolia Testnet**.

To redeploy:
1. Open [Remix IDE](https://remix.ethereum.org)
2. Import `contracts/CryptoVault.sol`
3. Compile with Solidity `0.8.19`
4. Deploy with **Injected Provider (MetaMask)**
5. Copy contract address → paste in `frontend/.env`

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| POST | `/api/upload` | Upload file + generate hash |
| POST | `/api/verify` | Verify file integrity |
| GET | `/api/files?wallet=0x...` | Get all files by wallet |
| GET | `/api/files/:id` | Get single file |
| PUT | `/api/files/:id/revoke` | Revoke file |
| GET | `/api/stats` | Get dashboard stats |

---

## 📜 Smart Contract Functions

| Function | Type | Description |
|----------|------|-------------|
| `sealFile()` | write | Store file hash permanently |
| `verifyFile()` | write | Compare hash + emit event |
| `quickVerify()` | read | View-only hash comparison |
| `revokeFile()` | write | Revoke file record |
| `getFile()` | read | Fetch file from blockchain |
| `getStats()` | read | Total files, verifications, tampered |

Contract Address: [View on Etherscan](https://sepolia.etherscan.io)

---

## 🧪 Running Tests

```bash
# Go Backend Tests
cd go-backend
go test ./... -v

# Individual test
go test ./handlers/ -v -run TestUploadFile
```

---

## 🔄 How It Works

### Upload Flow:
```
1. User selects file
2. Go Backend: SHA-256 hash generated
3. Cloudinary: Encrypted file uploaded
4. MongoDB: File metadata saved
5. Smart Contract: sealFile() called via MetaMask
6. TX Hash received → File is blockchain-sealed ✅
```

### Verify Flow:
```
1. User re-uploads same file
2. Go Backend: New SHA-256 hash generated
3. MongoDB: Original hash fetched
4. Hashes compared:
   - Match    → ✅ VALID
   - Mismatch → ⚠️ TAMPERED
```

---

## 🎯 Use Cases

| Sector | Use Case |
|--------|----------|
| 🏥 Healthcare | Patient records integrity |
| 🏦 Banking | Financial document verification |
| 🎓 Education | Certificate authenticity |
| ⚖️ Legal | Contract tamper detection |
| 🏢 Corporate | Employee data integrity |

---

## 🔒 Security Features

- **AES-256-GCM** encryption before upload
- **SHA-256** cryptographic hashing
- **Ethereum blockchain** — immutable record
- **MetaMask** wallet authentication
- **Non-custodial** — private keys never stored

---

## 📊 Integrity Score

Dashboard shows real-time integrity score:

| Score | Status | Meaning |
|-------|--------|---------|
| 100% | 🟢 Perfect | All files valid |
| 80-99% | 🔵 Good | Minor issues |
| 50-79% | 🟡 Warning | Action needed |
| < 50% | 🔴 Critical | Immediate attention |

---


---

> *"Cloud ने Availability दिली, CryptoVault ने Integrity दिली."*
