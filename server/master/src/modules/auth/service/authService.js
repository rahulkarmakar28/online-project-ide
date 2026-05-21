import bcrypt from "bcrypt";
import prisma from "../../../shared/db/prisma.js";
import { signToken, signRefreshToken } from "../../../shared/utils/jwtUtils.js";
import { AppError } from "../../../shared/utils/errorHandler.js";

const SALT_ROUNDS = 10;

export const registerService = async ({ email, password }) => {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new AppError("Email already in use", 409);

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
        data: { email, password: hashedPassword },
        select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
        },
    });

    const token = signToken({ id: user.id, email: user.email });
    const refresh_token = signRefreshToken({ id: user.id, email: user.email });

    return { user, token, refresh_token };
};

export const loginService = async ({ email, password }) => {
    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            projects: true,
        },
    });
    if (!user) throw new AppError("Invalid credentials", 401);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new AppError("Invalid credentials", 401);
    // console.log(user);
    const token = signToken({ id: user.id, email: user.email });
    const refresh_token = signRefreshToken({ id: user.id, email: user.email });
    return {
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            projects: user.projects,
            createdAt: user.createdAt,
        },
        token,
        refresh_token,
    };
};

// export const refreshTokenService({id})=>{

// }