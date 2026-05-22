import mongoose from "mongoose";

const customerProblemSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // mechanic will be assigned later
    mechanicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    vehicleType: {
      type: String,
      enum: [
        "bike",
        "scooter",
        "car",
        "auto",
        "truck",
        "bus",
        "e-rickshaw",
        "other",
      ],
      required: true,
    },

    problemType: {
      type: String,
      enum: [
        "puncture",
        "battery_discharge",
        "engine_failure",
        "fuel_empty",
        "overheating",
        "brake_issue",
        "starter_issue",
        "electrical_issue",
        "accident",
        "clutch_issue",
        "chain_issue",
        "towing_required",
        "other",
      ],
      required: true,
    },

    additionalNotes: {
      type: String,
      trim: true,
      default: "",
    },

    // uploaded video URL
    video: {
      type: String,
      default: "",
    },

    // maximum 2 uploaded images
    photos: {
      type: [String],
      default: [],
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    latitude: {
      type: Number,
      required: true,
    },

    longitude: {
      type: Number,
      required: true,
    },

    // GeoJSON location
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },

      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },

    // mechanic will decide later
    fixedPrice: {
      type: Number,
      default: null,
      min: 0,
    },

    // request lifecycle
    status: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "on_the_way",
        "completed",
        "cancelled",
        "rejected"
      ],
      default: "pending",
    },
  },

  {
    timestamps: true,
  }
);

// geospatial index
customerProblemSchema.index({ location: "2dsphere" });

const CustomerProblem = mongoose.model(
  "CustomerProblem",
  customerProblemSchema
);

export default CustomerProblem;