"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRegister = void 0;
exports.validateRegister = (options) => {
    if (options.username.length < 3) {
        return [
            {
                field: "username",
                message: "length must be greater than 2"
            }
        ];
    }
    if (options.username.includes("@")) {
        return [
            {
                field: "username",
                message: "username cannot include `@` symbol"
            }
        ];
    }
    if (!options.email.includes("@")) {
        return [{
                field: "email",
                message: "invalid email: must include `@` symbol "
            }];
    }
    if (options.email.length < 3) {
        return [
            {
                field: "email",
                message: "length must be greater than 2"
            }
        ];
    }
    if (options.password.length < 3) {
        return [{
                field: "password",
                message: "length must be greater than 2"
            }];
    }
    return null;
};
//# sourceMappingURL=validateRegister.js.map