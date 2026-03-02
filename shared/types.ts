export interface PhoneEntry {
  display: string;
  canonical: string;
}

export interface DeliveryEntry {
  companyName: string;
  what3words: string[];
  phones: PhoneEntry[];
  instructions: Array<{ text: string; source: string }>;
  images: string[];
}

export interface DeliveryResult {
  postcode: string;
  entries: DeliveryEntry[];
}

export interface LookupResponse {
  result: DeliveryResult;
}

export interface MultipleLookupResponse {
  results: DeliveryResult[];
  notFound: string[];
}

export interface DriverNotePayload {
  driverName: string;
  postcode: string;
  what3words?: string;
  notes: string;
  fileName?: string;
  fileContent?: string;
}

export interface VersionResponse {
  version: string;
}

export interface AuthUser {
  userId: string;
}
