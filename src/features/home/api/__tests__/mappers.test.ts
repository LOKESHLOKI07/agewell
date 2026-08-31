import { seniorDisplayName, toSeniorProfile } from '../mappers';

describe('senior profile mapping', () => {
  it('uses first_name and last_name from the API, not a hardcoded mock name', () => {
    const senior = toSeniorProfile({
      id: '0b3922d7-6ec2-4810-a259-58d0ec262f69',
      user_id: 'dcc9a1f0-16eb-4c52-aab3-ea0e4bff847c',
      first_name: 'John',
      last_name: 'Doe',
      date_of_birth: '1940-01-01',
      address: '123',
      emergency_contact: '911',
    });

    expect(seniorDisplayName(senior)).toBe('John Doe');
    expect(seniorDisplayName(senior)).not.toContain('Meera');
    expect(senior.photo).toBeNull();
  });

  it('maps a saved profile photo from GET /seniors/me', () => {
    const senior = toSeniorProfile({
      id: '0b3922d7-6ec2-4810-a259-58d0ec262f69',
      user_id: 'dcc9a1f0-16eb-4c52-aab3-ea0e4bff847c',
      first_name: 'John',
      last_name: 'Doe',
      date_of_birth: '1940-01-01',
      address: '123',
      emergency_contact: '911',
      photo: 'data:image/jpeg;base64,abcd',
    });
    expect(senior.photo).toBe('data:image/jpeg;base64,abcd');
  });

  it('does not repeat a one-word full name', () => {
    const senior = toSeniorProfile({
      id: '0b3922d7-6ec2-4810-a259-58d0ec262f69',
      user_id: 'dcc9a1f0-16eb-4c52-aab3-ea0e4bff847c',
      first_name: 'lokesh',
      last_name: 'lokesh',
      date_of_birth: '1990-01-01',
      address: 'Kandivali',
      emergency_contact: '911',
    });
    expect(seniorDisplayName(senior)).toBe('lokesh');
  });
});
