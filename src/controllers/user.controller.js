import { asyncHandler } from '../utils/asyncHandler.js'
import ApiError from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import ApiResponse from "../utils/ApiResponse.js"

const registerUser = asyncHandler(async (req, res) => {

    // get user details from front-end

    const { fullname, email, username, password } = req.body
    console.log(email)

    // validations - notEmpty

    if ([
        fullname, email, username, password
    ].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All compulsory fields are required!")
    }

    // check if user is already signed up : email/username

    const existedUser = await User.findOne({
        $or: [{email}, {username}]
    })

    if (existedUser) {
        throw new ApiError(409, "User with the same email or username already exists!")
    }

    // console.log(req.files)

    // check for files being uploaded : avatar

    const avatarLocalPath = req.files?.avatar[0]?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required!")
    }

    // check if there's a cover image being uploaded - if not send empty string

    let coverImageLocalPath;

    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }
    

    // console.log(avatarLocalPath)


    


    // upload to cloudinary

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required!")
    }

    
    // get the cloudinary URL from response
    
    
    
    

    // create user object - create entry in db

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    // remove password and refresh token field from response

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    // check if there's response of user creation
    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user. Please try again later!")
    }

    // return response or error
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registered Successfully!")
    )

})

export { registerUser }