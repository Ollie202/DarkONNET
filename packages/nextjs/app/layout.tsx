import "@rainbow-me/rainbowkit/styles.css";
import { AppShell } from "~~/components/AppShell";
import { DappWrapperWithProviders } from "~~/components/DappWrapperWithProviders";
import { ThemeProvider } from "~~/components/ThemeProvider";
import { SidebarProvider } from "~~/components/sidebar/SidebarContext";
import "~~/styles/globals.css";
import { getMetadata } from "~~/utils/helper/getMetadata";

export const metadata = getMetadata({
  title: "Zama Prediction Market",
  description: "Prediction markets with encrypted positions and private market activity.",
});

const DappWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <html suppressHydrationWarning lang="en">
      <head>
        <link href="https://api.fontshare.com/v2/css?f[]=telegraf@400,500,700&display=swap" rel="stylesheet" />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider attribute="data-theme" defaultTheme="dark" enableSystem={false}>
          <SidebarProvider>
            <DappWrapperWithProviders>
              <AppShell>{children}</AppShell>
            </DappWrapperWithProviders>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
};

export default DappWrapper;
