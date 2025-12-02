// leaflet-map.js - Simplified Leaflet Integration (No Save Feature)

class CityMap {
    constructor() {
        this.map = null;
        this.baseLayers = {};
        this.zoneLayers = {};
        this.currentLocation = [33.4484, -112.0740]; // Phoenix, AZ
        this.isDrawing = false;
        
        this.zoneColors = {
            residential: '#FF6B6B',
            commercial: '#4ECDC4',
            industrial: '#45B7D1',
            'green-space': '#96CEB4',
            'mixed-use': '#FFEAA7'
        };
        
        this.init();
    }
    
    init() {
        // Initialize map
        this.map = L.map('map-container').setView(this.currentLocation, 13);
        
        // Add base map layer
        this.baseLayers.standard = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(this.map);
        
        // Initialize zone layers
        this.initZoneLayers();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Show coordinates
        this.map.on('mousemove', this.showCoordinates.bind(this));
        
        // Add click handler for zones
        this.map.on('click', this.handleMapClick.bind(this));
    }
    
    initZoneLayers() {
        // Create layer groups for each zone type
        this.zoneLayers = {
            residential: L.layerGroup(),
            commercial: L.layerGroup(),
            industrial: L.layerGroup(),
            'green-space': L.layerGroup(),
            'mixed-use': L.layerGroup()
        };
        
        // Add all zone layers to map
        Object.values(this.zoneLayers).forEach(layer => {
            this.map.addLayer(layer);
        });
    }
    
