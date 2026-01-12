import { Schema, Types, model } from 'mongoose';
import { BaseDocument, baseSchema } from '../../common/base_model';

interface GovernateDocument extends BaseDocument {
    name: string;
    value: number;
    vendor_id?: Types.ObjectId | string | null;
    admin_governate_id?: Types.ObjectId | string | null;
    is_disabled: boolean;
}
const governateSchema = new Schema({
    name: { type: String, require: true },
    vendor_id: { type: String },
    value: { type: Number },
    is_disabled: { type: Boolean, default: false },
    admin_governate_id: { type: String } // Reference to admin governate if this is a vendor copy
});

governateSchema.add(baseSchema);

// Create compound unique index on name and vendor_id
// This allows same name for different vendors (null vendor_id = admin)
governateSchema.index({ name: 1, vendor_id: 1 }, { unique: true });

const GovernateModel = model<GovernateDocument>('governates', governateSchema);

export { GovernateDocument, GovernateModel };
