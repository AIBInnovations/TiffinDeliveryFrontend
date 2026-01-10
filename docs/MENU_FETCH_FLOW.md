# Menu Fetch Flow - Implementation Guide

## 📋 Overview

Complete implementation of the menu fetching flow after location/zone serviceability check. The user never needs to know which kitchen is serving - the app automatically selects and fetches the menu.

## 🎯 Flow Diagram

```
Pincode Entry/GPS Detection
        ↓
Check Serviceability
        ↓
   ┌────┴────┐
   ↓         ↓
Serviceable  Not Serviceable
   ↓         ↓
   │    Show "Not Serviceable" Screen
   │
   ↓
Lookup Zone by Pincode
   ↓
Get Kitchens for Zone
   ↓
Select First Kitchen
   ↓
Fetch Kitchen Menu
   ↓
Store in AsyncStorage
   ↓
Navigate to Home Screen
```

## 🔧 Implementation

### API Service Methods

Added to [src/services/api.service.ts](../src/services/api.service.ts):

1. **getKitchensForZone** - Get all kitchens serving a zone
   ```typescript
   async getKitchensForZone(zoneId: string, menuType?: 'MEAL_MENU' | 'ON_DEMAND_MENU')
   ```

2. **getKitchenMenu** - Get complete menu from a kitchen (updated with menuType param)
   ```typescript
   async getKitchenMenu(kitchenId: string, menuType?: 'MEAL_MENU' | 'ON_DEMAND_MENU')
   ```

3. **getMealMenuForWindow** - Get specific meal window (LUNCH/DINNER)
   ```typescript
   async getMealMenuForWindow(kitchenId: string, mealWindow: 'LUNCH' | 'DINNER')
   ```

### Location Flow Updates

Both [LocationSetupScreen.tsx](../src/screens/location/LocationSetupScreen.tsx) and [PincodeInputScreen.tsx](../src/screens/location/PincodeInputScreen.tsx) now include:

**Complete Flow in `checkServiceability` / `handleSubmit`:**

```typescript
1. Check Serviceability
   ↓
2. Lookup Zone (GET /api/zones/lookup/:pincode)
   ↓
3. Get Kitchens (GET /api/kitchens/zone/:zoneId?menuType=MEAL_MENU)
   ↓
4. Select First Available Kitchen
   ↓
5. Fetch Menu (GET /api/menu/kitchen/:kitchenId?menuType=MEAL_MENU)
   ↓
6. Store Data in AsyncStorage:
   - @selected_pincode
   - @selected_zone
   - @selected_kitchen
   - @kitchen_menu
   ↓
7. Mark location setup complete
```

## 💾 Data Storage

### AsyncStorage Keys

| Key | Description | Format |
|-----|-------------|--------|
| `@selected_pincode` | User's pincode | String (e.g., "110001") |
| `@selected_zone` | Zone information | JSON object |
| `@selected_kitchen` | Selected kitchen | JSON object |
| `@kitchen_menu` | Kitchen's menu data | JSON object |
| `@location_setup_complete` | Setup completion flag | "true" or null |

### Zone Data Structure

```typescript
{
  "_id": "6789abc123def456789abc01",
  "pincode": "110001",
  "name": "Connaught Place",
  "city": "New Delhi",
  "state": "Delhi",
  "status": "ACTIVE",
  "orderingEnabled": true
}
```

### Kitchen Data Structure

```typescript
{
  "_id": "6789abc123def456789abc02",
  "name": "Tiffsy Central Kitchen",
  "code": "KIT-TIFSY",
  "type": "TIFFSY",
  "premiumFlag": true,
  "gourmetFlag": false,
  "logo": "https://placeholder.com/logo.png",
  "coverImage": "https://placeholder.com/cover.png",
  "description": "Authentic home-style tiffin meals",
  "cuisineTypes": ["North Indian", "South Indian"],
  "averageRating": 4.5,
  "totalRatings": 150,
  "isAcceptingOrders": true
}
```

### Menu Data Structure

