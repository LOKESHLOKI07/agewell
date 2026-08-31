import * as ImagePicker from 'expo-image-picker';
import { pickProfilePhoto } from '../profilePhoto';

const mockedPicker = ImagePicker as jest.Mocked<typeof ImagePicker>;

describe('pickProfilePhoto', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedPicker.requestCameraPermissionsAsync.mockResolvedValue({ granted: true } as never);
    mockedPicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({ granted: true } as never);
  });

  it('returns a data URL from the photo library', async () => {
    mockedPicker.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///avatar.jpg', base64: 'abcd', mimeType: 'image/jpeg' }],
    } as never);

    await expect(pickProfilePhoto('library')).resolves.toBe('data:image/jpeg;base64,abcd');
  });

  it('returns null when the picker is cancelled', async () => {
    mockedPicker.launchCameraAsync.mockResolvedValue({ canceled: true, assets: null } as never);
    await expect(pickProfilePhoto('camera')).resolves.toBeNull();
  });

  it('rejects an oversized photo before upload', async () => {
    mockedPicker.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///big.jpg', base64: 'A'.repeat(700_000), mimeType: 'image/jpeg' }],
    } as never);

    await expect(pickProfilePhoto('library')).rejects.toThrow('too large');
  });
});
