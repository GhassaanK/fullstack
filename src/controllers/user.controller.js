import { asyncHandler } from '../utils/asyncHandler.js'
import ApiError from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import ApiResponse from "../utils/ApiResponse.js"

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})

        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating tokens!")
    }
}

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

const loginUser = asyncHandler(async (req, res) => {

    // get data from the req body
    const {email, username, password} = req.body

    // check either there is an email or username is present
    if ( !username || !email ) {
        throw new ApiError(400, "Username or Email is required!")
    }

    // find user in db
    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    // if user is not registered
    if (!user) {
        throw new ApiError(404, "Can't find a user with the provided email or username!")
    }

    // if there is user registered check for correct credentials
    const isPasswordValid = await user.isPasswordCorrect(password)

    // if password is incorrect throw error
    if(!isPasswordValid){
        throw new ApiError(401, "Invalid credentials!")
    }

    // if success, generate refresh access tokens (separate method above) and save them
    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    // send cookies

    const options = {
        httpOnly: true,
        secure: true
    }

    // send response
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(200, {
            user: loggedInUser, accessToken, refreshToken
        }, "User Logged In Successfully!")
    )
})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged Out Successfully!"))
})

export {
    registerUser,
    loginUser,
    logoutUser
}