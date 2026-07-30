export interface MeterReference {
  indicator: string;
  topRow: string[];
  bottomRow: string[];
}

export interface QuoteDetails {
  sold: boolean;
  submitted: boolean;
}

export interface ContractRates {
  standingCharge: string;
  dayRate: string;
  nightRate?: string;
  eveningWeekendRate?: string;
  winterRate?: string;
}

export interface ContractDetails {
  contractCommission: string;
  startDate: string;
  soldSupplier: string;
  tariff: string;
  term: string;
  units: string;
  uplifts: string;
  rates: ContractRates;
  savings: string;
  yearlyCost: string;
  soldDate: string;
  contractType: string;
  submitted: string;
  isProcessed: string;
}

export interface MeterDetail {
  id: number;
  type: string;
  siteName: string;
  // Parsed reference structure (used for electricity / MPAN-style meters)
  reference: MeterReference;
  // Raw reference string as returned by the API (used for gas / MPRN-style meters)
  referenceString: string;
  quoteDetails: QuoteDetails;
  contractDetails: ContractDetails;
}

export interface Note {
  id: number;
  author: string;
  timestamp: string;
  content: string;
}

// Raw note object as returned by the API
export interface ApiNote {
  id: number;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  deleted_at: string | null;
  is_active: boolean;
  detail: string;
  created_by: number | null;
  deleted_by: number | null;
  company: string;
  // Optional helper if backend provides creator name per note later
  created_by_name?: string | null;
}

export interface ContactDetails {
  id: string | null;
  job_title: string;
  first_name: string;
  last_name: string;
  telephone1: string;
  telephone2: string | null;
  email_address: string;
  is_primary: boolean;
}

export interface BankDetails {
  id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  is_active: boolean;
  bank_name: string;
  account_name: string;
  account_number: string;
  sort_code: string;
  is_deleted: boolean;
  created_by: number | null;
  deleted_by: number | null;
  company: string;
}

// Keep the old interface for backward compatibility if needed
export interface BankDetailsLegacy {
  bankName: string;
  accountName: string;
  accountNumber: string;
  shortCode: string;
}

export interface CompanyDetails {
  company_name: string;
  business_type_id: number;
  business_type_name?: string;
  number_of_employees: string;
  estimated_turnover: string;
  is_micro_business: boolean;
  current_postcode: string;
  current_address_line1: string;
  current_address_line2?: string;
  current_address_line3?: string | null;
  current_address_line4?: string | null;
  registration_no: string;
}

export interface PrimaryContactDetails {
  id: string;
  first_name: string;
  last_name: string;
  position: string | null;
  email: string;
  title: string | null;
  telephone: string;
}

/** Flat quote fields nested under sites[].meters[].quote */
export interface QuoteHeaderFlat {
  id: number;
  profileclass?: string | null;
  MTC?: string | null;
  LLF?: string | null;
  Region?: string | null;
  bottomline?: string | null;
  mpan_mrpn_text?: string | null;
  is_mpan?: boolean;
  is_mrpn?: boolean;
  Number_of_Days?: number | null;
  standing_charge?: string | null;
  day_rate?: string | null;
  day_kwh?: string | null;
  night_rate?: string | null;
  night_kwh?: string | null;
  ew_rate?: string | null;
  ew_kwh?: string | null;
  winter_rate?: string | null;
  winter_kwh?: string | null;
  aq_eac?: string | null;
}

export interface SiteMeter extends Meter {
  quote?: QuoteHeaderFlat | null;
}

export interface Site {
  id: number;
  meters: SiteMeter[];
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  deleted_at: string | null;
  is_active: boolean;
  sitename: string;
  total_employee: number;
  postcode: string;
  address_line_1: string;
  address_line_2: string | null;
  address_line_3: string | null;
  address_line_4: string | null;
  created_by: number | null;
  deleted_by: number | null;
  company: string;
}

export interface Meter {
  meterid: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  is_active: boolean;
  latest_issold: boolean;
  latest_isprocessed: boolean;
  sold_contracts: number;
  processed_contracts: number;
  soldleadid: boolean;
  latestcontractid: number;
  latestsoldsuppliername: string;
  latesttariffname: string;
  latestterm: number;
  latestSoldStandingCharge: string;
  latestSoldDayRate: string;
  latestSoldNightRate: string | null;
  latestSoldEveningWeekendRate: string | null;
  latestSoldWinterRate: string | null;
  leadid: number;
  meter_status_id: number;
  meter_type_id: number;
  meter_type_name?: string;
  meter_reference: string;
  ssite_id: number | null;
  smeterid: number | null;
  electric_contract_type_id: number;
  created_user_id: number;
  screated_user_id: number | null;
  created_datetime: string;
  last_modified_user_id: number;
  last_modified_datetime: string;
  deleted_user_id: number | null;
  deleted_datetime: string | null;
  is_deleted: boolean;
  is_electralink_consent: boolean | null;
  created_by: string | null;
  deleted_by: string | null;
  site: number;
}

