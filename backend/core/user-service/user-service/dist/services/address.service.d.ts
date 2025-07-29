import { Address, AddressType } from '@prisma/client';
export interface CreateAddressData {
    type: AddressType;
    region: string;
    district: string;
    city?: string;
    mahalla?: string;
    street: string;
    house: string;
    apartment?: string;
    postalCode?: string;
    landmark?: string;
    instructions?: string;
    isDefault?: boolean;
}
export interface UpdateAddressData {
    type?: AddressType;
    region?: string;
    district?: string;
    city?: string;
    mahalla?: string;
    street?: string;
    house?: string;
    apartment?: string;
    postalCode?: string;
    landmark?: string;
    instructions?: string;
    isDefault?: boolean;
}
export interface GetAddressesFilters {
    type?: AddressType;
    isActive?: boolean;
}
export declare class AddressService {
    getUserAddresses(userId: string, filters?: GetAddressesFilters): Promise<Address[]>;
    createAddress(userId: string, addressData: CreateAddressData): Promise<Address>;
    getAddressById(userId: string, addressId: string): Promise<Address>;
    updateAddress(userId: string, addressId: string, updateData: UpdateAddressData): Promise<Address>;
    deleteAddress(userId: string, addressId: string): Promise<void>;
    setDefaultAddress(userId: string, addressId: string): Promise<Address>;
    getDefaultAddress(userId: string, type?: AddressType): Promise<Address | null>;
    addressExists(userId: string, addressId: string): Promise<boolean>;
}
export declare const addressService: AddressService;
//# sourceMappingURL=address.service.d.ts.map