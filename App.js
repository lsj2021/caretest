// App.js
import React, { useState, useEffect, useRef, useContext  } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, ImageBackground, TextInput, Button, Alert, PermissionsAndroid, Platform ,  BackHandler , ToastAndroid , FlatList } from 'react-native';
import {Calendar, LocaleConfig} from 'react-native-calendars';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BleManager, Device } from 'react-native-ble-plx';
import { request, PERMISSIONS } from 'react-native-permissions';
import firebase from '@react-native-firebase/app';
import database from '@react-native-firebase/database';
import messaging from '@react-native-firebase/messaging';
import 'react-native-gesture-handler';
import PushNotification from 'react-native-push-notification'; // 푸쉬 알림


// 커밋용 텍스트

//파이어베이스 
if (!firebase.apps.length) {
  firebase.initializeApp({
    apiKey: 'AIzaSyDb7voCfYlMEUFfVEu7mqxBNS8VV5xy-q0',
    authDomain: 'carefull-74e61.firebaseapp.com',
    databaseURL: 'https://carefull-74e61-default-rtdb.firebaseio.com',
    projectId: 'carefull-74e61',
    storageBucket: 'carefull-74e61.appspot.com',
    messagingSenderId: '414598808103',
    appId: '1:414598808103:android:ebcf006c169f2803b44402',
  });
}

// FCM 초기화 및 권한 요청
const initializeFCM = async () => {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    console.log('알림 권한이 부여되었습니다.');
  }
};

const storeNotification = async (message) => {
  const storedNotifications = await AsyncStorage.getItem('notifications');
  const notificationsArray = storedNotifications ? JSON.parse(storedNotifications) : [];
  notificationsArray.push(message);
  await AsyncStorage.setItem('notifications', JSON.stringify(notificationsArray));
};

// 상단 네비게이션 바
const HomeScreen = ({ navigateTo }) => {
  const [morningTime, setMorningTime] = useState('');
  const [afternoonTime, setAfternoonTime] = useState('');
  const [eveningTime, setEveningTime] = useState('');
  const [notificationCount, setNotificationCount] = useState(0);
  const [lastNotificationTime, setLastNotificationTime] = useState('');

  useEffect(() => {
    const loadTimes = async () => {
      const morning = await AsyncStorage.getItem('morningTime');
      const afternoon = await AsyncStorage.getItem('afternoonTime');
      const evening = await AsyncStorage.getItem('eveningTime');
      const lastNotification = await AsyncStorage.getItem('lastNotificationTime');
      const count = await AsyncStorage.getItem('notificationCount');

      if (morning) setMorningTime(morning);
      if (afternoon) setAfternoonTime(afternoon);
      if (evening) setEveningTime(evening);
      if (lastNotification) setLastNotificationTime(lastNotification);
      if (count) setNotificationCount(parseInt(count));
    };

    loadTimes();
  }, []);

  const storeNotification = async (message) => {
    const storedNotifications = await AsyncStorage.getItem('notifications');
    const notificationsArray = storedNotifications ? JSON.parse(storedNotifications) : [];
    notificationsArray.push(message);
    await AsyncStorage.setItem('notifications', JSON.stringify(notificationsArray));
  };

  const addNotification = async (timeOfDay) => {
    const now = new Date();
    const formattedTime = `${timeOfDay} ${now.getHours()}시 ${now.getMinutes()}분`;

    await storeNotification(`복용 시간: ${formattedTime}`);
    setLastNotificationTime(formattedTime);
    await AsyncStorage.setItem('lastNotificationTime', formattedTime);
    setNotificationCount(prevCount => prevCount + 1);

    if (notificationCount === 0) {
      await AsyncStorage.setItem('morningTime', formattedTime);
      setMorningTime(formattedTime);
    } else if (notificationCount === 1) {
      await AsyncStorage.setItem('afternoonTime', formattedTime);
      setAfternoonTime(formattedTime);
    } else if (notificationCount === 2) {
      await AsyncStorage.setItem('eveningTime', formattedTime);
      setEveningTime(formattedTime);
    }
    await AsyncStorage.setItem('notificationCount', (notificationCount + 1).toString());

    // Send push notification
    PushNotification.localNotification({
      channelId: 'default-channel-id', // 채널 ID 지정
      title: '복용 알림',
      message: `복용 시간: ${formattedTime}`,
    });
  };

  return (
    <>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>carefull</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity onPress={() => navigateTo('Calendar')}>
              <Image style={styles.icon} source={require('./assets/Calendar.png')} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigateTo('Settings')}>
              <Image style={styles.icon} source={require('./assets/Alarm.png')} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ marginBottom: 10, marginTop: 10 }}>
          <ImageBackground source={require('./assets/pill_drop.jpg')} style={styles.backgroundImage}>
            <Text style={{ fontSize: 30, fontWeight: 'bold', padding: "1%" }}>금일 복용 횟수</Text>
            <Text style={styles.daystext}>아침 {morningTime}</Text>
            <Text style={styles.daystext}>점심 {afternoonTime}</Text>
            <Text style={styles.daystext}>저녁 {eveningTime}</Text>
          </ImageBackground>
        </View>

        <View style={styles.medicationReminder}>
          <Text style={styles.sectionTitle}>복용 알림</Text>
          <View style={styles.reminderItem}>
            <Image style={styles.reminderIcon} source={require('./assets/pill_00.png')} />
            <View>
              <Text style={styles.reminderText}>{lastNotificationTime ? `복용 시간: ${lastNotificationTime}` : '아직 알림이 없습니다.'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.medicationReminder}>
          <Text style={styles.sectionTitle}>약 잔여량</Text>
          <View style={styles.reminderItem}>
            <Image style={styles.reminderIcon} source={require('./assets/pill_00.png')} />
            <View>
              <Text style={styles.reminderText}></Text>
            </View>
          </View>
        </View>
        <ScrollView horizontal style={styles.medicationList}>
          <TouchableOpacity onPress={() => addNotification('아침')}>
            <View style={styles.medicationItem}>
              <Image style={styles.medicationImage} source={require('./assets/pill_00.png')} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => addNotification('점심')}>
            <View style={styles.medicationItem}>
              <Image style={styles.medicationImage} source={require('./assets/pill_00.png')} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => addNotification('저녁')}>
            <View style={styles.medicationItem}>
              <Image style={styles.medicationImage} source={require('./assets/pill_00.png')} />
            </View>
          </TouchableOpacity>
        </ScrollView>

        {/* 알림 추가 버튼 */}
        <TouchableOpacity style={styles.addButton} onPress={() => addNotification('추가')}>
          <Text style={styles.addButtonText}>알림 추가</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
};

