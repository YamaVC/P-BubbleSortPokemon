// Estado de la aplicación
const AppState = {
    currentSection: 'intro-section',
    selectedPokemon: [],
    demoStep: 0,
    practicePokemon: [],
    selectedIndexes: [],
    quizAnswers: {},
    pokemons: []
};

// Configuración
const Config = {
    defaultPokemons: [
        {id: 1, name: 'Bulbasaur', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png'},
        {id: 4, name: 'Charmander', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/4.png'},
        {id: 7, name: 'Squirtle', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/7.png'},
        {id: 25, name: 'Pikachu', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png'},
        {id: 39, name: 'Jigglypuff', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/39.png'},
        {id: 133, name: 'Eevee', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/133.png'},
        {id: 143, name: 'Snorlax', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/143.png'},
        {id: 150, name: 'Mewtwo', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/150.png'}
    ],
    animationDelay: 1000
};

// Utilidades
const Utils = {
    getElement: (id) => document.getElementById(id),
    createElement: (tag, className, content) => {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (content) element.innerHTML = content;
        return element;
    },
    shuffleArray: (array) => [...array].sort(() => 0.5 - Math.random()),
    sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms))
};

// Gestión de secciones
const SectionManager = {
    show: (sectionId) => {
        const currentSection = Utils.getElement(AppState.currentSection);
        const newSection = Utils.getElement(sectionId);
        
        currentSection.classList.remove('active-section');
        currentSection.classList.add('hidden-section');
        
        newSection.classList.remove('hidden-section');
        newSection.classList.add('active-section');
        
        AppState.currentSection = sectionId;
        
        switch(sectionId) {
            case 'bubble-section':
                SectionManager.setupBubbleSection();
                break;
            case 'practice-section':
                SectionManager.setupPracticeSection();
                break;
            case 'quiz-section':
                SectionManager.setupQuizSection();
                break;
        }
    },

    setupBubbleSection: () => {
        /* esta funcion llama a la información dada en la sección 4*/ 
        const examplePokemon = Utils.shuffleArray(AppState.pokemons).slice(0, 5);
        const learnList = Utils.getElement('learn-pokemon-list');
        learnList.innerHTML = '';
        
        examplePokemon.forEach((pokemon, index) => {
            learnList.innerHTML += `
                <div class="pokemon-card" data-id="${pokemon.id}" data-index="${index}">
                    <img src="${pokemon.image}" alt="${pokemon.name}">
                    <p class="pokemon-number">#${pokemon.id}</p>
                    <p>${pokemon.name}</p>
                </div>
            `;
        });
        
        Utils.getElement('explanation').innerHTML = '';
        AppState.demoStep = 0;
    },

    setupPracticeSection: () => {
        AppState.practicePokemon = Utils.shuffleArray(AppState.pokemons).slice(0, 6);
        const practiceList = Utils.getElement('practice-list');
        practiceList.innerHTML = '';
        
        AppState.practicePokemon.forEach((pokemon, index) => {
            practiceList.innerHTML += `
                <div class="pokemon-card" data-index="${index}">
                    <img src="${pokemon.image}" alt="${pokemon.name}">
                    <p class="pokemon-number">#${pokemon.id}</p>
                    <p>${pokemon.name}</p>
                </div>
            `;
        });
        
        Utils.getElement('feedback').innerHTML = 'Selecciona dos Pokémon para intercambiar sus posiciones.';
        // feedback de la sección 4 y 5
        AppState.selectedIndexes = [];
    },

    setupQuizSection: () => {
        Utils.getElement('quiz-feedback').innerHTML = '';
        AppState.quizAnswers = {};
    }
};

// Gestión de eventos
const EventManager = {
    setup: () => {
        // Botones de navegación
        /* esta constante se comunica con la informaci+on dada en data-section = "basics-section" en las secciones 1, 2 y 3*/
        document.querySelectorAll('[data-section]').forEach(button => {
            button.addEventListener('click', () => {
                const section = button.getAttribute('data-section');
                SectionManager.show(section);
            });
        });

        // Botones de acción
        /* esta constante se comunica con la información dada en data-action en las secciones 4 y 5*/
        document.querySelectorAll('[data-action]').forEach(button => {
            button.addEventListener('click', () => {
                const action = button.getAttribute('data-action');
                switch(action) {
                    case 'demonstrate':
                        SortingManager.demonstrateStep();
                        break;
                    case 'swap':
                        SortingManager.swapSelected();
                        break;
                    case 'check':
                        SortingManager.checkOrder();
                        break;
                    case 'reset':
                        SectionManager.setupPracticeSection();
                        break;
                }
            });
        });

        // Botones del quiz
        document.querySelectorAll('[data-quiz]').forEach(button => {
            button.addEventListener('click', () => {
                const question = button.getAttribute('data-quiz');
                const answer = button.getAttribute('data-answer');
                QuizManager.checkAnswer(question, answer);
            });
        });

        // Event listeners para las tarjetas de Pokémon en la sección de práctica
        document.addEventListener('click', (event) => {
            const card = event.target.closest('.pokemon-card');
            if (card && card.closest('#practice-list')) {
                const index = parseInt(card.getAttribute('data-index'));
                if (!isNaN(index)) {
                    SortingManager.selectPokemon(index);
                }
            }
        });
    }
};

// Gestión del ordenamiento
const SortingManager = {
    demonstrateStep: () => {
        const cards = Array.from(document.querySelectorAll('#learn-pokemon-list .pokemon-card'));
        const pokemonData = cards.map(card => ({
            id: parseInt(card.getAttribute('data-id')),
            name: card.querySelector('p:not(.pokemon-number)').textContent,
            element: card
        }));
        
        const explanationDiv = Utils.getElement('explanation');
        
        // Verificar si los Pokémon están ordenados
        const isSorted = pokemonData.every((pokemon, index, array) => 
            index === 0 || pokemon.id >= array[index - 1].id);
        
        if (isSorted) {
            explanationDiv.innerHTML = '¡El algoritmo ha terminado de ordenar! Todos los Pokémon están en su posición correcta.';
            AppState.demoStep = 0;
            return;
        }
        
        // Si no estamos en el último paso, continuar con la demostración
        if (AppState.demoStep >= pokemonData.length - 1) {
            // Reiniciar el paso y continuar con una nueva pasada
            AppState.demoStep = 0;
        }
        
        cards.forEach(card => card.style.backgroundColor = '');
        cards[AppState.demoStep].style.backgroundColor = '#fff9c4';
        cards[AppState.demoStep + 1].style.backgroundColor = '#fff9c4';
        
        if (pokemonData[AppState.demoStep].id > pokemonData[AppState.demoStep + 1].id) {
            explanationDiv.innerHTML = `
                <strong>Paso ${AppState.demoStep + 1}:</strong> Como #${pokemonData[AppState.demoStep].id} (${pokemonData[AppState.demoStep].name}) es mayor que #${pokemonData[AppState.demoStep + 1].id} (${pokemonData[AppState.demoStep + 1].name}), los intercambiamos.
            `;
            
            const container = Utils.getElement('learn-pokemon-list');
            container.insertBefore(cards[AppState.demoStep + 1], cards[AppState.demoStep]);
            
            // Actualizar el array de datos
            [pokemonData[AppState.demoStep], pokemonData[AppState.demoStep + 1]] = 
            [pokemonData[AppState.demoStep + 1], pokemonData[AppState.demoStep]];
        } else {
            explanationDiv.innerHTML = `
                <strong>Paso ${AppState.demoStep + 1}:</strong> #${pokemonData[AppState.demoStep].id} (${pokemonData[AppState.demoStep].name}) no es mayor que #${pokemonData[AppState.demoStep + 1].id} (${pokemonData[AppState.demoStep + 1].name}), no se intercambian.
            `;
        }
        
        AppState.demoStep++;
    },

    selectPokemon: (index) => {
        const card = document.querySelector(`#practice-list .pokemon-card[data-index="${index}"]`);
        
        if (AppState.selectedIndexes.includes(index)) {
            AppState.selectedIndexes = AppState.selectedIndexes.filter(i => i !== index);
            card.classList.remove('selected');
        } else if (AppState.selectedIndexes.length < 2) {
            AppState.selectedIndexes.push(index);
            card.classList.add('selected');
        }
    },

    swapSelected: () => {
        if (AppState.selectedIndexes.length !== 2) {
            Utils.getElement('feedback').innerHTML = 'Debes seleccionar exactamente dos Pokémon para intercambiar.';
            return;
        }

        const [index1, index2] = AppState.selectedIndexes;
        const cards = Array.from(document.querySelectorAll('#practice-list .pokemon-card'));
        
        // Verificar que los índices son válidos
        if (index1 < 0 || index1 >= cards.length || index2 < 0 || index2 >= cards.length) {
            Utils.getElement('feedback').innerHTML = 'Error: índices no válidos.';
            return;
        }

        // Intercambiar en el array de datos
        [AppState.practicePokemon[index1], AppState.practicePokemon[index2]] = 
        [AppState.practicePokemon[index2], AppState.practicePokemon[index1]];
        
        // Intercambiar en el DOM
        const container = Utils.getElement('practice-list');
        
        // Obtener los elementos a intercambiar
        const card1 = cards[index1];
        const card2 = cards[index2];
        
        // Crear un elemento temporal para el intercambio
        const temp = document.createElement('div');
        
        // Realizar el intercambio
        container.insertBefore(temp, card1);
        container.insertBefore(card1, card2);
        container.insertBefore(card2, temp);
        container.removeChild(temp);
        
        // Actualizar los índices en los elementos del DOM
        card1.setAttribute('data-index', index2);
        card2.setAttribute('data-index', index1);
        
        // Limpiar selección
        cards.forEach(card => card.classList.remove('selected'));
        AppState.selectedIndexes = [];
        
        // Actualizar feedback
        Utils.getElement('feedback').innerHTML = '¡Pokémon intercambiados! Continúa ordenando.';
    },

    checkOrder: () => {
        // Verificar que el array está ordenado
        const isSorted = AppState.practicePokemon.every((pokemon, index, array) => 
            index === 0 || pokemon.id >= array[index - 1].id);
        
        const feedbackDiv = Utils.getElement('feedback');
        
        if (isSorted) {
            feedbackDiv.innerHTML = `
                <strong>¡Correcto!</strong> Has ordenado los Pokémon correctamente usando el método de burbuja.
                <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png" 
                     alt="Pikachu feliz" style="width: 80px; display: block; margin: 10px auto;">
            `;
        } else {
            // Mostrar el orden actual para ayudar al usuario
            const currentOrder = AppState.practicePokemon.map(p => `#${p.id} (${p.name})`).join(' → ');
            feedbackDiv.innerHTML = `
                Aún no están ordenados. El orden actual es:<br>
                ${currentOrder}<br><br>
                Sigue intentando intercambiar los Pokémon hasta que sus números estén en orden ascendente.
            `;
        }
    }
};

// Gestión del quiz
const QuizManager = {
    checkAnswer: (question, answer) => {
        AppState.quizAnswers[question] = answer;
        
        const options = document.querySelectorAll(`.quiz-question:nth-child(${question}) .quiz-option`);
        options.forEach(option => {
            option.style.backgroundColor = '#e3f2fd';
        });
        
        const selectedOption = document.querySelector(`.quiz-question:nth-child(${question}) .quiz-option:nth-child(${answer === 'a' ? 1 : answer === 'b' ? 2 : 3})`);
        selectedOption.style.backgroundColor = '#bbdefb';
        
        QuizManager.checkAllAnswers();
    },

    checkAllAnswers: () => {
        if (Object.keys(AppState.quizAnswers).length === 2) {
            const feedbackDiv = Utils.getElement('quiz-feedback');
            let correctCount = 0;
            
            if (AppState.quizAnswers[1] === 'a') correctCount++;
            if (AppState.quizAnswers[2] === 'b') correctCount++;
            
            if (correctCount === 2) {
                feedbackDiv.innerHTML = `
                    <strong>¡Perfecto!</strong> Has respondido todas las preguntas correctamente. 
                    <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/149.png" 
                         alt="Dragonite" style="width: 80px; display: block; margin: 10px auto;">
                    ¡Eres un maestro de la programación!
                `;
            } else {
                feedbackDiv.innerHTML = `
                    Has respondido ${correctCount} de 2 preguntas correctamente. 
                    ${correctCount === 1 ? 
                        '¡Casi lo logras! Revisa la respuesta incorrecta.' : 
                        'Puedes repasar los conceptos si lo necesitas.'}
                `;
            }
        }
    }
};

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    if (AppState.pokemons.length === 0) {
        AppState.pokemons = Config.defaultPokemons;
    }
    EventManager.setup();
    SectionManager.show('intro-section');
});