import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import FeedComunidad from "../components/FeedComunidad";

export default function Comunidad() {
  return (
    <div className="min-h-screen bg-tinta text-crema font-sans flex flex-col justify-between">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 pt-28 pb-16 w-full max-w-2xl">
        <FeedComunidad />
      </main>
      <Footer />
    </div>
  );
}