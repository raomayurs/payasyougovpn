const PRICE_LIST: any = {
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

export const getInstanceCost = (instanceType: string, region: string) => {
    return PRICE_LIST[region][instanceType];
};