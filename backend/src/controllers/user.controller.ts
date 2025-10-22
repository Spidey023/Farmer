import { NextFunction, Request, Response } from "express"
import bcrypt from "bcrypt";
import { asyncHandler } from "../utils/ayncHnadler"
import ApiError from "../utils/ApiError";
import { prisma } from "../db";
import { hashPassowrd } from "../utils/hashPassword";
import ApiResponse from "../utils/ApiResponse";


const registerUser = asyncHandler(async (req:Request, res:Response,next:NextFunction) => {
    const {username, email, password} = req.body;

    if(!username || !email || !password){
        throw new ApiError(400, "Please provide all required fields")
    }
    
    // check if user already exists
    const existingUser = await prisma.farmer.findUnique({
        where: {email}
    })
    if(existingUser){
        throw new ApiError(400, "User already exists")
    }

    // hash password
    const newPassword= await hashPassowrd(password,10);

    // create new user
    const newUser = await prisma.farmer.create({
        data: {
            username,
            email,
            password:newPassword
        }
    })
    res.status(200).json(new ApiResponse(200, newUser, "User registered successfully"))
})

const login = asyncHandler(async (req:Request, res:Response,next:NextFunction) => {
    const {email, password} = req.body;

    if(!email || !password){
        throw new ApiError(400, "Please provide all required fields")
    }
    
    // check if user exists
    const existingUser = await prisma.farmer.findUnique({
        where: {email},
        select:{farmerId:true, username:true, email:true, password:true}
    })
    if(!existingUser){
        throw new ApiError(400, "Invalid email or password")
    }

    // verify password
    const isPasswordValid = await bcrypt.compare(password, existingUser.password);
    if(!isPasswordValid){
        throw new ApiError(400, "Invalid email or password")
    }

    return res.status(200).json(new ApiResponse(200, existingUser, "User logged in successfully"))
})

export {registerUser, login}