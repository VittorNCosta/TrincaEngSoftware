import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createBrowserTestStorage,
  createVisitorStorage,
} from './webSessionStorage';

const sessionMode =
  typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('modo')
    : null;
const isolatedMode = sessionMode === 'feira' || sessionMode === 'dev';

export default isolatedMode
  ? createVisitorStorage()
  : createBrowserTestStorage(AsyncStorage);
