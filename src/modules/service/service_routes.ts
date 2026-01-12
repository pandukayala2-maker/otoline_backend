import { Router } from 'express';
import asyncHandler from '../../middleware/async_handler';
import MediaHandler from '../../middleware/media_handler';
import { validateId } from '../../middleware/payload_handler';
import JWTToken from '../../utils/tokens';
import ServiceController from './service_controller';
import ServiceValidations from './service_validations';

const router = Router();

router.get('/', asyncHandler(ServiceController.find));
router.get('/vendor/:vendor_id/categories', asyncHandler(ServiceController.getVendorCategories));
router.get('/:id', asyncHandler(ServiceController.findById));
router.post(
    '/',
    JWTToken.vendorAccessToken,
    MediaHandler.multiMediaHandler(['image']),
    ServiceValidations.create,
    asyncHandler(ServiceController.create)
);
router.patch('/:id', validateId, MediaHandler.multiMediaHandler(['image']), JWTToken.vendorAccessToken, asyncHandler(ServiceController.update));
router.delete('/:id', validateId, JWTToken.vendorAccessToken, asyncHandler(ServiceController.delete));

export default router;
