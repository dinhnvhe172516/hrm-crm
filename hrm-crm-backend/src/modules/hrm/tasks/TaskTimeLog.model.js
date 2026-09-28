const mongoose = require("mongoose");
const { Schema } = mongoose;
/**
 * CÔNG DỤNG: Ghi log thời gian làm việc trên từng task.
 * Dùng cho: tính hiệu suất | báo cáo thời gian | tính chi phí nhân công
 */
const taskTimeLogSchema = new Schema({
  taskId:      { type: Schema.Types.ObjectId, ref: "Task", required: true, index: true },
  userId:      { type: Schema.Types.ObjectId, ref: "User", required: true },
  date:        { type: Date, required: true },
  hours:       { type: Number, required: true },
  description: { type: String },
}, { timestamps: true });
module.exports = mongoose.model("TaskTimeLog", taskTimeLogSchema);
