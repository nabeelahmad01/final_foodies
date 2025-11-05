// Native Map Component - Uses react-native-maps
import React from 'react';
import MapView, { Marker, Polyline } from 'react-native-maps';

const MapComponent = ({ children, style, ...props }) => {
  return (
    <MapView style={style} {...props}>
      {children}
    </MapView>
  );
};

export default MapComponent;
export { Marker, Polyline };
