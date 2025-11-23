import { useState } from "react";
import MainLayout from "./layouts/MainLayout";
import Collection from "./pages/Collection";
import Settings from "./pages/Settings";
import Dashboard from "./pages/Dashboard";
import { SettingsProvider } from "./contexts/SettingsContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./App.css";

function App() {
  const [activeTab, setActiveTab] = useState("collection");

  return (
    <ErrorBoundary>
      <SettingsProvider>
        <MainLayout activeTab={activeTab} onTabChange={setActiveTab}>
          {activeTab === "collection" && <Collection />}
          {activeTab === "settings" && <Settings />}
          {activeTab === "decks" && <Dashboard />}
          {/* Placeholders for other tabs */}
          {activeTab === "wishlist" && <div className="text-center text-gray-500 mt-20">Wishlist Feature Coming Soon</div>}
        </MainLayout>
      </SettingsProvider>
    </ErrorBoundary>
  );
}

export default App;
