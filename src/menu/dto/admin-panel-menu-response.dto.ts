
export interface MunchiMenuResponse {
  error:  boolean;
  result: Result;
}

export interface Result {
  id:                             number;
  name:                           string;
  email:                          string;
  slug:                           string;
  schedule:                       Today[];
  description:                    string;
  about:                          string;
  logo:                           string;
  header:                         string;
  phone:                          string;
  cellphone:                      null;
  owner_id:                       number;
  city_id:                        number;
  address:                        string;
  address_notes:                  null;
  zipcode:                        null;
  location:                       ResultLocation;
  featured:                       boolean;
  timezone:                       string;
  currency:                       string;
  food:                           boolean;
  alcohol:                        boolean;
  groceries:                      boolean;
  laundry:                        boolean;
  use_printer:                    boolean;
  printer_id:                     number;
  minimum:                        number;
  delivery_price:                 number;
  always_deliver:                 boolean;
  tax_type:                       number;
  tax:                            number;
  delivery_time:                  string;
  pickup_time:                    string;
  service_fee:                    number;
  fixed_usage_fee:                number;
  percentage_usage_fee:           number;
  order_default_priority:         number;
  cancel_order_after_minutes:     number;
  enabled:                        boolean;
  preorder_time:                  number;
  maximum:                        null;
  schedule_ranges:                string;
  franchise_id:                   null;
  external_id:                    string;
  front_layout:                   string;
  seo_image:                      null;
  seo_title:                      null;
  seo_description:                null;
  eta_status_times:               EtaStatusTimes;
  eta_variation_time:             null;
  price_level:                    string;
  facebook_profile:               null;
  instagram_profile:              string;
  tiktok_profile:                 null;
  snapchat_profile:               null;
  pinterest_profile:              null;
  whatsapp_number:                null;
  delivery_tax_rate:              number;
  delivery_tax_type:              number;
  disabled_reason:                null;
  snooze_until:                   null;
  menus_count:                    number;
  available_menus_count:          number;
  menus_shared_count:             number;
  available_menus_shared_count:   number;
  map_marker:                     string;
  map_marker_sm:                  string;
  logo_url:                       string;
  font_family:                    string;
  layout:                         string;
  primary_color:                  string;
  background_color:               string;
  showLocator:                    string;
  professionals:                  any[];
  configs:                        Config[];
  checkoutfields:                 { [key: string]: Checkoutfield };
  reviews:                        Reviews;
  open:                           boolean;
  today:                          Today;
  lazy_load_products_recommended: boolean;
  available_products_count:       number;
  valid_service:                  boolean;
  num_zones:                      number;
  types:                          TypeElement[];
  metafields:                     Metafield[];
  owners:                         Owner[];
  gallery:                        Gallery[];
  city:                           City;
  webhooks:                       any[];
  extras:                         Extra[];
  maximums:                       any[];
  paymethods:                     PaymethodElement[];
  ribbon:                         Ribbon;
  drivergroups:                   Drivergroup[];
  menus:                          Menu[];
  menus_shared:                   any[];
  categories:                     Category[];
  categories_shared:              any[];
  zones:                          Zone[];
  offers:                         Offer[];
}

export interface CategoryProduct {
  id:                        number;
  name:                      string;
  price:                     number;
  description:               null | string;
  images?:                   null | string;
  sku:                       null;
  category_id:               number;
  inventoried:               boolean;
  quantity:                  number;
  featured:                  boolean;
  enabled:                   boolean;
  upselling:                 boolean;
  in_offer:                  boolean;
  offer_price:               number | null;
  rank:                      number;
  offer_rate:                number;
  offer_rate_type:           number;
  offer_include_options:     boolean;
  external_id:               null | string;
  barcode:                   null;
  barcode_alternative:       null;
  estimated_person:          null;
  tax_id:                    number | null;
  fee_id:                    null;
  slug:                      null | string;
  seo_image:                 null;
  seo_title:                 null;
  seo_description:           null;
  seo_keywords:              null;
  cost_price:                null;
  cost_offer_price:          number | null;
  weight:                    null;
  calories:                  number | null;
  weight_unit:               null | string;
  hide_special_instructions: boolean;
  maximum_per_order:         null;
  minimum_per_order:         number;
  duration:                  null;
  type:                      string;
  load_type:                 string;
  updated_at:                Date | null;
  created_at:                Date | null;
  deleted_at:                null;
  is_hidden:                 boolean;
  snooze_until:              null;
  tags:                      any[];
  extras:                    Extra[];
  ingredients:               Ingredient[];
  gallery:                   any[];
  tax?:                      Tax | null;
  fee?:                      null;
  ribbon?:                   null;
  pivot?:                    ProductPivot;
  category?:                 Category;
}

