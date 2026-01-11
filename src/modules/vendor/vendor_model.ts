import { Model, Schema, model } from 'mongoose';
import { BaseDocument, baseSchema } from '../../common/base_model';
import { AuthModel } from '../auth/auth_model';
import { Types } from 'mongoose';

interface VendorDocument extends BaseDocument {
    email: string;
    phone: string;
    country: string;
    company_name: string;
    owner_name: string;
    image?: string;
    from_time: Date;
    to_time: Date;
    booking_per_day: number;
    iban_number?: string;
    commission?: number;
    category_ids?: Types.ObjectId[];
    address: {
        name: string;
        phone: string;
        street: string;
        area: string;
        block: string;
        type: string;
        extra_details?: string;
    };
    timeslots?: any;
    weekends?:any;
}

const VendorSchema = new Schema<VendorDocument>({
    phone: { type: String },
    email: { type: String, unique: true },
    country: { type: String },
    company_name: { type: String },
    owner_name: { type: String },
    image: { type: String },
    from_time: { type: Date },
    to_time: { type: Date },
    booking_per_day: { type: Number, default: 1 },
    iban_number: { type: String },
    commission: { type: Number, default: 0 },
    category_ids: { type: [Schema.Types.ObjectId], ref: 'categories', default: [] },
    address: {
        name: { type: String },
        phone: { type: String },
        street: { type: String },
        area: { type: String },
        block: { type: String },
        type: { type: String },
        extra_details: { type: String }
    },
    timeslots:[
        {
            startTime:{
            type: Date,
            required: true,
        },
            endTime:{
            type: Date,
            required: true,
        },
        isActive:{
             type: String,
             default:true
        },
        number_of_services:{
            type: Number,
            default:1
        }
    }

    ],
    weekends:[{type:String}]
});

VendorSchema.add(baseSchema);

VendorSchema.post('findOneAndUpdate', async function (doc, next) {
    if (!(this.getOptions().context === 'authUpdate')) return next();
    await AuthModel.updateOne({ _id: doc._id }, { $set: { is_disabled: doc.is_disabled } });
});

const VendorModel: Model<VendorDocument> = model<VendorDocument>('vendors', VendorSchema);

export { VendorDocument, VendorModel };
