import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { BadRequestError, ServerIssueError } from '../../common/base_error';
import { OrderStatusEnum, UserTypeEnum } from '../../constant/enum';
import { baseResponse } from '../../middleware/response_handler';
import MailServices from '../../services/mail_services';
import { generateMongoId } from '../../utils/helper';
import { logger } from '../../utils/logger';
import AddressServices from '../address/address_services';
import { CartDocument } from '../cart/cart_model';
import CartServices from '../cart/cart_services';
import { GovernateDocument } from '../governates/governates_model';
import { ProductDocument } from '../product/product_model';
import ProductServices from '../product/product_services';
import UserService from '../user/user_services';
import VendorService from '../vendor/vendor_services';
import { OrderDocument, OrderItem, OrderModel } from './order_model';
import OrderServices from './order_services';

class OrderController {
    static create = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { address_id } = req.body;
            if (!address_id) throw new BadRequestError('address_id is missing');
            const order: OrderDocument = req.body;
            if (!order.order_no) order.order_no = await OrderServices.createOrderNumber();
            order.order_date = new Date();
            order.user_id = res.locals.id;
            order.status = OrderStatusEnum.pending;
            const address = await AddressServices.findById(address_id);
            if (!address) throw new BadRequestError('address is missing');
            const governatesValue = (address.governate_id as GovernateDocument).value;

            order.address = {
                id: address_id,
                postalcode: address.postalcode,
                city: address.city,
                street: address.street,
                phone: address.phone,
                extra_details: address.extra_details,
                governate: governatesValue ?? 0,
                type: address.type,
                name: address.name
            };

            const id: string = res.locals.id;
            const cart: CartDocument | null = await CartServices.findCart(id);
            if (!cart) throw new BadRequestError('Cart is missing');
            if (cart.cart_items.length < 1) throw new BadRequestError('Cart is missing');
            const cartitem: OrderItem[] = [];
            let totalPrice = 0;
            totalPrice = totalPrice + (governatesValue ?? 0);
            for (const cartItems of cart.cart_items) {
                const product: ProductDocument = cartItems.product as unknown as ProductDocument;
                if (product) {
                    const orderItem: OrderItem = {
                        price: product.price,
                        product: cartItems.product,
                        productName: product.name,
                        qty: cartItems.quantity
                    };
                    order.vendor_id = product.vendor_id;
                    totalPrice = totalPrice + product.price * cartItems.quantity;
                    cartitem.push(orderItem);
                }
            }
            order.id = generateMongoId().toString();
            order._id = order.id;
            order.cart_items = cartitem;
            order.total_price = totalPrice;

