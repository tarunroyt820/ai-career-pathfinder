const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

exports.signup = async (req, res) => {
    try {
        const { fullName, email, password } = req.body;

        // Mock hashing
        const hashedPassword = await bcrypt.hash(password, 10);

        // Mock user creation - logic only
        console.log(`Mock: User ${fullName} created with email ${email}`);

        // Generate mock token
        const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(201).json({
            message: "User created successfully (Mock)",
            token,
            user: { fullName, email }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Mock validation
        console.log(`Mock: Login attempt for ${email}`);

        // Generate mock token
        const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({
            message: "Login successful (Mock)",
            token,
            user: { fullName: "John Doe", email: email }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
