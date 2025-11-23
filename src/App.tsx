import { useState } from "react";
import MainLayout from "./layouts/MainLayout";
import Collection from "./pages/Collection";
import Settings from "./pages/Settings";
import Dashboard from "./pages/Dashboard";
import AllSets from "./pages/AllSets";
import Wishlist from "./pages/Wishlist";
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
          {activeTab === "allsets" && <AllSets />}
          {activeTab === "wishlist" && <Wishlist />}
        </MainLayout>
      </SettingsProvider>
    </ErrorBoundary>
  );
}

export default App;
