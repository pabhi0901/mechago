import axios from "axios";
import userModel from "../models/user.model.js";
import customerProblemModel from "../models/customerProblem.model.js";
import locationModel from "../models/location.model.js";
import uploadFileToImageKit from "../services/imagekit.service.js";
import { getIo } from "../services/socket.service.js";

function buildOsrmUrl(userLon, userLat, mechLon, mechLat) {
  return `https://router.project-osrm.org/route/v1/driving/${userLon},${userLat};${mechLon},${mechLat}?overview=false`;
}

function haversineDistanceMeters(lon1, lat1, lon2, lat2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371000; // Earth radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function findNearbyMechanicsController(req, res) {
  try {
    const userLon = Number(req.query.longitude);
    const userLat = Number(req.query.latitude);
    const radiusKm = Number(req.query.radiusKm ?? req.query.radius ?? 5);

    if (!Number.isFinite(userLon) || !Number.isFinite(userLat) || !Number.isFinite(radiusKm)) {
      return res.status(400).json({
        success: false,
        message: "longitude, latitude and radiusKm are required"
      });
    }

    const radiusMeters = radiusKm * 1000;

    const nearbyLocations = await locationModel
      .find({
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [userLon, userLat]
            },
            $maxDistance: radiusMeters
          }
        }
      })
      .populate({
        path: "userId",
        select: "name upiId avatar role isVerified isBlocked",
        match: { role: "mechanic" }
      })
      .limit(10);

    const mechanics = nearbyLocations.filter((entry) => entry.userId);

    const mechanicsWithRoutes = await Promise.all(
      mechanics.map(async (entry) => {
        const [mechLon, mechLat] = entry.location.coordinates;
        const osrmUrl = buildOsrmUrl(userLon, userLat, mechLon, mechLat);

        const straightMeters = haversineDistanceMeters(userLon, userLat, mechLon, mechLat);
        const straightKm = Number((straightMeters / 1000).toFixed(2));

        console.debug("Nearby search - user:", userLon, userLat, "mechanic:", mechLon, mechLat, "osrmUrl:", osrmUrl);

        try {
          const response = await axios.get(osrmUrl, { timeout: 3000 });
          const route = response.data?.routes?.[0];

          if (!route) {
            throw new Error("Route not found");
          }

          const driveKm = Number((route.distance / 1000).toFixed(2));
          const driveMin = Math.ceil(route.duration / 60);

          const discrepancy = route.distance > straightMeters * 1.5; // driving > 1.5x straight-line

          console.debug("OSRM route distance(m):", route.distance, "straight(m):", straightMeters, "discrepancy:", discrepancy);

          return {
            _id: entry.userId._id,
            name: entry.userId.name,
            upiId: entry.userId.upiId,
            avatar: entry.userId.avatar,
            distanceKm: driveKm,
            straightDistanceKm: straightKm,
            arrivalTimeMinutes: driveMin,
            coordinates: {
              longitude: mechLon,
              latitude: mechLat
            },
            discrepancy
          };
        } catch (error) {
          console.error(error);
          return {
            _id: entry.userId._id,
            name: entry.userId.name,
            upiId: entry.userId.upiId,
            avatar: entry.userId.avatar,
            distanceKm: null,
            straightDistanceKm: straightKm,
            arrivalTimeMinutes: null,
            coordinates: {
              longitude: mechLon,
              latitude: mechLat
            },
            routeUnavailable: true
          };
        }
      })
    );

    mechanicsWithRoutes.sort((first, second) => {
      if (first.distanceKm === null) return 1;
      if (second.distanceKm === null) return -1;
      return first.distanceKm - second.distanceKm;
    });

    return res.status(200).json({
      success: true,
      message: "Nearby mechanics fetched successfully",
      data: mechanicsWithRoutes,
      meta: {
        radiusKm,
        totalFound: mechanicsWithRoutes.length
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

import { getReceiverSocketId } from "../services/socket.service.js";
// ... existing code
async function createCustomerProblemController(req, res) {
  try {
    const customerId = req.user._id;
    const {
      mechanicId,
      vehicleType,
      problemType,
      additionalNotes = "",
      video = "",
      photos = [],
      address,
      latitude,
      longitude
    } = req.body;

    const mechanic = await userModel.findOne({ _id: mechanicId, role: "mechanic" }).select("_id role");

    if (!mechanic) {
      return res.status(404).json({
        success: false,
        message: "Mechanic not found"
      });
    }

    const videoFile = req.files?.video?.[0] || null;
    const photoFiles = req.files?.photos || [];

    const uploadedVideoUrl = videoFile ? await uploadFileToImageKit(videoFile, "mechaGo_customer_problems/videos") : video;

    const uploadedPhotoUrls = photoFiles.length
      ? await Promise.all(
          photoFiles.map((file) => uploadFileToImageKit(file, "mechaGo_customer_problems/photos"))
        )
      : Array.isArray(photos)
        ? photos
        : typeof photos === "string" && photos.trim()
          ? photos.split(",").map((photo) => photo.trim()).filter(Boolean)
          : [];

    const customerProblem = await customerProblemModel.create({
      userId: customerId,
      mechanicId,
      vehicleType,
      problemType,
      additionalNotes,
      video: uploadedVideoUrl,
      photos: uploadedPhotoUrls,
      address,
      latitude: Number(latitude),
      longitude: Number(longitude),
      location: {
        type: "Point",
        coordinates: [Number(longitude), Number(latitude)]
      },
      status: "pending"
    });

    const populatedProblem = await customerProblemModel.findById(customerProblem._id).populate("userId", "name email");

    // Notify the mechanic in real-time
    const receiverSocketId = getReceiverSocketId(mechanicId);
    if (receiverSocketId) {
      getIo().to(receiverSocketId).emit("new-request", populatedProblem);
    }

    return res.status(201).json({
      success: true,
      message: "Problem sent successfully",
      data: populatedProblem
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
}

// Assign a mechanic to a customer problem
async function assignMechanicController(req, res) {
  try {
    const { problemId, mechanicId } = req.body;

    const problem = await customerProblemModel.findById(problemId);

    if (!problem) {
      return res.status(404).json({ success: false, message: "Problem not found" });
    }

    if (problem.mechanicId) {
      return res.status(400).json({ success: false, message: "Mechanic already assigned" });
    }

    problem.mechanicId = mechanicId;
    await problem.save();

    // Emit notification to the mechanic
    getIo().to(mechanicId).emit("problem-assigned", {
      problemId,
      message: "A new problem has been assigned to you."
    });

    return res.status(200).json({ success: true, message: "Mechanic assigned successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

// Update mechanic for a customer problem
async function updateMechanicController(req, res) {
  try {
    const { problemId, mechanicId } = req.body;

    const problem = await customerProblemModel.findById(problemId);

    if (!problem) {
      return res.status(404).json({ success: false, message: "Problem not found" });
    }

    problem.mechanicId = mechanicId;
    await problem.save();

    // Emit notification to the new mechanic
    getIo().to(mechanicId).emit("problem-updated", {
      problemId,
      message: "You have been reassigned to a problem."
    });

    return res.status(200).json({ success: true, message: "Mechanic updated successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

// Cancel a customer problem
async function cancelProblemController(req, res) {
  try {
    const { problemId } = req.body;

    const problem = await customerProblemModel.findById(problemId);

    if (!problem) {
      return res.status(404).json({ success: false, message: "Problem not found" });
    }

    problem.status = "cancelled";
    await problem.save();

    // Emit socket event to the mechanic to instantly clear this problem from their screen
    if (problem.mechanicId) {
      getIo().to(problem.mechanicId.toString()).emit("problem-cancelled", {
        problemId,
        message: "Customer has cancelled this emergency request."
      });
    }

    return res.status(200).json({ success: true, message: "Problem cancelled successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

// Get details of a specific customer problem
async function getCustomerProblemController(req, res) {
  try {
    const { problemId } = req.params;
    const customerId = req.user._id;

    const problem = await customerProblemModel.findById(problemId)
      .populate("userId", "name email phone avatar")
      .populate("mechanicId", "name email phone avatar upiId upiName");

    if (!problem) {
      return res.status(404).json({ success: false, message: "Problem not found" });
    }

    // Ensure this customer owns this problem
    if (problem.userId?._id.toString() !== customerId.toString() && problem.userId?.toString() !== customerId.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized access" });
    }

    return res.status(200).json({ success: true, data: problem });
  } catch (err) {
    console.error("Error in getCustomerProblemController:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}


export default {
  findNearbyMechanicsController,
  createCustomerProblemController,
  assignMechanicController, 
  updateMechanicController, 
  cancelProblemController,
  getCustomerProblemController
};
