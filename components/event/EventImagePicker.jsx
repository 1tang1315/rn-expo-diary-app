import React from 'react';
import { View, Image, StyleSheet, Alert, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { BASE_IMAGE_DIR } from '@/constants/commonConstans';
import { ImageDirType } from '@/core/db/imageDB';
import ThemeSubTitleText from '@/components/theme/ThemeSubTitleText';
import ThemeButton from '@/components/theme/ThemeButton';
import ThemeTouchableOpacity from '@/components/theme/ThemeTouchableOpacity';
import Icon from '@/components/common/Icon';
import { toEventImageUri } from '@/utils/eventImageUtils';

export default function EventImagePicker({
  images = [],
  pendingImageUris = [],
  onChangeImages,
  onChangePendingUris,
}) {
  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('权限不足', '需要获取相册权限才能选择图片');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.6,
    });

    if (!result.canceled && result.assets.length > 0) {
      onChangePendingUris([...pendingImageUris, ...result.assets.map((a) => a.uri)]);
    }
  };

  const removeSaved = (key) => {
    onChangeImages(images.filter((item) => item !== key));
  };

  const removePending = (uri) => {
    onChangePendingUris(pendingImageUris.filter((item) => item !== uri));
  };

  const allItems = [
    ...images.map((key) => ({ type: 'saved', key, uri: toEventImageUri(BASE_IMAGE_DIR, key) })),
    ...pendingImageUris.map((uri) => ({ type: 'pending', uri })),
  ];

  return (
    <View style={styles.formGroup}>
      <ThemeSubTitleText style={styles.formLabel}>图片</ThemeSubTitleText>
      <ThemeButton title="添加图片" onPress={pickImages} />
      {allItems.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageRow}>
          {allItems.map((item, index) => (
            <View key={`${item.type}-${item.uri}-${index}`} style={styles.imageWrap}>
              <Image source={{ uri: item.uri }} style={styles.image} />
              <ThemeTouchableOpacity
                style={styles.removeBtn}
                onPress={() => (
                  item.type === 'saved' ? removeSaved(item.key) : removePending(item.uri)
                )}
              >
                <Icon lib="MaterialIcons" name="close" size={16} color="#fff" />
              </ThemeTouchableOpacity>
            </View>
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  formGroup: {
    marginBottom: 10,
  },
  formLabel: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  imageRow: {
    marginTop: 8,
  },
  imageWrap: {
    marginRight: 8,
    position: 'relative',
  },
  image: {
    width: 72,
    height: 72,
    borderRadius: 8,
  },
  removeBtn: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    padding: 2,
  },
});
