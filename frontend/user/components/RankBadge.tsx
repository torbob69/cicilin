import React from "react";
import { View, Text } from "react-native";
import { SvgProps } from "react-native-svg";

import RubySvg     from "@/assets/badges/ruby.svg";
import DiamondSvg  from "@/assets/badges/diamond.svg";
import PlatinumSvg from "@/assets/badges/platinum.svg";
import GoldSvg     from "@/assets/badges/gold.svg";
import SilverSvg   from "@/assets/badges/silver.svg";
import BronzeSvg   from "@/assets/badges/bronze.svg";
import IronSvg     from "@/assets/badges/iron.svg";

const BADGE_MAP: Record<string, React.FC<SvgProps>> = {
  Ruby:     RubySvg,
  Diamond:  DiamondSvg,
  Platinum: PlatinumSvg,
  Gold:     GoldSvg,
  Silver:   SilverSvg,
  Bronze:   BronzeSvg,
  Iron:     IronSvg,
};

interface Props {
  rank: string;
  size?: number;
  showLabel?: boolean;
}

export function RankBadge({ rank, size = 48, showLabel = false }: Props) {
  const BadgeSvg = BADGE_MAP[rank];

  return (
    <View className="items-center gap-xs">
      {BadgeSvg ? (
        <BadgeSvg width={size} height={size} />
      ) : (
        // Fallback if rank name doesn't match any file
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
