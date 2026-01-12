import { calculateRating, categoryLookup, matchId, reviewsLookup, vendorLookUp } from '../../common/base_query';
import { ServiceDocument, ServiceModel } from './service_model';

class ServiceServices {
    static create = async (data: ServiceDocument): Promise<ServiceDocument> => await ServiceModel.create(data);

    static update = async (data: Partial<ServiceDocument>, id: string) => await ServiceModel.findByIdAndUpdate(id, data, { new: true });

    static find = async (filter: any, categorize: boolean = false): Promise<ServiceDocument[]> => {
        const query = ServiceModel.find(filter)
            .populate({ path: 'vendor_id', select: '_id company_name phone' })
            .select('id name rating price image_list discount');
        if (categorize) query.populate({ path: 'category_id', select: '_id name' });
        return await query;
    };

    // static findById = async (filter: string) => await ServiceModel.findById(filter);

    static findById = async (id: string): Promise<ServiceDocument | null> => {
        const pipeline: any[] = [];
        pipeline.push(matchId(id), categoryLookup(), reviewsLookup(), calculateRating(), vendorLookUp());
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
            $project: {
                _id: 0,
                category_id: 0,
                vendor_id: 0,
                __v: 0
            }
        });

        const data: ServiceDocument[] = await ServiceModel.aggregate(pipeline);
        return data.length > 0 ? data[0] : null;

        // if (data.length > 0) {
        //     const product = new ProductModel(data[0]);
        //     return product.toJSON();
        // }
        // return null;
    };

     
    static delete = async (id: string) => await ServiceModel.findByIdAndDelete(id);

    static getVendorAssignedCategories = async (vendorId: string) => {
        const { VendorModel } = await import('../vendor/vendor_model');
        const { CategoryModel } = await import('../category/category_model');
        
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

        // 3. Fetch and add service categories
        if (serviceCategoryIds.size > 0) {
            const missingCategories = await CategoryModel.find({
                _id: { $in: Array.from(serviceCategoryIds) },
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

export default ServiceServices;

