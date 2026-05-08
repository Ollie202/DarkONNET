import Script from "next/script";
import "@rainbow-me/rainbowkit/styles.css";
import { AppShell } from "~~/components/AppShell";
import { DappWrapperWithProviders } from "~~/components/DappWrapperWithProviders";
import { ThemeProvider } from "~~/components/ThemeProvider";
import { NotificationsProvider } from "~~/components/notifications/NotificationsContext";
import { ProfileProvider } from "~~/components/profile/ProfileContext";
import { SidebarProvider } from "~~/components/sidebar/SidebarContext";
import "~~/styles/globals.css";
import { getMetadata } from "~~/utils/helper/getMetadata";

export const metadata = getMetadata({
  title: "DarkONNET Private Prediction Market",
  description: "Private prediction markets with encrypted positions and cUSDT activity on Sepolia.",
});

const DappWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <html suppressHydrationWarning lang="en">
      <head>
        <link href="https://api.fontshare.com/v2/css?f[]=telegraf@400,500,700&display=swap" rel="stylesheet" />
        <link rel="icon" href="/favicon.png" type="image/png" />
        <Script
          id="wallet-extension-error-shield"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                function messageOf(reason) {
                  if (!reason) return "";
                  if (typeof reason === "string") return reason;
                  if (typeof reason.message === "string") return reason.message;
                  try {
                    return JSON.stringify(reason);
                  } catch (_) {
                    return String(reason);
                  }
                }

                function isWalletExtensionFailure(reason, source) {
                  var message = messageOf(reason);
                  return /metamask|walletconnect|inpage\\.js|user rejected|resource unavailable|disconnected port object/i.test(message) ||
                    /chrome-extension:\\/\\/nkbihfbeogaeaoehlefnkodbefgpgknn/i.test(source || "");
                }

                function shieldWalletExtensionError(event) {
                  var reason = event.reason || event.error || event.message;
                  var source = event.filename || "";
                  if (!isWalletExtensionFailure(reason, source)) return;

                  var detail = { message: messageOf(reason), source: source, at: Date.now() };
                  window.__darkonnetLastWalletExtensionError = detail;
                  window.dispatchEvent(new CustomEvent("darkonnet:wallet-extension-error", { detail: detail }));

                  event.preventDefault();
                  if (typeof event.stopImmediatePropagation === "function") {
                    event.stopImmediatePropagation();
                  }
                }

                window.addEventListener("unhandledrejection", shieldWalletExtensionError, true);
                window.addEventListener("error", shieldWalletExtensionError, true);
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider attribute="data-theme" defaultTheme="dark" enableSystem={false}>
          <SidebarProvider>
            <NotificationsProvider>
              <ProfileProvider>
                <DappWrapperWithProviders>
                  <AppShell>{children}</AppShell>
                </DappWrapperWithProviders>
              </ProfileProvider>
            </NotificationsProvider>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
};

export default DappWrapper;
