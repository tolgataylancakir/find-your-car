// Car Finder Application
class CarFinder {
    constructor() {
        this.currentStep = 0;
        this.selectedMarket = 'nl';
        this.userAnswers = {};
        this.questions = [];
        this.searchResults = [];
        this.currentPage = 1;
        this.resultsPerPage = 10;
        
        this.initializeApp();
        this.loadQuestions();
        this.initializeSearch();
    }

    initializeApp() {
        // Market selection
        document.querySelectorAll('.market-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.market-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedMarket = btn.dataset.market;
                this.loadQuestions();
            });
        });

        // Tab navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const targetTab = tab.id.replace('tab-', '');
                this.switchTab(targetTab);
            });
        });

        // Start button
        document.getElementById('start-btn').addEventListener('click', () => {
            this.startQuestionnaire();
        });

        // Navigation buttons
        document.getElementById('next-btn').addEventListener('click', () => {
            this.nextQuestion();
        });

        document.getElementById('back-btn').addEventListener('click', () => {
            this.previousQuestion();
        });

        // Restart button
        document.getElementById('restart-btn').addEventListener('click', () => {
            this.restart();
        });
    }

    switchTab(tabName) {
        // Update tab appearance
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.getElementById(`tab-${tabName}`).classList.add('active');

        // Switch sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(`${tabName}-section`).classList.add('active');

        // Reset to welcome screen when switching to finder
        if (tabName === 'finder') {
            this.restart();
        }
    }

    initializeSearch() {
        // Search button
        document.getElementById('search-btn').addEventListener('click', () => {
            this.performSearch();
        });

        // Clear search button
        document.getElementById('clear-search-btn').addEventListener('click', () => {
            this.clearSearchForm();
        });

        // Sort functionality
        document.getElementById('sort-by').addEventListener('change', () => {
            this.sortAndDisplayResults();
        });

        // Pagination
        document.getElementById('prev-page').addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.displaySearchResults();
            }
        });

        document.getElementById('next-page').addEventListener('click', () => {
            const totalPages = Math.ceil(this.searchResults.length / this.resultsPerPage);
            if (this.currentPage < totalPages) {
                this.currentPage++;
                this.displaySearchResults();
            }
        });
    }

    clearSearchForm() {
        document.getElementById('search-make').value = '';
        document.getElementById('search-model').value = '';
        document.getElementById('search-price-min').value = '';
        document.getElementById('search-price-max').value = '';
        document.getElementById('search-year-min').value = '';
        document.getElementById('search-fuel').value = '';
        document.getElementById('search-transmission').value = '';
        document.getElementById('search-body').value = '';
        
        // Hide results
        document.getElementById('search-results').classList.add('hidden');
    }

    async performSearch() {
        const searchParams = this.getSearchParams();
        
        // Show loading state
        document.getElementById('search-loading').classList.remove('hidden');
        document.getElementById('search-results').classList.add('hidden');

        try {
            const response = await fetch('/api/search-cars', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ market: this.selectedMarket, ...searchParams })
            });
            const data = await response.json();
            const cars = Array.isArray(data?.cars) ? data.cars : [];

            // Normalize minimal fields expected by the renderer; fallback to placeholders
            this.searchResults = cars.map((car, idx) => ({
                id: car.id || idx + 1,
                make: car.make || 'Unknown',
                model: car.model || '',
                variant: car.variant || '',
                year: car.year || new Date().getFullYear(),
                price: car.price || 0,
                mileage: car.mileage || 0,
                fuel: car.fuel || 'petrol',
                transmission: car.transmission || 'manual',
                body: car.body || 'hatchback',
                power: car.power || '',
                doors: car.doors || 4,
                color: car.color || '',
                location: car.location || 'NL',
                source: car.source || 'Marktplaats',
                url: car.url || '#',
                images: Array.isArray(car.images) ? car.images : []
            }));
            
            this.currentPage = 1;
            this.displaySearchResults();
            
        } catch (error) {
            console.error('Search failed:', error);
            alert('Search failed. Please try again.');
        } finally {
            document.getElementById('search-loading').classList.add('hidden');
        }
    }

    getSearchParams() {
        return {
            make: document.getElementById('search-make').value,
            model: document.getElementById('search-model').value,
            priceMin: document.getElementById('search-price-min').value,
            priceMax: document.getElementById('search-price-max').value,
            yearMin: document.getElementById('search-year-min').value,
            fuel: document.getElementById('search-fuel').value,
            transmission: document.getElementById('search-transmission').value,
            body: document.getElementById('search-body').value
        };
    }

    generateMockSearchResults(params) {
        // Mock car listings that would come from Marktplaats, Gaspedaal, etc.
        const mockCars = [
            {
                id: 1,
                make: 'BMW',
                model: '3 Series',
                variant: '320i Executive',
                year: 2019,
                price: 28500,
                mileage: 67000,
                fuel: 'petrol',
                transmission: 'automatic',
                body: 'sedan',
                power: '184 HP',
                doors: 4,
                color: 'Black',
                location: 'Amsterdam',
                source: 'Marktplaats',
                url: 'https://marktplaats.nl/example1',
                images: ['https://example.com/car1.jpg']
            },
            {
                id: 2,
                make: 'Volkswagen',
                model: 'Golf',
                variant: '1.5 TSI Highline',
                year: 2020,
                price: 22900,
                mileage: 45000,
                fuel: 'petrol',
                transmission: 'manual',
                body: 'hatchback',
                power: '150 HP',
                doors: 5,
                color: 'White',
                location: 'Rotterdam',
                source: 'Gaspedaal',
                url: 'https://gaspedaal.nl/example2',
                images: ['https://example.com/car2.jpg']
            },
            {
                id: 3,
                make: 'Audi',
                model: 'A4',
                variant: '2.0 TDI Avant',
                year: 2018,
                price: 26750,
                mileage: 78000,
                fuel: 'diesel',
                transmission: 'automatic',
                body: 'wagon',
                power: '150 HP',
                doors: 5,
                color: 'Silver',
                location: 'Utrecht',
                source: 'Marktplaats',
                url: 'https://marktplaats.nl/example3',
                images: ['https://example.com/car3.jpg']
            },
            {
                id: 4,
                make: 'Tesla',
                model: 'Model 3',
                variant: 'Standard Range Plus',
                year: 2021,
                price: 42500,
                mileage: 32000,
                fuel: 'electric',
                transmission: 'automatic',
                body: 'sedan',
                power: '283 HP',
                doors: 4,
                color: 'Blue',
                location: 'Den Haag',
                source: 'Gaspedaal',
                url: 'https://gaspedaal.nl/example4',
                images: ['https://example.com/car4.jpg']
            },
            {
                id: 5,
                make: 'Toyota',
                model: 'Prius',
                variant: '1.8 Hybrid Executive',
                year: 2020,
                price: 27900,
                mileage: 55000,
                fuel: 'hybrid',
                transmission: 'automatic',
                body: 'hatchback',
                power: '122 HP',
                doors: 5,
                color: 'Gray',
                location: 'Eindhoven',
                source: 'Marktplaats',
                url: 'https://marktplaats.nl/example5',
                images: ['https://example.com/car5.jpg']
            },
            {
                id: 6,
                make: 'Mercedes',
                model: 'C-Class',
                variant: 'C180 AMG Line',
                year: 2019,
                price: 31200,
                mileage: 61000,
                fuel: 'petrol',
                transmission: 'automatic',
                body: 'sedan',
                power: '156 HP',
                doors: 4,
                color: 'Black',
                location: 'Groningen',
                source: 'Gaspedaal',
                url: 'https://gaspedaal.nl/example6',
                images: ['https://example.com/car6.jpg']
            }
        ];

        // Filter based on search parameters
        let filtered = mockCars.filter(car => {
            if (params.make && car.make.toLowerCase() !== params.make.toLowerCase()) return false;
            if (params.model && !car.model.toLowerCase().includes(params.model.toLowerCase())) return false;
            if (params.priceMin && car.price < parseInt(params.priceMin)) return false;
            if (params.priceMax && car.price > parseInt(params.priceMax)) return false;
            if (params.yearMin && car.year < parseInt(params.yearMin)) return false;
            if (params.fuel && car.fuel !== params.fuel) return false;
            if (params.transmission && car.transmission !== params.transmission) return false;
            if (params.body && car.body !== params.body) return false;
            return true;
        });

        // Generate additional mock results to simulate more findings
        while (filtered.length < 15 && filtered.length < mockCars.length) {
            const baseCar = mockCars[Math.floor(Math.random() * mockCars.length)];
            const newCar = {
                ...baseCar,
                id: Date.now() + Math.random(),
                price: baseCar.price + Math.floor(Math.random() * 10000 - 5000),
                mileage: baseCar.mileage + Math.floor(Math.random() * 20000),
                year: Math.max(2015, baseCar.year + Math.floor(Math.random() * 6 - 3)),
                location: ['Amsterdam', 'Rotterdam', 'Utrecht', 'Den Haag', 'Eindhoven'][Math.floor(Math.random() * 5)]
            };
            if (!filtered.find(car => car.id === newCar.id)) {
                filtered.push(newCar);
            }
        }

        return filtered;
    }

    sortAndDisplayResults() {
        this.displaySearchResults();
    }

    displaySearchResults() {
        const sortBy = document.getElementById('sort-by').value;
        let sortedResults = [...this.searchResults];

        // Sort results
        switch (sortBy) {
            case 'price-low':
                sortedResults.sort((a, b) => a.price - b.price);
                break;
            case 'price-high':
                sortedResults.sort((a, b) => b.price - a.price);
                break;
            case 'year-new':
                sortedResults.sort((a, b) => b.year - a.year);
                break;
            case 'year-old':
                sortedResults.sort((a, b) => a.year - b.year);
                break;
            case 'mileage-low':
                sortedResults.sort((a, b) => a.mileage - b.mileage);
                break;
            default: // relevance
                // Keep original order
                break;
        }

        // Pagination
        const startIndex = (this.currentPage - 1) * this.resultsPerPage;
        const endIndex = startIndex + this.resultsPerPage;
        const paginatedResults = sortedResults.slice(startIndex, endIndex);

        // Update results count
        document.getElementById('results-count').textContent = `${sortedResults.length} cars found`;

        // Create result cards
        const resultsContainer = document.getElementById('search-results-list');
        resultsContainer.innerHTML = '';

        paginatedResults.forEach(car => {
            const carCard = document.createElement('div');
            carCard.className = 'search-car-card';
            carCard.innerHTML = `
                <div class="car-header">
                    <div class="car-main-info">
                        <h4>${car.make} ${car.model} ${car.variant}</h4>
                        <div class="car-year-mileage">${car.year} • ${car.mileage.toLocaleString()} km</div>
                    </div>
                    <div class="car-price">€${car.price.toLocaleString()}</div>
                </div>
                
                <div class="car-details-grid">
                    <div class="car-detail-item">
                        <span>⛽</span>
                        <span>${car.fuel.charAt(0).toUpperCase() + car.fuel.slice(1)}</span>
                    </div>
                    <div class="car-detail-item">
                        <span>⚙️</span>
                        <span>${car.transmission.charAt(0).toUpperCase() + car.transmission.slice(1)}</span>
                    </div>
                    <div class="car-detail-item">
                        <span>🚗</span>
                        <span>${car.body.charAt(0).toUpperCase() + car.body.slice(1)}</span>
                    </div>
                    <div class="car-detail-item">
                        <span>⚡</span>
                        <span>${car.power}</span>
                    </div>
                    <div class="car-detail-item">
                        <span>🚪</span>
                        <span>${car.doors} doors</span>
                    </div>
                    <div class="car-detail-item">
                        <span>🎨</span>
                        <span>${car.color}</span>
                    </div>
                </div>
                
                <div class="car-footer">
                    <div>
                        <span class="car-source">${car.source}</span>
                        <span style="color: rgba(255, 255, 255, 0.6); margin-left: 10px; font-size: 12px;">📍 ${car.location}</span>
                    </div>
                    <a href="${car.url}" target="_blank" class="car-link">View Details →</a>
                </div>
            `;
            
            resultsContainer.appendChild(carCard);
        });

        // Update pagination
        this.updatePagination(sortedResults.length);

        // Show results
        document.getElementById('search-results').classList.remove('hidden');
    }

    updatePagination(totalResults) {
        const totalPages = Math.ceil(totalResults / this.resultsPerPage);
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        const pageInfo = document.getElementById('page-info');

        prevBtn.disabled = this.currentPage === 1;
        nextBtn.disabled = this.currentPage === totalPages;
        pageInfo.textContent = `Page ${this.currentPage} of ${totalPages}`;

        // Show/hide pagination
        const paginationContainer = document.querySelector('.search-pagination');
        if (totalPages > 1) {
            paginationContainer.classList.remove('hidden');
        } else {
            paginationContainer.classList.add('hidden');
        }
    }

    loadQuestions() {
        const questionsNL = [
            {
                title: "How do you primarily use your car?",
                subtitle: "This helps us understand your driving patterns",
                options: [
                    { icon: "🏙️", text: "City driving", description: "Mostly within Amsterdam, Rotterdam, Utrecht", value: "city" },
                    { icon: "🛣️", text: "Mixed driving", description: "City and highway combination", value: "mixed" },
                    { icon: "🚗", text: "Highway commuting", description: "Regular longer distances", value: "highway" },
                    { icon: "🚐", text: "Family transport", description: "School runs, weekend trips", value: "family" }
                ]
            },
            {
                title: "What's your fuel preference?",
                subtitle: "Consider Dutch environmental zones and incentives",
                options: [
                    { icon: "⚡", text: "Electric", description: "Zero emissions, great for city zones", value: "electric" },
                    { icon: "🔋", text: "Hybrid", description: "Best of both worlds", value: "hybrid" },
                    { icon: "⛽", text: "Petrol", description: "Traditional and flexible", value: "petrol" },
                    { icon: "🚛", text: "Diesel", description: "Good for long distances", value: "diesel" }
                ]
            },
            {
                title: "What size car fits your needs?",
                subtitle: "Consider Dutch parking spaces and narrow streets",
                options: [
                    { icon: "🚗", text: "Compact", description: "Easy to park, fuel efficient", value: "compact" },
                    { icon: "🚙", text: "Mid-size", description: "Balance of space and maneuverability", value: "midsize" },
                    { icon: "🚐", text: "Large/SUV", description: "Maximum space and comfort", value: "large" },
                    { icon: "🏎️", text: "Sports car", description: "Performance and style", value: "sports" }
                ]
            },
            {
                title: "What's your budget range?",
                subtitle: "Including Dutch taxes and insurance considerations",
                options: [
                    { icon: "💰", text: "€15,000 - €25,000", description: "Practical and economical", value: "budget" },
                    { icon: "💎", text: "€25,000 - €40,000", description: "Good features and quality", value: "mid" },
                    { icon: "🌟", text: "€40,000 - €60,000", description: "Premium features", value: "premium" },
                    { icon: "👑", text: "€60,000+", description: "Luxury and top performance", value: "luxury" }
                ]
            },
            {
                title: "What matters most to you?",
                subtitle: "Choose your top priority",
                options: [
                    { icon: "🌱", text: "Environmental impact", description: "Low emissions, sustainability", value: "eco" },
                    { icon: "💸", text: "Low running costs", description: "Fuel efficiency, maintenance", value: "economy" },
                    { icon: "👨‍👩‍👧‍👦", text: "Family practicality", description: "Space, safety, convenience", value: "practical" },
                    { icon: "🏎️", text: "Performance & style", description: "Power, design, prestige", value: "performance" }
                ]
            },
            {
                title: "Any specific preferences?",
                subtitle: "Final considerations for Dutch roads",
                options: [
                    { icon: "🅿️", text: "Easy parking", description: "Compact for city parking", value: "parking" },
                    { icon: "⚡", text: "Latest tech", description: "Advanced features and connectivity", value: "tech" },
                    { icon: "🛡️", text: "Maximum safety", description: "Top safety ratings", value: "safety" },
                    { icon: "🎨", text: "Unique design", description: "Stand out from the crowd", value: "design" }
                ]
            }
        ];

        const questionsDE = [
            {
                title: "Wie nutzen Sie Ihr Auto hauptsächlich?",
                subtitle: "Das hilft uns, Ihre Fahrgewohnheiten zu verstehen",
                options: [
                    { icon: "🏙️", text: "Stadtfahrten", description: "Meist in Berlin, München, Hamburg", value: "city" },
                    { icon: "🛣️", text: "Gemischtes Fahren", description: "Stadt und Autobahn kombiniert", value: "mixed" },
                    { icon: "🏎️", text: "Autobahn-Pendler", description: "Regelmäßige längere Strecken", value: "highway" },
                    { icon: "🚐", text: "Familientransport", description: "Schulweg, Wochenendausflüge", value: "family" }
                ]
            },
            {
                title: "Welcher Kraftstoff ist Ihnen wichtig?",
                subtitle: "Bedenken Sie deutsche Umweltzonen und Förderungen",
                options: [
                    { icon: "⚡", text: "Elektrisch", description: "Null Emissionen, ideal für Umweltzonen", value: "electric" },
                    { icon: "🔋", text: "Hybrid", description: "Das Beste aus beiden Welten", value: "hybrid" },
                    { icon: "⛽", text: "Benzin", description: "Traditionell und flexibel", value: "petrol" },
                    { icon: "🚛", text: "Diesel", description: "Gut für lange Strecken", value: "diesel" }
                ]
            },
            {
                title: "Welche Fahrzeuggröße passt zu Ihnen?",
                subtitle: "Für deutsche Straßen und Autobahn-Fahrten",
                options: [
                    { icon: "🚗", text: "Kompakt", description: "Wendig und sparsam", value: "compact" },
                    { icon: "🚙", text: "Mittelklasse", description: "Balance aus Platz und Wendigkeit", value: "midsize" },
                    { icon: "🚐", text: "Groß/SUV", description: "Maximaler Platz und Komfort", value: "large" },
                    { icon: "🏎️", text: "Sportwagen", description: "Leistung und Stil", value: "sports" }
                ]
            },
            {
                title: "Was ist Ihr Budgetrahmen?",
                subtitle: "Inklusive deutscher Steuern und Versicherung",
                options: [
                    { icon: "💰", text: "€15.000 - €25.000", description: "Praktisch und wirtschaftlich", value: "budget" },
                    { icon: "💎", text: "€25.000 - €40.000", description: "Gute Ausstattung und Qualität", value: "mid" },
                    { icon: "🌟", text: "€40.000 - €60.000", description: "Premium-Features", value: "premium" },
                    { icon: "👑", text: "€60.000+", description: "Luxus und Top-Performance", value: "luxury" }
                ]
            },
            {
                title: "Was ist Ihnen am wichtigsten?",
                subtitle: "Wählen Sie Ihre Top-Priorität",
                options: [
                    { icon: "🌱", text: "Umweltfreundlichkeit", description: "Niedrige Emissionen, Nachhaltigkeit", value: "eco" },
                    { icon: "💸", text: "Niedrige Betriebskosten", description: "Kraftstoffeffizienz, Wartung", value: "economy" },
                    { icon: "👨‍👩‍👧‍👦", text: "Familientauglichkeit", description: "Platz, Sicherheit, Komfort", value: "practical" },
                    { icon: "🏎️", text: "Performance & Stil", description: "Leistung, Design, Prestige", value: "performance" }
                ]
            },
            {
                title: "Besondere Wünsche?",
                subtitle: "Letzte Überlegungen für deutsche Straßen",
                options: [
                    { icon: "🏎️", text: "Autobahn-Performance", description: "Hohe Geschwindigkeiten, Stabilität", value: "autobahn" },
                    { icon: "⚡", text: "Modernste Technik", description: "Neueste Features und Konnektivität", value: "tech" },
                    { icon: "🛡️", text: "Maximale Sicherheit", description: "Top-Sicherheitsbewertungen", value: "safety" },
                    { icon: "❄️", text: "Allwetter-Tauglich", description: "Gut für alle Jahreszeiten", value: "allweather" }
                ]
            }
        ];

        this.questions = this.selectedMarket === 'nl' ? questionsNL : questionsDE;
    }

    startQuestionnaire() {
        console.log('🚀 Starting questionnaire...');
        this.currentStep = 0;
        this.userAnswers = {};
        this.showScreen('question-screen');
        this.showQuestion();
        this.updateProgress();
        document.getElementById('progress-container').classList.remove('hidden');
        console.log('✅ Questionnaire started successfully');
    }

    showScreen(screenId) {
        console.log(`📺 Showing screen: ${screenId}`);
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
        console.log(`✅ Screen ${screenId} is now active`);
    }

    showQuestion() {
        console.log(`❓ Showing question ${this.currentStep + 1} of ${this.questions.length}`);
        const question = this.questions[this.currentStep];
        
        if (!question) {
            console.error('❌ Question not found for step:', this.currentStep);
            return;
        }
        
        document.getElementById('question-title').textContent = question.title;
        document.getElementById('question-subtitle').textContent = question.subtitle;
        
        const optionsContainer = document.getElementById('question-options');
        optionsContainer.innerHTML = '';
        
        console.log(`🔧 Creating ${question.options.length} options...`);
        
        question.options.forEach((option, index) => {
            const button = document.createElement('button');
            button.className = 'option-btn';
            button.innerHTML = `
                <span class="option-icon">${option.icon}</span>
                <div class="option-text">
                    <div>${option.text}</div>
                    <div class="option-description">${option.description}</div>
                </div>
            `;
            
            button.addEventListener('click', () => {
                this.selectOption(option.value, button);
            });
            
            optionsContainer.appendChild(button);
        });
        
        // Update navigation
        const backBtn = document.getElementById('back-btn');
        const nextBtn = document.getElementById('next-btn');
        
        if (this.currentStep === 0) {
            backBtn.classList.add('hidden');
        } else {
            backBtn.classList.remove('hidden');
        }
        
        nextBtn.classList.add('disabled');
        nextBtn.textContent = this.currentStep === this.questions.length - 1 ? 'See Results →' : 'Continue →';
        
        console.log('✅ Question displayed successfully');
    }

    selectOption(value, button) {
        // Remove selection from other buttons
        document.querySelectorAll('.option-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        // Select current button
        button.classList.add('selected');
        
        // Store answer
        this.userAnswers[this.currentStep] = value;
        
        // Enable next button
        document.getElementById('next-btn').classList.remove('disabled');
    }

    nextQuestion() {
        if (document.getElementById('next-btn').classList.contains('disabled')) return;
        
        if (this.currentStep < this.questions.length - 1) {
            this.currentStep++;
            this.showQuestion();
            this.updateProgress();
        } else {
            this.showResults();
        }
    }

    previousQuestion() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.showQuestion();
            this.updateProgress();
        }
    }

    updateProgress() {
        const progress = ((this.currentStep + 1) / this.questions.length) * 100;
        document.getElementById('progress-fill').style.width = `${progress}%`;
        document.getElementById('progress-text').textContent = `Step ${this.currentStep + 1} of ${this.questions.length}`;
    }

    showResults() {
        this.showScreen('results-screen');
        document.getElementById('progress-container').classList.add('hidden');
        
        const recommendations = this.generateRecommendations();
        const resultsContainer = document.getElementById('results-list');
        
        resultsContainer.innerHTML = '';
        
        recommendations.forEach(car => {
            const carCard = document.createElement('div');
            carCard.className = 'car-card';
            carCard.innerHTML = `
                <div class="car-name">${car.name}</div>
                <div class="car-details">
                    <div class="car-detail">
                        <span>⛽</span>
                        <span>${car.fuel}</span>
                    </div>
                    <div class="car-detail">
                        <span>🚗</span>
                        <span>${car.type}</span>
                    </div>
                    <div class="car-detail">
                        <span>💰</span>
                        <span>${car.price}</span>
                    </div>
                    <div class="car-detail">
                        <span>⭐</span>
                        <span>${car.rating}/5</span>
                    </div>
                </div>
                <span class="car-match">${car.match}% Match</span>
            `;
            resultsContainer.appendChild(carCard);
        });
    }

    generateRecommendations() {
        // Sample car database with market-specific models
        const carsNL = [
            { name: "Volkswagen ID.3", fuel: "Electric", type: "Compact", price: "€35,000", rating: "4.5", tags: ["electric", "compact", "eco", "tech"] },
            { name: "Toyota Prius", fuel: "Hybrid", type: "Mid-size", price: "€32,000", rating: "4.3", tags: ["hybrid", "midsize", "eco", "economy"] },
            { name: "BMW 3 Series", fuel: "Petrol", type: "Mid-size", price: "€45,000", rating: "4.6", tags: ["petrol", "midsize", "performance", "luxury"] },
            { name: "Nissan Leaf", fuel: "Electric", type: "Compact", price: "€28,000", rating: "4.2", tags: ["electric", "compact", "eco", "parking"] },
            { name: "Volvo XC40", fuel: "Hybrid", type: "SUV", price: "€42,000", rating: "4.4", tags: ["hybrid", "large", "safety", "family"] },
            { name: "Tesla Model 3", fuel: "Electric", type: "Mid-size", price: "€48,000", rating: "4.7", tags: ["electric", "midsize", "tech", "performance"] },
            { name: "Peugeot 208", fuel: "Petrol", type: "Compact", price: "€18,000", rating: "4.1", tags: ["petrol", "compact", "budget", "parking"] },
            { name: "Audi A4", fuel: "Diesel", type: "Mid-size", price: "€52,000", rating: "4.5", tags: ["diesel", "midsize", "luxury", "highway"] }
        ];

        const carsDE = [
            { name: "BMW i4", fuel: "Electric", type: "Mid-size", price: "€55,000", rating: "4.6", tags: ["electric", "midsize", "performance", "autobahn"] },
            { name: "Mercedes C-Class", fuel: "Hybrid", type: "Mid-size", price: "€48,000", rating: "4.5", tags: ["hybrid", "midsize", "luxury", "highway"] },
            { name: "Volkswagen Golf", fuel: "Petrol", type: "Compact", price: "€25,000", rating: "4.4", tags: ["petrol", "compact", "mid", "mixed"] },
            { name: "Audi e-tron", fuel: "Electric", type: "SUV", price: "€75,000", rating: "4.7", tags: ["electric", "large", "luxury", "tech"] },
            { name: "Porsche Taycan", fuel: "Electric", type: "Sports", price: "€85,000", rating: "4.8", tags: ["electric", "sports", "luxury", "performance"] },
            { name: "BMW X3", fuel: "Diesel", type: "SUV", price: "€55,000", rating: "4.5", tags: ["diesel", "large", "family", "allweather"] },
            { name: "Mercedes A-Class", fuel: "Petrol", type: "Compact", price: "€28,000", rating: "4.3", tags: ["petrol", "compact", "mid", "tech"] },
            { name: "Audi A6", fuel: "Diesel", type: "Large", price: "€65,000", rating: "4.6", tags: ["diesel", "large", "luxury", "autobahn"] }
        ];

        const cars = this.selectedMarket === 'nl' ? carsNL : carsDE;
        
        // Calculate match scores based on user answers
        const scoredCars = cars.map(car => {
            let score = 0;
            let maxScore = 0;

            Object.values(this.userAnswers).forEach(answer => {
                maxScore += 20;
                if (car.tags.includes(answer)) {
                    score += 20;
                } else if (this.isCompatible(answer, car.tags)) {
                    score += 10;
                }
            });

            const matchPercentage = Math.round((score / maxScore) * 100);
            return { ...car, match: matchPercentage };
        });

        // Sort by match score and return top 4
        return scoredCars
            .sort((a, b) => b.match - a.match)
            .slice(0, 4);
    }

    isCompatible(answer, carTags) {
        const compatibility = {
            'city': ['compact', 'parking', 'electric'],
            'mixed': ['midsize', 'hybrid'],
            'highway': ['large', 'diesel', 'autobahn'],
            'family': ['large', 'safety', 'practical'],
            'budget': ['compact', 'economy'],
            'mid': ['midsize'],
            'premium': ['luxury'],
            'luxury': ['performance'],
            'eco': ['electric', 'hybrid'],
            'economy': ['compact', 'hybrid'],
            'practical': ['midsize', 'large'],
            'performance': ['sports', 'luxury']
        };

        return compatibility[answer]?.some(tag => carTags.includes(tag)) || false;
    }

    restart() {
        this.currentStep = 0;
        this.userAnswers = {};
        this.showScreen('welcome-screen');
        document.getElementById('progress-container').classList.add('hidden');
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new CarFinder();
});

console.log("🚗 CarFinder loaded successfully!");
