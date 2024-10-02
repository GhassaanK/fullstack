import { asyncHandler } from '../utils/asyncHandler.js'
import ApiError from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import ApiResponse from "../utils/ApiResponse.js"

const registerUser = asyncHandler(async (req, res) => {
    // get user details from front-end
    // validations - notEmpty
    // check if user is already signed up : email/username
    // check for files being uploaded : avatar
    // upload to cloudinary
    // get the cloudinary URL from response
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check if there's response of user creation
    // return response or error

    const { fullname, email, username, password } = req.body
    console.log(email)

    // if(fullname===""){
    //     throw new ApiError(400, "Full name is required!")
    // }

    if ([
        fullname, email, username, password
    ].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All compulsory fields are required!")
    }

    const existedUser = User.findOne({
        $or: [{email}, {username}]
    })

    if (existedUser) {
        throw new ApiError(409, "User with the same email or username already exists!")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    console.log(avatarLocalPath)

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required!")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required!")
    }

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user. Please try again later!")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registered Successfully!")
    )

})

export { registerUser }