"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const validateRequest = (schema) => async (req, _res, next) => {
    try {
        await schema.parseAsync({
            body: req.body,
            query: req.query,
            params: req.params,
            cookies: req.cookies,
        });
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.default = validateRequest;
//# sourceMappingURL=validateRequest.js.map