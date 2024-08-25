import bcrypt from "bcryptjs"
import crypto from "crypto";

import { User } from "../models/user.model.js";
import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";
import {
  sendPasswordResetEmail,
  sendResetSuccessEmail,
  sendVerificationEmail,
  sendWelcomeEmail
}
  from "../mailtrap/emails.js";
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
      user: {
        ...user._doc,
        password: undefined,
        verificationToken: undefined,
        verificationTokenExpiresAt: undefined,
      }
    })

  } catch (error) {
    return res.status(400).json({ success: false, message: error.message })
  }
}
export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: "Please enter a valid email" })
    }
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return res.status(400).json({ success: false, message: "password did not match" })
    }
    generateTokenAndSetCookie(res, user._id);
    user.lastLogin = new Date();
    await user.save();
    res.status(200).json({ success: true, message: "User logged in successfully", user: { ...user._doc, password: undefined } })
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error", error: error.message })
  }
}
export const logout = async (req, res) => {
  res.clearCookie("token")
  res.status(200).json({ success: true, message: "User logged out successfully" })
}

export const verifyEmail = async (req, res) => {
  const { code } = req.body;
  try {
    const user = await User.findOne({
      verificationToken: code,
      verificationTokenExpiresAt: { $gt: Date.now() }
    })
    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired verification code" })
    }
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiresAt = undefined;
    await user.save()
    res.status(200).json({ success: true, message: "email verified successfully", user: { ...user._doc, password: undefined } })
    await sendWelcomeEmail(user.email, user.name);
  } catch (error) {
    return res.status(400).json({ success: false, message: "server error", error })
  }
}

export const forgotPassword = async (req, res) => {
  const { email } = req.body
  if (!email) {
    return res.status(400).json({ success: false, message: "Please enter a valid email address" })
  }
  try {
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({ success: false, message: "User with this email doesn't exist" })
    }
    // generate reset password token
    const resetPasswordToken = crypto.randomBytes(20).toString("hex")
    const resetPasswordTokenExpiresAt = Date.now() + 1 * 60 * 60 * 1000; // 1 hour
    user.resetPasswordToken = resetPasswordToken
    user.resetPasswordTokenExpiresAt = resetPasswordTokenExpiresAt
    await user.save()

    // send email
    await sendPasswordResetEmail(user.email, `${process.env.CLIENT_URL}/reset-password/${resetPasswordToken}`)
    return res.status(200).json({ success: true, message: "Password reset link sent to you email" })
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message })
  }
}

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ success: false, message: "Please enter a password" })
    }
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordTokenExpiresAt: { $gt: Date.now() }
    })
    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired reset token" })
    }

    // update password
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetPasswordTokenExpiresAt = undefined
    user.resetPasswordToken = undefined
    await user.save();
    sendResetSuccessEmail(user.email);
    res.status(200).json({ success: true, message: "Password reset successfully" })
  } catch (error) {
    res.status(400).json({ success: false, message: error.message })
  }
}

export const checkAuth = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password")
    if (!user) {
      return res.status(400).json({ success: false, message: "User not found" })
    }
    return res.status(200).json({ success: true, message: "Authentication successful", user })
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message })
  }
}