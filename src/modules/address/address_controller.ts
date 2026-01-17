import { NextFunction, Request, Response } from 'express';
import { ServerIssueError } from '../../common/base_error';
import { baseResponse } from '../../middleware/response_handler';
import { AddressDocument } from './address_model';
import AddressServices from './address_services';

class AddressController {
    static create = async (req: Request, res: Response, next: NextFunction) => {
        const address: AddressDocument = req.body;
        address.user_id = res.locals.id;
        const data = await AddressServices.create(address);
        return data ? baseResponse({ res: res, data: data }) : next(new ServerIssueError());
    };

    static update = async (req: Request, res: Response, next: NextFunction) => {
        const addressDoc: AddressDocument = req.body;
        const id: string = req.params.id ?? req.body._id;
        const data = await AddressServices.update(addressDoc, id);
        return data ? baseResponse({ res: res, data: data }) : next(new ServerIssueError('Error while updating'));
    };

    static find = async (req: Request, res: Response, next: NextFunction) => {
        const data: AddressDocument[] = await AddressServices.find(res.locals.id);
        return baseResponse({ res: res, data: data });
    };

    static delete = async (req: Request, res: Response, next: NextFunction) => {
        const id: string = req.params.id ?? req.body._id;
        const data = await AddressServices.delete(id);
        return data ? baseResponse({ res: res, message: 'Successfully Deleted' }) : next(new ServerIssueError('Error while deleting'));
    };

    static setDefault = async (req: Request, res: Response, next: NextFunction) => {
        const id: string = req.params.id;
        const data = await AddressServices.setDefault(id, res.locals.id);
        return data ? baseResponse({ res: res, data: data }) : next(new ServerIssueError('Error while setting default'));
    };
}

export default AddressController;
