import { useDisconnect, useSwitchChain } from "wagmi";
import {
  ArrowLeftOnRectangleIcon,
  ArrowsRightLeftIcon,
  ChevronDownIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { sepolia } from "~~/utils/chains";

export const WrongNetworkDropdown = () => {
  const { disconnect } = useDisconnect();
  const { switchChain, isPending } = useSwitchChain();

  return (
    <div className="dropdown dropdown-end mr-2">
      <label tabIndex={0} className="smooth-action btn btn-error btn-sm dropdown-toggle gap-1">
        <span>Wrong network</span>
        <ChevronDownIcon className="h-6 w-4 ml-2 sm:ml-0" />
      </label>
      <ul
        tabIndex={0}
        className="dropdown-content menu p-2 mt-1 shadow-center shadow-accent bg-base-200 rounded-box gap-1"
      >
        <li className="max-w-64 px-3 py-2 text-xs leading-5 text-base-content/75">
          <span className="flex items-start gap-2 whitespace-normal">
            <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <span>Switch to Sepolia from your wallet to use DarkONNET transactions.</span>
          </span>
        </li>
        <li>
          <button
            className="smooth-action menu-item btn-sm rounded-xl! flex gap-3 py-3"
            type="button"
            disabled={isPending}
            onClick={() => switchChain({ chainId: sepolia.id })}
          >
            <ArrowsRightLeftIcon className="h-6 w-4 ml-2 sm:ml-0" />
            <span>{isPending ? "Opening wallet..." : "Switch to Sepolia"}</span>
          </button>
        </li>
        <li>
          <button
            className="smooth-action menu-item text-error btn-sm rounded-xl! flex gap-3 py-3"
            type="button"
            onClick={() => disconnect()}
          >
            <ArrowLeftOnRectangleIcon className="h-6 w-4 ml-2 sm:ml-0" />
            <span>Disconnect</span>
          </button>
        </li>
      </ul>
    </div>
  );
};
