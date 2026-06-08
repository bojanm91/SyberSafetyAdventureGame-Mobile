import type { ImageSourcePropType } from "react-native";

const AVATAR_IMAGES: Record<string, ImageSourcePropType> = {
  A: require("../assets/images/avatar_a.png"),
  B: require("../assets/images/avatar_b.png"),
  C: require("../assets/images/avatar_c.png"),
  D: require("../assets/images/avatar_d.png"),
};

export function avatarKey(base?: string | null) {
  const key = (base ?? "A").toUpperCase();
  return key in AVATAR_IMAGES ? key : "A";
}

export function getAvatarImage(base?: string | null) {
  return AVATAR_IMAGES[avatarKey(base)];
}
