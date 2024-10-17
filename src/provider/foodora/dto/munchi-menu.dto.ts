export interface MunchiMenu {
  error: boolean;
  result: Result;
}

export interface Result {
  id: number;
  name: string;
  email: string;
  slug: string;
  schedule: Today[];
  description: string;
  about: string;
  logo: string;
  header: string;
  phone: string;
  cellphone: any;
  owner_id: number;
  city_id: number;
  address: string;
  address_notes: any;
  zipcode: any;
  location: ResultLocation;
  featured: boolean;
  timezone: string;
  currency: string;
  food: boolean;
  alcohol: boolean;
  groceries: boolean;
  laundry: boolean;
  use_printer: boolean;
  printer_id: number;
  minimum: number;
  delivery_price: number;
  always_deliver: boolean;
  tax_type: number;
  tax: number;
  delivery_time: string;
  pickup_time: string;
  service_fee: number;
  fixed_usage_fee: number;
  percentage_usage_fee: number;
  order_default_priority: number;
  cancel_order_after_minutes: number;
  enabled: boolean;
  preorder_time: number;
  maximum: any;
  schedule_ranges: string;
  franchise_id: any;
  external_id: string;
  front_layout: string;
  seo_image: any;
  seo_title: any;
  seo_description: any;
  eta_status_times: EtaStatusTimes;
  eta_variation_time: any;
  price_level: string;
  facebook_profile: any;
  instagram_profile: string;
  tiktok_profile: any;
  snapchat_profile: any;
  pinterest_profile: any;
  whatsapp_number: any;
  delivery_tax_rate: number;
  delivery_tax_type: number;
  disabled_reason: any;
  snooze_until: any;
  menus_count: number;
  available_menus_count: number;
  menus_shared_count: number;
  available_menus_shared_count: number;
  map_marker: string;
  map_marker_sm: string;
  logo_url: string;
  font_family: string;
  layout: string;
  primary_color: string;
  background_color: string;
  showLocator: string;
  professionals: any[];
  configs: Config[];
  checkoutfields: { [key: string]: Checkoutfield };
  reviews: Reviews;
  open: boolean;
  today: Today;
  lazy_load_products_recommended: boolean;
  available_products_count: number;
  valid_service: boolean;
  num_zones: number;
  types: TypeElement[];
  metafields: Metafield[];
  owners: Owner[];
  gallery: Gallery[];
  city: City;
  webhooks: any[];
  extras: Extra[];
  maximums: any[];
  paymethods: PaymethodElement[];
  ribbon: Ribbon;
  drivergroups: Drivergroup[];
  menus: Menu[];
  menus_shared: any[];
  categories: Category[];
  categories_shared: any[];
  zones: Zone[];
  offers: Offer[];
}

export interface CategoryProduct {
  id: number;
  name: string;
  price: number;
  description: null | string;
  images: null | string;
  sku: any;
  category_id: number;
  inventoried: boolean;
  quantity: number;
  featured: boolean;
  enabled: boolean;
  upselling: boolean;
  in_offer: boolean;
  offer_price: number | null;
  rank: number;
  offer_rate: number;
  offer_rate_type: number;
  offer_include_options: boolean;
  external_id: null | string;
  barcode: any;
  barcode_alternative: any;
  estimated_person: any;
  tax_id: number | any;
  fee_id: any;
  slug: null | string;
  seo_image: any;
  seo_title: any;
  seo_description: any;
  seo_keywords: any;
  cost_price: any;
  cost_offer_price: number | null;
  weight: any;
  calories: number | null;
  weight_unit: null | string;
  hide_special_instructions: boolean;
  maximum_per_order: any;
  minimum_per_order: number;
  duration: any;
  type: ProductType;
  load_type: LoadType;
  updated_at: Date | null;
  created_at: Date | null;
  deleted_at: any;
  is_hidden: boolean;
  snooze_until: any;
  tags: any[];
  extras: Extra[];
  ingredients: Ingredient[];
  gallery: any[];
  tax?: Tax | any;
  fee?: any;
  ribbon?: any;
  pivot?: ProductPivot;
  category?: Category;
}

export interface Category {
  id: number;
  business_id: number;
  name: string;
  image: null | string;
  rank: number;
  enabled: boolean;
  external_id: null | string;
  parent_category_id: number | null;
  slug: Slug | null;
  seo_image: any;
  seo_title: any;
  seo_description: any;
  header: null | string;
  description: null | string;
  snooze_until: any;
  products?: CategoryProduct[];
  businesses?: any[];
  ribbon: any;
  subcategories?: Subcategory[];
}

export interface Extra {
  id: number;
  business_id: number;
  name: ExtraName;
  description: any;
  enabled: boolean;
  external_id: null | string;
  rank: number;
  snooze_until: any;
  pivot?: ExtraPivot;
  options: ExtraOption[];
}

export enum ExtraName {
  Extra = 'Extra',
  RemoveSomething = 'Remove something?',
  Size = 'Size',
}

export interface ExtraOption {
  id: number;
  extra_id: number;
  name: OptionName;
  image: any;
  conditioned: boolean;
  respect_to: number | null;
  min: number;
  max: number;
  rank: number;
  with_half_option: boolean;
  allow_suboption_quantity: boolean;
  limit_suboptions_by_max: boolean;
  enabled: boolean;
  external_id: any;
  snooze_until: any;
  suboptions: Suboption[];
}

export enum OptionName {
  Hamburger = 'Hamburger',
  RemoveSomething = 'Remove something?',
  Size = 'Size',
}

export interface Suboption {
  id: number;
  extra_option_id: number;
  name: SuboptionName;
  price: number;
  image: any;
  sku: any;
  rank: number;
  description: any;
  max: number;
  half_price: number | null;
  enabled: boolean;
  external_id: any;
  preselected: boolean;
  snooze_until: any;
}

export enum SuboptionName {
  Big = 'Big',
  Demo = 'Demo',
  Glutenfree = 'Glutenfree',
  Large = 'Large',
  Medium = 'Medium',
  Small = 'Small',
  Test = 'Test',
}

export interface ExtraPivot {
  product_id: number;
  extra_id: number;
}

export interface Ingredient {
  id: number;
  product_id: number;
  name: string;
  image: any;
}

export enum LoadType {
  Normal = 'normal',
}

export interface ProductPivot {
  menu_id: number;
  product_id: number;
}

export interface Tax {
  id: number;
  name: string;
  description: string;
  rate: number;
  type: number;
  external_id: any;
}

export enum ProductType {
  Item = 'item',
}

export enum Slug {
  ChickerBurger = 'chicker_burger',
  ClassicBurger = 'classic_burger',
  Dessert = 'dessert',
  Drink = 'drink',
  TestSlug = 'test_slug',
}

export interface Subcategory {
  id: number;
  business_id: number;
  name: string;
  image: any;
  rank: number;
  enabled: boolean;
  external_id: any;
  parent_category_id: number;
  slug: Slug;
  seo_image: any;
  seo_title: any;
  seo_description: any;
  header: any;
  description: any;
  snooze_until: any;
  products: SubcategoryProduct[];
  businesses: any[];
  subcategories: any[];
  ribbon: any;
}

export interface SubcategoryProduct {
  id: number;
  name: string;
  price: number;
  description: any;
  images: any;
  sku: any;
  category_id: number;
  inventoried: boolean;
  quantity: number;
  featured: boolean;
  enabled: boolean;
  upselling: boolean;
  in_offer: boolean;
  offer_price: any;
  rank: number;
  offer_rate: number;
  offer_rate_type: number;
  offer_include_options: boolean;
  external_id: any;
  barcode: any;
  barcode_alternative: any;
  estimated_person: any;
  tax_id: any;
  fee_id: any;
  slug: null | string;
  seo_image: any;
  seo_title: any;
  seo_description: any;
  seo_keywords: any;
  cost_price: any;
  cost_offer_price: any;
  weight: any;
  calories: any;
  weight_unit: any;
  hide_special_instructions: boolean;
  maximum_per_order: any;
  minimum_per_order: number;
  duration: any;
  type: ProductType;
  load_type: LoadType;
  updated_at: Date;
  created_at: Date;
  deleted_at: any;
  is_hidden: boolean;
  snooze_until: any;
  tags: any[];
  extras: Extra[];
  ingredients: any[];
  gallery: any[];
  tax: any;
  fee: any;
  ribbon: any;
}

export interface Checkoutfield {
  name: string;
  type: ValueTypeEnum;
  required: boolean;
  enabled: boolean;
}

