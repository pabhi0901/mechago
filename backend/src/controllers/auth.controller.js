import jsonwebtoken from "jsonwebtoken"
import bcrypt from "bcryptjs"
import userModel from "../models/user.model.js"
import uploadFileToImageKit from "../services/imagekit.service.js"


async function registerController(req, res) {


   try{

        const { name, phone, email, password, upiId, upiName,role } = req.body
        const image = req.file ? req.file : null
    
        // Check if user with the same phone or email already exists
        let user = await userModel.findOne({ email })

        if(user){
            return res.status(400).json({
                success: false,
                message: "User already exists"
            })
        }
        let imageUrl = "";
        if(image?.buffer)  imageUrl = await uploadFileToImageKit(image,"mechaGo_profile_pics")  
        
        
        const hashedPassword = await bcrypt.hash(password, 10)

        if(role === "mechanic"){

            user = await userModel.create({
                name,
                phone,
                email,
                password: hashedPassword,
                role,
                avatar: imageUrl,
                upiId,
                upiName
            })

            res.status(201).json({
                success: true,
                message: "Mechanic registration applied successfully, waiting for admin approval",    

            })

        }
        else if(role === "customer"){
            
            user = await userModel.create({
                name,
                phone,
                email,
                password: hashedPassword,
                role,
                avatar: imageUrl,
                isVerified: true, // Auto-verify customers
            })

            const token = jsonwebtoken.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "3d" });

            res.cookie("token", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
                maxAge: 3 * 24 * 60 * 60 * 1000 // 3 days
            })


            res.status(201).json({
                success: true,
                message: "Customer registered successfully",
                token,
                userInfo:{
                    userId: user._id,
                    name: user.name,
                    email: user.email,
                    avatar: user.avatar,
                    role: user.role,
                }
            })
        }
    
    
    }catch(err){

        console.error(err);
        console.log("Error in registering user");

        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })

   }




}

async function loginController(req, res) {
    try {
        const { email, password } = req.body;

        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        if (user.role === "mechanic") {
            if (user.isBlocked) {
                return res.status(403).json({
                    success: false,
                    message: "Mechanic account is blocked"
                });
            }

            if (!user.isVerified) {
                return res.status(403).json({
                    success: false,
                    message: "Mechanic account is pending verification"
                });
            }
        }

        const token = jsonwebtoken.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "3d" }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 3 * 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
            success: true,
            message: "Logged in successfully",
            token,
            userInfo: {
                userId: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                role: user.role
            }
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}

async function logoutController(req, res) {
    try {
        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
        });

        return res.status(200).json({
            success: true,
            message: "Logged out successfully"
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}

async function changeProfilePhotoController(req, res) {
    try {
        const userId = req.user._id;
        const image = req.file;

        if (!image?.buffer) {
            return res.status(400).json({
                success: false,
                message: "Profile photo is required"
            });
        }

        const avatar = await uploadFileToImageKit(image, "mechaGo_profile_pics");

        const updatedUser = await userModel.findByIdAndUpdate(
            userId,
            { avatar },
            { new: true }
        );

        return res.status(200).json({
            success: true,
            message: "Profile photo updated successfully",
            userInfo: {
                userId: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                avatar: updatedUser.avatar,
                role: updatedUser.role
            }
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}

async function changePasswordController(req, res) {
    try {
        const userId = req.user._id;
        const { currentPassword, newPassword } = req.body;

        const user = await userModel.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: "Current password is incorrect"
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        user.password = hashedPassword;
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password changed successfully"
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}



export default {
    registerController,
    loginController,
    logoutController,
    changeProfilePhotoController,
    changePasswordController
}