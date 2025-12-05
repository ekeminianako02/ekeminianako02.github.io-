const cityState = {
    currentZone: 'residential',
    grid: Array(25).fill('empty'),
    metrics: { population: 0, zoningScore: 0, sustainability: 0, employment: 0, traffic: 50 }
};

let cityMap = null;
let zoneChart = null;
let metricChart = null;

document.addEventListener('DOMContentLoaded', function() {
    generateGrid('dashboard-grid');
    generateGrid('planner-grid');
    setupNavigation();
    setupZoneButtons();
    setupActions();
    updateCityMetrics();
    const zonePreview = document.getElementById('current-zone-preview');
    if (zonePreview) zonePreview.className = 'zone-preview residential';
    updateAnalytics();
});

function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            navButtons.forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            this.classList.add('active');
            const pageId = this.dataset.page;
            const page = document.getElementById(`${pageId}-page`);
            if (page) page.classList.add('active');
            if (pageId === 'map' && !cityMap) cityMap = new CityMap();
        });
    });
}

function generateGrid(gridId) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    grid.innerHTML = '';
    for (let i = 0; i < 25; i++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell empty';
        cell.dataset.index = i;
        if (gridId === 'planner-grid') cell.addEventListener('click', () => handleCellClick(cell));
        grid.appendChild(cell);
    }
}

function handleCellClick(cell) {
    const index = cell.dataset.index;
    if (cityState.currentZone === cell.dataset.zone) {
        cell.className = 'grid-cell empty';
        cell.dataset.zone = 'empty';
        cityState.grid[index] = 'empty';
    } else {
        cell.className = `grid-cell ${cityState.currentZone}`;
        cell.dataset.zone = cityState.currentZone;
        cityState.grid[index] = cityState.currentZone;
    }
    updateCityMetrics();
}

function setupZoneButtons() {
    document.querySelectorAll('.zone-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.zone-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            cityState.currentZone = this.dataset.zone;
            const zoneName = document.getElementById('current-zone-name');
            const zonePreview = document.getElementById('current-zone-preview');
            if (zoneName) zoneName.textContent = this.dataset.zone.charAt(0).toUpperCase() + this.dataset.zone.slice(1);
            if (zonePreview) {
                zonePreview.className = 'zone-preview';
                zonePreview.classList.add(this.dataset.zone);
            }
        });
    });
}

function updateCityMetrics() {
    const zones = { res: 0, com: 0, ind: 0, green: 0, mix: 0, empty: 0 };
    cityState.grid.forEach(z => zones[z === 'green-space' ? 'green' : z === 'mixed-use' ? 'mix' : z.substring(0,3)]++);
    const filled = 25 - zones.empty;
    cityState.metrics.population = zones.res * 1000 + zones.mix * 500;
    cityState.metrics.zoningScore = Math.min(50 + zones.green * 10 + filled * 2, 100);
    cityState.metrics.sustainability = Math.min(30 + zones.green * 15, 100);
    cityState.metrics.employment = zones.com * 50 + zones.ind * 75;
    cityState.metrics.traffic = Math.max(10, Math.min(100, 50 + zones.ind * 5 - zones.green * 2));
    updateMetricsDisplay();
    updateAnalytics();
}

function updateMetricsDisplay() {
    const m = cityState.metrics;
    document.getElementById('population').textContent = m.population.toLocaleString();
    document.getElementById('zoning-score').textContent = Math.round(m.zoningScore) + '%';
    document.getElementById('sustainability').textContent = Math.round(m.sustainability) + '%';
    document.getElementById('employment').textContent = m.employment.toLocaleString();
    document.getElementById('traffic').textContent = Math.round(m.traffic) + '%';
}

function setupActions() {
    document.getElementById('quick-reset')?.addEventListener('click', () => {
        if (confirm('Reset city?')) {
            cityState.grid = Array(25).fill('empty');
            generateGrid('planner-grid');
            updateCityMetrics();
        }
    });
    document.getElementById('plan-reset')?.addEventListener('click', () => {
        if (confirm('Clear planner?')) {
            cityState.grid = Array(25).fill('empty');
            generateGrid('planner-grid');
            updateCityMetrics();
        }
    });
    document.getElementById('plan-fill')?.addEventListener('click', () => {
        const types = ['residential', 'commercial', 'industrial', 'green-space', 'mixed-use'];
        cityState.grid = cityState.grid.map(() => Math.random() > 0.3 ? types[Math.floor(Math.random() * 5)] : 'empty');
        const cells = document.querySelectorAll('#planner-grid .grid-cell');
        cells.forEach((cell, i) => {
            if (cityState.grid[i] !== 'empty') {
                cell.className = `grid-cell ${cityState.grid[i]}`;
                cell.dataset.zone = cityState.grid[i];
            } else {
                cell.className = 'grid-cell empty';
                cell.dataset.zone = 'empty';
            }
        });
        updateCityMetrics();
    });
}