```typescript
{
  "mealMenu": {
    "lunch": {
      "_id": "6789abc123def456789abc03",
      "name": "Lunch Special Thali",
      "description": "Complete lunch thali with 2 sabzis, dal, rice, 4 rotis",
      "category": "MAIN_COURSE",
      "menuType": "MEAL_MENU",
      "mealWindow": "LUNCH",
      "price": 150,
      "portionSize": "Full Thali (serves 1)",
      "dietaryType": "VEG",
      "spiceLevel": "MEDIUM",
      "includes": ["2 Seasonal Sabzis", "Dal Tadka", "Jeera Rice", "4 Rotis"],
      "isAvailable": true,
      "addonIds": [...]
    },
    "dinner": {
      "_id": "6789abc123def456789abc04",
      "name": "Dinner Deluxe Thali",
      "description": "Premium dinner thali with paneer sabzi",
      "category": "MAIN_COURSE",
      "menuType": "MEAL_MENU",
      "mealWindow": "DINNER",
      "price": 180,
      "dietaryType": "VEG",
      "isAvailable": true,
      "addonIds": []
    }
  },
  "onDemandMenu": []
}
```

## 📡 API Endpoints Used

### 1. Check Serviceability
```
POST /api/customer/check-serviceability
Body: { "pincode": "110001" }
```

### 2. Lookup Zone
```
GET /api/zones/lookup/110001
No auth required
```

### 3. Get Kitchens for Zone
```
GET /api/kitchens/zone/6789abc123def456789abc01?menuType=MEAL_MENU
No auth required
Optional query: menuType=MEAL_MENU or ON_DEMAND_MENU
```

### 4. Get Kitchen Menu
```
GET /api/menu/kitchen/6789abc123def456789abc02?menuType=MEAL_MENU
No auth required
Optional query: menuType=MEAL_MENU or ON_DEMAND_MENU
```

### 5. Get Specific Meal Window (Alternative)
```
GET /api/menu/kitchen/6789abc123def456789abc02/meal/LUNCH
No auth required
mealWindow: LUNCH or DINNER
```

## 🔄 User Experience

### Success Flow

1. User enters pincode or uses GPS
2. App shows loading indicator
3. Console logs show progress:
   ```
   🔍 Checking serviceability for pincode: 110001
   ✅ Area is serviceable!
   📍 Looking up zone for pincode: 110001
   ✅ Zone found: Connaught Place - ID: 6789abc...
   🍽️ Fetching kitchens for zone: 6789abc...
   ✅ Found 3 kitchen(s)
   🏪 Selected kitchen: Tiffsy Central Kitchen
   📋 Fetching menu from kitchen: 6789abc...
   ✅ Menu fetched successfully!
   ✅ Location setup complete - ready to navigate to home
   ```
4. AppNavigator detects location_setup_complete flag
5. Automatically navigates to Home Screen
6. Home Screen reads menu data from AsyncStorage

### Error Handling

**Error: Zone not found**
```javascript
throw new Error('Zone not found for this pincode');
// User sees: "Zone not found for this pincode"
```

**Error: No kitchens available**
```javascript
throw new Error('No kitchens available in this area');
// User sees: "No kitchens available in this area"
```

**Error: Menu fetch failed**
```javascript
throw new Error('Failed to fetch menu');
// User sees: "Failed to fetch menu"
```

## 🏠 Home Screen Integration

The Home Screen should:

1. **Read stored data on mount:**
   ```typescript
   useEffect(() => {
     const loadMenuData = async () => {
       const pincode = await AsyncStorage.getItem('@selected_pincode');
       const zone = await AsyncStorage.getItem('@selected_zone');
       const kitchen = await AsyncStorage.getItem('@selected_kitchen');
       const menu = await AsyncStorage.getItem('@kitchen_menu');

       if (menu) {
         const menuData = JSON.parse(menu);
         // Display lunch and dinner options
         setLunchMenu(menuData.mealMenu?.lunch);
         setDinnerMenu(menuData.mealMenu?.dinner);
       }
     };
     loadMenuData();
   }, []);
   ```

