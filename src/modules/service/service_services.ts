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
}

export default ServiceServices;