const BluetoothContext = React.createContext();

const BluetoothProvider = ({ children }) => {
  const [receivedData, setReceivedData] = useState(null);

  return (
    <BluetoothContext.Provider value={{ receivedData, setReceivedData }}>
      {children}
    </BluetoothContext.Provider>
  );
};

const CalendarScreen = ({ navigateTo }) => {
  LocaleConfig.locales['kr'] = {
    monthNames: [
      '1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'
    ],
    monthNamesShort: [
      '1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'
    ],
    dayNames: [
      '일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'
    ],
    dayNamesShort: [
      '일', '월', '화', '수', '목', '금', '토'
    ],
  };

  LocaleConfig.defaultLocale = 'kr';

  const [selected, setSelected] = useState('');
  const [notificationHistory, setNotificationHistory] = useState([]);

  useEffect(() => {
    const loadNotifications = async () => {
      const storedNotifications = await AsyncStorage.getItem('notifications');
      if (storedNotifications) {
        setNotificationHistory(JSON.parse(storedNotifications));
      }
    };

    loadNotifications();
  }, []);

  return (
    <ScrollView>
      <View style={styles.header}>
        <Text style={styles.title}>Calendar</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={() => navigateTo('Home')}>
            <Image style={styles.icon} source={require('./assets/Back_Arrow.png')} />
          </TouchableOpacity>
        </View>
      </View>
      <View>
        <Calendar
          onDayPress={(day) => setSelected(day.dateString)}
          markedDates={{
            [selected]: { selected: true, disableTouchEvent: true, selectedDotColor: 'orange' },
          }}
          theme={{
            selectedDayBackgroundColor: 'blue',
            todayTextColor: 'red',
            arrowColor: 'orange',
          }}
        />
        {notificationHistory.length > 0 && (
          <View>
            <Text>Notification History:</Text>
            {notificationHistory.map((notification, index) => (
              <Text key={index}>{notification}</Text>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const SettingsScreen = ({ navigateTo }) => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const loadNotifications = async () => {
      const storedNotifications = await AsyncStorage.getItem('notifications');
      if (storedNotifications) {
        setNotifications(JSON.parse(storedNotifications));
      }
    };

    loadNotifications();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigateTo('Home')}>
          <Image source={require('./assets/Back_Arrow.png')} style={styles.icon} />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
      </View>
      <View style={styles.notificationsContainer}>
        {notifications.map((notification, index) => (
          <View key={index} style={styles.notificationItem}>
            <Text style={styles.notificationText}>{notification}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};


// 개인정보 관리
const PrivateScreen = ({ navigateTo }) => {
  const [name, setName] = useState('');
  const [userCode, setUserCode] = useState('');


  useEffect(() => {
    AsyncStorage.getItem('userCode')
      .then((savedCode) => {
        if (savedCode) {
          console.log('저장된 사용자 코드:', savedCode);
          setUserCode(savedCode); // 저장된 코드를 사용하여 화면에 표시
        }
      })
      .catch(error => {
        console.log('AsyncStorage에서 사용자 코드를 가져오는 중 오류 발생:', error);
      });
  }, []);

  // 사용자 코드를 4개의 부분으로 나누는 함수
  const splitUserCode = (code) => {
    const codeParts = [];
    for (let i = 0; i < code.length; i += 4) {
      codeParts.push(code.slice(i, i + 4));
    }
    return codeParts;
  };


  useEffect(() => {
    const loadName = async () => {
      const userName = await AsyncStorage.getItem('userName');
      if (userName) {
        setName(userName);
      }
    };
    loadName();
  }, []);

  return (
    <>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigateTo('UserInfo')}>
          <Text style={{ fontSize: 30, fontWeight: 'bold', color: 'black' }}>← 사용자 코드</Text>
        </TouchableOpacity>
      </View>
    
    
    <View style={styles.header}>
  
      <View style={styles.nickname}>
      <Text style={{ fontSize: 25, fontWeight: 'bold', color: 'black', marginBottom: 15 }}>닉네임: {name}</Text>

      </View>

      <View style={styles.container}>
        <Text style={{ fontSize: 25, fontWeight: 'bold', color: 'black', marginBottom: 15 }}>사용자 코드</Text>
        <View style={styles.codeContainer}>
          {splitUserCode(userCode).map((part, index) => (
            <View key={index} style={styles.codePartContainer}>
              <Text style={styles.codePart}>{part}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
    </>
  );
};


//사용자 정보
const UserInfo = ({ navigateTo }) => (
  <>
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigateTo('Home')}>
        <Text style={{ fontSize: 30, fontWeight: 'bold', color: "black" }}>← 사용자 정보</Text>
      </TouchableOpacity>
    </View>
    <View style={styles.container}>
      <Text style={{ fontSize: 25, fontWeight: 'bold', color: "black", marginBottom: 15 }}>내 정보 관리</Text>
      
      <TouchableOpacity onPress={() => navigateTo('Private')}>
      <Text style={{ fontSize: 15, color: "black", marginBottom: 15 }}>개인 정보 관리</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigateTo('Parentaccount')}>
      <Text style={{ fontSize: 15, color: "black", marginBottom: 25 }}>보호자 등록</Text>
      </TouchableOpacity>
      <Text style={{ fontSize: 25, fontWeight: 'bold', color: "black", marginBottom: 15 }}>약통 관리</Text>

      <TouchableOpacity onPress={() => navigateTo('Medical')}>
      <Text style={{ fontSize: 15, color: "black", marginBottom: 15 }}>내 약통 관리</Text>
      </TouchableOpacity>

    </View>
  </>
);

// 16자리 난수 생성 함수
const generateUserCode = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const codeLength = 16;
  let code = '';
  for (let i = 0; i < codeLength; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
};

//닉네임 입력
const NameInputScreen = ({ navigateTo }) => {
  const [name, setName] = useState('');

  useEffect(() => {
    // 사용자가 앱에 로그인하거나 앱을 처음 실행할 때 FCM 토큰을 가져와 저장합니다.
    const getAndSaveFCMToken = async () => {
      try {
        // FCM 토큰 가져오기
        const fcmToken = await messaging().getToken();
        if (fcmToken) {
          // FCM 토큰과 함께 닉네임을 저장
          await AsyncStorage.setItem('fcmToken', fcmToken);
        } else {
          console.log('FCM 토큰을 가져올 수 없습니다.');
        }
      } catch (error) {
        console.error('FCM 토큰을 가져오는 동안 오류가 발생했습니다:', error);
      }
    };

    // 앱 실행 시 FCM 토큰 가져오기 및 저장
    getAndSaveFCMToken();
  }, []);

  const handleSaveName = async () => {
    if (name.trim() !== '') {
      const userCode = generateUserCode();
      await AsyncStorage.setItem('userName', name);
      await AsyncStorage.setItem('userCode', userCode);
      const fcmToken = await AsyncStorage.getItem('fcmToken');

      // Firebase Realtime Database에 닉네임, 고유 번호 및 FCM 토큰 저장
      await database().ref('users').push({ name, userCode, fcmToken });

      Alert.alert('계정이 생성되었습니다.');
      navigateTo('Home');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>닉네임을 입력하세요</Text>
      <TextInput
        style={styles.nicknamebox}
        placeholder="닉네임"
        value={name}
        onChangeText={setName}
      />
      <Button title="저장" onPress={handleSaveName} />
    </View>
  );
};


//보호자 등록
const ParentaccountScreen = ({ navigateTo }) => {
  const inputRefs = [useRef(), useRef(), useRef(), useRef()];
  const [parentCodes, setParentCodes] = useState(['', '', '', '']);
  const [userName, setUserName] = useState(''); // 사용자 이름 상태 추가

  useEffect(() => {
    // AsyncStorage에서 사용자 이름 가져오기
    const fetchUserName = async () => {
      const storedUserName = await AsyncStorage.getItem('userName');
      setUserName(storedUserName || ''); // AsyncStorage에 저장된 사용자 이름이 없으면 빈 문자열로 설정
    };
    fetchUserName();
  }, []);

  const handleCodeChange = (text, index) => {
    const newParentCodes = [...parentCodes];
    newParentCodes[index] = text.replace(/\s/g, ''); // 공백 제거
    setParentCodes(newParentCodes);

    if (text.length === 4 && index < 3) {
      inputRefs[index + 1].current.focus();
    }
  };

  const searchUserByParentCode = async (parentCode) => {
    try {
      const snapshot = await database().ref('users').orderByChild('userCode').equalTo(parentCode).once('value');
      const user = snapshot.val();
      return user;
    } catch (error) {
      console.error('사용자를 검색하는 중 오류 발생:', error);
      throw error;
    }
  };

  const sendNotificationToParent = async (parentToken, userName) => {
    try {
      const message = {
        notification: {
          title: '보호자 등록 요청',
          body: `${userName} 님이(가) 보호자 등록을 요청하셨습니다.`,
        },
        token: parentToken,
      };

      
      await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `key=AIzaSyDb7voCfYlMEUFfVEu7mqxBNS8VV5xy-q0`, // Firebase 콘솔에서 확인한 서버 키를 사용합니다.
        },
        body: JSON.stringify(message),
      });
    } catch (error) {
      console.error('알림 전송 중 오류 발생:', error);
    }
  };

  const sendRegistrationRequestToParent = async () => {
    try {
      const parentCode = parentCodes.join('');
      const user = await searchUserByParentCode(parentCode);
      console.log('검색된 사용자:', user); // 사용자 데이터 로그 출력
  
      if (user) {
        const userKeys = Object.keys(user);
        if (userKeys.length > 0) {
          const userKey = userKeys[0];
          const parentData = user[userKey];
          console.log('부모 데이터:', parentData); // 부모 데이터 로그 출력
  
          if (parentData.fcmToken) {
            const parentToken = parentData.fcmToken;
            Alert.alert(
              '보호자로 등록하시겠습니까?',
              '',
              [
                {
                  text: '취소',
                  style: 'cancel',
                },
                {
                  text: '확인',
                  onPress: async () => {
                    await sendNotificationToParent(parentToken, userName);
                    Alert.alert('보호자에게 요청이 전송되었습니다.');
                  },
                },
              ]
            );
          } else {
            Alert.alert('사용자의 토큰이 없습니다.');
          }
        } else {
          Alert.alert('유효하지 않은 사용자 코드입니다.');
        }
      } else {
        Alert.alert('유효하지 않은 사용자 코드입니다.');
      }
    } catch (error) {
      console.error('보호자 등록 요청 중 오류 발생:', error);
      Alert.alert('보호자 등록 요청 중 오류가 발생했습니다. 나중에 다시 시도해주세요.');
    }
  };

  return (
    <>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigateTo('UserInfo')}>
          <Text style={{ fontSize: 30, fontWeight: 'bold', color: 'black' }}>← 보호자 등록</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.container}>
        <Text style={{ fontSize: 25, fontWeight: 'bold', color: "black", marginBottom: 15 }}>보호자 코드</Text>
        <View style={styles.inputContainer}>
          {[0, 1, 2, 3].map((index) => (
            <React.Fragment key={index}>
              <TextInput
                ref={inputRefs[index]}
                placeholder="0000"
                maxLength={4}
                onChangeText={(text) => handleCodeChange(text, index)}
                value={parentCodes[index]}
                style={styles.input}
              />
              {index < 3 && <Text style={styles.hyphen}>-</Text>}
            </React.Fragment>
          ))}
        </View>
        <Button title="보호자 등록 요청 보내기" onPress={sendRegistrationRequestToParent} />
      </View>
    </>
  );
};

const MedicalScreen = ({ navigateTo }) => {
  const bleManagerRef = useRef(new BleManager());
  const [isScanning, setIsScanning] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [connectedDevices, setConnectedDevices] = useState([]);

  const requestBluetoothPermissions = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);
      return (
        granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === PermissionsAndroid.RESULTS.GRANTED &&
        granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === PermissionsAndroid.RESULTS.GRANTED &&
        granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED
      );
    } else if (Platform.OS === 'ios') {
      // iOS 권한 요청
      return true; // iOS에서는 미리 설정되어 있어서 추가적인 권한 요청 없이 사용할 수 있습니다.
    }
    return false;
  };

  const checkBluetoothState = async () => {
    const state = await bleManagerRef.current.state();
    if (state !== 'PoweredOn') {
      Alert.alert('Bluetooth 필요', '블루투스를 켜주세요.');
      return false;
    }
    return true;
  };

  const showToast = (message) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert(message);
    }
  };

  const handleRegisterPillBox = async () => {
    const hasPermission = await requestBluetoothPermissions();
    if (!hasPermission) {
      Alert.alert('권한 필요', '블루투스 권한이 필요합니다.');
      return;
    }

    const isBluetoothOn = await checkBluetoothState();
    if (!isBluetoothOn) {
      return;
    }

    try {
      if (isScanning) {
        bleManagerRef.current.stopDeviceScan();
      }

      setIsScanning(true);

      bleManagerRef.current.startDeviceScan(null, null, async (error, device) => {
        if (error) {
          console.error('스캔 중 오류 발생:', error);
          Alert.alert('스캔 오류', '블루투스 스캔 중 오류가 발생했습니다.');
          setIsScanning(false);
          return;
        }

        if (device && device.name === 'HC-06') {
          // HC-06 모듈을 찾으면 연결 시도
          try {
            bleManagerRef.current.stopDeviceScan();
            setIsScanning(false);
            const connectedDevice = await device.connect();
            console.log('HC-06 모듈에 연결되었습니다:', connectedDevice);
            setConnectedDevice(connectedDevice);
            setConnectedDevices(prevDevices => [...prevDevices, { id: connectedDevice.id, name: connectedDevice.name }]);
            showToast('HC-06 모듈에 연결 되었습니다');

             // Check if the device is already in the list
             if (!connectedDevices.some(dev => dev.id === connectedDevice.id)) {
              setConnectedDevices(prevDevices => [...prevDevices, { id: connectedDevice.id, name: connectedDevice.name }]);
            }

            // 연결 후 필요한 동작을 수행할 수 있습니다.
          } catch (connectError) {
            console.error('HC-06 모듈 연결 중 오류 발생:', connectError);
            Alert.alert('연결 오류', 'HC-06 모듈 연결 중 오류가 발생했습니다.');
          }
        }
      });
    } catch (error) {
      console.error('블루투스 스캔 시작 오류:', error);
      Alert.alert('스캔 시작 오류', '블루투스 스캔을 시작하는 동안 오류가 발생했습니다.');
      setIsScanning(false);
    }
  };

  const handleDeviceDisconnect = async (device) => {
    try {
      await device.cancelConnection();
      // 연결 해제 후 연결된 기기 목록에서 제거하지 않고 상태 변화 없음
    } catch (error) {
      console.error('기기 연결 해제 중 오류 발생:', error);
      Alert.alert('연결 해제 오류', '기기 연결 해제 중 오류가 발생했습니다.');
    }
  };

  return (
    <View style={styles.container}>
    <View style={styles.header}>
    <TouchableOpacity onPress={() => navigateTo('UserInfo')}>
    <Text style={{ fontSize: 30, fontWeight: 'bold', color: "black" }}>← 내 약통 관리</Text>
    </TouchableOpacity>
    </View>
    <View style={styles.content}>
    <TouchableOpacity onPress={handleRegisterPillBox} style={styles.registrationButton}>
    <Text style={{ fontSize: 24, fontWeight: 'bold', color: "black" }}>내 약통 등록</Text>
    </TouchableOpacity>
    </View>

      <View style={styles.medi}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', color: "black" }}> 등록된 기기 </Text>
        <FlatList
          data={connectedDevices}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.deviceItem}
              onPress={() => handleDeviceDisconnect(item)}
            >
              <Text>{item.name}</Text>
              <Text>{item.id}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={() => (
            
            <Text style={{ alignSelf: 'center', marginTop: 20 }}>연결된 기기가 없습니다.</Text>
          )}
        />
      </View>
    </View>
  );
};

