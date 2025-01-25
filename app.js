// Configuration Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCigxBJ9Ot8-11S062n-PGiSM1uO98wE7g",
    authDomain: "betsmart-pro-55488.firebaseapp.com",
    databaseURL: "https://betsmart-pro-55488-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "betsmart-pro-55488",
    storageBucket: "betsmart-pro-55488.firebasestorage.app",
    messagingSenderId: "215633988518",
    appId: "1:215633988518:web:6342fa5daa5482a4265d67",
    measurementId: "G-623SHSQMRL"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const analytics = firebase.analytics();
const database = firebase.database();

const tg = window.Telegram.WebApp;
const TELEGRAM_BOT_TOKEN = '7469991306:AAE3c2AtRQf5qDgVCGVEcl0QAtaI9Wl8NiM';
const CHANNEL_USERNAME = 'alvecapital1';

let currentFIFAQuestion = 0;
let fifaAnswers = {};
let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
let currentHistoryDate = new Date();
let currentSection = '';

// Firebase functions for data management
async function savePredictionToFirebase(prediction) {
    try {
        const ref = database.ref('predictions');
        await ref.push(prediction);
    } catch (error) {
        console.error('Error saving prediction:', error);
    }
}

async function getHistoricalPredictions(days = 5) {
    try {
        const ref = database.ref('predictions');
        const snapshot = await ref.orderByChild('date').limitToLast(days).once('value');
        return snapshot.val() || {};
    } catch (error) {
        console.error('Error getting historical predictions:', error);
        return {};
    }
}

function initApp() {
    tg.expand();
    tg.enableClosingConfirmation();
}

