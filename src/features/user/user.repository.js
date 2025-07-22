import mongoose from 'mongoose';
import { userSchema } from './user.schema.js';
import { ApplicationError } from '../../error-handler/applicationError.js';
import bcrypt from 'bcrypt';

// Create Mongoose model from schema
const UserModel = mongoose.model('User', userSchema);

export default class UserRepository {

    async signUp(userData) {
        try {
            // Prevent admin registration through repository
            if (userData.type === 'Admin') {
                throw new ApplicationError("Admin registration not allowed", 403);
            }

            // Check if user already exists
            const existingUser = await UserModel.findOne({ email: userData.email });
            if (existingUser) {
                throw new ApplicationError("User already exists", 400);
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(userData.password, 12);
            userData.password = hashedPassword;

            // Ensure only Customer or Seller types are allowed
            if (!userData.type || !['Customer', 'Seller'].includes(userData.type)) {
                userData.type = 'Customer';
            }

            // Create new user
            const newUser = new UserModel(userData);
            const savedUser = await newUser.save();
            
            // Remove password from response
            const { password, ...userResponse } = savedUser.toObject();
            return userResponse;

        } catch (error) {
            if (error instanceof ApplicationError) {
                throw error;
            }
            console.log(error);
            throw new ApplicationError("Something went wrong with database", 500);
        }
    }

    async signIn(email, password) {
        try {
            // Find user by email
            const user = await UserModel.findOne({ email });
            if (!user) {
                throw new ApplicationError("User not found", 404);
            }

            // Check password
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                throw new ApplicationError("Incorrect Credentials", 400);
            }

            // Remove password from response
            const { password: userPassword, ...userResponse } = user.toObject();
            return userResponse;

        } catch (error) {
            if (error instanceof ApplicationError) {
                throw error;
            }
            console.log(error);
            throw new ApplicationError("Something went wrong with database", 500);
        }
    }

    async findById(id) {
        try {
            const user = await UserModel.findById(id).select('-password');
            return user;
        } catch (error) {
            console.log(error);
            throw new ApplicationError("Something went wrong with database", 500);
        }
    }

    async getAllUsers() {
        try {
            const users = await UserModel.find({}).select('-password');
            return users;
        } catch (error) {
            console.log(error);
            throw new ApplicationError("Something went wrong with database", 500);
        }
    }

    async updateUser(id, updateData) {
        try {
            // Prevent admin role assignment through repository
            if (updateData.type === 'Admin') {
                throw new ApplicationError("Cannot assign admin role", 403);
            }

            // If password is being updated, hash it
            if (updateData.password) {
                updateData.password = await bcrypt.hash(updateData.password, 12);
            }

            // Only allow Customer or Seller types
            if (updateData.type && !['Customer', 'Seller'].includes(updateData.type)) {
                updateData.type = 'Customer';
            }

            const updatedUser = await UserModel.findByIdAndUpdate(
                id, 
                updateData, 
                { new: true, runValidators: true }
            ).select('-password');

            if (!updatedUser) {
                throw new ApplicationError("User not found", 404);
            }

            return updatedUser;
        } catch (error) {
            if (error instanceof ApplicationError) {
                throw error;
            }
            console.log(error);
            throw new ApplicationError("Something went wrong with database", 500);
        }
    }

    async deleteUser(id) {
        try {
            const deletedUser = await UserModel.findByIdAndDelete(id);
            if (!deletedUser) {
                throw new ApplicationError("User not found", 404);
            }
            return { message: "User deleted successfully" };
        } catch (error) {
            if (error instanceof ApplicationError) {
                throw error;
            }
            console.log(error);
            throw new ApplicationError("Something went wrong with database", 500);
        }
    }
}