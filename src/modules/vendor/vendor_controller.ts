import { NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose';
import MediaHandler from '../../middleware/media_handler';
import { baseResponse } from '../../middleware/response_handler';

import { NotFoundError, ServerIssueError, UnauthorizedError, BadRequestError } from '../../common/base_error';
import { UserTypeEnum } from '../../constant/enum';
import { AuthDocument, AuthModel } from '../auth/auth_model';
import { VendorDocument } from './vendor_model';
import VendorService from './vendor_services';

class VendorController {
    static find = async (req: Request, res: Response, next: NextFunction) => {
        const query: any = {};
        if (req.query.search) {
            const search = String(req.query.search).trim();
            query.$or = [
                { company_name: { $regex: new RegExp(search, 'i') } },
                { email: { $regex: new RegExp(search, 'i') } },
                { phone: { $regex: new RegExp(search, 'i') } }
            ];
        }
        if (req.query.country) query.country = req.query.country;
        if (req.query.category_id) query.category_id = req.query.category_id;
        const data: VendorDocument[] = await VendorService.find(query);
        return baseResponse({ res: res, data: data });
    };

    static findById = async (req: Request, res: Response, next: NextFunction) => {
        const id: string = req.params.id ?? req.body._id;
        const data: VendorDocument | null = await VendorService.findById(id);
        const authData: AuthDocument | null = await AuthModel.findById(id);
        if (!data || !authData) throw new NotFoundError('Vendor not found');
        const combimeData = { ...data?.toJSON(), ...authData?.toJSON() };
        if (data) {
            combimeData.profile = data.company_name ? true : false;
            // Ensure category_ids are included in the response as string array
            const categoryIds = (data.category_ids || []) as any[];
            if (categoryIds && categoryIds.length > 0) {
                combimeData.category_ids = categoryIds.map((id) => {
                    // Handle both ObjectId and string formats
                    const idStr = typeof id === 'string' ? id : id.toString();
                    console.log('🔍 Converting category ID:', id, '->', idStr);
                    return idStr;
                });
                console.log('✅ Vendor category_ids being returned:', combimeData.category_ids);
            } else {
                combimeData.category_ids = [];
                console.log('🔍 Vendor has no category_ids assigned');
            }
        }
        return baseResponse({ res: res, data: combimeData });
    };

    static update = async (req: Request, res: Response, next: NextFunction) => {
        const userDoc: VendorDocument = req.body;
        const authDoc: AuthDocument = req.body;
        const id: string = req.params.id ?? req.body._id ?? req.body.id;
        if (id != res.locals.id && res.locals.usertype != UserTypeEnum.admin) throw new UnauthorizedError();
        if (userDoc.image) {
            const previousData = await VendorService.findById(id);
            const fullPath: string = MediaHandler.getRootPath() + previousData?.image;
            await MediaHandler.removeFile(fullPath);
        }
        
        // Handle category assignments if provided
        const categoryIds = req.body.category_ids;
        const timeslots = req.body.timeslots;
        const weekends = req.body.weekends;
       
        if (categoryIds && Array.isArray(categoryIds)) {
            // Validate that at least one category is provided (for updates where categories are being assigned)
            if (categoryIds.length === 0) {
                throw new BadRequestError('At least one category must be assigned to the vendor');
            }

            const { CategoryModel } = await import('../category/category_model');
            // Convert string IDs to ObjectIds for the vendor document
            userDoc.category_ids = categoryIds.map((id: string) => new Types.ObjectId(id));
            
            console.log('📝 Updating vendor with categories:', userDoc.category_ids);
            
            // First, clear vendor_id from all categories previously assigned to this vendor
            await CategoryModel.updateMany(
                { vendor_id: id },
                { $unset: { vendor_id: '' } }
            );
            // Then, set vendor_id for the newly selected categories
            if (categoryIds.length > 0) {
                await CategoryModel.updateMany(
                    { _id: { $in: categoryIds } },
                    { $set: { vendor_id: id } }
                );
            }
        }
        if(timeslots.length > 0){
            
        }
        if(weekends.length > 0){

        }

        // Handle service assignments if provided
        const serviceIds = req.body.service_ids;
        if (serviceIds && Array.isArray(serviceIds)) {
            const { ServiceModel } = await import('../service/service_model');
            // First, clear vendor_id from all services previously assigned to this vendor
            await ServiceModel.updateMany(
                { vendor_id: id },
                { $unset: { vendor_id: '' } }
            );
            // Then, set vendor_id for the newly selected services
            if (serviceIds.length > 0) {
                await ServiceModel.updateMany(
                    { _id: { $in: serviceIds } },
                    { $set: { vendor_id: id } }
                );
            }
        }
        
        const data = await VendorService.update(userDoc, id);

        return data ? baseResponse({ res: res, data: data }) : next(new ServerIssueError('Error while updating'));
    };

    static getCategories = async (req: Request, res: Response, next: NextFunction) => {
        const vendorId: string = req.params.id ?? req.body._id;
        const categories = await VendorService.findVendorCategories(vendorId);
        return baseResponse({ res: res, data: categories });
    };

    static getAssignedCategoriesWithServices = async (req: Request, res: Response, next: NextFunction) => {
        const vendorId: string = req.params.id ?? req.query.vendor_id ?? req.body._id;
        const categoriesWithServices = await VendorService.getVendorAssignedCategoriesWithServices(vendorId);
        return baseResponse({ res: res, data: categoriesWithServices });
    };

    static getAssignedCategories = async (req: Request, res: Response, next: NextFunction) => {
        const vendorId: string = req.params.id ?? req.query.vendor_id ?? req.body._id;
        const categories = await VendorService.getVendorAssignedCategories(vendorId);
        return baseResponse({ res: res, data: categories });
    };
}

export default VendorController;
