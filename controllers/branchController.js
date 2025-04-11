import Branch from "../models/branch.js";

export const GetAllBranchs = async (req, res) => {
  const { pageNum = 1, pageSize = 10 } = req.query;

  const page = parseInt(pageNum);
  const size = parseInt(pageSize);

  if (isNaN(page) || isNaN(size)) {
    return res.status(400).json({ message: "Invalid pagination parameters" });
  }

  try {
    const branches = await Branch.find()
      .populate([
        { path: "staffs" },
        {
          path: "orders",
          populate: [{ path: "customer" }, { path: "products" }],
        },
      ])
      .skip((page - 1) * size)
      .limit(size);

    const total = await Branch.countDocuments();
    const totalPages = Math.ceil(total / size);

    return res.status(200).json({ total, totalPages, branches });
  } catch (error) {
    return res.status(500).json({
      message: "Server error while getting branches",
      error: error.message,
    });
  }
};

export const GetOneBranch = async (req, res) => {
  const { id } = req.params;
  try {
    const branch = await Branch.findById(id).populate([
      { path: "staffs" },
      {
        path: "orders",
        populate: [{ path: "customer" }, { path: "products" }],
      },
    ]);
    if (!branch || branch.length <= 0) {
      return res.status(409).json({ message: "branch not found" });
    }
    return res.status(200).json(branch);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error while getting branch" });
  }
};

export const CreateNewBranch = async (req, res) => {
  try {
    const { address, worktime } = req.body;
    if (!address || !worktime) {
      return res.status(409).json({ message: "Fields should be filled" });
    }
    const newBranch = new Branch(req.body);
    await newBranch.save();
    return res
      .status(201)
      .json({ message: "New Branch has been created successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error while creating branch" });
  }
};

export const UpdateBranch = async (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;
  try {
    const updatedBranch = await Branch.findByIdAndUpdate(id, updatedData, {
      new: true,
    });

    if (!updatedBranch) {
      return res.status(404).json({ message: "Branch not found" });
    }

    return res.status(200).json({
      message: "Branch updated successfully",
      data: updatedBranch,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error while updating branch" });
  }
};

export const DeleteBranch = async (req, res) => {
  const { id } = req.params;
  try {
    const branch = await Branch.findById(id);

    if (!branch) {
      return res.status(404).json({ message: "Branch not found" });
    }

    await branch.deleteOne();

    return res.status(200).json({ message: "Branch deleted successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error while deleting branch" });
  }
};

export const AddStaffToBranch = async (req, res) => {
  const { staff, branchId } = req.body;

  try {
    const branch = await Branch.findById(branchId);

    if (!branch) {
      return res.status(404).json({ message: "Branch not found" });
    }

    const staffExistsInOtherBranch = await Branch.findOne({
      _id: { $ne: branchId },
      staffs: { $in: [staff._id] },
    });

    if (staffExistsInOtherBranch) {
      return res.status(409).json({
        message: "The user is already assigned to another branch",
      });
    }

    const isExists = branch.staffs.some(
      (existingStaffId) => existingStaffId.toString() === staff._id
    );

    if (isExists) {
      return res
        .status(409)
        .json({ message: "The user has already been added to this branch" });
    }

    branch.staffs.push(staff._id);
    await branch.save();

    return res
      .status(200)
      .json({ message: "Staff has been added successfully" });
  } catch (error) {
    console.error("Error adding staff to branch:", error);
    return res.status(500).json({ message: "Server error while adding staff" });
  }
};

export const DeleteStaffFromBranch = async (req, res) => {
  const { staff, branchId } = req.body;
  try {
    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({ message: "Branch not found" });
    }

    const staffIndex = branch.staffs.findIndex(
      (s) => s._id.toString() === staff._id
    );
    if (staffIndex === -1) {
      return res.status(404).json({ message: "Staff not found" });
    }

    branch.staffs.splice(staffIndex, 1);

    await branch.save();
    return res
      .status(200)
      .json({ message: "Staff has been removed successfully" });
  } catch (error) {
    return res.status(500).json({
      message: "Server error while removing staff",
      error: error.message,
    });
  }
};
