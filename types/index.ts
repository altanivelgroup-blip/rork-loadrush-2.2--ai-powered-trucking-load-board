export type UserRole = 'driver' | 'shipper' | 'admin';

export type LoadStatus = 'posted' | 'matched' | 'in_transit' | 'delivered' | 'cancelled';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  createdAt: string;
  profile: DriverProfile | ShipperProfile | AdminProfile;
}

export interface DriverProfile {
  firstName: string;
  lastName: string;
  phone: string;
  dotNumber: string;
  mcNumber: string;
  truckInfo: {
    make: string;
    model: string;
    year: number;
    vin: string;
    mpg: number;
    fuelType?: string;
    photoUrl?: string;
  };
  trailerInfo: {
    type: string;
    length: number;
    capacity: number;
    photoUrl?: string;
  };
  equipment: string[];
  wallet: number;
  documents: {
    cdl?: string;
    insurance?: string;
    permits?: string[];
  };
  maintenanceRecords: MaintenanceRecord[];
}

export interface MaintenanceRecord {
  id: string;
  date: string;
  mileage: number;
  type: string;
  description: string;
  cost: number;
  nextServiceMileage?: number;
  nextServiceDate?: string;
}

export interface ShipperProfile {
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  paymentMethod: string;
  creditLimit: number;
}

export interface AdminProfile {
  name: string;
  permissions: string[];
}

export interface LoadAnalytics {
  miles: number;
  mpg: number;
  fuelType: string;
  fuelPrice: number;
  gallonsNeeded: string;
  fuelCost: string;
  gross: number;
  netProfit: string;
  profitPerMile: string;
  eta: string;
}

export interface Load {
  id: string;
  shipperId: string;
  shipperName: string;
  status: LoadStatus;
  pickup: {
    location: string;
    city: string;
    state: string;
    date: string;
    time: string;
  };
  dropoff: {
    location: string;
    city: string;
    state: string;
    date: string;
    time: string;
  };
  cargo: {
    type: string;
    weight: number;
    description: string;
    photoUrls?: string[];
  };
  rate: number;
  distance: number;
  ratePerMile: number;
  matchedDriverId?: string;
  matchedDriverName?: string;
  aiScore?: number;
  analytics?: LoadAnalytics;
  createdAt: string;
  updatedAt: string;
}

export interface AnalyticsData {
  totalEarnings: number;
  totalMiles: number;
  avgRatePerMile: number;
  loadsCompleted: number;
  avgMpg: number;
  fuelCost: number;
  netEarnings: number;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

export interface BackhaulSuggestion {
  load: Load;
  deadheadMiles: number;
  efficiency: number;
}
