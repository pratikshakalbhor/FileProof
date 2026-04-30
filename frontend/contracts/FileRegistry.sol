// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract FileRegistry {

    struct File {
        address owner;
        uint256 timestamp;
        bool    exists;
    }

    mapping(string  => File)     private files;
    mapping(address => string[]) private userFiles;

    event FileRegistered(
        string  fileHash,
        address owner,
        uint256 timestamp
    );

    // ✅ Sirf fileHash — 1 param only!
    function registerFile(string calldata fileHash) external {
        if (files[fileHash].exists) {
            emit FileRegistered(fileHash, msg.sender, block.timestamp);
            return; // No revert — silently return
        }
        files[fileHash] = File({
            owner:     msg.sender,
            timestamp: block.timestamp,
            exists:    true
        });
        userFiles[msg.sender].push(fileHash);
        emit FileRegistered(fileHash, msg.sender, block.timestamp);
    }

    function verifyFile(string calldata fileHash)
        external view
        returns (bool valid, address owner, uint256 timestamp)
    {
        if (!files[fileHash].exists) {
            return (false, address(0), 0);
        }
        File memory f = files[fileHash];
        return (true, f.owner, f.timestamp);
    }

    function getOwnerFiles(address user)
        external view
        returns (string[] memory)
    {
        return userFiles[user];
    }

    function fileExists(string calldata fileHash)
        external view
        returns (bool)
    {
        return files[fileHash].exists;
    }
}