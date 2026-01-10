# Consumer Operations API

Base URL: `/api`

Auth: Firebase Bearer Token

---

## AUTH

### GET /api/auth/customer/status

Get profile completion status. Creates customer if not exists.

Response 200 (existing):
```json
{
  "success": true,
  "message": "Profile status retrieved successfully",
  "data": {
    "isProfileComplete": true,
    "customerId": "507f1f77bcf86cd799439060",
    "isNewUser": false,
    "hasName": true,
    "hasDietaryPreferences": true
  }
}
```

Response 201 (new user):
```json
{
  "success": true,
  "message": "Customer profile created successfully",
  "data": {
    "isProfileComplete": false,
    "customerId": "507f1f77bcf86cd799439060",
    "isNewUser": true
  }
}
```

---

### PUT /api/auth/customer/onboarding

Complete onboarding.

Request:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "dietaryPreferences": {
    "foodType": "VEG",
    "eggiterian": false,
    "jainFriendly": false,
    "dabbaType": "DISPOSABLE",
    "spiceLevel": "MEDIUM"
  }
}
```

Response 200:
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "customerId": "507f1f77bcf86cd799439060",
    "isProfileComplete": true,
    "name": "John Doe",
    "email": "john@example.com",
    "dietaryPreferences": {
      "foodType": "VEG",
      "eggiterian": false,
      "jainFriendly": false,
      "dabbaType": "DISPOSABLE",
      "spiceLevel": "MEDIUM"
    }
  }
}
```

Food types: `VEG`, `NON-VEG`, `VEGAN`

Spice levels: `HIGH`, `MEDIUM`, `LOW`

Dabba types: `DISPOSABLE`, `STEEL DABBA`

---

### GET /api/auth/customer/profile

Get comprehensive profile with orders, subscriptions, vouchers.

Response 200:
```json
{
  "success": true,
  "message": "Customer profile retrieved successfully",
  "data": {
    "profile": {
      "customerId": "507f1f77bcf86cd799439060",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "9876543210",
      "firebaseUid": "firebase_uid_abc123",
      "isProfileComplete": true,
      "autoOrder": false,
      "createdAt": "2025-01-01T10:00:00.000Z"
    },
    "address": {
      "addressLine": "123 Main Street, Mumbai",
      "dontRingBell": false,
      "dontCall": false,
      "deliveryNote": "Ring bell twice"
    },
    "dietaryPreferences": {
      "foodType": "VEG",
      "eggiterian": false,
      "jainFriendly": false,
      "dabbaType": "DISPOSABLE",
      "spiceLevel": "MEDIUM"
    },
    "activeSubscription": {
      "hasActiveSubscription": true,
      "subscriptionId": "507f1f77bcf86cd799439070"
    },
    "orders": {
      "statistics": {
        "totalOrders": 45,
        "completedOrders": 40,
        "cancelledOrders": 3,
        "pendingOrders": 2
      },
      "recentOrders": [...],
      "allOrdersCount": 45
    },
    "subscriptions": {
      "statistics": {
        "totalSubscriptions": 5,
        "activeSubscriptions": 1,
        "expiredSubscriptions": 3,
        "cancelledSubscriptions": 1
      },
      "allSubscriptions": [...]
    },
    "vouchers": {
      "statistics": {
        "totalVouchers": 60,
        "remainingVouchers": 12,
        "usedVouchers": 48,
        "expiredVouchers": 0,
        "activeVoucherBatches": 1
      },
      "allVouchers": [...]
    }
  }
}
```

---

### DELETE /api/auth/customer/delete-account

Request account deletion (10-day grace period).

Response 200:
```json
{
  "success": true,
  "message": "Your account will be deleted in 10 days.",
  "data": {
    "customerId": "507f1f77bcf86cd799439060",
    "scheduledDeletionDate": "2025-01-25T10:00:00.000Z"
  }
}
```

---

## MENU ITEMS (PUBLIC)

### GET /api/menu-items

Get all live menu items.

Query params: `mealType`, `isLive`, `minPrice`, `maxPrice`, `search`, `page`, `limit`, `sortBy`, `sortOrder`

