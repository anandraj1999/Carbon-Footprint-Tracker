/**
 * CO2 emission factors per unit.
 * Sources: IPCC, EPA, Our World in Data estimates.
 * Units: kg CO2e per unit of activity
 */
export const CO2_FACTORS: Record<string, Record<string, number>> = {
  transportation: {
    car_gasoline: 0.192,    // kg CO2 per km
    car_electric: 0.053,    // kg CO2 per km (grid avg)
    bus: 0.089,             // kg CO2 per km
    train: 0.041,           // kg CO2 per km
    flight_short: 0.255,    // kg CO2 per km (<1500km)
    flight_long: 0.195,     // kg CO2 per km (>1500km)
    motorcycle: 0.113,      // kg CO2 per km
  },
  food: {
    beef: 27.0,             // kg CO2 per kg
    chicken: 6.9,           // kg CO2 per kg
    pork: 12.1,             // kg CO2 per kg
    fish: 6.1,              // kg CO2 per kg
    vegetables: 2.0,        // kg CO2 per kg
    dairy: 3.2,             // kg CO2 per kg (milk equivalent)
  },
  energy: {
    electricity: 0.233,     // kg CO2 per kWh (grid avg)
    natural_gas: 0.203,     // kg CO2 per kWh
    heating_oil: 2.68,      // kg CO2 per litre
  },
  shopping: {
    clothing: 0.033,        // kg CO2 per USD spent
    electronics: 0.067,     // kg CO2 per USD spent
    furniture: 0.025,       // kg CO2 per USD spent
    general: 0.020,         // kg CO2 per USD spent
  },
};

export function calculateCo2Kg(
  category: string,
  activityType: string,
  amount: number
): number {
  const factor = CO2_FACTORS[category]?.[activityType];
  if (factor === undefined) return 0;
  return Math.round(factor * amount * 100) / 100;
}
