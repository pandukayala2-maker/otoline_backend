import { WishlistDocument, WishlistModel } from './wishlist_model';

class WishlistServices {
    static addFav = async (wishlist: WishlistDocument, id: string) => {
        const existingWishlist = await WishlistModel.findById(id).exec();
        if (!existingWishlist) {
            wishlist._id = id;
            // Initialize arrays if undefined
            wishlist.product = wishlist.product || [];
            wishlist.service = wishlist.service || [];
            wishlist.vendor = wishlist.vendor || [];
            wishlist.car = wishlist.car || [];
            await WishlistModel.create(wishlist);
            return await this.findFav(id);
        }
        
        // Initialize arrays if undefined
        if (!existingWishlist.product) existingWishlist.product = [];
        if (!existingWishlist.service) existingWishlist.service = [];
        if (!existingWishlist.vendor) existingWishlist.vendor = [];
        if (!existingWishlist.car) existingWishlist.car = [];
        
        // Handle products
        for (const newProduct of wishlist.product || []) {
            const productIndex = existingWishlist.product.indexOf(newProduct);
            if (productIndex === -1) {
                existingWishlist.product.push(newProduct);
            } else {
                existingWishlist.product.splice(productIndex, 1);
            }
        }
        
        // Handle services
        for (const newService of wishlist.service || []) {
            const serviceIndex = existingWishlist.service.indexOf(newService);
            if (serviceIndex === -1) {
                existingWishlist.service.push(newService);
            } else {
                existingWishlist.service.splice(serviceIndex, 1);
            }
        }
        
        // Handle vendors
        for (const newVendor of wishlist.vendor || []) {
            const vendorIndex = existingWishlist.vendor.indexOf(newVendor);
            if (vendorIndex === -1) {
                existingWishlist.vendor.push(newVendor);
            } else {
                existingWishlist.vendor.splice(vendorIndex, 1);
            }
        }
        
        // Handle cars
        for (const newCar of wishlist.car || []) {
            const carIndex = existingWishlist.car.indexOf(newCar);
            if (carIndex === -1) {
                existingWishlist.car.push(newCar);
            } else {
                existingWishlist.car.splice(carIndex, 1);
            }
        }
        
        await existingWishlist.save();
        return await this.findFav(id);
    };

    static findFav = async (filter: string) =>
        await WishlistModel.findById(filter)
            .populate({
                path: 'product',
                select: 'name price image_list stock discount'
            })
            .populate({
                path: 'service',
                select: 'name price image_list discount'
            })
            .populate({
                path: 'vendor',
                select: 'company_name phone rating image email'
            })
            .populate({
                path: 'car',
                select: 'car_type car_make car_model year seller_name selling_price'
            })

            .exec();
}

export default WishlistServices;
