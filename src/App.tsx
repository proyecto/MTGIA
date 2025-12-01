import { useState } from "react";
import MainLayout from "./layouts/MainLayout";
import Collection from "./pages/Collection";
import Settings from "./pages/Settings";
import Dashboard from "./pages/Dashboard";
import AllSets from "./pages/AllSets";
import Wishlist from "./pages/Wishlist";
import MarketTrends from "./pages/MarketTrends";
import SearchModal from "./components/SearchModal";
import { SettingsProvider } from "./contexts/SettingsContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { MobileLayout } from "./components/MobileLayout";
import { usePlatform } from "./utils/usePlatform";
import "./App.css";

function App() {
  const [activeTab, setActiveTab] = useState("collection");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { isMobile } = usePlatform();

  const renderContent = () => {
    switch (activeTab) {
      case "collection":
        return <Collection />;
      case "settings":
        return <Settings />;
      case "decks":
        return <Dashboard />;
      case "allsets":
        return <AllSets />;
      case "wishlist":
        return <Wishlist />;
      case "market":
        return <MarketTrends />;
      default:
        return <Collection />;
    }
  };

  return (
    <ErrorBoundary>
      <SettingsProvider>
        {isMobile ? (
          <MobileLayout
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onSearchClick={() => setIsSearchOpen(true)}
          >
            {renderContent()}
          </MobileLayout>
        ) : (
          <MainLayout activeTab={activeTab} onTabChange={setActiveTab}>
            {renderContent()}
          </MainLayout>
        )}

        <SearchModal
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          onCardAdded={() => {
            setIsSearchOpen(false);
            // Optional: Refresh data if needed
            window.location.reload();
          }}
        />
      </SettingsProvider>
    </ErrorBoundary>
  );
}

export default App;
