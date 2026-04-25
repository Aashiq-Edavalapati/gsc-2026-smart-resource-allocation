import {
  syncUserService,
  getMeService,
  updateMeService,
  getUserByIdService,
  upsertVolunteerProfileService,
  registerDeviceTokenService,
  getTrustScoreHistoryService,
  deleteMyAccountService
} from "../services/user.service.js";

// POST /users/sync
export const syncUser = async (req, res) => {
  try {
    const token = req.headers.authorization?.split("Bearer ")[1];

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const result = await syncUserService(token);

    res.status(200).json(result);
  } catch (error) {
    console.error("Sync error:", error);

    if (error.code === "P2002") {
      return res.status(409).json({
        error: "Email already registered with a different provider."
      });
    }

    res.status(500).json({ error: "Sync failed" });
  }
};

// GET /users/me
export const getMe = async (req, res) => {
  try {
    const user = await getMeService(req.user.id);
    res.json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
};

// PUT /users/me
export const updateMe = async (req, res) => {
  try {
    const updated = await updateMeService(req.user.id, req.body);

    res.json({
      message: "Profile updated",
      user: updated
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update user" });
  }
};

// GET /users/:id
export const getUserById = async (req, res) => {
  try {
    const user = await getUserByIdService(req.params.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
};


// POST /users/volunteer-profile
export const upsertVolunteerProfile = async (req, res) => {
  try {
    const profile = await upsertVolunteerProfileService(
      req.user.id,
      req.body
    );

    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST /users/fcm-token
export const registerDeviceToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: "Token is required"
      });
    }

    const deviceToken = await registerDeviceTokenService(
      req.user.id,
      token
    );

    res.status(200).json({ success: true, data: deviceToken });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /users/trust-score/history
export const getTrustScoreHistory = async (req, res) => {
  try {
    const history = await getTrustScoreHistoryService(req.user.id);

    res.status(200).json({ success: true, data: history });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// DELETE /users/me
export const deleteMyAccount = async (req, res) => {
  try {
    await deleteMyAccountService(req.user.id);

    res.status(200).json({
      success: true,
      message: "Account scheduled for deletion"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};