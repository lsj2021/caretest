import React, { createContext, useState } from 'react';

export const BluetoothContext = createContext();

export const BluetoothProvider = ({ children }) => {
  const [receivedData, setReceivedData] = useState('');

  return (
    <BluetoothContext.Provider value={{ receivedData, setReceivedData }}>
      {children}
    </BluetoothContext.Provider>
  );
};
