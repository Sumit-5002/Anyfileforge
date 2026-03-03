import * as utils from './image/imageUtils';
import * as basic from './image/imageBasic';
import * as transform from './image/imageTransform';
import * as effects from './image/imageEffects';
import * as advanced from './image/imageAdvanced';

const imageService = {
    ...utils,
    ...basic,
    ...transform,
    ...effects,
    ...advanced
};

export default imageService;
