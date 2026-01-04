import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';
import logger from '../config/logger.js';

const protect = asyncHandler(async (req, res, next) => {
    logger.debug("Auth middleware called");
    
    // Get token from request
    let token = req.cookies?.jwt;
    logger.debug("Token from cookies:", token ? "Present" : "None");

    if (!token && req.headers.authorization?.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
        logger.debug("Token from Authorization header:", token ? "Present" : "None");
    }

    if (!token) {
        logger.debug("No token found in request");
        res.status(401);
        throw new Error('Not authorized, please log in');
    }

    try {
        logger.debug("Verifying token...");
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Check if token is expired
        const currentTime = Math.floor(Date.now() / 1000);
        if (decoded.exp && decoded.exp < currentTime) {
            logger.debug("Token expired at:", new Date(decoded.exp * 1000).toISOString());
            logger.debug("Current time:", new Date(currentTime * 1000).toISOString());
            res.status(401);
            throw new Error('Session expired, please log in again');
        }
        
        logger.debug("Token verified, user ID:", decoded.id);
        
        // Find user by ID
        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
            logger.debug("User not found in database");
            res.status(401);
            throw new Error('User not found, please log in again');
        }
        
        logger.debug("User authenticated:", user.username);
        req.user = user;
        next();
    } catch (error) {
        logger.error("Token verification failed:", error);
        
        // Return specific error message based on the JWT error
        if (error.name === 'TokenExpiredError') {
            res.status(401);
            throw new Error('Session expired, please log in again');
        } else if (error.name === 'JsonWebTokenError') {
            res.status(401);
            throw new Error('Invalid token, please log in again');
        } else {
            res.status(401);
            throw new Error('Not authorized, please log in again');
        }
    }
});

export { protect }; 