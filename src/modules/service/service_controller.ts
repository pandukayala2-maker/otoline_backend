import { NextFunction, Request, Response } from 'express';
import { NotFoundError, ServerIssueError } from '../../common/base_error';
import { baseResponse } from '../../middleware/response_handler';
import { ServiceDocument } from './service_model';
import ServiceServices from './service_services';

class ServiceController {
    static create = async (req: Request, res: Response, next: NextFunction) => {
        const category: ServiceDocument = req.body;
        if (!category.vendor_id) category.vendor_id = res.locals.id;
        const data = await ServiceServices.create(category);
        return data ? baseResponse({ res: res, data: data }) : next(new ServerIssueError());
    };

    static update = async (req: Request, res: Response, next: NextFunction) => {
        const categoryDoc: ServiceDocument = req.body;
        const id: string = req.params.id ?? req.body._id;
        const data = await ServiceServices.update(categoryDoc, id);
        return data ? baseResponse({ res: res, data: data }) : next(new ServerIssueError('Error while updating'));
    };

    static find = async (req: Request, res: Response, next: NextFunction) => {
        const query: any = {};
        if (req.query.name) query.name = RegExp(`^${req.query.name}`, 'i');
        if (req.query.type) query.type = req.query.type;
        if (req.query.vendor_id) query.vendor_id = req.query.vendor_id;
        if (req.query.category_id) query.category_id = req.query.category_id;
        // Always include categories when fetching services
        const data: ServiceDocument[] = await ServiceServices.find(query, true);
        return baseResponse({ res: res, data: data });
    };

    static findById = async (req: Request, res: Response, next: NextFunction) => {
        const id: string = req.params.id ?? req.body._id;
        const data: ServiceDocument | null = await ServiceServices.findById(id);
        if (!data) throw new NotFoundError('product not found');
        return baseResponse({ res: res, data: data });
    };

    static delete = async (req: Request, res: Response, next: NextFunction) => {
        const id: string = req.params.id ?? req.body._id;
        const data = await ServiceServices.update({ deleted_at: new Date() }, id);
        return data ? baseResponse({ res: res, message: 'Successfully Deleted' }) : next(new ServerIssueError('Error while deleting'));
    };

    static getVendorCategories = async (req: Request, res: Response, next: NextFunction) => {
        const vendorId: string = req.params.vendor_id ?? req.query.vendor_id ?? req.body.vendor_id;
        const categories = await ServiceServices.getVendorAssignedCategories(vendorId);
        return baseResponse({ res: res, data: categories });
    };
}

export default ServiceController;