Response 200:
```json
{
  "success": true,
  "message": "Menu items retrieved successfully",
  "data": {
    "menuItems": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Dal Rice Combo",
        "content": "Dal Fry, Steamed Rice, Roti (2), Pickle",
        "description": "Classic homestyle meal",
        "media": {
          "thumbnail": "https://res.cloudinary.com/xxx/image.jpg",
          "shuffle": []
        },
        "mealType": "LUNCH",
        "price": 120,
        "compareAtPrice": 150,
        "isLive": true
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalItems": 25
    }
  }
}
```

---

### GET /api/menu-items/:id

Get menu item by ID.

Response 200:
```json
{
  "success": true,
  "message": "Menu item retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Dal Rice Combo",
    "content": "Dal Fry, Steamed Rice, Roti (2), Pickle",
    "description": "Classic homestyle meal",
    "media": {
      "thumbnail": "https://res.cloudinary.com/xxx/image.jpg",
      "shuffle": []
    },
    "mealType": "LUNCH",
    "price": 120,
    "compareAtPrice": 150,
    "isLive": true
  }
}
```

---

## ADDONS (PUBLIC)

### GET /api/addons

Get all live addons.

Query params: `menuItemId`, `category`, `isLive`, `minPrice`, `maxPrice`, `tags`, `search`, `page`, `limit`

---

### GET /api/addons/menu-item/:menuItemId

Get addons for menu item.

Response 200:
```json
{
  "success": true,
  "message": "Addons retrieved successfully",
  "data": {
    "menuItem": {
      "id": "507f1f77bcf86cd799439011",
      "name": "Dal Rice Combo",
      "mealType": "LUNCH"
    },
    "addons": [
      {
        "_id": "507f1f77bcf86cd799439020",
        "name": "Cold Coffee",
        "price": 60,
        "category": "BEVERAGE",
        "imageUrl": "https://res.cloudinary.com/xxx/coffee.jpg"
      }
    ],
    "count": 5
  }
}
```

---

### GET /api/addons/:id

Get addon by ID.

---

## SUBSCRIPTION PLANS (PUBLIC)

### GET /api/subscription-plans/public

Get active subscription plans.

Response 200:
```json
{
  "success": true,
  "message": "Subscription plans retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439030",
      "planName": "Weekly Both Meals",
      "days": "7D",
      "planType": "BOTH",
      "totalVouchers": 14,
      "planPrice": 1400,
      "compareAtPlanPrice": 1680,
      "description": "7 days of lunch and dinner"
    }
  ]
}
```

---

### GET /api/subscription-plans/public/grouped

Get plans grouped by type.

Response 200:
```json
{
  "success": true,
  "message": "Subscription plans grouped successfully",
  "data": {
    "BOTH": [...],
    "LUNCH_ONLY": [...],
    "DINNER_ONLY": [...]
  }
}
```

---

### GET /api/subscription-plans/public/:id

Get specific plan.

---

## SUBSCRIPTIONS

### POST /api/subscriptions/purchase

Purchase subscription.

Request:
```json
{
  "planId": "507f1f77bcf86cd799439030"
}
```

Response 201:
```json
{
  "success": true,
  "message": "Subscription purchased successfully",
  "data": {
    "subscription": {
      "_id": "507f1f77bcf86cd799439070",
      "planId": {
        "_id": "507f1f77bcf86cd799439030",
        "planName": "Weekly Both Meals",
        "days": "7D",
        "planType": "BOTH",
        "totalVouchers": 14
      },
      "customerId": "507f1f77bcf86cd799439060",
      "purchaseDate": "2025-01-15T10:00:00.000Z",
      "expiryDate": "2025-01-22T10:00:00.000Z",
      "totalVouchers": 14,
      "usedVouchers": 0,
      "amountPaid": 1400,
      "status": "ACTIVE"
    },
    "voucher": {
      "_id": "507f1f77bcf86cd799439080",
      "mealType": "BOTH",
      "totalVouchers": 14,
      "remainingVouchers": 14,
      "expiryDate": "2025-01-22T10:00:00.000Z"
    }
  }
}
```

---

### GET /api/subscriptions/my

Get my subscriptions.

Query params: `status`, `sortBy`, `sortOrder`

