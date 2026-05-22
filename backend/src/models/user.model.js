import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true, 
    },

    phone: { 
      type: String, 
      required: true, 
    },

    email: { 
      type: String, 
      required: true,
      unique: true,
    },

    password: { 
      type: String, 
      required: true 
    },

    role: { 
      type: String, 
      enum: ["customer", "mechanic", "admin"], 
      default: "customer" 
    },

    avatar: { 
      type: String, 
      default: "" 
    },

    isVerified: { 
      type: Boolean, 
      default: false 
    },

    isBlocked: { 
      type: Boolean, 
      default: false 
    },

    // Mechanic Payment Details
    upiId: {
      type: String,
      default: ""
    },

    upiName: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);