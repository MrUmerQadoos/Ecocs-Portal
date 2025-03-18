import mongoose from "mongoose";

const formTwoSchema = new mongoose.Schema({
  propertyTenure: String,
  transactionType: String,
  propertyType: String,
  numberOfStoreys: String,
  numberOfHabitableRooms: String,
  numberOfHeatedHabitableRooms: String,
  mainPropertyDateBand: String,
  mainPropertyRoomInRoofDateBand: String,
  elevationPhotos: String, // dropdown selection value
  imageUrl: [String],      // Array of uploaded image paths
  userId: String,
  processId: String,
  createdAt: { type: Date, default: Date.now },
});

export const FormTwo = mongoose.model("FormTwo", formTwoSchema);