export enum ValueTypeEnum {
  Date = 'date',
  Select = 'select',
  Text = 'text',
}

export interface City {
  id: number;
  name: string;
  country_id: number;
  administrator_id: number;
  enabled: boolean;
  country: Country;
}

export interface Country {
  id: number;
  name: string;
  enabled: boolean;
  code: any;
}

export interface Config {
  id: number;
  key: string;
  value: string;
  name: string;
  type: number;
  description: string;
  enabled: boolean;
  public: boolean;
  config_category_id: number;
  options: ConfigOption[] | null;
  rank: number | null;
  image: any;
  video: any;
  more_info: any;
  support_url: any;
  protected: boolean;
  hidden: boolean;
  dependency_key: any;
  dependency_value: any;
  customizable: boolean;
  can_replaced_by_businesses: boolean;
  can_replaced_by_sites: boolean;
}

export interface ConfigOption {
  text: Text;
  value: string;
}

export enum Text {
  No = 'NO',
  Yes = 'YES',
}

export interface Drivergroup {
  id: number;
  name: string;
  administrator_id: number | null;
  enabled: boolean;
  type: number;
  pivot: DrivergroupPivot;
}

export interface DrivergroupPivot {
  business_id: number;
  driver_group_id: number;
}

export interface EtaStatusTimes {}

export interface Gallery {
  id: number;
  business_id: number;
  type: number;
  file: string;
  video: any;
  title: any;
  description: any;
  created_at: Date;
  updated_at: Date;
}

export interface ResultLocation {
  lat: number;
  lng: number;
  zipcode: string;
  zoom: number;
}

export interface Menu {
  id: number;
  business_id: number;
  name: string;
  comment: null | string;
  schedule: Today[];
  pickup: boolean;
  delivery: boolean;
  enabled: boolean;
  eatin: boolean;
  curbside: boolean;
  driver_thru: boolean;
  schedule_ranges: string;
  all_products: boolean;
  use_business_schedule: boolean;
  external_id: any;
  seat_delivery: boolean;
  catering_delivery: boolean;
  catering_pickup: boolean;
  snooze_until: any;
  reservation: boolean;
  products: CategoryProduct[];
  businesses: Business[];
  sites: Site[];
}

export interface Business {
  id: number;
  name: string;
}

export interface Today {
  enabled: boolean;
  lapses: Lapse[];
}

export interface Lapse {
  open: Close;
  close: Close;
}

export interface Close {
  hour: number;
  minute: number;
}

export interface Site {
  id: number;
  name: string;
  code: string;
  url: null | string;
  logo: any;
  header: any;
  social_share: any;
  reset_password_url_template: null | string;
  created_at: Date;
  updated_at: Date;
  deleted_at: any;
  track_order_url_template: null | string;
  description: null | string;
  checkout_url_template: any;
  cart_url_template: any;
  business_url_template: any;
  category_url_template: any;
  product_url_template: any;
  profile_url_template: any;
  robots_rules: any;
  sitemap_urls: any;
  domain: any;
  ssl_setup_type: string;
  ssl_certificate_id: any;
  ssl_status: string;
  ssl_process_type: string;
  ssl_process_status: string;
  ssl_error_type: any;
  ssl_attempts: number;
  ssl_certificate_file: any;
  ssl_private_key_file: any;
  ssl_ca_bundle_file: any;
  ssl_valid_until: any;
  type: any;
  image: any;
  pivot: SitePivot;
}

export interface SitePivot {
  menu_id: number;
  site_id: number;
}

export interface Metafield {
  id: number;
  object_id: number;
  model: string;
  key: string;
  value: string;
  value_type: ValueTypeEnum;
  created_at: Date;
  updated_at: Date;
}

export interface Offer {
  id: number;
  business_id: number;
  name: string;
  type: number;
  minimum: number | null;
  rate_type: number;
  rate: number;
  start: Date;
  end: Date;
  coupon: null | string;
  limit: number | null;
  enabled: boolean;
  image: any;
  description: null | string;
  label: any;
  rank: any;
  condition_type: number;
  target: number;
  max_discount: any;
  stackable: boolean;
  auto: boolean;
  public: boolean;
  order_priority: any;
  schedule: any;
  limit_per_user: any;
  user_order_count: any;
  user_order_count_condition: any;
  order_types_allowed: any;
  valid_from_after_user_last_order_minutes: any;
  valid_until_after_user_last_order_minutes: any;
  include_products_with_offer: boolean;
  external_id: any;
  include_options: boolean;
}

export interface Owner {
  id: number;
  name: string;
  lastname: string;
  email: string;
  login_type: number;
  social_id: any;
  photo: null | string;
  birthdate: any;
  phone: any;
  cellphone: null | string;
  city_id: number | null;
  dropdown_option_id: any;
  address: null | string;
  address_notes: any;
  zipcode: null | string;
  location: CenterClass | null;
  level: number;
  language_id: number;
  push_notifications: boolean;
  busy: boolean;
  available: boolean;
  enabled: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: any;
  internal_number: any;
  map_data: any;
  middle_name: any;
  second_lastname: any;
  country_phone_code: null | string;
  priority: number;
  last_order_assigned_at: any;
  last_location_at: any;
  phone_verified: boolean;
  email_verified: boolean;
  driver_zone_restriction: boolean;
  pin: any;
  business_id: any;
  franchise_id: any;
  register_site_id: any;
  ideal_orders: any;
  external_id: any;
  settings: Settings;
  loyalty_level_id: number | null;
  loyalty_level_points: number;
  country_code: any;
  session_strategy: SessionStrategy;
  schedule: any;
  schedule_ranges: any;
  max_days_in_future: any;
  occupation_id: any;
  bio: any;
  last_service_assigned_at: any;
  timezone: any;
  user_system_id: any;
  platform: Platform;
  loyalty_id: any;
  guest_id: any;
  last_available_at: any;
  mono_session: boolean;
  guest_cellphone: any;
  guest_email: any;
  available_until: any;
  protected: boolean;
  pivot: OwnerPivot;
}

export interface CenterClass {
  lat?: number;
  lng?: number;
}

export interface OwnerPivot {
  business_id: number;
  owner_id: number;
}

export enum Platform {
  Core = 'core',
}

export enum SessionStrategy {
  JwtSession = 'jwt_session',
}

export interface Settings {
  email: Email;
  notification: Email;
  sms: Email;
}

export interface Email {
  newsletter: boolean;
  promotions: boolean;
}

export interface PaymethodElement {
  id: number;
  paymethod_id: number;
  business_id: number;
  sandbox: boolean;
  data: PaymethodData | null;
  data_sandbox: EtaStatusTimes | null;
  enabled: boolean;
  created_at: Date;
  updated_at: Date;
  allowed_order_types: number[] | null;
  maximun: any;
  paymethod: PaymethodPaymethod;
}

export interface PaymethodData {
  publishable: string;
  secret: string;
}

export interface PaymethodPaymethod {
  id: number;
  name: string;
  gateway: string;
  enabled: boolean;
  deleted_at: any;
  created_at: Date | null;
  updated_at: Date | null;
  plugin_id: number | null;
  allow_with_zero_balance: boolean;
}

export interface Reviews {
  reviews: Review[];
  quality: number;
  delivery: number;
  service: number;
  package: number;
  total: number;
}

export interface Review {
  id: number;
  order_id: number;
  quality: number;
  delivery: number;
  service: number;
  package: number;
  user_id: number;
  comment: string;
  enabled: boolean;
  created_at: Date;
  updated_at: Date;
  laravel_through_key: number;
  total: number;
  user: User;
}

export interface User {
  id: number;
  name: null | string;
  lastname: null | string;
  email: null | string;
}

export interface Ribbon {
  id: number;
  object_id: number;
  model: string;
  color: string;
  shape: string;
  text: string;
  created_at: Date;
  updated_at: Date;
  enabled: boolean;
}

export interface TypeElement {
  id: number;
  name: string;
  image: string;
  description: string;
  enabled: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Zone {
  id: number;
  business_id: number;
  name: string;
  type: number;
  address: any;
  data: ZoneData | null;
  dropdown_option_id: any;
  price: number;
  minimum: number;
  schedule: Today[];
  enabled: boolean;
  schedule_ranges: string;
  data_geography: null | string;
  hourly_delivery_times: any;
  owner_type: string;
  snooze_until: any;
  businesses: Business[];
  pivot: ZonePivot;
}

export interface ZoneData {
  center?: CenterClass;
  radio: number;
}

export interface ZonePivot {
  business_id: number;
  delivery_zone_id: number;
}

// Converts JSON strings to/from your types
// and asserts the results of JSON.parse at runtime
export class Convert {
  public static toMunchiMenu(json: string): MunchiMenu {
    return cast(JSON.parse(json), r('MunchiMenu'));
  }

