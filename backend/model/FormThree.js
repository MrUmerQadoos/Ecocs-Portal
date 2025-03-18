import mongoose from "mongoose";

const formThreeSchema = new mongoose.Schema({
  // Dropdown
  mainPropertyDimensions: String, // "Internal" or "External"

  // Room/s in Roof
  roofFloorArea: String,
  roofRoomHeight: String,
  roofHeatLossPerimeter: String,
  roofPartyWallLength: String,

  // 5th Floor
  fifthFloorArea: String,
  fifthFloorHeight: String,
  fifthHeatLossPerimeter: String,
  fifthPartyWallLength: String,

  // 4th Floor
  fourthFloorArea: String,
  fourthFloorHeight: String,
  fourthHeatLossPerimeter: String,
  fourthPartyWallLength: String,

  // 3rd Floor
  thirdFloorArea: String,
  thirdFloorHeight: String,
  thirdHeatLossPerimeter: String,
  thirdPartyWallLength: String,

  // 2nd Floor
  secondFloorArea: String,
  secondFloorHeight: String,
  secondHeatLossPerimeter: String,
  secondPartyWallLength: String,

  // 1st Floor
  firstFloorArea: String,
  firstFloorHeight: String,
  firstHeatLossPerimeter: String,
  firstPartyWallLength: String,

  // Lowest Floor
  lowestFloorArea: String,
  lowestFloorHeight: String,
  lowestHeatLossPerimeter: String,
  lowestPartyWallLength: String,

  userId: String,
  processId: String,

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const FormThree = mongoose.model("FormThree", formThreeSchema);
