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
        resultsContainer: document.getElementById('results-container')
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
                // В другия случай.. лошу 
                console.error(data.Error);
                return [];
            }
        } catch (error) {
            // Ако нещо по пътя се прецака
            console.error('Грешка при заявката:', error);
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

        if (movies.length === 0) {
            dom.resultsContainer.innerHTML = '<p>Няма намерени резултати. Опитайте с друго заглавие.</p>';
            return;
        }

        movies.forEach(movie => {
            // Създаваме нов div елемент за картата на филма
            const movieCard = document.createElement('div');
            movieCard.classList.add('movie-card');

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
    };

    // Връщаме обект, който излага функцията `init` като публична.
    return {
        init
    };

})();

// Викаме App.init(), когато DOM е зареден.
document.addEventListener('DOMContentLoaded', App.init);