import { useEffect, useRef } from "react";
import { Animated, Text, View } from "react-native";

type Props = {
  exp: number;
  maxExp: number;
};

export default function ExpBar({ exp, maxExp }: Props) {
  const percent = maxExp > 0 ? Math.min((exp / maxExp) * 100, 100) : 0;
  const animatedWidth = useRef(new Animated.Value(percent)).current;

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: percent,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [percent]);

  return (
    <View style={{ marginTop: 3 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
        <Text style={{ fontSize: 7, fontWeight: "bold", color: "#a78bfa" }}>
          EXP
        </Text>
        <View
          style={{
            flex: 1,
            height: 4,
            backgroundColor: "#374151",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <Animated.View
            style={{
              width: animatedWidth.interpolate({
                inputRange: [0, 100],
                outputRange: ["0%", "100%"],
              }),
              height: "100%",
              backgroundColor: "#818cf8",
              borderRadius: 2,
            }}
          />
        </View>
      </View>
    </View>
  );
}
