import 'expo-router/entry';
import { Provider } from 'react-redux';
import store from './src/redux/store';

export default function App() {
  return (
    <Provider store={store}>
      {/* Your app content will be rendered by Expo Router */}
    </Provider>
  );
}
