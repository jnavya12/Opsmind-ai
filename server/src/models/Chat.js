const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'system', 'bot'],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    sources: [{
        filename: String,
        page: Number
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Chat', chatSchema);
