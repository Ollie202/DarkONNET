/**
 * Generated from the DarkONNET backend Foundry artifact.
 * Source: out/ConfidentialUSDTFaucet.sol/ConfidentialUSDTFaucet.json
 */
import type { ContractDeployment } from "~~/utils/contract";

const REMOTE = {
  11155111: {
    address: "0xcDda033C5F914cCBFf39D7517cc4Dba54Bf7eeD9",
    abi: [
  {
    "type": "constructor",
    "inputs": [
      {
        "name": "_cUSDTAddress",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "COOLDOWN_TIME",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "FAUCET_AMOUNT",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint64",
        "internalType": "uint64"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "acceptTokenOwnership",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "cUSDT",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "contract EncryptedERC20"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getTimeUntilNextRequest",
    "inputs": [
      {
        "name": "user",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "nextRequestAt",
    "inputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "requestTokens",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "event",
    "name": "TokensRequested",
    "inputs": [
      {
        "name": "user",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "amount",
        "type": "uint64",
        "indexed": false,
        "internalType": "uint64"
      }
    ],
    "anonymous": false
  }
],
    deployedOnBlock: 10803053,
  },
} as const;

export const ConfidentialUSDTFaucet = REMOTE satisfies Partial<Record<number, ContractDeployment>>;
