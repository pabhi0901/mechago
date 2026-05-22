import ImageKit from 'imagekit';
import { nanoid } from 'nanoid'
import dotenv from 'dotenv';
dotenv.config();

// Result: https://ik.imagekit.io/your_imagekit_id/path/to/image.jpg

const uploadFileToImageKit = async (file, folderName) => {

  try {
  
    
    const client = new ImageKit({
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
      urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
    });

    // Convert buffer to base64 for ImageKit
    const fileBase64 = file.buffer.toString('base64');

    const response = await client.upload({
      file: fileBase64,
      fileName: nanoid(),
      folder: folderName
    });

    
    return response.url;
  } catch(error) {
    console.error("Error uploading file to ImageKit:", error);
    throw error; //error propagation
  }
}

export default uploadFileToImageKit
