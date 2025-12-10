import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { getDatabase, COLLECTIONS } from './mongodb'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this'

export function generateToken(user) {
  return jwt.sign(
    { 
      userId: user._id, 
      email: user.email, 
      role: user.role,
      clientId: user.clientId 
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

export async function hashPassword(password) {
  return await bcrypt.hash(password, 12)
}

export async function comparePassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword)
}

export async function authenticateUser(email, password) {
  try {
    const db = await getDatabase()
    const usersCollection = db.collection(COLLECTIONS.USERS)
    
    // Try to find user by email (case-insensitive)
    // Allow users without status field or with status 'active'
    const user = await usersCollection.findOne({ 
      email: { $regex: new RegExp(`^${email}$`, 'i') }
    })
    
    if (!user) {
      console.log('User not found for email:', email)
      return { success: false, message: 'Invalid credentials' }
    }

    // Check if user is inactive (only if status field exists)
    if (user.status && user.status !== 'active') {
      console.log('User is not active:', user.status)
      return { success: false, message: 'Account is inactive' }
    }
    
    // Check password
    let isValidPassword = false
    
    if (!user.password) {
      console.log('User has no password field')
      return { success: false, message: 'Invalid credentials' }
    }

    // Check if password is hashed (bcrypt) or plain text
    if (user.password.startsWith('$2')) {
      isValidPassword = await comparePassword(password, user.password)
    } else {
      // Plain text comparison (not recommended for production)
      isValidPassword = password === user.password
    }
    
    if (!isValidPassword) {
      console.log('Password mismatch')
      return { success: false, message: 'Invalid credentials' }
    }
    
    // Update last login
    try {
      await usersCollection.updateOne(
        { _id: user._id },
        { $set: { last_login: new Date() } }
      )
    } catch (e) {
      // Ignore update errors
    }
    
    const token = generateToken(user)
    
    return {
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name || user.email,
        role: user.role || 'user',
        clientId: user.clientId
      },
      token
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return { success: false, message: 'Authentication failed' }
  }
}
