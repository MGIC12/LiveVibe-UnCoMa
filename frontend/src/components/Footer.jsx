const Footer = () => {
  return (
    <footer className="bg-gray-950 text-gray-400 py-8 mt-12 border-t border-gray-800">
      <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
        <div className="mb-4 md:mb-0 text-center md:text-left">
          <h2 className="text-2xl font-bold text-purple-500 mb-1">LiveVibe</h2>
          <p className="text-sm">Conectando a la comunidad musical.</p>
        </div>

        <div className="flex space-x-6 text-sm">
          <a href="#" className="hover:text-purple-400 transition">
            Términos y Condiciones
          </a>
          <a href="#" className="hover:text-purple-400 transition">
            Privacidad
          </a>
          <a href="#" className="hover:text-purple-400 transition">
            Contacto
          </a>
        </div>

        <div className="mt-4 md:mt-0 text-sm">
          &copy; 2026 LiveVibe. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
