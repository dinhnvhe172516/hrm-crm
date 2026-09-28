const mongoose = require("mongoose");
const { Schema } = mongoose;
/**
 * CÔNG DỤNG: Ghi lại khen thưởng nhân viên (bằng khen, quà, thưởng tiền...).
 */
const employeeRewardSchema = new Schema({
  userId:      { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  type:        { type: String, enum: ["certificate","trophy","gift","promotion","bonus_reward"] },
  title:       { type: String, required: true },
  description: { type: String },
  value:       { type: Number },
  awardDate:   { type: Date, required: true },
  issuedBy:    { type: Schema.Types.ObjectId, ref: "User" },
  imageUrl:    { type: String },
}, { timestamps: true });
module.exports = mongoose.model("EmployeeReward", employeeRewardSchema);
