import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import * as L from 'leaflet';

interface Issue {
  id: string;
  title: string;
  category: string;
  urgency: number;
  lat: number;
  lng: number;
}

interface NearbyResponse {
  success: boolean;
  data: Issue[];
  meta: {
    count: number;
    lat: number;
    lng: number;
    radius: number;
  };
}

const SEARCH_RADIUS_METERS = 20000;

@Component({
  selector: 'app-map-placeholder',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="map-container">
      <div class="map-header">
        <h2>Issues Near You</h2>
        <button *ngIf="showCloseButton" class="close-btn" (click)="onClose()" title="Close map">×</button>
      </div>

      <div class="map-status">
        <ng-container *ngIf="loading">
          <div class="loading">
            <div class="spinner"></div>
            <p>Loading nearby issues...</p>
          </div>
        </ng-container>

        <ng-container *ngIf="error && !loading">
          <div class="error-message">
            <p>{{ error }}</p>
            <button (click)="retryFetch()">Retry</button>
          </div>
        </ng-container>

        <ng-container *ngIf="!loading && !error">
          <div class="info-box">
            <p>{{ statusMessage || ('Found ' + issueCount + ' issues within 20km') }}</p>
          </div>
        </ng-container>
      </div>

      <div *ngIf="mapReady && !loading" #mapElement id="map-container" class="map"></div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .map-container {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      background: #fff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .map-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      background: #f5f5f5;
      border-bottom: 1px solid #e0e0e0;
    }

    .map-header h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #333;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 28px;
      cursor: pointer;
      color: #666;
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: all 0.2s;
    }

    .close-btn:hover {
      background: rgba(0, 0, 0, 0.05);
      color: #000;
    }

    .map-status {
      padding: 12px 16px;
      background: #fafafa;
    }

    .loading {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px;
    }

    .spinner {
      width: 20px;
      height: 20px;
      border: 3px solid #e0e0e0;
      border-top-color: #007bff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .loading p {
      margin: 0;
      color: #666;
      font-size: 14px;
    }

    .error-message {
      background: #fee;
      border: 1px solid #fcc;
      border-radius: 4px;
      padding: 12px;
      color: #c33;
      font-size: 14px;
    }

    .error-message p {
      margin: 0 0 8px 0;
    }

    .error-message button {
      background: #c33;
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    }

    .error-message button:hover {
      background: #a22;
    }

    .info-box {
      background: #e7f3ff;
      border: 1px solid #b3d9ff;
      border-radius: 4px;
      padding: 8px 12px;
      color: #0c5aa0;
      font-size: 14px;
    }

    .info-box p {
      margin: 0;
    }

    .map {
      flex: 1;
      background: #e5e3df;
      width: 100%;
      height: 500px;
    }

    :global(.leaflet-popup-content) {
      font-size: 14px;
      margin: 0;
    }

    :global(.leaflet-popup-content-wrapper) {
      border-radius: 4px;
    }
  `]
})
export class MapPlaceholderComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapElement') mapElement!: ElementRef;
  @Input() showCloseButton = true;
  @Output() closed = new EventEmitter<void>();

  private map: L.Map | null = null;
  private userMarker: L.Marker | null = null;
  private issueMarkers: L.Marker[] = [];
  private userLocation: { lat: number; lng: number } = { lat: 17.6868, lng: 83.2185 };

  loading = true;
  mapReady = false;
  error: string | null = null;
  issueCount = 0;
  statusMessage = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.getUserLocation();
  }

  ngAfterViewInit(): void {
    // Map will be initialized after user location is determined
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  private getUserLocation(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          this.prepareMapAndLoadIssues();
        },
        (error) => {
          console.warn('Geolocation denied, using default location:', error);
          this.prepareMapAndLoadIssues();
        }
      );
    } else {
      console.warn('Geolocation not supported, using default location');
      this.prepareMapAndLoadIssues();
    }
  }

  private prepareMapAndLoadIssues(): void {
    this.loading = false;
    this.mapReady = true;

    setTimeout(() => {
      this.initMap();
      this.fetchNearbyIssues();
    }, 0);
  }

  private initMap(): void {
    if (this.map) {
      return; // Already initialized
    }

    // Wait for map element to be rendered
    setTimeout(() => {
      if (!this.mapElement) {
        return;
      }

      this.map = L.map(this.mapElement.nativeElement).setView(
        [this.userLocation.lat, this.userLocation.lng],
        10
      );

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(this.map);

      // Add user marker (blue)
      const userIcon = L.divIcon({
        className: 'user-marker',
        html: `<div style="
          width: 30px;
          height: 30px;
          background: #007bff;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        "></div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      this.userMarker = L.marker([this.userLocation.lat, this.userLocation.lng], {
        icon: userIcon
      })
        .addTo(this.map)
        .bindPopup('<b>Your Location</b>');

      const searchArea = L.circle([this.userLocation.lat, this.userLocation.lng], {
        radius: SEARCH_RADIUS_METERS,
        color: '#f97316',
        weight: 2,
        opacity: 0.75,
        fillColor: '#f97316',
        fillOpacity: 0.08
      }).addTo(this.map);

      this.map.fitBounds(searchArea.getBounds(), {
        padding: [12, 12]
      });

      this.map.setMaxBounds(searchArea.getBounds().pad(0.15));

      setTimeout(() => {
        this.map?.invalidateSize();
      }, 0);
    }, 0);
  }

  private fetchNearbyIssues(): void {
    this.error = null;
    this.statusMessage = '';

    const url = `${environment.api.url}/api/v1/issues/nearby?lat=${this.userLocation.lat}&lng=${this.userLocation.lng}&radius=${SEARCH_RADIUS_METERS}`;

    this.http.get<NearbyResponse>(url).subscribe(
      (response) => {
        if (response.success) {
          if (response.data.length > 0) {
            this.issueCount = response.data.length;
            this.statusMessage = `Found ${response.data.length} issues within 20km`;
            this.addIssueMarkers(response.data);
          } else {
            const mockIssues = this.buildMockIssues();
            this.issueCount = mockIssues.length;
            this.statusMessage = 'No issues found in your area. Showing demo issues nearby.';
            this.addIssueMarkers(mockIssues);
          }
        } else {
          this.error = 'Failed to fetch issues';
        }
        this.loading = false;
      },
      (error) => {
        console.error('Error fetching nearby issues:', error);
        this.error = error.message || 'Failed to load nearby issues';
        this.loading = false;
      }
    );
  }

  private buildMockIssues(): Issue[] {
    const baseLat = this.userLocation.lat;
    const baseLng = this.userLocation.lng;

    return [
      {
        id: 'demo-1',
        title: 'Road pothole near main junction',
        category: 'OTHER',
        urgency: 3,
        lat: baseLat + 0.018,
        lng: baseLng + 0.014
      },
      {
        id: 'demo-2',
        title: 'Streetlight not working',
        category: 'ENVIRONMENT',
        urgency: 2,
        lat: baseLat - 0.012,
        lng: baseLng + 0.021
      },
      {
        id: 'demo-3',
        title: 'Waterlogging reported after rain',
        category: 'SANITATION',
        urgency: 4,
        lat: baseLat + 0.009,
        lng: baseLng - 0.016
      }
    ];
  }

  private addIssueMarkers(issues: Issue[]): void {
    if (!this.map) {
      return;
    }

    // Clear old markers
    this.issueMarkers.forEach((marker) => this.map?.removeLayer(marker));
    this.issueMarkers = [];

    // Add new markers
    issues.forEach((issue) => {
      const issueIcon = L.divIcon({
        className: 'issue-marker',
        html: `<div style="
          width: 25px;
          height: 25px;
          background: #dc3545;
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 12px;
          font-weight: bold;
        ">!</div>`,
        iconSize: [25, 25],
        iconAnchor: [12, 12]
      });

      const marker = L.marker([issue.lat, issue.lng], { icon: issueIcon }).addTo(
        this.map!
      );

      const popupContent = `
        <div style="max-width: 200px;">
          <b>${issue.title}</b><br/>
          <small>
            Category: <strong>${issue.category}</strong><br/>
            Urgency: <strong>${issue.urgency}/5</strong>
          </small>
        </div>
      `;

      marker.bindPopup(popupContent);
      this.issueMarkers.push(marker);
    });
  }

  retryFetch(): void {
    this.fetchNearbyIssues();
  }

  onClose(): void {
    if (this.closed.observed) {
      this.closed.emit();
      return;
    }

    // Fallback when used as a standalone route.
    window.history.back();
  }
}
