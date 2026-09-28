const mongoose = require("mongoose");
const { Schema } = mongoose;
/**
 * CÔNG DỤNG: Các giai đoạn trong pipeline (Kanban columns).
 * probability: xác suất chốt deal. Tự động cập nhật khi move sang stage này.
 */
const crmPipelineStageSchema = new Schema({
  pipeline:    { type: Schema.Types.ObjectId, ref: "CrmPipeline", required: true, index: true },
  name:        { type: String, required: true },
  order:       { type: Number },
  probability: { type: Number, min: 0, max: 100, default: 10 },
  expectedDays:{ type: Number },
  color:       { type: String, default: "#3b82f6" },
  isWon:       { type: Boolean, default: false },
  isLost:      { type: Boolean, default: false },
});
module.exports = mongoose.model("CrmPipelineStage", crmPipelineStageSchema);
