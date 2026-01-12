import { FilterQuery } from 'mongoose';
import { GovernateDocument, GovernateModel } from './governates_model';

class GovernateServices {
    static create = async (data: GovernateDocument): Promise<GovernateDocument> => await GovernateModel.create(data);
    static update = async (data: Partial<GovernateDocument>, id: string) => await GovernateModel.findByIdAndUpdate(id, data, { new: true });
    static find = async (filter: FilterQuery<GovernateDocument> = {}): Promise<GovernateDocument[]> => await GovernateModel.find(filter);
    static findById = async (id: string): Promise<GovernateDocument | null> => await GovernateModel.findById(id);

    static delete = async (id: string) => await GovernateModel.findByIdAndDelete(id);
}

export default GovernateServices;
