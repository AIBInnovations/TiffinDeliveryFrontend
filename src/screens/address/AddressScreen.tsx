// src/screens/address/AddressScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StatusBar,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackScreenProps } from '@react-navigation/stack';
import { MainTabParamList } from '../../types/navigation';
import { useAddress, Address } from '../../context/AddressContext';

type Props = StackScreenProps<MainTabParamList, 'Address'>;

const AddressScreen: React.FC<Props> = ({ navigation }) => {
  const { addresses, addAddress, updateAddress, removeAddress } = useAddress();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newAddress, setNewAddress] = useState({
    label: '',
    name: '',
    phone: '',
    address: '',
  });

  // Filter addresses based on search query
  const filteredAddresses = addresses.filter(address =>
    address.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    address.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    address.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddAddress = () => {
    if (newAddress.label && newAddress.name && newAddress.phone && newAddress.address) {
      addAddress({
        label: newAddress.label,
        isMain: false,
        name: newAddress.name,
        phone: newAddress.phone,
        address: newAddress.address,
        distance: '0m away',
      });
      setShowAddModal(false);
      setNewAddress({ label: '', name: '', phone: '', address: '' });
    }
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setShowEditModal(true);
  };

  const handleUpdateAddress = () => {
    if (editingAddress && editingAddress.label && editingAddress.name && editingAddress.phone && editingAddress.address) {
      updateAddress(editingAddress.id, {
        label: editingAddress.label,
        name: editingAddress.name,
        phone: editingAddress.phone,
        address: editingAddress.address,
      });
      setShowEditModal(false);
      setEditingAddress(null);
    }
  };

  const handleDeleteAddress = (id: string) => {
    removeAddress(id);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-5 pt-4 pb-6">
          <View className="flex-row items-center mb-2">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="w-10 h-10 rounded-full bg-orange-400 items-center justify-center mr-4"
            >
              <Image
                source={require('../../assets/icons/backarrow2.png')}
                style={{ width: 32, height: 30,  }}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <View className="flex-1" style={{ marginLeft: 55 }}>
              <Text className="text-2xl font-bold text-gray-900">My Address</Text>
              <Text className="text-sm text-gray-500 mt-1">
                {searchQuery ? `${filteredAddresses.length} of ${addresses.length} Addresses` : `${addresses.length} Addresses Saved`}
              </Text>
            </View>
          </View>
        </View>

        {/* Search Bar */}
        <View className="mx-5 mb-5">
          <View className="flex-row items-center rounded-full px-5" style={{ paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(217, 217, 217, 1)', backgroundColor: 'rgba(255, 255, 255, 1)' }} >
            <Image
              source={require('../../assets/icons/search.png')}
              style={{ width: 20, height: 20 }}
              resizeMode="contain"
            />
            <TextInput
              placeholder="Search for an address"
              placeholderTextColor="#9CA3AF"
              className="flex-1 text-gray-700 ml-3"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text className="text-gray-400 text-lg ml-2">✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View className="flex-row mx-5 mb-6">
          <TouchableOpacity
            onPress={() => setShowAddModal(true)}
            className="flex-1 mr-2 bg-white rounded-2xl p-4 flex-row items-center justify-center"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <View className="w-8 h-8 rounded-full items-center justify-center mr-3">
              <Image
                source={require('../../assets/icons/Add.png')}
                style={{ width: 35, height: 35, }}
                resizeMode="contain"
              />
            </View>
            <View>
              <Text className="text-sm font-semibold text-gray-900">Add New</Text>
              <Text className="text-sm font-semibold text-gray-900">Address</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 ml-2 bg-white rounded-2xl p-4 flex-row items-center justify-center"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <View className="w-8 h-8 rounded-full items-center justify-center mr-3">
              <Image
                source={require('../../assets/icons/location3.png')}
                style={{ width: 35, height: 35, }}
              />
            </View>
            <View>
              <Text className="text-sm font-semibold text-gray-900">Use Current</Text>
              <Text className="text-sm font-semibold text-gray-900">Location</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Delivery Address Section */}
        <View className="mx-5 mb-6">
          <Text className="text-xl font-bold text-gray-900 mb-4">Delivery Address</Text>

          {filteredAddresses.length === 0 ? (
            <View className="items-center justify-center py-12">
              <Text className="text-6xl mb-4">📍</Text>
              <Text className="text-lg font-semibold text-gray-900 mb-2">No Address Found</Text>
              <Text className="text-sm text-gray-500 text-center">
                {searchQuery ? 'No addresses match your search' : 'No saved addresses yet'}
              </Text>
            </View>
          ) : (
            filteredAddresses.map((address) => (
            <View
              key={address.id}
              className="mb-4 bg-white rounded-2xl p-5"
              style={{
                borderWidth: 1,
                borderColor: 'rgba(245, 107, 76, 1)',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              {/* Header: Label, Main Badge, Edit */}
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                  <Text className="text-lg font-bold text-gray-900">{address.label}</Text>
                  {address.isMain && (
                    <View className="ml-3 bg-green-100 px-3 py-1 rounded-full">
                      <Text className="text-xs font-semibold text-green-700">Main</Text>
                    </View>
                  )}
                </View>
                <View className="flex-row items-center">
                  <TouchableOpacity
                    className="flex-row items-center mr-4"
                    onPress={() => handleDeleteAddress(address.id)}
                  >
                    <Text style={{ color: 'rgba(250, 84, 84, 1)', fontWeight: '600', marginRight: 4 }}>Delete</Text>
                    <Image
                      source={require('../../assets/icons/delete.png')}
                      style={{ width: 16, height: 16, tintColor: 'rgba(250, 84, 84, 1)' }}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-row items-center"
                    onPress={() => handleEditAddress(address)}
                  >
                    <Text className="text-green-600 font-semibold mr-1">Edit</Text>
                    <Image
                      source={require('../../assets/icons/edit2.png')}
                      style={{ width: 16, height: 16, tintColor: '#16a34a' }}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Horizontal Divider Line */}
              <View style={{ width: '113%', height: 1, backgroundColor: 'rgba(228, 228, 228, 1)', marginBottom: 12, marginLeft: -20, marginRight: -30 }} />

              {/* Address Name and Phone Number */}
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-base font-bold text-gray-900">
                  {address.name}
                </Text>
                <View className="flex-row items-center">
                  <Image
                    source={require('../../assets/icons/call2.png')}
                    style={{ width: 16, height: 16, tintColor: '#FB923C', marginRight: 8 }}
                    resizeMode="contain"
                  />
                  <Text className="text-sm text-gray-700">{address.phone}</Text>
                </View>
              </View>

              {/* Full Address */}
              <Text className="text-sm text-gray-600 mb-1">{address.address}</Text>

              {/* Distance */}
              <View className="flex-row items-center">
                <Image
                  source={require('../../assets/icons/location2.png')}
                  style={{ width: 16, height: 16, tintColor: '#FB923C', marginRight: 8 }}
                  resizeMode="contain"
                />
                <Text className="text-sm text-gray-500">{address.distance}</Text>
              </View>
            </View>
          ))
          )}
        </View>

        {/* Bottom Spacing */}
      
      </ScrollView>

      {/* Add Address Modal */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <View className="bg-white rounded-t-3xl px-6 py-6" style={{ maxHeight: '80%' }}>
              {/* Modal Header */}
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-2xl font-bold text-gray-900">Add New Address</Text>
                <TouchableOpacity onPress={() => setShowAddModal(false)}>
                  <Text className="text-gray-500 text-3xl">×</Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Label Input */}
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-gray-700 mb-2">Label</Text>
                  <TextInput
                    value={newAddress.label}
                    onChangeText={(text) => setNewAddress({ ...newAddress, label: text })}
                    placeholder="e.g., Home, Office, Friend's Place"
                    placeholderTextColor="#9CA3AF"
                    className="bg-gray-50 rounded-2xl px-4 py-3 text-gray-900 border border-gray-200"
                  />
                </View>

                {/* Name Input */}
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-gray-700 mb-2">Building/Apartment Name</Text>
                  <TextInput
                    value={newAddress.name}
                    onChangeText={(text) => setNewAddress({ ...newAddress, name: text })}
                    placeholder="e.g., Abcd Apartment"
                    placeholderTextColor="#9CA3AF"
                    className="bg-gray-50 rounded-2xl px-4 py-3 text-gray-900 border border-gray-200"
                  />
                </View>

                {/* Phone Input */}
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-gray-700 mb-2">Phone Number</Text>
                  <TextInput
                    value={newAddress.phone}
                    onChangeText={(text) => setNewAddress({ ...newAddress, phone: text })}
                    placeholder="+91 93748-44983"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                    className="bg-gray-50 rounded-2xl px-4 py-3 text-gray-900 border border-gray-200"
                  />
                </View>

                {/* Address Input */}
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-gray-700 mb-2">Complete Address</Text>
                  <TextInput
                    value={newAddress.address}
                    onChangeText={(text) => setNewAddress({ ...newAddress, address: text })}
                    placeholder="123 Main Street, Apartment 4B, City - PIN"
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    className="bg-gray-50 rounded-2xl px-4 py-3 text-gray-900 border border-gray-200"
                    style={{ minHeight: 80 }}
                  />
                </View>

                {/* Save Button */}
                <TouchableOpacity
                  onPress={handleAddAddress}
                  className="bg-orange-400 rounded-full py-4 items-center justify-center mt-2 mb-4"
                >
                  <Text className="text-white font-bold text-base">Save Address</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Address Modal */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <View className="bg-white rounded-t-3xl px-6 py-6" style={{ maxHeight: '80%' }}>
              {/* Modal Header */}
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-2xl font-bold text-gray-900">Edit Address</Text>
                <TouchableOpacity onPress={() => setShowEditModal(false)}>
                  <Text className="text-gray-500 text-3xl">×</Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Label Input */}
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-gray-700 mb-2">Label</Text>
                  <TextInput
                    value={editingAddress?.label || ''}
                    onChangeText={(text) => setEditingAddress(editingAddress ? { ...editingAddress, label: text } : null)}
                    placeholder="e.g., Home, Office, Friend's Place"
                    placeholderTextColor="#9CA3AF"
                    className="bg-gray-50 rounded-2xl px-4 py-3 text-gray-900 border border-gray-200"
                  />
                </View>

                {/* Name Input */}
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-gray-700 mb-2">Building/Apartment Name</Text>
                  <TextInput
                    value={editingAddress?.name || ''}
                    onChangeText={(text) => setEditingAddress(editingAddress ? { ...editingAddress, name: text } : null)}
                    placeholder="e.g., Abcd Apartment"
                    placeholderTextColor="#9CA3AF"
                    className="bg-gray-50 rounded-2xl px-4 py-3 text-gray-900 border border-gray-200"
                  />
                </View>

                {/* Phone Input */}
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-gray-700 mb-2">Phone Number</Text>
                  <TextInput
                    value={editingAddress?.phone || ''}
                    onChangeText={(text) => setEditingAddress(editingAddress ? { ...editingAddress, phone: text } : null)}
                    placeholder="+91 93748-44983"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                    className="bg-gray-50 rounded-2xl px-4 py-3 text-gray-900 border border-gray-200"
                  />
                </View>

                {/* Address Input */}
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-gray-700 mb-2">Complete Address</Text>
                  <TextInput
                    value={editingAddress?.address || ''}
                    onChangeText={(text) => setEditingAddress(editingAddress ? { ...editingAddress, address: text } : null)}
                    placeholder="123 Main Street, Apartment 4B, City - PIN"
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    className="bg-gray-50 rounded-2xl px-4 py-3 text-gray-900 border border-gray-200"
                    style={{ minHeight: 80 }}
                  />
                </View>

                {/* Update Button */}
                <TouchableOpacity
                  onPress={handleUpdateAddress}
                  className="bg-orange-400 rounded-full py-4 items-center justify-center mt-2 mb-4"
                >
                  <Text className="text-white font-bold text-base">Update Address</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

export default AddressScreen;
