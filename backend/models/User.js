const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'First and last name required']
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6,
        select: false // Don't return password by default
    },
    jobTitle: {
        type: String,
        default: ''
    },
    experienceLevel: {
        type: String,
        enum: ['beginner', 'intermediate', 'senior', ''],
        default: ''
    },
    careerGoal: {
        type: String,
        default: ''
    },
    education: {
        college: { type: String, default: '' },
        degree: { type: String, default: '' },
        graduationYear: { type: String, default: '' }
    },
    skills: {
        type: [String],
        default: []
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', UserSchema);