    setupEventListeners() {
        // Satellite toggle
        const satelliteBtn = document.getElementById('satellite-toggle');
        if (satelliteBtn) {
            satelliteBtn.addEventListener('click', () => {
                this.toggleSatelliteView();
            });
        }
        
        // Draw mode toggle
        const drawBtn = document.getElementById('draw-mode');
        if (drawBtn) {
            drawBtn.addEventListener('click', () => {
                this.toggleDrawMode();
            });
        }
        
        // Clear map button
        const clearBtn = document.getElementById('clear-map');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearAllZones();
            });
        }
        
        // Measure distance button
        const measureBtn = document.getElementById('measure-distance');
        if (measureBtn) {
            measureBtn.addEventListener('click', () => {
                this.startMeasurement();
            });
        }
        
        // Layer visibility checkboxes
        const layerControls = document.querySelectorAll('.map-layer-control input');
        layerControls.forEach(control => {
            control.addEventListener('change', (e) => {
                const zoneType = e.target.id.replace('layer-', '');
                this.toggleLayerVisibility(zoneType, e.target.checked);
            });
        });
    }
    
    toggleSatelliteView() {
        const satelliteBtn = document.getElementById('satellite-toggle');
        
        if (!this.baseLayers.satellite) {
            // Create satellite layer if it doesn't exist
            this.baseLayers.satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: 'Tiles © Esri',
                maxZoom: 19
            });
        }
        
        const isSatellite = this.map.hasLayer(this.baseLayers.satellite);
        
        if (isSatellite) {
            // Switch to standard view
            this.map.removeLayer(this.baseLayers.satellite);
            this.map.addLayer(this.baseLayers.standard);
            satelliteBtn.textContent = 'Satellite View';
            satelliteBtn.classList.remove('active');
        } else {
            // Switch to satellite view
            this.map.removeLayer(this.baseLayers.standard);
            this.map.addLayer(this.baseLayers.satellite);
            satelliteBtn.textContent = 'Standard View';
            satelliteBtn.classList.add('active');
        }
    }
    
    toggleDrawMode() {
        this.isDrawing = !this.isDrawing;
        const drawBtn = document.getElementById('draw-mode');
        
        if (this.isDrawing) {
            // Enable drawing mode
            drawBtn.textContent = 'Stop Drawing';
            drawBtn.classList.add('active');
            this.enableDrawMode();
        } else {
            // Disable drawing mode
            drawBtn.textContent = 'Draw Zones';
            drawBtn.classList.remove('active');
            this.disableDrawMode();
        }
    }
    
    enableDrawMode() {
        // Visual feedback
        document.getElementById('map-container').classList.add('drawing-mode');
        
        // Update status
        this.updateStatus('Click on map to place zones. Current zone: ' + 
                         this.getZoneName(cityState.currentZone));
    }
    
    disableDrawMode() {
        // Remove visual feedback
        document.getElementById('map-container').classList.remove('drawing-mode');
        
        // Update status
        this.updateStatus('Click "Draw Zones" to start placing zones on map.');
    }
    
    handleMapClick(e) {
        if (this.isDrawing && cityState.currentZone) {
            this.addZoneToMap(e.latlng, cityState.currentZone);
            this.updateCityMetrics();
        }
    }
    
    addZoneToMap(latlng, zoneType) {
        // Create a circle marker
        const zoneMarker = L.circleMarker(latlng, {
            radius: 80, // 80 pixels radius
            color: this.zoneColors[zoneType],
            fillColor: this.zoneColors[zoneType],
            fillOpacity: 0.7,
            weight: 2
        });
        
        // Add popup with info
        zoneMarker.bindPopup(`
            <div class="map-popup">
                <h4>${this.getZoneName(zoneType)} Zone</h4>
                <p>Lat: ${latlng.lat.toFixed(4)}</p>
                <p>Lng: ${latlng.lng.toFixed(4)}</p>
                <button class="remove-zone-btn" onclick="cityMap.removeZoneFromMap(${latlng.lat}, ${latlng.lng})">
                    Remove Zone
                </button>
            </div>
        `);
        
        // Store zone type in marker data
        zoneMarker.zoneType = zoneType;
        
        // Add to appropriate layer
        this.zoneLayers[zoneType].addLayer(zoneMarker);
        
        // Visual feedback
        zoneMarker.addTo(this.map);
        zoneMarker.openPopup();
        
        // Update zone count in city state
        this.updateZoneCount();
        
        // Animation
        zoneMarker.setStyle({
            radius: 100
        });
        setTimeout(() => {
            zoneMarker.setStyle({
                radius: 80
            });
        }, 300);
    }
    
    removeZoneFromMap(lat, lng) {
        // Find and remove marker at coordinates
        Object.values(this.zoneLayers).forEach(layer => {
            layer.eachLayer((marker) => {
                if (marker.getLatLng().lat === lat && marker.getLatLng().lng === lng) {
                    layer.removeLayer(marker);
                    this.updateZoneCount();
                    this.updateCityMetrics();
                }
            });
        });
    }
    
    clearAllZones() {
        if (confirm('Clear all zones from the map?')) {
            Object.values(this.zoneLayers).forEach(layer => {
                layer.clearLayers();
            });
            this.updateZoneCount();
            this.updateCityMetrics();
            this.updateStatus('All zones cleared from map.');
        }
    }
    
    toggleLayerVisibility(zoneType, isVisible) {
        if (isVisible) {
            this.map.addLayer(this.zoneLayers[zoneType]);
        } else {
            this.map.removeLayer(this.zoneLayers[zoneType]);
        }
    }
    
    startMeasurement() {
        this.isDrawing = false; // Exit draw mode if active
        
        // Simple distance measurement between two points
        let points = [];
        let line = null;
        let totalDistance = 0;
        
        const measureBtn = document.getElementById('measure-distance');
        measureBtn.textContent = 'Click two points on map';
        measureBtn.classList.add('measuring');
        
        const clickHandler = (e) => {
            points.push(e.latlng);
            
            if (points.length === 1) {
                // First point
                L.marker(e.latlng).addTo(this.map)
                    .bindPopup('Start point')
                    .openPopup();
            } else if (points.length === 2) {
                // Second point - draw line and calculate distance
                L.marker(e.latlng).addTo(this.map)
                    .bindPopup('End point')
                    .openPopup();
                
                // Draw line between points
                line = L.polyline(points, {
                    color: 'red',
                    weight: 3,
                    dashArray: '10, 10'
                }).addTo(this.map);
                
                // Calculate distance in meters
                totalDistance = this.map.distance(points[0], points[1]);
                
                // Show distance
                const midpoint = this.getMidpoint(points[0], points[1]);
                L.popup()
                    .setLatLng(midpoint)
                    .setContent(`Distance: ${totalDistance.toFixed(0)} meters<br>(${(totalDistance/1000).toFixed(2)} km)`)
                    .openOn(this.map);
                
                // Clean up
                this.map.off('click', clickHandler);
                measureBtn.textContent = 'Measure Distance';
                measureBtn.classList.remove('measuring');
                
                // Auto-remove after 5 seconds
                setTimeout(() => {
                    this.map.eachLayer((layer) => {
                        if (layer === line || 
                            (layer instanceof L.Marker && 
                             (layer.getLatLng().equals(points[0]) || 
                              layer.getLatLng().equals(points[1])))) {
                            this.map.removeLayer(layer);
                        }
                    });
                }, 5000);
            }
        };
        
        this.map.on('click', clickHandler);
    }
    
    getMidpoint(latlng1, latlng2) {
        return [
            (latlng1.lat + latlng2.lat) / 2,
            (latlng1.lng + latlng2.lng) / 2
        ];
    }
    
    showCoordinates(e) {
        const coordsElement = document.getElementById('coordinates');
        if (coordsElement) {
            coordsElement.textContent = 
                `Lat: ${e.latlng.lat.toFixed(4)}, Lng: ${e.latlng.lng.toFixed(4)}`;
        }
    }
    
    updateZoneCount() {
        // Count zones by type
        const zoneCounts = {};
        Object.keys(this.zoneLayers).forEach(zoneType => {
            zoneCounts[zoneType] = 0;
            this.zoneLayers[zoneType].eachLayer(() => {
                zoneCounts[zoneType]++;
            });
        });
        
        // Update display if element exists
        const zoneCountElement = document.getElementById('zone-count');
        if (zoneCountElement) {
            zoneCountElement.innerHTML = Object.entries(zoneCounts)
                .map(([type, count]) => `${this.getZoneName(type)}: ${count}`)
                .join('<br>');
        }
        
        return zoneCounts;
    }
    
    updateCityMetrics() {
        // Update city metrics based on map zones
        if (typeof updateCityMetrics === 'function') {
            updateCityMetrics();
        }
        
        // Also update zone count in the grid view
        this.updateZoneCount();
    }
    
    updateStatus(message) {
        const statusElement = document.getElementById('map-status');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.classList.add('active');
            setTimeout(() => {
                statusElement.classList.remove('active');
            }, 3000);
        }
    }
    
    getZoneName(zoneType) {
        const names = {
            'residential': 'Residential',
            'commercial': 'Commercial',
            'industrial': 'Industrial',
            'green-space': 'Green Space',
            'mixed-use': 'Mixed Use'
        };
        return names[zoneType] || zoneType;
    }
}

// Initialize map when page loads
let cityMap;

document.addEventListener('DOMContentLoaded', () => {
    // Initialize map when map page is shown
    const mapPage = document.getElementById('map-page');
    if (mapPage && mapPage.style.display !== 'none') {
        cityMap = new CityMap();
    }
    
    // Navigation to map page
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const page = e.target.dataset.page;
            if (page === 'map') {
                // Show map page
                document.getElementById('page-content').style.display = 'none';
                document.getElementById('map-page').style.display = 'block';
                
                // Initialize map if not already done
                if (!cityMap) {
                    cityMap = new CityMap();
                }
            }
        });
    });
});
window.cityMap = cityMap;
