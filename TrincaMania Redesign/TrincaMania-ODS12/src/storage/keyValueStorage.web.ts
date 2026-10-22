import AsyncStorage from '@react-native-async-storage/async-storage';
import { createWebSessionStorage } from './webSessionStorage';

export default createWebSessionStorage(
  AsyncStorage,
  typeof window === 'undefined' ? '' : window.location.search,
);
