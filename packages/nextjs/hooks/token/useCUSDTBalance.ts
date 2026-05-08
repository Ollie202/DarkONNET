"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAllow, useIsAllowed, useUserDecrypt } from "@zama-fhe/react-sdk";
import { ZERO_HANDLE } from "@zama-fhe/sdk";
import { formatUnits } from "viem";
import { useAccount, useReadContract } from "wagmi";
import { EncryptedERC20 } from "~~/contracts/EncryptedERC20";
import { sepolia } from "~~/utils/chains";
import { deploymentFor } from "~~/utils/contract";

const cUSDT = deploymentFor(EncryptedERC20, sepolia.id);

const formatCUSDTValue = (value: bigint) => `${formatUnits(value, 6)} cUSDT`;

export const useCUSDTBalance = () => {
  const { address, isConnected } = useAccount();
  const [decryptRequested, setDecryptRequested] = useState(false);
  const [decryptEnabled, setDecryptEnabled] = useState(false);

  const hasContract = Boolean(cUSDT?.address && cUSDT?.abi);

  const balanceHandleQuery = useReadContract({
    address: cUSDT?.address,
    abi: cUSDT?.abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: sepolia.id,
    query: {
      enabled: Boolean(hasContract && isConnected && address),
      refetchOnWindowFocus: false,
    },
  });

  const balanceHandle = typeof balanceHandleQuery.data === "string" ? balanceHandleQuery.data : undefined;
  const isZero = !balanceHandle || balanceHandle === ZERO_HANDLE;

  const decryptHandles = useMemo(() => {
    if (!balanceHandle || isZero || !cUSDT?.address) {
      return [];
    }

    return [
      {
        handle: balanceHandle as `0x${string}`,
        contractAddress: cUSDT.address,
      },
    ];
  }, [balanceHandle, isZero]);

  const tokenAddress = (cUSDT?.address ?? "0x0000000000000000000000000000000000000000") as `0x${string}`;
  const { data: isAllowed } = useIsAllowed({ contractAddresses: [tokenAddress] });
  const { mutate: allow, isPending: isAllowing } = useAllow();

  const decryptedBalance = useUserDecrypt(
    { handles: decryptHandles },
    { enabled: decryptEnabled && Boolean(isAllowed) && decryptHandles.length > 0 },
  );

  const balance = useMemo(() => {
    if (isZero) {
      return 0n;
    }

    if (!balanceHandle || !decryptedBalance.data) {
      return undefined;
    }

    const decryptedValue = decryptedBalance.data[balanceHandle as `0x${string}`];
    return typeof decryptedValue === "bigint" ? decryptedValue : undefined;
  }, [balanceHandle, decryptedBalance.data, isZero]);

  const refresh = useCallback(async () => {
    await balanceHandleQuery.refetch();
    setDecryptEnabled(false);
    setDecryptRequested(false);
  }, [balanceHandleQuery]);

  useEffect(() => {
    const onRefresh = () => {
      refresh();
    };

    window.addEventListener("darkonnet:cusdt-balance-refresh", onRefresh);
    return () => window.removeEventListener("darkonnet:cusdt-balance-refresh", onRefresh);
  }, [refresh]);

  useEffect(() => {
    setDecryptEnabled(false);
    setDecryptRequested(false);
  }, [address, balanceHandle]);

  useEffect(() => {
    if (decryptRequested && isAllowed) {
      setDecryptEnabled(true);
    }
  }, [decryptRequested, isAllowed]);

  const decryptBalance = useCallback(() => {
    if (!hasContract || !isConnected || !balanceHandle || isZero) {
      return;
    }

    setDecryptRequested(true);
    if (!isAllowed) {
      allow([tokenAddress]);
      return;
    }

    setDecryptEnabled(true);
  }, [allow, balanceHandle, hasContract, isAllowed, isConnected, isZero, tokenAddress]);

  return {
    balance,
    balanceLabel: balance === undefined ? undefined : formatCUSDTValue(balance),
    contractAddress: cUSDT?.address,
    decryptBalance,
    error: balanceHandleQuery.error || decryptedBalance.error,
    hasContract,
    hasHandle: Boolean(balanceHandle && !isZero),
    isAllowing,
    isDecrypting: decryptedBalance.isFetching,
    isLoading: balanceHandleQuery.isLoading,
    isReady: balance !== undefined,
    refresh,
  };
};
