import { displayRequestNotes, requestNotesTitle } from '../requestNotes';

describe('request notes for staff deliveries', () => {
  it('shows the typed grocery list without the prefix', () => {
    expect(displayRequestNotes('Typed grocery list:\nMilk\nBread')).toBe('Milk\nBread');
    expect(requestNotesTitle('grocery')).toBe('Shopping list');
  });

  it('keeps a prescription caption after stripping the upload prefix', () => {
    expect(displayRequestNotes('Prescription upload: Prescription photo')).toBe('Prescription photo');
    expect(requestNotesTitle('medicine')).toBe('Prescription');
  });
});
