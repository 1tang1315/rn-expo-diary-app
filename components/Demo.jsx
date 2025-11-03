import React, { useState } from "react";
import { SafeAreaView, Text, View } from "react-native";
import DraggableFlatList, { ScaleDecorator } from "react-native-draggable-flatlist";

const initialData = Array.from({ length: 10 }, (_, i) => ({
  key: `item-${i}`,
  label: `项目 ${i + 1}`,
  backgroundColor: `rgb(${Math.floor(Math.random() * 255)},150,150)`,
}));

export default function Demo() {
  const [data, setData] = useState(initialData);
  
  const renderItem = ({ item, drag, isActive }) => (
    <ScaleDecorator>
      <View
        onLongPress={drag}
        style={{
          backgroundColor: isActive ? "tomato" : item.backgroundColor,
          padding: 20,
          marginVertical: 5,
          borderRadius: 10,
        }}
      >
        <Text style={{ color: "#fff", fontSize: 18 }}>{item.label}</Text>
      </View>
    </ScaleDecorator>
  );
  
  return (
    <SafeAreaView style={{ flex: 1, padding: 10 }}>
      <DraggableFlatList
        data={data}
        onDragEnd={({ data }) => setData(data)}
        keyExtractor={(item) => item.key}
        renderItem={renderItem}
      />
    </SafeAreaView>
  );
}
