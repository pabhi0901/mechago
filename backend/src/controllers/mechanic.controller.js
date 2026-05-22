import locationModel from "../models/location.model.js";
import Message from "../models/message.model.js";
import customerProblemModel from "../models/customerProblem.model.js";
import userModel from "../models/user.model.js";
import { getReceiverSocketId } from "../services/socket.service.js";
import { getIo } from "../services/socket.service.js";

// Update status of a customer problem
async function updateProblemStatusController(req, res) {
  try {
    const { problemId, status } = req.body;

    const validStatuses = ["accepted", "rejected", "completed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const problem = await customerProblemModel.findById(problemId).populate("userId");

    if (!problem) {
      return res.status(404).json({ success: false, message: "Problem not found" });
    }

    problem.status = status;
    await problem.save();

    // Notify customer via socket rooms instantly
    const customerId = problem.userId?._id ? problem.userId._id.toString() : problem.userId?.toString();
    if (customerId) {
      const io = getIo();
      if (io) {
        console.log(`Emitting problem status update to customer room ${customerId}: ${status}`);
        
        // Emit general problem-status-updated event
        io.to(customerId).emit("problem-status-updated", {
          problemId: problem._id,
          status,
          problem
        });

        // Also emit status-specific events for backwards-compatibility
        if (status === "accepted") {
          io.to(customerId).emit("request-accepted", {
            problemId: problem._id,
            mechanicId: problem.mechanicId,
            problem
          });
        } else if (status === "rejected") {
          io.to(customerId).emit("request-rejected", {
            problemId: problem._id,
            mechanicId: problem.mechanicId,
            problem
          });
        }
      }
    }

    return res.status(200).json({ success: true, message: `Problem status updated to ${status}` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

// Update fixed price of a customer problem
async function updateFixedPriceController(req, res) {
  try {
    const { problemId, fixedPrice } = req.body;
    const mechanicId = req.user._id;

    const problem = await customerProblemModel.findById(problemId);

    if (!problem) {
      return res.status(404).json({ success: false, message: "Problem not found" });
    }

    if (problem.mechanicId.toString() !== mechanicId.toString()) {
      return res.status(403).json({ success: false, message: "You are not assigned to this problem" });
    }

    problem.fixedPrice = fixedPrice;
    await problem.save();

    return res.status(200).json({ success: true, message: "Fixed price updated successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

// Update UPI ID of a mechanic
async function updateUpiIdController(req, res) {
  try {
    const { upiId } = req.body;
    const mechanicId = req.user._id;

    const mechanic = await userModel.findById(mechanicId);

    if (!mechanic) {
      return res.status(404).json({ success: false, message: "Mechanic not found" });
    }

    mechanic.upiId = upiId;
    await mechanic.save();

    return res.status(200).json({ success: true, message: "UPI ID updated successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

async function createMechanicLocationController(req, res) {
	try {
		const userId = req.user._id;
		const { longitude, latitude } = req.body;

		const existingLocation = await locationModel.findOne({ userId });

		if (existingLocation) {
			return res.status(400).json({
				success: false,
				message: "Location already exists. Please update it instead"
			});
		}

		const location = await locationModel.create({
			userId,
			location: {
				type: "Point",
				coordinates: [longitude, latitude]
			}
		});

		return res.status(201).json({
			success: true,
			message: "Mechanic location stored successfully",
			data: location
		});
	} catch (err) {
		console.error(err);
		return res.status(500).json({
			success: false,
			message: "Internal Server Error"
		});
	}
}

async function updateMechanicLocationController(req, res) {
	try {
		const userId = req.user._id;
		const { longitude, latitude } = req.body;

		const updatedLocation = await locationModel.findOneAndUpdate(
			{ userId },
			{
				location: {
					type: "Point",
					coordinates: [longitude, latitude]
				}
			},
			{ new: true }
		);

		if (!updatedLocation) {
			return res.status(404).json({
				success: false,
				message: "Location not found. Please create it first"
			});
		}

		return res.status(200).json({
			success: true,
			message: "Mechanic location updated successfully",
			data: updatedLocation
		});
	} catch (err) {
		console.error(err);
		return res.status(500).json({
			success: false,
			message: "Internal Server Error"
		});
	}
}

// Get messages for a user with pagination
async function getMessagesController(req, res) {
  try {
    const { page = 1, limit = 10 } = req.query;
    const userId = req.user._id;

    const messages = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const totalMessages = await Message.countDocuments({
      $or: [{ senderId: userId }, { receiverId: userId }],
    });

    return res.status(200).json({
      success: true,
      data: messages,
      totalPages: Math.ceil(totalMessages / limit),
      currentPage: Number(page),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

// Get all pending orders for a mechanic
async function getPendingOrdersController(req, res) {
  try {
    const { page = 1, limit = 10 } = req.query;
    const mechanicId = req.user._id;

    const orders = await customerProblemModel
      .find({ mechanicId, status: "pending" })
      .populate("userId", "name email phone")
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const totalOrders = await customerProblemModel.countDocuments({
      mechanicId,
      status: "pending",
    });

    return res.status(200).json({
      success: true,
      data: orders,
      totalPages: Math.ceil(totalOrders / limit),
      currentPage: Number(page),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

// Get all completed orders for a mechanic
async function getCompletedOrdersController(req, res) {
  try {
    const { page = 1, limit = 10 } = req.query;
    const mechanicId = req.user._id;

    const orders = await customerProblemModel
      .find({ mechanicId, status: "completed" })
      .populate("userId", "name email phone")
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const totalOrders = await customerProblemModel.countDocuments({
      mechanicId,
      status: "completed",
    });

    return res.status(200).json({
      success: true,
      data: orders,
      totalPages: Math.ceil(totalOrders / limit),
      currentPage: Number(page),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}



export default {
	createMechanicLocationController,
	updateMechanicLocationController,
	updateProblemStatusController,
	updateFixedPriceController, updateUpiIdController,
	getMessagesController, getPendingOrdersController, getCompletedOrdersController
};


