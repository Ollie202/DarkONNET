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