  public static munchiMenuToJson(value: MunchiMenu): string {
    return JSON.stringify(uncast(value, r('MunchiMenu')), null, 2);
  }
}

function invalidValue(typ: any, val: any, key: any, parent: any = ''): never {
  const prettyTyp = prettyTypeName(typ);
  const parentText = parent ? ` on ${parent}` : '';
  const keyText = key ? ` for key "${key}"` : '';
  throw Error(
    `Invalid value${keyText}${parentText}. Expected ${prettyTyp} but got ${JSON.stringify(val)}`,
  );
}

function prettyTypeName(typ: any): string {
  if (Array.isArray(typ)) {
    if (typ.length === 2 && typ[0] === undefined) {
      return `an optional ${prettyTypeName(typ[1])}`;
    } else {
      return `one of [${typ
        .map((a) => {
          return prettyTypeName(a);
        })
        .join(', ')}]`;
    }
  } else if (typeof typ === 'object' && typ.literal !== undefined) {
    return typ.literal;
  } else {
    return typeof typ;
  }
}

function jsonToJSProps(typ: any): any {
  if (typ.jsonToJS === undefined) {
    const map: any = {};
    typ.props.forEach((p: any) => (map[p.json] = { key: p.js, typ: p.typ }));
    typ.jsonToJS = map;
  }
  return typ.jsonToJS;
}

function jsToJSONProps(typ: any): any {
  if (typ.jsToJSON === undefined) {
    const map: any = {};
    typ.props.forEach((p: any) => (map[p.js] = { key: p.json, typ: p.typ }));
    typ.jsToJSON = map;
  }
  return typ.jsToJSON;
}

function transform(val: any, typ: any, getProps: any, key: any = '', parent: any = ''): any {
  function transformPrimitive(typ: string, val: any): any {
    if (typeof typ === typeof val) return val;
    return invalidValue(typ, val, key, parent);
  }

  function transformUnion(typs: any[], val: any): any {
    // val must validate against one typ in typs
    const l = typs.length;
    for (let i = 0; i < l; i++) {
      const typ = typs[i];
      try {
        return transform(val, typ, getProps);
      } catch (_) {}
    }
    return invalidValue(typs, val, key, parent);
  }

  function transformEnum(cases: string[], val: any): any {
    if (cases.indexOf(val) !== -1) return val;
    return invalidValue(
      cases.map((a) => {
        return l(a);
      }),
      val,
      key,
      parent,
    );
  }

  function transformArray(typ: any, val: any): any {
    // val must be an array with no invalid elements
    if (!Array.isArray(val)) return invalidValue(l('array'), val, key, parent);
    return val.map((el) => transform(el, typ, getProps));
  }

  function transformDate(val: any): any {
    if (val === null) {
      return null;
    }
    const d = new Date(val);
    if (isNaN(d.valueOf())) {
      return invalidValue(l('Date'), val, key, parent);
    }
    return d;
  }

  function transformObject(props: { [k: string]: any }, additional: any, val: any): any {
    if (val === null || typeof val !== 'object' || Array.isArray(val)) {
      return invalidValue(l(ref || 'object'), val, key, parent);
    }
    const result: any = {};
    Object.getOwnPropertyNames(props).forEach((key) => {
      const prop = props[key];
      const v = Object.prototype.hasOwnProperty.call(val, key) ? val[key] : undefined;
      result[prop.key] = transform(v, prop.typ, getProps, key, ref);
    });
    Object.getOwnPropertyNames(val).forEach((key) => {
      if (!Object.prototype.hasOwnProperty.call(props, key)) {
        result[key] = transform(val[key], additional, getProps, key, ref);
      }
    });
    return result;
  }

  if (typ === 'any') return val;
  if (typ === null) {
    if (val === null) return val;
    return invalidValue(typ, val, key, parent);
  }
  if (typ === false) return invalidValue(typ, val, key, parent);
  let ref: any = undefined;
  while (typeof typ === 'object' && typ.ref !== undefined) {
    ref = typ.ref;
    typ = typeMap[typ.ref];
  }
  if (Array.isArray(typ)) return transformEnum(typ, val);
  if (typeof typ === 'object') {
    return typ.hasOwnProperty('unionMembers')
      ? transformUnion(typ.unionMembers, val)
      : typ.hasOwnProperty('arrayItems')
      ? transformArray(typ.arrayItems, val)
      : typ.hasOwnProperty('props')
      ? transformObject(getProps(typ), typ.additional, val)
      : invalidValue(typ, val, key, parent);
  }
  // Numbers can be parsed by Date but shouldn't be.
  if (typ === Date && typeof val !== 'number') return transformDate(val);
  return transformPrimitive(typ, val);
}

function cast<T>(val: any, typ: any): T {
  return transform(val, typ, jsonToJSProps);
}

function uncast<T>(val: T, typ: any): any {
  return transform(val, typ, jsToJSONProps);
}

function l(typ: any) {
  return { literal: typ };
}

function a(typ: any) {
  return { arrayItems: typ };
}

function u(...typs: any[]) {
  return { unionMembers: typs };
}

function o(props: any[], additional: any) {
  return { props, additional };
}

function m(additional: any) {
  return { props: [], additional };
}

function r(name: string) {
  return { ref: name };
}

const typeMap: any = {
  MunchiMenu: o(
    [
      { json: 'error', js: 'error', typ: true },
      { json: 'result', js: 'result', typ: r('Result') },
    ],
    false,
  ),
  Result: o(
    [
      { json: 'id', js: 'id', typ: 0 },
      { json: 'name', js: 'name', typ: '' },
      { json: 'email', js: 'email', typ: '' },
      { json: 'slug', js: 'slug', typ: '' },
      { json: 'schedule', js: 'schedule', typ: a(r('Today')) },
      { json: 'description', js: 'description', typ: '' },
      { json: 'about', js: 'about', typ: '' },
      { json: 'logo', js: 'logo', typ: '' },
      { json: 'header', js: 'header', typ: '' },
      { json: 'phone', js: 'phone', typ: '' },
      { json: 'cellphone', js: 'cellphone', typ: null },
      { json: 'owner_id', js: 'owner_id', typ: 0 },
      { json: 'city_id', js: 'city_id', typ: 0 },
      { json: 'address', js: 'address', typ: '' },
      { json: 'address_notes', js: 'address_notes', typ: null },
      { json: 'zipcode', js: 'zipcode', typ: null },
      { json: 'location', js: 'location', typ: r('ResultLocation') },
      { json: 'featured', js: 'featured', typ: true },
      { json: 'timezone', js: 'timezone', typ: '' },
      { json: 'currency', js: 'currency', typ: '' },
      { json: 'food', js: 'food', typ: true },
      { json: 'alcohol', js: 'alcohol', typ: true },
      { json: 'groceries', js: 'groceries', typ: true },
      { json: 'laundry', js: 'laundry', typ: true },
      { json: 'use_printer', js: 'use_printer', typ: true },
      { json: 'printer_id', js: 'printer_id', typ: 0 },
      { json: 'minimum', js: 'minimum', typ: 0 },
      { json: 'delivery_price', js: 'delivery_price', typ: 0 },
      { json: 'always_deliver', js: 'always_deliver', typ: true },
      { json: 'tax_type', js: 'tax_type', typ: 0 },
      { json: 'tax', js: 'tax', typ: 0 },
      { json: 'delivery_time', js: 'delivery_time', typ: '' },
      { json: 'pickup_time', js: 'pickup_time', typ: '' },
      { json: 'service_fee', js: 'service_fee', typ: 0 },
      { json: 'fixed_usage_fee', js: 'fixed_usage_fee', typ: 0 },
      { json: 'percentage_usage_fee', js: 'percentage_usage_fee', typ: 0 },
      { json: 'order_default_priority', js: 'order_default_priority', typ: 0 },
      { json: 'cancel_order_after_minutes', js: 'cancel_order_after_minutes', typ: 0 },
      { json: 'enabled', js: 'enabled', typ: true },
      { json: 'preorder_time', js: 'preorder_time', typ: 0 },
      { json: 'maximum', js: 'maximum', typ: null },
      { json: 'schedule_ranges', js: 'schedule_ranges', typ: '' },
      { json: 'franchise_id', js: 'franchise_id', typ: null },
      { json: 'external_id', js: 'external_id', typ: '' },
      { json: 'front_layout', js: 'front_layout', typ: '' },
      { json: 'seo_image', js: 'seo_image', typ: null },
      { json: 'seo_title', js: 'seo_title', typ: null },
      { json: 'seo_description', js: 'seo_description', typ: null },
      { json: 'eta_status_times', js: 'eta_status_times', typ: r('EtaStatusTimes') },
      { json: 'eta_variation_time', js: 'eta_variation_time', typ: null },
      { json: 'price_level', js: 'price_level', typ: '' },
      { json: 'facebook_profile', js: 'facebook_profile', typ: null },
      { json: 'instagram_profile', js: 'instagram_profile', typ: '' },
      { json: 'tiktok_profile', js: 'tiktok_profile', typ: null },
      { json: 'snapchat_profile', js: 'snapchat_profile', typ: null },
      { json: 'pinterest_profile', js: 'pinterest_profile', typ: null },
      { json: 'whatsapp_number', js: 'whatsapp_number', typ: null },
      { json: 'delivery_tax_rate', js: 'delivery_tax_rate', typ: 0 },
      { json: 'delivery_tax_type', js: 'delivery_tax_type', typ: 0 },
      { json: 'disabled_reason', js: 'disabled_reason', typ: null },
      { json: 'snooze_until', js: 'snooze_until', typ: null },
      { json: 'menus_count', js: 'menus_count', typ: 0 },
      { json: 'available_menus_count', js: 'available_menus_count', typ: 0 },
      { json: 'menus_shared_count', js: 'menus_shared_count', typ: 0 },
      { json: 'available_menus_shared_count', js: 'available_menus_shared_count', typ: 0 },
      { json: 'map_marker', js: 'map_marker', typ: '' },
      { json: 'map_marker_sm', js: 'map_marker_sm', typ: '' },
      { json: 'logo_url', js: 'logo_url', typ: '' },
      { json: 'font_family', js: 'font_family', typ: '' },
      { json: 'layout', js: 'layout', typ: '' },
      { json: 'primary_color', js: 'primary_color', typ: '' },
      { json: 'background_color', js: 'background_color', typ: '' },
      { json: 'showLocator', js: 'showLocator', typ: '' },
      { json: 'professionals', js: 'professionals', typ: a('any') },
      { json: 'configs', js: 'configs', typ: a(r('Config')) },
      { json: 'checkoutfields', js: 'checkoutfields', typ: m(r('Checkoutfield')) },
      { json: 'reviews', js: 'reviews', typ: r('Reviews') },
      { json: 'open', js: 'open', typ: true },
      { json: 'today', js: 'today', typ: r('Today') },
      { json: 'lazy_load_products_recommended', js: 'lazy_load_products_recommended', typ: true },
      { json: 'available_products_count', js: 'available_products_count', typ: 0 },
      { json: 'valid_service', js: 'valid_service', typ: true },
      { json: 'num_zones', js: 'num_zones', typ: 0 },
      { json: 'types', js: 'types', typ: a(r('TypeElement')) },
      { json: 'metafields', js: 'metafields', typ: a(r('Metafield')) },
      { json: 'owners', js: 'owners', typ: a(r('Owner')) },
      { json: 'gallery', js: 'gallery', typ: a(r('Gallery')) },
      { json: 'city', js: 'city', typ: r('City') },
      { json: 'webhooks', js: 'webhooks', typ: a('any') },
      { json: 'extras', js: 'extras', typ: a(r('Extra')) },
      { json: 'maximums', js: 'maximums', typ: a('any') },
      { json: 'paymethods', js: 'paymethods', typ: a(r('PaymethodElement')) },
      { json: 'ribbon', js: 'ribbon', typ: r('Ribbon') },
      { json: 'drivergroups', js: 'drivergroups', typ: a(r('Drivergroup')) },
      { json: 'menus', js: 'menus', typ: a(r('Menu')) },
      { json: 'menus_shared', js: 'menus_shared', typ: a('any') },
      { json: 'categories', js: 'categories', typ: a(r('Category')) },
      { json: 'categories_shared', js: 'categories_shared', typ: a('any') },
      { json: 'zones', js: 'zones', typ: a(r('Zone')) },
      { json: 'offers', js: 'offers', typ: a(r('Offer')) },
    ],
    false,
  ),
  CategoryProduct: o(
    [
      { json: 'id', js: 'id', typ: 0 },
      { json: 'name', js: 'name', typ: '' },
      { json: 'price', js: 'price', typ: 3.14 },
      { json: 'description', js: 'description', typ: u(null, '') },
      { json: 'images', js: 'images', typ: u(null, '') },
      { json: 'sku', js: 'sku', typ: null },
      { json: 'category_id', js: 'category_id', typ: 0 },
      { json: 'inventoried', js: 'inventoried', typ: true },
      { json: 'quantity', js: 'quantity', typ: 0 },
      { json: 'featured', js: 'featured', typ: true },
      { json: 'enabled', js: 'enabled', typ: true },
      { json: 'upselling', js: 'upselling', typ: true },
      { json: 'in_offer', js: 'in_offer', typ: true },
      { json: 'offer_price', js: 'offer_price', typ: u(0, null) },
      { json: 'rank', js: 'rank', typ: 3.14 },
      { json: 'offer_rate', js: 'offer_rate', typ: 0 },
      { json: 'offer_rate_type', js: 'offer_rate_type', typ: 0 },
      { json: 'offer_include_options', js: 'offer_include_options', typ: true },
      { json: 'external_id', js: 'external_id', typ: u(null, '') },
      { json: 'barcode', js: 'barcode', typ: null },
      { json: 'barcode_alternative', js: 'barcode_alternative', typ: null },
      { json: 'estimated_person', js: 'estimated_person', typ: null },
      { json: 'tax_id', js: 'tax_id', typ: u(0, null) },
      { json: 'fee_id', js: 'fee_id', typ: null },
      { json: 'slug', js: 'slug', typ: u(null, '') },
      { json: 'seo_image', js: 'seo_image', typ: null },
      { json: 'seo_title', js: 'seo_title', typ: null },
      { json: 'seo_description', js: 'seo_description', typ: null },
      { json: 'seo_keywords', js: 'seo_keywords', typ: null },
      { json: 'cost_price', js: 'cost_price', typ: null },
      { json: 'cost_offer_price', js: 'cost_offer_price', typ: u(0, null) },
      { json: 'weight', js: 'weight', typ: null },
      { json: 'calories', js: 'calories', typ: u(0, null) },
      { json: 'weight_unit', js: 'weight_unit', typ: u(null, '') },
      { json: 'hide_special_instructions', js: 'hide_special_instructions', typ: true },
      { json: 'maximum_per_order', js: 'maximum_per_order', typ: null },
      { json: 'minimum_per_order', js: 'minimum_per_order', typ: 0 },
      { json: 'duration', js: 'duration', typ: null },
      { json: 'type', js: 'type', typ: r('ProductType') },
      { json: 'load_type', js: 'load_type', typ: r('LoadType') },
      { json: 'updated_at', js: 'updated_at', typ: u(Date, null) },
      { json: 'created_at', js: 'created_at', typ: u(Date, null) },
      { json: 'deleted_at', js: 'deleted_at', typ: null },
      { json: 'is_hidden', js: 'is_hidden', typ: true },
      { json: 'snooze_until', js: 'snooze_until', typ: null },
      { json: 'tags', js: 'tags', typ: a('any') },
      { json: 'extras', js: 'extras', typ: a(r('Extra')) },
      { json: 'ingredients', js: 'ingredients', typ: a(r('Ingredient')) },
      { json: 'gallery', js: 'gallery', typ: a('any') },
      { json: 'tax', js: 'tax', typ: u(undefined, u(r('Tax'), null)) },
      { json: 'fee', js: 'fee', typ: u(undefined, null) },
      { json: 'ribbon', js: 'ribbon', typ: u(undefined, null) },
      { json: 'pivot', js: 'pivot', typ: u(undefined, r('ProductPivot')) },
      { json: 'category', js: 'category', typ: u(undefined, r('Category')) },
    ],
    false,
  ),
  Category: o(
    [
      { json: 'id', js: 'id', typ: 0 },
      { json: 'business_id', js: 'business_id', typ: 0 },
      { json: 'name', js: 'name', typ: '' },
      { json: 'image', js: 'image', typ: u(null, '') },
      { json: 'rank', js: 'rank', typ: 0 },
      { json: 'enabled', js: 'enabled', typ: true },
      { json: 'external_id', js: 'external_id', typ: u(null, '') },
      { json: 'parent_category_id', js: 'parent_category_id', typ: u(0, null) },
      { json: 'slug', js: 'slug', typ: u(r('Slug'), null) },
      { json: 'seo_image', js: 'seo_image', typ: null },
      { json: 'seo_title', js: 'seo_title', typ: null },
      { json: 'seo_description', js: 'seo_description', typ: null },
      { json: 'header', js: 'header', typ: u(null, '') },
      { json: 'description', js: 'description', typ: u(null, '') },
      { json: 'snooze_until', js: 'snooze_until', typ: null },
      { json: 'products', js: 'products', typ: u(undefined, a(r('CategoryProduct'))) },
      { json: 'businesses', js: 'businesses', typ: u(undefined, a('any')) },
      { json: 'ribbon', js: 'ribbon', typ: null },
      { json: 'subcategories', js: 'subcategories', typ: u(undefined, a(r('Subcategory'))) },
    ],
    false,
  ),
  Extra: o(
    [
      { json: 'id', js: 'id', typ: 0 },
      { json: 'business_id', js: 'business_id', typ: 0 },
      { json: 'name', js: 'name', typ: r('ExtraName') },
      { json: 'description', js: 'description', typ: null },
      { json: 'enabled', js: 'enabled', typ: true },
      { json: 'external_id', js: 'external_id', typ: u(null, '') },
      { json: 'rank', js: 'rank', typ: 0 },
      { json: 'snooze_until', js: 'snooze_until', typ: null },
      { json: 'pivot', js: 'pivot', typ: u(undefined, r('ExtraPivot')) },
      { json: 'options', js: 'options', typ: a(r('ExtraOption')) },
    ],
    false,
  ),
  ExtraOption: o(
    [
      { json: 'id', js: 'id', typ: 0 },
      { json: 'extra_id', js: 'extra_id', typ: 0 },
      { json: 'name', js: 'name', typ: r('OptionName') },
      { json: 'image', js: 'image', typ: null },
      { json: 'conditioned', js: 'conditioned', typ: true },
      { json: 'respect_to', js: 'respect_to', typ: u(0, null) },
      { json: 'min', js: 'min', typ: 0 },
      { json: 'max', js: 'max', typ: 0 },
      { json: 'rank', js: 'rank', typ: 0 },
      { json: 'with_half_option', js: 'with_half_option', typ: true },
      { json: 'allow_suboption_quantity', js: 'allow_suboption_quantity', typ: true },
      { json: 'limit_suboptions_by_max', js: 'limit_suboptions_by_max', typ: true },
      { json: 'enabled', js: 'enabled', typ: true },
      { json: 'external_id', js: 'external_id', typ: null },
      { json: 'snooze_until', js: 'snooze_until', typ: null },
      { json: 'suboptions', js: 'suboptions', typ: a(r('Suboption')) },
    ],
    false,
  ),
  Suboption: o(
    [
      { json: 'id', js: 'id', typ: 0 },
      { json: 'extra_option_id', js: 'extra_option_id', typ: 0 },
      { json: 'name', js: 'name', typ: r('SuboptionName') },
      { json: 'price', js: 'price', typ: 0 },
      { json: 'image', js: 'image', typ: null },
      { json: 'sku', js: 'sku', typ: null },
      { json: 'rank', js: 'rank', typ: 3.14 },
      { json: 'description', js: 'description', typ: null },
      { json: 'max', js: 'max', typ: 0 },
      { json: 'half_price', js: 'half_price', typ: u(0, null) },
      { json: 'enabled', js: 'enabled', typ: true },
      { json: 'external_id', js: 'external_id', typ: null },
      { json: 'preselected', js: 'preselected', typ: true },
      { json: 'snooze_until', js: 'snooze_until', typ: null },
    ],
    false,
  ),
  ExtraPivot: o(
    [
      { json: 'product_id', js: 'product_id', typ: 0 },
      { json: 'extra_id', js: 'extra_id', typ: 0 },
    ],
    false,
  ),
  Ingredient: o(
    [
      { json: 'id', js: 'id', typ: 0 },
      { json: 'product_id', js: 'product_id', typ: 0 },
      { json: 'name', js: 'name', typ: '' },
      { json: 'image', js: 'image', typ: null },
    ],
    false,
  ),
  ProductPivot: o(
    [
      { json: 'menu_id', js: 'menu_id', typ: 0 },
      { json: 'product_id', js: 'product_id', typ: 0 },
    ],
    false,
  ),
  Tax: o(
    [
      { json: 'id', js: 'id', typ: 0 },
      { json: 'name', js: 'name', typ: '' },
      { json: 'description', js: 'description', typ: '' },
      { json: 'rate', js: 'rate', typ: 3.14 },
      { json: 'type', js: 'type', typ: 0 },
      { json: 'external_id', js: 'external_id', typ: null },
    ],
    false,
  ),
  Subcategory: o(
    [
      { json: 'id', js: 'id', typ: 0 },
      { json: 'business_id', js: 'business_id', typ: 0 },
      { json: 'name', js: 'name', typ: '' },
      { json: 'image', js: 'image', typ: null },
      { json: 'rank', js: 'rank', typ: 0 },
      { json: 'enabled', js: 'enabled', typ: true },
      { json: 'external_id', js: 'external_id', typ: null },
      { json: 'parent_category_id', js: 'parent_category_id', typ: 0 },
      { json: 'slug', js: 'slug', typ: r('Slug') },
      { json: 'seo_image', js: 'seo_image', typ: null },
      { json: 'seo_title', js: 'seo_title', typ: null },
      { json: 'seo_description', js: 'seo_description', typ: null },
      { json: 'header', js: 'header', typ: null },
      { json: 'description', js: 'description', typ: null },
      { json: 'snooze_until', js: 'snooze_until', typ: null },
      { json: 'products', js: 'products', typ: a(r('SubcategoryProduct')) },
      { json: 'businesses', js: 'businesses', typ: a('any') },
      { json: 'subcategories', js: 'subcategories', typ: a('any') },
      { json: 'ribbon', js: 'ribbon', typ: null },
    ],
    false,
  ),
  SubcategoryProduct: o(
    [
      { json: 'id', js: 'id', typ: 0 },
      { json: 'name', js: 'name', typ: '' },
      { json: 'price', js: 'price', typ: 3.14 },
      { json: 'description', js: 'description', typ: null },
      { json: 'images', js: 'images', typ: null },
      { json: 'sku', js: 'sku', typ: null },
      { json: 'category_id', js: 'category_id', typ: 0 },
      { json: 'inventoried', js: 'inventoried', typ: true },
      { json: 'quantity', js: 'quantity', typ: 0 },
      { json: 'featured', js: 'featured', typ: true },
      { json: 'enabled', js: 'enabled', typ: true },
      { json: 'upselling', js: 'upselling', typ: true },
      { json: 'in_offer', js: 'in_offer', typ: true },
      { json: 'offer_price', js: 'offer_price', typ: null },
      { json: 'rank', js: 'rank', typ: 0 },
      { json: 'offer_rate', js: 'offer_rate', typ: 0 },
      { json: 'offer_rate_type', js: 'offer_rate_type', typ: 0 },
      { json: 'offer_include_options', js: 'offer_include_options', typ: true },
      { json: 'external_id', js: 'external_id', typ: null },
      { json: 'barcode', js: 'barcode', typ: null },
      { json: 'barcode_alternative', js: 'barcode_alternative', typ: null },
      { json: 'estimated_person', js: 'estimated_person', typ: null },
      { json: 'tax_id', js: 'tax_id', typ: null },
      { json: 'fee_id', js: 'fee_id', typ: null },
      { json: 'slug', js: 'slug', typ: u(null, '') },
      { json: 'seo_image', js: 'seo_image', typ: null },
      { json: 'seo_title', js: 'seo_title', typ: null },
      { json: 'seo_description', js: 'seo_description', typ: null },
      { json: 'seo_keywords', js: 'seo_keywords', typ: null },
      { json: 'cost_price', js: 'cost_price', typ: null },
      { json: 'cost_offer_price', js: 'cost_offer_price', typ: null },
      { json: 'weight', js: 'weight', typ: null },
      { json: 'calories', js: 'calories', typ: null },
      { json: 'weight_unit', js: 'weight_unit', typ: null },
      { json: 'hide_special_instructions', js: 'hide_special_instructions', typ: true },
      { json: 'maximum_per_order', js: 'maximum_per_order', typ: null },
      { json: 'minimum_per_order', js: 'minimum_per_order', typ: 0 },
      { json: 'duration', js: 'duration', typ: null },
      { json: 'type', js: 'type', typ: r('ProductType') },
      { json: 'load_type', js: 'load_type', typ: r('LoadType') },
      { json: 'updated_at', js: 'updated_at', typ: Date },
      { json: 'created_at', js: 'created_at', typ: Date },
      { json: 'deleted_at', js: 'deleted_at', typ: null },
      { json: 'is_hidden', js: 'is_hidden', typ: true },
      { json: 'snooze_until', js: 'snooze_until', typ: null },
      { json: 'tags', js: 'tags', typ: a('any') },
      { json: 'extras', js: 'extras', typ: a(r('Extra')) },
      { json: 'ingredients', js: 'ingredients', typ: a('any') },
      { json: 'gallery', js: 'gallery', typ: a('any') },
      { json: 'tax', js: 'tax', typ: null },
      { json: 'fee', js: 'fee', typ: null },
      { json: 'ribbon', js: 'ribbon', typ: null },
    ],
    false,
  ),
  Checkoutfield: o(
    [
      { json: 'name', js: 'name', typ: '' },
      { json: 'type', js: 'type', typ: r('ValueTypeEnum') },
      { json: 'required', js: 'required', typ: true },
      { json: 'enabled', js: 'enabled', typ: true },
    ],
    false,
  ),
  City: o(
    [
      { json: 'id', js: 'id', typ: 0 },
      { json: 'name', js: 'name', typ: '' },
      { json: 'country_id', js: 'country_id', typ: 0 },
      { json: 'administrator_id', js: 'administrator_id', typ: 0 },
      { json: 'enabled', js: 'enabled', typ: true },
      { json: 'country', js: 'country', typ: r('Country') },
    ],
    false,
  ),
  Country: o(
    [
      { json: 'id', js: 'id', typ: 0 },
      { json: 'name', js: 'name', typ: '' },
      { json: 'enabled', js: 'enabled', typ: true },
      { json: 'code', js: 'code', typ: null },
    ],
    false,
  ),
  Config: o(
    [
      { json: 'id', js: 'id', typ: 0 },
      { json: 'key', js: 'key', typ: '' },
      { json: 'value', js: 'value', typ: '' },
      { json: 'name', js: 'name', typ: '' },
      { json: 'type', js: 'type', typ: 0 },
      { json: 'description', js: 'description', typ: '' },
      { json: 'enabled', js: 'enabled', typ: true },
      { json: 'public', js: 'public', typ: true },
      { json: 'config_category_id', js: 'config_category_id', typ: 0 },
      { json: 'options', js: 'options', typ: u(a(r('ConfigOption')), null) },
      { json: 'rank', js: 'rank', typ: u(0, null) },
      { json: 'image', js: 'image', typ: null },
      { json: 'video', js: 'video', typ: null },
      { json: 'more_info', js: 'more_info', typ: null },
      { json: 'support_url', js: 'support_url', typ: null },
      { json: 'protected', js: 'protected', typ: true },
      { json: 'hidden', js: 'hidden', typ: true },
      { json: 'dependency_key', js: 'dependency_key', typ: null },
      { json: 'dependency_value', js: 'dependency_value', typ: null },
      { json: 'customizable', js: 'customizable', typ: true },
      { json: 'can_replaced_by_businesses', js: 'can_replaced_by_businesses', typ: true },
      { json: 'can_replaced_by_sites', js: 'can_replaced_by_sites', typ: true },
    ],
    false,
  ),
  ConfigOption: o(
    [
      { json: 'text', js: 'text', typ: r('Text') },
      { json: 'value', js: 'value', typ: '' },
    ],
    false,
  ),
  Drivergroup: o(
    [
      { json: 'id', js: 'id', typ: 0 },
      { json: 'name', js: 'name', typ: '' },
      { json: 'administrator_id', js: 'administrator_id', typ: u(0, null) },
      { json: 'enabled', js: 'enabled', typ: true },
      { json: 'type', js: 'type', typ: 0 },
      { json: 'pivot', js: 'pivot', typ: r('DrivergroupPivot') },
    ],
    false,
  ),
  DrivergroupPivot: o(
    [
      { json: 'business_id', js: 'business_id', typ: 0 },
      { json: 'driver_group_id', js: 'driver_group_id', typ: 0 },
    ],
    false,
  ),
  EtaStatusTimes: o([], false),
  Gallery: o(
    [
      { json: 'id', js: 'id', typ: 0 },
      { json: 'business_id', js: 'business_id', typ: 0 },
      { json: 'type', js: 'type', typ: 0 },
      { json: 'file', js: 'file', typ: '' },
      { json: 'video', js: 'video', typ: null },
      { json: 'title', js: 'title', typ: null },
      { json: 'description', js: 'description', typ: null },
      { json: 'created_at', js: 'created_at', typ: Date },
      { json: 'updated_at', js: 'updated_at', typ: Date },
    ],
    false,
  ),
  ResultLocation: o(
    [
      { json: 'lat', js: 'lat', typ: 3.14 },
      { json: 'lng', js: 'lng', typ: 3.14 },
      { json: 'zipcode', js: 'zipcode', typ: '' },
      { json: 'zoom', js: 'zoom', typ: 0 },
    ],
    false,
  ),
  Menu: o(
    [
      { json: 'id', js: 'id', typ: 0 },
      { json: 'business_id', js: 'business_id', typ: 0 },
      { json: 'name', js: 'name', typ: '' },
      { json: 'comment', js: 'comment', typ: u(null, '') },
      { json: 'schedule', js: 'schedule', typ: a(r('Today')) },
      { json: 'pickup', js: 'pickup', typ: true },
      { json: 'delivery', js: 'delivery', typ: true },
      { json: 'enabled', js: 'enabled', typ: true },
      { json: 'eatin', js: 'eatin', typ: true },
      { json: 'curbside', js: 'curbside', typ: true },
      { json: 'driver_thru', js: 'driver_thru', typ: true },
      { json: 'schedule_ranges', js: 'schedule_ranges', typ: '' },
      { json: 'all_products', js: 'all_products', typ: true },
      { json: 'use_business_schedule', js: 'use_business_schedule', typ: true },
      { json: 'external_id', js: 'external_id', typ: null },
      { json: 'seat_delivery', js: 'seat_delivery', typ: true },
      { json: 'catering_delivery', js: 'catering_delivery', typ: true },
      { json: 'catering_pickup', js: 'catering_pickup', typ: true },
      { json: 'snooze_until', js: 'snooze_until', typ: null },
      { json: 'reservation', js: 'reservation', typ: true },
      { json: 'products', js: 'products', typ: a(r('CategoryProduct')) },
      { json: 'businesses', js: 'businesses', typ: a(r('Business')) },
      { json: 'sites', js: 'sites', typ: a(r('Site')) },
    ],
    false,
  ),
  Business: o(
    [
      { json: 'id', js: 'id', typ: 0 },
      { json: 'name', js: 'name', typ: '' },
    ],
    false,
  ),
  Today: o(
    [
      { json: 'enabled', js: 'enabled', typ: true },
      { json: 'lapses', js: 'lapses', typ: a(r('Lapse')) },
    ],
    false,
  ),
  Lapse: o(
    [
      { json: 'open', js: 'open', typ: r('Close') },
      { json: 'close', js: 'close', typ: r('Close') },
    ],
    false,
  ),
  Close: o(
    [
      { json: 'hour', js: 'hour', typ: 0 },
      { json: 'minute', js: 'minute', typ: 0 },
    ],
    false,
  ),
  Site: o(
    [
      { json: 'id', js: 'id', typ: 0 },
      { json: 'name', js: 'name', typ: '' },
      { json: 'code', js: 'code', typ: '' },
      { json: 'url', js: 'url', typ: u(null, '') },
      { json: 'logo', js: 'logo', typ: null },
      { json: 'header', js: 'header', typ: null },
      { json: 'social_share', js: 'social_share', typ: null },
      { json: 'reset_password_url_template', js: 'reset_password_url_template', typ: u(null, '') },
      { json: 'created_at', js: 'created_at', typ: Date },
      { json: 'updated_at', js: 'updated_at', typ: Date },
      { json: 'deleted_at', js: 'deleted_at', typ: null },
      { json: 'track_order_url_template', js: 'track_order_url_template', typ: u(null, '') },
      { json: 'description', js: 'description', typ: u(null, '') },
      { json: 'checkout_url_template', js: 'checkout_url_template', typ: null },
      { json: 'cart_url_template', js: 'cart_url_template', typ: null },
      { json: 'business_url_template', js: 'business_url_template', typ: null },
      { json: 'category_url_template', js: 'category_url_template', typ: null },
      { json: 'product_url_template', js: 'product_url_template', typ: null },
      { json: 'profile_url_template', js: 'profile_url_template', typ: null },
      { json: 'robots_rules', js: 'robots_rules', typ: null },
      { json: 'sitemap_urls', js: 'sitemap_urls', typ: null },
      { json: 'domain', js: 'domain', typ: null },
      { json: 'ssl_setup_type', js: 'ssl_setup_type', typ: '' },
      { json: 'ssl_certificate_id', js: 'ssl_certificate_id', typ: null },
      { json: 'ssl_status', js: 'ssl_status', typ: '' },
      { json: 'ssl_process_type', js: 'ssl_process_type', typ: '' },
      { json: 'ssl_process_status', js: 'ssl_process_status', typ: '' },
      { json: 'ssl_error_type', js: 'ssl_error_type', typ: null },
      { json: 'ssl_attempts', js: 'ssl_attempts', typ: 0 },
      { json: 'ssl_certificate_file', js: 'ssl_certificate_file', typ: null },
      { json: 'ssl_private_key_file', js: 'ssl_private_key_file', typ: null },
      { json: 'ssl_ca_bundle_file', js: 'ssl_ca_bundle_file', typ: null },
      { json: 'ssl_valid_until', js: 'ssl_valid_until', typ: null },
      { json: 'type', js: 'type', typ: null },
      { json: 'image', js: 'image', typ: null },
      { json: 'pivot', js: 'pivot', typ: r('SitePivot') },
    ],
    false,
  ),
  SitePivot: o(
    [
      { json: 'menu_id', js: 'menu_id', typ: 0 },
      { json: 'site_id', js: 'site_id', typ: 0 },
    ],
    false,
  ),
  Metafield: o(
    [
      { json: 'id', js: 'id', typ: 0 },
      { json: 'object_id', js: 'object_id', typ: 0 },
      { json: 'model', js: 'model', typ: '' },
      { json: 'key', js: 'key', typ: '' },
      { json: 'value', js: 'value', typ: '' },
      { json: 'value_type', js: 'value_type', typ: r('ValueTypeEnum') },
      { json: 'created_at', js: 'created_at', typ: Date },
      { json: 'updated_at', js: 'updated_at', typ: Date },
    ],
    false,
  ),
  Offer: o(
    [
      { json: 'id', js: 'id', typ: 0 },
      { json: 'business_id', js: 'business_id', typ: 0 },
      { json: 'name', js: 'name', typ: '' },
      { json: 'type', js: 'type', typ: 0 },
      { json: 'minimum', js: 'minimum', typ: u(0, null) },
      { json: 'rate_type', js: 'rate_type', typ: 0 },
      { json: 'rate', js: 'rate', typ: 0 },
      { json: 'start', js: 'start', typ: Date },
      { json: 'end', js: 'end', typ: Date },
      { json: 'coupon', js: 'coupon', typ: u(null, '') },
      { json: 'limit', js: 'limit', typ: u(0, null) },
      { json: 'enabled', js: 'enabled', typ: true },
      { json: 'image', js: 'image', typ: null },
      { json: 'description', js: 'description', typ: u(null, '') },
      { json: 'label', js: 'label', typ: null },
      { json: 'rank', js: 'rank', typ: null },
      { json: 'condition_type', js: 'condition_type', typ: 0 },
      { json: 'target', js: 'target', typ: 0 },
      { json: 'max_discount', js: 'max_discount', typ: null },
      { json: 'stackable', js: 'stackable', typ: true },
      { json: 'auto', js: 'auto', typ: true },
      { json: 'public', js: 'public', typ: true },
      { json: 'order_priority', js: 'order_priority', typ: null },
      { json: 'schedule', js: 'schedule', typ: null },
      { json: 'limit_per_user', js: 'limit_per_user', typ: null },
      { json: 'user_order_count', js: 'user_order_count', typ: null },
      { json: 'user_order_count_condition', js: 'user_order_count_condition', typ: null },
      { json: 'order_types_allowed', js: 'order_types_allowed', typ: null },
      {
        json: 'valid_from_after_user_last_order_minutes',
        js: 'valid_from_after_user_last_order_minutes',
        typ: null,
      },
      {
        json: 'valid_until_after_user_last_order_minutes',
        js: 'valid_until_after_user_last_order_minutes',
        typ: null,
      },
      { json: 'include_products_with_offer', js: 'include_products_with_offer', typ: true },
      { json: 'external_id', js: 'external_id', typ: null },
      { json: 'include_options', js: 'include_options', typ: true },
    ],
    false,
  ),
  Owner: o(
    [
      { json: 'id', js: 'id', typ: 0 },
      { json: 'name', js: 'name', typ: '' },
      { json: 'lastname', js: 'lastname', typ: '' },
      { json: 'email', js: 'email', typ: '' },
      { json: 'login_type', js: 'login_type', typ: 0 },
      { json: 'social_id', js: 'social_id', typ: null },
      { json: 'photo', js: 'photo', typ: u(null, '') },
      { json: 'birthdate', js: 'birthdate', typ: null },
      { json: 'phone', js: 'phone', typ: null },
      { json: 'cellphone', js: 'cellphone', typ: u(null, '') },
      { json: 'city_id', js: 'city_id', typ: u(0, null) },
      { json: 'dropdown_option_id', js: 'dropdown_option_id', typ: null },
      { json: 'address', js: 'address', typ: u(null, '') },
      { json: 'address_notes', js: 'address_notes', typ: null },
      { json: 'zipcode', js: 'zipcode', typ: u(null, '') },
      { json: 'location', js: 'location', typ: u(r('CenterClass'), null) },
      { json: 'level', js: 'level', typ: 0 },
      { json: 'language_id', js: 'language_id', typ: 0 },
      { json: 'push_notifications', js: 'push_notifications', typ: true },
      { json: 'busy', js: 'busy', typ: true },
      { json: 'available', js: 'available', typ: true },
      { json: 'enabled', js: 'enabled', typ: true },
      { json: 'created_at', js: 'created_at', typ: Date },
      { json: 'updated_at', js: 'updated_at', typ: Date },
      { json: 'deleted_at', js: 'deleted_at', typ: null },
      { json: 'internal_number', js: 'internal_number', typ: null },
      { json: 'map_data', js: 'map_data', typ: null },
      { json: 'middle_name', js: 'middle_name', typ: null },
      { json: 'second_lastname', js: 'second_lastname', typ: null },
      { json: 'country_phone_code', js: 'country_phone_code', typ: u(null, '') },
      { json: 'priority', js: 'priority', typ: 0 },
      { json: 'last_order_assigned_at', js: 'last_order_assigned_at', typ: null },
      { json: 'last_location_at', js: 'last_location_at', typ: null },
      { json: 'phone_verified', js: 'phone_verified', typ: true },
      { json: 'email_verified', js: 'email_verified', typ: true },
      { json: 'driver_zone_restriction', js: 'driver_zone_restriction', typ: true },
      { json: 'pin', js: 'pin', typ: null },
      { json: 'business_id', js: 'business_id', typ: null },
      { json: 'franchise_id', js: 'franchise_id', typ: null },
      { json: 'register_site_id', js: 'register_site_id', typ: null },
      { json: 'ideal_orders', js: 'ideal_orders', typ: null },
      { json: 'external_id', js: 'external_id', typ: null },
      { json: 'settings', js: 'settings', typ: r('Settings') },
      { json: 'loyalty_level_id', js: 'loyalty_level_id', typ: u(0, null) },
      { json: 'loyalty_level_points', js: 'loyalty_level_points', typ: 0 },
      { json: 'country_code', js: 'country_code', typ: null },
      { json: 'session_strategy', js: 'session_strategy', typ: r('SessionStrategy') },
      { json: 'schedule', js: 'schedule', typ: null },
      { json: 'schedule_ranges', js: 'schedule_ranges', typ: null },
      { json: 'max_days_in_future', js: 'max_days_in_future', typ: null },
      { json: 'occupation_id', js: 'occupation_id', typ: null },
      { json: 'bio', js: 'bio', typ: null },
      { json: 'last_service_assigned_at', js: 'last_service_assigned_at', typ: null },
      { json: 'timezone', js: 'timezone', typ: null },
      { json: 'user_system_id', js: 'user_system_id', typ: null },
      { json: 'platform', js: 'platform', typ: r('Platform') },
      { json: 'loyalty_id', js: 'loyalty_id', typ: null },
      { json: 'guest_id', js: 'guest_id', typ: null },
      { json: 'last_available_at', js: 'last_available_at', typ: null },
      { json: 'mono_session', js: 'mono_session', typ: true },
      { json: 'guest_cellphone', js: 'guest_cellphone', typ: null },
      { json: 'guest_email', js: 'guest_email', typ: null },
      { json: 'available_until', js: 'available_until', typ: null },
      { json: 'protected', js: 'protected', typ: true },
      { json: 'pivot', js: 'pivot', typ: r('OwnerPivot') },
    ],
    false,
  ),
  CenterClass: o(
    [
      { json: 'lat', js: 'lat', typ: u(undefined, 3.14) },
      { json: 'lng', js: 'lng', typ: u(undefined, 3.14) },
    ],
    false,
  ),
  OwnerPivot: o(
    [
      { json: 'business_id', js: 'business_id', typ: 0 },
      { json: 'owner_id', js: 'owner_id', typ: 0 },
    ],
    false,
  ),
  Settings: o(
    [
      { json: 'email', js: 'email', typ: r('Email') },
      { json: 'notification', js: 'notification', typ: r('Email') },
      { json: 'sms', js: 'sms', typ: r('Email') },
    ],
    false,
  ),
  Email: o(
    [
      { json: 'newsletter', js: 'newsletter', typ: true },
      { json: 'promotions', js: 'promotions', typ: true },
    ],
    false,
  ),
  PaymethodElement: o(
    [
      { json: 'id', js: 'id', typ: 0 },
      { json: 'paymethod_id', js: 'paymethod_id', typ: 0 },
      { json: 'business_id', js: 'business_id', typ: 0 },
      { json: 'sandbox', js: 'sandbox', typ: true },
      { json: 'data', js: 'data', typ: u(r('PaymethodData'), null) },
      { json: 'data_sandbox', js: 'data_sandbox', typ: u(r('EtaStatusTimes'), null) },
      { json: 'enabled', js: 'enabled', typ: true },
      { json: 'created_at', js: 'created_at', typ: Date },
      { json: 'updated_at', js: 'updated_at', typ: Date },
      { json: 'allowed_order_types', js: 'allowed_order_types', typ: u(a(0), null) },
      { json: 'maximun', js: 'maximun', typ: null },
      { json: 'paymethod', js: 'paymethod', typ: r('PaymethodPaymethod') },
    ],
    false,
  ),
  PaymethodData: o(
    [
      { json: 'publishable', js: 'publishable', typ: '' },
      { json: 'secret', js: 'secret', typ: '' },
    ],
    false,
  ),
  PaymethodPaymethod: o(
    [
      { json: 'id', js: 'id', typ: 0 },
      { json: 'name', js: 'name', typ: '' },
      { json: 'gateway', js: 'gateway', typ: '' },
      { json: 'enabled', js: 'enabled', typ: true },
      { json: 'deleted_at', js: 'deleted_at', typ: null },
      { json: 'created_at', js: 'created_at', typ: u(Date, null) },
      { json: 'updated_at', js: 'updated_at', typ: u(Date, null) },
      { json: 'plugin_id', js: 'plugin_id', typ: u(0, null) },
      { json: 'allow_with_zero_balance', js: 'allow_with_zero_balance', typ: true },
    ],
    false,
  ),
  Reviews: o(
    [
      { json: 'reviews', js: 'reviews', typ: a(r('Review')) },
      { json: 'quality', js: 'quality', typ: 3.14 },
      { json: 'delivery', js: 'delivery', typ: 3.14 },
      { json: 'service', js: 'service', typ: 3.14 },
      { json: 'package', js: 'package', typ: 3.14 },
      { json: 'total', js: 'total', typ: 3.14 },
    ],
    false,
  ),
  Review: o(
    [
      { json: 'id', js: 'id', typ: 0 },
      { json: 'order_id', js: 'order_id', typ: 0 },
      { json: 'quality', js: 'quality', typ: 0 },
      { json: 'delivery', js: 'delivery', typ: 0 },
      { json: 'service', js: 'service', typ: 0 },
      { json: 'package', js: 'package', typ: 0 },
      { json: 'user_id', js: 'user_id', typ: 0 },
      { json: 'comment', js: 'comment', typ: '' },
      { json: 'enabled', js: 'enabled', typ: true },
      { json: 'created_at', js: 'created_at', typ: Date },
      { json: 'updated_at', js: 'updated_at', typ: Date },
      { json: 'laravel_through_key', js: 'laravel_through_key', typ: 0 },
      { json: 'total', js: 'total', typ: 0 },
      { json: 'user', js: 'user', typ: r('User') },
    ],
    false,
  ),
  User: o(
    [
      { json: 'id', js: 'id', typ: 0 },
      { json: 'name', js: 'name', typ: u(null, '') },
      { json: 'lastname', js: 'lastname', typ: u(null, '') },
      { json: 'email', js: 'email', typ: u(null, '') },
    ],
    false,
  ),
  Ribbon: o(
    [
      { json: 'id', js: 'id', typ: 0 },
      { json: 'object_id', js: 'object_id', typ: 0 },
      { json: 'model', js: 'model', typ: '' },
      { json: 'color', js: 'color', typ: '' },
      { json: 'shape', js: 'shape', typ: '' },
      { json: 'text', js: 'text', typ: '' },
      { json: 'created_at', js: 'created_at', typ: Date },
      { json: 'updated_at', js: 'updated_at', typ: Date },
      { json: 'enabled', js: 'enabled', typ: true },
    ],
    false,
  ),
  TypeElement: o(
    [
      { json: 'id', js: 'id', typ: 0 },
      { json: 'name', js: 'name', typ: '' },
      { json: 'image', js: 'image', typ: '' },
      { json: 'description', js: 'description', typ: '' },
      { json: 'enabled', js: 'enabled', typ: true },
      { json: 'created_at', js: 'created_at', typ: Date },
      { json: 'updated_at', js: 'updated_at', typ: Date },
    ],
    false,
  ),
  Zone: o(
    [
      { json: 'id', js: 'id', typ: 0 },
      { json: 'business_id', js: 'business_id', typ: 0 },
      { json: 'name', js: 'name', typ: '' },
      { json: 'type', js: 'type', typ: 0 },
      { json: 'address', js: 'address', typ: null },
      { json: 'data', js: 'data', typ: u(r('ZoneData'), null) },
      { json: 'dropdown_option_id', js: 'dropdown_option_id', typ: null },
      { json: 'price', js: 'price', typ: 3.14 },
      { json: 'minimum', js: 'minimum', typ: 0 },
      { json: 'schedule', js: 'schedule', typ: a(r('Today')) },
      { json: 'enabled', js: 'enabled', typ: true },
      { json: 'schedule_ranges', js: 'schedule_ranges', typ: '' },
      { json: 'data_geography', js: 'data_geography', typ: u(null, '') },
      { json: 'hourly_delivery_times', js: 'hourly_delivery_times', typ: null },
      { json: 'owner_type', js: 'owner_type', typ: '' },
      { json: 'snooze_until', js: 'snooze_until', typ: null },
      { json: 'businesses', js: 'businesses', typ: a(r('Business')) },
      { json: 'pivot', js: 'pivot', typ: r('ZonePivot') },
    ],
    false,
  ),
  ZoneData: o(
    [
      { json: 'center', js: 'center', typ: u(undefined, r('CenterClass')) },
      { json: 'radio', js: 'radio', typ: 3.14 },
    ],
    false,
  ),
  ZonePivot: o(
    [
      { json: 'business_id', js: 'business_id', typ: 0 },
      { json: 'delivery_zone_id', js: 'delivery_zone_id', typ: 0 },
    ],
    false,
  ),
  ExtraName: ['Extra', 'Remove something?', 'Size'],
  OptionName: ['Hamburger', 'Remove something?', 'Size'],
  SuboptionName: ['Big', 'Demo', 'Glutenfree', 'Large', 'Medium', 'Small', 'Test'],
  LoadType: ['normal'],
  ProductType: ['item'],
  Slug: ['chicker_burger', 'classic_burger', 'dessert', 'drink', 'test_slug'],
  ValueTypeEnum: ['date', 'select', 'text'],
  Text: ['NO', 'YES'],
  Platform: ['core'],
  SessionStrategy: ['jwt_session'],
};
