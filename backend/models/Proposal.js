const mongoose = require('mongoose');
const { PROPOSAL_STATUS } = require('@quicklyway/shared');

const proposalSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    freelancerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    bidAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    coverLetter: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(PROPOSAL_STATUS),
      default: PROPOSAL_STATUS.PENDING,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Proposal', proposalSchema);

