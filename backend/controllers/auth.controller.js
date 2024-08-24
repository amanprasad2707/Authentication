import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs"
import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";
import { sendVerificationEmail } from "../mailtrap/emails.js";
export const signup = async (req, res) => {
  
  const { name, email, password } = req.body;
  try {
    if (!name || !email || !password) {
      throw new Error("All fields are required")
    }
    const userAlreadyExists = await User.findOne({ email })
    if (userAlreadyExists) {
      return res.status(400).json({ success: false, message: "User already exists" })
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = Math.floor(Math.random() * 900000).toString();

    const user = new User({
      email,
      password: hashedPassword,
      name,
      verificationToken,
      verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000  // 24 hours
    })

    await user.save()

    // jwt
    generateTokenAndSetCookie(res, user._id);
    sendVerificationEmail(user.email, verificationToken)
    return res.status(201).json({
      success: true,
      message: "User created successfully",
      user
    })

  } catch (error) {
    return res.status(400).json({ success: false, message: error.message })
  }
}
export const login = async (req, res) => {

}
export const logout = async (req, res) => {

}
