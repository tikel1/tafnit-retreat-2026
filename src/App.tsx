import { useHashRoute } from "./lib/route";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import ItinerarySection from "./components/ItinerarySection";
import MapView from "./components/MapView";
import StaysSection from "./components/StaysSection";
import TipsSection from "./components/TipsSection";
import ChecklistSection from "./components/ChecklistSection";
import Footer from "./components/Footer";
import MobileBottomNav from "./components/MobileBottomNav";
import ChapterDetailPage from "./components/ChapterDetailPage";
import InstallPrompt from "./components/InstallPrompt";
import Gemininio from "./components/Gemininio";

export default function App() {
  const route = useHashRoute();

  if (route.kind === "chapter") {
    return (
      <>
        <ChapterDetailPage dayNumber={route.day} />
        <InstallPrompt />
        <Gemininio />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="pb-24 md:pb-0">
        <Hero />
        <ItinerarySection />
        <MapView />
        <StaysSection />
        <TipsSection />
        <ChecklistSection />
        <Footer />
      </main>
      <MobileBottomNav />
      <InstallPrompt />
      <Gemininio />
    </>
  );
}
