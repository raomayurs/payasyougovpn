"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInstanceCost = void 0;
const PRICE_LIST = {
    "ap-south-1": {
        "t2.micro": 0.0116
    },
    "eu-west-2": {
        "t2.micro": 0.0116
    },
    "us-east-1": {
        "t2.micro": 0.0116
    },
    "ap-northeast-1": {
        "t2.micro": 0.0152
    }
};
const getInstanceCost = (instanceType, region) => {
    return PRICE_LIST[region][instanceType];
};
exports.getInstanceCost = getInstanceCost;
