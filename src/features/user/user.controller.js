import UserRepository from './user.repository.js';
import jwt from 'jsonwebtoken';
import { ApplicationError } from '../../error-handler/applicationError.js';

export default class UserController {

    constructor() {
        this.userRepository = new UserRepository();
    }

    async signUp(req, res) {
        try {
            const { name, email, password, type } = req.body;

            // Validation
            if (!name || !email || !password) {
                return res.status(400).send("Name, email, and password are required");
            }

            // Restrict admin registration - only Customer and Seller allowed
            if (type && type === 'Admin') {
                return res.status(403).send("Admin registration not allowed through API. Contact system administrator.");
            }

            // Only allow Customer or Seller registration
            const allowedTypes = ['Customer', 'Seller'];
            const userType = type && allowedTypes.includes(type) ? type : 'Customer';

            const userData = { name, email, password, type: userType };
            const user = await this.userRepository.signUp(userData);
            
            res.status(201).send({
                success: true,
                message: "User registered successfully",
                user
            });

        } catch (err) {
            if (err instanceof ApplicationError) {
                return res.status(err.code).send(err.message);
            }
            console.log(err);
            res.status(500).send("Something went wrong");
        }
    }

    async signIn(req, res) {
        try {
            const { email, password } = req.body;

            // Validation
            if (!email || !password) {
                return res.status(400).send("Email and password are required");
            }

            const user = await this.userRepository.signIn(email, password);

            // Create JWT token
            const token = jwt.sign(
                { 
                    userID: user._id, 
                    email: user.email,
                    type: user.type  // Include user type in token
                },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );

            res.status(200).send({
                success: true,
                message: "Login successful",
                token,
                user
            });

        } catch (err) {
            if (err instanceof ApplicationError) {
                return res.status(err.code).send(err.message);
            }
            console.log(err);
            res.status(500).send("Something went wrong");
        }
    }

    async getAllUsers(req, res) {
        try {
            // Check if user is admin
            const currentUser = await this.userRepository.findById(req.userID);
            if (currentUser.type !== 'Admin') {
                return res.status(403).send("Access denied. Admin only.");
            }

            const users = await this.userRepository.getAllUsers();
            res.status(200).send({
                success: true,
                users
            });
        } catch (err) {
            console.log(err);
            res.status(500).send("Something went wrong");
        }
    }

    async getUserById(req, res) {
        try {
            const { id } = req.params;
            const currentUser = await this.userRepository.findById(req.userID);

            // Users can view their own profile or admins can view any profile
            if (req.userID !== id && currentUser.type !== 'Admin') {
                return res.status(403).send("Access denied. You can only view your own profile.");
            }

            const user = await this.userRepository.findById(id);
            
            if (!user) {
                return res.status(404).send("User not found");
            }

            res.status(200).send({
                success: true,
                user
            });
        } catch (err) {
            console.log(err);
            res.status(500).send("Something went wrong");
        }
    }

    async updateUser(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            // Prevent admin role assignment through API
            if (updateData.type === 'Admin') {
                return res.status(403).send("Cannot assign admin role through API. Contact system administrator.");
            }

            // Get the current user to check their role
            const currentUser = await this.userRepository.findById(req.userID);
            
            // Users can only update their own profile unless they are admin
            if (req.userID !== id && currentUser.type !== 'Admin') {
                return res.status(403).send("You can only update your own profile");
            }

            const updatedUser = await this.userRepository.updateUser(id, updateData);
            
            res.status(200).send({
                success: true,
                message: "User updated successfully",
                user: updatedUser
            });

        } catch (err) {
            if (err instanceof ApplicationError) {
                return res.status(err.code).send(err.message);
            }
            console.log(err);
            res.status(500).send("Something went wrong");
        }
    }

    async deleteUser(req, res) {
        try {
            const { id } = req.params;

            // Get the current user to check their role
            const currentUser = await this.userRepository.findById(req.userID);

            // Users can only delete their own profile unless they are admin
            if (req.userID !== id && currentUser.type !== 'Admin') {
                return res.status(403).send("You can only delete your own profile");
            }

            // Prevent admin from deleting themselves
            if (req.userID === id && currentUser.type === 'Admin') {
                return res.status(403).send("Admin cannot delete their own account");
            }

            await this.userRepository.deleteUser(id);
            
            res.status(200).send({
                success: true,
                message: "User deleted successfully"
            });

        } catch (err) {
            if (err instanceof ApplicationError) {
                return res.status(err.code).send(err.message);
            }
            console.log(err);
            res.status(500).send("Something went wrong");
        }
    }

    async getProfile(req, res) {
        try {
            const user = await this.userRepository.findById(req.userID);
            
            if (!user) {
                return res.status(404).send("User not found");
            }

            res.status(200).send({
                success: true,
                user
            });
        } catch (err) {
            console.log(err);
            res.status(500).send("Something went wrong");
        }
    }
}