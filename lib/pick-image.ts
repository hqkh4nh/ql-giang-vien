import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

// The Spark plan has no Cloud Storage, so images are downscaled and stored directly in the
// Image field as a base64 data URI (keeping each document under Firestore's 1 MB limit).
async function toDataUri(uri: string) {
  const ref = await ImageManipulator.manipulate(uri).resize({ width: 320 }).renderAsync();
  const result = await ref.saveAsync({ compress: 0.7, format: SaveFormat.JPEG, base64: true });
  return `data:image/jpeg;base64,${result.base64}`;
}

export async function pickImage(source: 'library' | 'camera'): Promise<string | null> {
  const permission =
    source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Ứng dụng chưa được cấp quyền truy cập ảnh/camera.');
  }

  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
  };
  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);

  if (result.canceled) return null;
  return toDataUri(result.assets[0].uri);
}
