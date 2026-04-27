package utils

import (
	"context"
	"encoding/json"
	"os"
	"strings"

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"
)

// FetchFileFromChain — Reads file record directly from Ethereum smart contract
func FetchFileFromChain(fileId string) (string, error) {
	rpcURL := os.Getenv("RPC_URL")
	contractAddr := os.Getenv("CONTRACT_ADDRESS")

	fmt.Println("[BLOCKCHAIN] Fetching for ID:", fileId)

	client, err := ethclient.Dial(rpcURL)
	if err != nil {
		fmt.Println("[BLOCKCHAIN] Dial error:", err)
		return "", err
	}

	// Load ABI
	abiData, err := os.ReadFile("abi/abi.json")
	if err != nil {
		fmt.Println("[BLOCKCHAIN] ABI read error:", err)
		return "", err
	}

	var contractABI abi.ABI
	err = json.Unmarshal(abiData, &contractABI)
	if err != nil {
		contractABI, err = abi.JSON(strings.NewReader(string(abiData)))
		if err != nil {
			fmt.Println("[BLOCKCHAIN] ABI parse error:", err)
			return "", err
		}
	}

	// Prepare call
	data, err := contractABI.Pack("getFile", fileId)
	if err != nil {
		fmt.Println("[BLOCKCHAIN] Pack error:", err)
		return "", err
	}

	to := common.HexToAddress(contractAddr)
	msg := ethereum.CallMsg{
		To:   &to,
		Data: data,
	}

	result, err := client.CallContract(context.Background(), msg, nil)
	if err != nil {
		fmt.Println("[BLOCKCHAIN] CallContract error:", err)
		return "", err
	}

	// Unpack results
	unpacked, err := contractABI.Unpack("getFile", result)
	if err != nil {
		fmt.Println("[BLOCKCHAIN] Unpack error:", err)
		return "", err
	}

	// The third return value is the fileHash (index 2)
	if len(unpacked) > 2 {
		hash, ok := unpacked[2].(string)
		if ok {
			fmt.Println("[BLOCKCHAIN] Found hash:", hash)
			return hash, nil
		}
	}

	fmt.Println("[BLOCKCHAIN] No hash found in unpacked data")
	return "", nil
}

// Keep for compatibility if needed elsewhere, but refactored to use FetchFileFromChain
func VerifyOnChain(fileId, expectedHash string) (bool, string, error) {
	chainHash, err := FetchFileFromChain(fileId)
	if err != nil {
		return false, "", err
	}
	return strings.EqualFold(chainHash, expectedHash), chainHash, nil
}

