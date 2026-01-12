import { Router } from 'express';
import asyncHandler from '../../middleware/async_handler';
import MediaHandler from '../../middleware/media_handler';
import { validateId } from '../../middleware/payload_handler';
import JWTToken from '../../utils/tokens';
import ProductController from './product_controller';
import ProductValidations from './product_validation';

const router = Router();

router.get('/', JWTToken.emptyAccessToken, asyncHandler(ProductController.find));
router.get('/vendor/:vendor_id/categories', asyncHandler(ProductController.getVendorCategories));
router.get('/:id', validateId, asyncHandler(ProductController.findById));

router.post(
    '/',
    JWTToken.vendorAccessToken,
    MediaHandler.multiMediaHandler(['image']),
    ProductValidations.create,
    asyncHandler(ProductController.create)
);

router.patch('/:id', validateId, JWTToken.vendorAccessToken, MediaHandler.multiMediaHandler(['image']), asyncHandler(ProductController.update));
router.delete('/:id', validateId, JWTToken.vendorAccessToken, asyncHandler(ProductController.delete));

export default router;
