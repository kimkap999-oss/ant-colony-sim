import js from "@eslint/js";

export default [
    js.configs.recommended,
    {
        files: ["js/**/*.js"],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "module",
            globals: {
                window: "readonly",
                document: "readonly",
                requestAnimationFrame: "readonly",
                console: "readonly",
                Math: "readonly",
                Set: "readonly",
                Map: "readonly",
                Error: "readonly",
                describe: "readonly",
                beforeEach: "readonly",
                test: "readonly",
                expect: "readonly"
            }
        },
        rules: {
            "no-unused-vars": "warn",
            "no-undef": "error"
        }
    }
];
