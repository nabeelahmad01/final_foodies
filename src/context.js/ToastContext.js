import React, { createContext, useContext, useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { Animated, Easing, View, Text } from 'react-native';

const ToastContext = createContext({
  show: (_msg, _type = 'info') => {},
});

export const useToast = () => useContext(ToastContext);

// Global toast bridge (for non-React contexts like Axios interceptors)
let _globalToast = null;
export const showGlobalToast = (msg, type = 'info') => {
  if (typeof _globalToast === 'function') {
    _globalToast(msg, type);
  }
};

export const ToastProvider = ({ children, ToastComponent = undefined }) => {
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);
  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const hide = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: -80, duration: 200, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 200, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start(() => setVisible(false));
  }, [opacity, translateY]);

  const show = useCallback((msg, t = 'info', duration = 2000) => {
    if (!msg) return;
    setMessage(String(msg));
    setType(t);
    setVisible(true);

    Animated.parallel([
      Animated.timing(translateY, { toValue: 0, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => hide(), duration);
  }, [hide, opacity, translateY]);

  useEffect(() => () => timerRef.current && clearTimeout(timerRef.current), []);

  const value = useMemo(() => ({ show }), [show]);

  // register global toast bridge
  useEffect(() => {
    _globalToast = show;
    return () => {
      if (_globalToast === show) _globalToast = null;
    };
  }, [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {visible && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 40,
            left: 16,
            right: 16,
            transform: [{ translateY }],
            opacity,
            zIndex: 1000,
          }}
        >
          {ToastComponent ? (
            <ToastComponent message={message} type={type} />
          ) : (
            <DefaultToast message={message} type={type} />
          )}
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

const DefaultToast = ({ message, type }) => {
  const bg = type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#111827';
  return (
    <View
      style={{
        backgroundColor: bg,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      }}
    >
      <Text style={{ color: '#fff', fontWeight: '600' }}>{message}</Text>
    </View>
  );
};
