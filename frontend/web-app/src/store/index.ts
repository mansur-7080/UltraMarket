/**
 * UltraMarket E-Commerce Platform
 * Redux Store Configuration - TypeScript
 * Professional State Management Setup
 */

import { configureStore, combineReducers } from '@reduxjs/toolkit';

// Import slices
import authSlice from './slices/authSlice';
import cartSlice from './slices/cartSlice';
import productSlice from './slices/productSlice';
import orderSlice from './slices/orderSlice';
import userSlice from './slices/userSlice';

// Root reducer
const rootReducer = combineReducers({
  auth: authSlice,
  cart: cartSlice,
  products: productSlice,
  orders: orderSlice,
  user: userSlice,
});

// Store configuration
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

// TypeScript types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppStore = typeof store;

// Typed hooks for use throughout the app
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Selectors for common state access
export const selectAuth = (state: RootState) => state.auth;
export const selectCart = (state: RootState) => state.cart;
export const selectProducts = (state: RootState) => state.products;
export const selectOrders = (state: RootState) => state.orders;
export const selectUser = (state: RootState) => state.user;