Response 200:
```json
{
  "success": true,
  "message": "Subscriptions retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439070",
      "planId": {
        "planName": "Weekly Both Meals",
        "planType": "BOTH"
      },
      "purchaseDate": "2025-01-15T10:00:00.000Z",
      "expiryDate": "2025-01-22T10:00:00.000Z",
      "totalVouchers": 14,
      "usedVouchers": 3,
      "remainingVouchers": 11,
      "status": "ACTIVE"
    }
  ]
}
```

---

### GET /api/subscriptions/my/active

Get active subscriptions only.

---

### GET /api/subscriptions/my/summary

Get subscription summary.

Response 200:
```json
{
  "success": true,
  "message": "Subscription summary retrieved successfully",
  "data": {
    "totalSubscriptions": 5,
    "activeSubscriptions": 1,
    "expiredSubscriptions": 3,
    "cancelledSubscriptions": 1,
    "totalVouchersEarned": 70,
    "totalVouchersUsed": 58,
    "totalVouchersRemaining": 12
  }
}
```

---

### GET /api/subscriptions/my/check

Check if has active subscription.

Response 200:
```json
{
  "success": true,
  "message": "Active subscription status",
  "data": {
    "hasActiveSubscription": true,
    "activeSubscription": {
      "_id": "507f1f77bcf86cd799439070",
      "planName": "Weekly Both Meals",
      "remainingVouchers": 11,
      "expiryDate": "2025-01-22T10:00:00.000Z"
    }
  }
}
```

---

### GET /api/subscriptions/my/:id

Get specific subscription.

---

### PATCH /api/subscriptions/my/:id/cancel

Cancel subscription.

Response 200:
```json
{
  "success": true,
  "message": "Subscription cancelled successfully",
  "data": { ... }
}
```

---

### POST /api/subscriptions/use-voucher

Use voucher from subscription.

Request:
```json
{
  "subscriptionId": "507f1f77bcf86cd799439070",
  "mealType": "LUNCH",
  "count": 1
}
```

Response 200:
```json
{
  "success": true,
  "message": "Voucher used successfully",
  "data": {
    "subscription": {
      "usedVouchers": 4,
      "remainingVouchers": 10
    },
    "voucher": {
      "remainingVouchers": 10
    }
  }
}
```

---

## VOUCHERS

### GET /api/vouchers/my

Get my vouchers.

Query params: `mealType`, `hasRemaining`, `isExpired`, `includeDeleted`, `sortBy`, `sortOrder`

Response 200:
```json
{
  "success": true,
  "message": "Vouchers retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439080",
      "subscriptionId": {
        "_id": "507f1f77bcf86cd799439070",
        "planId": "507f1f77bcf86cd799439030"
      },
      "mealType": "BOTH",
      "issuedDate": "2025-01-15T10:00:00.000Z",
      "expiryDate": "2025-01-22T10:00:00.000Z",
      "totalVouchers": 14,
      "remainingVouchers": 11,
      "isExpired": false,
      "usedVouchers": 3,
      "isExhausted": false
    }
  ]
}
```

---

### GET /api/vouchers/my/available

Get available (non-expired, has remaining) vouchers.

Query params: `mealType`

---

### GET /api/vouchers/my/summary

Get voucher summary.

Response 200:
```json
{
  "success": true,
  "message": "Voucher summary retrieved successfully",
  "data": {
    "totalBatches": 5,
    "expiredBatches": 3,
    "totalVouchersIssued": 70,
    "availableVouchers": 11,
    "usedVouchers": 59,
    "availableByMealType": {
      "LUNCH": 0,
      "DINNER": 0,
      "BOTH": 11
    }
  }
}
```

---

### GET /api/vouchers/my/:id

Get specific voucher.

---

### POST /api/vouchers/use

Redeem voucher.

Request:
```json
{
  "voucherId": "507f1f77bcf86cd799439080",
  "voucherCount": 1
}
```

Response 200:
```json
{
  "success": true,
  "message": "1 voucher(s) redeemed successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439080",
    "totalVouchers": 14,
    "remainingVouchers": 10,
    "usedVouchers": 4,
    "vouchersConsumedNow": 1,
    "isExhausted": false
  }
}
```

---

## ORDERS

### POST /api/orders

