import { v2 as cloudinary } from "cloudinary";
import exp from "constants";
import fs from 'fs';

    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
    });


    const uploadOnCloudinary = async (localFilePath) => {
        try {
            if(!localFilePath) return null

            //file uploader
            const response = await cloudinary.uploader.upload(localFilePath, {
                resource_type: "auto"
            })

            //uploaded successfully!
            console.log("File has been uploaded!", response.url)
            return response
        } catch (error) {
            fs.unlinkSync(localFilePath) //remove the locally saved temp file as the upload operation got failed!
            return null
        }
    }


export {uploadOnCloudinary}
