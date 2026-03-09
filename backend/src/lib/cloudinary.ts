import { v2 as cloudinary } from 'cloudinary'
import multer from 'multer'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export const upload = multer({ storage: multer.memoryStorage() })

export async function uploadToCloudinary(buffer: Buffer, folder = 'nn-audio'): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream({ folder }, (err, result) => {
      if (err || !result) return reject(err)
      resolve({ url: result.secure_url, publicId: result.public_id })
    }).end(buffer)
  })
}

export async function deleteFromCloudinary(publicId: string) {
  return cloudinary.uploader.destroy(publicId)
}