export interface Category {
  id:                 number;
  business_id:        number;
  name?:              string;
  image:              null | string;
  rank:               number;
  enabled:            boolean;
  external_id:        null | string;
  parent_category_id: number | null;
  slug:               string | null;
  seo_image:          null;
  seo_title:          null;
  seo_description:    null;
  header:             null | string;
  description:        null | string;
  snooze_until:       null;
  products?:          CategoryProduct[];
  businesses?:        any[];
  ribbon:             null;
  subcategories?:     Subcategory[];
}

export interface Extra {
  id:           number;
  business_id:  number;
  name:         string;
  description:  null;
  enabled:      boolean;
  external_id:  null | string;
  rank:         number;
  snooze_until: null;
  pivot?:       ExtraPivot;
  options:      ExtraOption[];
}

export interface ExtraOption {
  id:                       number;
  extra_id:                 number;
  name:                     string;
  image:                    null;
  conditioned:              boolean;
  respect_to:               number | null;
  min:                      number;
  max:                      number;
  rank:                     number;
  with_half_option:         boolean;
  allow_suboption_quantity: boolean;
  limit_suboptions_by_max:  boolean;
  enabled:                  boolean;
  external_id:              null;
  snooze_until:             null;
  suboptions:               Suboption[];
}

export interface Suboption {
  id:              number;
  extra_option_id: number;
  name:            string;
  price:           number;
  image:           null;
  sku:             null;
  rank:            number;
  description:     null;
  max:             number;
  half_price:      number | null;
  enabled:         boolean;
  external_id:     null;
  preselected:     boolean;
  snooze_until:    null;
}

export interface ExtraPivot {
  product_id: number;
  extra_id:   number;
}

export interface Ingredient {
  id:         number;
  product_id: number;
  name:       string;
  image:      null;
}

export interface ProductPivot {
  menu_id:    number;
  product_id: number;
}

export interface Tax {
  id:          number;
  name:        string;
  description: string;
  rate:        number;
  type:        number;
  external_id: null;
}

export interface Subcategory {
  id:                 number;
  business_id:        number;
  name:               string;
  image:              null;
  rank:               number;
  enabled:            boolean;
  external_id:        null;
  parent_category_id: number;
  slug:               string;
  seo_image:          null;
  seo_title:          null;
  seo_description:    null;
  header:             null;
  description:        null;
  snooze_until:       null;
  products:           SubcategoryProduct[];
  businesses:         any[];
  subcategories:      any[];
  ribbon:             null;
}

export interface SubcategoryProduct {
  id:                        number;
  name:                      string;
  price:                     number;
  description:               null;
  images:                    null;
  sku:                       null;
  category_id:               number;
  inventoried:               boolean;
  quantity:                  number;
  featured:                  boolean;
  enabled:                   boolean;
  upselling:                 boolean;
  in_offer:                  boolean;
  offer_price:               null;
  rank:                      number;
  offer_rate:                number;
  offer_rate_type:           number;
  offer_include_options:     boolean;
  external_id:               null;
  barcode:                   null;
  barcode_alternative:       null;
  estimated_person:          null;
  tax_id:                    null;
  fee_id:                    null;
  slug:                      null | string;
  seo_image:                 null;
  seo_title:                 null;
  seo_description:           null;
  seo_keywords:              null;
  cost_price:                null;
  cost_offer_price:          null;
  weight:                    null;
  calories:                  null;
  weight_unit:               null;
  hide_special_instructions: boolean;
  maximum_per_order:         null;
  minimum_per_order:         number;
  duration:                  null;
  type:                      string;
  load_type:                 string;
  updated_at:                Date;
  created_at:                Date;
  deleted_at:                null;
  is_hidden:                 boolean;
  snooze_until:              null;
  tags:                      any[];
  extras:                    Extra[];
  ingredients:               any[];
  gallery:                   any[];
  tax:                       null;
  fee:                       null;
  ribbon:                    null;
}

export interface Checkoutfield {
  name:     string;
  type:     string;
  required: boolean;
  enabled:  boolean;
}

export interface City {
  id:               number;
  name:             string;
  country_id:       number;
  administrator_id: number;
  enabled:          boolean;
  country:          Country;
}

export interface Country {
  id:      number;
  name:    string;
  enabled: boolean;
  code:    null;
}

