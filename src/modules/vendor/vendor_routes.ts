import { Router } from 'express';
import asyncHandler from '../../middleware/async_handler';
import MediaHandler from '../../middleware/media_handler';
import { validateId } from '../../middleware/payload_handler';
import JWTToken from '../../utils/tokens';
import VendorController from './vendor_controller';

const router = Router();

router.get('/', asyncHandler(VendorController.find));
router.get('/:id/categories', validateId, asyncHandler(VendorController.getCategories));
router.get('/:id/assigned-categories', validateId, JWTToken.validateAccessToken, asyncHandler(VendorController.getAssignedCategories));
router.get('/:id/assigned-categories-with-services', validateId, JWTToken.validateAccessToken, asyncHandler(VendorController.getAssignedCategoriesWithServices));
router.get('/:id', validateId, JWTToken.validateAccessToken, asyncHandler(VendorController.findById));
router.patch('/:id', validateId, JWTToken.vendorAccessToken, MediaHandler.singleMediaHandler, asyncHandler(VendorController.update));

export default router;
