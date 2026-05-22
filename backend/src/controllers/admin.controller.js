import userModel from "../models/user.model.js";

async function getAllMechanicsController(req, res) {
    try {
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.max(parseInt(req.query.limit, 10) || 10, 1);
        const skip = (page - 1) * limit;

        const filter = { role: "mechanic" };

        const [mechanics, totalMechanics] = await Promise.all([
            userModel.find(filter)
                .select("-password")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            userModel.countDocuments(filter)
        ]);

        return res.status(200).json({
            success: true,
            message: "Mechanics fetched successfully",
            data: mechanics,
            pagination: {
                totalItems: totalMechanics,
                totalPages: Math.ceil(totalMechanics / limit),
                currentPage: page,
                limit
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

async function getPendingMechanicRequestsController(req, res) {
    try {
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.max(parseInt(req.query.limit, 10) || 10, 1);
        const skip = (page - 1) * limit;

        const filter = {
            role: "mechanic",
            isVerified: false
        };

        const [pendingRequests, totalPendingRequests] = await Promise.all([
            userModel.find(filter)
                .select("-password")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            userModel.countDocuments(filter)
        ]);

        return res.status(200).json({
            success: true,
            message: "Pending mechanic requests fetched successfully",
            data: pendingRequests,
            pagination: {
                totalItems: totalPendingRequests,
                totalPages: Math.ceil(totalPendingRequests / limit),
                currentPage: page,
                limit
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

async function toggleAdminVerificationController(req, res) {
    try {
        const mechanicId = req.params.mechanicId || req.body.mechanicId || req.query.mechanicId;

        if (!mechanicId) {
            return res.status(400).json({
                success: false,
                message: "mechanicId is required"
            });
        }

        const mechanic = await userModel.findOne({
            _id: mechanicId,
            role: "mechanic"
        });

        if (!mechanic) {
            return res.status(404).json({
                success: false,
                message: "Mechanic not found"
            });
        }

        const updatedMechanic = await userModel.findByIdAndUpdate(
            mechanicId,
            { isVerified: !mechanic.isVerified },
            { new: true }
        ).select("-password");

        return res.status(200).json({
            success: true,
            message: "Mechanic verification status updated successfully",
            userInfo: updatedMechanic
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
    getAllMechanicsController,
    getPendingMechanicRequestsController,
    toggleAdminVerificationController
};