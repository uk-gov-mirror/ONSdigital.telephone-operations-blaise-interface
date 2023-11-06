process.env = Object.assign(process.env, {
    NODE_ENV: "development",
    REACT_APP_CATI_DASHBOARD_URL: "cati-dashboard-url/Blaise/CaseInfo",
    VM_EXTERNAL_CLIENT_URL: "external-client-url",
    VM_EXTERNAL_WEB_URL: "external-web-url",
    BLAISE_API_URL: "mock",
    VM_INTERNAL_URL: "internal-url",
    BIMS_CLIENT_ID: "mock@id",
    BIMS_API_URL: "mock-bims-api"
});

module.exports = {
    "testEnvironment": "jsdom",
    "coveragePathIgnorePatterns": [
        "/node_modules/"
    ],
    "setupFilesAfterEnv": [
        "jest-extended"
    ],
    "preset": "ts-jest",
    "moduleNameMapper": {
        "\\.(css|less|scss)$": "identity-obj-proxy"
    },
    "testEnvironmentOptions": {
        "html": "<html lang=\"zh-cmn-Hant\"></html>",
        "url": "https://jestjs.io/",
        "userAgent": "Agent/007"
    },
    transformIgnorePatterns: ["<rootDir>/node_modules/(?!crypto-random-string/)"],
    modulePathIgnorePatterns: ["<rootDir>/dist/"]
};