const App = () => {
  const [currentScreen, setCurrentScreen] = useState('Home');
  const [screenStack, setScreenStack] = useState(['Home']);
  const [lastBackPress, setLastBackPress] = useState(0);

  
  useEffect(() => {
    initializeFCM();
  }, []);

  useEffect(() => {
    const checkUserName = async () => {
      const userName = await AsyncStorage.getItem('userName');
      if (userName) {
        setCurrentScreen('Home');
      } else {
        setCurrentScreen('NameInput');
      }
    };
    checkUserName();
  }, []);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);

    return () => backHandler.remove();
  }, [currentScreen, screenStack]);

  useEffect(() => {
    const createChannel = () => {
      PushNotification.createChannel(
        {
          channelId: 'default-channel-id',
          channelName: 'Default Channel',
          channelDescription: 'A default channel',
          soundName: 'default',
          importance: 4,
          vibrate: true,
        },
        (created) => console.log(`createChannel returned '${created}'`)
      );
    };

    createChannel();
  }, []);


  const handleBackPress = () => {
    if (currentScreen === 'Home') {
      const currentTime = Date.now();
      if (currentTime - lastBackPress < 2000) {
        BackHandler.exitApp();
      } else {
        ToastAndroid.show('한 번 더 누르면 종료됩니다.', ToastAndroid.SHORT);
        setLastBackPress(currentTime);
      }
      return true;
    }

    if (screenStack.length > 1) {
      const newStack = [...screenStack];
      newStack.pop();
      setCurrentScreen(newStack[newStack.length - 1]);
      setScreenStack(newStack);
      return true;
    }

    return false; // 기본 동작을 수행 (앱 종료)
  };

  const navigateTo = (screen) => {
    setCurrentScreen(screen);
    setScreenStack([...screenStack, screen]);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'Calendar':
        return <CalendarScreen navigateTo={navigateTo} />;
      case 'Settings':
        return <SettingsScreen navigateTo={navigateTo} />;
      case 'Private':
        return <PrivateScreen navigateTo={navigateTo} />;
      case 'Parentaccount':
        return <ParentaccountScreen navigateTo={navigateTo} />;
      case 'Medical':
        return <MedicalScreen navigateTo={navigateTo} />;
      case 'NameInput':
        return <NameInputScreen navigateTo={navigateTo} />;
      case 'UserInfo':
        return <UserInfo navigateTo={navigateTo} />;
      case 'Home':
      default:
        return <HomeScreen navigateTo={navigateTo} />;
    }
  };

  return (
    <BluetoothProvider>
      <View style={{ flex: 1 }}>
        {renderScreen()}
      </View>
    </BluetoothProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerIcons: {
    flexDirection: 'row',
  },
  icon: {
    width: 24,
    height: 24,
    marginHorizontal: 10,
  },
  backgroundImage: {
    width: '100%',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    overflow: 'hidden',
  },
  daystext: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 10,
  },
  medicationReminder: {
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  reminderIcon: {
    width: 40,
    height: 40,
    marginRight: 10,
  },
  reminderText: {
    fontSize: 16,
  },
  medicationList: {
    marginVertical: 20,
  },
  medicationItem: {
    marginHorizontal: 10,
  },
  medicationImage: {
    width: 50,
    height: 50,
  },
  bottomNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  bottomIcon: {
    width: 24,
    height: 24,
  },
  notificationsContainer: {
    flex: 1,
    padding: 20,
  },
  notificationItem: {
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  notificationText: {
    fontSize: 16,
  },
});

export default App;