import { Schema, Types, model } from 'mongoose';
import { BaseDocument, baseSchema } from '../../common/base_model';

interface AddOnDocument extends BaseDocument {
    name: string;
    value: number;
}

const addOnSchema = new Schema<AddOnDocument>({
    name: { type: String, required: true },
    value: { type: Number, required: true }
});

interface ServiceDocument extends BaseDocument {
    id: string;
    name: string;
    other_name: string;
    desc: string;
    other_desc: string;
    price: number;
    discount: number;
    rating: number;
    add_on: AddOnDocument[];
    image_list?: string[];
    category_id?: Types.ObjectId[];
    vendor_id: Types.ObjectId;
    home_service:Boolean;
    onsite_service:Boolean;
}

const serviceSchema = new Schema<ServiceDocument>({
    name: { type: String, trim: true, required: true },
    other_name: { type: String },
    desc: { type: String, required: true },
    other_desc: { type: String },
    price: { type: Number, required: true },
    rating: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    add_on: { type: [addOnSchema], required: true },
    image_list: { type: [String] },
    category_id: { type: [Types.ObjectId], ref: 'categories' },
    vendor_id: { type: Schema.Types.ObjectId, ref: 'vendors', required: true },
    home_service:{type:String, default:false},
    onsite_service:{type:String, default:true},
});

serviceSchema.set('toJSON', {
    versionKey: false,
    virtuals: true,
    transform: (doc, ret, options) => {
        const baseTransform = baseSchema.get('toJSON')?.transform;

        if (typeof baseTransform === 'function') {
            if (ret.discount > 0) {
                ret.price = ret.selling_price;
            }
            delete ret.selling_price;
            ret.category = ret.category_id;
            ret.vendor = ret.vendor_id;
            delete ret.category_id;
            delete ret.vendor_id;
            return baseTransform(doc, ret, options);
        }
    }
});

serviceSchema.virtual('selling_price').get(function () {
    const discount = this.discount >= 1 && this.discount <= 100 ? this.discount : 0;
    return Math.round((this.price - (this.price * discount) / 100) * 100) / 100;
});

serviceSchema.virtual('sold_price').get(function () {
    return this.price;
});

serviceSchema.add(baseSchema);

const ServiceModel = model<ServiceDocument>('services', serviceSchema);

export { AddOnDocument, ServiceDocument, ServiceModel, addOnSchema };
