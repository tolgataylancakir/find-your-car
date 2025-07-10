// Car Finder Application
class CarFinder {
    constructor() {
        this.currentStep = 0;
        this.selectedMarket = 'nl';
        this.userAnswers = {};
        this.questions = [];
        
        this.initializeApp();
        this.loadQuestions();
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
        this.currentStep = 0;
        this.userAnswers = {};
        this.showScreen('question-screen');
        this.showQuestion();
        this.updateProgress();
        document.getElementById('progress-container').classList.remove('hidden');
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }

    showQuestion() {
        const question = this.questions[this.currentStep];
        
        document.getElementById('question-title').textContent = question.title;
        document.getElementById('question-subtitle').textContent = question.subtitle;
        
        const optionsContainer = document.getElementById('question-options');
        optionsContainer.innerHTML = '';
        
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
