require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/user.model');

async function bootstrap() {
  const email = process.argv[2] || 'seller@greencards.com';
  const password = process.argv[3] || 'Seller@123';
  const userName = process.argv[4] || 'greenseller';
  const fullName = process.argv[5] || 'GreenCard Official Seller';
  const role = process.argv[6] || 'seller';

  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI is not set in .env');
    process.exit(1);
  }

  try {
    console.log('⏳ Connecting to MongoDB Atlas (user_db)...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected.');

    const existing = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { userName: userName.toLowerCase() }]
    });

    if (existing) {
      console.log(`⚠️ User ${existing.userName} (${existing.email}) already exists (Role: ${existing.role}).`);
      console.log(`Updating role to "${role}" and setting password...`);
      existing.password = password;
      existing.role = role;
      existing.isEmailVerified = true;
      existing.isActive = true;
      await existing.save();
      console.log(`🎉 Successfully updated ${role} account!`);
    } else {
      const newUser = new User({
        userName: userName.toLowerCase(),
        email: email.toLowerCase(),
        fullName,
        password,
        role,
        phone: '9876543210',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
        isEmailVerified: true,
        isActive: true,
      });
      await newUser.save();
      console.log(`🎉 Successfully created new ${role} account!`);
    }

    console.log('----------------------------------------------------');
    console.log(`👤 Role:     ${role}`);
    console.log(`📧 Email:    ${email}`);
    console.log(`📛 Username: ${userName}`);
    console.log(`🔑 Password: ${password}`);
    console.log('----------------------------------------------------');
    if (role === 'seller') {
      console.log('You can now log in to the Seller Portal at:');
      console.log('👉 https://akash520820.github.io/greencards-seller-portal/seller/auth');
    } else {
      console.log('You can now log in to the User Portal at:');
      console.log('👉 https://akash520820.github.io/greencards-user-portal/');
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating user/seller account:', err.message);
    process.exit(1);
  }
}

bootstrap();
