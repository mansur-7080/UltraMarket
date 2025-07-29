import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import {Camera, CameraView} from 'expo-camera';
import {Ionicons} from '@expo/vector-icons';

interface TechProduct {
  id: string;
  name: string;
  brand: string;
  price: number;
  image: string;
  specifications: any;
  availability: {
    stock: number;
    stores: string[];
  };
  warranty: {
    period: number;
    type: string;
  };
}

interface TechScannerProps {
  onProductFound: (product: TechProduct) => void;
  onClose: () => void;
}

const TechScanner: React.FC<TechScannerProps> = ({onProductFound, onClose}) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [scanMode, setScanMode] = useState<
    'barcode' | 'text' | 'ai' | 'manual'
  >('barcode');
  const [manualSearch, setManualSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [processingImage, setProcessingImage] = useState(false);
  const [recognitionResults, setRecognitionResults] = useState<string[]>([]);

  useEffect(() => {
    getCameraPermissions();
  }, []);

  const getCameraPermissions = async () => {
    const {status} = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const handleBarcodeScanned = async ({
    type,
    data,
  }: {
    type: string;
    data: string;
  }) => {
    if (scanned) return;

    setScanned(true);
    setIsSearching(true);

    try {
      // Mock API call to identify product by barcode
      const product = await identifyProductByBarcode(data);

      if (product) {
        onProductFound(product);
        Alert.alert(
          'Mahsulot topildi! 🎉',
          `${product.name}\nNarx: ${formatPrice(product.price)}`,
          [
            {text: 'Batafsil', onPress: () => onProductFound(product)},
            {text: 'Yana skanerlash', onPress: () => setScanned(false)},
          ],
        );
      } else {
        Alert.alert(
          'Mahsulot topilmadi 😔',
          "Ushbu barcode bizning ma'lumotlar bazasida yo'q",
          [
            {text: 'Qayta urinish', onPress: () => setScanned(false)},
            {text: "Qo'lda qidirish", onPress: () => setShowManualModal(true)},
          ],
        );
      }
    } catch (error) {
      Alert.alert('Xato', 'Qidirishda xatolik yuz berdi');
      setScanned(false);
    } finally {
      setIsSearching(false);
    }
  };

  const handleManualSearch = async () => {
    if (!manualSearch.trim()) return;

    setIsSearching(true);
    try {
      // Mock API call to search product by name/model
      const products = await searchProductByName(manualSearch);

      if (products.length > 0) {
        onProductFound(products[0]);
        setShowManualModal(false);
      } else {
        Alert.alert('Topilmadi', 'Bunday mahsulot topilmadi');
      }
    } catch (error) {
      Alert.alert('Xato', 'Qidirishda xatolik yuz berdi');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAIRecognition = async (photo: any) => {
    try {
      setProcessingImage(true);

      // Mock AI recognition service
      const results = await recognizeProductWithAI(photo);
      setRecognitionResults(results);

      if (results.length > 0) {
        // Search for recognized products
        const products = await searchProductsByKeywords(results);

        if (products.length > 0) {
          Alert.alert(
            'Mahsulotlar topildi',
            `${results.join(', ')} asosida ${products.length} ta mahsulot topildi`,
            [
              {
                text: "Ko'rish",
                onPress: () => {
                  // Foydalanuvchiga topilgan mahsulotlarni ko'rsatish
                  onProductFound(products[0]);
                },
              },
              {
                text: 'Bekor qilish',
                style: 'cancel',
              },
            ],
          );
        } else {
          Alert.alert(
            "Natija yo'q",
            'Ushbu rasm asosida mahsulotlar topilmadi',
          );
        }
      } else {
        Alert.alert('Tanib olish xatoligi', 'Rasmda mahsulot tanib olinmadi');
      }
    } catch (error) {
              // Error should be handled through proper error boundary
      Alert.alert('Xato', 'Rasmni qayta ishlashda xatolik yuz berdi');
    } finally {
      setProcessingImage(false);
    }
  };

  const identifyProductByBarcode = async (
    barcode: string,
  ): Promise<TechProduct | null> => {
    // Mock implementation - in real app, call API
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay

    // Mock product data based on barcode
    const mockProducts: {[key: string]: TechProduct} = {
      '1234567890123': {
        id: 'intel-i5-13600k',
        name: 'Intel Core i5-13600K',
        brand: 'Intel',
        price: 3200000,
        image: '/images/products/intel-i5-13600k.jpg',
        specifications: {
          cores: 14,
          threads: 20,
          baseClock: '3.5 GHz',
          boostClock: '5.1 GHz',
          socket: 'LGA1700',
          cache: '24MB',
          tdp: 125,
        },
        availability: {
          stock: 15,
          stores: ['TechnoMall Toshkent', 'Mega Planet', 'Digital Plaza'],
        },
        warranty: {
          period: 36,
          type: 'manufacturer',
        },
      },
      '9876543210987': {
        id: 'rtx-4060',
        name: 'NVIDIA GeForce RTX 4060',
        brand: 'NVIDIA',
        price: 3800000,
        image: '/images/products/rtx-4060.jpg',
        specifications: {
          memory: '8GB GDDR6',
          coreClock: '1830 MHz',
          boostClock: '2460 MHz',
          powerConsumption: 115,
          interface: 'PCIe 4.0',
        },
        availability: {
          stock: 8,
          stores: ['TechnoMall Toshkent', 'Mega Planet'],
        },
        warranty: {
          period: 24,
          type: 'manufacturer',
        },
      },
    };

    return mockProducts[barcode] || null;
  };

  const searchProductByName = async (query: string): Promise<TechProduct[]> => {
    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 1000));

    const allProducts = [
      {
        id: 'intel-i5-13600k',
        name: 'Intel Core i5-13600K',
        brand: 'Intel',
        price: 3200000,
        image: '/images/products/intel-i5-13600k.jpg',
        specifications: {
          cores: 14,
          threads: 20,
          baseClock: '3.5 GHz',
          socket: 'LGA1700',
        },
        availability: {
          stock: 15,
          stores: ['TechnoMall Toshkent'],
        },
        warranty: {
          period: 36,
          type: 'manufacturer',
        },
      },
    ];

    return allProducts.filter(
      product =>
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.brand.toLowerCase().includes(query.toLowerCase()),
    );
  };

  const recognizeProductWithAI = async (photo: any): Promise<string[]> => {
    // Real dasturda, bu yerda AI xizmatiga so'rov yuboriladi
    // Misol uchun: Google Cloud Vision, AWS Rekognition, yoki Azure Computer Vision

    await new Promise(resolve => setTimeout(resolve, 2000)); // API delayni simulatsiya qilish

    // Rasmga qarab natijalarni qaytarish
    // Bu yerda natijalar simulatsiya qilingan
    return [
      'NVIDIA GeForce RTX',
      'graphics card',
      'GPU',
      '8GB GDDR6',
      'gaming',
    ];
  };

  const searchProductsByKeywords = async (
    keywords: string[],
  ): Promise<TechProduct[]> => {
    // Real dasturda, bu yerda API so'rovi amalga oshiriladi

    await new Promise(resolve => setTimeout(resolve, 1000)); // API delayni simulatsiya qilish

    // Kalitlar asosida mahsulotlarni izlash
    const results: TechProduct[] = [];

    if (
      keywords.some(
        k =>
          k.toLowerCase().includes('rtx') || k.toLowerCase().includes('nvidia'),
      )
    ) {
      results.push({
        id: 'rtx-4060',
        name: 'NVIDIA GeForce RTX 4060',
        brand: 'NVIDIA',
        price: 3800000,
        image: '/images/products/rtx-4060.jpg',
        specifications: {
          memory: '8GB GDDR6',
          coreClock: '1830 MHz',
          boostClock: '2460 MHz',
          powerConsumption: 115,
          interface: 'PCIe 4.0',
        },
        availability: {
          stock: 8,
          stores: ['TechnoMall Toshkent', 'Mega Planet'],
        },
        warranty: {
          period: 24,
          type: 'manufacturer',
        },
      });
    }

    if (
      keywords.some(
        k =>
          k.toLowerCase().includes('cpu') || k.toLowerCase().includes('intel'),
      )
    ) {
      results.push({
        id: 'intel-i5-13600k',
        name: 'Intel Core i5-13600K',
        brand: 'Intel',
        price: 3200000,
        image: '/images/products/intel-i5-13600k.jpg',
        specifications: {
          cores: 14,
          threads: 20,
          baseClock: '3.5 GHz',
          boostClock: '5.1 GHz',
          socket: 'LGA1700',
          cache: '24MB',
          tdp: 125,
        },
        availability: {
          stock: 15,
          stores: ['TechnoMall Toshkent', 'Mega Planet', 'Digital Plaza'],
        },
        warranty: {
          period: 36,
          type: 'manufacturer',
        },
      });
    }

    return results;
  };

  const formatPrice = (price: number) => {
    return (
      new Intl.NumberFormat('uz-UZ', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(price) + " so'm"
    );
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Kamera ruxsati so'ralmoqda...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Kamera ruxsati berilmadi</Text>
        <TouchableOpacity style={styles.button} onPress={getCameraPermissions}>
          <Text style={styles.buttonText}>Ruxsat berish</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {scanMode === 'barcode'
            ? 'Barcode Scanner'
            : scanMode === 'text'
              ? 'Model Scanner'
              : scanMode === 'ai'
                ? 'AI bilan tanish'
                : "Qo'lda qidirish"}
        </Text>
      </View>

      {/* Scan Mode Selector */}
      <View style={styles.modeSelector}>
        <TouchableOpacity
          style={[
            styles.modeButton,
            scanMode === 'barcode' && styles.activeModeButton,
          ]}
          onPress={() => setScanMode('barcode')}>
          <Ionicons
            name="barcode"
            size={20}
            color={scanMode === 'barcode' ? '#fff' : '#4facfe'}
          />
          <Text
            style={[
              styles.modeText,
              scanMode === 'barcode' && styles.activeModeText,
            ]}>
            Barcode
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.modeButton,
            scanMode === 'text' && styles.activeModeButton,
          ]}
          onPress={() => setScanMode('text')}>
          <Ionicons
            name="text"
            size={20}
            color={scanMode === 'text' ? '#fff' : '#4facfe'}
          />
          <Text
            style={[
              styles.modeText,
              scanMode === 'text' && styles.activeModeText,
            ]}>
            Model
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.modeButton,
            scanMode === 'ai' && styles.activeModeButton,
          ]}
          onPress={() => setScanMode('ai')}>
          <Ionicons
            name="camera"
            size={20}
            color={scanMode === 'ai' ? '#fff' : '#4facfe'}
          />
          <Text
            style={[
              styles.modeText,
              scanMode === 'ai' && styles.activeModeText,
            ]}>
            AI bilan
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.modeButton,
            scanMode === 'manual' && styles.activeModeButton,
          ]}
          onPress={() => setShowManualModal(true)}>
          <Ionicons
            name="search"
            size={20}
            color={scanMode === 'manual' ? '#fff' : '#4facfe'}
          />
          <Text
            style={[
              styles.modeText,
              scanMode === 'manual' && styles.activeModeText,
            ]}>
            Qidirish
          </Text>
        </TouchableOpacity>
      </View>

      {/* Camera View */}
      {(scanMode === 'barcode' || scanMode === 'text' || scanMode === 'ai') && (
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['qr', 'ean13', 'ean8', 'code128', 'code39'],
            }}
          />

          {/* Scan Overlay */}
          <View style={styles.scanOverlay}>
            <View style={styles.scanBox}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
          </View>

          {/* Instructions */}
          <View style={styles.instructions}>
            <Text style={styles.instructionText}>
              {scanMode === 'barcode'
                ? 'Mahsulot barkodini ramka ichiga joylashtiring'
                : scanMode === 'text'
                  ? 'Mahsulot model raqamini skanerlang'
                  : 'Mahsulot rasmiga qarab tanish uchun skanerlang'}
            </Text>
            {isSearching && (
              <Text style={styles.searchingText}>Qidirilmoqda...</Text>
            )}
          </View>
        </View>
      )}

      {/* Rescan Button */}
      {scanned && (
        <View style={styles.rescanContainer}>
          <TouchableOpacity
            style={styles.rescanButton}
            onPress={() => setScanned(false)}>
            <Ionicons name="refresh" size={24} color="#fff" />
            <Text style={styles.rescanText}>Qayta skanerlash</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Manual Search Modal */}
      <Modal
        visible={showManualModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowManualModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Qo'lda qidirish</Text>
              <TouchableOpacity
                onPress={() => setShowManualModal(false)}
                style={styles.modalCloseButton}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalInstruction}>
              Mahsulot nomi yoki model raqamini kiriting
            </Text>

            <TextInput
              style={styles.searchInput}
              placeholder="Masalan: Intel i5-13600K"
              value={manualSearch}
              onChangeText={setManualSearch}
              autoFocus={true}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowManualModal(false)}>
                <Text style={styles.cancelButtonText}>Bekor qilish</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.searchButton]}
                onPress={handleManualSearch}
                disabled={isSearching || !manualSearch.trim()}>
                <Text style={styles.searchButtonText}>
                  {isSearching ? 'Qidirilmoqda...' : 'Qidirish'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Tech Tips */}
      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>💡 Maslahatlar:</Text>
        <Text style={styles.tipText}>• Yaxshi yorug'likda skanerlang</Text>
        <Text style={styles.tipText}>
          • Barcode tiniq ko'rinishini ta'minlang
        </Text>
        <Text style={styles.tipText}>
          • Model raqami ko'pincha mahsulot orqasida
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  closeButton: {
    padding: 10,
  },
  headerTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginRight: 44, // Offset for close button
  },
  modeSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginHorizontal: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#4facfe',
  },
  activeModeButton: {
    backgroundColor: '#4facfe',
  },
  modeText: {
    color: '#4facfe',
    fontWeight: '500',
    marginLeft: 5,
  },
  activeModeText: {
    color: '#fff',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  scanOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanBox: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#4facfe',
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  instructions: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  instructionText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  searchingText: {
    color: '#4facfe',
    fontSize: 14,
    marginTop: 10,
    fontWeight: '600',
  },
  rescanContainer: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  rescanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4facfe',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  rescanText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  modalCloseButton: {
    padding: 5,
  },
  modalInstruction: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  searchInput: {
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  searchButton: {
    backgroundColor: '#4facfe',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  tipsContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 15,
    margin: 20,
    borderRadius: 10,
  },
  tipsTitle: {
    color: '#4facfe',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  tipText: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 4,
  },
  message: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    margin: 20,
  },
  button: {
    backgroundColor: '#4facfe',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    alignSelf: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TechScanner;
