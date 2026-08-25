export interface Event {
    id: string;
    title: string;
    date: string;
    time: string;
    location: string;
    shortDescription: string;
    fullDescription: string;
    imageUrl?: string;
    whatToExpect: string[];
    availability: 'Available' | 'Full' | 'Filling Fast';
    registered: boolean;
}

export interface Trip {
    id: string;
    destination: string;
    date: string;
    duration: string;
    description: string;
    availability: 'Available' | 'Full';
    transportation: string;
    imageUrl?: string;
}

export const mockEvents: Event[] = [
    {
        id: '1',
        title: 'Yoga for Seniors',
        date: 'Wednesday, Oct 25',
        time: '08:00 AM',
        location: 'Community Center Park',
        shortDescription: 'Gentle yoga session focusing on joint mobility.',
        fullDescription: 'Join our certified instructor for a gentle yoga session designed specifically for seniors. Focus will be on joint mobility, balance, and breathing.',
        whatToExpect: ['Light stretching', 'Breathing exercises', 'Social mixing'],
        availability: 'Available',
        registered: false,
    },
    {
        id: '2',
        title: 'Technology Workshop',
        date: 'Friday, Oct 27',
        time: '10:30 AM',
        location: 'Main Library Room A',
        shortDescription: 'Learn how to use video calling apps to connect with family.',
        fullDescription: 'A hands-on workshop teaching basics of smartphones, WhatsApp, and Zoom calls to stay connected with your loved ones.',
        whatToExpect: ['Setting up WhatsApp', 'Making Zoom calls', 'Safety online'],
        availability: 'Filling Fast',
        registered: true,
    }
];

export const mockTrips: Trip[] = [
    {
        id: '1',
        destination: 'Botanical Gardens',
        date: 'Sunday, Nov 5',
        duration: '4 Hours',
        description: 'A guided tour of the city Botanical Gardens with special accessibility transport provided.',
        availability: 'Available',
        transportation: 'Wheelchair-friendly AC Bus',
    }
];

export const mockAgeWellLife = [
    { id: '1', category: 'Articles', title: '10 Tips for Better Sleep', readTime: '5 min' },
    { id: '2', category: 'Puzzles', title: 'Daily Sudoku - Medium', tags: ['Brain Training'] },
    { id: '3', category: 'Music', title: 'Classic Hits from the 70s', duration: '1h 20m' },
];
