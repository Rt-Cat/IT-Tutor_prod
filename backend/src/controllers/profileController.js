const profileRepository = require('../repositories/profileRepository');

const profileController = {
  // Get all profiles for current user
  async getProfiles(req, res, next) {
    try {
      const profiles = await profileRepository.findByUserId(req.user.id);
      res.json(profiles);
    } catch (error) {
      next(error);
    }
  },

  // Create new profile
  async createProfile(req, res, next) {
    try {
      const { profileName, thinkingMode, isDefault } = req.body;

      if (!profileName) {
        return res.status(400).json({ error: 'Profile name is required' });
      }

      const profileId = await profileRepository.create({
        userId: req.user.id,
        profileName,
        thinkingMode: thinkingMode || 'balanced',
        isDefault: isDefault || false
      });

      const profile = await profileRepository.findById(profileId);
      res.status(201).json(profile);
    } catch (error) {
      next(error);
    }
  },

  // Get profile by ID
  async getProfileById(req, res, next) {
    try {
      const profile = await profileRepository.findById(req.params.id);

      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      // Check ownership
      if (profile.USER_ID !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      res.json(profile);
    } catch (error) {
      next(error);
    }
  },

  // Update profile
  async updateProfile(req, res, next) {
    try {
      const profile = await profileRepository.findById(req.params.id);

      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      if (profile.USER_ID !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const { profileName, thinkingMode, isDefault } = req.body;

      // If setting as default, handle that separately
      if (isDefault) {
        await profileRepository.setDefault(req.user.id, req.params.id);
      }

      const success = await profileRepository.update(req.params.id, {
        profileName,
        thinkingMode
      });

      const updatedProfile = await profileRepository.findById(req.params.id);
      res.json(updatedProfile);
    } catch (error) {
      next(error);
    }
  },

  // Delete profile
  async deleteProfile(req, res, next) {
    try {
      const profile = await profileRepository.findById(req.params.id);

      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      if (profile.USER_ID !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      await profileRepository.delete(req.params.id);
      res.json({ message: 'Profile deleted successfully' });
    } catch (error) {
      next(error);
    }
  },

  // Set profile as default
  async setDefault(req, res, next) {
    try {
      const profile = await profileRepository.findById(req.params.id);

      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      if (profile.USER_ID !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      await profileRepository.setDefault(req.user.id, req.params.id);

      const updatedProfile = await profileRepository.findById(req.params.id);
      res.json(updatedProfile);
    } catch (error) {
      next(error);
    }
  }
};

module.exports = profileController;