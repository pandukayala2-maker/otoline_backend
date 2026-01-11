import { Model, model, Schema, Types } from 'mongoose';
import { BaseDocument, baseSchema } from '../../common/base_model';
import { OrderStatusEnum } from '../../constant/enum';
import { ProductDocument } from '../product/product_model';

interface OrderItem {
    product: Types.ObjectId | ProductDocument;
    qty: number;
    productName: string;
    price: number;
}

interface OrderTracker extends BaseDocument {
    status: string;
    datetime: Date;
}

interface OrderDocument extends BaseDocument {
    order_no: string;
    order_date: Date;
    user_id: Types.ObjectId;
    vendor_id: Types.ObjectId;
    cart_items: OrderItem[];
    status: OrderStatusEnum;
    total_price: number;
    points_used: number;
    points_earned: number;
    slotTiming:object
    address: {
        id: Types.ObjectId;
        name: string;
        phone: string;
        street: string;
        city: string;
        postalcode: string;
        type: string;
        extra_details?: string;
        governate: number;
    };
    order_tracker: OrderTracker[];

    description: string;
    payment_id: string;
    result: string;
    post_date: string;
    tran_id: string;
    ref: string;
    track_id: string;
    auth: string;
    order_id: string;
    requested_order_id: string;
    refund_order_id: string;
    payment_type: string;
    invoice_id: string;
    transaction_date: string;
    receipt_id: string;
    
}

const OrderSchema = new Schema<OrderDocument>({
    order_no: { type: String },
    order_date: { type: Date, required: true },
    user_id: { type: Schema.Types.ObjectId, ref: 'users', required: true },
    vendor_id: { type: Schema.Types.ObjectId, ref: 'vendors', required: true },
    cart_items: [
        {
            product: { type: Schema.Types.ObjectId, ref: 'products' },
            qty: { type: Number },
            productName: { type: String },
            price: { type: Number }
        }
    ],
    status: { type: String, enum: Object.values(OrderStatusEnum), default: OrderStatusEnum.pending },
    total_price: { type: Number },
    points_used: { type: Number },
    points_earned: { type: Number },
    slotTiming:{
            startTime:{
            type: Date,
            required: true,
        },
            endTime:{
            type: Date,
            required: true,
        },
        slotNumber:{
            type: Number,
            required: true,
        },
        date:{
            type: Date,
            required: true,
        },
    },
    address: {
        name: { type: String },
        phone: { type: String },
        street: { type: String },
        area: { type: String },
        block: { type: String },
        type: { type: String },
        extra_details: { type: String },
        governate: { type: Number }
    },
    order_tracker: [
        {
            status: { type: String },
            datetime: { type: Date }
        }
    ],

    description: { type: String },
    payment_id: { type: String },
    result: { type: String },
    post_date: { type: String },
    tran_id: { type: String },
    ref: { type: String },
    track_id: { type: String },
    auth: { type: String },
    order_id: { type: String },
    requested_order_id: { type: String },
    refund_order_id: { type: String },
    payment_type: { type: String },
    invoice_id: { type: String },
    transaction_date: { type: String },
    receipt_id: { type: String }
});

OrderSchema.add(baseSchema);

OrderSchema.set('toJSON', {
    versionKey: false,
    // Use loose typings here to avoid TS incompatibilities with Mongoose internals
    transform: (doc: any, ret: any, options: any) => {
        const baseTransform = baseSchema.get('toJSON')?.transform as any;

        if (typeof baseTransform === 'function') {
            ret.user = ret.user_id;
            ret.vendor = ret.vendor_id;
            delete ret.user_id;
            delete ret.vendor_id;
            return baseTransform(doc, ret, options);
        }
    }
});

const OrderModel: Model<OrderDocument> = model<OrderDocument>('orders', OrderSchema);

export { OrderDocument, OrderItem, OrderModel, OrderTracker };