export interface Config {
  id:                         number;
  key:                        string;
  value:                      string;
  name:                       string;
  type:                       number;
  description:                string;
  enabled:                    boolean;
  public:                     boolean;
  config_category_id:         number;
  options:                    ConfigOption[] | null;
  rank:                       number | null;
  image:                      null;
  video:                      null;
  more_info:                  null;
  support_url:                null;
  protected:                  boolean;
  hidden:                     boolean;
  dependency_key:             null;
  dependency_value:           null;
  customizable:               boolean;
  can_replaced_by_businesses: boolean;
  can_replaced_by_sites:      boolean;
}

export interface ConfigOption {
  text:  Text;
  value: string;
}

export interface Drivergroup {
  id:               number;
  name:             string;
  administrator_id: number | null;
  enabled:          boolean;
  type:             number;
  pivot:            DrivergroupPivot;
}

export interface DrivergroupPivot {
  business_id:     number;
  driver_group_id: number;
}

export interface EtaStatusTimes {
}

export interface Gallery {
  id:          number;
  business_id: number;
  type:        number;
  file:        string;
  video:       null;
  title:       null;
  description: null;
  created_at:  Date;
  updated_at:  Date;
}

export interface ResultLocation {
  lat:     number;
  lng:     number;
  zipcode: string;
  zoom:    number;
}

export interface Menu {
  id:                    number;
  business_id:           number;
  name:                  string;
  comment:               null | string;
  schedule:              Today[];
  pickup:                boolean;
  delivery:              boolean;
  enabled:               boolean;
  eatin:                 boolean;
  curbside:              boolean;
  driver_thru:           boolean;
  schedule_ranges:       string;
  all_products:          boolean;
  use_business_schedule: boolean;
  external_id:           null;
  seat_delivery:         boolean;
  catering_delivery:     boolean;
  catering_pickup:       boolean;
  snooze_until:          null;
  reservation:           boolean;
  products:              CategoryProduct[];
  businesses:            Business[];
  sites:                 Site[];
}

export interface Business {
  id:   number;
  name: string;
}

export interface Today {
  enabled: boolean;
  lapses:  Lapse[];
}

export interface Lapse {
  open:  Close;
  close: Close;
}

export interface Close {
  hour:   number;
  minute: number;
}

export interface Site {
  id:                          number;
  name:                        string;
  code:                        string;
  url:                         null | string;
  logo:                        null;
  header:                      null;
  social_share:                null;
  reset_password_url_template: null | string;
  created_at:                  Date;
  updated_at:                  Date;
  deleted_at:                  null;
  track_order_url_template:    null | string;
  description:                 null | string;
  checkout_url_template:       null;
  cart_url_template:           null;
  business_url_template:       null;
  category_url_template:       null;
  product_url_template:        null;
  profile_url_template:        null;
  robots_rules:                null;
  sitemap_urls:                null;
  domain:                      null;
  ssl_setup_type:              string;
  ssl_certificate_id:          null;
  ssl_status:                  string;
  ssl_process_type:            string;
  ssl_process_status:          string;
  ssl_error_type:              null;
  ssl_attempts:                number;
  ssl_certificate_file:        null;
  ssl_private_key_file:        null;
  ssl_ca_bundle_file:          null;
  ssl_valid_until:             null;
  type:                        null;
  image:                       null;
  pivot:                       SitePivot;
}

export interface SitePivot {
  menu_id: number;
  site_id: number;
}

export interface Metafield {
  id:         number;
  object_id:  number;
  model:      string;
  key:        string;
  value:      string;
  value_type: string;
  created_at: Date;
  updated_at: Date;
}

export interface Offer {
  id:                                        number;
  business_id:                               number;
  name:                                      string;
  type:                                      number;
  minimum:                                   number | null;
  rate_type:                                 number;
  rate:                                      number;
  start:                                     Date;
  end:                                       Date;
  coupon:                                    null | string;
  limit:                                     number | null;
  enabled:                                   boolean;
  image:                                     null;
  description:                               null | string;
  label:                                     null;
  rank:                                      null;
  condition_type:                            number;
  target:                                    number;
  max_discount:                              null;
  stackable:                                 boolean;
  auto:                                      boolean;
  public:                                    boolean;
  order_priority:                            null;
  schedule:                                  null;
  limit_per_user:                            null;
  user_order_count:                          null;
  user_order_count_condition:                null;
  order_types_allowed:                       null;
  valid_from_after_user_last_order_minutes:  null;
  valid_until_after_user_last_order_minutes: null;
  include_products_with_offer:               boolean;
  external_id:                               null;
  include_options:                           boolean;
}