class CityMap {
    constructor() {
        this.map = L.map('map-container').setView([33.4484, -112.0740], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);
        this.zoneLayers = {
            residential: L.layerGroup().addTo(this.map),
            commercial: L.layerGroup().addTo(this.map),
            industrial: L.layerGroup().addTo(this.map),
            'green-space': L.layerGroup().addTo(this.map),
            'mixed-use': L.layerGroup().addTo(this.map)
        };
        this.setupMapEvents();
    }

    setupMapEvents() {
        document.getElementById('satellite-toggle')?.addEventListener('click', () => this.toggleSatellite());
        document.getElementById('draw-mode')?.addEventListener('click', () => this.toggleDraw());
        document.getElementById('clear-map')?.addEventListener('click', () => this.clearZones());
        this.map.on('click', (e) => {
            if (this.isDrawing) this.addZone(e.latlng);
        });
    }

    toggleSatellite() {
        const btn = document.getElementById('satellite-toggle');
        if (!this.satelliteLayer) {
            this.satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}');
        }
        if (this.map.hasLayer(this.satelliteLayer)) {
            this.map.removeLayer(this.satelliteLayer);
            btn.textContent = 'Satellite View';
        } else {
            this.map.addLayer(this.satelliteLayer);
            btn.textContent = 'Standard View';
        }
    }

    toggleDraw() {
        this.isDrawing = !this.isDrawing;
        const btn = document.getElementById('draw-mode');
        btn.textContent = this.isDrawing ? 'Stop Drawing' : 'Draw Zones';
    }

    addZone(latlng) {
        const marker = L.circleMarker(latlng, {
            radius: 80,
            fillColor: getComputedStyle(document.documentElement).getPropertyValue(`--${cityState.currentZone}`).trim(),
            fillOpacity: 0.7,
            weight: 2
        }).addTo(this.zoneLayers[cityState.currentZone]);
        marker.bindPopup(`<div>${cityState.currentZone} Zone</div>`);
        marker.openPopup();
    }

    clearZones() {
        if (confirm('Clear all zones?')) {
            Object.values(this.zoneLayers).forEach(layer => layer.clearLayers());
        }
    }
}

function getZoneCounts() {
    const counts = {
        residential: 0,
        commercial: 0,
        industrial: 0,
        "green-space": 0,
        "mixed-use": 0,
        empty: 0
    };
    cityState.grid.forEach(z => counts[z] = (counts[z] || 0) + 1);
    return counts;
}

function updateStatistics(counts) {
    const filled = 25 - counts.empty;
    const efficiency = Math.round((filled / 25) * 100);
    document.getElementById("total-zones").textContent = filled;
    document.getElementById("empty-spaces").textContent = counts.empty;
    document.getElementById("zone-efficiency").textContent = efficiency + "%";
    document.getElementById("city-density").textContent =
        filled < 8 ? "Low" : filled < 18 ? "Medium" : "High";
}

function updateZoneChart(counts) {
    const ctx = document.getElementById("zone-chart").getContext("2d");
    if (zoneChart) zoneChart.destroy();
    zoneChart = new Chart(ctx, {
        type: "pie",
        data: {
            labels: ["Residential", "Commercial", "Industrial", "Green Space", "Mixed Use"],
            datasets: [{
                data: [
                    counts['residential'],
                    counts['commercial'],
                    counts['industrial'],
                    counts['green-space'],
                    counts['mixed-use']
                ]
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function updateMetricChart() {
    const m = cityState.metrics;
    const ctx = document.getElementById("metric-chart").getContext("2d");
    if (metricChart) metricChart.destroy();
    metricChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: ["Population", "Zoning Score", "Sustainability", "Employment", "Traffic"],
            datasets: [{
                data: [
                    m.population,
                    m.zoningScore,
                    m.sustainability,
                    m.employment,
                    m.traffic
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true } }
        }
    });
}

function updateAnalytics() {
    const counts = getZoneCounts();
    updateStatistics(counts);
    updateZoneChart(counts);
    updateMetricChart();
}

window.cityMap = cityMap;

