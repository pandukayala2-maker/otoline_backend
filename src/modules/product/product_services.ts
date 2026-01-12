import { brandLookUp, calculateRating, categoryLookup, matchId, reviewsLookup, vendorLookUp } from '../../common/base_query';
import { ProductDocument, ProductModel } from './product_model';

class ProductServices {
    static create = async (data: ProductDocument): Promise<ProductDocument> => await ProductModel.create(data);

    static find = async (filter: any, categorize: boolean = false, stock?: string | undefined): Promise<ProductDocument[]> => {
        const query = ProductModel.find(filter)
            .populate({ path: 'brand_id', select: '_id name' })
            .populate({ path: 'vendor_id', select: '_id company_name' })
            .select('id name rating price image_list discount stock vendor_id other_name');
        if (categorize) query.populate({ path: 'category_id', select: '_id name' });
        if (stock !== undefined) {
            if (stock === 'true') query.sort('stock');
            if (stock === 'false') query.sort('-stock');
        }
        return await query;
    };

    static findById = async (id: string): Promise<ProductDocument | null> => {
        const pipeline: any[] = [];
        pipeline.push(matchId(id), categoryLookup(), brandLookUp(), reviewsLookup(), calculateRating(), vendorLookUp());
        pipeline.push({ $unwind: { path: '$vendor', preserveNullAndEmptyArrays: true } });
        pipeline.push({
            $addFields: {
                id: '$_id',
                sold_price: '$price',
                price: {
                    $cond: {
                        if: { $gt: ['$discount', 0] },
                        then: {
                            $round: [{ $subtract: ['$price', { $multiply: [{ $divide: ['$discount', 100] }, '$price'] }] }, 2]
                        },
                        else: '$price'
                    }
                }
            }
        });
        pipeline.push({
            $lookup: {
                from: 'products',
                localField: 'variants',
                foreignField: '_id',
                as: 'variants',
                pipeline: [
                    {
                        $project: {
                            id: '$_id',
                            _id: 0,
                            image_list: 1,
                            name: 1
                        }
                    }
                ]
            }
        });
        pipeline.push({
            $project: {
                _id: 0,
                category_id: 0,
                brand_id: 0,
                vendor_id: 0,
                __v: 0
            }
        });
        const data: ProductDocument[] = await ProductModel.aggregate(pipeline);
        return data.length > 0 ? data[0] : null;
    };

    static update = async (data: Partial<ProductDocument>, id: string): Promise<ProductDocument | null> =>
        await ProductModel.findByIdAndUpdate(id, data, { new: true });

    static updateStock = async (productId: string, qty: number): Promise<ProductDocument | null> =>
        await ProductModel.findByIdAndUpdate(productId, { $inc: { stock: qty } }, { new: true });

    static delete = async (id: string): Promise<ProductDocument | null> => await ProductModel.findByIdAndDelete(id);

    static getVendorAssignedCategories = async (vendorId: string) => {
        const { VendorModel } = await import('../vendor/vendor_model');
        const { CategoryModel } = await import('../category/category_model');
        const { ServiceModel } = await import('../service/service_model');
        
        const categoryMap = new Map<string, any>();
        
        // 1. Get categories from vendor's category_ids array
        const vendor = await VendorModel.findById(vendorId)
            .populate({
                path: 'category_ids',
                select: '_id name other_name desc image type',
                model: CategoryModel
            });

        if (vendor?.category_ids && vendor.category_ids.length > 0) {
            (vendor.category_ids as any[]).forEach((category) => {
                if (category && category._id) {
                    categoryMap.set(category._id.toString(), {
                        id: category._id,
                        name: category.name,
                        other_name: category.other_name,
                        desc: category.desc,
                        image: category.image,
                        type: category.type
                    });
                }
            });
        }

        // 2. Get categories from vendor's existing products
        const products = await ProductModel.find({ 
            vendor_id: vendorId, 
            deleted_at: null 
        }).select('category_id');

        const productCategoryIds = new Set<string>();
        products.forEach((product: any) => {
            const cat = product.category_id;
            if (!cat) return;
            if (Array.isArray(cat)) {
                cat.forEach((catId: any) => {
                    const idStr = catId.toString();
                    if (!categoryMap.has(idStr)) productCategoryIds.add(idStr);
                });
            } else {
                const idStr = cat.toString();
                if (!categoryMap.has(idStr)) productCategoryIds.add(idStr);
            }
        });

        // 3. Get categories from vendor's existing services
        const services = await ServiceModel.find({
            vendor_id: vendorId,
            deleted_at: null
        }).select('category_id');

        const serviceCategoryIds = new Set<string>();
        services.forEach((service: any) => {
            const cat = service.category_id;
            if (!cat) return;
            if (Array.isArray(cat)) {
                cat.forEach((catId: any) => {
                    const idStr = catId.toString();
                    if (!categoryMap.has(idStr)) serviceCategoryIds.add(idStr);
                });
            } else {
                const idStr = cat.toString();
                if (!categoryMap.has(idStr)) serviceCategoryIds.add(idStr);
            }
        });

        // 4. Fetch and add product + service categories
        const combinedIds = new Set<string>([
            ...Array.from(productCategoryIds),
            ...Array.from(serviceCategoryIds),
        ]);

        if (combinedIds.size > 0) {
            const missingCategories = await CategoryModel.find({
                _id: { $in: Array.from(combinedIds) },
                deleted_at: null
            }).select('_id name other_name desc image type');

            missingCategories.forEach((category: any) => {
                categoryMap.set(category._id.toString(), {
                    id: category._id,
                    name: category.name,
                    other_name: category.other_name,
                    desc: category.desc,
                    image: category.image,
                    type: category.type
                });
            });
        }

        // Return all unique categories (admin-assigned + from products + services)
        return Array.from(categoryMap.values());
    };
}

export default ProductServices;

