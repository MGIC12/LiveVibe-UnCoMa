const Carrusel = () => {
  const mockArtists = [
    {
      id: 1,
      name: "Deftones",
      genre: "Rock Alternativo",
      img: "https://i.scdn.co/image/ab6761610000e5ebe3ac5eb948e78d9285d1dbdb",
    },
    {
      id: 2,
      name: "Duran Duran",
      genre: "Rock",
      img: "https://i.scdn.co/image/ab67616100005174899b5cf79062868a01429bc7",
    },
    {
      id: 3,
      name: "MUSE",
      genre: "Rock Alternativo",
      img: "https://i.scdn.co/image/ab6761610000e5ebccb215d769112ec422a59ce6",
    },
    {
      id: 4,
      name: "Taylor Swift",
      genre: "Pop",
      img: "https://i.scdn.co/image/ab67616d00001e020b04da4f224b51ff86e0a481",
    },
    {
      id: 5,
      name: "Airbag",
      genre: "Rock Alternativo",
      img: "https://i.scdn.co/image/ab676161000051747e7ce771bde5235afd45cb43",
    },
    {
      id: 6,
      name: "Don Toliver",
      genre: "Trap",
      img: "https://i.scdn.co/image/ab67616100005174c52b798deb89eb8414a51b7b",
    },
    {
      id: 7,
      name: "Daft Punk",
      genre: "Electronica",
      img: "https://cdn-images.dzcdn.net/images/artist/638e69b9caaf9f9f3f8826febea7b543/1900x1900-000000-81-0-0.jpg",
    },
  ];

  const duplicatedArtists = [...mockArtists, ...mockArtists];

  return (
    <section className="my-8 overflow-hidden relative">
      <h3 className="text-2xl font-bold mb-2 px-4 md:px-0 text-white">
        Artistas en Tendencia
      </h3>
      <div className="py-8">
        <div className="flex gap-6 animate-infinite-scroll px-4">
          {duplicatedArtists.map((artist, index) => (
            <div
              key={`${artist.id}-${index}`}
              className="relative shrink-0 w-40 md:w-48 h-60 md:h-72 bg-gray-800 rounded-lg overflow-hidden cursor-pointer transform transition-transform duration-300 hover:scale-110 hover:z-10 shadow-2xl"
            >
              <img
                src={artist.img}
                alt={artist.name}
                className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity duration-300"
              />

              <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-linear-to-t from-gray-900 to-transparent pointer-events-none"></div>

              <div className="absolute bottom-0 left-0 right-0 p-3 pointer-events-none">
                <h4 className="text-white font-bold leading-tight drop-shadow-md">
                  {artist.name}
                </h4>
                <p className="text-purple-400 text-xs font-semibold drop-shadow-md">
                  {artist.genre}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Carrusel;
