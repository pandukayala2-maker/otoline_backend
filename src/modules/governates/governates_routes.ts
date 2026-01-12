import { Router } from 'express';
import asyncHandler from '../../middleware/async_handler';
import { validateId } from '../../middleware/payload_handler';
import JWTToken from '../../utils/tokens';
import GovernateController from './governates_controller';
import GovernateValidations from './governates_validations';

const router = Router();

router.get('/', asyncHandler(GovernateController.find));
router.post('/', JWTToken.vendorAccessToken, GovernateValidations.create, asyncHandler(GovernateController.create));
router.patch('/:id', validateId, JWTToken.vendorAccessToken, asyncHandler(GovernateController.update));
router.delete('/:id', validateId, JWTToken.vendorAccessToken, asyncHandler(GovernateController.delete));

export default router;
