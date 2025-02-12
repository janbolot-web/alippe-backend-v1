import mongoose from "mongoose";

const aiResponsesSchema = new mongoose.Schema(
  {
    choices: [
      {
        content_filter_results: {
          type: Map,
          of: mongoose.Schema.Types.Mixed,
        },
        finish_reason: String,
        index: Number,
        message: {
          type: Map,
          of: mongoose.Schema.Types.Mixed,
        },
      },
    ],
    created: Number,
    id: String,
    model: String,
    prompt_filter_results: [
      {
        content_filter_results: {
          type: Map,
          of: mongoose.Schema.Types.Mixed,
        },
        prompt_index: Number,
      },
    ],
    system_fingerprint: String,
    usage: {
      completion_tokens: Number,
      completion_tokens_details: {
        accepted_prediction_tokens: Number,
        audio_tokens: Number,
        reasoning_tokens: Number,
        rejected_prediction_tokens: Number,
      },
      prompt_tokens: Number,
      prompt_tokens_details: {
        audio_tokens: Number,
        cached_tokens: Number,
      },
      total_tokens: Number,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("AiResponses", aiResponsesSchema);
