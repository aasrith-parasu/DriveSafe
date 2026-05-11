import * as blazeface from '@tensorflow-models/blazeface';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [faceDetected, setFaceDetected] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const cameraRef = useRef(null);
  const modelRef = useRef(null);

  useEffect(() => {
    async function loadModel() {
      await tf.ready();
      modelRef.current = await blazeface.load();
      setModelReady(true);
      console.log('Model ready!');
    }
    loadModel();
  }, []);

  return (
    <View style={styles.container}>
      {!permission?.granted ? (
        <Text style={styles.message} onPress={requestPermission}>
          Tap to grant camera access
        </Text>
      ) : (
        <CameraView style={styles.camera} facing="front" ref={cameraRef}>
          <View style={styles.overlay}>
            <Text style={styles.status}>
              {!modelReady
                ? '⏳ Loading AI model...'
                : faceDetected
                ? '🟢 Face detected'
                : '🔴 No face detected'}
            </Text>
          </View>
        </CameraView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  message: { color: '#fff', fontSize: 18, textAlign: 'center', marginTop: 100 },
  overlay: {
    position: 'absolute', bottom: 40,
    left: 0, right: 0, alignItems: 'center',
  },
  status: {
    color: '#fff', fontSize: 18, fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
  },
});