const userModel = require('../models/userModel');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinaryUpload');

async function renderProfileSettings(req, res) {
  const user = await userModel.findById(req.session.user.id);
  if (!user) {
    req.session.error = 'User not found.';
    return res.redirect('/profile');
  }
  
  res.render('settings/profile', {
    title: 'Profile Settings',
    user,
    activeNav: 'settings',
  });
}

async function updateProfileSettings(req, res) {
  const userId = req.session.user.id;
  const { displayName, bio, website } = req.body;
  
  // Basic validation
  const cleanDisplayName = (displayName || '').trim().slice(0, 50) || null;
  const cleanBio = (bio || '').trim().slice(0, 500) || null;
  const cleanWebsite = (website || '').trim().slice(0, 200) || null;
  
  // Validate website URL format if provided
  if (cleanWebsite && !cleanWebsite.match(/^https?:\/\/.+/)) {
    req.session.error = 'Website must be a valid URL starting with http:// or https://';
    return res.redirect('/settings/profile');
  }
  
  let avatarPath = null;
  
  // Handle avatar upload to Cloudinary
  if (req.file) {
    const avatarFile = req.file;
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    if (!allowedTypes.includes(avatarFile.mimetype)) {
      req.session.error = 'Avatar must be a JPG, PNG, or WebP image.';
      return res.redirect('/settings/profile');
    }
    
    // Check file size (max 2MB)
    if (avatarFile.size > 2 * 1024 * 1024) {
      req.session.error = 'Avatar file size must be less than 2MB.';
      return res.redirect('/settings/profile');
    }
    
    try {
      // Get current user to check for existing avatar
      const currentUser = await userModel.findById(userId);
      if (currentUser && currentUser.avatar_path) {
        // Delete old avatar from Cloudinary if it's a Cloudinary URL
        if (currentUser.avatar_path.includes('cloudinary.com')) {
          await deleteFromCloudinary(currentUser.avatar_path, 'image');
        }
      }
      
      // Upload new avatar to Cloudinary
      const uploadResult = await uploadToCloudinary(
        avatarFile.buffer,
        'avatars',
        'image'
      );
      avatarPath = uploadResult.url;
    } catch (error) {
      console.error('Error uploading avatar to Cloudinary:', error);
      req.session.error = 'Failed to upload avatar. Please try again.';
      return res.redirect('/settings/profile');
    }
  }
  
  // Update profile
  await userModel.updateProfile(userId, {
    displayName: cleanDisplayName,
    bio: cleanBio,
    website: cleanWebsite,
    avatarPath: avatarPath || undefined, // Only update if new file uploaded
  });
  
  // Update session user info
  const updatedUser = await userModel.findById(userId);
  req.session.user = {
    id: updatedUser.id,
    fullName: updatedUser.full_name,
    email: updatedUser.email,
    username: updatedUser.username,
    isAdmin: !!updatedUser.is_admin,
  };
  
  req.session.success = 'Profile updated successfully!';
  return res.redirect('/settings/profile');
}

module.exports = {
  renderProfileSettings,
  updateProfileSettings,
};

