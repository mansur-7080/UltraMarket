/**
 * UltraMarket E-Commerce Platform
 * User Redux Slice - TypeScript
 * Professional User State Management
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User, Address, UserPreferences } from '../../services/types';
import { userService } from '../../services';

// User state interface
interface UserState {
  profile: User | null;
  addresses: Address[];
  preferences: UserPreferences | null;
  loading: boolean;
  error: string | null;
  updateLoading: boolean;
  addressLoading: boolean;
}

// Initial state
const initialState: UserState = {
  profile: null,
  addresses: [],
  preferences: null,
  loading: false,
  error: null,
  updateLoading: false,
  addressLoading: false,
};

// Async thunks
export const fetchUserProfile = createAsyncThunk(
  'user/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await userService.getProfile();
      return response.data?.user || null;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch user profile');
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'user/updateProfile',
  async (userData: Partial<User>, { rejectWithValue }) => {
    try {
      const response = await userService.updateProfile(userData);
      return response.data?.user || null;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update profile');
    }
  }
);

export const fetchUserAddresses = createAsyncThunk(
  'user/fetchAddresses',
  async (_, { rejectWithValue }) => {
    try {
      const response = await userService.getAddresses();
      return response.data?.addresses || [];
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch addresses');
    }
  }
);

export const addUserAddress = createAsyncThunk(
  'user/addAddress',
  async (address: Omit<Address, 'id'>, { rejectWithValue }) => {
    try {
      const response = await userService.addAddress(address);
      return response.data?.address || null;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to add address');
    }
  }
);

export const updateUserAddress = createAsyncThunk(
  'user/updateAddress',
  async ({ id, address }: { id: string; address: Partial<Address> }, { rejectWithValue }) => {
    try {
      const response = await userService.updateAddress(id, address);
      return response.data?.address || null;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update address');
    }
  }
);

export const deleteUserAddress = createAsyncThunk(
  'user/deleteAddress',
  async (id: string, { rejectWithValue }) => {
    try {
      await userService.deleteAddress(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete address');
    }
  }
);

export const updateUserPreferences = createAsyncThunk(
  'user/updatePreferences',
  async (preferences: Partial<UserPreferences>, { rejectWithValue }) => {
    try {
      const response = await userService.updatePreferences(preferences);
      return response.data?.preferences || null;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update preferences');
    }
  }
);

// User slice
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearUserError: (state) => {
      state.error = null;
    },
    setUserProfile: (state, action: PayloadAction<User>) => {
      state.profile = action.payload;
    },
    clearUserProfile: (state) => {
      state.profile = null;
      state.addresses = [];
      state.preferences = null;
      state.error = null;
    },
    updateUserField: (state, action: PayloadAction<{ field: keyof User; value: any }>) => {
      if (state.profile) {
        (state.profile as any)[action.payload.field] = action.payload.value;
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch user profile
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update user profile
    builder
      .addCase(updateUserProfile.pending, (state) => {
        state.updateLoading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.updateLoading = false;
        state.profile = action.payload;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.updateLoading = false;
        state.error = action.payload as string;
      });

    // Fetch addresses
    builder
      .addCase(fetchUserAddresses.pending, (state) => {
        state.addressLoading = true;
        state.error = null;
      })
      .addCase(fetchUserAddresses.fulfilled, (state, action) => {
        state.addressLoading = false;
        state.addresses = action.payload;
      })
      .addCase(fetchUserAddresses.rejected, (state, action) => {
        state.addressLoading = false;
        state.error = action.payload as string;
      });

    // Add address
    builder
      .addCase(addUserAddress.pending, (state) => {
        state.addressLoading = true;
        state.error = null;
      })
      .addCase(addUserAddress.fulfilled, (state, action) => {
        state.addressLoading = false;
        if (action.payload) {
          state.addresses.push(action.payload);
        }
      })
      .addCase(addUserAddress.rejected, (state, action) => {
        state.addressLoading = false;
        state.error = action.payload as string;
      });

    // Update address
    builder
      .addCase(updateUserAddress.fulfilled, (state, action) => {
        const payload = action.payload as Address | null;
        if (payload && payload.id) {
          const index = state.addresses.findIndex(addr => addr.id === payload.id);
          if (index !== -1) {
            state.addresses[index] = payload;
          }
        }
      });

    // Delete address
    builder
      .addCase(deleteUserAddress.fulfilled, (state, action) => {
        state.addresses = state.addresses.filter(addr => addr.id !== action.payload);
      });

    // Update preferences
    builder
      .addCase(updateUserPreferences.fulfilled, (state, action) => {
        state.preferences = action.payload;
        if (state.profile) {
          state.profile.preferences = action.payload || state.profile.preferences;
        }
      });
  },
});

// Export actions
export const userActions = userSlice.actions;
export const { clearUserError, setUserProfile, clearUserProfile, updateUserField } = userSlice.actions;

// Export reducer
export default userSlice.reducer; 