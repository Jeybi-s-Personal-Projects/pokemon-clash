import { useEffect, useRef } from "react";
import { Animated, Text, View } from "react-native";

type Props = {
  hp: number;
  maxHp: number;
  hideRatio?: boolean;
};

export default function HpBar({ hp, maxHp, hideRatio }: Props) {
  const percent = (hp / maxHp) * 100;
  const animatedWidth = useRef(new Animated.Value(percent)).current;

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: percent,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [percent]);

  const color = animatedWidth.interpolate({
    inputRange: [20, 50, 100],
    outputRange: ["red", "orange", "green"],
  });

  return (
    <View style={{ marginVertical: 5 }}>
      <View
        style={{
          height: 10,
          backgroundColor: "#ccc",
          borderRadius: 5,
          overflow: "hidden",
          borderWidth: 0.5,
          borderColor: "#ffff",
        }}
      >
        <Animated.View
          style={{
            width: animatedWidth.interpolate({
              inputRange: [0, 100],
              outputRange: ["0%", "100%"],
            }),
            height: "100%",
            backgroundColor: color,
          }}
        />
      </View>

      {!hideRatio && (
        <Text style={{ color: "white" }}>
          {Math.round(hp)} / {maxHp}
        </Text>
      )}
    </View>
  );
}
