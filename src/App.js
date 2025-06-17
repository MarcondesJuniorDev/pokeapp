import React, { useState, useEffect, useCallback } from 'react';

// Main App Component
const App = () => {
  const [activeView, setActiveView] = useState('list'); // 'list' or 'details' or 'favorites'
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [pokemonList, setPokemonList] = useState([]);
  const [favorites, setFavorites] = useState(() => {
    // Load favorites from local storage on initial render
    try {
      const storedFavorites = localStorage.getItem('pokemonFavorites');
      return storedFavorites ? JSON.parse(storedFavorites) : [];
    } catch (error) {
      console.error("Failed to parse favorites from localStorage:", error);
      return [];
    }
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const itemsPerPage = 20; // Number of Pokemons per page

  // Inject Tailwind CSS and font globally using a useEffect hook within the App component
  // This ensures hooks are called within a function component.
  useEffect(() => {
    const styles = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
      body {
        font-family: 'Inter', sans-serif;
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
    `;
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);

    const tailwindScript = document.createElement("script");
    tailwindScript.src = "https://cdn.tailwindcss.com";
    document.head.appendChild(tailwindScript);

    // Cleanup function to remove elements when the component unmounts
    return () => {
      document.head.removeChild(styleSheet);
      document.head.removeChild(tailwindScript);
    };
  }, []); // Empty dependency array ensures this runs once on mount

  // Fetch initial Pokémon list
  const fetchPokemonList = useCallback(async (page) => {
    try {
      const offset = (page - 1) * itemsPerPage;
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${itemsPerPage}&offset=${offset}`);
      const data = await response.json();

      const detailedPokemonPromises = data.results.map(async (pokemon) => {
        const detailResponse = await fetch(pokemon.url);
        const detailData = await detailResponse.json();
        return {
          name: detailData.name,
          image: detailData.sprites.front_default,
          id: detailData.id,
          abilities: detailData.abilities.map(a => a.ability.name),
          types: detailData.types.map(t => t.type.name),
          species: detailData.species.name,
        };
      });

      const detailedPokemonList = await Promise.all(detailedPokemonPromises);
      setPokemonList(detailedPokemonList);
      setTotalPages(Math.ceil(data.count / itemsPerPage));
    } catch (error) {
      console.error("Erro ao buscar a lista de Pokémons:", error);
    }
  }, [itemsPerPage]);

  useEffect(() => {
    fetchPokemonList(currentPage);
  }, [currentPage, fetchPokemonList]);

  // Save favorites to local storage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('pokemonFavorites', JSON.stringify(favorites));
    } catch (error) {
      console.error("Failed to save favorites to localStorage:", error);
    }
  }, [favorites]);

  // Handle navigation to details screen
  const showDetails = (pokemon) => {
    setSelectedPokemon(pokemon);
    setActiveView('details');
  };

  // Handle adding/removing from favorites
  const toggleFavorite = (pokemon) => {
    setFavorites((prevFavorites) => {
      const isFavorite = prevFavorites.some((fav) => fav.id === pokemon.id);
      if (isFavorite) {
        return prevFavorites.filter((fav) => fav.id !== pokemon.id);
      } else {
        return [...prevFavorites, pokemon];
      }
    });
  };

  // Check if a pokemon is favorited
  const isPokemonFavorite = useCallback((pokemon) => {
    return favorites.some((fav) => fav.id === pokemon.id);
  }, [favorites]);

  // Pagination handlers
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Render content based on active view
  const renderContent = () => {
    switch (activeView) {
      case 'list':
        return (
          <PokemonList
            pokemons={pokemonList}
            onSelectPokemon={showDetails}
            currentPage={currentPage}
            totalPages={totalPages}
            onNextPage={goToNextPage}
            onPrevPage={goToPrevPage}
            isPokemonFavorite={isPokemonFavorite}
            onToggleFavorite={toggleFavorite}
          />
        );
      case 'details':
        return (
          <PokemonDetails
            pokemon={selectedPokemon}
            onBack={() => setActiveView('list')}
            isPokemonFavorite={isPokemonFavorite}
            onToggleFavorite={toggleFavorite}
          />
        );
      case 'favorites':
        return (
          <PokemonList
            pokemons={favorites}
            onSelectPokemon={showDetails}
            isPokemonFavorite={isPokemonFavorite}
            onToggleFavorite={toggleFavorite}
            // No pagination for favorites list as it's typically loaded all at once
            currentPage={1}
            totalPages={1}
            onNextPage={() => {}}
            onPrevPage={() => {}}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4 font-inter">
      {/* Header and Navigation Buttons */}
      <header className="w-full max-w-4xl bg-white shadow-md rounded-lg p-4 mb-4 flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
        <h1 className="text-3xl font-bold text-gray-800">PokeApp</h1>
        <nav className="flex space-x-4">
          <button
            onClick={() => setActiveView('list')}
            className={`px-4 py-2 rounded-md transition-all duration-300 ${
              activeView === 'list' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-blue-100 hover:text-blue-700'
            }`}
          >
            Lista de Pokémons
          </button>
          <button
            onClick={() => setActiveView('favorites')}
            className={`px-4 py-2 rounded-md transition-all duration-300 ${
              activeView === 'favorites' ? 'bg-yellow-500 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-yellow-100 hover:text-yellow-700'
            }`}
          >
            Meus Favoritos ({favorites.length})
          </button>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-4xl bg-white shadow-md rounded-lg p-4 flex-grow">
        {renderContent()}
      </main>

      {/* Footer (optional) */}
      <footer className="w-full max-w-4xl mt-4 text-center text-gray-600 text-sm">
        Desenvolvido com ❤️ para a avaliação técnica.
      </footer>
    </div>
  );
};

// PokemonList Component
const PokemonList = ({ pokemons, onSelectPokemon, currentPage, totalPages, onNextPage, onPrevPage, isPokemonFavorite, onToggleFavorite }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [abilityFilter, setAbilityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState('');
  const [orderOption, setOrderOption] = useState('name-asc');

  // Coleta opções únicas de filtros
  const abilityOptions = Array.from(new Set(pokemons.flatMap(p => p.abilities || [])));
  const typeOptions    = Array.from(new Set(pokemons.flatMap(p => p.types     || [])));
  const speciesOptions = Array.from(new Set(pokemons.map(p => p.species        || '')));

  // Aplica filtros e pesquisa
  let filteredPokemons = pokemons
    .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(p => abilityFilter ? (p.abilities || []).includes(abilityFilter) : true)
    .filter(p => typeFilter    ? (p.types     || []).includes(typeFilter)    : true)
    .filter(p => speciesFilter ? p.species === speciesFilter                 : true);

  // Ordena
  filteredPokemons.sort((a, b) => {
    const [field, dir] = orderOption.split('-');
    let comp = 0;
    if (field === 'name') comp = a.name.localeCompare(b.name);
    if (field === 'id')   comp = a.id - b.id;
    return dir === 'asc' ? comp : -comp;
  });

  return (
    <div className="flex flex-col items-center">
      {/* Filtros e pesquisa */}
      <div className="w-full mb-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2">
        <input
          type="text"
          placeholder="Pesquisar Pokémon..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <select
          value={abilityFilter}
          onChange={e => setAbilityFilter(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todas habilidades</option>
          {abilityOptions.map(a => <option key={a} value={a}>{a}</option>)}
        </select>

        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos tipos</option>
          {typeOptions.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        <select
          value={speciesFilter}
          onChange={e => setSpeciesFilter(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todas espécies</option>
          {speciesOptions.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <select
          value={orderOption}
          onChange={e => setOrderOption(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="name-asc">Nome A-Z</option>
          <option value="name-desc">Nome Z-A</option>
          <option value="id-asc">ID Crescente</option>
          <option value="id-desc">ID Decrescente</option>
        </select>
      </div>

      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Lista de Pokémons</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
        {filteredPokemons.length > 0 ? (
          filteredPokemons.map((pokemon) => (
            <div
              key={pokemon.id}
              className="bg-gray-50 p-4 rounded-lg shadow-md flex flex-col items-center justify-between transition-transform transform hover:scale-105 cursor-pointer relative"
            >
              <button
                onClick={(e) => { e.stopPropagation(); onToggleFavorite(pokemon); }}
                className="absolute top-2 right-2 text-2xl"
                aria-label={isPokemonFavorite(pokemon) ? "Remover dos favoritos" : "Adicionar aos favoritos"}
              >
                {isPokemonFavorite(pokemon) ? (
                  <span style={{ color: 'gold' }}>&#9733;</span> // Filled star
                ) : (
                  <span style={{ color: 'gray' }}>&#9734;</span> // Empty star
                )}
              </button>
              <img
                src={pokemon.image || `https://placehold.co/96x96/ADD8E6/000000?text=${pokemon.name.charAt(0).toUpperCase()}`}
                alt={pokemon.name}
                className="w-24 h-24 object-contain mb-2"
                onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/96x96/ADD8E6/000000?text=${pokemon.name.charAt(0).toUpperCase()}`; }}
              />
              <span className="text-lg font-medium text-gray-700 capitalize">{pokemon.name}</span>
              <button
                onClick={() => onSelectPokemon(pokemon)}
                className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200 shadow-sm w-full"
              >
                Ver Detalhes
              </button>
            </div>
          ))
        ) : (
          <p className="col-span-full text-center text-gray-600">
            Nenhum Pokémon encontrado.
          </p>
        )}
      </div>

      {/* Paginação (continua igual, sem alterações) */}
      {totalPages > 1 && (
        <div className="flex justify-between w-full mt-6 max-w-md">
          <button
            onClick={onPrevPage}
            disabled={currentPage === 1}
            className="px-6 py-3 bg-blue-500 text-white rounded-md shadow-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Anterior
          </button>
          <span className="text-lg font-medium text-gray-700 flex items-center">Página {currentPage} de {totalPages}</span>
          <button
            onClick={onNextPage}
            disabled={currentPage === totalPages}
            className="px-6 py-3 bg-blue-500 text-white rounded-md shadow-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
};

// PokemonDetails Component
const PokemonDetails = ({ pokemon, onBack, isPokemonFavorite, onToggleFavorite }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPokemonDetails = async () => {
      if (!pokemon) return;

      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemon.id}/`);
        if (!response.ok) {
          throw new Error(`Erro HTTP: ${response.status}`);
        }
        const data = await response.json();
        setDetails(data);
      } catch (err) {
        console.error("Erro ao buscar detalhes do Pokémon:", err);
        setError("Não foi possível carregar os detalhes do Pokémon. Por favor, tente novamente.");
      } finally {
        setLoading(false);
      }
    };

    fetchPokemonDetails();
  }, [pokemon]);

  if (!pokemon) {
    return <p className="text-center text-gray-600">Nenhum Pokémon selecionado.</p>;
  }

  if (loading) {
    return <p className="text-center text-blue-500 text-lg">Carregando detalhes do Pokémon...</p>;
  }

  if (error) {
    return (
      <div className="text-center text-red-500">
        <p>{error}</p>
        <button onClick={onBack} className="mt-4 px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors shadow-sm">
          Voltar para a Lista
        </button>
      </div>
    );
  }

  // Extracting at least 6 descriptions/attributes
  const descriptionItems = [
    { label: "Altura", value: `${details.height / 10} m` }, // Convert dm to meters
    { label: "Peso", value: `${details.weight / 10} kg` },   // Convert hg to kilograms
    { label: "Experiência Base", value: details.base_experience },
    { label: "Habilidades", value: details.abilities.map(a => a.ability.name).join(', ') },
    { label: "Tipos", value: details.types.map(t => t.type.name).join(', ') },
    { label: "Espécie", value: details.species.name },
    { label: "Ordem", value: details.order },
    // Add more if available and relevant
  ];

  // Prepare images for display (front, back, shiny, etc.)
  const pokemonImages = [
    details.sprites.front_default,
    details.sprites.back_default,
    details.sprites.front_shiny,
    details.sprites.back_shiny,
    details.sprites.other?.dream_world?.front_default, // Dream world sprite
    details.sprites.other?.['official-artwork']?.front_default, // Official artwork
  ].filter(Boolean); // Filter out null/undefined images

  return (
    <div className="flex flex-col items-center p-4">
      <div className="w-full max-w-2xl bg-gray-50 rounded-lg shadow-xl p-6 relative">
        <button
          onClick={onBack}
          className="absolute top-4 left-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors duration-200 shadow-sm"
        >
          &larr; Voltar
        </button>
        <button
          onClick={() => onToggleFavorite(pokemon)}
          className="absolute top-4 right-4 text-3xl"
          aria-label={isPokemonFavorite(pokemon) ? "Remover dos favoritos" : "Adicionar aos favoritos"}
        >
          {isPokemonFavorite(pokemon) ? (
            <span style={{ color: 'gold' }}>&#9733;</span>
          ) : (
            <span style={{ color: 'gray' }}>&#9734;</span>
          )}
        </button>

        <h2 className="text-4xl font-extrabold text-gray-900 capitalize text-center mt-8 mb-6">{details.name}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <div className="flex flex-col items-center">
            <img
              src={details.sprites.front_default || `https://placehold.co/200x200/ADD8E6/000000?text=${details.name.charAt(0).toUpperCase()}`}
              alt={details.name}
              className="w-48 h-48 object-contain rounded-full border-4 border-blue-400 bg-white shadow-lg p-2"
              onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/200x200/ADD8E6/000000?text=${details.name.charAt(0).toUpperCase()}`; }}
            />
            <p className="text-center text-gray-600 mt-2">Sprite Padrão</p>
          </div>
          <div className="flex flex-col justify-center">
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Características:</h3>
            <ul className="space-y-2">
              {descriptionItems.map((item, index) => (
                <li key={index} className="flex justify-between items-center bg-white p-3 rounded-md shadow-sm">
                  <span className="font-medium text-gray-700">{item.label}:</span>
                  <span className="text-gray-600 capitalize">{item.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <h3 className="text-xl font-semibold text-gray-800 mb-4 text-center">Galeria de Imagens:</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {pokemonImages.map((image, index) => (
            <div key={index} className="bg-white p-2 rounded-md shadow-sm flex flex-col items-center">
              <img
                src={image}
                alt={`${details.name} sprite ${index + 1}`}
                className="w-24 h-24 object-contain"
                onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/96x96/E0E0E0/000000?text=Sem Imagem`; }}
              />
              <span className="text-xs text-gray-500 mt-1">{
                index === 0 ? "Frente" :
                index === 1 ? "Costas" :
                index === 2 ? "Frente Brilhante" :
                index === 3 ? "Costas Brilhante" :
                index === 4 ? "Mundo dos Sonhos" :
                index === 5 ? "Arte Oficial" :
                ""
              }</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default App;
