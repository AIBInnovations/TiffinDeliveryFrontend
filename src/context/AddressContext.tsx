// src/context/AddressContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Address {
  id: string;
  label: string;
  isMain: boolean;
  name: string;
  phone: string;
  address: string;
  distance: string;
}

interface AddressContextType {
  addresses: Address[];
  addAddress: (address: Omit<Address, 'id'>) => void;
  updateAddress: (id: string, address: Partial<Address>) => void;
  removeAddress: (id: string) => void;
  setMainAddress: (id: string) => void;
  getMainAddress: () => Address | undefined;
}

const AddressContext = createContext<AddressContextType | undefined>(undefined);

export const AddressProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [addresses, setAddresses] = useState<Address[]>([
    {
      id: '1',
      label: 'Home',
      isMain: true,
      name: 'Abcd Apartment',
      phone: '+91 93748-44983',
      address: '123 Main Street, Vijay Nagar, Indore',
      distance: '0m away',
    },
    {
      id: '2',
      label: 'Office',
      isMain: false,
      name: 'Abcd Apartment',
      phone: '+91 93748-44983',
      address: '456 Business Park, MG Road, Indore',
      distance: '1.2km away',
    },
    {
      id: '3',
      label: 'Other',
      isMain: false,
      name: 'Abcd Street',
      phone: '+91 93748-44983',
      address: '789 Residential Area, AB Road, Indore',
      distance: '3.3km away',
    },
  ]);

  const addAddress = (newAddress: Omit<Address, 'id'>) => {
    const address: Address = {
      ...newAddress,
      id: (addresses.length + 1).toString(),
    };
    setAddresses(prevAddresses => [...prevAddresses, address]);
  };

  const updateAddress = (id: string, updatedFields: Partial<Address>) => {
    setAddresses(prevAddresses =>
      prevAddresses.map(addr =>
        addr.id === id ? { ...addr, ...updatedFields } : addr
      )
    );
  };

  const removeAddress = (id: string) => {
    setAddresses(prevAddresses => prevAddresses.filter(addr => addr.id !== id));
  };

  const setMainAddress = (id: string) => {
    setAddresses(prevAddresses =>
      prevAddresses.map(addr => ({
        ...addr,
        isMain: addr.id === id,
      }))
    );
  };

  const getMainAddress = () => {
    return addresses.find(addr => addr.isMain);
  };

  return (
    <AddressContext.Provider
      value={{
        addresses,
        addAddress,
        updateAddress,
        removeAddress,
        setMainAddress,
        getMainAddress,
      }}
    >
      {children}
    </AddressContext.Provider>
  );
};

export const useAddress = () => {
  const context = useContext(AddressContext);
  if (!context) {
    throw new Error('useAddress must be used within an AddressProvider');
  }
  return context;
};
