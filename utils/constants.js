export const COUNTRY_CODES = [
    { name: "United States", code: "US", dial_code: "+1" },
    { name: "United Kingdom", code: "GB", dial_code: "+44" },
    { name: "Canada", code: "CA", dial_code: "+1" },
    { name: "Australia", code: "AU", dial_code: "+61" },
    { name: "Germany", code: "DE", dial_code: "+49" },
    { name: "France", code: "FR", dial_code: "+33" },
    { name: "India", code: "IN", dial_code: "+91" },
    { name: "Pakistan", code: "PK", dial_code: "+92" },
    { name: "China", code: "CN", dial_code: "+86" },
    { name: "Japan", code: "JP", dial_code: "+81" },
    { name: "Brazil", code: "BR", dial_code: "+55" },
    { name: "Mexico", code: "MX", dial_code: "+52" },
    { name: "Russia", code: "RU", dial_code: "+7" },
    { name: "Saudi Arabia", code: "SA", dial_code: "+966" },
    { name: "United Arab Emirates", code: "AE", dial_code: "+971" },
    // Add more as needed
];

/** Country names for location dropdown (select only – no free text). Sorted A–Z. */
export const COUNTRIES_FOR_LOCATION = [
    'Australia', 'Bangladesh', 'Brazil', 'Canada', 'China', 'Egypt', 'France', 'Germany',
    'India', 'Indonesia', 'Iran', 'Iraq', 'Italy', 'Japan', 'Jordan', 'Kuwait', 'Malaysia',
    'Mexico', 'Nepal', 'Nigeria', 'Oman', 'Pakistan', 'Philippines', 'Qatar', 'Russia',
    'Saudi Arabia', 'South Africa', 'Spain', 'Sri Lanka', 'Turkey', 'United Arab Emirates',
    'United Kingdom', 'United States', 'Vietnam', 'Yemen',
].sort((a, b) => a.localeCompare(b));

// Fiverr-style: region-based payment methods (short labels, no long descriptions)
export const PAYMENT_REGIONS = [
    { value: 'SAUDI_ARABIA', label: 'Saudi Arabia (Main)' },
    { value: 'GLOBAL', label: 'Global' },
];

export const REGION_PAYMENT_METHODS = {
    SAUDI_ARABIA: [
        { id: 'mada_hyperpay', label: 'Mada (HyperPay)' },
        { id: 'moyasar', label: 'Moyasar' },
        { id: 'paytabs', label: 'PayTabs' },
        { id: 'stripe', label: 'Stripe' },
    ],
    GLOBAL: [
        { id: 'paypal', label: 'PayPal' },
        { id: 'stripe', label: 'Stripe' },
        { id: 'credit_card', label: 'Credit / Debit Card' },
        { id: 'bank_transfer', label: 'Bank Transfer' },
    ],
};

export function getPaymentMethodsByRegion(region) {
    return REGION_PAYMENT_METHODS[region] || REGION_PAYMENT_METHODS.GLOBAL;
}

export const CURRENCIES = [
    { code: "USD", symbol: "$" },
    { code: "EUR", symbol: "€" },
    { code: "GBP", symbol: "£" },
    { code: "CAD", symbol: "$" },
    { code: "AUD", symbol: "$" },
    { code: "JPY", symbol: "¥" },
    { code: "CNY", symbol: "¥" },
    { code: "INR", symbol: "₹" },
    { code: "PKR", symbol: "Rs" },
    { code: "AED", symbol: "Dh" },
    { code: "SAR", symbol: "SR" },
];
