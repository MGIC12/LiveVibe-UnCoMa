import Navbar from "../components/Navbar";
import HeroEvent from "../components/HeroEvent";
import Carrusel from "../components/Carrusel"; // <-- Importar el carrusel
import CommunityFeed from "../components/CommunityFeed";
import EventList from "../components/EventList";
import Chatbot from "../components/Chatbot";
import Footer from "../components/Footer";

const Home = () => {
  return (
    <div className="min-h-screen bg-neutral-900 text-white font-sans overflow-x-hidden">
      <Navbar />
      <HeroEvent />

      {/* Contenedor principal centrado */}
      <div className="container mx-auto p-4">
        <Carrusel />

        <main className="flex flex-col md:flex-row gap-8 mt-8">
          <CommunityFeed />
          <EventList />
        </main>
      </div>

      <Footer />
      <Chatbot />
    </div>
  );
};

export default Home;
