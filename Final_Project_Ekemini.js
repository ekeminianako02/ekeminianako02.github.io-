
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
        
        this.map = L.map('map-container').setView(this.currentLocation, 13);
        
       
        this.baseLayers.standard = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(this.map);
        
       
        this.initZoneLayers();
        
        this.setupEventListeners();
        
       
        this.map.on('mousemove', this.showCoordinates.bind(this));
        
        
        this.map.on('click', this.handleMapClick.bind(this));
    }
    
    initZoneLayers() {
        
        this.zoneLayers = {
            residential: L.layerGroup(),
            commercial: L.layerGroup(),
            industrial: L.layerGroup(),
            'green-space': L.layerGroup(),
            'mixed-use': L.layerGroup()
        };
        
        
        Object.values(this.zoneLayers).forEach(layer => {
            this.map.addLayer(layer);
        });
    }
    
    setupEventListeners() {
       
        const satelliteBtn = document.getElementById('satellite-toggle');
        if (satelliteBtn) {
            satelliteBtn.addEventListener('click', () => {
                this.toggleSatelliteView();
            });
        }
        
       
        const drawBtn = document.getElementById('draw-mode');
        if (drawBtn) {
            drawBtn.addEventListener('click', () => {
                this.toggleDrawMode();
            });
        }
        
       
        const clearBtn = document.getElementById('clear-map');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearAllZones();
            });
        }
        
        
        const measureBtn = document.getElementById('measure-distance');
        if (measureBtn) {
            measureBtn.addEventListener('click', () => {
                this.startMeasurement();
            });
        }
        
       
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
           
            this.baseLayers.satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: 'Tiles © Esri',
                maxZoom: 19
            });
        }
        
        const isSatellite = this.map.hasLayer(this.baseLayers.satellite);
        
        if (isSatellite) {
           
            this.map.removeLayer(this.baseLayers.satellite);
            this.map.addLayer(this.baseLayers.standard);
            satelliteBtn.textContent = 'Satellite View';
            satelliteBtn.classList.remove('active');
        } else {
           
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
       
        document.getElementById('map-container').classList.add('drawing-mode');
        
      
        this.updateStatus('Click on map to place zones. Current zone: ' + 
                         this.getZoneName(cityState.currentZone));
    }
    
    disableDrawMode() {
       
        document.getElementById('map-container').classList.remove('drawing-mode');
        
       
        this.updateStatus('Click "Draw Zones" to start placing zones on map.');
    }
    
    handleMapClick(e) {
        if (this.isDrawing && cityState.currentZone) {
            this.addZoneToMap(e.latlng, cityState.currentZone);
            this.updateCityMetrics();
        }
    }
    
    addZoneToMap(latlng, zoneType) {
        
        const zoneMarker = L.circleMarker(latlng, {
            radius: 80, // 80 pixels radius
            color: this.zoneColors[zoneType],
            fillColor: this.zoneColors[zoneType],
            fillOpacity: 0.7,
            weight: 2
        });
        
        
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
        
       
        zoneMarker.zoneType = zoneType;
        
        this.zoneLayers[zoneType].addLayer(zoneMarker);
        
       
        zoneMarker.addTo(this.map);
        zoneMarker.openPopup();
        
        
        this.updateZoneCount();
        
       
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
        this.isDrawing = false; 
        
       
        let points = [];
        let line = null;
        let totalDistance = 0;
        
        const measureBtn = document.getElementById('measure-distance');
        measureBtn.textContent = 'Click two points on map';
        measureBtn.classList.add('measuring');
        
        const clickHandler = (e) => {
            points.push(e.latlng);
            
            if (points.length === 1) {
                
                L.marker(e.latlng).addTo(this.map)
                    .bindPopup('Start point')
                    .openPopup();
            } else if (points.length === 2) {
               
                L.marker(e.latlng).addTo(this.map)
                    .bindPopup('End point')
                    .openPopup();
                
                
                line = L.polyline(points, {
                    color: 'red',
                    weight: 3,
                    dashArray: '10, 10'
                }).addTo(this.map);
                
                
                totalDistance = this.map.distance(points[0], points[1]);
                
                
                const midpoint = this.getMidpoint(points[0], points[1]);
                L.popup()
                    .setLatLng(midpoint)
                    .setContent(`Distance: ${totalDistance.toFixed(0)} meters<br>(${(totalDistance/1000).toFixed(2)} km)`)
                    .openOn(this.map);
                
                
                this.map.off('click', clickHandler);
                measureBtn.textContent = 'Measure Distance';
                measureBtn.classList.remove('measuring');
                
                
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
      
        const zoneCounts = {};
        Object.keys(this.zoneLayers).forEach(zoneType => {
            zoneCounts[zoneType] = 0;
            this.zoneLayers[zoneType].eachLayer(() => {
                zoneCounts[zoneType]++;
            });
        });
        
       
        const zoneCountElement = document.getElementById('zone-count');
        if (zoneCountElement) {
            zoneCountElement.innerHTML = Object.entries(zoneCounts)
                .map(([type, count]) => `${this.getZoneName(type)}: ${count}`)
                .join('<br>');
        }
        
        return zoneCounts;
    }
    
    updateCityMetrics() {
       
        if (typeof updateCityMetrics === 'function') {
            updateCityMetrics();
        }
        
       
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


let cityMap;

document.addEventListener('DOMContentLoaded', () => {

    const mapPage = document.getElementById('map-page');
    if (mapPage && mapPage.style.display !== 'none') {
        cityMap = new CityMap();
    }
    

    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const page = e.target.dataset.page;
            if (page === 'map') {
                // Show map page
                document.getElementById('page-content').style.display = 'none';
                document.getElementById('map-page').style.display = 'block';
                
               
                if (!cityMap) {
                    cityMap = new CityMap();
                }
            }
        });
    });
});
window.cityMap = cityMap;