            const email = (await UserService.findById(res.locals.id))?.email;
            const link = await OrderServices.makePayment(order, email ?? 'gjamesgeorge98@gmail.com');
            if (!link) throw new ServerIssueError('Error while creating order');
            const orderData = await OrderServices.create(order);
            if (!orderData) throw new ServerIssueError('Error while creating order');
            const combinedData = { id: order.id, orderNo: order.order_no, link: link.data.link };
            return baseResponse({ res, message: link.message, data: combinedData });
        } catch (error: any) {
            logger.error(error);
            const message = error?.response?.data?.message || error?.message || 'Error While creating order';
            return next(new ServerIssueError(message));
        }
    };

    static find = async (req: Request, res: Response, next: NextFunction) => {
        const { id } = req.params;

        let data: OrderDocument | OrderDocument[] | null;
        if (id) {
            data = await OrderServices.findById(id);
        } else {
            const { id, usertype } = res.locals;
            const objectId = new mongoose.Types.ObjectId(id);
            const query: any = req.query;
            if (query.user_id !== undefined) {
                query.user_id = new mongoose.Types.ObjectId(query.user_id);
            } else {
                if (usertype == UserTypeEnum.user) query.user_id = objectId;
                if (usertype == UserTypeEnum.vendor) query.vendor_id = objectId;
            }
            query.result = 'CAPTURED';
            data = await OrderServices.find(query);
        }

        return baseResponse({ res, data });
    };

    static updateOrder = async (req: Request, res: Response, next: NextFunction) => {
        const { id } = req.params;
        const order: OrderDocument = req.body;
        if (!order) return next(new BadRequestError('Order data is required'));
        const data: OrderDocument | null = await OrderServices.update(id, order);
        if (!data) return next(new BadRequestError('Failed to update order'));
        return baseResponse({ res, message: 'Order updated successfully' });
    };

    static addTracker = async (req: Request, res: Response, next: NextFunction) => {
        const { id } = req.params;
        const { status } = req.body;
        const data: OrderDocument | null = await OrderServices.addTracker(status, id);
        if (!data) return next(new BadRequestError('Failed to update order'));
        return baseResponse({ res, message: 'Order updated successfully', data });
    };

    static removeTracker = async (req: Request, res: Response, next: NextFunction) => {
        const { id } = req.params;
        const { tracker_id } = req.body;
        if (!tracker_id) return next(new BadRequestError('tracker Id data is required'));
        const data: OrderDocument | null = await OrderServices.removeTracker(tracker_id, id);
        if (!data) return next(new BadRequestError('Failed to update order'));
        return baseResponse({ res, message: 'Order updated successfully', data });
    };

    // static findAllOrders = async (req: Request, res: Response, next: NextFunction) => {
    //     const { orderNo, fromDate, toDate, vendorId, ...otherQueryParams } = req.query;

    //     const query: FilterQuery<OrderDocument> = {
    //         ...otherQueryParams,
    //         ...(orderNo ? { orderNo: { $eq: orderNo as string } } : {}),
    //         ...(vendorId ? { vendor_id: vendorId } : {}),
    //         ...(fromDate && toDate
    //             ? {
    //                   order_date: {
    //                       $gte: new Date(fromDate as string),
    //                       $lte: new Date(toDate as string).setUTCHours(23, 59, 59, 999)
    //                   }
    //               }
    //             : {})
    //     };

    //     const data = await OrderServices.find(query);

    //     if (!data || data.length === 0) return next(new BadRequestError('Orders not found'));

    //     return baseResponse({ res, data });
    // };

    // static findByUser = async (req: Request, res: Response, next: NextFunction) => {
    //     const { id } = req.params;
    //     const data: OrderDocument[] = await OrderServices.findByUserId(id as string);
    //     if (!data || data.length === 0) return next(new BadRequestError('Orders not found'));
    //     return baseResponse({ res, data });
    // };

    // static findByVendor = async (req: Request, res: Response, next: NextFunction) => {
    //     const { id } = req.params;
    //     const { fromDate, toDate } = req.query;
    //     const data: OrderDocument[] = await OrderServices.findByVendorId(id as string, { fromDate: fromDate as string, toDate: toDate as string });
    //     if (!data || data.length === 0) return next(new BadRequestError('Orders not found'));

    //     return baseResponse({ res, data });
    // };

    // static totalOrdersByUser = async (req: Request, res: Response, next: NextFunction) => {
    //     const { id } = req.params;
    //     const orderCount = await OrderServices.totalOrdersByuser(id);
    //     const data = { totalOrders: orderCount };
    //     if (!data) return next(new BadRequestError('Orders not found'));
    //     return baseResponse({ res, data });
    // };

    static createOrderWithPayment = async (req: Request, res: Response, next: NextFunction) => {
        const orderReqdata: Partial<OrderDocument> = req.query;
        const etcData = JSON.parse(req.query.trn_udf as string);
        console.log(etcData);
        console.log(orderReqdata);
        const id = orderReqdata.requested_order_id ?? etcData.order_id;
        if (!id) {
            const orderNo = etcData.orderNo;
            const updatedData = await OrderServices.findOneAndUpdate(orderNo);
            return updatedData ? baseResponse({ res: res, message: 'Successfully Placed' }) : next(new ServerIssueError('Error while deleting'));
        }
        const updatedData = await OrderServices.update(id, orderReqdata);
        await CartServices.removeAllCart(etcData.user_id);
        const orderDoc = await OrderModel.findById(etcData.order_id!);
        for (const cartItem of orderDoc?.cart_items ?? []) {
            const productId = cartItem.product.toString();
            const qty = cartItem.qty;
            await ProductServices.updateStock(productId, -qty);
        }
        const userId = etcData.user_id ? etcData.user_id.toString() : undefined;
        const vendorId = etcData.vendor_id ? etcData.vendor_id.toString() : undefined;
        const userEmail = userId ? (await UserService.findById(userId))?.email : undefined;
        const vendorEmail = vendorId ? (await VendorService.findById(vendorId))?.email : undefined;
        console.log(userId);
        console.log(vendorId);
        console.log(userEmail);
        console.log(vendorEmail);
        console.log(etcData.order_no);
        if (userEmail) MailServices.orderSuccessfulEmail(userEmail, etcData.order_no ?? 'Autoline');
        if (vendorEmail) MailServices.orderVendorSuccessfulEmail(vendorEmail, etcData.order_no ?? 'Autoline');
        return updatedData ? baseResponse({ res: res, message: 'Successfully Placed' }) : next(new ServerIssueError('Error while deleting'));
    };

    static delete = async (req: Request, res: Response, next: NextFunction) => {
        const orderReqdata: Partial<OrderDocument> = req.query;

        let id = orderReqdata.requested_order_id;
        if (!id) {
            const data = JSON.parse(req.query.trn_udf as string);
            id = data.order_id;
        }

        if (!id) {
            const data = JSON.parse(req.query.trn_udf as string);
            const orderNo = data.orderNo;
            const deletedData = await OrderServices.findOneAndDelete(orderNo);
            return deletedData ? baseResponse({ res: res, message: 'Successfully Deleted' }) : next(new ServerIssueError('Error while deleting'));
        }

        const deletedData = await OrderServices.delete(id);
        return deletedData ? baseResponse({ res: res, message: 'Successfully Deleted' }) : next(new ServerIssueError('Error while deleting'));
    };
}

export default OrderController;
