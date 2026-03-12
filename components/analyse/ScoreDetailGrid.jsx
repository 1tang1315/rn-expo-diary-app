import React from "react";
import { StyleSheet, FlatList, View } from "react-native";
import ThemeCard from "@/components/theme/ThemeCard";
import ThemeText from "@/components/theme/ThemeText";
import ThemeSubTitleText from "@/components/theme/ThemeSubTitleText";
import ThemeTouchableOpacity from "@/components/theme/ThemeTouchableOpacity";

const ScoreDetailGrid = ({ items = [], onItemPress }) => {
  const renderItems = items.length > 0 ? items : [];

  const renderItem = ({ item, index }) => {
    const handlePress = () => {
      if (onItemPress) {
        onItemPress(item, index);
      }
    };

    return (
      <ThemeTouchableOpacity style={styles.item} onPress={handlePress}>
        <View style={styles.headerRow}>
          <ThemeText style={styles.iconText}>{item.icon || "★"}</ThemeText>
          <ThemeText style={styles.title}>{item.detailLabel || item.label}</ThemeText>
        </View>
        <View style={styles.scoreRow}>
          <ThemeText style={styles.scoreValue}>{item.score ?? 0}</ThemeText>
        </View>
        <ThemeSubTitleText style={styles.ratioText}>
          占比 {item.ratio || 0}%
        </ThemeSubTitleText>
        <ThemeSubTitleText style={[styles.changeText, item.change > 0 ? styles.positiveChange : item.change < 0 ? styles.negativeChange : styles.neutralChange]}>
          {item.change > 0 ? `↑ +${item.change}分` : item.change < 0 ? `↓ ${item.change}分` : "— 持平"}
        </ThemeSubTitleText>
        <ThemeSubTitleText style={styles.detailHint}>
          查看详情 &gt;
        </ThemeSubTitleText>
      </ThemeTouchableOpacity>
    );
  };

  return (
    <ThemeCard style={styles.card}>
      <FlatList
        data={renderItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.key}
        numColumns={2}
        columnWrapperStyle={styles.row}
        scrollEnabled={false}
        contentContainerStyle={styles.listContent}
      />
    </ThemeCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginTop: 10,
    paddingVertical: 16,
    paddingHorizontal: 16
  },
  listContent: {
    paddingBottom: 8
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 16
  },
  item: {
    width: "48%",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.1)"
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12
  },
  iconText: {
    fontSize: 20,
    marginRight: 8
  },
  title: {
    fontSize: 14,
    fontWeight: "600"
  },
  scoreRow: {
    marginBottom: 8
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: "700"
  },
  ratioText: {
    fontSize: 12,
    marginBottom: 4
  },
  changeText: {
    fontSize: 12,
    marginBottom: 8
  },
  positiveChange: {
    color: "#4CAF50"
  },
  negativeChange: {
    color: "#F44336"
  },
  neutralChange: {
    color: "#9E9E9E"
  },
  detailHint: {
    fontSize: 12
  }
});

export default ScoreDetailGrid;

