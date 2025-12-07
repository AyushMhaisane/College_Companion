import express from 'express';
import User from '../models/User.js';
import { verifyFirebaseToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/profile/setup
 * Create initial user profile after Firebase registration
 * Called during user onboarding
 */
router.post('/setup', verifyFirebaseToken, async (req, res) => {
  try {
    const { uid, email } = req.user;
    const { name, fullName, phone, department, year, collegeName, degree, age } = req.body;

    console.log('📝 Profile setup request for UID:', uid);
    console.log('📝 Request data:', { name, fullName, email, phone, department, year, collegeName, degree, age });

    // Check if user already exists
    let user = await User.findOne({ uid });
    
    if (user) {
      console.log('✅ User already exists, updating profile...');
      // Update existing profile
      user.profile.fullName = fullName || name || user.profile.fullName;
      if (email) user.profile.email = email;
      if (phone) user.profile.phone = phone;
      if (department) user.profile.department = department;
      if (year) user.profile.year = year;
      if (collegeName) user.profile.collegeName = collegeName;
      if (degree) user.profile.course = degree;
      if (age) user.profile.age = age;
      user.profile.updatedAt = new Date();
      
      await user.save();
      
      return res.json({
        success: true,
        message: 'Profile updated successfully',
        profile: user.profile,
        isNewUser: false
      });
    }

    // Create new user profile
    console.log('🆕 Creating new user profile...');
    user = new User({
      uid,
      profile: {
        fullName: fullName || name || '',
        email: email || '',
        phone: phone || '',
        department: department || '',
        year: year || '',
        collegeName: collegeName || '',
        course: degree || '',
        age: age || null,
        photoURL: '',
        semester: '',
        updatedAt: new Date()
      }
    });

    await user.save();
    console.log('✅ User profile created successfully:', uid);

    res.json({
      success: true,
      message: 'Profile created successfully',
      profile: user.profile,
      isNewUser: true
    });

  } catch (error) {
    console.error('❌ Profile setup error:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      code: error.code
    });
    
    // MongoDB duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: 'Profile already exists',
        message: 'A profile with this UID already exists in the database',
        details: error.message
      });
    }
    
    // MongoDB validation error
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Invalid profile data provided',
        details: Object.keys(error.errors).map(key => ({
          field: key,
          message: error.errors[key].message
        }))
      });
    }
    
    // Generic error
    res.status(500).json({
      success: false,
      error: 'Failed to create profile',
      message: error.message,
      details: 'Check server logs for more information'
    });
  }
});

/**
 * GET /api/profile
 * Get current user's profile
 */
router.get('/', verifyFirebaseToken, async (req, res) => {
  try {
    const { uid } = req.user;

    let user = await User.findOne({ uid });

    // Auto-create user if doesn't exist
    if (!user) {
      user = new User({
        uid,
        profile: {
          email: req.user.email,
          fullName: '',
          photoURL: '',
          course: '',
          semester: ''
        }
      });
      await user.save();
    }

    res.json({
      success: true,
      profile: user.profile
    });
  } catch (error) {
    console.error('❌ Get profile error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile',
      message: error.message
    });
  }
});

/**
 * PUT /api/profile/update
 * Update current user's profile
 */
router.put('/update', verifyFirebaseToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { fullName, photoURL, course, semester } = req.body;

    let user = await User.findOne({ uid });

    // Auto-create user if doesn't exist
    if (!user) {
      user = new User({
        uid,
        profile: {
          email: req.user.email,
          fullName: fullName || '',
          photoURL: photoURL || '',
          course: course || '',
          semester: semester || ''
        }
      });
    } else {
      // Update profile fields
      if (fullName !== undefined) user.profile.fullName = fullName;
      if (photoURL !== undefined) user.profile.photoURL = photoURL;
      if (course !== undefined) user.profile.course = course;
      if (semester !== undefined) user.profile.semester = semester;
      user.profile.updatedAt = new Date();
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      profile: user.profile
    });
  } catch (error) {
    console.error('❌ Update profile error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
      message: error.message
    });
  }
});

/**
 * GET /api/profile/full
 * Get full user data including all sections
 */
router.get('/full', verifyFirebaseToken, async (req, res) => {
  try {
    const { uid } = req.user;

    let user = await User.findOne({ uid });

    // Auto-create user if doesn't exist
    if (!user) {
      user = new User({
        uid,
        profile: {
          email: req.user.email
        }
      });
      await user.save();
    }

    res.json({
      success: true,
      user: {
        profile: user.profile,
        survivalKit: user.survivalKit,
        notesRepository: user.notesRepository,
        attendanceAdvisor: user.attendanceAdvisor,
        questionGenerator: user.questionGenerator
      }
    });
  } catch (error) {
    console.error('❌ Get full user data error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user data',
      message: error.message
    });
  }
});

export default router;
