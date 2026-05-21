import { jest } from "@jest/globals";

const mockSign   = jest.fn();
const mockVerify = jest.fn();

jest.unstable_mockModule("jsonwebtoken", () => ({
    default: { sign: mockSign, verify: mockVerify },
    sign: mockSign, verify: mockVerify,
}));
jest.unstable_mockModule("../config/serverConfig.js", () => ({
    JWT_SECRET: "test_secret_32_chars_xxxxxxxxxx!",
    JWT_EXPIRES_IN: "1h",
}));

const { signToken, verifyToken } = await import("../utils/jwtUtils.js");
const { errorHandler, AppError } = await import("../utils/errorHandler.js");

// ── signToken ─────────────────────────────────────────────────────────────────
describe("signToken", () => {
    afterEach(() => jest.clearAllMocks());

    test("calls jwt.sign with the payload", () => {
        mockSign.mockReturnValue("tok");
        signToken({ id: "u1" });
        expect(mockSign).toHaveBeenCalledWith({ id: "u1" }, expect.any(String), expect.objectContaining({ expiresIn: expect.any(String) }));
    });

    test("returns whatever jwt.sign returns", () => {
        mockSign.mockReturnValue("my_jwt");
        expect(signToken({ id: "u1" })).toBe("my_jwt");
    });

    test("uses the JWT_SECRET from config", () => {
        mockSign.mockReturnValue("t");
        signToken({ id: "u1" });
        expect(mockSign.mock.calls[0][1]).toBe("test_secret_32_chars_xxxxxxxxxx!");
    });

    test("passes expiresIn option", () => {
        mockSign.mockReturnValue("t");
        signToken({ id: "u1" });
        expect(mockSign.mock.calls[0][2]).toHaveProperty("expiresIn");
    });
});

// ── verifyToken ───────────────────────────────────────────────────────────────
describe("verifyToken", () => {
    afterEach(() => jest.clearAllMocks());

    test("calls jwt.verify with token and secret", () => {
        mockVerify.mockReturnValue({ id: "u1" });
        verifyToken("some_token");
        expect(mockVerify).toHaveBeenCalledWith("some_token", "test_secret_32_chars_xxxxxxxxxx!");
    });

    test("returns the decoded payload", () => {
        const decoded = { id: "u1", email: "a@b.com" };
        mockVerify.mockReturnValue(decoded);
        expect(verifyToken("tok")).toEqual(decoded);
    });

    test("propagates JsonWebTokenError", () => {
        const e = Object.assign(new Error("invalid"), { name: "JsonWebTokenError" });
        mockVerify.mockImplementation(() => { throw e; });
        expect(() => verifyToken("bad")).toThrow("invalid");
    });

    test("propagates TokenExpiredError", () => {
        const e = Object.assign(new Error("expired"), { name: "TokenExpiredError" });
        mockVerify.mockImplementation(() => { throw e; });
        expect(() => verifyToken("exp")).toThrow("expired");
    });
});

// ── AppError ──────────────────────────────────────────────────────────────────
describe("AppError", () => {
    test("extends Error", () => {
        expect(new AppError("oops", 400)).toBeInstanceOf(Error);
    });
    test("stores message", () => {
        expect(new AppError("not found", 404).message).toBe("not found");
    });
    test("stores statusCode", () => {
        expect(new AppError("gone", 410).statusCode).toBe(410);
    });
    test("defaults statusCode to 400", () => {
        expect(new AppError("bad").statusCode).toBe(400);
    });
});

// ── errorHandler ──────────────────────────────────────────────────────────────
describe("errorHandler", () => {
    const r = () => { const x = {}; x.status = jest.fn().mockReturnValue(x); x.json = jest.fn().mockReturnValue(x); return x; };

    test("uses err.statusCode as HTTP status", () => {
        const res = r();
        errorHandler(new AppError("not found", 404), {}, res, jest.fn());
        expect(res.status).toHaveBeenCalledWith(404);
    });

    test("falls back to 500 when err has no statusCode", () => {
        const res = r();
        errorHandler(new Error("boom"), {}, res, jest.fn());
        expect(res.status).toHaveBeenCalledWith(500);
    });

    test("responds with { success: false, message }", () => {
        const res = r();
        errorHandler(new AppError("taken", 409), {}, res, jest.fn());
        expect(res.json).toHaveBeenCalledWith({ success: false, message: "taken" });
    });

    test("uses 'Internal Server Error' when message is missing", () => {
        const res = r();
        errorHandler({}, {}, res, jest.fn());
        expect(res.json.mock.calls[0][0].message).toBe("Internal Server Error");
    });
});
