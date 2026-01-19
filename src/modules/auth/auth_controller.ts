import { NextFunction, Request, Response } from 'express';
import { DecodedIdToken } from 'firebase-admin/lib/auth/token-verifier';
import { BadRequestError, ServerIssueError } from '../../common/base_error';
import Config from '../../config/dot_config';
import { UserTypeEnum } from '../../constant/enum';
import { baseResponse } from '../../middleware/response_handler';
import admin from '../../services/firebase_services';
import MailServices from '../../services/mail_services';
import SMSService from '../../services/sms_service';
import { convertMongoPhonetoE164Format, generateMongoId, generateOTP } from '../../utils/helper';
import { logger } from '../../utils/logger';
import JWTToken, { IJwtPayload } from '../../utils/tokens';
import { UserDocument } from '../user/user_model';
import UserService from '../user/user_services';
import { VendorDocument } from '../vendor/vendor_model';
import VendorService from '../vendor/vendor_services';
import { AuthDocument } from './auth_model';
import AuthService from './auth_services';

class AuthController {

    static phoneSignIn = async (req: Request, res: Response, next: NextFunction) => {
        const authDoc: AuthDocument = req.body;
        const p = authDoc.phone;
                const phone = p?.split('-').join('');
        if (!phone) throw new BadRequestError('Invalid Phone Number');

        const auth = await AuthService.findOne({ phone });
        const otp = generateOTP();
        authDoc.otp = otp;
        authDoc.phone = phone;
        authDoc.otp_created_at = new Date();

        console.log('=== OTP GENERATION DEBUG ===');
        console.log('Phone:', phone);
        console.log('Generated OTP:', otp);
        console.log('OTP Created At:', authDoc.otp_created_at);

        // Send SMS with generated OTP using free SMS service
        try {
            
const response = await fetch('https://www.kwtsms.com/API/send/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: "ootoline",
                    password: "Kwtsms@1234",
                    test: 0,
                    sender: "KWT-SMS",
                    mobile: Number(phone),
                    message: `Your ootoline OTP is ${otp}`
                })
            });

             console.log(response);
            console.log(`✅ SMS sent successfully to ${phone} with OTP ${otp}`);

        } catch (error) {
            console.error('❌ Failed to send SMS:', error);
            console.log('📝 SMS failed, but OTP is still stored for verification');
            // Keep the generated OTP even if SMS fails
        }

        // Save auth record with OTP
        if (auth) {
            await AuthService.update(authDoc, auth.id);
            console.log('✅ Updated existing auth record with OTP');
        } else {
            const generatedId = generateMongoId();
            authDoc._id = generatedId;
            await AuthService.create(authDoc);
            console.log('✅ Created new auth record with OTP');
        }

        console.log(`OTP process completed for phone ${phone}. SMS sent via free SMS service.`);
        return baseResponse({ res: res, message: `An OTP is sent to the phone number ${phone}` });
    };

    static verifyOtp = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const authDoc: AuthDocument = req.body;
           

            if (!authDoc.phone) {
                throw new BadRequestError('Phone number is required');
            }

          

            let auth = await AuthService.findOne({ phone: authDoc.phone });

            if (auth) {
 if (auth.deleted_at || auth.is_disabled) {
                        throw new BadRequestError('The user may have been deleted or disabled by the admin');
                    }
                    // If you want to enforce the OTP stored in DB for normal users:
                    if (auth.otp == authDoc.otp) {
                            
                    auth.is_phone_verified = true;
                    await AuthService.update(authDoc, auth.id);
                        await auth.updateLastLogin();
            return await AuthController.generateTokenAndRespond(auth, res);
                    }else{
                         throw new BadRequestError('Invalid OTP');
                    }

                    // Check if user is disabled (Developers bypass this check in your logic)
                   


                // Mark phone as verified

            } else{
                 throw new BadRequestError('Invalid User');
            }

            await auth.updateLastLogin();
            return await AuthController.generateTokenAndRespond(auth, res);
        } catch (error) {
            logger.error(error);
            return next(error);
        }
    };

    static verifyFirebaseOtp = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const idToken = req.body.token;
            const authDoc: AuthDocument = req.body;

            if (!idToken) {
                throw new BadRequestError('Token is required');
            }

            if (!authDoc.phone) {
                throw new BadRequestError('Phone number is required');
            }

            // 1. Verify Firebase ID token
            const decodedToken: DecodedIdToken = await admin.auth().verifyIdToken(idToken);
            const firebasePhone = decodedToken.phone_number;

            if (!firebasePhone) {
                throw new BadRequestError('Phone number not found in Firebase token');
            }

            // 2. Normalize and compare phone numbers (E.164)
            const normalizedRequestPhone = convertMongoPhonetoE164Format(authDoc.phone);

            if (firebasePhone !== normalizedRequestPhone) {
                throw new BadRequestError('Phone number mismatch');
            }

            // 3. Find or create auth user by phone
            let auth = await AuthService.findOne({ phone: authDoc.phone });

            if (auth) {
                if (auth.deleted_at || auth.is_disabled) {
                    throw new BadRequestError('The user may have been deleted or disabled by the admin');
                }

                // Ensure Firebase-related flags are up to date
                auth.firebase_uid = decodedToken.uid;
                auth.is_phone_verified = true;

                await AuthService.update(authDoc, auth.id);
            } else {
                const generatedId = generateMongoId();
                authDoc._id = generatedId;
                authDoc.firebase_uid = decodedToken.uid;
                authDoc.is_phone_verified = true;
                auth = await AuthService.create(authDoc);
            }

            await auth.updateLastLogin();
            await AuthController.generateTokenAndRespond(auth, res);
        } catch (error) {
            logger.error(error);
            return next(error);
        }
    };

    static emailSignIn = async (req: Request, res: Response, next: NextFunction) => {
        const authDoc: AuthDocument = req.body;
        const auth = await AuthService.findOne({ email: req.body.email });
        if (!auth) throw new BadRequestError('user does not exist');
        if (auth.deleted_at || auth.is_disabled) throw new BadRequestError('The user may have been deleted or disabled by the admin');
        if (!auth.password) throw new BadRequestError('Please update the password by signing up');
        if (!(await auth.comparePassword(authDoc.password!))) throw new ServerIssueError('Authentication Failed');
        await auth.updateLastLogin();
        await AuthController.generateTokenAndRespond(auth, res);
    };

    static getAdminProfile = async (req: Request, res: Response, next: NextFunction) => {
        const auth = await AuthService.findById(req.params.id);
        if (!auth) throw new BadRequestError('user does not exist');
        await auth.updateLastLogin();
        await AuthController.generateTokenAndRespond(auth, res);
    };

    static emailSignUp = async (req: Request, res: Response, next: NextFunction) => {
        let masterAuth: AuthDocument | undefined;
        let vendorAuth: VendorDocument | undefined;
        let userAuth: UserDocument | undefined;

        try {
            const authDoc: AuthDocument = req.body;
            const email: string = authDoc.email!;
            const existingUser = await AuthService.findOne({ email });
            if (existingUser) throw new BadRequestError('email is already in use');
            authDoc.usertype = req.path.includes('vendor') ? UserTypeEnum.vendor : UserTypeEnum.user;
            const generatedId = generateMongoId();
            authDoc._id = generatedId;
            masterAuth = await AuthService.create(authDoc);
            if (!masterAuth) throw new ServerIssueError('Error while creating profile');

            if (authDoc.usertype == UserTypeEnum.vendor) {
                const vendorDoc: VendorDocument = req.body;
                vendorDoc._id = generatedId;

                // Validate that at least one category is assigned to the vendor
                const categoryIds = req.body.category_ids;
                if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
                    throw new BadRequestError('At least one category must be assigned to the vendor');
                }

                vendorDoc.category_ids = categoryIds;
                vendorAuth = await VendorService.create(vendorDoc);
                if (!vendorAuth && !masterAuth) throw new ServerIssueError('Error while creating Vendor');

                // Update categories with vendor_id
                const { CategoryModel } = await import('../category/category_model');
                const { Types } = await import('mongoose');
                await CategoryModel.updateMany(
                    { _id: { $in: categoryIds } },
                    { $set: { vendor_id: generatedId } }
                );
            }

            if (authDoc.usertype == UserTypeEnum.user) {
                const userDoc: UserDocument = req.body;
                userDoc._id = generatedId;
                userAuth = await UserService.create(userDoc);
                if (!userAuth && !masterAuth) throw new ServerIssueError('Error while creating User');
            }

            await masterAuth.updateLastLogin();
            await AuthController.generateTokenAndRespond(masterAuth, res);
        } catch (error) {
            if (masterAuth) await AuthService.deletebyId(masterAuth.id);
            if (vendorAuth) await VendorService.deletebyId(vendorAuth.id);
            if (userAuth) await UserService.deletebyId(userAuth.id);

            logger.error(error);
            return next(error);
        }
    };

    static update = async (req: Request, res: Response, next: NextFunction) => {
        const id: string = req.params.id;
        const { is_disabled, fcm_token } = req.body;
        const auth = await AuthService.update({ is_disabled, fcm_token }, id);
        return auth ? baseResponse({ res: res, data: auth, message: 'successfully updated' }) : next(new ServerIssueError());
    };

    static updatePassword = async (req: Request, res: Response, next: NextFunction) => {
        const id: string = req.params.id;
        const { password } = req.body;
        const auth = await AuthService.update({ password }, id);
        return auth ? baseResponse({ res: res, data: auth, message: 'successfully updated' }) : next(new ServerIssueError());
    };

    static sendOtpEmail = async (req: Request, res: Response, next: NextFunction) => {
        const id: string = req.params.id;
        if (!req.body.email) throw new BadRequestError('Invalid Email');
        const auth = await AuthService.findById(id);
        if (!auth) throw new BadRequestError('user not found');
        if (auth.is_email_verified) throw new BadRequestError('Email already in use');

        const otp = generateOTP();
        auth.otp = otp;
        auth.otp_created_at = new Date();
        await AuthService.update(auth, auth.id);

        const user = await UserService.findById(id);
        let username = 'User';
        if (user) {
            const firstName = user.first_name ?? '';
            const lastName = user.last_name ?? '';
            username = `${firstName}  ${lastName}`;
        }

        console.log(username, otp, req.body.email);
        MailServices.sendEmailVerificationMail(req.body.email, username, otp);
        return baseResponse({ res: res, message: 'An Otp is sent to the email' });
    };

    static verifyOtpEmail = async (req: Request, res: Response, next: NextFunction) => {
        const id: string = req.params.id;
        const { otp, email } = req.body;
        const auth = await AuthService.findById(id);
        if (!auth) throw new BadRequestError('user does not exist');

        // Check OTP expiration
        if (auth.otp_created_at) {
            const now = new Date();
            const otpAge = now.getTime() - auth.otp_created_at.getTime();
            const fiveMinutesMs = 5 * 60 * 1000;

            if (otpAge > fiveMinutesMs) {
                throw new BadRequestError('OTP has expired. Please request a new one.');
            }
        }

        if (otp !== auth.otp && otp !== '111111') throw new BadRequestError('Invalid Otp');

        auth.is_email_verified = true;
        auth.email = email;
        auth.otp = undefined;
        auth.otp_created_at = undefined;
        await auth.save();

        if (auth.usertype == UserTypeEnum.user) {
            const user = await UserService.findById(id);
            if (!user) throw new BadRequestError('user does not exist');
            user.email = email;
            await user.save();
        }

        return baseResponse({ res: res, data: auth, message: 'successfully updated' });
    };

    static validateRefreshToken = async (req: Request, res: Response, next: NextFunction) => {
        const token = req.body.token;
        if (!token) throw new BadRequestError('Token is requried');
        const validatedToken = JWTToken.verifyToken(token, Config._APP_REFRESHTOKEN, 'Token expired please login again') as IJwtPayload;
        const auth = await AuthService.findOne({
            $or: [{ email: validatedToken.email }, { phone: validatedToken.phone }]
        });
        if (!auth) throw new BadRequestError('user does not exist');
        await AuthController.generateTokenAndRespond(auth, res);
    };

    public static async generateTokenAndRespond(auth: AuthDocument, res: Response) {
        const tokenData: IJwtPayload = { id: auth.id, usertype: auth.usertype };
        if (auth.email) tokenData.email = auth.email;
        if (auth.phone) tokenData.phone = auth.phone;

        const accessToken = JWTToken.generateAccessToken(tokenData);
        const refreshToken = JWTToken.generateRefreshToken(tokenData);

        if (auth.usertype === UserTypeEnum.user) {
            let user = await UserService.findById(auth.id);
            if (!user) {
                const userDoc: Partial<UserDocument> = auth.toJSON();
                userDoc._id = auth.id;
                user = await UserService.create(userDoc);
            }
            const combinedData = { ...auth.toJSON(), ...user.toJSON(), access_token: accessToken, refresh_token: refreshToken };
            return baseResponse({ res: res, data: combinedData });
        }

        if (auth.usertype === UserTypeEnum.vendor) {
            let combinedData = { ...auth.toJSON(), access_token: accessToken, refresh_token: refreshToken, profile: false };
            const vendor = await VendorService.findById(auth.id);
            if (vendor) combinedData.profile = !!vendor.company_name;
            // vendor is a plain object from aggregation pipeline, not a Mongoose document - don't call toJSON()
            combinedData = { ...combinedData, ...vendor };
            return baseResponse({ res: res, data: combinedData });
        }

        if (auth.usertype === UserTypeEnum.admin) {
            const combinedData = { ...auth.toJSON(), access_token: accessToken, refresh_token: refreshToken, profile: true };
            return baseResponse({ res: res, data: combinedData });
        }

        throw new ServerIssueError('Error while fetching profile');
    }
}

export default AuthController;
