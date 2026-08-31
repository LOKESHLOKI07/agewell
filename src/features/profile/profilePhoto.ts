import * as ImagePicker from 'expo-image-picker';

const MAX_PHOTO_CHARS = 700_000;

function toDataUrl(asset: ImagePicker.ImagePickerAsset): string {
  if (!asset.base64) {
    throw new Error('Unable to read that photo. Please try another image.');
  }
  const mime = asset.mimeType?.toLowerCase() || 'image/jpeg';
  const normalizedMime = mime === 'image/jpg' ? 'image/jpeg' : mime;
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(normalizedMime)) {
    throw new Error('Photo must be a JPEG, PNG, or WebP image.');
  }
  const dataUrl = `data:${normalizedMime};base64,${asset.base64}`;
  if (dataUrl.length > MAX_PHOTO_CHARS) {
    throw new Error('That photo is too large. Choose a smaller image.');
  }
  return dataUrl;
}

async function pickFrom(source: 'library' | 'camera'): Promise<string | null> {
  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
    base64: true,
  };
  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled || !result.assets?.[0]) {
    return null;
  }
  return toDataUrl(result.assets[0]);
}

export async function pickProfilePhoto(source: 'library' | 'camera'): Promise<string | null> {
  if (source === 'camera') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      throw new Error('Camera access is needed to take a profile photo.');
    }
  } else {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      throw new Error('Photo library access is needed to set a profile photo.');
    }
  }
  return pickFrom(source);
}