// Extended meter interface for API responses that include meter_type_name
export interface ApiMeter extends Meter {
  meter_type_name: string;
}

export interface Callback {
  id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  is_active: boolean;
  type: string;
  date: string;
  time: string;
  note: string;
  contact: string;
  is_overdue: boolean;
  is_completed: boolean;
  is_deleted: boolean;
  created_by: number | null;
  deleted_by: number | null;
  company: string;
}

export interface UpdateHistoryChangeItem {
  [key: string]: string | number | boolean | null;
}

export interface UpdateHistory {
  id: number;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  deleted_at: string | null;
  is_active: boolean;
  change_json: UpdateHistoryChangeItem[];
  created_by: number | null;
  deleted_by: number | null;
  company: string;
  // Optional names if API provides them
  created_by_name?: string | null;
  updated_by_name?: string | null;
}

export interface CompanyApiResponse {
  id: string;
  notes: ApiNote[];
  /** New API: single bank object */
  bank?: BankDetails | null;
  /** Legacy fallback */
  banks?: BankDetails[];
  primary_contact?: PrimaryContactDetails | null;
  sites: Site[];
  contacts: ContactDetails[];
  callbacks: Callback[];
  update_histories?: UpdateHistory[];
  created_by_name: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  is_active: boolean;
  lead_id: number;
  company_status_id: number;
  agent_user_id: number;
  company_name: string;
  registration_no: string;
  is_micro_business: boolean;
  number_of_employees: string;
  estimated_turnover: string;
  current_address_line1: string;
  current_address_line2: string;
  current_address_line3: string | null;
  current_address_line4: string | null;
  current_postcode: string;
  owner_partner_name: string;
  owner_partner_dob: string;
  owner_partner_dobstring: string;
  home_address_line1: string;
  home_address_line2: string;
  home_address_line3: string | null;
  home_address_line4: string | null;
  home_postcode: string;
  time_at_current_address_months: string | null;
  previous_address_line1: string | null;
  previous_address_line2: string | null;
  previous_address_line3: string | null;
  previous_address_line4: string | null;
  previous_postcode: string | null;
  time_at_previous_address_months: string | null;
  previous_address2_line1: string | null;
  previous_address2_line2: string | null;
  previous_address2_line3: string | null;
  previous_address2_line4: string | null;
  previous_postcode2: string | null;
  time_at_previous_address2_months: string | null;
  gas_provider: string | null;
  gas_renewal_date: string | null;
  gas_spending_band: string | null;
  electric_provider: string | null;
  electric_renewal_date: string | null;
  electric_spending_band: string | null;
  telecoms_provider: string | null;
  telecoms_renewal_date: string | null;
  telecoms_spending_band: string | null;
  gi_provider: string | null;
  gi_renewal_date: string | null;
  gi_spending_band: string | null;
  partner_user_id: number | null;
  account_manager_user_id: number | null;
  created_user_id: number;
  last_modified_user_id: number;
  deleted_user_id: number | null;
  deleted_datetime: string | null;
  is_deleted: boolean;
  account_manager_user_name: string | null;
  contracts_processed: number;
  contracts_issold: string | null;
  contracts_soldleadid: string | null;
  meterstring: string;
  primary_telephone_number: string | null;
  original_lead_source_campaign_string: string | null;
  original_lead_source_campaign_id: string | null;
  is_close_to_renewal: boolean;
  has_overdue_callbacks: boolean;
  has_renewal_callbacks: boolean;
  has_company_callbacks: boolean;
  ced: string | null;
  sold_supplier_name: string;
  username: string | null;
  contract_type: string | null;
  created_by: number;
  deleted_by: number | null;
  business_type: number | { id: number; title?: string; name?: string } | null;
  business_type_name?: string;
  // Optional DocuSign envelope identifier if an e-sign envelope already exists
  loa_envelope_id?: string | null;
  is_submitted?: boolean;
}