export interface Owner {
  id:                       number;
  name:                     string;
  lastname:                 string;
  email:                    string;
  login_type:               number;
  social_id:                null;
  photo:                    null | string;
  birthdate:                null;
  phone:                    null;
  cellphone:                null | string;
  city_id:                  number | null;
  dropdown_option_id:       null;
  address:                  null | string;
  address_notes:            null;
  zipcode:                  null | string;
  location:                 CenterClass | null;
  level:                    number;
  language_id:              number;
  push_notifications:       boolean;
  busy:                     boolean;
  available:                boolean;
  enabled:                  boolean;
  created_at:               Date;
  updated_at:               Date;
  deleted_at:               null;
  internal_number:          null;
  map_data:                 null;
  middle_name:              null;
  second_lastname:          null;
  country_phone_code:       null | string;
  priority:                 number;
  last_order_assigned_at:   null;
  last_location_at:         null;
  phone_verified:           boolean;
  email_verified:           boolean;
  driver_zone_restriction:  boolean;
  pin:                      null;
  business_id:              null;
  franchise_id:             null;
  register_site_id:         null;
  ideal_orders:             null;
  external_id:              null;
  settings:                 Settings;
  loyalty_level_id:         number | null;
  loyalty_level_points:     number;
  country_code:             null;
  session_strategy:         string;
  schedule:                 null;
  schedule_ranges:          null;
  max_days_in_future:       null;
  occupation_id:            null;
  bio:                      null;
  last_service_assigned_at: null;
  timezone:                 null;
  user_system_id:           null;
  platform:                 string;
  loyalty_id:               null;
  guest_id:                 null;
  last_available_at:        null;
  mono_session:             boolean;
  guest_cellphone:          null;
  guest_email:              null;
  available_until:          null;
  protected:                boolean;
  pivot:                    OwnerPivot;
}

export interface CenterClass {
  lat?: number;
  lng?: number;
}

export interface OwnerPivot {
  business_id: number;
  owner_id:    number;
}

export interface Settings {
  email:        Email;
  notification: Email;
  sms:          Email;
}

export interface Email {
  newsletter: boolean;
  promotions: boolean;
}

export interface PaymethodElement {
  id:                  number;
  paymethod_id:        number;
  business_id:         number;
  sandbox:             boolean;
  data:                PaymethodData | null;
  data_sandbox:        EtaStatusTimes | null;
  enabled:             boolean;
  created_at:          Date;
  updated_at:          Date;
  allowed_order_types: number[] | null;
  maximun:             null;
  paymethod:           PaymethodPaymethod;
}

export interface PaymethodData {
  publishable: string;
  secret:      string;
}

export interface PaymethodPaymethod {
  id:                      number;
  name:                    string;
  gateway:                 string;
  enabled:                 boolean;
  deleted_at:              null;
  created_at:              Date | null;
  updated_at:              Date | null;
  plugin_id:               number | null;
  allow_with_zero_balance: boolean;
}

export interface Reviews {
  reviews:  Review[];
  quality:  number;
  delivery: number;
  service:  number;
  package:  number;
  total:    number;
}

export interface Review {
  id:                  number;
  order_id:            number;
  quality:             number;
  delivery:            number;
  service:             number;
  package:             number;
  user_id:             number;
  comment?:            string;
  enabled:             boolean;
  created_at:          Date;
  updated_at:          Date;
  laravel_through_key: number;
  total:               number;
  user:                User;
}

export interface User {
  id:       number;
  name:     null | string;
  lastname: null | string;
  email:    null | string;
}

export interface Ribbon {
  id:         number;
  object_id:  number;
  model:      string;
  color:      string;
  shape:      string;
  text:       string;
  created_at: Date;
  updated_at: Date;
  enabled:    boolean;
}

export interface TypeElement {
  id:          number;
  name:        string;
  image:       string;
  description: string;
  enabled:     boolean;
  created_at:  Date;
  updated_at:  Date;
}

export interface Zone {
  id:                    number;
  business_id:           number;
  name:                  string;
  type:                  number;
  address:               null;
  data:                  ZoneData | null;
  dropdown_option_id:    null;
  price:                 number;
  minimum:               number;
  schedule:              Today[];
  enabled:               boolean;
  schedule_ranges:       string;
  data_geography:        null | string;
  hourly_delivery_times: null;
  owner_type:            string;
  snooze_until:          null;
  businesses:            Business[];
  pivot:                 ZonePivot;
}

export interface ZoneData {
  center?: CenterClass;
  radio:   number;
}

export interface ZonePivot {
  business_id:      number;
  delivery_zone_id: number;
}