import { Types } from 'mongoose';
import { authLookUp, productLookUp } from '../../common/base_query';
import { VendorDocument, VendorModel } from './vendor_model';

class VendorService {
    static create = async (data: VendorDocument): Promise<VendorDocument> => await VendorModel.create(data);

    static find = async (query: any = {}) => {
        const pipeline: any[] = [];
        if (query.category_id != null) {
            pipeline.push(productLookUp());
            pipeline.push({
                $match: {
                    'products.category_id': new Types.ObjectId(query.category_id)
                }
            });

            delete query.category_id;
        }

        if (query && Object.keys(query).length > 0) pipeline.push({ $match: query });

        pipeline.push(authLookUp());

        pipeline.push({
            $project: {
                id: '$_id',
                _id: 0,
                email: 1,
                company_name: 1,
                image: 1,
                country: 1,
                phone: 1,
                is_disabled: { $arrayElemAt: ['$auth.is_disabled', 0] },
                from_time: 1,
                to_time: 1,
                iban_number: 1,
                commission: 1,
                category_ids: 1,
                created_at: 1,
                owner_name: 1
            }
        });

        pipeline.push({ $sort: { created_at: -1 } });

        return await VendorModel.aggregate(pipeline);
    };

    static findOne = async (filter: any) => await VendorModel.findOne(filter);

    static findById = async (id: string): Promise<VendorDocument | null> => await VendorModel.findById(id);

    static update = async (data: VendorDocument, id: string) => await VendorModel.findByIdAndUpdate(id, data, { new: true, context: 'authUpdate' });

    static deletebyId = async (id: string) => VendorModel.findByIdAndDelete(id);

    static findVendorCategories = async (vendorId: string) => {
        const { CategoryModel } = await import('../category/category_model');
        return await CategoryModel.find({ vendor_id: vendorId, deleted_at: null });
    };

    static getVendorAssignedCategoriesWithServices = async (vendorId: string) => {
        const { CategoryModel } = await import('../category/category_model');
        const { ServiceModel } = await import('../service/service_model');

        // Get all categories assigned to this vendor
        const assignedCategories = await VendorModel.findById(vendorId)
            .populate({
                path: 'category_ids',
                select: '_id name other_name desc image type',
                model: CategoryModel
            });

        if (!assignedCategories?.category_ids) {
            return [];
        }

        // For each category, get services that belong to it and this vendor
        const categoriesWithServices = await Promise.all(
            (assignedCategories.category_ids as any[]).map(async (category) => {
                const services = await ServiceModel.find({
                    category_id: new Types.ObjectId(category._id),
                    vendor_id: new Types.ObjectId(vendorId),
                    deleted_at: null
                }).select('_id name other_name');

                return {
                    id: category._id,
                    name: category.name,
                    other_name: category.other_name,
                    desc: category.desc,
                    image: category.image,
                    type: category.type,
                    services: services.map((s) => ({
                        id: s._id,
                        name: s.name,
                        other_name: s.other_name
                    }))
                };
            })
        );

        return categoriesWithServices;
    };

    static getVendorAssignedCategories = async (vendorId: string) => {
        const { CategoryModel } = await import('../category/category_model');
        const { ServiceModel } = await import('../service/service_model');
        const { ProductModel } = await import('../product/product_model');
        
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

        // 2. Get categories from vendor's existing services
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

        // 3. Get categories from vendor's existing products
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

        // 4. Fetch and add service/product categories
        const allMissingCategoryIds = [...serviceCategoryIds, ...productCategoryIds];
        if (allMissingCategoryIds.length > 0) {
            const missingCategories = await CategoryModel.find({
                _id: { $in: allMissingCategoryIds },
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

        // Return all unique categories
        return Array.from(categoryMap.values());
    };
}

export default VendorService;
