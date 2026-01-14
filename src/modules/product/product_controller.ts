import { NextFunction, Request, Response } from 'express';
import { NotFoundError, ServerIssueError } from '../../common/base_error';
import { UserTypeEnum } from '../../constant/enum';
import { baseResponse } from '../../middleware/response_handler';
import { groupByCategory } from '../../utils/helper';
import { ProductDocument } from './product_model';
import ProductServices from './product_services';

class ProductController {
    static create = async (req: Request, res: Response, next: NextFunction) => {
        const productData = req.body as ProductDocument;

        if (productData.specification && typeof productData.specification === 'object') {
            productData.specification = Object.fromEntries(new Map(Object.entries(productData.specification)));
        }
        console.log(productData);
        const data = await ProductServices.create(productData);
        return data ? baseResponse({ res: res, data: data }) : next(new ServerIssueError());
    };

    static update = async (req: Request, res: Response, next: NextFunction) => {
        const productDoc: ProductDocument = req.body;
        const id: string = req.params.id ?? req.body._id;
        if (productDoc.image_list && productDoc.image_list.length < 1) {
            delete productDoc.image_list;
        }
        const data = await ProductServices.update(productDoc, id);
        return data ? baseResponse({ res: res, data: data }) : next(new ServerIssueError('Error while updating'));
    };

    static find = async (req: Request, res: Response, next: NextFunction) => {
        const query: any = {};
        const categorize = req.query.categorize === 'true';
        const sortstock = req.query.stock as string | undefined;
        if (req.query.name) query.name = RegExp(`^${req.query.name}`, 'i');
        if (res.locals.usertype === UserTypeEnum.vendor) query.vendor_id = res.locals.id;
        if (req.query.vendor_id) query.vendor_id = req.query.vendor_id;
        // ✅ FIX: Always filter deleted products (soft delete)
        query.deleted_at = null;
        const data: ProductDocument[] = await ProductServices.find(query, categorize, sortstock);
        return baseResponse({ res: res, data: categorize ? groupByCategory(data) : data });
    };

    static findById = async (req: Request, res: Response, next: NextFunction) => {
        const id: string = req.params.id ?? req.body._id;
        const data: ProductDocument | null = await ProductServices.findById(id);
        if (!data) throw new NotFoundError('product not found');
        return baseResponse({ res: res, data: data });
    };

    static delete = async (req: Request, res: Response, next: NextFunction) => {
        const id: string = req.params.id ?? req.body._id;
        const data = await ProductServices.update({ deleted_at: new Date() }, id);
        return data ? baseResponse({ res: res, message: 'Successfully Deleted' }) : next(new ServerIssueError('Error while deleting'));
    };

    static getVendorCategories = async (req: Request, res: Response, next: NextFunction) => {
        const vendorId: string = req.params.vendor_id ?? req.query.vendor_id ?? req.body.vendor_id;
        const categories = await ProductServices.getVendorAssignedCategories(vendorId);
        return baseResponse({ res: res, data: categories });
    };
}

export default ProductController;

