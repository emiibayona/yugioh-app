import useCardImage from "@/hooks/useCardImage";
import { useEffect, useState } from "react";

import { Image } from "react-native";

export default function CardImage({
  name,
  cardId,
  style,
  item,
}: {
  name: string;
  cardId: string;
  style?: {};
  item?: null;
}) {
  const [imageSrc, setImageSrc] = useState(null);
  const { getCardImageUrl } = useCardImage();

  useEffect(() => {
    console.log("📸 Fetching image for:", { name });
    getCardImageUrl(name, cardId, item).then((uri) => setImageSrc(uri));
  }, [name, cardId]);

  return imageSrc ? (
    <Image
      source={{ uri: imageSrc }}
      style={{ width: 100, height: 140, ...style }}
    />
  ) : (
    <Image
      source={require("../assets/images/card-placeholder.jpg")}
      style={{ width: 100, height: 140, ...style }}
    />
  );
}