2. **Display menu items:**
   - Show lunch and dinner thalis
   - Display prices, descriptions
   - Show available addons
   - Allow users to add to cart

3. **Handle kitchen info:**
   - Kitchen name is available but doesn't need to be prominently displayed
   - Focus on the food items and pricing

## 🔄 Refresh Flow

To refresh menu (e.g., when user changes location):

```typescript
const refreshMenu = async () => {
  const pincode = await AsyncStorage.getItem('@selected_pincode');
  const zone = JSON.parse(await AsyncStorage.getItem('@selected_zone') || '{}');
  const kitchen = JSON.parse(await AsyncStorage.getItem('@selected_kitchen') || '{}');

  // Fetch fresh menu
  const menuResponse = await apiService.getKitchenMenu(kitchen._id, 'MEAL_MENU');

  if (menuResponse.success) {
    await AsyncStorage.setItem('@kitchen_menu', JSON.stringify(menuResponse.data));
    // Update UI
  }
};
```

## 🎨 UI Considerations

1. **Loading States:**
   - Show spinner during multi-step fetch
   - Use descriptive loading messages: "Finding kitchens nearby...", "Loading menu..."

2. **Error Messages:**
   - Clear, actionable error messages
   - Provide retry button

3. **Menu Display:**
   - Separate lunch and dinner sections
   - Show availability status
   - Highlight dietary types (VEG/NON-VEG)
   - Display addons as optional extras

## 🚀 Future Enhancements

1. **Multiple Kitchen Support:**
   - Allow users to browse different kitchens in their zone
   - Compare menus and prices

2. **Menu Caching:**
   - Cache menu with timestamp
   - Auto-refresh after certain duration

3. **Personalization:**
   - Filter by dietary preferences
   - Show recommended items based on user history

4. **Real-time Updates:**
   - Socket connection for menu availability changes
   - Price updates

## ⚠️ Important Notes

1. **Kitchen Selection Logic:**
   - Currently selects first kitchen from array
   - Future: Can implement logic to select based on rating, availability, user preference

2. **Menu Type:**
   - Currently fetches MEAL_MENU only
   - Can be extended to support ON_DEMAND_MENU

3. **Error Recovery:**
   - All errors show user-friendly messages
   - Users can retry or enter different pincode
   - App never blocks user from proceeding

4. **Data Persistence:**
   - Menu data stored in AsyncStorage
   - Survives app restarts
   - Should be refreshed daily or when user changes location

## ✅ Testing Checklist

- [ ] Serviceable pincode → Full flow completes successfully
- [ ] Non-serviceable pincode → Shows NotServiceable screen
- [ ] Zone lookup fails → Appropriate error message
- [ ] No kitchens in zone → Error shown to user
- [ ] Menu fetch fails → Error handling works
- [ ] Data stored correctly in AsyncStorage
- [ ] AppNavigator navigates to Home after success
- [ ] Home screen can read and display menu data
- [ ] Console logs show complete flow
- [ ] Retry functionality works on errors

## 📚 Related Files

- [src/services/api.service.ts](../src/services/api.service.ts) - API methods
- [src/screens/location/LocationSetupScreen.tsx](../src/screens/location/LocationSetupScreen.tsx) - GPS flow
- [src/screens/location/PincodeInputScreen.tsx](../src/screens/location/PincodeInputScreen.tsx) - Manual entry flow
- [src/navigation/AppNavigator.tsx](../src/navigation/AppNavigator.tsx) - Navigation logic
- [ADDRESS_LOCATION_FLOW.md](ADDRESS_LOCATION_FLOW.md) - Location setup docs

## 🎉 Implementation Complete!

The complete menu fetching flow is now integrated. After location verification, the app automatically:
1. ✅ Finds the zone
2. ✅ Gets available kitchens
3. ✅ Fetches the menu
4. ✅ Stores everything locally
5. ✅ Navigates to Home

The user never needs to know which kitchen is serving - it's all handled seamlessly in the background!
