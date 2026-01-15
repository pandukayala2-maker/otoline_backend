import BaseValidator from '../../common/base_validator';
import ErrorHandler from '../../middleware/error_handler';
import { body } from 'express-validator';

export default class AuthValidations extends BaseValidator {
    static signInPhone = [this.nameField('phone'), ErrorHandler.requestValidator];

    static sendEmailOtp = [this.emailField(), ErrorHandler.requestValidator];

    static verifyOtp = [
        this.nameField('phone'), 
        body('otp')
            .notEmpty()
            .withMessage('OTP is required.')
            .isString()
            .withMessage('OTP must be a string.'),
        ErrorHandler.requestValidator
    ];

    static verifyEmailOtp = [this.emailField(), this.numberField('otp'), ErrorHandler.requestValidator];

    static signInEmail = [this.emailField(), this.nameField('password'), ErrorHandler.requestValidator];

    // static signUpUser = [this.emailField(), this.nameField('first_name'), this.nameField('password'), ErrorHandler.requestValidator];

    static signUpVendor = [this.emailField(), this.nameField('password'), ErrorHandler.requestValidator];

    // static otpverification = [
    //     body('otp')
    //         .notEmpty()
    //         .withMessage('OTP is required.')
    //         .isLength({ min: 6, max: 6 })
    //         .withMessage('OTP must be exactly 6 digits long.')
    //         .isNumeric()
    //         .withMessage('OTP must be a number.'),
    //     body('token').notEmpty().withMessage('token is required.'),
    //     ErrorHandler.requestValidator
    // ];

    static sendOtp = [this.numberField('phone'), ErrorHandler.requestValidator];

    // static update = [body('is_disabled').optional(), body('is_disabled').optional(), ErrorHandler.requestValidator];

    // static updatepassword = [
    //     body('password').optional(),
    //     body('token').notEmpty().withMessage('token is required'),
    //     body('new_password').notEmpty().withMessage('new_password is required'),
    //     ErrorHandler.requestValidator
    // ];

    static token = [this.nameField('token', { maxLength: 1000 }), ErrorHandler.requestValidator];
}