async function checkSubscription() {
    const loading = document.getElementById('loading');
    const checkButton = document.getElementById('check-subscription-button');
    const navBottom = document.getElementById('nav-bottom');

    checkButton.disabled = true;
    loading.classList.remove('hidden');

    try {
        const userId = tg.initDataUnsafe?.user?.id;
        if (!userId) {
            throw new Error('ID utilisateur non trouvé');
        }

        const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getChatMember`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                chat_id: `@${CHANNEL_USERNAME}`,
                user_id: userId
            })
        });

        const data = await response.json();
        
        if (data.ok && data.result && data.result.status !== 'left') {
            loading.classList.add('hidden');
            checkButton.classList.add('verified');
            checkButton.innerHTML = '<i class="fas fa-check-circle"></i> Vérifié ✅';
            
            setTimeout(() => {
                document.querySelector('.subscription-box').remove();
                document.querySelector('.arguments-container').remove();
                navBottom.classList.remove('hidden');
                showMainApp();
            }, 1000);
        } else {
            throw new Error('Non abonné');
        }
    } catch (error) {
        console.error('Erreur:', error);
        loading.classList.add('hidden');
        checkButton.disabled = false;
        alert('Veuillez vous abonner au canal avant de continuer.');
    }
}

function showMainApp() {
    updateNavigation('home');
    document.getElementById('main').innerHTML = `
        <div class="header">
            <h1 class="header-title">Tableau de Bord</h1>
        </div>

        <div style="text-align: center; margin: 20px 0;">
            <button class="youtube-button" onclick="window.open('https://www.youtube.com/@alvecapital', '_blank');">
                <i class="fab fa-youtube"></i> Chaîne Alve Capital
            </button>
            <button class="youtube-button" onclick="window.open('https://www.youtube.com/@AlexVerol2', '_blank');">
                <i class="fab fa-youtube"></i> Chaîne Alex Verol
            </button>
            <p class="description">
                BetSmart Pro utilise des algorithmes avancés pour vous fournir des prédictions sportives précises et fiables.
            </p>
        </div>

        <div class="menu-grid">
            <div class="menu-card" onclick="showComboPage()">
                <div class="menu-icon">
                    <i class="fas fa-chart-line"></i>
                </div>
                <div class="menu-title">Combo du Jour</div>
            </div>

            <div class="menu-card" onclick="showTopScore()">
                <div class="menu-icon">
                    <i class="fas fa-trophy"></i>
                </div>
                <div class="menu-title">Top Score</div>
            </div>

            <div class="menu-card" onclick="showFavorites()">
                <div class="menu-icon">
                    <i class="fas fa-star"></i>
                </div>
                <div class="menu-title">Favoris</div>
            </div>

            <div class="menu-card" onclick="showHistory()">
                <div class="menu-icon">
                    <i class="fas fa-history"></i>
                </div>
                <div class="menu-title">Historique</div>
            </div>
        </div>
    `;
}

function showComboPage() {
    const sections = [
        { id: 'victoire', icon: '🏆', title: 'Victoire Directe' },
        { id: 'btts', icon: '⚽', title: 'Les 2 Équipes Marquent' },
        { id: 'double', icon: '🛡️', title: 'Double Chance' },
        { id: 'over', icon: '➕', title: 'Plus de 1.5 Buts' },
        { id: 'under', icon: '➖', title: 'Moins de 3.5 Buts' }
    ];

    document.getElementById('main').innerHTML = `
        <div class="header">
            <h1 class="header-title">Combo du Jour</h1>
        </div>

        ${sections.map(section => `
            <div class="prediction-section" onclick="showPredictionDetails('${section.id}')">
                <div class="prediction-type">
                    <div class="prediction-icon">${section.icon}</div>
                    <span>${section.title}</span>
                </div>
            </div>
        `).join('')}

        <button class="bottom-back-button" onclick="showMainApp()">
            <i class="fas fa-arrow-left"></i> Retour
        </button>
    `;
}

async function showPredictionDetails(type) {
    const matches = await getPredictionMatches(type);

    document.getElementById('main').innerHTML = `
        <div class="header">
            <h1 class="header-title">${getTypeTitle(type)}</h1>
        </div>

        ${matches.map(match => `
            <div class="prediction-section">
                <div class="match-league">${match.league}</div>
                <div class="match-details">
                    <div class="match-teams">${match.home} vs ${match.away}</div>
                    <div class="match-time">
                        <i class="far fa-clock"></i> ${match.time}
                    </div>
                    <div class="prediction-value">
                        ${match.prediction}
                        <span class="reliability-badge">${match.confidence}%</span>
                        <button class="favorite-btn ${isFavorite(match.id) ? 'active' : ''}" 
                                onclick="toggleFavorite('${match.id}')">
                            <i class="fas fa-star"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('')}

        <button class="bottom-back-button" onclick="showComboPage()">
            <i class="fas fa-arrow-left"></i> Retour
        </button>
    `;
}

async function showTopScore() {
    const matches = await getTopScoreMatches();

    document.getElementById('main').innerHTML = `
        <div class="header">
            <h1 class="header-title">Top Scores</h1>
        </div>

        ${matches.map(match => `
            <div class="top-score-match">
                <div class="match-league">${match.league}</div>
                <div class="match-teams">${match.home} vs ${match.away}</div>
                <div class="match-time">
                    <i class="far fa-clock"></i> ${match.time}
                </div>
                <div class="score-prediction">
                    ${match.predictions.join(' ou ')}
                    <span class="reliability-badge">${match.confidence}%</span>
                    <button class="favorite-btn ${isFavorite(match.id) ? 'active' : ''}" 
                            onclick="toggleFavorite('${match.id}')">
                        <i class="fas fa-star"></i>
                    </button>
                </div>
            </div>
        `).join('')}

        <button class="bottom-back-button" onclick="showMainApp()">
            <i class="fas fa-arrow-left"></i> Retour
        </button>
    `;
}

async function showVIP() {
    updateNavigation('vip');
    const combos = await getVIPCombos();

    document.getElementById('main').innerHTML = `
        <div class="header">
            <h1 class="header-title">Prédictions Premium</h1>
        </div>

        ${combos.map(combo => `
            <div class="vip-combo">
                <div class="vip-combo-header">
                    <div class="vip-combo-title">${combo.title}</div>
                </div>
                ${combo.matches.map(match => `
                    <div class="vip-match">
                        <div class="match-league">${match.league}</div>
                        <div class="match-teams">${match.teams}</div>
                        <div class="match-time">
                            <i class="far fa-clock"></i> ${match.time}
                        </div>
                        <div class="prediction-value">
                            ${match.prediction}
                            <span class="reliability-badge">${match.confidence}%</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `).join('')}

        <button class="bottom-back-button" onclick="showMainApp()">
            <i class="fas fa-arrow-left"></i> Retour
        </button>
    `;
}

function showFIFA() {
    updateNavigation('fifa');
    document.getElementById('main').innerHTML = `
        <div class="header">
            <h1 class="header-title">FIFA Prédictions</h1>
        </div>

        <div class="fifa-container">
            <div class="fifa-description">
                <h3>Intelligence Artificielle</h3>
                <p>Notre système d'analyse avancé utilise l'IA pour générer des prédictions précises basées sur vos données.</p>
            </div>

            <div class="fifa-option" onclick="startFIFAQuestions('classic')">
                <div class="menu-icon">
                    <i class="fas fa-futbol"></i>
                </div>
                <h3>FIFA Classique</h3>
                <p>Analyse complète pour match régulier</p>
            </div>
            
            <div class="fifa-option" onclick="startFIFAQuestions('penalty')">
                <div class="menu-icon">
                    <i class="fas fa-bullseye"></i>
                </div>
                <h3>FIFA Penalty</h3>
                <p>Analyse spécialisée pour les penaltys</p>
            </div>
        </div>

        <button class="bottom-back-button" style="margin-top: 40px;" onclick="showMainApp()">
            <i class="fas fa-arrow-left"></i> Retour
        </button>
    `;
}

async function showHistory() {
    const sections = [
        { id: 'combo', icon: 'chart-line', title: 'Combo du jour' },
        { id: 'topScore', icon: 'trophy', title: 'Top Scores' },
        { id: 'vip', icon: 'crown', title: 'VIP' }
    ];

    document.getElementById('main').innerHTML = `
        <div class="header">
            <h1 class="header-title">Historique</h1>
        </div>

        <div class="section-list">
            ${sections.map(section => `
                <div class="section-item" onclick="showHistorySection('${section.id}')">
                    <div class="section-icon">
                        <i class="fas fa-${section.icon}"></i>
                    </div>
                    <div class="section-details">
                        <div class="section-title">${section.title}</div>
                    </div>
                </div>
            `).join('')}
        </div>

        <button class="bottom-back-button" onclick="showMainApp()">
            <i class="fas fa-arrow-left"></i> Retour
        </button>
    `;
}

async function showHistorySection(type) {
    const dateStr = formatDate(currentHistoryDate);
    let content = '';

    if (type === 'topScore') {
        const predictions = await getHistoricalTopScores();
        content = Continuing the app.js file content exactly where it left off:

        content = predictions.map(pred => `
            <div class="prediction-section">
                <div class="match-league">${pred.league}</div>
                <div class="match-details">
                    <div class="match-teams">${pred.teams}</div>
                    <div class="match-time">${pred.time}</div>
                    <div class="prediction-value">
                        Score prédit: ${pred.predictions.join(' ou ')}
                        <span class="history-status status-${pred.status}">
                            ${pred.status === 'win' ? '✅ Gagné' : '❌ Perdu'}
                        </span>
                        <span class="reliability-badge">${pred.confidence}%</span>
                    </div>
                </div>
            </div>
        `).join('');
    } else if (type === 'vip') {
        const combos = await getHistoricalVIPCombos();
        content = combos.map(combo => `
            <div class="vip-combo">
                <div class="vip-combo-header">
                    <div class="vip-combo-title">${combo.title}</div>
                    <div class="combo-date">${formatDate(new Date(combo.date))}</div>
                </div>
                ${combo.matches.map(match => `
                    <div class="vip-match">
                        <div class="match-league">${match.league}</div>
                        <div class="match-teams">${match.teams}</div>
                        <div class="match-time">${match.time}</div>
                        <div class="prediction-value">
                            ${match.prediction}
                            <span class="history-status status-${match.status}">
                                ${match.status === 'win' ? '✅ Gagné' : '❌ Perdu'}
                            </span>
                            <span class="reliability-badge">${match.confidence}%</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `).join('');
    } else {
        const predictions = await getHistoricalComboPredictions();
        const sections = [
            { id: 'victoire', icon: '🏆', title: 'Victoire Directe' },
            { id: 'btts', icon: '⚽', title: 'Les 2 Équipes Marquent' },
            { id: 'double', icon: '🛡️', title: 'Double Chance' },
            { id: 'over', icon: '➕', title: 'Plus de 1.5 Buts' },
            { id: 'under', icon: '➖', title: 'Moins de 3.5 Buts' }
        ];

        content = sections.map(section => `
            <div class="prediction-section">
                <div class="prediction-type">
                    <div class="prediction-icon">${section.icon}</div>
                    <span>${section.title}</span>
                </div>
                ${predictions
                    .filter(pred => pred.type === section.id)
                    .map(pred => `
                        <div class="match-details">
                            <div class="match-league">${pred.league}</div>
                            <div class="match-teams">${pred.teams}</div>
                            <div class="match-time">${pred.time}</div>
                            <div class="prediction-value">
                                ${pred.prediction}
                                <span class="history-status status-${pred.status}">
                                    ${pred.status === 'win' ? '✅ Gagné' : '❌ Perdu'}
                                </span>
                                <span class="reliability-badge">${pred.confidence}%</span>
                            </div>
                        </div>
                    `).join('')}
            </div>
        `).join('');
    }

    document.getElementById('main').innerHTML = `
        <div class="header">
            <h1 class="header-title">Historique ${getTypeTitle(type)}</h1>
        </div>

        <div class="history-navigation">
            <button class="date-nav-btn" onclick="navigateHistory('prev')">
                <i class="fas fa-chevron-left"></i>
            </button>
            <span class="current-date">${dateStr}</span>
            <button class="date-nav-btn" onclick="navigateHistory('next')" 
                    ${isToday(currentHistoryDate) ? 'disabled' : ''}>
                <i class="fas fa-chevron-right"></i>
            </button>
        </div>

        ${content}

        <button class="bottom-back-button" onclick="showHistory()">
            <i class="fas fa-arrow-left"></i> Retour
        </button>
    `;
}

// Firebase data retrieval functions
async function getPredictionMatches(type) {
    try {
        const ref = database.ref(`predictions/${type}`);
        const snapshot = await ref.orderByChild('date').equalTo(formatDate(new Date())).once('value');
        return Object.values(snapshot.val() || {});
    } catch (error) {
        console.error('Error getting predictions:', error);
        return [];
    }
}

async function getTopScoreMatches() {
    try {
        const ref = database.ref('topScores');
        const snapshot = await ref.orderByChild('date').equalTo(formatDate(new Date())).once('value');
        return Object.values(snapshot.val() || {});
    } catch (error) {
        console.error('Error getting top scores:', error);
        return [];
    }
}

async function getVIPCombos() {
    try {
        const ref = database.ref('vipCombos');
        const snapshot = await ref.orderByChild('date').equalTo(formatDate(new Date())).once('value');
        return Object.values(snapshot.val() || {});
    } catch (error) {
        console.error('Error getting VIP combos:', error);
        return [];
    }
}

async function getHistoricalTopScores() {
    try {
        const ref = database.ref('topScores');
        const snapshot = await ref.orderByChild('date').equalTo(formatDate(currentHistoryDate)).once('value');
        return Object.values(snapshot.val() || {});
    } catch (error) {
        console.error('Error getting historical top scores:', error);
        return [];
    }
}

async function getHistoricalVIPCombos() {
    try {
        const ref = database.ref('vipCombos');
        const snapshot = await ref.orderByChild('date').equalTo(formatDate(currentHistoryDate)).once('value');
        return Object.values(snapshot.val() || {});
    } catch (error) {
        console.error('Error getting historical VIP combos:', error);
        return [];
    }
}

async function getHistoricalComboPredictions() {
    try {
        const ref = database.ref('predictions');
        const snapshot = await ref.orderByChild('date').equalTo(formatDate(currentHistoryDate)).once('value');
        return Object.values(snapshot.val() || {});
    } catch (error) {
        console.error('Error getting historical predictions:', error);
        return [];
    }
}

// Utility functions
function formatDate(date) {
    return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function isToday(date) {
    const today = new Date();
    return date.toDateString() === today.toDateString();
}

function getTypeTitle(type) {
    const titles = {
        victoire: 'Victoire Directe',
        btts: 'Les 2 Équipes Marquent',
        double: 'Double Chance',
        over: 'Plus de 1.5 Buts',
        under: 'Moins de 3.5 Buts',
        topScore: 'Top Scores',
        vip: 'VIP',
        combo: 'Combo du Jour'
    };
    return titles[type] || type;
}

function updateNavigation(section) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.getElementById(`nav-${section}`).classList.add('active');
}

function toggleFavorite(id) {
    const index = favorites.indexOf(id);
    if (index === -1) {
        favorites.push(id);
    } else {
        favorites.splice(index, 1);
    }
    localStorage.setItem('favorites', JSON.stringify(favorites));
    
    const button = event.currentTarget;
    button.classList.toggle('active');
}

function isFavorite(id) {
    return favorites.includes(id);
}

document.addEventListener('DOMContentLoaded', initApp);
