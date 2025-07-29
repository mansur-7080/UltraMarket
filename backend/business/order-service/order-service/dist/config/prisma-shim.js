"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Prisma = exports.prisma = void 0;
var client_1 = require("@prisma/client");
// Cast the existing Prisma client to our extended type
exports.prisma = new client_1.PrismaClient();
// Augment the Prisma namespace
exports.Prisma = {
    JsonObject: {},
    OrderWhereUniqueInput: {},
    OrderWhereInput: {},
    OrderInclude: {},
    CartItemWhereInput: {},
};
