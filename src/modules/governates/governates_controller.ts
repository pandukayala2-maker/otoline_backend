import { NextFunction, Request, Response } from 'express';
import { ServerIssueError } from '../../common/base_error';
import { baseResponse } from '../../middleware/response_handler';
import { UserTypeEnum } from '../../constant/enum';
import { GovernateDocument } from './governates_model';
import GovernateServices from './governates_services';

class GovernateController {
    static create = async (req: Request, res: Response, next: NextFunction) => {
        const governates: GovernateDocument = req.body;
        // Only set vendor_id if it's a vendor creating it
        // Admin creates global governates (vendor_id stays null/undefined)
        if (res.locals.usertype === UserTypeEnum.vendor && res.locals.id) {
            governates.vendor_id = res.locals.id;
        }
        const data = await GovernateServices.create(governates);
        return data ? baseResponse({ res: res, data: data }) : next(new ServerIssueError());
    };

    static update = async (req: Request, res: Response, next: NextFunction) => {
        const id: string = req.params.id ?? req.body.id;
        const vendorId = res.locals.id;
        
        // Get the original governate to check if it's admin-owned
        const originalGovernate = await GovernateServices.findById(id);
        
        if (!originalGovernate) {
            return next(new ServerIssueError('Governate not found'));
        }
        
        // If vendor is trying to edit an admin governate (vendor_id is null/undefined)
        // Create a vendor-specific copy instead of modifying the original
        if (vendorId && (!originalGovernate.vendor_id || originalGovernate.vendor_id === null)) {
            // Check if vendor already has their own copy of this admin governate by admin_governate_id
            const vendorCopy = await GovernateServices.find({
                admin_governate_id: id,
                vendor_id: vendorId
            });
            
            if (vendorCopy.length > 0) {
                // Update the vendor's existing copy
                const vendorCopyItem = vendorCopy[0] as GovernateDocument;
                const vendorCopyId = (vendorCopyItem._id as any).toString();
                const updateData: Partial<GovernateDocument> = {
                    name: req.body.name,
                    value: req.body.value,
                    is_disabled: req.body.is_disabled
                };
                const data = await GovernateServices.update(updateData, vendorCopyId);
                return data ? baseResponse({ res: res, data: data }) : next(new ServerIssueError('Error while updating'));
            } else {
                // Create a new vendor-specific copy
                const newGovernate: Partial<GovernateDocument> = {
                    name: req.body.name || originalGovernate.name,
                    value: req.body.value || originalGovernate.value,
                    vendor_id: vendorId,
                    is_disabled: req.body.is_disabled ?? (originalGovernate.is_disabled || false),
                    admin_governate_id: id // Track which admin governate this was copied from
                };
                const data = await GovernateServices.create(newGovernate as GovernateDocument);
                return data ? baseResponse({ res: res, data: data }) : next(new ServerIssueError('Error while creating vendor copy'));
            }
        } else {
            // Admin updating their own governate or vendor updating their own copy
            const updateData: Partial<GovernateDocument> = {
                name: req.body.name,
                value: req.body.value,
                is_disabled: req.body.is_disabled
            };
            if (vendorId) {
                updateData.vendor_id = vendorId;
            }
            const data = await GovernateServices.update(updateData, id);
            return data ? baseResponse({ res: res, data: data }) : next(new ServerIssueError('Error while updating'));
        }
    };

    static find = async (req: Request, res: Response, next: NextFunction) => {
        const query: any = {};
        if (req.query.name) query.name = RegExp(`^${req.query.name}`, 'i');
        if (req.query.type) query.type = req.query.type;
        
        // If vendor_id is provided, return governates that are either:
        // 1. Created by admin (vendor_id is null/undefined)
        // 2. OR created by this specific vendor
        if (req.query.vendor_id) {
            query.$or = [
                { vendor_id: null },
                { vendor_id: { $exists: false } },
                { vendor_id: req.query.vendor_id }
            ];
        }
        
        const data: GovernateDocument[] = await GovernateServices.find(query);
        return baseResponse({ res: res, data: data });
    };

    static delete = async (req: Request, res: Response, next: NextFunction) => {
        const id: string = req.params.id ?? req.body.id;
        const data = await GovernateServices.delete(id);
        return data ? baseResponse({ res: res, message: 'Successfully Deleted' }) : next(new ServerIssueError('Error while deleting'));
    };
}

export default GovernateController;
