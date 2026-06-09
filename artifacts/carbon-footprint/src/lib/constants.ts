export const CATEGORIES = ['transportation', 'food', 'energy', 'shopping'] as const;

export const CATEGORY_LABELS: Record<string, string> = {
  transportation: 'Transportation',
  food: 'Food & Diet',
  energy: 'Home Energy',
  shopping: 'Shopping & Goods'
};

export const ACTIVITY_TYPES: Record<string, { id: string, label: string, unit: string, factor: number }[]> = {
  transportation: [
    { id: 'car_gasoline', label: 'Car (Gasoline)', unit: 'km', factor: 0.192 },
    { id: 'car_electric', label: 'Car (Electric)', unit: 'km', factor: 0.053 },
    { id: 'bus', label: 'Bus', unit: 'km', factor: 0.105 },
    { id: 'train', label: 'Train', unit: 'km', factor: 0.041 },
    { id: 'flight_short', label: 'Flight (Short)', unit: 'km', factor: 0.255 },
    { id: 'flight_long', label: 'Flight (Long)', unit: 'km', factor: 0.150 },
    { id: 'motorcycle', label: 'Motorcycle', unit: 'km', factor: 0.109 },
  ],
  food: [
    { id: 'beef', label: 'Beef', unit: 'kg', factor: 27.0 },
    { id: 'chicken', label: 'Chicken', unit: 'kg', factor: 6.9 },
    { id: 'pork', label: 'Pork', unit: 'kg', factor: 12.1 },
    { id: 'fish', label: 'Fish', unit: 'kg', factor: 6.1 },
    { id: 'vegetables', label: 'Vegetables', unit: 'kg', factor: 2.0 },
    { id: 'dairy', label: 'Dairy', unit: 'kg', factor: 3.2 },
  ],
  energy: [
    { id: 'electricity', label: 'Electricity', unit: 'kWh', factor: 0.385 },
    { id: 'natural_gas', label: 'Natural Gas', unit: 'kWh', factor: 0.202 },
    { id: 'heating_oil', label: 'Heating Oil', unit: 'L', factor: 2.68 },
  ],
  shopping: [
    { id: 'clothing', label: 'Clothing', unit: 'usd', factor: 0.2 },
    { id: 'electronics', label: 'Electronics', unit: 'usd', factor: 0.3 },
    { id: 'furniture', label: 'Furniture', unit: 'usd', factor: 0.15 },
    { id: 'general', label: 'General', unit: 'usd', factor: 0.1 },
  ]
};
