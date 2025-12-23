import React from 'react';
import {
  FlatList, View, Text, StyleSheet, ScrollView
} from 'react-native';
import TitleHeader from '../components/TitleHeader';
import ThemeCard from "@/components/theme/ThemeCard";

const DayView = ({ items }) => {
  return (
    <FlatList
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
      data={items}
      keyExtractor={(item) => `day-card-${item.title}`}
      renderItem={({ item }) => (
        <ThemeCard innerCard={true}>
          <TitleHeader
            title={item.title}
            count={item.count}
            totalDuration={item.totalDurationStr || item.duration}
          />
          
          {/* 横向滚动容器 */}
          <View style={styles.scrollWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dayBoxesContainer}
              alwaysBounceHorizontal={true}
              bounces={true}
              scrollEnabled={true}
            >
              {item.timeRanges?.map((t, i) => (
                <View key={i} style={styles.timeRangeItem}>
                  <View style={[
                    styles.statBox, {
                      backgroundColor: item.color,
                      borderColor: item.color
                    }
                  ]}>
                    <Text style={styles.boxText}>{t.startTime || t.start}</Text>
                  </View>
                  
                  <View style={styles.timeRangeConnector}>
                    <View style={[styles.connectLine, { backgroundColor: item.color }]} />
                    
                    <Text style={styles.durationText}>{t.durationStr || t.duration}</Text>
                  </View>
                  
                  <View style={[
                    styles.statBox, {
                      backgroundColor: item.color,
                      borderColor: item.color
                    }
                  ]}>
                    <Text style={styles.boxText}>{t.endTime || t.end}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </ThemeCard>
      )}
    />
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    padding: 10,
    paddingTop: 0,
    paddingBottom: 0
  },
  scrollWrapper: {
    width: '100%',
    flex: 1,
  },
  dayBoxesContainer: {
    flexDirection: 'row',
    paddingVertical: 4
  },
  timeRangeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12
  },
  statBox: {
    minWidth: 36,
    height: 36,
    borderRadius: 5,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  boxText: {
    marginHorizontal: 2,
    fontSize: 12,
    color: '#fff',
    fontWeight: '600'
  },
  timeRangeConnector: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    minWidth: 65,
    height: 36,
    marginHorizontal: 2
  },
  connectLine: {
    height: 4,
    width: '100%',
    borderRadius: 2
  },
  durationText: {
    position: 'absolute',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    fontSize: 8,
    color: '#FFF',
    backgroundColor: 'rgba(0,0,0,0.2)'
  }
});

export default DayView;