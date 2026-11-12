import { Image } from 'expo-image';
import { Avatar } from 'react-native-paper';

import { avatarTone, theme } from '@/lib/theme';

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const last = parts[parts.length - 1][0];
  return (parts.length > 1 ? parts[0][0] + last : last).toUpperCase();
}

type Props = { image: string; name: string; seed?: string; size?: number };

export function GvAvatar({ image, name, seed, size = 44 }: Props) {
  if (image) {
    return (
      <Image
        source={{ uri: image }}
        style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: theme.colors.surfaceVariant }}
        contentFit="cover"
        accessibilityLabel={`Ảnh của ${name}`}
      />
    );
  }
  const tone = avatarTone(seed || name);
  return (
    <Avatar.Text
      size={size}
      label={initials(name)}
      style={{ backgroundColor: tone.bg }}
      color={tone.fg}
      labelStyle={{ fontSize: Math.round(size * 0.36), fontWeight: '600', letterSpacing: 0.5 }}
    />
  );
}
