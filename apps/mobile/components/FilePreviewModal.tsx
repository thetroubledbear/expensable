import React from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Text } from './Text';
import { X } from 'lucide-react-native';
import { WebView } from 'react-native-webview';

const { width, height } = Dimensions.get('window');

interface FilePreviewModalProps {
  visible: boolean;
  onClose: () => void;
  fileUrl: string;
  fileType: 'csv' | 'pdf' | 'image';
  fileName: string;
}

export default function FilePreviewModal({ visible, onClose, fileUrl, fileType, fileName }: FilePreviewModalProps) {
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <X color="#fff" size={24} />
        </TouchableOpacity>

        <View style={styles.content}>
          <Text style={styles.title}>{fileName}</Text>
          <View style={styles.previewContainer}>
            {fileType === 'image' ? (
              <Image source={{ uri: fileUrl }} style={styles.fullImage} resizeMode="contain" />
            ) : fileType === 'pdf' ? (
              <WebView
                source={{ uri: fileUrl }}
                style={styles.fullWebView}
                scalesPageToFit={true}
              />
            ) : (
              <View style={styles.csvPlaceholder}>
                <Text style={styles.placeholderText}>CSV preview not supported on mobile. Please download the file to view.</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  closeBtn: { position: 'absolute', top: 50, right: 20, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: 8 },
  content: { width: width * 0.95, height: height * 0.8, flexDirection: 'column' },
  title: { color: '#fff', fontSize: 16, fontWeight: '600', textAlign: 'center', marginBottom: 12, fontFamily: 'Regular' },
  previewContainer: { flex: 1, backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' },
  fullImage: { width: '100%', height: '100%' },
  fullWebView: { width: '100%', height: '100%' },
  csvPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#f8fafc' },
  placeholderText: { textAlign: 'center', color: '#64748b', fontSize: 14, fontFamily: 'Regular' },
});
