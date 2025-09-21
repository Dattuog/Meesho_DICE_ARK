import { configureStore } from '@reduxjs/toolkit';

// Simple store for demo - in production would have proper slices
const initialState = {
  user: {
    id: 'demo_user_1',
    name: 'Demo Customer',
    email: 'demo@meesho.com',
    walletBalance: 150.00
  },
  orders: [],
  returns: [],
  renewedProducts: []
};

const rootReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'SET_ORDERS':
      return { ...state, orders: action.payload };
    case 'ADD_RETURN':
      return { ...state, returns: [...state.returns, action.payload] };
    case 'UPDATE_WALLET':
      return { 
        ...state, 
        user: { 
          ...state.user, 
          walletBalance: state.user.walletBalance + action.payload 
        } 
      };
    default:
      return state;
  }
};

export const store = configureStore({
  reducer: rootReducer,
});

export default store;