export interface AddOn {
    id: string;
    category: 'CARE' | 'FOOD' | 'DAILY LIFE' | 'TRANSPORT' | 'HEALTHCARE' | 'HOME';
    title: string;
    description: string;
    price: string;
    estimatedTime?: string;
}

export const mockAddOns: AddOn[] = [
    { id: '1', category: 'CARE', title: 'Additional Companion Hours', description: 'Extend care companion visit by 2 hours.', price: '₹500' },
    { id: '2', category: 'CARE', title: 'Hospital Companion', description: 'Trained assistant for hospital visits.', price: '₹1200 / visit' },
    { id: '3', category: 'FOOD', title: 'Premium Festival Meal', description: 'Special course meal for upcoming festival.', price: '₹350' },
    { id: '4', category: 'DAILY LIFE', title: 'Shopping Assistance', description: 'Help with local market shopping.', price: '₹400', estimatedTime: '2 hrs' },
    { id: '5', category: 'TRANSPORT', title: 'Doctor Visit Transport', description: 'Wheelchair-friendly AC cab round trip.', price: '₹800' },
    { id: '6', category: 'HEALTHCARE', title: 'At-home Physiotherapy', description: '1-hour expert physiotherapy session.', price: '₹750 / session' },
    { id: '7', category: 'HOME', title: 'Bathroom Grab Bars Fitting', description: 'Safety handles supply and installation.', price: '₹2500' },
];
