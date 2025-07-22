import UserRepository from '../features/user/user.repository.js';

const adminAuth = async (req, res, next) => {
    try {
        const userRepository = new UserRepository();
        const user = await userRepository.findById(req.userID);
        
        if (!user || user.type !== 'Admin') {
            return res.status(403).send("Access denied. Admin privileges required.");
        }
        
        next();
    } catch (err) {
        console.log(err);
        return res.status(500).send("Something went wrong");
    }
};

export default adminAuth;