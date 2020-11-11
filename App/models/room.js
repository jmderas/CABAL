const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
		index: true
	},
	owner: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true
	},
	members: [{ 
		type: mongoose.Schema.Types.ObjectId, 
		ref: 'User'
	}],
	created: {
		type: Date,
		default: Date.now
	},
	public: {
		type: Boolean,
		default: false
	}
})

const Room = mongoose.model('Room', RoomSchema);

module.exports = Room;