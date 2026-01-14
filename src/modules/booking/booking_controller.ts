import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { BadRequestError, ServerIssueError } from '../../common/base_error';
import { OrderStatusEnum, UserTypeEnum } from '../../constant/enum';
import { baseResponse } from '../../middleware/response_handler';
import MailServices from '../../services/mail_services';
import { generateMongoId } from '../../utils/helper';
import { logger } from '../../utils/logger';
import UserService from '../user/user_services';
import VendorService from '../vendor/vendor_services';
import { BookingDocument } from './booking_model';
import BookingServices from './booking_services';

class BookingController {
    static create = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const booking: BookingDocument = req.body;
            if (!booking.booking_no) booking.booking_no = await BookingServices.createBookingNumber();
            booking.user_id = booking.user_id ?? res.locals.id;
            const userId = (booking.user_id ?? res.locals.id).toString();
            const user = await UserService.findById(userId);
            if (!user) throw new ServerIssueError('User not found');
            booking.id = generateMongoId().toString();
            booking._id = booking.id;
            const link = await BookingServices.makePayment(booking, user);
            if (!link) throw new ServerIssueError('Error While creating order');
            const orderData = await BookingServices.create(booking);
            if (!orderData) throw new ServerIssueError('Error While creating order');
            const combinedData = { id: booking.id, orderNo: booking.booking_no, link: link.data.link };
            return baseResponse({ res, message: link.message, data: combinedData });
        } catch (error: any) {
            logger.error(error);
            const message = error?.response?.data?.message || error?.message || 'Error While Booking Service';
            return next(new ServerIssueError(message));
        }
    };

    static update = async (req: Request, res: Response, next: NextFunction) => {
        const bookingDoc: BookingDocument = req.body;
        const id: string = req.params.id ?? req.body._id;
        const data = await BookingServices.update(id, bookingDoc);
        return data ? baseResponse({ res: res, data: data }) : next(new ServerIssueError('Error while updating'));
    };

    static find = async (req: Request, res: Response, next: NextFunction) => {
        const { id } = req.params;

        let data: BookingDocument | BookingDocument[] | null;
        if (id) {
            data = await BookingServices.findById(id);
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
            data = await BookingServices.find(query);
        }

        return baseResponse({ res, data });
    };

    static createBookingWithPayment = async (req: Request, res: Response, next: NextFunction) => {
        const orderReqdata: Partial<BookingDocument> = req.query;
        const etcData = JSON.parse(req.query.trn_udf as string);
        const id = orderReqdata.requested_order_id ?? etcData.order_id;
        // Set status to accepted when payment is successful
        if (orderReqdata.result === 'CAPTURED') {
            orderReqdata.status = OrderStatusEnum.accepted;
        }
        if (!id) {
            const orderNo = etcData.orderNo;
            const updateData: any = { result: orderReqdata.result };
            if (orderReqdata.status) {
                updateData.status = orderReqdata.status;
            }
            const updatedData = await BookingServices.findOneAndUpdate({ booking_no: orderNo }, updateData);
            return updatedData ? baseResponse({ res: res, message: 'Successfully Placed' }) : next(new ServerIssueError('Error while deleting'));
        }
        const updatedData = await BookingServices.update(id, orderReqdata);

        const userId = orderReqdata.user_id ? orderReqdata.user_id.toString() : undefined;
        const vendorId = orderReqdata.vendor_id ? orderReqdata.vendor_id.toString() : undefined;
        const userEmail = userId ? (await UserService.findById(userId))?.email : undefined;
        const vendorEmail = vendorId ? (await UserService.findById(vendorId))?.email : undefined;
        if (userEmail) MailServices.bookingSuccessfulEmail(userEmail, orderReqdata.booking_no ?? 'Autoline');
        if (vendorEmail) MailServices.bookinVendorSuccessfulEmail(vendorEmail, orderReqdata.booking_no ?? 'Autoline');
        return updatedData ? baseResponse({ res: res, message: 'Successfully Placed' }) : next(new ServerIssueError('Error while deleting'));
    };

    static delete = async (req: Request, res: Response, next: NextFunction) => {
        const orderReqdata: Partial<BookingDocument> = req.query;

        let id = orderReqdata.requested_order_id;
        if (!id) {
            const data = JSON.parse(req.query.trn_udf as string);
            id = data.order_id;
        }

        if (!id) {
            const data = JSON.parse(req.query.trn_udf as string);
            const orderNo = data.orderNo;
            const deletedData = await BookingServices.findOneAndDelete(orderNo);
            return deletedData ? baseResponse({ res: res, message: 'Successfully Deleted' }) : next(new ServerIssueError('Error while deleting'));
        }

        const deletedData = await BookingServices.delete(id);
        return deletedData ? baseResponse({ res: res, message: 'Successfully Deleted' }) : next(new ServerIssueError('Error while deleting'));
    };

    static checkDataAvailabity = async (req: Request, res: Response, next: NextFunction) => {
        const { vendor_id, booking_date } = req.body;
        const startOfDay = new Date(booking_date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(booking_date);
        endOfDay.setHours(23, 59, 59, 999);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (startOfDay < today) {
            return next(new BadRequestError('Booking date must be in the future'));
        }

        const bookings = await BookingServices.find({
            vendor_id,
            booking_date: { $gte: startOfDay, $lte: endOfDay }
        });

        const vendor = await VendorService.findById(vendor_id);
        if (!vendor) return next(new BadRequestError('Vendor not found'));

        const maxBookingsPerDay = vendor.booking_per_day || 1;
        const isAvailable = bookings.length < maxBookingsPerDay;

        return isAvailable ? baseResponse({ res: res }) : next(new ServerIssueError('Date Not Available'));
    };
}

export default BookingController;
