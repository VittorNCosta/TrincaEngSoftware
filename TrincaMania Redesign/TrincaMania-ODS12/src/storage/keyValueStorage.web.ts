import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createBrowserTestStorage,
  createVisitorStorage,
} from './webSessionStorage';

const fairMode =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('modo') === 'feira';

export default fairMode
  ? createVisitorStorage()
  : createBrowserTestStorage(AsyncStorage);
