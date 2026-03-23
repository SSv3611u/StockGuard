export interface Profile {
  id: string
  full_name: string | null
  username: string | null
  bio: string | null
  avatar_url: string | null
  phone_number: string | null
  shop_name: string | null
  business_category: string | null
  shop_address: string | null
  gst_number: string | null
  created_at: string
  updated_at: string
}

export interface ProfileFormData {
  full_name: string
  username: string
  bio: string
  phone_number: string
  shop_name: string
  business_category: string
  shop_address: string
  gst_number: string
}

export const BUSINESS_CATEGORIES = [
  { value: 'pharmacy', label: 'Pharmacy / Medical Store', labelHi: 'फार्मेसी / मेडिकल स्टोर' },
  { value: 'grocery', label: 'Grocery / Kirana', labelHi: 'किराना / ग्रोसरी' },
  { value: 'electronics', label: 'Electronics', labelHi: 'इलेक्ट्रॉनिक्स' },
  { value: 'clothing', label: 'Clothing / Garments', labelHi: 'कपड़े / गारमेंट्स' },
  { value: 'stationery', label: 'Stationery / Books', labelHi: 'स्टेशनरी / किताबें' },
  { value: 'hardware', label: 'Hardware / Tools', labelHi: 'हार्डवेयर / उपकरण' },
  { value: 'cosmetics', label: 'Cosmetics / Beauty', labelHi: 'कॉस्मेटिक्स / ब्यूटी' },
  { value: 'fmcg', label: 'FMCG / Daily Essentials', labelHi: 'FMCG / दैनिक ज़रूरतें' },
  { value: 'other', label: 'Other', labelHi: 'अन्य' },
] as const
