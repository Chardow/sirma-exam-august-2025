/**
 * App Module
 * Използваме Module Pattern, за бонус точките ;)
 */
const App = (() => {

    // Обект за запазването на state-a на приложението
    const state = {
        apiKey: '3b87b78c',
        apiBaseUrl: 'http://www.omdbapi.com/'
    };

    // Кеширане на DOM елементи
    const dom = {
        searchForm: document.getElementById('search-form'),
        searchInput: document.getElementById('search-input'),
        resultsContainer: document.getElementById('results-container'),
        movieModal: document.getElementById('movie-modal'),
        modalBody: document.getElementById('modal-body'),
        closeBtn: document.querySelector('.close-btn'),
        showFavoritesBtn: document.getElementById('show-favorites-btn')
    };

    /**
     * Модул за управление на любимите филми в Local Storage.
     */
    const FavoritesManager = (() => {
        const FAVORITES_KEY = 'movieApp.favorites';

        /**
         * Взима всички любими филми от Local Storage.
         * @returns {Array}
         */
        const getFavorites = () => {
            return JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
        };

        /**
         * Запазва масив с любими филми в Local Storage.
         * @param {Array} favorites
         */
        const saveFavorites = (favorites) => {
            localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
        };

        /**
         * Проверява дали филм е в любими.
         * @param {string} imdbID
         * @returns {boolean}
         */
        const isFavorite = (imdbID) => {
            return getFavorites().includes(imdbID);
        };

        /**
         * Добавя филм към любими.
         * @param {string} imdbID
         */
        const addFavorite = (imdbID) => {
            if (isFavorite(imdbID)) return; // Ако по някаква случайност се опитат да го въведат втори път като любим
            const favorites = getFavorites();
            favorites.push(imdbID);
            saveFavorites(favorites);
        };

        /**
         * Премахва филм от любими.
         * @param {string} imdbID
         */
        const removeFavorite = (imdbID) => {
            let favorites = getFavorites();
            favorites = favorites.filter(id => id !== imdbID);
            saveFavorites(favorites);
        };

        // Публичен интерфейс на FavoritesManager
        return {
            getFavorites,
            isFavorite,
            addFavorite,
            removeFavorite
        };
    })();
    /**
     * Прихващаме натискането на бутона за добавяне и премахване от любими.
     * @param {Event} event
     */
    const handleFavoriteButtonClick = (event) => {
        const button = event.target;
        const imdbID = button.dataset.imdbid;

        if (FavoritesManager.isFavorite(imdbID)) {
            FavoritesManager.removeFavorite(imdbID);
            button.textContent = 'Добави в любими';
            button.classList.remove('is-favorite');
        } else {
            FavoritesManager.addFavorite(imdbID);
            button.textContent = 'Премахни от любими';
            button.classList.add('is-favorite');
        }
    };
    const showFavoriteMovies = async () => {
        // Изчистваме контейнера и полето за търсене
        dom.resultsContainer.innerHTML = '<h2>Вашите любими филми:</h2>';
        dom.searchInput.value = '';

        const favoriteIDs = FavoritesManager.getFavorites();

        if (favoriteIDs.length === 0) {
            dom.resultsContainer.innerHTML += '<p>Първо си изберете любими филми, а след това ги търсете тук :).</p>';
            return;
        }

        // Promise.all ще изчака всички заявки да приключат.
        const favoriteMoviesPromises = favoriteIDs.map(id => fetchMovieDetails(id));
        const favoriteMovies = await Promise.all(favoriteMoviesPromises);

        //За да може rendermovies да работи както трябва, ще се наложи да добавим ръчно imdbid
        const moviesWithId = favoriteMovies.map(movie => {
            if (movie) { // Проверяваме дали филмът не е null (в случай на грешка)
                return { ...movie, imdbID: movie.imdbID || movie.imdbID };
            }
            return null;
        }).filter(Boolean); 

        renderMovies(moviesWithId);
    };

     /**
     * Обработва клик върху карта на филм.
     * @param {Event} event
     */
    const handleMovieCardClick = (event) => {
        // хващаме елемента по .movie-card
        const card = event.target.closest('.movie-card');
        if (card) {
            const imdbID = card.dataset.imdbid;
            showMovieDetails(imdbID);
        }
    };

    /**
     * Извлича детайли по IMDb ID.
     * @param {string} imdbID 
     * @returns {Promise<Object>}
     */
    const fetchMovieDetails = async (imdbID) => {
        const url = `${state.apiBaseUrl}?i=${imdbID}&plot=full&apikey=${state.apiKey}`;
        console.log("Изпращане на заявка към URL:", url);
        try {
            const response = await fetch(url);
            const data = await response.json();
            if (data.Response === "True") {
                return data;
            } else {
                
                console.error("Грешка от API:", data.Error); 
                return null;
            }
        } catch (error) {
            console.error('Грешка във "FetchMovesDetails":', error);
            return null;
        }
    };

    /**
     * Събираме и показваме модала с детайлите за филма.
     * @param {string} imdbID
     */
    const showMovieDetails = async (imdbID) => {
        const movie = await fetchMovieDetails(imdbID);
        if (movie) {
            const posterSrc = movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/200x300.png?text=No+Image';
            const isFavorite = FavoritesManager.isFavorite(movie.imdbID);
            const buttonText = isFavorite ? 'Премахни от любими' : 'Добави в любими';
            const buttonClass = isFavorite ? 'is-favorite' : '';

            dom.modalBody.innerHTML = `
                <img src="${posterSrc}" alt="${movie.Title} Poster">
                <div>
                    <h2>${movie.Title} (${movie.Year})</h2>
                    <p><strong>Жанр:</strong> ${movie.Genre}</p>
                    <p><strong>Режисьор:</strong> ${movie.Director}</p>
                    <p><strong>Актьори:</strong> ${movie.Actors}</p>
                    <p>${movie.Plot}</p>
                    <p><strong>IMDb Рейтинг:</strong> ${movie.imdbRating} / 10</p>
                    <button id="favorite-btn" class="${buttonClass}" data-imdbid="${movie.imdbID}">${buttonText}</button>
                </div>
            `;
            dom.movieModal.style.display = 'block';
            //лисънар за бутона
            document.getElementById('favorite-btn').addEventListener('click', handleFavoriteButtonClick);
        }
    };
    //А тук го крием :)
    const hideModal = () => {
        dom.movieModal.style.display = 'none';
    };

    /**
     * Обработва събитието при подаване на формата за търсене.
     * @param {Event} event
     */
    const handleSearchSubmit = async (event) => {
        // Предотвратяваме стандартното поведение презареждане на страницата
        event.preventDefault();
        
        // Стойността за търсене, без излишните празни полета в началото и края
        const searchTerm = dom.searchInput.value.trim();

        if (searchTerm) {
            const movies = await fetchMovies(searchTerm);
            renderMovies(movies);
        }
    };

    /**
     * Извлича филми от OMDb API чрез асинхронна заявка.
     * @param {string} searchTerm
     * @returns {Promise<Array>}
     */
    const fetchMovies = async (searchTerm) => {
        const url = `${state.apiBaseUrl}?s=${searchTerm}&apikey=${state.apiKey}`;
        
        try {
            // Изпращаме заявка към API-то с fetch()
            const response = await fetch(url);
            // Парсваме отговора от JSON към JavaScript обект
            const data = await response.json();

            // Ако намери - { Response: "True", Search: [...] }
            if (data.Response === "True") {
                return data.Search;
            } else {
                // В другия случай.. лошУ 
                console.error(data.Error);
                return [];
            }
        } catch (error) {
            // Ако нещо по пътя се прецака
            console.error('Грешка във "FetchMovies":', error);
            return [];
        }
    };

    /**
     * Манипулираме DOM за да създадем и покажем картите с филми.
     * @param {Array} movies
     */
    const renderMovies = (movies) => {
        // Първо се уверяваме, че работим на бял лист, след това започваме да пълним
        dom.resultsContainer.innerHTML = '';

        if (dom.resultsContainer.innerHTML.indexOf('<h2>Вашите любими филми:</h2>') === -1) {
            dom.resultsContainer.innerHTML = '';
        } else {
            // Ако показваме любими, изтриваме само съобщението "зареждане..." ако го има
            const loadingMessage = dom.resultsContainer.querySelector('p');
            if (loadingMessage) loadingMessage.remove();
        }

        if (movies.length === 0) {
            dom.resultsContainer.innerHTML = '<p>Няма намерени резултати. Опитайте с друго заглавие.</p>';
            return;
        }

        movies.forEach(movie => {
            // Създаваме нов div елемент за картата на филма
            const movieCard = document.createElement('div');
            movieCard.classList.add('movie-card');
            movieCard.dataset.imdbid = movie.imdbID;
            // Постера или N/A
            const posterSrc = movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/200x300.png?text=No+Image';

            // Пълним картата
            movieCard.innerHTML = `
                <img src="${posterSrc}" alt="${movie.Title} Poster">
                <div class="movie-info">
                    <h3>${movie.Title}</h3>
                    <p>${movie.Year}</p>
                </div>
            `;

            // Добавяме картата
            dom.resultsContainer.appendChild(movieCard);
        });
    };

    const init = () => {
        // Прикачаме event listener, който да извиква handleSearchSubmit
        dom.searchForm.addEventListener('submit', handleSearchSubmit);
        // Прикачаме event listener и за модала
        dom.closeBtn.addEventListener('click', hideModal); // Затваряне с бутона 'X'
        window.addEventListener('click', (event) => {
            // Затваряне при клик извън съдържанието
            if (event.target === dom.movieModal) {
                hideModal();
            }
        });
        // Прикачаме и за контейнера, та да си кликат на воля
        dom.resultsContainer.addEventListener('click', handleMovieCardClick);
        //Ще гледаме ли любимите филми?
         dom.showFavoritesBtn.addEventListener('click', showFavoriteMovies);

    };

    // Връщаме обект, който излага функцията `init` като публична.
    return {
        init
    };

})();

// Викаме App.init(), когато DOM е зареден.
document.addEventListener('DOMContentLoaded', App.init);