import React from "react";
import { View, Text } from "react-native";

import RubyBadge     from "@/components/badges/RubyBadge";
import DiamondBadge  from "@/components/badges/DiamondBadge";
import PlatinumBadge from "@/components/badges/PlatinumBadge";
import GoldBadge     from "@/components/badges/GoldBadge";
import SilverBadge   from "@/components/badges/SilverBadge";
import BronzeBadge   from "@/components/badges/BronzeBadge";
import IronBadge     from "@/components/badges/IronBadge";

const BADGE_MAP: Record<string, React.FC<{ size?: number }>> = {
  Ruby:     RubyBadge,
  Diamond:  DiamondBadge,
  Platinum: PlatinumBadge,
  Gold:     GoldBadge,
  Silver:   SilverBadge,
  Bronze:   BronzeBadge,
  Iron:     IronBadge,
};

interface Props {
  rank: string;
  size?: number;
  showLabel?: boolean;
}

export function RankBadge({ rank, size = 48, showLabel = false }: Props) {
  const BadgeComponent = BADGE_MAP[rank];

  return (
    <View className="items-center gap-xs">
      {BadgeComponent ? (
        <BadgeComponent size={size} />
      ) : (
        <View
          style={{ width: size, height: size, borderRadius: size * 0.25 }}
          className="bg-canvas-soft items-center justify-center"
        >
          <Text style={{ fontSize: size * 0.35, fontWeight: "900" }}>
            {rank[0]}
          </Text>
        </View>
      )}
      {showLabel && (
        <Text className="text-xs font-sans-semibold text-body">{rank}</Text>
      )}
    </View>
  );
}
