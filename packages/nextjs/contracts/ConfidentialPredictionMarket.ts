/**
 * Generated from the DarkONNET backend Foundry artifact.
 * Source: out/ConfidentialPredictionMarket.sol/ConfidentialPredictionMarket.json
 */
import type { ContractDeployment } from "~~/utils/contract";

const REMOTE = {
  11155111: {
    address: "0x3cA14ae6ae8eCDD32023D2041aF2B60F2c58DD6B",
    abi: [
      {
        type: "constructor",
        inputs: [
          {
            name: "_cUSDTAddress",
            type: "address",
            internalType: "address",
          },
        ],
        stateMutability: "nonpayable",
      },
      {
        type: "function",
        name: "BPS_DENOMINATOR",
        inputs: [],
        outputs: [
          {
            name: "",
            type: "uint64",
            internalType: "uint64",
          },
        ],
        stateMutability: "view",
      },
      {
        type: "function",
        name: "CREATOR_FEE_BPS",
        inputs: [],
        outputs: [
          {
            name: "",
            type: "uint64",
            internalType: "uint64",
          },
        ],
        stateMutability: "view",
      },
      {
        type: "function",
        name: "CREATOR_STAKE_AMOUNT",
        inputs: [],
        outputs: [
          {
            name: "",
            type: "uint64",
            internalType: "uint64",
          },
        ],
        stateMutability: "view",
      },
      {
        type: "function",
        name: "bet",
        inputs: [
          {
            name: "_marketId",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "_outcome",
            type: "uint8",
            internalType: "uint8",
          },
          {
            name: "encryptedValue",
            type: "bytes",
            internalType: "bytes",
          },
          {
            name: "proof",
            type: "bytes",
            internalType: "bytes",
          },
        ],
        outputs: [],
        stateMutability: "nonpayable",
      },
      {
        type: "function",
        name: "cUSDT",
        inputs: [],
        outputs: [
          {
            name: "",
            type: "address",
            internalType: "contract IEncryptedERC20",
          },
        ],
        stateMutability: "view",
      },
      {
        type: "function",
        name: "createMarket",
        inputs: [
          {
            name: "_id",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "_category",
            type: "string",
            internalType: "string",
          },
          {
            name: "_description",
            type: "string",
            internalType: "string",
          },
          {
            name: "_expiresAt",
            type: "uint64",
            internalType: "uint64",
          },
        ],
        outputs: [],
        stateMutability: "nonpayable",
      },
      {
        type: "function",
        name: "createMarketWithCreator",
        inputs: [
          {
            name: "_id",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "_category",
            type: "string",
            internalType: "string",
          },
          {
            name: "_description",
            type: "string",
            internalType: "string",
          },
          {
            name: "_creator",
            type: "address",
            internalType: "address",
          },
          {
            name: "_expiresAt",
            type: "uint64",
            internalType: "uint64",
          },
        ],
        outputs: [],
        stateMutability: "nonpayable",
      },
      {
        type: "function",
        name: "creatorStakeDeposited",
        inputs: [
          {
            name: "",
            type: "uint256",
            internalType: "uint256",
          },
        ],
        outputs: [
          {
            name: "",
            type: "bool",
            internalType: "bool",
          },
        ],
        stateMutability: "view",
      },
      {
        type: "function",
        name: "creatorStakeDepositors",
        inputs: [
          {
            name: "",
            type: "uint256",
            internalType: "uint256",
          },
        ],
        outputs: [
          {
            name: "",
            type: "address",
            internalType: "address",
          },
        ],
        stateMutability: "view",
      },
      {
        type: "function",
        name: "depositCreatorStake",
        inputs: [
          {
            name: "_marketId",
            type: "uint256",
            internalType: "uint256",
          },
        ],
        outputs: [],
        stateMutability: "nonpayable",
      },
      {
        type: "function",
        name: "fulfillClaim",
        inputs: [
          {
            name: "abiEncodedCleartexts",
            type: "bytes",
            internalType: "bytes",
          },
          {
            name: "decryptionProof",
            type: "bytes",
            internalType: "bytes",
          },
        ],
        outputs: [],
        stateMutability: "nonpayable",
      },
      {
        type: "function",
        name: "fulfillExitPosition",
        inputs: [
          {
            name: "abiEncodedCleartexts",
            type: "bytes",
            internalType: "bytes",
          },
          {
            name: "decryptionProof",
            type: "bytes",
            internalType: "bytes",
          },
        ],
        outputs: [],
        stateMutability: "nonpayable",
      },
      {
        type: "function",
        name: "getMarketInfo",
        inputs: [
          {
            name: "_id",
            type: "uint256",
            internalType: "uint256",
          },
        ],
        outputs: [
          {
            name: "id",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "category",
            type: "string",
            internalType: "string",
          },
          {
            name: "description",
            type: "string",
            internalType: "string",
          },
          {
            name: "expiresAt",
            type: "uint64",
            internalType: "uint64",
          },
          {
            name: "isSettled",
            type: "bool",
            internalType: "bool",
          },
          {
            name: "winningOutcome",
            type: "uint8",
            internalType: "uint8",
          },
          {
            name: "isCanceled",
            type: "bool",
            internalType: "bool",
          },
          {
            name: "exists",
            type: "bool",
            internalType: "bool",
          },
        ],
        stateMutability: "view",
      },
      {
        type: "function",
        name: "getMyPosition",
        inputs: [
          {
            name: "_marketId",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "outcome",
            type: "uint8",
            internalType: "uint8",
          },
        ],
        outputs: [
          {
            name: "",
            type: "bytes32",
            internalType: "euint64",
          },
        ],
        stateMutability: "view",
      },
      {
        type: "function",
        name: "getPoolHandles",
        inputs: [
          {
            name: "_marketId",
            type: "uint256",
            internalType: "uint256",
          },
        ],
        outputs: [
          {
            name: "handleA",
            type: "bytes32",
            internalType: "bytes32",
          },
          {
            name: "handleB",
            type: "bytes32",
            internalType: "bytes32",
          },
        ],
        stateMutability: "view",
      },
      {
        type: "function",
        name: "hasClaimed",
        inputs: [
          {
            name: "",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "",
            type: "address",
            internalType: "address",
          },
        ],
        outputs: [
          {
            name: "",
            type: "bool",
            internalType: "bool",
          },
        ],
        stateMutability: "view",
      },
      {
        type: "function",
        name: "marketCreators",
        inputs: [
          {
            name: "",
            type: "uint256",
            internalType: "uint256",
          },
        ],
        outputs: [
          {
            name: "",
            type: "address",
            internalType: "address",
          },
        ],
        stateMutability: "view",
      },
      {
        type: "function",
        name: "markets",
        inputs: [
          {
            name: "",
            type: "uint256",
            internalType: "uint256",
          },
        ],
        outputs: [
          {
            name: "id",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "category",
            type: "string",
            internalType: "string",
          },
          {
            name: "description",
            type: "string",
            internalType: "string",
          },
          {
            name: "totalBetsOutcomeA",
            type: "bytes32",
            internalType: "euint64",
          },
          {
            name: "totalBetsOutcomeB",
            type: "bytes32",
            internalType: "euint64",
          },
          {
            name: "expiresAt",
            type: "uint64",
            internalType: "uint64",
          },
          {
            name: "isSettled",
            type: "bool",
            internalType: "bool",
          },
          {
            name: "winningOutcome",
            type: "uint8",
            internalType: "uint8",
          },
          {
            name: "isCanceled",
            type: "bool",
            internalType: "bool",
          },
          {
            name: "exists",
            type: "bool",
            internalType: "bool",
          },
        ],
        stateMutability: "view",
      },
      {
        type: "function",
        name: "owner",
        inputs: [],
        outputs: [
          {
            name: "",
            type: "address",
            internalType: "address",
          },
        ],
        stateMutability: "view",
      },
      {
        type: "function",
        name: "pendingClaims",
        inputs: [
          {
            name: "",
            type: "address",
            internalType: "address",
          },
        ],
        outputs: [
          {
            name: "marketId",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "numeratorHandle",
            type: "bytes32",
            internalType: "bytes32",
          },
          {
            name: "denominatorHandle",
            type: "bytes32",
            internalType: "bytes32",
          },
          {
            name: "exists",
            type: "bool",
            internalType: "bool",
          },
        ],
        stateMutability: "view",
      },
      {
        type: "function",
        name: "pendingExits",
        inputs: [
          {
            name: "",
            type: "address",
            internalType: "address",
          },
        ],
        outputs: [
          {
            name: "marketId",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "outcome",
            type: "uint8",
            internalType: "uint8",
          },
          {
            name: "userBet",
            type: "bytes32",
            internalType: "euint64",
          },
          {
            name: "numeratorHandle",
            type: "bytes32",
            internalType: "bytes32",
          },
          {
            name: "denominatorHandle",
            type: "bytes32",
            internalType: "bytes32",
          },
          {
            name: "exists",
            type: "bool",
            internalType: "bool",
          },
        ],
        stateMutability: "view",
      },
      {
        type: "function",
        name: "releaseCreatorStake",
        inputs: [
          {
            name: "_marketId",
            type: "uint256",
            internalType: "uint256",
          },
        ],
        outputs: [],
        stateMutability: "nonpayable",
      },
      {
        type: "function",
        name: "requestClaim",
        inputs: [
          {
            name: "_marketId",
            type: "uint256",
            internalType: "uint256",
          },
        ],
        outputs: [],
        stateMutability: "nonpayable",
      },
      {
        type: "function",
        name: "requestExitPosition",
        inputs: [
          {
            name: "_marketId",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "_outcome",
            type: "uint8",
            internalType: "uint8",
          },
        ],
        outputs: [],
        stateMutability: "nonpayable",
      },
      {
        type: "function",
        name: "requestPnLUpdate",
        inputs: [
          {
            name: "_marketId",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "_outcome",
            type: "uint8",
            internalType: "uint8",
          },
        ],
        outputs: [],
        stateMutability: "nonpayable",
      },
      {
        type: "function",
        name: "requestPoolSnapshot",
        inputs: [
          {
            name: "_marketId",
            type: "uint256",
            internalType: "uint256",
          },
        ],
        outputs: [],
        stateMutability: "nonpayable",
      },
      {
        type: "function",
        name: "requestVolumeGauge",
        inputs: [
          {
            name: "_marketId",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "_maxExpected",
            type: "uint64",
            internalType: "uint64",
          },
        ],
        outputs: [],
        stateMutability: "nonpayable",
      },
      {
        type: "function",
        name: "settle",
        inputs: [
          {
            name: "_marketId",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "_winner",
            type: "uint8",
            internalType: "uint8",
          },
          {
            name: "_isCanceled",
            type: "bool",
            internalType: "bool",
          },
        ],
        outputs: [],
        stateMutability: "nonpayable",
      },
      {
        type: "function",
        name: "withdrawCreatorStake",
        inputs: [
          {
            name: "_marketId",
            type: "uint256",
            internalType: "uint256",
          },
        ],
        outputs: [],
        stateMutability: "nonpayable",
      },
      {
        type: "event",
        name: "BetPlaced",
        inputs: [
          {
            name: "user",
            type: "address",
            indexed: true,
            internalType: "address",
          },
          {
            name: "marketId",
            type: "uint256",
            indexed: true,
            internalType: "uint256",
          },
          {
            name: "outcome",
            type: "uint8",
            indexed: false,
            internalType: "uint8",
          },
        ],
        anonymous: false,
      },
      {
        type: "event",
        name: "ClaimRequested",
        inputs: [
          {
            name: "user",
            type: "address",
            indexed: true,
            internalType: "address",
          },
          {
            name: "marketId",
            type: "uint256",
            indexed: true,
            internalType: "uint256",
          },
        ],
        anonymous: false,
      },
      {
        type: "event",
        name: "CreatorFeePaid",
        inputs: [
          {
            name: "creator",
            type: "address",
            indexed: true,
            internalType: "address",
          },
          {
            name: "user",
            type: "address",
            indexed: true,
            internalType: "address",
          },
          {
            name: "marketId",
            type: "uint256",
            indexed: true,
            internalType: "uint256",
          },
        ],
        anonymous: false,
      },
      {
        type: "event",
        name: "CreatorStakeDeposited",
        inputs: [
          {
            name: "creator",
            type: "address",
            indexed: true,
            internalType: "address",
          },
          {
            name: "marketId",
            type: "uint256",
            indexed: true,
            internalType: "uint256",
          },
        ],
        anonymous: false,
      },
      {
        type: "event",
        name: "CreatorStakeReleased",
        inputs: [
          {
            name: "creator",
            type: "address",
            indexed: true,
            internalType: "address",
          },
          {
            name: "marketId",
            type: "uint256",
            indexed: true,
            internalType: "uint256",
          },
        ],
        anonymous: false,
      },
      {
        type: "event",
        name: "CreatorStakeWithdrawn",
        inputs: [
          {
            name: "creator",
            type: "address",
            indexed: true,
            internalType: "address",
          },
          {
            name: "marketId",
            type: "uint256",
            indexed: true,
            internalType: "uint256",
          },
        ],
        anonymous: false,
      },
      {
        type: "event",
        name: "ExitRequested",
        inputs: [
          {
            name: "user",
            type: "address",
            indexed: true,
            internalType: "address",
          },
          {
            name: "marketId",
            type: "uint256",
            indexed: true,
            internalType: "uint256",
          },
          {
            name: "outcome",
            type: "uint8",
            indexed: false,
            internalType: "uint8",
          },
          {
            name: "numeratorHandle",
            type: "bytes32",
            indexed: false,
            internalType: "bytes32",
          },
          {
            name: "denominatorHandle",
            type: "bytes32",
            indexed: false,
            internalType: "bytes32",
          },
        ],
        anonymous: false,
      },
      {
        type: "event",
        name: "MarketCanceled",
        inputs: [
          {
            name: "marketId",
            type: "uint256",
            indexed: true,
            internalType: "uint256",
          },
        ],
        anonymous: false,
      },
      {
        type: "event",
        name: "MarketCreated",
        inputs: [
          {
            name: "id",
            type: "uint256",
            indexed: true,
            internalType: "uint256",
          },
          {
            name: "category",
            type: "string",
            indexed: false,
            internalType: "string",
          },
          {
            name: "description",
            type: "string",
            indexed: false,
            internalType: "string",
          },
          {
            name: "expiresAt",
            type: "uint64",
            indexed: false,
            internalType: "uint64",
          },
        ],
        anonymous: false,
      },
      {
        type: "event",
        name: "MarketSettled",
        inputs: [
          {
            name: "marketId",
            type: "uint256",
            indexed: true,
            internalType: "uint256",
          },
          {
            name: "winner",
            type: "uint8",
            indexed: false,
            internalType: "uint8",
          },
        ],
        anonymous: false,
      },
      {
        type: "event",
        name: "PayoutDistributed",
        inputs: [
          {
            name: "user",
            type: "address",
            indexed: true,
            internalType: "address",
          },
          {
            name: "marketId",
            type: "uint256",
            indexed: true,
            internalType: "uint256",
          },
          {
            name: "amount",
            type: "uint256",
            indexed: false,
            internalType: "uint256",
          },
        ],
        anonymous: false,
      },
      {
        type: "event",
        name: "PnLUpdated",
        inputs: [
          {
            name: "user",
            type: "address",
            indexed: true,
            internalType: "address",
          },
          {
            name: "marketId",
            type: "uint256",
            indexed: true,
            internalType: "uint256",
          },
          {
            name: "numeratorHandle",
            type: "bytes32",
            indexed: false,
            internalType: "bytes32",
          },
          {
            name: "denominatorHandle",
            type: "bytes32",
            indexed: false,
            internalType: "bytes32",
          },
        ],
        anonymous: false,
      },
      {
        type: "event",
        name: "PoolSnapshotRequested",
        inputs: [
          {
            name: "marketId",
            type: "uint256",
            indexed: true,
            internalType: "uint256",
          },
          {
            name: "yesPoolHandle",
            type: "bytes32",
            indexed: false,
            internalType: "bytes32",
          },
          {
            name: "noPoolHandle",
            type: "bytes32",
            indexed: false,
            internalType: "bytes32",
          },
        ],
        anonymous: false,
      },
      {
        type: "event",
        name: "PositionExited",
        inputs: [
          {
            name: "user",
            type: "address",
            indexed: true,
            internalType: "address",
          },
          {
            name: "marketId",
            type: "uint256",
            indexed: true,
            internalType: "uint256",
          },
          {
            name: "outcome",
            type: "uint8",
            indexed: false,
            internalType: "uint8",
          },
        ],
        anonymous: false,
      },
      {
        type: "event",
        name: "PublicDecryptionVerified",
        inputs: [
          {
            name: "handlesList",
            type: "bytes32[]",
            indexed: false,
            internalType: "bytes32[]",
          },
          {
            name: "abiEncodedCleartexts",
            type: "bytes",
            indexed: false,
            internalType: "bytes",
          },
        ],
        anonymous: false,
      },
      {
        type: "event",
        name: "VolumeGaugeUpdated",
        inputs: [
          {
            name: "marketId",
            type: "uint256",
            indexed: true,
            internalType: "uint256",
          },
          {
            name: "gaugeHandle",
            type: "bytes32",
            indexed: false,
            internalType: "bytes32",
          },
        ],
        anonymous: false,
      },
      {
        type: "error",
        name: "InvalidKMSSignatures",
        inputs: [],
      },
      {
        type: "error",
        name: "SenderNotAllowedToUseHandle",
        inputs: [
          {
            name: "handle",
            type: "bytes32",
            internalType: "bytes32",
          },
          {
            name: "sender",
            type: "address",
            internalType: "address",
          },
        ],
      },
    ],
    deployedOnBlock: 10803053,
  },
} as const;

export const ConfidentialPredictionMarket = REMOTE satisfies Partial<Record<number, ContractDeployment>>;
