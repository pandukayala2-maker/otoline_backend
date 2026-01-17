import { Schema, Types, model } from 'mongoose';
import { BaseDocument, baseSchema } from '../../common/base_model';
import { GovernateDocument } from '../governates/governates_model';

enum AddressType {
    home = 'home',
    work = 'work',
    others = 'others'
}

interface AddressDocument extends BaseDocument {
    name: string;
    phone: string;

    street: string;
    postalcode: string;
    city: string;
    house: string;
    area: string;
    extra_details?: string;

    type: AddressType;
    user_id: Types.ObjectId;
    governate_id?: Types.ObjectId | GovernateDocument;
    is_default?: boolean;
}

const AddressSchema = new Schema<AddressDocument>({
    name: { type: String, required: true },
    phone: { type: String, required: true },

    street: { type: String, required: true },
    postalcode: { type: String, required: true },
    city: { type: String, required: true },
    extra_details: { type: String },
    house: { type: String, required: true },
    area: { type: String, required: true },

    type: { type: String, enum: Object.values(AddressType), default: AddressType.home },
    user_id: { type: Schema.Types.ObjectId, ref: 'users', required: true },
    governate_id: { type: Schema.Types.ObjectId, ref: 'governates' },
    is_default: { type: Boolean, default: false }
});

AddressSchema.add(baseSchema);

AddressSchema.set('toJSON', {
    versionKey: false,
    transform: (doc, ret, options) => {
        const baseTransform = baseSchema.get('toJSON')?.transform;
        if (typeof baseTransform === 'function') {
            ret.user = ret.user_id;
            ret.governate = ret.governate_id;
            delete ret.user_id;
            delete ret.governate_id;
            return baseTransform(doc, ret, options);
        }
    }
});

const AddressModel = model<AddressDocument>('addresses', AddressSchema);

export { AddressDocument, AddressModel };