Create order.

Request:
```json
{
  "mealType": "LUNCH",
  "scheduledForDate": "2025-01-16",
  "menuItemId": "507f1f77bcf86cd799439011",
  "addonIds": ["507f1f77bcf86cd799439020"],
  "specialInstructions": "Less spicy please",
  "packagingType": "DISPOSABLE",
  "useSubscription": true
}
```

Response 201:
```json
{
  "success": true,
  "message": "Order placed successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439040",
    "mealType": "LUNCH",
    "scheduledForDate": "2025-01-16T00:00:00.000Z",
    "isAutoOrder": false,
    "menuItem": {
      "menuItemId": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Dal Rice Combo",
        "price": 120
      },
      "orderPlacedPrice": 120
    },
    "addons": [
      {
        "addonId": {
          "_id": "507f1f77bcf86cd799439020",
          "name": "Cold Coffee",
          "price": 60
        },
        "orderPlacedPrice": 60
      }
    ],
    "subscriptionUsed": "507f1f77bcf86cd799439070",
    "vouchersConsumed": 1,
    "totalAmount": 0,
    "specialInstructions": "Less spicy please",
    "packagingType": "DISPOSABLE",
    "orderStatus": {
      "placedAt": "2025-01-15T10:30:00.000Z"
    },
    "currentStatus": "placed"
  }
}
```

Meal types: `LUNCH`, `DINNER`

Packaging types: `DISPOSABLE`, `STEEL_DABBA`

---

### GET /api/orders/my-orders

Get my orders.

Query params: `mealType`, `status`, `startDate`, `endDate`, `sortBy`, `sortOrder`, `page`, `limit`

Response 200:
```json
{
  "success": true,
  "message": "Orders retrieved successfully",
  "data": {
    "orders": [
      {
        "_id": "507f1f77bcf86cd799439040",
        "mealType": "LUNCH",
        "scheduledForDate": "2025-01-16T00:00:00.000Z",
        "menuItem": {
          "menuItemId": { "name": "Dal Rice Combo" },
          "orderPlacedPrice": 120
        },
        "totalAmount": 0,
        "orderStatus": {
          "placedAt": "2025-01-15T10:30:00.000Z",
          "acceptedAt": "2025-01-15T11:00:00.000Z"
        },
        "currentStatus": "accepted"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalCount": 45
    }
  }
}
```

---

### GET /api/orders/:id

Get my order by ID.

Response 200:
```json
{
  "success": true,
  "message": "Order retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439040",
    "mealType": "LUNCH",
    "scheduledForDate": "2025-01-16T00:00:00.000Z",
    "menuItem": {
      "menuItemId": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Dal Rice Combo",
        "content": "Dal Fry, Steamed Rice, Roti (2), Pickle"
      },
      "orderPlacedPrice": 120
    },
    "addons": [...],
    "subscriptionUsed": {...},
    "vouchersConsumed": 1,
    "totalAmount": 0,
    "specialInstructions": "Less spicy please",
    "packagingType": "DISPOSABLE",
    "orderStatus": {
      "placedAt": "2025-01-15T10:30:00.000Z",
      "acceptedAt": "2025-01-15T11:00:00.000Z",
      "preparingAt": "2025-01-15T11:30:00.000Z",
      "outForDeliveryAt": null,
      "deliveredAt": null
    },
    "driverId": null,
    "currentStatus": "preparing"
  }
}
```

---

### PATCH /api/orders/:id/cancel

Cancel my order.

Response 200:
```json
{
  "success": true,
  "message": "Order cancelled successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439040",
    "orderStatus": {
      "cancelledAt": "2025-01-15T10:45:00.000Z"
    },
    "currentStatus": "cancelled"
  }
}
```

Note: Orders can only be cancelled before acceptance.

---

### POST /api/orders/:orderId/refund

Request refund.

Request:
```json
{
  "reason": "Food quality was not up to the mark"
}
```

Response 200:
```json
{
  "success": true,
  "message": "Refund request submitted successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439040",
    "refundStatus": "pending",
    "refundReason": "Food quality was not up to the mark",
    "refundRequestedAt": "2025-01-16T14:00:00.000Z",
    "refundAmount": 180
  }
}
```
